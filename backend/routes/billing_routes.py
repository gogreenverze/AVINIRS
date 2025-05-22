from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import uuid
import json
import os
from functools import wraps

# Import utilities
from utils import token_required, read_data, write_data, paginate_results, filter_data_by_tenant, check_tenant_access

billing_bp = Blueprint('billing', __name__)

# Billing Routes
@billing_bp.route('/api/billing', methods=['GET'])
@token_required
def get_billings():
    billings = read_data('billings.json')

    # Apply tenant-based filtering
    billings = filter_data_by_tenant(billings, request.current_user)

    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)

    # Filter by patient_id if provided
    patient_id = request.args.get('patient_id')
    if patient_id:
        billings = [b for b in billings if str(b.get('patient_id')) == str(patient_id)]

    # Filter by status if provided
    status = request.args.get('status')
    if status:
        billings = [b for b in billings if b.get('status') == status]

    # Filter by date range if provided
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if start_date:
        billings = [b for b in billings if b.get('invoice_date', '') >= start_date]

    if end_date:
        billings = [b for b in billings if b.get('invoice_date', '') <= end_date]

    # Sort by created_at (newest first)
    billings = sorted(billings, key=lambda x: x.get('created_at', ''), reverse=True)

    # Add patient information
    patients = read_data('patients.json')
    for billing in billings:
        patient_id = billing.get('patient_id')
        if patient_id:
            patient = next((p for p in patients if p.get('id') == patient_id), None)
            if patient:
                billing['patient'] = {
                    'id': patient.get('id'),
                    'first_name': patient.get('first_name'),
                    'last_name': patient.get('last_name')
                }

    # Paginate results
    paginated_data = paginate_results(billings, page, per_page)

    return jsonify(paginated_data)

@billing_bp.route('/api/billing/<int:id>', methods=['GET'])
@token_required
def get_billing(id):
    billings = read_data('billings.json')
    billing = next((b for b in billings if b['id'] == id), None)

    if not billing:
        return jsonify({'message': 'Billing not found'}), 404

    # Add patient information
    patient_id = billing.get('patient_id')
    if patient_id:
        patients = read_data('patients.json')
        patient = next((p for p in patients if p.get('id') == patient_id), None)
        if patient:
            billing['patient'] = patient

    return jsonify(billing)

@billing_bp.route('/api/billing', methods=['POST'])
@token_required
def create_billing():
    data = request.get_json()

    # Validate required fields
    required_fields = ['patient_id', 'items', 'total_amount']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    billings = read_data('billings.json')

    # Generate new billing ID
    new_id = 1
    if billings:
        new_id = max(b['id'] for b in billings) + 1

    # Generate invoice_number (format: INV00001)
    invoice_number = f"INV{new_id:05d}"

    # Create new billing
    new_billing = {
        'id': new_id,
        'invoice_number': invoice_number,
        'patient_id': data['patient_id'],
        'items': data['items'],
        'subtotal': data.get('subtotal', data['total_amount']),
        'discount': data.get('discount', 0),
        'tax': data.get('tax', 0),
        'total_amount': data['total_amount'],
        'paid_amount': 0,
        'balance': data['total_amount'],
        'payment_method': data.get('payment_method', ''),
        'payment_status': 'Pending',
        'status': 'Pending',
        'invoice_date': datetime.now().isoformat().split('T')[0],
        'due_date': data.get('due_date', (datetime.now() + timedelta(days=30)).isoformat().split('T')[0]),
        'notes': data.get('notes', ''),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'tenant_id': request.current_user.get('tenant_id'),
        'created_by': request.current_user.get('id')
    }

    billings.append(new_billing)
    write_data('billings.json', billings)

    return jsonify(new_billing), 201

@billing_bp.route('/api/billing/<int:id>', methods=['PUT'])
@token_required
def update_billing(id):
    data = request.get_json()

    billings = read_data('billings.json')
    billing_index = next((i for i, b in enumerate(billings) if b['id'] == id), None)

    if billing_index is None:
        return jsonify({'message': 'Billing not found'}), 404

    # Update billing fields
    billing = billings[billing_index]

    # Update only provided fields
    for key, value in data.items():
        if key not in ['id', 'invoice_number', 'created_at', 'tenant_id', 'created_by']:
            billing[key] = value

    # Recalculate balance
    if 'paid_amount' in data:
        billing['balance'] = billing['total_amount'] - billing['paid_amount']

        # Update status based on payment
        if billing['balance'] <= 0:
            billing['status'] = 'Paid'
            billing['payment_status'] = 'Paid'
        elif billing['paid_amount'] > 0:
            billing['status'] = 'Partial'
            billing['payment_status'] = 'Partial'

    billing['updated_at'] = datetime.now().isoformat()

    # Save updated billings
    write_data('billings.json', billings)

    return jsonify(billing)

@billing_bp.route('/api/billing/<int:id>/collect', methods=['POST'])
@token_required
def collect_payment(id):
    data = request.get_json()

    # Validate required fields
    required_fields = ['amount', 'payment_method']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    billings = read_data('billings.json')
    billing_index = next((i for i, b in enumerate(billings) if b['id'] == id), None)

    if billing_index is None:
        return jsonify({'message': 'Billing not found'}), 404

    # Update billing with payment
    billing = billings[billing_index]

    # Check if billing is already paid
    if billing.get('status') == 'Paid':
        return jsonify({'message': 'Invoice is already paid'}), 400

    # Check if payment amount is valid
    amount = float(data['amount'])
    if amount <= 0:
        return jsonify({'message': 'Payment amount must be greater than zero'}), 400

    if amount > billing['balance']:
        return jsonify({'message': 'Payment amount exceeds balance'}), 400

    # Update payment information
    billing['paid_amount'] = billing.get('paid_amount', 0) + amount
    billing['balance'] = billing['total_amount'] - billing['paid_amount']
    billing['payment_method'] = data['payment_method']

    # Add payment to history
    if 'payments' not in billing:
        billing['payments'] = []

    payment = {
        'amount': amount,
        'payment_method': data['payment_method'],
        'payment_date': datetime.now().isoformat(),
        'reference': data.get('reference', ''),
        'notes': data.get('notes', ''),
        'collected_by': request.current_user.get('id')
    }

    billing['payments'].append(payment)

    # Update status
    if billing['balance'] <= 0:
        billing['status'] = 'Paid'
        billing['payment_status'] = 'Paid'
    else:
        billing['status'] = 'Partial'
        billing['payment_status'] = 'Partial'

    billing['updated_at'] = datetime.now().isoformat()

    # Save updated billings
    write_data('billings.json', billings)

    return jsonify(billing)

@billing_bp.route('/api/billing/search', methods=['GET'])
@token_required
def search_billings():
    query = request.args.get('q', '')

    if not query:
        return jsonify({'message': 'Search query is required'}), 400

    billings = read_data('billings.json')

    # Search by invoice number or patient name
    results = []
    patients = read_data('patients.json')

    for billing in billings:
        # Check invoice number
        if query.lower() in billing.get('invoice_number', '').lower():
            results.append(billing)
            continue

        # Check patient name
        patient_id = billing.get('patient_id')
        if patient_id:
            patient = next((p for p in patients if p.get('id') == patient_id), None)
            if patient:
                full_name = f"{patient.get('first_name', '')} {patient.get('last_name', '')}".lower()
                if query.lower() in full_name:
                    results.append(billing)

    # Sort by created_at (newest first)
    results = sorted(results, key=lambda x: x.get('created_at', ''), reverse=True)

    # Add patient information
    for billing in results:
        patient_id = billing.get('patient_id')
        if patient_id:
            patient = next((p for p in patients if p.get('id') == patient_id), None)
            if patient:
                billing['patient'] = {
                    'id': patient.get('id'),
                    'first_name': patient.get('first_name'),
                    'last_name': patient.get('last_name')
                }

    # Paginate results
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)
    paginated_data = paginate_results(results, page, per_page)

    return jsonify(paginated_data)
