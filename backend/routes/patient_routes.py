from flask import Blueprint, jsonify, request
from datetime import datetime
import uuid
import json
import os
from functools import wraps

# Import utilities
from utils import token_required, read_data, write_data, paginate_results, filter_data_by_tenant, check_tenant_access

patient_bp = Blueprint('patient', __name__)

# Patient Routes
@patient_bp.route('/api/patients', methods=['GET'])
@token_required
def get_patients():
    patients = read_data('patients.json')

    # Apply tenant-based filtering
    patients = filter_data_by_tenant(patients, request.current_user)

    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)

    # Filter by patient_id if provided
    patient_id = request.args.get('patient_id')
    if patient_id:
        patients = [p for p in patients if str(p.get('id')) == str(patient_id)]

    # Sort by created_at (newest first)
    patients = sorted(patients, key=lambda x: x.get('created_at', ''), reverse=True)

    # Paginate results
    paginated_data = paginate_results(patients, page, per_page)

    return jsonify(paginated_data)

@patient_bp.route('/api/patients/<int:id>', methods=['GET'])
@token_required
def get_patient(id):
    patients = read_data('patients.json')
    patient = next((p for p in patients if p['id'] == id), None)

    if not patient:
        return jsonify({'message': 'Patient not found'}), 404

    # Check if user has access to this patient's tenant
    if not check_tenant_access(patient.get('tenant_id'), request.current_user):
        return jsonify({'message': 'Access denied'}), 403

    return jsonify(patient)

@patient_bp.route('/api/patients', methods=['POST'])
@token_required
def create_patient():
    data = request.get_json()

    # Validate required fields - first_name and last_name are now optional
    required_fields = ['gender', 'date_of_birth', 'phone']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    patients = read_data('patients.json')

    # Generate new patient ID
    new_id = 1
    if patients:
        new_id = max(p['id'] for p in patients) + 1

    # Ensure first_name and last_name have default values if not provided
    if 'first_name' not in data or not data['first_name']:
        data['first_name'] = 'Patient'
    if 'last_name' not in data or not data['last_name']:
        data['last_name'] = f"#{new_id}"

    # Generate patient_id (format: P00001)
    patient_id = f"P{new_id:05d}"

    # Determine tenant_id based on user role and request data
    user_role = request.current_user.get('role')
    user_tenant_id = request.current_user.get('tenant_id')

    # For admin/hub_admin roles, allow specifying tenant_id in request
    if user_role in ['admin', 'hub_admin'] and 'tenant_id' in data and data['tenant_id']:
        target_tenant_id = int(data['tenant_id'])

        # Validate that admin/hub_admin has access to this tenant
        from backend.utils import check_tenant_access
        if not check_tenant_access(target_tenant_id, request.current_user):
            return jsonify({'message': 'Access denied to specified franchise'}), 403

        tenant_id = target_tenant_id
    else:
        # For other roles or when no tenant_id specified, use user's own tenant
        tenant_id = user_tenant_id

    # Create new patient
    new_patient = {
        'id': new_id,
        'patient_id': patient_id,
        'first_name': data['first_name'],
        'last_name': data['last_name'],
        'gender': data['gender'],
        'date_of_birth': data['date_of_birth'],
        'phone': data['phone'],
        'email': data.get('email', ''),
        'address': data.get('address', ''),
        'city': data.get('city', ''),
        'state': data.get('state', 'Tamil Nadu'),
        'postal_code': data.get('postal_code', ''),
        'emergency_contact': data.get('emergency_contact', ''),
        'emergency_phone': data.get('emergency_phone', ''),
        'blood_group': data.get('blood_group', ''),
        'insurance_provider': data.get('insurance_provider', ''),
        'insurance_id': data.get('insurance_id', ''),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'tenant_id': tenant_id,
        'created_by': request.current_user.get('id')
    }

    patients.append(new_patient)
    write_data('patients.json', patients)

    return jsonify(new_patient), 201

@patient_bp.route('/api/patients/<int:id>', methods=['PUT'])
@token_required
def update_patient(id):
    data = request.get_json()

    patients = read_data('patients.json')
    patient_index = next((i for i, p in enumerate(patients) if p['id'] == id), None)

    if patient_index is None:
        return jsonify({'message': 'Patient not found'}), 404

    # Check if user has access to this patient's tenant
    patient = patients[patient_index]
    if not check_tenant_access(patient.get('tenant_id'), request.current_user):
        return jsonify({'message': 'Access denied'}), 403

    # Update only provided fields
    for key, value in data.items():
        if key not in ['id', 'patient_id', 'created_at', 'tenant_id', 'created_by']:
            patient[key] = value

    patient['updated_at'] = datetime.now().isoformat()

    # Save updated patients
    write_data('patients.json', patients)

    return jsonify(patient)

@patient_bp.route('/api/patients/<int:id>', methods=['DELETE'])
@token_required
def delete_patient(id):
    patients = read_data('patients.json')
    patient_index = next((i for i, p in enumerate(patients) if p['id'] == id), None)

    if patient_index is None:
        return jsonify({'message': 'Patient not found'}), 404

    # Check if user has access to this patient's tenant
    patient = patients[patient_index]
    if not check_tenant_access(patient.get('tenant_id'), request.current_user):
        return jsonify({'message': 'Access denied'}), 403

    # Check if patient has samples
    samples = read_data('samples.json')
    patient_samples = [s for s in samples if s.get('patient_id') == id]

    if patient_samples:
        return jsonify({'message': 'Cannot delete patient with associated samples'}), 400

    # Delete patient
    deleted_patient = patients.pop(patient_index)
    write_data('patients.json', patients)

    return jsonify({'message': 'Patient deleted successfully'})

@patient_bp.route('/api/patients/search', methods=['GET'])
@token_required
def search_patients():
    query = request.args.get('q', '')
    branch_id = request.args.get('branch_id')  # Optional branch filter

    if not query:
        return jsonify({'message': 'Search query is required'}), 400

    patients = read_data('patients.json')

    # Apply tenant-based filtering first
    user_role = request.current_user.get('role')
    user_tenant_id = request.current_user.get('tenant_id')

    if user_role == 'admin':
        # Admin can see all patients, but filter by branch if specified
        if branch_id:
            patients = [p for p in patients if p.get('tenant_id') == int(branch_id)]
        # Otherwise, admin sees all patients
    elif user_role == 'hub_admin':
        # Hub admin can see all franchise patients and their own hub
        tenants = read_data('tenants.json')
        user_tenant = next((t for t in tenants if t.get('id') == user_tenant_id), None)
        if user_tenant and user_tenant.get('is_hub'):
            # Get all franchise tenant IDs (non-hub) plus their own hub
            franchise_tenant_ids = [t.get('id') for t in tenants if not t.get('is_hub')]
            franchise_tenant_ids.append(user_tenant_id)  # Include hub data

            if branch_id:
                # Filter by specific branch if accessible
                if int(branch_id) in franchise_tenant_ids:
                    patients = [p for p in patients if p.get('tenant_id') == int(branch_id)]
                else:
                    patients = []  # Access denied
            else:
                # Show all accessible patients
                patients = [p for p in patients if p.get('tenant_id') in franchise_tenant_ids]
        else:
            patients = []
    elif user_role == 'franchise_admin':
        # Franchise admin can only see their own franchise patients
        if branch_id and int(branch_id) != user_tenant_id:
            patients = []  # Access denied - trying to access other franchise
        else:
            patients = [p for p in patients if p.get('tenant_id') == user_tenant_id]
    else:
        # All other roles can only see their own tenant data
        if branch_id and int(branch_id) != user_tenant_id:
            patients = []  # Access denied
        else:
            patients = [p for p in patients if p.get('tenant_id') == user_tenant_id]

    # Search by name, ID, or phone
    results = []
    for patient in patients:
        # Get patient name components
        first_name = patient.get('first_name', '').lower()
        last_name = patient.get('last_name', '').lower()
        full_name = f"{first_name} {last_name}".strip()
        full_name_reverse = f"{last_name} {first_name}".strip()
        patient_id = patient.get('patient_id', '').lower()
        phone = patient.get('phone', '')

        query_lower = query.lower().strip()

        # For multi-word queries, also check if all words are present in the name
        query_words = query_lower.split()
        all_words_match = False
        if len(query_words) > 1:
            # Check if all query words are present in either first name, last name, or full name
            name_text = f"{first_name} {last_name}".lower()
            all_words_match = all(word in name_text for word in query_words)

        # Check if query matches any of the search criteria
        if (
            query_lower in first_name or
            query_lower in last_name or
            query_lower in full_name or
            query_lower in full_name_reverse or
            all_words_match or
            query_lower in patient_id or
            query in phone
        ):
            results.append(patient)

    # Sort by created_at (newest first)
    results = sorted(results, key=lambda x: x.get('created_at', ''), reverse=True)

    # Paginate results
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)
    paginated_data = paginate_results(results, page, per_page)

    return jsonify(paginated_data)
