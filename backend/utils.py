from flask import jsonify, request
from datetime import datetime, timedelta
import jwt
import json
import os
from functools import wraps

# Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'avini-labs-jwt-secret-key-2024-secure')
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

def transform_master_data(data, category):
    """
    Transform raw data from JSON files to match frontend expectations.
    This fixes the "N/A" display issue by mapping actual field names to expected field names.
    """
    if not data or not isinstance(data, list):
        return data

    # Define field mappings for each category
    field_mappings = {
        'containers': {
            'container_name': 'name',
            'color_code': 'color',
            'volume_required': 'volume',
            # Add type field based on container name or default
            '_computed_fields': {
                'type': lambda item: 'Tube' if 'tube' in item.get('container_name', '').lower() else 'Container'
            }
        },
        'sampleTypes': {
            'type_name': 'name',
            'type_code': 'code'
        },
        'testParameters': {
            'parameter_name': 'name',
            'parameter_code': 'code'
        },
        'testCategories': {
            # Already matches - no transformation needed
        },
        'departments': {
            # Already matches - no transformation needed
        },
        'paymentMethods': {
            # Already matches - no transformation needed
        },
        'instruments': {
            # Already matches - no transformation needed
        },
        'reagents': {
            # Already matches - no transformation needed
        },
        'suppliers': {
            # Already matches - no transformation needed
        },
        'units': {
            # Already matches - no transformation needed
        },
        'testMethods': {
            # Already matches - no transformation needed
        }
    }

    # Get mapping for this category
    mapping = field_mappings.get(category, {})
    if not mapping:
        return data

    # Transform each item in the data array
    transformed_data = []
    for item in data:
        if not isinstance(item, dict):
            transformed_data.append(item)
            continue

        # Start with original item
        transformed_item = item.copy()

        # Apply field mappings
        for old_field, new_field in mapping.items():
            if old_field.startswith('_'):
                continue  # Skip special fields
            if old_field in item:
                transformed_item[new_field] = item[old_field]
                # Keep original field as well for backward compatibility

        # Apply computed fields
        computed_fields = mapping.get('_computed_fields', {})
        for new_field, compute_func in computed_fields.items():
            try:
                transformed_item[new_field] = compute_func(item)
            except Exception as e:
                print(f"Error computing field {new_field} for {category}: {e}")
                transformed_item[new_field] = ''

        transformed_data.append(transformed_item)

    return transformed_data

def generate_token(user_id):
    payload = {
        'exp': datetime.utcnow() + timedelta(seconds=JWT_EXPIRATION),
        'iat': datetime.utcnow(),
        'sub': str(user_id)  # Convert to string for JWT compatibility
    }
    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm='HS256'
    )

def verify_token(token):
    """
    Verify and decode a JWT token.

    Args:
        token: JWT token string

    Returns:
        dict: Decoded payload if valid, None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        print(f"[TOKEN] Token expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"[TOKEN] Invalid token: {str(e)}")
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            print(f"[AUTH ERROR] Token missing for {request.endpoint}")
            return jsonify({'message': 'Token is missing'}), 401

        try:
            # Decode JWT token
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user_id = payload['sub']

            print(f"[AUTH DEBUG] Token decoded successfully. User ID: {current_user_id}, Type: {type(current_user_id)}")

            # Get user from database
            users = read_data('users.json')

            # Handle both string and integer user IDs for compatibility
            current_user = None
            for user in users:
                user_id = user.get('id')
                # current_user_id is now always a string from JWT
                if str(user_id) == current_user_id:
                    current_user = user
                    break

            if not current_user:
                print(f"[AUTH ERROR] User not found in database. Looking for ID: {current_user_id}")
                print(f"[AUTH DEBUG] Available user IDs: {[u.get('id') for u in users[:5]]}")  # Show first 5 for debugging
                return jsonify({'message': 'User not found'}), 401

            # Check if user is active
            if not current_user.get('is_active', True):
                print(f"[AUTH ERROR] User {current_user_id} is inactive")
                return jsonify({'message': 'User account is inactive'}), 401

            # Add user to request context
            request.current_user = current_user
            print(f"[AUTH SUCCESS] User {current_user.get('username')} authenticated for {request.endpoint}")

        except jwt.ExpiredSignatureError:
            print(f"[AUTH ERROR] Token expired for {request.endpoint}")
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError as e:
            print(f"[AUTH ERROR] Invalid token for {request.endpoint}: {str(e)}")
            return jsonify({'message': 'Invalid token'}), 401
        except Exception as e:
            print(f"[AUTH ERROR] Unexpected error in token validation: {str(e)}")
            return jsonify({'message': 'Authentication error'}), 401

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

def filter_data_by_tenant(data, current_user, target_tenant_id=None):
    """
    Filter data based on user role and tenant access.

    Args:
        data: List of data items to filter
        current_user: Current user object with role and tenant_id
        target_tenant_id: Optional specific tenant ID to filter by (for admin tenant switching)

    Returns:
        Filtered data list
    """
    user_role = current_user.get('role')
    user_tenant_id = current_user.get('tenant_id')

    # Admin has access to all data
    if user_role == 'admin':
        # If target_tenant_id is specified, filter by that tenant (for tenant switching)
        if target_tenant_id:
            return [item for item in data if item.get('tenant_id') == target_tenant_id]
        return data

    # Hub admin has access to all franchise data but not other hubs
    if user_role == 'hub_admin':
        tenants = read_data('tenants.json')
        user_tenant = next((t for t in tenants if t.get('id') == user_tenant_id), None)

        if user_tenant and user_tenant.get('is_hub'):
            # Hub admin can see all franchise data (non-hub tenants) and their own hub
            franchise_tenant_ids = [t.get('id') for t in tenants if not t.get('is_hub')]
            franchise_tenant_ids.append(user_tenant_id)  # Include hub data

            # If target_tenant_id is specified, ensure it's accessible
            if target_tenant_id:
                if target_tenant_id in franchise_tenant_ids:
                    return [item for item in data if item.get('tenant_id') == target_tenant_id]
                else:
                    return []  # Access denied

            return [item for item in data if item.get('tenant_id') in franchise_tenant_ids]

    # Franchise admin can only see data from their own franchise
    if user_role == 'franchise_admin':
        # If target_tenant_id is specified, ensure it matches user's tenant
        if target_tenant_id and target_tenant_id != user_tenant_id:
            return []  # Access denied
        return [item for item in data if item.get('tenant_id') == user_tenant_id]

    # All other roles can only see data from their own tenant
    if target_tenant_id and target_tenant_id != user_tenant_id:
        return []  # Access denied
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

def get_accessible_tenants(current_user):
    """
    Get list of tenants accessible to the current user.

    Args:
        current_user: Current user object with role and tenant_id

    Returns:
        List of accessible tenant objects
    """
    user_role = current_user.get('role')
    user_tenant_id = current_user.get('tenant_id')
    tenants = read_data('tenants.json')

    # Admin has access to all active tenants
    if user_role == 'admin':
        return [t for t in tenants if t.get('is_active', True)]

    # Hub admin has access to all active franchises and their own hub
    if user_role == 'hub_admin':
        user_tenant = next((t for t in tenants if t.get('id') == user_tenant_id), None)
        if user_tenant and user_tenant.get('is_hub'):
            # Return all active tenants (including hub and franchises)
            accessible = [t for t in tenants if t.get('is_active', True)]
            return accessible

    # Franchise admin can only access their own franchise
    if user_role == 'franchise_admin':
        user_tenant = next((t for t in tenants if t.get('id') == user_tenant_id), None)
        return [user_tenant] if user_tenant else []

    # All other roles can only access their own tenant
    user_tenant = next((t for t in tenants if t.get('id') == user_tenant_id), None)
    return [user_tenant] if user_tenant else []

def ensure_tenant_id_in_data(data_list, tenant_id):
    """
    Ensure all items in data list have the specified tenant_id.

    Args:
        data_list: List of data items
        tenant_id: Tenant ID to assign

    Returns:
        Updated data list with tenant_id
    """
    for item in data_list:
        if 'tenant_id' not in item:
            item['tenant_id'] = tenant_id
    return data_list

def check_module_access(user, module_code):
    """
    Check if user has access to a specific module based on franchise permissions.

    Args:
        user: Current user object with role and tenant_id
        module_code: Module code to check access for

    Returns:
        Boolean indicating if user has access
    """
    user_role = user.get('role')
    user_tenant_id = user.get('tenant_id')

    # Admin and hub_admin have access to all modules
    if user_role in ['admin', 'hub_admin']:
        return True

    try:
        # Get modules and franchise permissions
        modules = read_data('modules.json')
        permissions = read_data('franchise_permissions.json')

        # Find the module
        module = next((m for m in modules if m['code'] == module_code), None)
        if not module:
            return False

        # Find franchise permissions
        franchise_permission = next(
            (p for p in permissions if p['franchise_id'] == user_tenant_id),
            None
        )

        if not franchise_permission:
            return False

        # Check if module is in allowed permissions
        return module['id'] in franchise_permission['module_permissions']

    except Exception as e:
        print(f"Error checking module access: {str(e)}")
        return False

def require_module_access(module_code):
    """
    Decorator to require specific module access for route access.

    Args:
        module_code: Module code required to access the route

    Returns:
        Decorator function
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(request, 'current_user'):
                return jsonify({'message': 'Authentication required'}), 401

            if not check_module_access(request.current_user, module_code):
                return jsonify({'message': 'Module access denied'}), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_user_accessible_modules(user):
    """
    Get list of modules accessible to the current user.

    Args:
        user: Current user object with role and tenant_id

    Returns:
        List of accessible module objects
    """
    user_role = user.get('role')
    user_tenant_id = user.get('tenant_id')

    try:
        modules = read_data('modules.json')

        # Admin and hub_admin have access to all modules
        if user_role in ['admin', 'hub_admin']:
            return modules

        # Get franchise permissions
        permissions = read_data('franchise_permissions.json')
        franchise_permission = next(
            (p for p in permissions if p['franchise_id'] == user_tenant_id),
            None
        )

        if not franchise_permission:
            return []

        # Filter modules based on permissions
        accessible_modules = [
            m for m in modules
            if m['id'] in franchise_permission['module_permissions']
        ]

        return accessible_modules

    except Exception as e:
        print(f"Error getting user accessible modules: {str(e)}")
        return []
