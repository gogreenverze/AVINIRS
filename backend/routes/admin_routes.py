from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import uuid
import json
import os
import random
from functools import wraps

# Import utilities
from utils import token_required, read_data, write_data, paginate_results

admin_bp = Blueprint('admin', __name__)

# Admin Routes
@admin_bp.route('/api/admin/analytics', methods=['GET'])
@token_required
def get_analytics():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    # Get counts from various data files
    patients = read_data('patients.json')
    samples = read_data('samples.json')
    results = read_data('results.json')
    billings = read_data('billings.json')

    # Calculate monthly revenue
    current_month = datetime.now().strftime('%Y-%m')
    monthly_revenue = sum(
        b.get('total_amount', 0)
        for b in billings
        if b.get('invoice_date', '').startswith(current_month)
    )

    # Get sample type distribution
    sample_types = read_data('sample_types.json')
    sample_type_counts = []

    for sample_type in sample_types:
        count = len([s for s in samples if s.get('sample_type_id') == sample_type.get('id')])
        sample_type_counts.append({
            'id': sample_type.get('id'),
            'type_name': sample_type.get('type_name'),
            'count': count
        })

    # Sort by count (descending)
    sample_type_counts = sorted(sample_type_counts, key=lambda x: x.get('count'), reverse=True)

    # Generate test statistics for the last 30 days
    test_stats = []
    for i in range(30):
        date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        count = len([r for r in results if r.get('created_at', '').startswith(date)])
        test_stats.append({
            'date': date,
            'count': count
        })

    # Reverse to show oldest to newest
    test_stats.reverse()

    # Calculate test count
    test_count = len(results)

    return jsonify({
        'patient_count': len(patients),
        'sample_count': len(samples),
        'test_count': test_count,
        'monthly_revenue': monthly_revenue,
        'sample_types': sample_type_counts,
        'test_stats': test_stats
    })

@admin_bp.route('/api/admin/users', methods=['GET'])
@token_required
def get_users():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin', 'franchise_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    users = read_data('users.json')

    # Apply role-based filtering for users
    current_user_role = request.current_user.get('role')
    current_user_tenant_id = request.current_user.get('tenant_id')

    if current_user_role == 'franchise_admin':
        # Franchise admin can only see users from their own tenant
        users = [u for u in users if u.get('tenant_id') == current_user_tenant_id]
    elif current_user_role == 'hub_admin':
        # Hub admin can see users from all franchises and their own hub
        tenants = read_data('tenants.json')
        user_tenant = next((t for t in tenants if t.get('id') == current_user_tenant_id), None)
        if user_tenant and user_tenant.get('is_hub'):
            franchise_tenant_ids = [t.get('id') for t in tenants if not t.get('is_hub')]
            users = [u for u in users if u.get('tenant_id') in franchise_tenant_ids or u.get('tenant_id') == current_user_tenant_id]

    # Remove passwords from user objects
    for user in users:
        user.pop('password', None)

    # Add tenant information
    tenants = read_data('tenants.json')
    for user in users:
        tenant_id = user.get('tenant_id')
        if tenant_id:
            tenant = next((t for t in tenants if t.get('id') == tenant_id), None)
            if tenant:
                user['tenant'] = {
                    'id': tenant.get('id'),
                    'name': tenant.get('name'),
                    'site_code': tenant.get('site_code')
                }

    return jsonify(users)

@admin_bp.route('/api/admin/users/<int:id>', methods=['GET'])
@token_required
def get_user(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    users = read_data('users.json')
    user = next((u for u in users if u['id'] == id), None)

    if not user:
        return jsonify({'message': 'User not found'}), 404

    # Remove password from user object
    user_copy = user.copy()
    user_copy.pop('password', None)

    # Add tenant information
    tenant_id = user_copy.get('tenant_id')
    if tenant_id:
        tenants = read_data('tenants.json')
        tenant = next((t for t in tenants if t.get('id') == tenant_id), None)
        if tenant:
            user_copy['tenant'] = tenant

    return jsonify(user_copy)

@admin_bp.route('/api/admin/users', methods=['POST'])
@token_required
def create_user():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    # Validate required fields
    required_fields = ['username', 'password', 'email', 'first_name', 'last_name', 'role', 'tenant_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    users = read_data('users.json')

    # Check if username already exists
    if any(u.get('username') == data['username'] for u in users):
        return jsonify({'message': 'Username already exists'}), 400

    # Check if email already exists
    if any(u.get('email') == data['email'] for u in users):
        return jsonify({'message': 'Email already exists'}), 400

    # Generate new user ID
    new_id = 1
    if users:
        new_id = max(u['id'] for u in users) + 1

    # Create new user
    new_user = {
        'id': new_id,
        'username': data['username'],
        'password': data['password'],
        'email': data['email'],
        'first_name': data['first_name'],
        'last_name': data['last_name'],
        'role': data['role'],
        'tenant_id': data['tenant_id'],
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': request.current_user.get('id')
    }

    users.append(new_user)
    write_data('users.json', users)

    # Remove password from response
    new_user_copy = new_user.copy()
    new_user_copy.pop('password', None)

    return jsonify(new_user_copy), 201

@admin_bp.route('/api/admin/users/<int:id>', methods=['PUT'])
@token_required
def update_user(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    users = read_data('users.json')
    user_index = next((i for i, u in enumerate(users) if u['id'] == id), None)

    if user_index is None:
        return jsonify({'message': 'User not found'}), 404

    # Update user fields
    user = users[user_index]

    # Update only provided fields
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            user[key] = value

    user['updated_at'] = datetime.now().isoformat()

    # Save updated users
    write_data('users.json', users)

    # Remove password from response
    user_copy = user.copy()
    user_copy.pop('password', None)

    return jsonify(user_copy)

@admin_bp.route('/api/admin/users/<int:id>', methods=['DELETE'])
@token_required
def delete_user(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    # Prevent deleting self
    if id == request.current_user.get('id'):
        return jsonify({'message': 'Cannot delete your own account'}), 400

    users = read_data('users.json')
    user_index = next((i for i, u in enumerate(users) if u['id'] == id), None)

    if user_index is None:
        return jsonify({'message': 'User not found'}), 404

    # Delete user
    deleted_user = users.pop(user_index)
    write_data('users.json', users)

    return jsonify({'message': 'User deleted successfully'})

@admin_bp.route('/api/admin/franchises', methods=['GET'])
@token_required
def get_franchises():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    tenants = read_data('tenants.json')

    # If hub_admin, only return franchises of the hub
    if request.current_user.get('role') == 'hub_admin':
        tenant_id = request.current_user.get('tenant_id')
        tenant = next((t for t in tenants if t.get('id') == tenant_id), None)

        if tenant and tenant.get('is_hub'):
            # Return all franchises
            franchises = [t for t in tenants if not t.get('is_hub')]
            return jsonify(franchises)

        return jsonify({'message': 'Unauthorized'}), 403

    # If admin, return all franchises
    franchises = [t for t in tenants if not t.get('is_hub')]
    return jsonify(franchises)

@admin_bp.route('/api/admin/franchises/<int:id>', methods=['GET'])
@token_required
def get_franchise(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    tenants = read_data('tenants.json')
    tenant = next((t for t in tenants if t['id'] == id), None)

    if not tenant:
        return jsonify({'message': 'Franchise not found'}), 404

    # If hub_admin, check if franchise belongs to the hub
    if request.current_user.get('role') == 'hub_admin':
        if tenant.get('is_hub'):
            return jsonify({'message': 'Unauthorized'}), 403

    return jsonify(tenant)

@admin_bp.route('/api/admin/settings', methods=['GET'])
@token_required
def get_settings():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    # Default settings structure
    default_settings = {
        'general': {
            'site_name': 'RSAVINI Lab Management',
            'site_logo': '',
            'site_favicon': '',
            'contact_email': 'admin@rsavini.com',
            'contact_phone': '+91-9876543210',
            'address': '123 Lab Street, Medical District, City - 123456',
            'footer_text': '© 2024 RSAVINI Lab Management System',
            'timezone': 'Asia/Kolkata',
            'date_format': 'DD-MM-YYYY',
            'time_format': '12h'
        },
        'email': {
            'smtp_host': '',
            'smtp_port': '587',
            'smtp_username': '',
            'smtp_password': '',
            'smtp_encryption': 'tls',
            'from_email': 'noreply@rsavini.com',
            'from_name': 'RSAVINI Lab'
        },
        'security': {
            'password_min_length': 8,
            'password_expiry_days': 90,
            'max_login_attempts': 5,
            'lockout_time_minutes': 30,
            'session_timeout_minutes': 60,
            'enable_2fa': False
        },
        'lab': {
            'enable_sample_tracking': True,
            'enable_qc': True,
            'default_sample_validity_days': 7,
            'enable_auto_numbering': True,
            'sample_id_prefix': 'SAM',
            'result_id_prefix': 'RES'
        },
        'billing': {
            'enable_gst': True,
            'gst_number': '',
            'default_gst_rate': 18,
            'enable_discount': True,
            'max_discount_percent': 20,
            'invoice_prefix': 'INV',
            'payment_terms_days': 30
        }
    }

    try:
        # Try to read existing settings
        settings = read_data('settings.json')
        if not settings:
            settings = default_settings
    except:
        # If file doesn't exist, use default settings
        settings = default_settings

    return jsonify(settings)

@admin_bp.route('/api/admin/settings', methods=['PUT'])
@token_required
def update_settings():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    try:
        # Save settings to file
        write_data('settings.json', data)
        return jsonify({'message': 'Settings updated successfully'})
    except Exception as e:
        return jsonify({'message': f'Failed to update settings: {str(e)}'}), 500

# Master Data API
@admin_bp.route('/api/admin/master-data', methods=['GET'])
@token_required
def get_master_data():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    try:
        # Get counts and basic info for all master data entities
        doctors = read_data('doctors.json')
        test_categories = read_data('test_categories.json')
        tests = read_data('tests.json')
        test_panels = read_data('test_panels.json')
        containers = read_data('containers.json')
        sample_types = read_data('sample_types.json')

        master_data = {
            'doctors': {
                'count': len(doctors),
                'active_count': len([d for d in doctors if d.get('status') == 'Active']),
                'recent': doctors[:5] if doctors else []
            },
            'test_categories': {
                'count': len(test_categories),
                'active_count': len([tc for tc in test_categories if tc.get('is_active', True)]),
                'recent': test_categories[:5] if test_categories else []
            },
            'tests': {
                'count': len(tests),
                'active_count': len([t for t in tests if t.get('is_active', True)]),
                'recent': tests[:5] if tests else []
            },
            'test_panels': {
                'count': len(test_panels),
                'active_count': len([tp for tp in test_panels if tp.get('is_active', True)]),
                'recent': test_panels[:5] if test_panels else []
            },
            'containers': {
                'count': len(containers),
                'active_count': len([c for c in containers if c.get('is_active', True)]),
                'recent': containers[:5] if containers else []
            },
            'sample_types': {
                'count': len(sample_types),
                'active_count': len([st for st in sample_types if st.get('is_active', True)]),
                'recent': sample_types[:5] if sample_types else []
            }
        }

        return jsonify(master_data)

    except Exception as e:
        return jsonify({'message': f'Failed to load master data: {str(e)}'}), 500

# Doctor Management Routes
@admin_bp.route('/api/admin/doctors', methods=['GET'])
@token_required
def get_doctors():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    doctors = read_data('doctors.json')

    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)

    # Sort by created_at (newest first)
    doctors = sorted(doctors, key=lambda x: x.get('created_at', ''), reverse=True)

    # Paginate results
    paginated_data = paginate_results(doctors, page, per_page)

    return jsonify(paginated_data)

@admin_bp.route('/api/admin/doctors/<int:id>', methods=['GET'])
@token_required
def get_doctor(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    doctors = read_data('doctors.json')
    doctor = next((d for d in doctors if d['id'] == id), None)

    if not doctor:
        return jsonify({'message': 'Doctor not found'}), 404

    return jsonify(doctor)

@admin_bp.route('/api/admin/doctors', methods=['POST'])
@token_required
def create_doctor():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    # Validate required fields
    required_fields = ['first_name', 'last_name', 'phone']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    doctors = read_data('doctors.json')

    # Generate new doctor ID
    new_id = 1
    if doctors:
        new_id = max(d['id'] for d in doctors) + 1

    # Create new doctor
    new_doctor = {
        'id': new_id,
        'first_name': data['first_name'],
        'last_name': data['last_name'],
        'email': data.get('email', ''),
        'phone': data['phone'],
        'specialty': data.get('specialty', ''),
        'qualification': data.get('qualification', ''),
        'license_number': data.get('license_number', ''),
        'address': data.get('address', ''),
        'city': data.get('city', ''),
        'state': data.get('state', ''),
        'pincode': data.get('pincode', ''),
        'status': data.get('status', 'Active'),
        'consultation_fee': data.get('consultation_fee', 0),
        'experience_years': data.get('experience_years', 0),
        'notes': data.get('notes', ''),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': request.current_user.get('id')
    }

    doctors.append(new_doctor)
    write_data('doctors.json', doctors)

    return jsonify(new_doctor), 201

@admin_bp.route('/api/admin/doctors/<int:id>', methods=['PUT'])
@token_required
def update_doctor(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    doctors = read_data('doctors.json')
    doctor_index = next((i for i, d in enumerate(doctors) if d['id'] == id), None)

    if doctor_index is None:
        return jsonify({'message': 'Doctor not found'}), 404

    # Update doctor fields
    doctor = doctors[doctor_index]

    # Update only provided fields
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            doctor[key] = value

    doctor['updated_at'] = datetime.now().isoformat()

    # Save updated doctors
    write_data('doctors.json', doctors)

    return jsonify(doctor)

@admin_bp.route('/api/admin/doctors/<int:id>', methods=['DELETE'])
@token_required
def delete_doctor(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    doctors = read_data('doctors.json')
    doctor_index = next((i for i, d in enumerate(doctors) if d['id'] == id), None)

    if doctor_index is None:
        return jsonify({'message': 'Doctor not found'}), 404

    # Delete doctor
    deleted_doctor = doctors.pop(doctor_index)
    write_data('doctors.json', doctors)

    return jsonify({'message': 'Doctor deleted successfully'})

# Test Category Management Routes
@admin_bp.route('/api/admin/test-categories', methods=['GET'])
@token_required
def get_test_categories():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    categories = read_data('test_categories.json')

    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)

    # Sort by created_at (newest first)
    categories = sorted(categories, key=lambda x: x.get('created_at', ''), reverse=True)

    # Paginate results
    paginated_data = paginate_results(categories, page, per_page)

    return jsonify(paginated_data)

@admin_bp.route('/api/admin/test-categories/<int:id>', methods=['GET'])
@token_required
def get_test_category(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    categories = read_data('test_categories.json')
    category = next((c for c in categories if c['id'] == id), None)

    if not category:
        return jsonify({'message': 'Test category not found'}), 404

    return jsonify(category)

@admin_bp.route('/api/admin/test-categories', methods=['POST'])
@token_required
def create_test_category():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    # Validate required fields
    required_fields = ['name', 'code']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    categories = read_data('test_categories.json')

    # Check if code already exists
    if any(c.get('code') == data['code'].upper() for c in categories):
        return jsonify({'message': 'Category code already exists'}), 400

    # Generate new category ID
    new_id = 1
    if categories:
        new_id = max(c['id'] for c in categories) + 1

    # Create new category
    new_category = {
        'id': new_id,
        'name': data['name'],
        'code': data['code'].upper(),
        'description': data.get('description', ''),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': request.current_user.get('id')
    }

    categories.append(new_category)
    write_data('test_categories.json', categories)

    return jsonify(new_category), 201

@admin_bp.route('/api/admin/test-categories/<int:id>', methods=['PUT'])
@token_required
def update_test_category(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    categories = read_data('test_categories.json')
    category_index = next((i for i, c in enumerate(categories) if c['id'] == id), None)

    if category_index is None:
        return jsonify({'message': 'Test category not found'}), 404

    # Update category fields
    category = categories[category_index]

    # Update only provided fields
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            if key == 'code':
                category[key] = value.upper()
            else:
                category[key] = value

    category['updated_at'] = datetime.now().isoformat()

    # Save updated categories
    write_data('test_categories.json', categories)

    return jsonify(category)

@admin_bp.route('/api/admin/test-categories/<int:id>', methods=['DELETE'])
@token_required
def delete_test_category(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    categories = read_data('test_categories.json')
    category_index = next((i for i, c in enumerate(categories) if c['id'] == id), None)

    if category_index is None:
        return jsonify({'message': 'Test category not found'}), 404

    # Delete category
    deleted_category = categories.pop(category_index)
    write_data('test_categories.json', categories)

    return jsonify({'message': 'Test category deleted successfully'})

# Test Management Routes
@admin_bp.route('/api/admin/tests', methods=['GET'])
@token_required
def get_tests():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    tests = read_data('tests.json')

    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)

    # Sort by created_at (newest first)
    tests = sorted(tests, key=lambda x: x.get('created_at', ''), reverse=True)

    # Add category information
    categories = read_data('test_categories.json')
    for test in tests:
        category_id = test.get('category_id')
        if category_id:
            category = next((c for c in categories if c.get('id') == category_id), None)
            if category:
                test['category'] = {
                    'id': category.get('id'),
                    'name': category.get('name'),
                    'code': category.get('code')
                }

    # Paginate results
    paginated_data = paginate_results(tests, page, per_page)

    return jsonify(paginated_data)

@admin_bp.route('/api/admin/tests/<int:id>', methods=['GET'])
@token_required
def get_test(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    tests = read_data('tests.json')
    test = next((t for t in tests if t['id'] == id), None)

    if not test:
        return jsonify({'message': 'Test not found'}), 404

    # Add category information
    category_id = test.get('category_id')
    if category_id:
        categories = read_data('test_categories.json')
        category = next((c for c in categories if c.get('id') == category_id), None)
        if category:
            test['category'] = category

    return jsonify(test)

@admin_bp.route('/api/admin/tests', methods=['POST'])
@token_required
def create_test():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    # Validate required fields
    required_fields = ['test_name', 'test_code', 'category_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    tests = read_data('tests.json')

    # Check if test code already exists
    if any(t.get('test_code') == data['test_code'].upper() for t in tests):
        return jsonify({'message': 'Test code already exists'}), 400

    # Generate new test ID
    new_id = 1
    if tests:
        new_id = max(t['id'] for t in tests) + 1

    # Create new test
    new_test = {
        'id': new_id,
        'test_name': data['test_name'],
        'test_code': data['test_code'].upper(),
        'category_id': data['category_id'],
        'price': data.get('price', 0),
        'normal_range': data.get('normal_range', ''),
        'unit': data.get('unit', ''),
        'method': data.get('method', ''),
        'sample_type': data.get('sample_type', ''),
        'turnaround_time': data.get('turnaround_time', ''),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': request.current_user.get('id')
    }

    tests.append(new_test)
    write_data('tests.json', tests)

    return jsonify(new_test), 201

@admin_bp.route('/api/admin/tests/<int:id>', methods=['PUT'])
@token_required
def update_test(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    tests = read_data('tests.json')
    test_index = next((i for i, t in enumerate(tests) if t['id'] == id), None)

    if test_index is None:
        return jsonify({'message': 'Test not found'}), 404

    # Update test fields
    test = tests[test_index]

    # Update only provided fields
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            if key == 'test_code':
                test[key] = value.upper()
            else:
                test[key] = value

    test['updated_at'] = datetime.now().isoformat()

    # Save updated tests
    write_data('tests.json', tests)

    return jsonify(test)

@admin_bp.route('/api/admin/tests/<int:id>', methods=['DELETE'])
@token_required
def delete_test(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    tests = read_data('tests.json')
    test_index = next((i for i, t in enumerate(tests) if t['id'] == id), None)

    if test_index is None:
        return jsonify({'message': 'Test not found'}), 404

    # Delete test
    deleted_test = tests.pop(test_index)
    write_data('tests.json', tests)

    return jsonify({'message': 'Test deleted successfully'})

# Test Panel Management Routes
@admin_bp.route('/api/admin/test-panels', methods=['GET'])
@token_required
def get_test_panels():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    panels = read_data('test_panels.json')

    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)

    # Sort by created_at (newest first)
    panels = sorted(panels, key=lambda x: x.get('created_at', ''), reverse=True)

    # Add test information
    tests = read_data('tests.json')
    for panel in panels:
        test_ids = panel.get('test_ids', [])
        if test_ids:
            panel_tests = [t for t in tests if t.get('id') in test_ids]
            panel['tests'] = panel_tests

    # Paginate results
    paginated_data = paginate_results(panels, page, per_page)

    return jsonify(paginated_data)

@admin_bp.route('/api/admin/test-panels', methods=['POST'])
@token_required
def create_test_panel():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    # Validate required fields
    required_fields = ['name', 'code']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    panels = read_data('test_panels.json')

    # Check if code already exists
    if any(p.get('code') == data['code'].upper() for p in panels):
        return jsonify({'message': 'Panel code already exists'}), 400

    # Generate new panel ID
    new_id = 1
    if panels:
        new_id = max(p['id'] for p in panels) + 1

    # Create new panel
    new_panel = {
        'id': new_id,
        'name': data['name'],
        'code': data['code'].upper(),
        'description': data.get('description', ''),
        'price': data.get('price', 0),
        'test_ids': data.get('test_ids', []),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': request.current_user.get('id')
    }

    panels.append(new_panel)
    write_data('test_panels.json', panels)

    return jsonify(new_panel), 201

@admin_bp.route('/api/admin/test-panels/<int:id>', methods=['PUT'])
@token_required
def update_test_panel(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    panels = read_data('test_panels.json')
    panel_index = next((i for i, p in enumerate(panels) if p['id'] == id), None)

    if panel_index is None:
        return jsonify({'message': 'Test panel not found'}), 404

    # Update panel fields
    panel = panels[panel_index]

    # Update only provided fields
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            if key == 'code':
                panel[key] = value.upper()
            else:
                panel[key] = value

    panel['updated_at'] = datetime.now().isoformat()

    # Save updated panels
    write_data('test_panels.json', panels)

    return jsonify(panel)

@admin_bp.route('/api/admin/test-panels/<int:id>', methods=['DELETE'])
@token_required
def delete_test_panel(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    panels = read_data('test_panels.json')
    panel_index = next((i for i, p in enumerate(panels) if p['id'] == id), None)

    if panel_index is None:
        return jsonify({'message': 'Test panel not found'}), 404

    # Delete panel
    deleted_panel = panels.pop(panel_index)
    write_data('test_panels.json', panels)

    return jsonify({'message': 'Test panel deleted successfully'})

# Container Management Routes
@admin_bp.route('/api/admin/containers', methods=['GET'])
@token_required
def get_containers():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    containers = read_data('containers.json')

    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)

    # Sort by created_at (newest first)
    containers = sorted(containers, key=lambda x: x.get('created_at', ''), reverse=True)

    # Paginate results
    paginated_data = paginate_results(containers, page, per_page)

    return jsonify(paginated_data)

@admin_bp.route('/api/admin/containers', methods=['POST'])
@token_required
def create_container():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    # Validate required fields
    required_fields = ['name', 'code']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    containers = read_data('containers.json')

    # Check if code already exists
    if any(c.get('code') == data['code'].upper() for c in containers):
        return jsonify({'message': 'Container code already exists'}), 400

    # Generate new container ID
    new_id = 1
    if containers:
        new_id = max(c['id'] for c in containers) + 1

    # Create new container
    new_container = {
        'id': new_id,
        'name': data['name'],
        'code': data['code'].upper(),
        'description': data.get('description', ''),
        'volume': data.get('volume', ''),
        'color': data.get('color', ''),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': request.current_user.get('id')
    }

    containers.append(new_container)
    write_data('containers.json', containers)

    return jsonify(new_container), 201

@admin_bp.route('/api/admin/containers/<int:id>', methods=['PUT'])
@token_required
def update_container(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    containers = read_data('containers.json')
    container_index = next((i for i, c in enumerate(containers) if c['id'] == id), None)

    if container_index is None:
        return jsonify({'message': 'Container not found'}), 404

    # Update container fields
    container = containers[container_index]

    # Update only provided fields
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            if key == 'code':
                container[key] = value.upper()
            else:
                container[key] = value

    container['updated_at'] = datetime.now().isoformat()

    # Save updated containers
    write_data('containers.json', containers)

    return jsonify(container)

@admin_bp.route('/api/admin/containers/<int:id>', methods=['DELETE'])
@token_required
def delete_container(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    containers = read_data('containers.json')
    container_index = next((i for i, c in enumerate(containers) if c['id'] == id), None)

    if container_index is None:
        return jsonify({'message': 'Container not found'}), 404

    # Delete container
    deleted_container = containers.pop(container_index)
    write_data('containers.json', containers)

    return jsonify({'message': 'Container deleted successfully'})

# Role Management Routes
@admin_bp.route('/api/admin/roles', methods=['GET'])
@token_required
def get_roles():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    roles = read_data('roles.json')

    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)

    # Sort by created_at (newest first)
    roles = sorted(roles, key=lambda x: x.get('created_at', ''), reverse=True)

    # Add permission information
    permissions = read_data('permissions.json')
    for role in roles:
        permission_ids = role.get('permission_ids', [])
        if permission_ids:
            role_permissions = [p for p in permissions if p.get('id') in permission_ids]
            role['permissions'] = role_permissions

    # Paginate results
    paginated_data = paginate_results(roles, page, per_page)

    return jsonify(paginated_data)

@admin_bp.route('/api/admin/roles', methods=['POST'])
@token_required
def create_role():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    # Validate required fields
    required_fields = ['name', 'code']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    roles = read_data('roles.json')

    # Check if code already exists
    if any(r.get('code') == data['code'].upper() for r in roles):
        return jsonify({'message': 'Role code already exists'}), 400

    # Generate new role ID
    new_id = 1
    if roles:
        new_id = max(r['id'] for r in roles) + 1

    # Create new role
    new_role = {
        'id': new_id,
        'name': data['name'],
        'code': data['code'].upper(),
        'description': data.get('description', ''),
        'permission_ids': data.get('permission_ids', []),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': request.current_user.get('id')
    }

    roles.append(new_role)
    write_data('roles.json', roles)

    return jsonify(new_role), 201

@admin_bp.route('/api/admin/roles/<int:id>', methods=['PUT'])
@token_required
def update_role(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    roles = read_data('roles.json')
    role_index = next((i for i, r in enumerate(roles) if r['id'] == id), None)

    if role_index is None:
        return jsonify({'message': 'Role not found'}), 404

    # Update role fields
    role = roles[role_index]

    # Update only provided fields
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            if key == 'code':
                role[key] = value.upper()
            else:
                role[key] = value

    role['updated_at'] = datetime.now().isoformat()

    # Save updated roles
    write_data('roles.json', roles)

    return jsonify(role)

@admin_bp.route('/api/admin/roles/<int:id>', methods=['DELETE'])
@token_required
def delete_role(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    roles = read_data('roles.json')
    role_index = next((i for i, r in enumerate(roles) if r['id'] == id), None)

    if role_index is None:
        return jsonify({'message': 'Role not found'}), 404

    # Delete role
    deleted_role = roles.pop(role_index)
    write_data('roles.json', roles)

    return jsonify({'message': 'Role deleted successfully'})

# Permission Management Routes
@admin_bp.route('/api/admin/permissions', methods=['GET'])
@token_required
def get_permissions():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    permissions = read_data('permissions.json')

    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)

    # Sort by created_at (newest first)
    permissions = sorted(permissions, key=lambda x: x.get('created_at', ''), reverse=True)

    # Paginate results
    paginated_data = paginate_results(permissions, page, per_page)

    return jsonify(paginated_data)

@admin_bp.route('/api/admin/permissions', methods=['POST'])
@token_required
def create_permission():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    # Validate required fields
    required_fields = ['name', 'code']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    permissions = read_data('permissions.json')

    # Check if code already exists
    if any(p.get('code') == data['code'].upper() for p in permissions):
        return jsonify({'message': 'Permission code already exists'}), 400

    # Generate new permission ID
    new_id = 1
    if permissions:
        new_id = max(p['id'] for p in permissions) + 1

    # Create new permission
    new_permission = {
        'id': new_id,
        'name': data['name'],
        'code': data['code'].upper(),
        'description': data.get('description', ''),
        'module': data.get('module', ''),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': request.current_user.get('id')
    }

    permissions.append(new_permission)
    write_data('permissions.json', permissions)

    return jsonify(new_permission), 201

@admin_bp.route('/api/admin/permissions/<int:id>', methods=['PUT'])
@token_required
def update_permission(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    permissions = read_data('permissions.json')
    permission_index = next((i for i, p in enumerate(permissions) if p['id'] == id), None)

    if permission_index is None:
        return jsonify({'message': 'Permission not found'}), 404

    # Update permission fields
    permission = permissions[permission_index]

    # Update only provided fields
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            if key == 'code':
                permission[key] = value.upper()
            else:
                permission[key] = value

    permission['updated_at'] = datetime.now().isoformat()

    # Save updated permissions
    write_data('permissions.json', permissions)

    return jsonify(permission)

@admin_bp.route('/api/admin/permissions/<int:id>', methods=['DELETE'])
@token_required
def delete_permission(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    permissions = read_data('permissions.json')
    permission_index = next((i for i, p in enumerate(permissions) if p['id'] == id), None)

    if permission_index is None:
        return jsonify({'message': 'Permission not found'}), 404

    # Delete permission
    deleted_permission = permissions.pop(permission_index)
    write_data('permissions.json', permissions)

    return jsonify({'message': 'Permission deleted successfully'})

# Franchise Management Routes
@admin_bp.route('/api/admin/franchises', methods=['POST'])
@token_required
def create_franchise():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    # Validate required fields
    required_fields = ['name', 'site_code', 'contact_phone']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    franchises = read_data('franchises.json')

    # Check if site code already exists
    if any(f.get('site_code') == data['site_code'].upper() for f in franchises):
        return jsonify({'message': 'Site code already exists'}), 400

    # Generate new franchise ID
    new_id = 1
    if franchises:
        new_id = max(f['id'] for f in franchises) + 1

    # Create new franchise
    new_franchise = {
        'id': new_id,
        'name': data['name'],
        'site_code': data['site_code'].upper(),
        'address': data.get('address', ''),
        'city': data.get('city', ''),
        'state': data.get('state', 'Tamil Nadu'),
        'pincode': data.get('pincode', ''),
        'contact_phone': data['contact_phone'],
        'email': data.get('email', ''),
        'license_number': data.get('license_number', ''),
        'established_date': data.get('established_date', ''),
        'is_hub': data.get('is_hub', False),
        'is_active': data.get('is_active', True),
        'franchise_fee': data.get('franchise_fee', 0),
        'monthly_fee': data.get('monthly_fee', 0),
        'commission_rate': data.get('commission_rate', 0),
        'contact_person': data.get('contact_person', ''),
        'contact_person_phone': data.get('contact_person_phone', ''),
        'notes': data.get('notes', ''),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': request.current_user.get('id')
    }

    franchises.append(new_franchise)
    write_data('franchises.json', franchises)

    return jsonify(new_franchise), 201

# Sample Type Management Routes
@admin_bp.route('/api/admin/sample-types', methods=['GET'])
@token_required
def get_sample_types():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    sample_types = read_data('sample_types.json')

    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)

    # Sort by created_at (newest first)
    sample_types = sorted(sample_types, key=lambda x: x.get('created_at', ''), reverse=True)

    # Paginate results
    paginated_data = paginate_results(sample_types, page, per_page)

    return jsonify(paginated_data)

@admin_bp.route('/api/admin/sample-types', methods=['POST'])
@token_required
def create_sample_type():
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    # Validate required fields
    required_fields = ['type_name', 'type_code']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    sample_types = read_data('sample_types.json')

    # Check if code already exists
    if any(st.get('type_code') == data['type_code'].upper() for st in sample_types):
        return jsonify({'message': 'Sample type code already exists'}), 400

    # Generate new sample type ID
    new_id = 1
    if sample_types:
        new_id = max(st['id'] for st in sample_types) + 1

    # Create new sample type
    new_sample_type = {
        'id': new_id,
        'type_name': data['type_name'],
        'type_code': data['type_code'].upper(),
        'description': data.get('description', ''),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': request.current_user.get('id')
    }

    sample_types.append(new_sample_type)
    write_data('sample_types.json', sample_types)

    return jsonify(new_sample_type), 201

@admin_bp.route('/api/admin/sample-types/<int:id>', methods=['PUT'])
@token_required
def update_sample_type(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    sample_types = read_data('sample_types.json')
    sample_type_index = next((i for i, st in enumerate(sample_types) if st['id'] == id), None)

    if sample_type_index is None:
        return jsonify({'message': 'Sample type not found'}), 404

    # Update sample type fields
    sample_type = sample_types[sample_type_index]

    # Update only provided fields
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            if key == 'type_code':
                sample_type[key] = value.upper()
            else:
                sample_type[key] = value

    sample_type['updated_at'] = datetime.now().isoformat()

    # Save updated sample types
    write_data('sample_types.json', sample_types)

    return jsonify(sample_type)

@admin_bp.route('/api/admin/sample-types/<int:id>', methods=['DELETE'])
@token_required
def delete_sample_type(id):
    # Check if user has admin privileges
    if request.current_user.get('role') not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    sample_types = read_data('sample_types.json')
    sample_type_index = next((i for i, st in enumerate(sample_types) if st['id'] == id), None)

    if sample_type_index is None:
        return jsonify({'message': 'Sample type not found'}), 404

    # Delete sample type
    deleted_sample_type = sample_types.pop(sample_type_index)
    write_data('sample_types.json', sample_types)

    return jsonify({'message': 'Sample type deleted successfully'})
