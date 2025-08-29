from flask import Blueprint, jsonify, request
from datetime import datetime
import uuid
import json
import os
from functools import wraps

# Import utilities
from utils import token_required, read_data, write_data, paginate_results, filter_data_by_tenant, check_tenant_access

sample_bp = Blueprint('sample', __name__)

# Sample Routes
@sample_bp.route('/api/samples', methods=['GET'])
@token_required
def get_samples():
    samples = read_data('samples.json')

    # Apply tenant-based filtering
    samples = filter_data_by_tenant(samples, request.current_user)

    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)

    # Filter by patient_id if provided
    patient_id = request.args.get('patient_id')
    if patient_id:
        samples = [s for s in samples if str(s.get('patient_id')) == str(patient_id)]

    # Sort by created_at (newest first)
    samples = sorted(samples, key=lambda x: x.get('created_at', ''), reverse=True)

    # Add patient information
    patients = read_data('patients.json')
    for sample in samples:
        patient_id = sample.get('patient_id')
        if patient_id:
            patient = next((p for p in patients if p.get('id') == patient_id), None)
            if patient:
                sample['patient'] = {
                    'id': patient.get('id'),
                    'first_name': patient.get('first_name'),
                    'last_name': patient.get('last_name')
                }

    # Paginate results
    paginated_data = paginate_results(samples, page, per_page)

    return jsonify(paginated_data)

@sample_bp.route('/api/samples/<int:id>', methods=['GET'])
@token_required
def get_sample(id):
    samples = read_data('samples.json')
    sample = next((s for s in samples if s['id'] == id), None)

    if not sample:
        return jsonify({'message': 'Sample not found'}), 404

    # Add patient information
    patient_id = sample.get('patient_id')
    if patient_id:
        patients = read_data('patients.json')
        patient = next((p for p in patients if p.get('id') == patient_id), None)
        if patient:
            sample['patient'] = {
                'id': patient.get('id'),
                'first_name': patient.get('first_name'),
                'last_name': patient.get('last_name')
            }

    # Add container information
    container_id = sample.get('container_id')
    if container_id:
        containers = read_data('containers.json')
        container = next((c for c in containers if c.get('id') == container_id), None)
        if container:
            sample['container'] = container

    # Add tests information
    results = read_data('results.json')
    sample_results = [r for r in results if r.get('sample_id') == id]

    if sample_results:
        tests = read_data('tests.json')
        sample['tests'] = []

        for result in sample_results:
            test_id = result.get('test_id')
            if test_id:
                test = next((t for t in tests if t.get('id') == test_id), None)
                if test:
                    sample['tests'].append({
                        'id': result.get('id'),
                        'test_id': test_id,
                        'status': result.get('status'),
                        'result': result,
                        'test_catalog': test
                    })

    return jsonify(sample)

@sample_bp.route('/api/samples', methods=['POST'])
@token_required
def create_sample():
    data = request.get_json()

    # Validate required fields
    required_fields = ['sample_type_id', 'container_id', 'collection_date']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    samples = read_data('samples.json')

    # Generate new sample ID
    new_id = 1
    if samples:
        new_id = max(s['id'] for s in samples) + 1

    # Generate sample_id (format: S00001)
    sample_id = f"S{new_id:05d}"

    # Create new sample
    new_sample = {
        'id': new_id,
        'sample_id': sample_id,
        'patient_id': data.get('patient_id'),
        'sample_type_id': data['sample_type_id'],
        'container_id': data['container_id'],
        'collection_date': data['collection_date'],
        'collection_time': data.get('collection_time'),
        'notes': data.get('notes', ''),
        'status': 'Collected',
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'tenant_id': request.current_user.get('tenant_id'),
        'collected_by': request.current_user.get('id')
    }

    # Get sample type name
    sample_types = read_data('sample_types.json')
    sample_type = next((st for st in sample_types if st.get('id') == int(data['sample_type_id'])), None)
    if sample_type:
        new_sample['sample_type'] = sample_type.get('type_name')

    samples.append(new_sample)
    write_data('samples.json', samples)

    return jsonify(new_sample), 201

@sample_bp.route('/api/samples/<int:id>', methods=['PUT'])
@token_required
def update_sample(id):
    data = request.get_json()

    samples = read_data('samples.json')
    sample_index = next((i for i, s in enumerate(samples) if s['id'] == id), None)

    if sample_index is None:
        return jsonify({'message': 'Sample not found'}), 404

    # Update sample fields
    sample = samples[sample_index]

    # Update only provided fields
    for key, value in data.items():
        if key not in ['id', 'sample_id', 'created_at', 'tenant_id', 'collected_by']:
            sample[key] = value

    sample['updated_at'] = datetime.now().isoformat()

    # Save updated samples
    write_data('samples.json', samples)

    return jsonify(sample)

@sample_bp.route('/api/samples/<int:id>', methods=['DELETE'])
@token_required
def delete_sample(id):
    samples = read_data('samples.json')
    sample_index = next((i for i, s in enumerate(samples) if s['id'] == id), None)

    if sample_index is None:
        return jsonify({'message': 'Sample not found'}), 404

    # Check if sample has results
    results = read_data('results.json')
    sample_results = [r for r in results if r.get('sample_id') == id]

    if sample_results:
        return jsonify({'message': 'Cannot delete sample with associated results'}), 400

    # Delete sample
    deleted_sample = samples.pop(sample_index)
    write_data('samples.json', samples)

    return jsonify({'message': 'Sample deleted successfully'})

@sample_bp.route('/api/samples/search', methods=['GET'])
@token_required
def search_samples():
    query = request.args.get('q', '')

    if not query:
        return jsonify({'message': 'Search query is required'}), 400

    samples = read_data('samples.json')

    # Search by sample ID or patient name
    results = []
    patients = read_data('patients.json')

    for sample in samples:
        # Check sample ID
        if query.lower() in sample.get('sample_id', '').lower():
            results.append(sample)
            continue

        # Check patient name
        patient_id = sample.get('patient_id')
        if patient_id:
            patient = next((p for p in patients if p.get('id') == patient_id), None)
            if patient:
                full_name = f"{patient.get('first_name', '')} {patient.get('last_name', '')}".lower()
                if query.lower() in full_name:
                    results.append(sample)

    # Sort by created_at (newest first)
    results = sorted(results, key=lambda x: x.get('created_at', ''), reverse=True)

    # Add patient information
    for sample in results:
        patient_id = sample.get('patient_id')
        if patient_id:
            patient = next((p for p in patients if p.get('id') == patient_id), None)
            if patient:
                sample['patient'] = {
                    'id': patient.get('id'),
                    'first_name': patient.get('first_name'),
                    'last_name': patient.get('last_name')
                }

    # Paginate results
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)
    paginated_data = paginate_results(results, page, per_page)

    return jsonify(paginated_data)

@sample_bp.route('/api/samples/types', methods=['GET'])
@token_required
def get_sample_types():
    sample_types = read_data('sample_types.json')
    return jsonify(sample_types)

@sample_bp.route('/api/samples/containers', methods=['GET'])
@token_required
def get_containers():
    containers = read_data('containers.json')
    return jsonify(containers)

# Sample Routing Routes are handled in sample_routing_routes.py

# Sample Transfer Routes
@sample_bp.route('/api/samples/transfers', methods=['GET'])
@token_required
def get_sample_transfers():
    """Get sample transfers for the current user's tenant."""
    transfers = read_data('sample_transfers.json')

    # Apply tenant-based filtering
    transfers = filter_data_by_tenant(transfers, request.current_user)

    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)

    # Sort by created_at (newest first)
    transfers = sorted(transfers, key=lambda x: x.get('created_at', ''), reverse=True)

    # Add sample and patient information
    samples = read_data('samples.json')
    patients = read_data('patients.json')
    tenants = read_data('tenants.json')

    for transfer in transfers:
        sample_id = transfer.get('sample_id')
        if sample_id:
            # Handle both string and integer sample IDs
            sample = next((s for s in samples if str(s.get('id')) == str(sample_id) or s.get('sample_id') == str(sample_id)), None)
            if sample:
                transfer['sample'] = {
                    'id': sample.get('id'),
                    'sample_id': sample.get('sample_id'),
                    'sample_type': sample.get('sample_type')
                }

                # Add patient info
                patient_id = sample.get('patient_id')
                if patient_id:
                    patient = next((p for p in patients if p.get('id') == patient_id), None)
                    if patient:
                        transfer['patient'] = {
                            'id': patient.get('id'),
                            'first_name': patient.get('first_name'),
                            'last_name': patient.get('last_name')
                        }

        # Add tenant information
        from_tenant_id = transfer.get('from_tenant_id')
        to_tenant_id = transfer.get('to_tenant_id')

        if from_tenant_id:
            # Handle both string and integer tenant IDs
            from_tenant = next((t for t in tenants if str(t.get('id')) == str(from_tenant_id)), None)
            if from_tenant:
                transfer['from_tenant'] = {
                    'id': from_tenant.get('id'),
                    'name': from_tenant.get('name'),
                    'site_code': from_tenant.get('site_code')
                }

        if to_tenant_id:
            # Handle both string and integer tenant IDs
            to_tenant = next((t for t in tenants if str(t.get('id')) == str(to_tenant_id)), None)
            if to_tenant:
                transfer['to_tenant'] = {
                    'id': to_tenant.get('id'),
                    'name': to_tenant.get('name'),
                    'site_code': to_tenant.get('site_code')
                }

    # Paginate results
    paginated_data = paginate_results(transfers, page, per_page)

    return jsonify(paginated_data)

@sample_bp.route('/api/samples/transfers', methods=['POST'])
@token_required
def create_sample_transfer():
    """Create a new sample transfer."""
    data = request.get_json()

    # Validate required fields
    required_fields = ['sample_id', 'to_tenant_id', 'reason']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    transfers = read_data('sample_transfers.json')

    # Generate new transfer ID
    new_id = 1
    if transfers:
        new_id = max(t['id'] for t in transfers) + 1

    # Create new transfer
    new_transfer = {
        'id': new_id,
        'sample_id': data['sample_id'],
        'from_tenant_id': request.current_user.get('tenant_id'),
        'to_tenant_id': data['to_tenant_id'],
        'reason': data['reason'],
        'notes': data.get('notes', ''),
        'status': 'Pending',
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': request.current_user.get('id'),
        'transferred_at': None,
        'received_at': None,
        'received_by': None
    }

    transfers.append(new_transfer)
    write_data('sample_transfers.json', transfers)

    return jsonify(new_transfer), 201

@sample_bp.route('/api/samples/transfers/<int:transfer_id>', methods=['GET'])
@token_required
def get_sample_transfer_by_id(transfer_id):
    """Get a specific sample transfer by ID."""
    transfers = read_data('sample_transfers.json')

    # Find the transfer
    transfer = next((t for t in transfers if t['id'] == transfer_id), None)
    if not transfer:
        return jsonify({'message': 'Transfer not found'}), 404

    # Check if user has access to this transfer
    user_tenant_id = request.current_user.get('tenant_id')
    if (transfer.get('from_tenant_id') != user_tenant_id and
        transfer.get('to_tenant_id') != user_tenant_id):
        return jsonify({'message': 'Access denied'}), 403

    # Add sample and tenant information
    samples = read_data('samples.json')
    tenants = read_data('tenants.json')

    # Find related sample
    sample = next((s for s in samples if str(s['id']) == str(transfer['sample_id'])), None)
    if sample:
        transfer['sample'] = sample

    # Find related tenants
    from_tenant = next((t for t in tenants if str(t['id']) == str(transfer['from_tenant_id'])), None)
    to_tenant = next((t for t in tenants if str(t['id']) == str(transfer['to_tenant_id'])), None)

    if from_tenant:
        transfer['from_tenant'] = from_tenant
    if to_tenant:
        transfer['to_tenant'] = to_tenant

    return jsonify(transfer)

@sample_bp.route('/api/samples/transfers/<int:transfer_id>/dispatch', methods=['PUT'])
@token_required
def dispatch_sample_transfer(transfer_id):
    """Dispatch a sample transfer."""
    data = request.get_json()

    transfers = read_data('sample_transfers.json')

    # Find the transfer
    transfer_index = next((i for i, t in enumerate(transfers) if t['id'] == transfer_id), None)
    if transfer_index is None:
        return jsonify({'message': 'Transfer not found'}), 404

    transfer = transfers[transfer_index]

    # Check if user has access to dispatch this transfer (must be from sender's tenant)
    user_tenant_id = request.current_user.get('tenant_id')
    if transfer.get('from_tenant_id') != user_tenant_id:
        return jsonify({'message': 'Access denied'}), 403

    # Check if transfer is in pending status
    if transfer.get('status') != 'Pending':
        return jsonify({'message': 'Transfer cannot be dispatched. Current status: ' + transfer.get('status', 'Unknown')}), 400

    # Validate required fields
    required_fields = ['dispatch_date', 'tracking_number']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    # Update transfer with dispatch information
    transfer.update({
        'status': data.get('status', 'In Transit'),
        'dispatch_date': data['dispatch_date'],
        'dispatch_time': data.get('dispatch_time'),
        'tracking_number': data['tracking_number'],
        'courier_service': data.get('courier_service', ''),
        'dispatch_notes': data.get('notes', ''),
        'transferred_at': data.get('transferred_at', datetime.now().isoformat()),
        'updated_at': datetime.now().isoformat()
    })

    transfers[transfer_index] = transfer
    write_data('sample_transfers.json', transfers)

    return jsonify(transfer)

@sample_bp.route('/api/samples/transfers/<int:id>', methods=['PUT'])
@token_required
def update_sample_transfer(id):
    """Update a sample transfer status."""
    data = request.get_json()

    transfers = read_data('sample_transfers.json')
    transfer_index = next((i for i, t in enumerate(transfers) if t['id'] == id), None)

    if transfer_index is None:
        return jsonify({'message': 'Transfer not found'}), 404

    transfer = transfers[transfer_index]

    # Update transfer fields
    if 'status' in data:
        transfer['status'] = data['status']

        if data['status'] == 'Transferred':
            transfer['transferred_at'] = datetime.now().isoformat()
        elif data['status'] == 'Received':
            transfer['received_at'] = datetime.now().isoformat()
            transfer['received_by'] = request.current_user.get('id')

    if 'notes' in data:
        transfer['notes'] = data['notes']

    transfer['updated_at'] = datetime.now().isoformat()

    # Save updated transfers
    write_data('sample_transfers.json', transfers)

    return jsonify(transfer)
