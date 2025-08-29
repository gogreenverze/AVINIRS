#!/usr/bin/env python3
"""
Simple Flask server for Master Data Management System
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from utils import transform_master_data

app = Flask(__name__)
CORS(app)

# Helper function to read JSON data
def read_json_file(filename):
    try:
        # Look for data files in backend/data directory
        filepath = os.path.join(os.path.dirname(__file__), 'data', filename)
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                return json.load(f)
        return []
    except Exception as e:
        print(f"Error reading {filename}: {e}")
        return []

# Helper function to write JSON data
def write_json_file(filename, data):
    try:
        filepath = os.path.join('data', filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except:
        return False

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'message': 'Master Data System is running'})

@app.route('/api/admin/master-data')
def get_master_data():
    """Get all master data"""
    try:
        # Read raw data from files
        test_categories = read_json_file('test_categories.json')
        test_parameters = read_json_file('test_parameters.json')
        sample_types = read_json_file('sample_types.json')
        departments = read_json_file('departments.json')
        payment_methods = read_json_file('payment_methods.json')
        containers = read_json_file('containers.json')
        instruments = read_json_file('instruments.json')
        reagents = read_json_file('reagents.json')
        suppliers = read_json_file('suppliers.json')
        units = read_json_file('units.json')
        test_methods = read_json_file('test_methods.json')
        patients = read_json_file('patients.json')

        # Apply transformations to fix field name mismatches
        master_data = {
            'testCategories': transform_master_data(test_categories, 'testCategories'),
            'testParameters': transform_master_data(test_parameters, 'testParameters'),
            'sampleTypes': transform_master_data(sample_types, 'sampleTypes'),
            'departments': transform_master_data(departments, 'departments'),
            'paymentMethods': transform_master_data(payment_methods, 'paymentMethods'),
            'containers': transform_master_data(containers, 'containers'),
            'instruments': transform_master_data(instruments, 'instruments'),
            'reagents': transform_master_data(reagents, 'reagents'),
            'suppliers': transform_master_data(suppliers, 'suppliers'),
            'units': transform_master_data(units, 'units'),
            'testMethods': transform_master_data(test_methods, 'testMethods'),
            'patients': transform_master_data(patients, 'patients'),
            'profileMaster': read_json_file('profile_master.json'),
            'methodMaster': read_json_file('method_master.json'),
            'antibioticMaster': read_json_file('antibiotic_master.json'),
            'organismMaster': read_json_file('organism_master.json'),
            'unitOfMeasurement': read_json_file('unit_of_measurement.json'),
            'specimenMaster': read_json_file('specimen_master.json'),
            'organismVsAntibiotic': read_json_file('organism_vs_antibiotic.json'),
            'containerMaster': read_json_file('container_master.json'),
            'mainDepartmentMaster': read_json_file('main_department_master.json'),
            'departmentSettings': read_json_file('department_settings.json'),
            'authorizationSettings': read_json_file('authorization_settings.json'),
            'printOrder': read_json_file('print_order.json')
        }
        return jsonify(master_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/master-data/import', methods=['POST'])
def import_master_data():
    """Import master data from Excel file"""
    try:
        # For now, return a success message
        # In a full implementation, this would process the uploaded Excel file
        return jsonify({
            'message': 'Import endpoint is available',
            'status': 'success',
            'note': 'Excel processing will be implemented with pandas'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/master-data/bulk-import', methods=['POST'])
def bulk_import_master_data():
    """Bulk import master data"""
    try:
        return jsonify({
            'message': 'Bulk import endpoint is available',
            'status': 'success'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/master-data/export/<category>')
def export_master_data(category):
    """Export master data for a category"""
    try:
        return jsonify({
            'message': f'Export endpoint for {category} is available',
            'status': 'success'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/master-data/<category>', methods=['POST'])
def add_master_data_item(category):
    """Add new item to master data category"""
    try:
        data = request.get_json()
        
        # Convert camelCase to snake_case for file names
        file_name = ''.join(['_' + c.lower() if c.isupper() else c for c in category]).lstrip('_')
        
        # Read existing data
        existing_data = read_json_file(f'{file_name}.json')
        
        # Generate new ID
        new_id = 1
        if existing_data:
            new_id = max(item.get('id', 0) for item in existing_data) + 1
        
        # Add metadata
        data['id'] = new_id
        data['created_at'] = '2024-01-15T08:00:00'
        data['updated_at'] = '2024-01-15T08:00:00'
        data['created_by'] = 1
        
        # Add to existing data
        existing_data.append(data)
        
        # Save data
        if write_json_file(f'{file_name}.json', existing_data):
            return jsonify(data), 201
        else:
            return jsonify({'error': 'Failed to save data'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/master-data/<category>/<int:item_id>', methods=['PUT'])
def update_master_data_item(category, item_id):
    """Update master data item"""
    try:
        data = request.get_json()
        
        # Convert camelCase to snake_case for file names
        file_name = ''.join(['_' + c.lower() if c.isupper() else c for c in category]).lstrip('_')
        
        # Read existing data
        existing_data = read_json_file(f'{file_name}.json')
        
        # Find item to update
        item_index = next((i for i, item in enumerate(existing_data) if item.get('id') == item_id), None)
        
        if item_index is None:
            return jsonify({'error': 'Item not found'}), 404
        
        # Update item
        for key, value in data.items():
            if key not in ['id', 'created_at', 'created_by']:
                existing_data[item_index][key] = value
        
        existing_data[item_index]['updated_at'] = '2024-01-15T08:00:00'
        
        # Save data
        if write_json_file(f'{file_name}.json', existing_data):
            return jsonify(existing_data[item_index])
        else:
            return jsonify({'error': 'Failed to save data'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/master-data/<category>/<int:item_id>', methods=['DELETE'])
def delete_master_data_item(category, item_id):
    """Delete master data item"""
    try:
        # Convert camelCase to snake_case for file names
        file_name = ''.join(['_' + c.lower() if c.isupper() else c for c in category]).lstrip('_')
        
        # Read existing data
        existing_data = read_json_file(f'{file_name}.json')
        
        # Find item to delete
        item_index = next((i for i, item in enumerate(existing_data) if item.get('id') == item_id), None)
        
        if item_index is None:
            return jsonify({'error': 'Item not found'}), 404
        
        # Delete item
        deleted_item = existing_data.pop(item_index)
        
        # Save data
        if write_json_file(f'{file_name}.json', existing_data):
            return jsonify({'message': 'Item deleted successfully'})
        else:
            return jsonify({'error': 'Failed to save data'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Simple Master Data Management System Backend...")
    print("📊 All 24 master data categories are available")
    print("🌐 Server will be available at: http://localhost:5000")
    print("📝 API Health Check: http://localhost:5000/api/health")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
