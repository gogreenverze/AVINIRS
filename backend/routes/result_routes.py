from flask import Blueprint, jsonify, request
from datetime import datetime
import uuid
import json
import os
from functools import wraps

# Import utilities
from utils import token_required, read_data, write_data, paginate_results, filter_data_by_tenant, check_tenant_access

result_bp = Blueprint('result', __name__)

# Result Routes
@result_bp.route('/api/results', methods=['GET'])
@token_required
def get_results():
    results = read_data('results.json')

    # Apply tenant-based filtering through samples
    samples = read_data('samples.json')
    samples = filter_data_by_tenant(samples, request.current_user)
    allowed_sample_ids = [s.get('id') for s in samples]
    results = [r for r in results if r.get('sample_id') in allowed_sample_ids]

    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)

    # Filter by patient_id if provided
    patient_id = request.args.get('patient_id')
    if patient_id:
        patient_samples = [s.get('id') for s in samples if str(s.get('patient_id')) == str(patient_id)]
        results = [r for r in results if r.get('sample_id') in patient_samples]

    # Filter by sample_id if provided
    sample_id = request.args.get('sample_id')
    if sample_id:
        results = [r for r in results if str(r.get('sample_id')) == str(sample_id)]

    # Sort by created_at (newest first)
    results = sorted(results, key=lambda x: x.get('created_at', ''), reverse=True)

    # Add patient and sample information
    samples = read_data('samples.json')
    patients = read_data('patients.json')
    tests = read_data('tests.json')

    for result in results:
        # Add sample info
        sample_id = result.get('sample_id')
        if sample_id:
            sample = next((s for s in samples if s.get('id') == sample_id), None)
            if sample:
                result['sample'] = {
                    'id': sample.get('id'),
                    'sample_id': sample.get('sample_id')
                }

                # Add patient info
                patient_id = sample.get('patient_id')
                if patient_id:
                    patient = next((p for p in patients if p.get('id') == patient_id), None)
                    if patient:
                        result['patient'] = {
                            'id': patient.get('id'),
                            'first_name': patient.get('first_name'),
                            'last_name': patient.get('last_name')
                        }

        # Add test info
        test_id = result.get('test_id')
        if test_id:
            test = next((t for t in tests if t.get('id') == test_id), None)
            if test:
                result['test'] = {
                    'id': test.get('id'),
                    'test_name': test.get('test_name')
                }

    # Paginate results
    paginated_data = paginate_results(results, page, per_page)

    return jsonify(paginated_data)

@result_bp.route('/api/results/<int:id>', methods=['GET'])
@token_required
def get_result(id):
    results = read_data('results.json')
    result = next((r for r in results if r['id'] == id), None)

    if not result:
        return jsonify({'message': 'Result not found'}), 404

    # Add sample info
    sample_id = result.get('sample_id')
    if sample_id:
        samples = read_data('samples.json')
        sample = next((s for s in samples if s.get('id') == sample_id), None)
        if sample:
            result['sample'] = sample

            # Add patient info
            patient_id = sample.get('patient_id')
            if patient_id:
                patients = read_data('patients.json')
                patient = next((p for p in patients if p.get('id') == patient_id), None)
                if patient:
                    result['patient'] = patient

    # Add test info
    test_id = result.get('test_id')
    if test_id:
        tests = read_data('tests.json')
        test = next((t for t in tests if t.get('id') == test_id), None)
        if test:
            result['test'] = test

    return jsonify(result)

@result_bp.route('/api/results', methods=['POST'])
@token_required
def create_result():
    data = request.get_json()

    # Validate required fields
    required_fields = ['sample_id', 'test_id', 'value', 'unit']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    results = read_data('results.json')

    # Generate new result ID
    new_id = 1
    if results:
        new_id = max(r['id'] for r in results) + 1

    # Generate result_id (format: R00001)
    result_id = f"R{new_id:05d}"

    # Create new result
    new_result = {
        'id': new_id,
        'result_id': result_id,
        'sample_id': data['sample_id'],
        'test_id': data['test_id'],
        'value': data['value'],
        'unit': data['unit'],
        'reference_range': data.get('reference_range', ''),
        'notes': data.get('notes', ''),
        'status': 'Pending',
        'result_date': datetime.now().isoformat(),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'tenant_id': request.current_user.get('tenant_id'),
        'created_by': request.current_user.get('id')
    }

    results.append(new_result)
    write_data('results.json', results)

    return jsonify(new_result), 201

@result_bp.route('/api/results/<int:id>', methods=['PUT'])
@token_required
def update_result(id):
    data = request.get_json()

    results = read_data('results.json')
    result_index = next((i for i, r in enumerate(results) if r['id'] == id), None)

    if result_index is None:
        return jsonify({'message': 'Result not found'}), 404

    # Update result fields
    result = results[result_index]

    # Update only provided fields
    for key, value in data.items():
        if key not in ['id', 'result_id', 'created_at', 'tenant_id', 'created_by']:
            result[key] = value

    result['updated_at'] = datetime.now().isoformat()

    # Save updated results
    write_data('results.json', results)

    return jsonify(result)

@result_bp.route('/api/results/<int:id>/verify', methods=['POST'])
@token_required
def verify_result(id):
    results = read_data('results.json')
    result_index = next((i for i, r in enumerate(results) if r['id'] == id), None)

    if result_index is None:
        return jsonify({'message': 'Result not found'}), 404

    # Check if result is already verified
    result = results[result_index]
    if result.get('status') == 'Verified':
        return jsonify({'message': 'Result already verified'}), 400

    # Update result status
    result['status'] = 'Verified'
    result['verified_at'] = datetime.now().isoformat()
    result['verified_by'] = request.current_user.get('id')
    result['updated_at'] = datetime.now().isoformat()

    # Save updated results
    write_data('results.json', results)

    return jsonify(result)

@result_bp.route('/api/results/search', methods=['GET'])
@token_required
def search_results():
    query = request.args.get('q', '')

    if not query:
        return jsonify({'message': 'Search query is required'}), 400

    results = read_data('results.json')

    # Search by result ID, patient name, or sample ID
    filtered_results = []
    samples = read_data('samples.json')
    patients = read_data('patients.json')

    for result in results:
        # Check result ID
        if query.lower() in result.get('result_id', '').lower():
            filtered_results.append(result)
            continue

        # Check sample ID
        sample_id = result.get('sample_id')
        if sample_id:
            sample = next((s for s in samples if s.get('id') == sample_id), None)
            if sample and query.lower() in sample.get('sample_id', '').lower():
                filtered_results.append(result)
                continue

            # Check patient name
            patient_id = sample.get('patient_id') if sample else None
            if patient_id:
                patient = next((p for p in patients if p.get('id') == patient_id), None)
                if patient:
                    full_name = f"{patient.get('first_name', '')} {patient.get('last_name', '')}".lower()
                    if query.lower() in full_name:
                        filtered_results.append(result)

    # Sort by created_at (newest first)
    filtered_results = sorted(filtered_results, key=lambda x: x.get('created_at', ''), reverse=True)

    # Add patient and sample information
    for result in filtered_results:
        # Add sample info
        sample_id = result.get('sample_id')
        if sample_id:
            sample = next((s for s in samples if s.get('id') == sample_id), None)
            if sample:
                result['sample'] = {
                    'id': sample.get('id'),
                    'sample_id': sample.get('sample_id')
                }

                # Add patient info
                patient_id = sample.get('patient_id')
                if patient_id:
                    patient = next((p for p in patients if p.get('id') == patient_id), None)
                    if patient:
                        result['patient'] = {
                            'id': patient.get('id'),
                            'first_name': patient.get('first_name'),
                            'last_name': patient.get('last_name')
                        }

    # Paginate results
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)
    paginated_data = paginate_results(filtered_results, page, per_page)

    return jsonify(paginated_data)

# Report Routes
@result_bp.route('/api/results/reports', methods=['GET'])
@token_required
def get_reports():
    # In a real application, reports would be a separate table
    # For simplicity, we'll generate mock reports based on results

    results = read_data('results.json')

    # Group results by patient and date
    reports = []
    report_id = 1

    # Get unique patient IDs from results
    samples = read_data('samples.json')
    patient_ids = set()

    for result in results:
        sample_id = result.get('sample_id')
        if sample_id:
            sample = next((s for s in samples if s.get('id') == sample_id), None)
            if sample and sample.get('patient_id'):
                patient_ids.add(sample.get('patient_id'))

    # Create a report for each patient
    patients = read_data('patients.json')

    for patient_id in patient_ids:
        patient = next((p for p in patients if p.get('id') == patient_id), None)
        if not patient:
            continue

        # Get patient's samples
        patient_samples = [s.get('id') for s in samples if s.get('patient_id') == patient_id]

        # Get results for these samples
        patient_results = [r for r in results if r.get('sample_id') in patient_samples]

        if not patient_results:
            continue

        # Group results by date
        result_dates = set(r.get('result_date', '').split('T')[0] for r in patient_results)

        for date in result_dates:
            date_results = [r for r in patient_results if r.get('result_date', '').startswith(date)]

            if not date_results:
                continue

            # Create a report
            report = {
                'id': report_id,
                'report_number': f"RPT{report_id:05d}",
                'patient': {
                    'id': patient.get('id'),
                    'first_name': patient.get('first_name'),
                    'last_name': patient.get('last_name')
                },
                'report_date': date,
                'test_count': len(date_results),
                'status': 'Completed',
                'created_at': datetime.now().isoformat(),
                'tenant_id': request.current_user.get('tenant_id')
            }

            reports.append(report)
            report_id += 1

    # Sort by report date (newest first)
    reports = sorted(reports, key=lambda x: x.get('report_date', ''), reverse=True)

    # Apply filters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    search = request.args.get('search', '')

    if start_date:
        reports = [r for r in reports if r.get('report_date', '') >= start_date]

    if end_date:
        reports = [r for r in reports if r.get('report_date', '') <= end_date]

    if search:
        reports = [r for r in reports if
                  search.lower() in r.get('report_number', '').lower() or
                  search.lower() in f"{r.get('patient', {}).get('first_name', '')} {r.get('patient', {}).get('last_name', '')}".lower()]

    # Paginate results
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)
    paginated_data = paginate_results(reports, page, per_page)

    return jsonify(paginated_data)
