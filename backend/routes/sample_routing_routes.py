"""
Sample Routing Routes - Comprehensive routing system API
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid
from utils import read_data, write_data, token_required, filter_data_by_tenant, paginate_results
from services.workflow_engine import WorkflowEngine
from services.notification_service import NotificationService

sample_routing_bp = Blueprint('sample_routing', __name__)

@sample_routing_bp.route('/api/samples/routing', methods=['GET'])
@token_required
def get_sample_routings():
    """Get sample routings with comprehensive filtering and pagination"""
    routings = read_data('sample_routings.json')
    
    # Apply tenant-based filtering
    user_tenant_id = request.current_user.get('tenant_id')
    user_role = request.current_user.get('role')

    if user_role == 'admin':
        # Admin can see all routings
        pass
    elif user_role == 'hub_admin':
        # Hub admin can see all franchise routings
        tenants = read_data('tenants.json')
        user_tenant = next((t for t in tenants if t.get('id') == user_tenant_id), None)
        if user_tenant and user_tenant.get('is_hub'):
            # Get all franchise tenant IDs
            franchise_tenant_ids = [t.get('id') for t in tenants if not t.get('is_hub')]
            # Include hub's own routings and all franchise routings
            routings = [r for r in routings
                       if r.get('from_tenant_id') in franchise_tenant_ids or
                          r.get('to_tenant_id') in franchise_tenant_ids or
                          r.get('from_tenant_id') == user_tenant_id or
                          r.get('to_tenant_id') == user_tenant_id]
        else:
            # Not a valid hub admin, restrict to own tenant
            routings = [r for r in routings
                       if r.get('from_tenant_id') == user_tenant_id or
                          r.get('to_tenant_id') == user_tenant_id]
    else:
        # Franchise admin and other roles can only see routings involving their tenant
        routings = [r for r in routings
                   if r.get('from_tenant_id') == user_tenant_id or
                      r.get('to_tenant_id') == user_tenant_id]
    
    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)
    status_filter = request.args.get('status')
    direction = request.args.get('direction')  # 'incoming' or 'outgoing'
    search = request.args.get('search', '').lower()
    
    # Apply filters
    if status_filter:
        routings = [r for r in routings if r.get('status', '').lower() == status_filter.lower()]
    
    if direction == 'incoming':
        routings = [r for r in routings if r.get('to_tenant_id') == user_tenant_id]
    elif direction == 'outgoing':
        routings = [r for r in routings if r.get('from_tenant_id') == user_tenant_id]
    
    if search:
        routings = [r for r in routings 
                   if search in r.get('sample', {}).get('sample_id', '').lower() or
                      search in r.get('tracking_number', '').lower() or
                      search in r.get('notes', '').lower()]
    
    # Sort by created_at (newest first)
    routings = sorted(routings, key=lambda x: x.get('created_at', ''), reverse=True)
    
    # Enrich with related data
    samples = read_data('samples.json')
    patients = read_data('patients.json')
    tenants = read_data('tenants.json')
    users = read_data('users.json')
    
    for routing in routings:
        # Add sample information
        sample_id = routing.get('sample_id')
        if sample_id:
            sample = next((s for s in samples if s['id'] == sample_id), None)
            if sample:
                routing['sample'] = sample
                # Add patient information
                patient_id = sample.get('patient_id')
                if patient_id:
                    patient = next((p for p in patients if p['id'] == patient_id), None)
                    if patient:
                        routing['patient'] = patient
        
        # Add tenant information
        from_tenant_id = routing.get('from_tenant_id')
        to_tenant_id = routing.get('to_tenant_id')
        
        if from_tenant_id:
            from_tenant = next((t for t in tenants if t['id'] == from_tenant_id), None)
            if from_tenant:
                routing['from_tenant'] = from_tenant
        
        if to_tenant_id:
            to_tenant = next((t for t in tenants if t['id'] == to_tenant_id), None)
            if to_tenant:
                routing['to_tenant'] = to_tenant
        
        # Add workflow status (simplified for now)
        try:
            workflow_status = WorkflowEngine.get_workflow_status(routing['id'])
            routing['workflow'] = workflow_status
        except Exception as e:
            print(f"Warning: Workflow status failed for routing {routing['id']}: {e}")
            routing['workflow'] = {'status': 'unknown', 'current_stage': routing.get('status', 'unknown')}
        
        # Add user information
        created_by = routing.get('created_by')
        if created_by:
            creator = next((u for u in users if u['id'] == created_by), None)
            if creator:
                routing['created_by_user'] = {
                    'id': creator['id'],
                    'username': creator['username'],
                    'name': creator.get('name', creator['username'])
                }
    
    # Paginate results
    paginated_data = paginate_results(routings, page, per_page)
    
    return jsonify(paginated_data)

@sample_routing_bp.route('/api/samples/routing', methods=['POST'])
@token_required
def create_sample_routing():
    """Create a new sample routing request"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['sample_id', 'to_tenant_id', 'reason']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    # Verify sample exists and user has access
    samples = read_data('samples.json')
    sample = next((s for s in samples if s['id'] == data['sample_id']), None)
    if not sample:
        return jsonify({'message': 'Sample not found'}), 404
    
    # Verify user has access to the sample
    user_tenant_id = request.current_user.get('tenant_id')
    # if sample.get('tenant_id') != user_tenant_id and request.current_user.get('role') != 'admin':
    #     return jsonify({'message': 'Access denied to sample'}), 403
    
    # Verify destination tenant exists
    tenants = read_data('tenants.json')
    to_tenant = next((t for t in tenants if t['id'] == data['to_tenant_id']), None)
    if not to_tenant:
        return jsonify({'message': 'Destination tenant not found'}), 404
    
    routings = read_data('sample_routings.json')
    
    # Generate new routing ID
    new_id = 1
    if routings:
        new_id = max(r['id'] for r in routings) + 1
    
    # Generate tracking number
    tracking_number = f"RT{new_id:06d}"
    
    # Create new routing
    new_routing = {
        'id': new_id,
        'sample_id': data['sample_id'],
        'from_tenant_id': user_tenant_id,
        'to_tenant_id': data['to_tenant_id'],
        'reason': data['reason'],
        'notes': data.get('notes', ''),
        'priority': data.get('priority', 'normal'),
        'tracking_number': tracking_number,
        'status': 'pending_approval',
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': request.current_user.get('id'),
        'dispatch_date': None,
        'expected_delivery_date': data.get('expected_delivery_date'),
        'actual_delivery_date': None,
        'received_by': None,
        'received_at': None,
        'special_instructions': data.get('special_instructions', ''),
        'temperature_requirements': data.get('temperature_requirements', 'room_temperature'),
        'handling_requirements': data.get('handling_requirements', [])
    }
    
    routings.append(new_routing)
    write_data('sample_routings.json', routings)

    # Create automatic draft invoice for the routing
    try:
        from routes.invoice_routes import create_automatic_invoice
        create_automatic_invoice(new_routing, request.current_user.get('id'))
    except Exception as e:
        print(f"Warning: Failed to create automatic invoice for routing {new_id}: {e}")
        # Continue without failing the routing creation

    # Create workflow instance and transition to pending_approval (with error handling)
    try:
        workflow = WorkflowEngine.create_workflow_instance(
            routing_id=new_id,
            user_id=request.current_user.get('id')
        )
        # Immediately transition to pending_approval to match routing status
        WorkflowEngine.transition_stage(
            workflow_id=workflow['id'],
            target_stage_id='pending_approval',
            user_id=request.current_user.get('id'),
            notes='Routing created and submitted for approval'
        )
    except Exception as e:
        print(f"Warning: Workflow creation failed for routing {new_id}: {e}")

    # Send notifications (with error handling)
    try:
        NotificationService.notify_routing_participants(
            routing_id=new_id,
            notification_type='routing_created',
            data={
                'sample_id': sample.get('sample_id', 'Unknown'),
                'reason': data['reason']
            },
            exclude_user_id=request.current_user.get('id')
        )
    except Exception as e:
        print(f"Warning: Notification failed for routing {new_id}: {e}")
    
    return jsonify(new_routing), 201

@sample_routing_bp.route('/api/samples/routing/<int:routing_id>', methods=['GET'])
@token_required
def get_sample_routing_by_id(routing_id):
    """Get a specific sample routing by ID"""
    routings = read_data('sample_routings.json')
    routing = next((r for r in routings if r['id'] == routing_id), None)
    
    if not routing:
        return jsonify({'message': 'Routing not found'}), 404
    
    # Check access permissions
    user_tenant_id = request.current_user.get('tenant_id')
    if (routing.get('from_tenant_id') != user_tenant_id and 
        routing.get('to_tenant_id') != user_tenant_id and
        request.current_user.get('role') != 'admin'):
        return jsonify({'message': 'Access denied'}), 403
    
    # Enrich with related data
    samples = read_data('samples.json')
    patients = read_data('patients.json')
    tenants = read_data('tenants.json')
    users = read_data('users.json')
    
    # Add sample information
    sample_id = routing.get('sample_id')
    if sample_id:
        sample = next((s for s in samples if s['id'] == sample_id), None)
        if sample:
            routing['sample'] = sample
            # Add patient information
            patient_id = sample.get('patient_id')
            if patient_id:
                patient = next((p for p in patients if p['id'] == patient_id), None)
                if patient:
                    routing['patient'] = patient
    
    # Add tenant information
    from_tenant_id = routing.get('from_tenant_id')
    to_tenant_id = routing.get('to_tenant_id')
    
    if from_tenant_id:
        from_tenant = next((t for t in tenants if t['id'] == from_tenant_id), None)
        if from_tenant:
            routing['from_tenant'] = from_tenant
    
    if to_tenant_id:
        to_tenant = next((t for t in tenants if t['id'] == to_tenant_id), None)
        if to_tenant:
            routing['to_tenant'] = to_tenant
    
    # Add workflow status (with error handling)
    try:
        workflow_status = WorkflowEngine.get_workflow_status(routing_id)
        routing['workflow'] = workflow_status
    except Exception as e:
        print(f"Warning: Workflow status failed for routing {routing_id}: {e}")
        # Create a fallback workflow status based on routing status
        routing['workflow'] = {
            'status': 'active',
            'current_stage': routing.get('status', 'unknown'),
            'stage_history': []
        }
    
    # Add user information
    created_by = routing.get('created_by')
    if created_by:
        creator = next((u for u in users if u['id'] == created_by), None)
        if creator:
            routing['created_by_user'] = {
                'id': creator['id'],
                'username': creator['username'],
                'name': creator.get('name', creator['username'])
            }
    
    return jsonify(routing)

@sample_routing_bp.route('/api/samples/routing/<int:routing_id>/approve', methods=['POST'])
@token_required
def approve_routing(routing_id):
    """Approve a sample routing request"""
    data = request.get_json() or {}

    routings = read_data('sample_routings.json')
    routing_index = next((i for i, r in enumerate(routings) if r['id'] == routing_id), None)

    if routing_index is None:
        return jsonify({'message': 'Routing not found'}), 404

    routing = routings[routing_index]

    # Check if user is from destination tenant
    user_tenant_id = request.current_user.get('tenant_id')
    if routing.get('to_tenant_id') != user_tenant_id and request.current_user.get('role') != 'admin':
        return jsonify({'message': 'Only destination facility can approve routing'}), 403

    # Check current status
    if routing.get('status') != 'pending_approval':
        return jsonify({'message': 'Routing is not in pending approval state'}), 400

    # Update routing status
    routing['status'] = 'approved'
    routing['updated_at'] = datetime.now().isoformat()
    routing['approved_by'] = request.current_user.get('id')
    routing['approved_at'] = datetime.now().isoformat()
    routing['approval_notes'] = data.get('notes', '')

    routings[routing_index] = routing
    write_data('sample_routings.json', routings)

    # Transfer invoice ownership to destination facility
    try:
        from routes.invoice_routes import transfer_invoice_ownership
        transfer_invoice_ownership(routing_id, request.current_user.get('id'))
    except Exception as e:
        print(f"Warning: Failed to transfer invoice ownership for routing {routing_id}: {e}")
        # Continue without failing the approval

    # Update workflow (with error handling)
    try:
        workflow = WorkflowEngine.get_workflow_by_routing_id(routing_id)
        if workflow:
            WorkflowEngine.transition_stage(
                workflow_id=workflow['id'],
                target_stage_id='approved',
                user_id=request.current_user.get('id'),
                notes=data.get('notes', 'Routing approved'),
                metadata={'approved_by': request.current_user.get('id')}
            )
    except Exception as e:
        print(f"Warning: Workflow transition failed for routing {routing_id}: {e}")
        # Continue without failing the approval

    # Send notifications (with error handling)
    try:
        NotificationService.notify_workflow_change(
            routing_id=routing_id,
            old_stage='pending_approval',
            new_stage='approved',
            user_id=request.current_user.get('id'),
            notes=data.get('notes', '')
        )
    except Exception as e:
        print(f"Warning: Notification failed for routing {routing_id}: {e}")
        # Continue without failing the approval

    return jsonify({'message': 'Routing approved successfully', 'routing': routing})

@sample_routing_bp.route('/api/samples/routing/<int:routing_id>/reject', methods=['POST'])
@token_required
def reject_routing(routing_id):
    """Reject a sample routing request"""
    data = request.get_json() or {}

    if not data.get('reason'):
        return jsonify({'message': 'Rejection reason is required'}), 400

    routings = read_data('sample_routings.json')
    routing_index = next((i for i, r in enumerate(routings) if r['id'] == routing_id), None)

    if routing_index is None:
        return jsonify({'message': 'Routing not found'}), 404

    routing = routings[routing_index]

    # Check if user is from destination tenant
    user_tenant_id = request.current_user.get('tenant_id')
    if routing.get('to_tenant_id') != user_tenant_id and request.current_user.get('role') != 'admin':
        return jsonify({'message': 'Only destination facility can reject routing'}), 403

    # Check current status
    if routing.get('status') != 'pending_approval':
        return jsonify({'message': 'Routing is not in pending approval state'}), 400

    # Update routing status
    routing['status'] = 'rejected'
    routing['updated_at'] = datetime.now().isoformat()
    routing['rejected_by'] = request.current_user.get('id')
    routing['rejected_at'] = datetime.now().isoformat()
    routing['rejection_reason'] = data.get('reason')
    routing['rejection_notes'] = data.get('notes', '')

    routings[routing_index] = routing
    write_data('sample_routings.json', routings)

    # Update workflow (with error handling)
    try:
        workflow = WorkflowEngine.get_workflow_by_routing_id(routing_id)
        if workflow:
            WorkflowEngine.transition_stage(
                workflow_id=workflow['id'],
                target_stage_id='rejected',
                user_id=request.current_user.get('id'),
                notes=data.get('reason'),
                metadata={'rejected_by': request.current_user.get('id')}
            )
    except Exception as e:
        print(f"Warning: Workflow transition failed for routing {routing_id}: {e}")
        # Continue without failing the rejection

    # Send notifications
    NotificationService.notify_workflow_change(
        routing_id=routing_id,
        old_stage='pending_approval',
        new_stage='rejected',
        user_id=request.current_user.get('id'),
        notes=data.get('reason')
    )

    return jsonify({'message': 'Routing rejected successfully', 'routing': routing})

@sample_routing_bp.route('/api/samples/routing/<int:routing_id>/dispatch', methods=['POST'])
@token_required
def dispatch_routing(routing_id):
    """Dispatch a sample for routing"""
    data = request.get_json() or {}

    routings = read_data('sample_routings.json')
    routing_index = next((i for i, r in enumerate(routings) if r['id'] == routing_id), None)

    if routing_index is None:
        return jsonify({'message': 'Routing not found'}), 404

    routing = routings[routing_index]

    # Check if user is from source tenant
    user_tenant_id = request.current_user.get('tenant_id')
    if routing.get('from_tenant_id') != user_tenant_id and request.current_user.get('role') != 'admin':
        return jsonify({'message': 'Only source facility can dispatch sample'}), 403

    # Check current status
    if routing.get('status') != 'approved':
        return jsonify({'message': 'Routing must be approved before dispatch'}), 400

    # Update routing status
    routing['status'] = 'in_transit'
    routing['updated_at'] = datetime.now().isoformat()
    routing['dispatch_date'] = datetime.now().isoformat()
    routing['dispatched_by'] = request.current_user.get('id')
    routing['courier_name'] = data.get('courier_name', '')
    routing['courier_contact'] = data.get('courier_contact', '')
    routing['dispatch_notes'] = data.get('notes', '')

    routings[routing_index] = routing
    write_data('sample_routings.json', routings)

    # Update workflow (with error handling)
    try:
        workflow = WorkflowEngine.get_workflow_by_routing_id(routing_id)
        if workflow:
            WorkflowEngine.transition_stage(
                workflow_id=workflow['id'],
                target_stage_id='in_transit',
                user_id=request.current_user.get('id'),
                notes=data.get('notes', 'Sample dispatched'),
                metadata={
                    'dispatched_by': request.current_user.get('id'),
                    'courier_name': data.get('courier_name', ''),
                    'courier_contact': data.get('courier_contact', '')
                }
            )
    except Exception as e:
        print(f"Warning: Workflow transition failed for routing {routing_id}: {e}")
        # Continue without failing the dispatch

    # Send notifications (with error handling)
    try:
        NotificationService.notify_workflow_change(
            routing_id=routing_id,
            old_stage='approved',
            new_stage='in_transit',
            user_id=request.current_user.get('id'),
            notes=data.get('notes', '')
        )
    except Exception as e:
        print(f"Warning: Notification failed for routing {routing_id}: {e}")
        # Continue without failing the dispatch

    return jsonify({'message': 'Sample dispatched successfully', 'routing': routing})

@sample_routing_bp.route('/api/samples/routing/<int:routing_id>/receive', methods=['POST'])
@token_required
def receive_routing(routing_id):
    """Receive a sample at destination"""
    data = request.get_json() or {}

    routings = read_data('sample_routings.json')
    routing_index = next((i for i, r in enumerate(routings) if r['id'] == routing_id), None)

    if routing_index is None:
        return jsonify({'message': 'Routing not found'}), 404

    routing = routings[routing_index]

    # Check if user is from destination tenant
    user_tenant_id = request.current_user.get('tenant_id')
    if routing.get('to_tenant_id') != user_tenant_id and request.current_user.get('role') != 'admin':
        return jsonify({'message': 'Only destination facility can receive sample'}), 403

    # Check current status
    if routing.get('status') != 'in_transit':
        return jsonify({'message': 'Sample must be in transit to be received'}), 400

    # Update routing status
    routing['status'] = 'delivered'
    routing['updated_at'] = datetime.now().isoformat()
    routing['received_at'] = datetime.now().isoformat()
    routing['received_by'] = request.current_user.get('id')
    routing['actual_delivery_date'] = datetime.now().isoformat()
    routing['condition_on_arrival'] = data.get('condition', 'good')
    routing['receipt_notes'] = data.get('notes', '')

    routings[routing_index] = routing
    write_data('sample_routings.json', routings)

    # Update workflow (with error handling)
    try:
        workflow = WorkflowEngine.get_workflow_by_routing_id(routing_id)
        if workflow:
            WorkflowEngine.transition_stage(
                workflow_id=workflow['id'],
                target_stage_id='delivered',
                user_id=request.current_user.get('id'),
                notes=data.get('notes', 'Sample received'),
                metadata={
                    'received_by': request.current_user.get('id'),
                    'condition': data.get('condition', 'good')
                }
            )
    except Exception as e:
        print(f"Warning: Workflow transition failed for routing {routing_id}: {e}")
        # Continue without failing the receive

    # Send notifications (with error handling)
    try:
        NotificationService.notify_workflow_change(
            routing_id=routing_id,
            old_stage='in_transit',
            new_stage='delivered',
            user_id=request.current_user.get('id'),
            notes=data.get('notes', '')
        )
    except Exception as e:
        print(f"Warning: Notification failed for routing {routing_id}: {e}")
        # Continue without failing the receive

    return jsonify({'message': 'Sample received successfully', 'routing': routing})

@sample_routing_bp.route('/api/samples/routing/<int:routing_id>/complete', methods=['POST'])
@token_required
def complete_routing(routing_id):
    """Complete the routing process"""
    data = request.get_json() or {}

    routings = read_data('sample_routings.json')
    routing_index = next((i for i, r in enumerate(routings) if r['id'] == routing_id), None)

    if routing_index is None:
        return jsonify({'message': 'Routing not found'}), 404

    routing = routings[routing_index]

    # Check if user is from destination tenant
    user_tenant_id = request.current_user.get('tenant_id')
    if routing.get('to_tenant_id') != user_tenant_id and request.current_user.get('role') != 'admin':
        return jsonify({'message': 'Only destination facility can complete routing'}), 403

    # Check current status
    if routing.get('status') != 'delivered':
        return jsonify({'message': 'Sample must be delivered to be completed'}), 400

    # Update routing status
    routing['status'] = 'completed'
    routing['updated_at'] = datetime.now().isoformat()
    routing['completed_at'] = datetime.now().isoformat()
    routing['completed_by'] = request.current_user.get('id')
    routing['completion_notes'] = data.get('notes', '')

    routings[routing_index] = routing
    write_data('sample_routings.json', routings)

    # Update workflow (with error handling)
    try:
        workflow = WorkflowEngine.get_workflow_by_routing_id(routing_id)
        if workflow:
            WorkflowEngine.transition_stage(
                workflow_id=workflow['id'],
                target_stage_id='completed',
                user_id=request.current_user.get('id'),
                notes=data.get('notes', 'Routing completed'),
                metadata={'completed_by': request.current_user.get('id')}
            )
    except Exception as e:
        print(f"Warning: Workflow transition failed for routing {routing_id}: {e}")
        # Continue without failing the completion

    # Send notifications (with error handling)
    try:
        NotificationService.notify_workflow_change(
            routing_id=routing_id,
            old_stage='delivered',
            new_stage='completed',
            user_id=request.current_user.get('id'),
            notes=data.get('notes', '')
        )
    except Exception as e:
        print(f"Warning: Notification failed for routing {routing_id}: {e}")
        # Continue without failing the completion

    return jsonify({'message': 'Routing completed successfully', 'routing': routing})

@sample_routing_bp.route('/api/samples/routing/<int:routing_id>/history', methods=['GET'])
@token_required
def get_routing_history(routing_id):
    """Get complete history and audit trail for a routing"""
    routings = read_data('sample_routings.json')
    routing = next((r for r in routings if r['id'] == routing_id), None)

    if not routing:
        return jsonify({'message': 'Routing not found'}), 404

    # Check access permissions
    user_tenant_id = request.current_user.get('tenant_id')
    if (routing.get('from_tenant_id') != user_tenant_id and
        routing.get('to_tenant_id') != user_tenant_id and
        request.current_user.get('role') != 'admin'):
        return jsonify({'message': 'Access denied'}), 403

    # Get workflow history
    workflow_status = WorkflowEngine.get_workflow_status(routing_id)

    # Get chat messages
    messages = read_data('routing_messages.json')
    routing_messages = [m for m in messages if m.get('routing_id') == routing_id]

    # Get file attachments
    files = read_data('routing_files.json')
    routing_files = [f for f in files if f.get('routing_id') == routing_id]

    # Get notifications
    notifications = read_data('notifications.json')
    routing_notifications = [n for n in notifications if n.get('routing_id') == routing_id]

    history = {
        'routing_id': routing_id,
        'workflow_history': workflow_status.get('stage_history', []),
        'messages_count': len(routing_messages),
        'files_count': len(routing_files),
        'notifications_count': len(routing_notifications),
        'created_at': routing.get('created_at'),
        'updated_at': routing.get('updated_at'),
        'current_status': routing.get('status')
    }

    return jsonify(history)
