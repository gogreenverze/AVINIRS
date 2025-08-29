from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from datetime import datetime, timedelta
import uuid
import random
import os
from flask import send_from_directory


import json
from utils import generate_token, verify_token, token_required, read_data, write_data, paginate_results




app = Flask(__name__)

CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))   # backend/
DATA_DIR = os.path.join(BASE_DIR, "data")              # backend/data
os.makedirs(DATA_DIR, exist_ok=True)

# JSON file lives inside backend/data
JSON_FILE = os.path.join(DATA_DIR, "profiles.json")


# Configure CORS with specific settings
CORS(app,
     origins=['http://localhost:3001', 'http://localhost:3000'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True)

# Add a global OPTIONS handler for preflight requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response

# Import routes
from routes.patient_routes import patient_bp
from routes.sample_routes import sample_bp
from routes.result_routes import result_bp
from routes.billing_routes import billing_bp
from routes.admin_routes import admin_bp
from routes.inventory_routes import inventory_bp
from routes.whatsapp_routes import whatsapp_bp
from routes.sample_routing_routes import sample_routing_bp
from routes.chat_routes import chat_bp
from routes.file_routes import file_bp
from routes.notification_routes import notification_bp
from routes.invoice_routes import invoice_bp

from routes.tenants import tenants_bp  # assuming your code is in tenants_api.py
from routes.billing_reports_routes import billing_reports_bp
from routes.access_management_routes import access_management_bp

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
        "name": "AVINI Labs Mayiladuthurai",
        "site_code": "MYD",
        "address": "Main Hub, Mayiladuthurai, Tamil Nadu",
        "contact_phone": "6384440505",
        "email": "info@avinilabs.com",
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
init_data_file('sample_routings.json', [])
init_data_file('workflow_instances.json', [])
init_data_file('routing_messages.json', [])
init_data_file('routing_files.json', [])
init_data_file('notifications.json', [])
init_data_file('billing_reports.json', [])

# Helper functions are now imported from utils.py



@app.route('/signature.jpeg')
def serve_signature():
    return send_from_directory('public', 'signature.jpeg')


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

@app.route('/api/auth/refresh', methods=['POST'])
def refresh_token():
    """Refresh an existing JWT token"""
    auth_header = request.headers.get('Authorization')

    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'message': 'Token is missing'}), 401

    token = auth_header.split(' ')[1]
    payload = verify_token(token)

    if not payload:
        return jsonify({'message': 'Invalid or expired token'}), 401

    user_id = payload['sub']

    # Verify user still exists and is active
    users = read_data('users.json')
    user = None
    for u in users:
        # user_id is now always a string from JWT
        if str(u.get('id')) == user_id:
            user = u
            break

    if not user or not user.get('is_active', True):
        return jsonify({'message': 'User not found or inactive'}), 401

    # Generate new token
    new_token = generate_token(user_id)

    return jsonify({
        'token': new_token,
        'message': 'Token refreshed successfully'
    })

@app.route('/api/auth/validate', methods=['POST'])
def validate_token():
    """Validate a JWT token and return user info (for debugging)"""
    auth_header = request.headers.get('Authorization')

    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'valid': False, 'message': 'Token is missing'}), 400

    token = auth_header.split(' ')[1]
    payload = verify_token(token)

    if not payload:
        return jsonify({'valid': False, 'message': 'Invalid or expired token'}), 400

    user_id = payload['sub']

    # Verify user exists
    users = read_data('users.json')
    user = None
    for u in users:
        if u.get('id') == user_id or str(u.get('id')) == str(user_id):
            user = u
            break

    if not user:
        return jsonify({'valid': False, 'message': 'User not found'}), 400

    return jsonify({
        'valid': True,
        'user_id': user_id,
        'username': user.get('username'),
        'role': user.get('role'),
        'is_active': user.get('is_active', True),
        'exp': payload.get('exp'),
        'iat': payload.get('iat')
    })

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    # For JWT, logout is handled client-side by removing the token
    return jsonify({'message': 'Logged out successfully'})





@app.route('/api/admin/switch-tenant/<int:tenant_id>', methods=['POST'])
@token_required
def switch_tenant_context(tenant_id):
    """Allow admin to switch tenant context for viewing data."""
    user_role = request.current_user.get('role')

    if user_role != 'admin':
        return jsonify({'message': 'Only system administrators can switch tenant context'}), 403

    # Verify tenant exists
    tenants = read_data('tenants.json')
    target_tenant = next((t for t in tenants if t['id'] == tenant_id), None)

    if not target_tenant:
        return jsonify({'message': 'Tenant not found'}), 404

    # Return success - frontend will handle the context switching
    return jsonify({
        'message': 'Tenant context switched successfully',
        'tenant': target_tenant
    })
    
    
    



def read_profiles():
    if not os.path.exists(JSON_FILE):
        return []
    with open(JSON_FILE, "r") as f:
        return json.load(f)


def write_profiles(profiles):
    with open(JSON_FILE, "w") as f:
        json.dump(profiles, f, indent=2)





# ✅ API to add a new profile
@app.route("/api/profile-master", methods=["POST"])
def add_profile():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    profiles = read_profiles()

    # ✅ Assign unique ID if not provided
    data["id"] = str(uuid.uuid4())  

    profiles.append(data)
    write_profiles(profiles)

    return jsonify({"message": "Profile added successfully", "data": data}), 201

# ✅ API to fetch all profiles
@app.route("/api/profile-master", methods=["GET"])
def get_profiles():
    profiles = read_profiles()
    return jsonify(profiles)

@app.route("/api/profile-master/<profile_id>", methods=["PUT"])
def edit_profile(profile_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    profiles = read_profiles()
    for idx, profile in enumerate(profiles):
        if profile["id"] == profile_id:
            profiles[idx] = {**profile, **data}  # merge changes
            write_profiles(profiles)
            return jsonify({"message": "Profile updated successfully", "data": profiles[idx]})

    return jsonify({"error": "Profile not found"}), 404


@app.route("/api/profile-master/<profile_id>", methods=["DELETE"])
def delete_profile(profile_id):
    profiles = read_profiles()
    updated_profiles = [p for p in profiles if p["id"] != profile_id]

    if len(updated_profiles) == len(profiles):
        return jsonify({"error": "Profile not found"}), 404

    write_profiles(updated_profiles)
    return jsonify({"message": "Profile deleted successfully"})


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
app.register_blueprint(sample_routing_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(file_bp)
app.register_blueprint(notification_bp)
app.register_blueprint(invoice_bp)
app.register_blueprint(tenants_bp)
app.register_blueprint(billing_reports_bp)
app.register_blueprint(access_management_bp)

# Start the server
if __name__ == '__main__':
    print("Starting AVINI Labs Backend Server...")
    print("Server will be available at: http://localhost:5002")
    print("Press Ctrl+C to stop the server")
    app.run(debug=True, port=5002, host='127.0.0.1', use_reloader=False)



