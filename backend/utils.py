from flask import jsonify, request
from datetime import datetime, timedelta
import jwt
import json
import os
from functools import wraps

# Configuration
SECRET_KEY = 'your-secret-key'
JWT_EXPIRATION = 3600  # 1 hour

# Data directory
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

def read_data(filename):
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'r') as f:
        return json.load(f)

def write_data(filename, data):
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

def generate_token(user_id):
    payload = {
        'exp': datetime.utcnow() + timedelta(seconds=JWT_EXPIRATION),
        'iat': datetime.utcnow(),
        'sub': user_id
    }
    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm='HS256'
    )

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user_id = payload['sub']

            # Get user from database
            users = read_data('users.json')
            current_user = next((user for user in users if user['id'] == current_user_id), None)

            if not current_user:
                return jsonify({'message': 'User not found'}), 401

            # Add user to request context
            request.current_user = current_user

        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401

        return f(*args, **kwargs)

    return decorated

def paginate_results(items, page=1, per_page=20):
    page = int(page)
    per_page = int(per_page)

    start = (page - 1) * per_page
    end = start + per_page

    paginated_items = items[start:end]
    total_pages = (len(items) + per_page - 1) // per_page

    return {
        'items': paginated_items,
        'page': page,
        'per_page': per_page,
        'total_items': len(items),
        'total_pages': total_pages
    }

def filter_data_by_tenant(data, current_user):
    """
    Filter data based on user role and tenant access.

    Args:
        data: List of data items to filter
        current_user: Current user object with role and tenant_id

    Returns:
        Filtered data list
    """
    user_role = current_user.get('role')
    user_tenant_id = current_user.get('tenant_id')

    # Admin has access to all data
    if user_role == 'admin':
        return data

    # Hub admin has access to all franchise data but not other hubs
    if user_role == 'hub_admin':
        tenants = read_data('tenants.json')
        user_tenant = next((t for t in tenants if t.get('id') == user_tenant_id), None)

        if user_tenant and user_tenant.get('is_hub'):
            # Hub admin can see all franchise data (non-hub tenants)
            franchise_tenant_ids = [t.get('id') for t in tenants if not t.get('is_hub')]
            return [item for item in data if item.get('tenant_id') in franchise_tenant_ids or item.get('tenant_id') == user_tenant_id]

    # Franchise admin can only see data from their own franchise
    if user_role == 'franchise_admin':
        return [item for item in data if item.get('tenant_id') == user_tenant_id]

    # All other roles can only see data from their own tenant
    return [item for item in data if item.get('tenant_id') == user_tenant_id]

def check_tenant_access(target_tenant_id, current_user):
    """
    Check if current user has access to the target tenant.

    Args:
        target_tenant_id: ID of the tenant to check access for
        current_user: Current user object with role and tenant_id

    Returns:
        Boolean indicating access permission
    """
    user_role = current_user.get('role')
    user_tenant_id = current_user.get('tenant_id')

    # Admin has access to all tenants
    if user_role == 'admin':
        return True

    # Hub admin has access to all franchises
    if user_role == 'hub_admin':
        tenants = read_data('tenants.json')
        user_tenant = next((t for t in tenants if t.get('id') == user_tenant_id), None)
        target_tenant = next((t for t in tenants if t.get('id') == target_tenant_id), None)

        if user_tenant and user_tenant.get('is_hub'):
            # Hub admin can access franchises and their own hub
            return target_tenant_id == user_tenant_id or (target_tenant and not target_tenant.get('is_hub'))

    # Franchise admin can only access their own franchise
    if user_role == 'franchise_admin':
        return target_tenant_id == user_tenant_id

    # All other roles can only access their own tenant
    return target_tenant_id == user_tenant_id

def require_role(allowed_roles):
    """
    Decorator to require specific roles for route access.

    Args:
        allowed_roles: List of roles allowed to access the route

    Returns:
        Decorator function
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(request, 'current_user'):
                return jsonify({'message': 'Authentication required'}), 401

            user_role = request.current_user.get('role')
            if user_role not in allowed_roles:
                return jsonify({'message': 'Insufficient permissions'}), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator
