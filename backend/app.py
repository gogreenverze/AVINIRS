from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from datetime import datetime, timedelta
import uuid
import random
import os
import json
from utils import generate_token, token_required, read_data, write_data, paginate_results

app = Flask(__name__)
CORS(app)

# Import routes
from routes.patient_routes import patient_bp
from routes.sample_routes import sample_bp
from routes.result_routes import result_bp
from routes.billing_routes import billing_bp
from routes.admin_routes import admin_bp
from routes.inventory_routes import inventory_bp
from routes.whatsapp_routes import whatsapp_bp

# Load mock data
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

# Initialize data files if they don't exist
def init_data_file(filename, initial_data=None):
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        with open(filepath, 'w') as f:
            json.dump(initial_data or [], f)

# Initialize all data files
init_data_file('users.json', [
    {
        "id": 1,
        "username": "admin",
        "password": "admin123",
        "email": "admin@example.com",
        "first_name": "Admin",
        "last_name": "User",
        "role": "admin",
        "tenant_id": 1,
        "is_active": True
    }
])
init_data_file('tenants.json', [
    {
        "id": 1,
        "name": "AVINI Labs Chennai",
        "site_code": "CHN",
        "address": "123 Anna Salai, Chennai, Tamil Nadu",
        "contact_phone": "9876543210",
        "is_hub": True,
        "is_active": True
    }
])
init_data_file('patients.json', [])
init_data_file('samples.json', [])
init_data_file('results.json', [])
init_data_file('billings.json', [])
init_data_file('sample_types.json', [])
init_data_file('containers.json', [])
init_data_file('tests.json', [])
init_data_file('test_panels.json', [])
init_data_file('doctors.json', [])
init_data_file('inventory.json', [])
init_data_file('settings.json', {})
init_data_file('whatsapp_config.json', [])
init_data_file('whatsapp_messages.json', [])

# Helper functions are now imported from utils.py

# Routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    users = read_data('users.json')
    user = next((user for user in users if user['username'] == username and user['password'] == password), None)

    if not user:
        return jsonify({'message': 'Invalid credentials'}), 401

    token = generate_token(user['id'])

    # Remove password from user object
    user_copy = user.copy()
    user_copy.pop('password', None)

    return jsonify({
        'token': token,
        'user': user_copy
    })



@app.route('/api/auth/user', methods=['GET'])
@token_required
def get_current_user():
    # Remove password from user object
    user_copy = request.current_user.copy()
    user_copy.pop('password', None)

    return jsonify(user_copy)

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    # For JWT, logout is handled client-side by removing the token
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/tenants/current', methods=['GET'])
@token_required
def get_current_tenant():
    tenant_id = request.current_user.get('tenant_id')

    if not tenant_id:
        return jsonify({'message': 'User not associated with any tenant'}), 404

    tenants = read_data('tenants.json')
    tenant = next((tenant for tenant in tenants if tenant['id'] == tenant_id), None)

    if not tenant:
        return jsonify({'message': 'Tenant not found'}), 404

    return jsonify(tenant)

@app.route('/api/tenants/accessible', methods=['GET'])
@token_required
def get_accessible_tenants():
    user_role = request.current_user.get('role')

    if user_role not in ['admin', 'hub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403

    tenants = read_data('tenants.json')

    # If hub_admin, only return franchises of the hub
    if user_role == 'hub_admin':
        tenant_id = request.current_user.get('tenant_id')
        tenant = next((t for t in tenants if t['id'] == tenant_id), None)

        if tenant and tenant.get('is_hub'):
            # Return all franchises
            franchises = [t for t in tenants if not t.get('is_hub')]
            return jsonify(franchises)

    # If admin, return all tenants
    return jsonify(tenants)

@app.route('/api/dashboard', methods=['GET'])
@token_required
def get_dashboard_data():
    # Get counts from various data files
    patients = read_data('patients.json')
    samples = read_data('samples.json')
    results = read_data('results.json')
    billings = read_data('billings.json')

    # Calculate today's date for filtering
    today = datetime.now().strftime('%Y-%m-%d')

    # Get pending orders (samples without results)
    pending_orders = len([s for s in samples if not any(r for r in results if r.get('sample_id') == s.get('id'))])

    # Get today's patients
    today_patients = len([p for p in patients if p.get('created_at', '').startswith(today)])

    # Get pending results
    pending_results = len([r for r in results if r.get('status') == 'Pending'])

    # Mock low stock items
    low_stock_items = random.randint(1, 5)

    # Get recent orders (samples)
    recent_orders = sorted(samples, key=lambda x: x.get('created_at', ''), reverse=True)[:5]

    # Add patient info to recent orders
    for order in recent_orders:
        patient_id = order.get('patient_id')
        if patient_id:
            patient = next((p for p in patients if p.get('id') == patient_id), None)
            if patient:
                order['patient'] = {
                    'id': patient.get('id'),
                    'first_name': patient.get('first_name'),
                    'last_name': patient.get('last_name')
                }

    # Generate daily tests data for the last 7 days
    daily_tests = []
    for i in range(7):
        date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        count = random.randint(10, 50)
        daily_tests.append({
            'date': date,
            'count': count
        })

    # Reverse to show oldest to newest
    daily_tests.reverse()

    return jsonify({
        'pendingOrders': pending_orders,
        'todayPatients': today_patients,
        'pendingResults': pending_results,
        'lowStockItems': low_stock_items,
        'recentOrders': recent_orders,
        'dailyTests': daily_tests
    })

# Register blueprints
app.register_blueprint(patient_bp)
app.register_blueprint(sample_bp)
app.register_blueprint(result_bp)
app.register_blueprint(billing_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(inventory_bp)
app.register_blueprint(whatsapp_bp)

# Start the server
if __name__ == '__main__':
    app.run(debug=True, port=5001)
