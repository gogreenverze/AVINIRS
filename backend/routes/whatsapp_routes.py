"""
WhatsApp integration routes for RSAVINI LIS.
Includes configuration, message history, and sending functionality.
"""
from flask import Blueprint, jsonify, request
from datetime import datetime
from utils import token_required, read_data, write_data, filter_data_by_tenant, check_tenant_access, paginate_results
from whatsapp_service import WhatsAppService

whatsapp_bp = Blueprint('whatsapp', __name__, url_prefix='/api/whatsapp')

@whatsapp_bp.route('/config', methods=['GET'])
@token_required
def get_config():
    """Get WhatsApp configuration for accessible tenants."""
    # Check if user has admin privileges
    if not (request.current_user.get('role') in ['admin', 'hub_admin']):
        return jsonify({'message': 'You do not have permission to access this resource'}), 403
    
    configs = read_data('whatsapp_config.json')
    
    # Filter configs based on user access
    filtered_configs = filter_data_by_tenant(configs, request.current_user)
    
    return jsonify(filtered_configs)

@whatsapp_bp.route('/config/<int:tenant_id>', methods=['GET', 'PUT'])
@token_required
def manage_config(tenant_id):
    """Get or update WhatsApp configuration for a specific tenant."""
    # Check if user has admin privileges and access to the tenant
    if not (request.current_user.get('role') in ['admin', 'hub_admin']):
        return jsonify({'message': 'You do not have permission to access this resource'}), 403
    
    if not check_tenant_access(tenant_id, request.current_user):
        return jsonify({'message': 'You do not have access to this tenant'}), 403
    
    configs = read_data('whatsapp_config.json')
    config = next((c for c in configs if c['tenant_id'] == tenant_id), None)
    
    if request.method == 'GET':
        if not config:
            # Create default config if it doesn't exist
            config = {
                'id': len(configs) + 1,
                'tenant_id': tenant_id,
                'api_key': '',
                'api_secret': '',
                'phone_number_id': '',
                'business_account_id': '',
                'is_enabled': False,
                'default_report_template': 'Your test results from AVINI LABS are ready. Patient: {patient_name}. Please contact us for details.',
                'default_invoice_template': 'Your invoice from AVINI LABS is ready. Invoice #{invoice_number}. Total amount: ₹{amount}. Thank you for choosing AVINI LABS.',
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            configs.append(config)
            write_data('whatsapp_config.json', configs)
        
        return jsonify(config)
    
    elif request.method == 'PUT':
        data = request.get_json()
        
        if not config:
            # Create new config
            config = {
                'id': len(configs) + 1,
                'tenant_id': tenant_id,
                'created_at': datetime.utcnow().isoformat()
            }
            configs.append(config)
        
        # Update configuration
        config.update({
            'api_key': data.get('api_key', ''),
            'api_secret': data.get('api_secret', ''),
            'phone_number_id': data.get('phone_number_id', ''),
            'business_account_id': data.get('business_account_id', ''),
            'is_enabled': data.get('is_enabled', False),
            'default_report_template': data.get('default_report_template', ''),
            'default_invoice_template': data.get('default_invoice_template', ''),
            'updated_at': datetime.utcnow().isoformat()
        })
        
        # Update the config in the list
        for i, c in enumerate(configs):
            if c['tenant_id'] == tenant_id:
                configs[i] = config
                break
        
        write_data('whatsapp_config.json', configs)
        
        return jsonify({'message': 'WhatsApp configuration updated successfully', 'config': config})

@whatsapp_bp.route('/messages', methods=['GET'])
@token_required
def get_messages():
    """Get WhatsApp message history."""
    # Check if user has admin privileges
    if not (request.current_user.get('role') in ['admin', 'hub_admin']):
        return jsonify({'message': 'You do not have permission to access this resource'}), 403
    
    # Get pagination parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)
    
    messages = read_data('whatsapp_messages.json')
    
    # Filter messages based on user access
    filtered_messages = filter_data_by_tenant(messages, request.current_user)
    
    # Sort by created_at (newest first)
    filtered_messages.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    # Paginate results
    paginated_data = paginate_results(filtered_messages, page, per_page)
    
    return jsonify(paginated_data)

@whatsapp_bp.route('/send/report', methods=['POST'])
@token_required
def send_report():
    """Send a test report via WhatsApp."""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['phone_number', 'message', 'patient_name']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'message': f'{field} is required'}), 400
    
    # Get user's tenant
    user_tenant_id = request.current_user.get('tenant_id')
    if not user_tenant_id:
        return jsonify({'message': 'User must be associated with a tenant'}), 400
    
    # Get tenant information
    tenants = read_data('tenants.json')
    tenant = next((t for t in tenants if t['id'] == user_tenant_id), None)
    if not tenant:
        return jsonify({'message': 'Tenant not found'}), 404
    
    # Format message with headers
    formatted_message = WhatsAppService.format_message_with_headers(
        request.current_user,
        tenant,
        data['patient_name'],
        data['message']
    )
    
    # Send message
    result = WhatsAppService.send_message(
        user_id=request.current_user['id'],
        tenant_id=user_tenant_id,
        recipient_number=data['phone_number'],
        message_content=formatted_message,
        message_type='report',
        order_id=data.get('order_id')
    )
    
    if result['status'] == 'sent':
        return jsonify({'message': f'Report sent to {data["phone_number"]} via WhatsApp successfully', 'result': result})
    else:
        return jsonify({'message': f'Failed to send WhatsApp message: {result.get("error_message", "Unknown error")}', 'result': result}), 500

@whatsapp_bp.route('/send/invoice', methods=['POST'])
@token_required
def send_invoice():
    """Send an invoice via WhatsApp."""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['phone_number', 'message', 'patient_name']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'message': f'{field} is required'}), 400
    
    # Get user's tenant
    user_tenant_id = request.current_user.get('tenant_id')
    if not user_tenant_id:
        return jsonify({'message': 'User must be associated with a tenant'}), 400
    
    # Get tenant information
    tenants = read_data('tenants.json')
    tenant = next((t for t in tenants if t['id'] == user_tenant_id), None)
    if not tenant:
        return jsonify({'message': 'Tenant not found'}), 404
    
    # Format message with headers
    formatted_message = WhatsAppService.format_message_with_headers(
        request.current_user,
        tenant,
        data['patient_name'],
        data['message']
    )
    
    # Send message
    result = WhatsAppService.send_message(
        user_id=request.current_user['id'],
        tenant_id=user_tenant_id,
        recipient_number=data['phone_number'],
        message_content=formatted_message,
        message_type='invoice',
        billing_id=data.get('billing_id')
    )
    
    if result['status'] == 'sent':
        return jsonify({'message': f'Invoice sent to {data["phone_number"]} via WhatsApp successfully', 'result': result})
    else:
        return jsonify({'message': f'Failed to send WhatsApp message: {result.get("error_message", "Unknown error")}', 'result': result}), 500

@whatsapp_bp.route('/status', methods=['GET'])
@token_required
def get_status():
    """Get WhatsApp integration status for user's tenant."""
    user_tenant_id = request.current_user.get('tenant_id')
    if not user_tenant_id:
        return jsonify({'message': 'User must be associated with a tenant'}), 400
    
    is_enabled = WhatsAppService.is_enabled(user_tenant_id)
    config = WhatsAppService.get_config(user_tenant_id)
    
    return jsonify({
        'enabled': is_enabled,
        'configured': config is not None,
        'tenant_id': user_tenant_id
    })
