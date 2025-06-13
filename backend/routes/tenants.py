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
