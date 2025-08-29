from flask import Blueprint, request, jsonify
from datetime import datetime
from utils import read_data, write_data, token_required, require_role

# Create blueprint for access management routes
access_management_bp = Blueprint('access_management', __name__)

# Get all available modules
@access_management_bp.route('/api/access-management/modules', methods=['GET'])
@token_required
@require_role(['admin', 'hub_admin'])
def get_available_modules():
    """Get all available modules that can be assigned to franchises"""
    try:
        modules = read_data('modules.json')
        return jsonify({
            'success': True,
            'data': modules
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching modules: {str(e)}'
        }), 500

# Get franchise permissions
@access_management_bp.route('/api/access-management/franchise-permissions', methods=['GET'])
@token_required
@require_role(['admin', 'hub_admin'])
def get_franchise_permissions():
    """Get all franchise permissions or specific franchise permissions"""
    try:
        franchise_id = request.args.get('franchise_id')
        permissions = read_data('franchise_permissions.json')
        
        if franchise_id:
            # Get permissions for specific franchise
            franchise_permissions = next(
                (p for p in permissions if p['franchise_id'] == int(franchise_id)), 
                None
            )
            if not franchise_permissions:
                return jsonify({
                    'success': False,
                    'message': 'Franchise permissions not found'
                }), 404
            return jsonify({
                'success': True,
                'data': franchise_permissions
            }), 200
        else:
            # Get all franchise permissions
            return jsonify({
                'success': True,
                'data': permissions
            }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching franchise permissions: {str(e)}'
        }), 500

# Update franchise permissions
@access_management_bp.route('/api/access-management/franchise-permissions/<int:franchise_id>', methods=['PUT'])
@token_required
@require_role(['admin', 'hub_admin'])
def update_franchise_permissions(franchise_id):
    """Update permissions for a specific franchise"""
    try:
        data = request.get_json()
        
        if not data or 'module_permissions' not in data:
            return jsonify({
                'success': False,
                'message': 'Module permissions are required'
            }), 400
        
        # Validate module permissions
        modules = read_data('modules.json')
        valid_module_ids = [m['id'] for m in modules]
        
        for module_id in data['module_permissions']:
            if module_id not in valid_module_ids:
                return jsonify({
                    'success': False,
                    'message': f'Invalid module ID: {module_id}'
                }), 400
        
        # Get current permissions
        permissions = read_data('franchise_permissions.json')
        
        # Find and update the franchise permissions
        franchise_permission = None
        for i, p in enumerate(permissions):
            if p['franchise_id'] == franchise_id:
                franchise_permission = p
                permissions[i]['module_permissions'] = data['module_permissions']
                permissions[i]['updated_at'] = datetime.now().isoformat()
                permissions[i]['updated_by'] = request.current_user.get('id')
                break
        
        if not franchise_permission:
            # Create new permission entry if it doesn't exist
            tenants = read_data('tenants.json')
            franchise = next((t for t in tenants if t['id'] == franchise_id), None)
            
            if not franchise:
                return jsonify({
                    'success': False,
                    'message': 'Franchise not found'
                }), 404
            
            new_id = max([p['id'] for p in permissions], default=0) + 1
            new_permission = {
                'id': new_id,
                'franchise_id': franchise_id,
                'franchise_name': franchise['name'],
                'module_permissions': data['module_permissions'],
                'is_hub': franchise.get('is_hub', False),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat(),
                'created_by': request.current_user.get('id'),
                'updated_by': request.current_user.get('id')
            }
            permissions.append(new_permission)
        
        # Save updated permissions
        write_data('franchise_permissions.json', permissions)
        
        return jsonify({
            'success': True,
            'message': 'Franchise permissions updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error updating franchise permissions: {str(e)}'
        }), 500

# Get franchises with their current permissions
@access_management_bp.route('/api/access-management/franchises-with-permissions', methods=['GET'])
@token_required
@require_role(['admin', 'hub_admin'])
def get_franchises_with_permissions():
    """Get all franchises with their current module permissions"""
    try:
        tenants = read_data('tenants.json')
        permissions = read_data('franchise_permissions.json')
        modules = read_data('modules.json')
        
        # Create a mapping of franchise permissions
        permission_map = {p['franchise_id']: p for p in permissions}
        
        # Combine franchise data with permissions
        result = []
        for tenant in tenants:
            franchise_permissions = permission_map.get(tenant['id'], {})
            
            # Get module details for assigned permissions
            assigned_modules = []
            if 'module_permissions' in franchise_permissions:
                for module_id in franchise_permissions['module_permissions']:
                    module = next((m for m in modules if m['id'] == module_id), None)
                    if module:
                        assigned_modules.append(module)
            
            result.append({
                'franchise': tenant,
                'permissions': franchise_permissions,
                'assigned_modules': assigned_modules
            })
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching franchises with permissions: {str(e)}'
        }), 500

# Get current user's franchise permissions (for franchise admins)
@access_management_bp.route('/api/access-management/my-permissions', methods=['GET'])
@token_required
def get_my_permissions():
    """Get current user's franchise permissions - accessible by franchise admins"""
    try:
        user = request.current_user
        user_role = user.get('role')
        user_tenant_id = user.get('tenant_id')

        # This endpoint is specifically for franchise users to get their own permissions
        # Admin and hub_admin should use the regular endpoints
        if user_role in ['admin', 'hub_admin']:
            return jsonify({
                'success': False,
                'message': 'Admin users should use the regular permissions endpoint'
            }), 400

        # Get franchise permissions
        permissions = read_data('franchise_permissions.json')

        # Find franchise permissions for current user's tenant
        franchise_permission = next(
            (p for p in permissions if p['franchise_id'] == user_tenant_id),
            None
        )

        if not franchise_permission:
            return jsonify({
                'success': True,
                'data': {
                    'franchise_id': user_tenant_id,
                    'module_permissions': [],
                    'message': 'No permissions configured for this franchise'
                }
            }), 200

        return jsonify({
            'success': True,
            'data': franchise_permission
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching user permissions: {str(e)}'
        }), 500

# Get modules accessible to current user (for franchise admins)
@access_management_bp.route('/api/access-management/my-modules', methods=['GET'])
@token_required
def get_my_modules():
    """Get modules accessible to current user - accessible by franchise admins"""
    try:
        user = request.current_user
        user_role = user.get('role')
        user_tenant_id = user.get('tenant_id')

        print(f"[MY-MODULES] Request from user: {user.get('username')} (role: {user_role}, tenant_id: {user_tenant_id})")

        # Admin and hub_admin have access to all modules
        if user_role in ['admin', 'hub_admin']:
            print(f"[MY-MODULES] Admin user detected, returning all modules")
            modules = read_data('modules.json')
            return jsonify({
                'success': True,
                'data': modules
            }), 200

        # For franchise users, get their accessible modules
        modules = read_data('modules.json')
        permissions = read_data('franchise_permissions.json')

        print(f"[MY-MODULES] Looking for permissions for franchise_id: {user_tenant_id}")

        # Find franchise permissions
        franchise_permission = next(
            (p for p in permissions if p['franchise_id'] == user_tenant_id),
            None
        )

        if not franchise_permission:
            print(f"[MY-MODULES] No permissions found for franchise_id: {user_tenant_id}")
            return jsonify({
                'success': True,
                'data': []
            }), 200

        print(f"[MY-MODULES] Found permissions: {franchise_permission['module_permissions']}")

        # Filter modules based on permissions
        accessible_modules = [
            m for m in modules
            if m['id'] in franchise_permission['module_permissions']
        ]

        print(f"[MY-MODULES] Returning {len(accessible_modules)} accessible modules")

        return jsonify({
            'success': True,
            'data': accessible_modules
        }), 200

    except Exception as e:
        print(f"[MY-MODULES] Error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error fetching user modules: {str(e)}'
        }), 500

# Check if user has access to a specific module
@access_management_bp.route('/api/access-management/check-module-access/<module_code>', methods=['GET'])
@token_required
def check_module_access(module_code):
    """Check if current user has access to a specific module"""
    try:
        user = request.current_user
        user_role = user.get('role')
        user_tenant_id = user.get('tenant_id')

        # Admin and hub_admin have access to all modules
        if user_role in ['admin', 'hub_admin']:
            return jsonify({
                'success': True,
                'has_access': True,
                'message': 'Admin access granted'
            }), 200

        # Get modules and franchise permissions
        modules = read_data('modules.json')
        permissions = read_data('franchise_permissions.json')

        # Find the module
        module = next((m for m in modules if m['code'] == module_code), None)
        if not module:
            return jsonify({
                'success': False,
                'message': 'Module not found'
            }), 404

        # Find franchise permissions
        franchise_permission = next(
            (p for p in permissions if p['franchise_id'] == user_tenant_id),
            None
        )

        if not franchise_permission:
            return jsonify({
                'success': True,
                'has_access': False,
                'message': 'No permissions configured for franchise'
            }), 200
        
        # Check if module is in allowed permissions
        has_access = module['id'] in franchise_permission['module_permissions']
        
        return jsonify({
            'success': True,
            'has_access': has_access,
            'message': 'Access granted' if has_access else 'Access denied'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error checking module access: {str(e)}'
        }), 500
