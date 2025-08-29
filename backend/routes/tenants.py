from flask import Blueprint, jsonify, request
from utils import token_required, read_data, filter_data_by_tenant

tenants_bp = Blueprint('tenants', __name__, url_prefix='/api/tenants')

@tenants_bp.route('', methods=['GET'])
@token_required
def get_tenants():
    """Fetch tenant list based on user access."""
    all_tenants = read_data('tenants.json')
    filtered_tenants = filter_data_by_tenant(all_tenants, request.current_user)
    return jsonify(filtered_tenants)

@tenants_bp.route('/accessible', methods=['GET'])
@token_required
def get_accessible_tenants():
    """Fetch accessible tenant list for current user."""
    from utils import get_accessible_tenants

    user_role = request.current_user.get('role')
    user_tenant_id = request.current_user.get('tenant_id')
    all_tenants = read_data('tenants.json')

    # For admin users (Mayiladuthurai admin), return all active tenants including hub
    if user_role == 'admin':
        accessible_tenants = [t for t in all_tenants if t.get('is_active', True)]
    elif user_role == 'hub_admin':
        # Hub admin can access all active franchises including their own hub
        user_tenant = next((t for t in all_tenants if t.get('id') == user_tenant_id), None)
        if user_tenant and user_tenant.get('is_hub'):
            # Return all active tenants (including hub and franchises)
            accessible_tenants = [t for t in all_tenants if t.get('is_active', True)]
        else:
            accessible_tenants = []
    elif user_role == 'franchise_admin':
        # For billing registration, franchise admin should see their own franchise
        # This is different from routing where they see other franchises
        user_tenant = next((t for t in all_tenants if t.get('id') == user_tenant_id), None)
        if user_tenant:
            accessible_tenants = [user_tenant]
        else:
            accessible_tenants = []
    else:
        # Other roles can access all OTHER active tenants (destinations for routing)
        accessible_tenants = [t for t in all_tenants
                            if t.get('is_active', True) and t.get('id') != user_tenant_id]

    return jsonify(accessible_tenants)

@tenants_bp.route('/current', methods=['GET'])
@token_required
def get_current_tenant():
    """Get current user's tenant information."""
    all_tenants = read_data('tenants.json')
    user_tenant_id = request.current_user.get('tenant_id')

    current_tenant = next((t for t in all_tenants if t['id'] == user_tenant_id), None)

    if current_tenant:
        return jsonify(current_tenant)
    else:
        return jsonify({'message': 'Current tenant not found'}), 404
