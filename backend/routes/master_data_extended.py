from flask import jsonify
from datetime import datetime
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import read_data, write_data


# Create functions for new master data categories

def create_patient_generic(data):
    required_fields = ['his_no', 'patient_name']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    patients = read_data('patients.json')
    new_id = 1
    if patients:
        new_id = max(p['id'] for p in patients) + 1

    new_patient = {
        'id': new_id,
        'his_no': data['his_no'],
        'patient_name': data['patient_name'],
        'mobile': data.get('mobile', ''),
        'whatsapp_no': data.get('whatsapp_no', ''),
        'uid_no': data.get('uid_no', ''),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': 1
    }

    patients.append(new_patient)
    write_data('patients.json', patients)
    return jsonify(new_patient), 201

def create_profile_master_generic(data):
    required_fields = ['code', 'test_profile', 'test_price']
    for field in required_fields:
        if field not in data or data[field] in [None, ""]:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    profiles = read_data('profile_master.json')
    new_id = 1
    if profiles:
        new_id = max(p['id'] for p in profiles) + 1

    new_profile = {
        'id': new_id,
        'code': data['code'],
        'procedure_code': data.get('procedure_code', ''),
        'test_profile': data['test_profile'],
        'description': data.get('description', ''),
        'department': data.get('department', ''),

        # Pricing Info
        'test_price': float(data.get('test_price', 0)),
        'discount_price': float(data.get('discount_price', 0)),
        'emergency_price': float(data.get('emergency_price', 0)),
        'home_visit_price': float(data.get('home_visit_price', 0)),
        'discount': float(data.get('discount', 0)),
        'category': data.get('category', ''),

        # Test Configuration
        'test_count': int(data.get('test_count', 0)),
        'test_names': [t.strip() for t in data.get('test_names', '').split(",") if t.strip()],

        # Meta
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': 1
    }

    profiles.append(new_profile)
    write_data('profile_master.json', profiles)
    return jsonify(new_profile), 201


def create_method_master_generic(data):
    required_fields = ['code', 'method']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    methods = read_data('method_master.json')
    new_id = 1
    if methods:
        new_id = max(m['id'] for m in methods) + 1

    new_method = {
        'id': new_id,
        'code': data['code'],
        'method': data['method'],
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': 1
    }

    methods.append(new_method)
    write_data('method_master.json', methods)
    return jsonify(new_method), 201

def create_antibiotic_master_generic(data):
    required_fields = ['antibiotic_code', 'antibiotic_description']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    antibiotics = read_data('antibiotic_master.json')
    new_id = 1
    if antibiotics:
        new_id = max(a['id'] for a in antibiotics) + 1

    new_antibiotic = {
        'id': new_id,
        'antibiotic_code': data['antibiotic_code'],
        'antibiotic_group': data.get('antibiotic_group', ''),
        'antibiotic_description': data['antibiotic_description'],
        'antibiotic_content': data.get('antibiotic_content', ''),
        'order': data.get('order', 0),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': 1
    }

    antibiotics.append(new_antibiotic)
    write_data('antibiotic_master.json', antibiotics)
    return jsonify(new_antibiotic), 201

def create_organism_master_generic(data):
    required_fields = ['code', 'description']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    organisms = read_data('organism_master.json')
    new_id = 1
    if organisms:
        new_id = max(o['id'] for o in organisms) + 1

    new_organism = {
        'id': new_id,
        'code': data['code'],
        'description': data['description'],
        'no_growth': data.get('no_growth', False),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': 1
    }

    organisms.append(new_organism)
    write_data('organism_master.json', organisms)
    return jsonify(new_organism), 201

def create_unit_of_measurement_generic(data):
    required_fields = ['code', 'description']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    units = read_data('unit_of_measurement.json')
    new_id = 1
    if units:
        new_id = max(u['id'] for u in units) + 1

    new_unit = {
        'id': new_id,
        'code': data['code'],
        'description': data['description'],
        'technical': data.get('technical', ''),
        'inventory': data.get('inventory', ''),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': 1
    }

    units.append(new_unit)
    write_data('unit_of_measurement.json', units)
    return jsonify(new_unit), 201

def create_specimen_master_generic(data):
    required_fields = ['code', 'specimen']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    specimens = read_data('specimen_master.json')
    new_id = 1
    if specimens:
        new_id = max(s['id'] for s in specimens) + 1

    new_specimen = {
        'id': new_id,
        'code': data['code'],
        'specimen': data['specimen'],
        'container': data.get('container', ''),
        'disposable': data.get('disposable', ''),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': 1
    }

    specimens.append(new_specimen)
    write_data('specimen_master.json', specimens)
    return jsonify(new_specimen), 201

def create_organism_vs_antibiotic_generic(data):
    required_fields = ['organism', 'antibiotic_group']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    relationships = read_data('organism_vs_antibiotic.json')
    new_id = 1
    if relationships:
        new_id = max(r['id'] for r in relationships) + 1

    new_relationship = {
        'id': new_id,
        'organism': data['organism'],
        'antibiotic_group': data['antibiotic_group'],
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': 1
    }

    relationships.append(new_relationship)
    write_data('organism_vs_antibiotic.json', relationships)
    return jsonify(new_relationship), 201

def create_container_master_generic(data):
    required_fields = ['code', 'description']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    containers = read_data('container_master.json')
    new_id = 1
    if containers:
        new_id = max(c['id'] for c in containers) + 1

    new_container = {
        'id': new_id,
        'code': data['code'],
        'description': data['description'],
        'short_name': data.get('short_name', ''),
        'color': data.get('color', ''),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': 1
    }

    containers.append(new_container)
    write_data('container_master.json', containers)
    return jsonify(new_container), 201

def create_main_department_master_generic(data):
    required_fields = ['code', 'department']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    departments = read_data('main_department_master.json')
    new_id = 1
    if departments:
        new_id = max(d['id'] for d in departments) + 1

    new_department = {
        'id': new_id,
        'major_department': data.get('major_department', ''),
        'code': data['code'],
        'department': data['department'],
        'order': data.get('order', 0),
        'short_name': data.get('short_name', ''),
        'queue': data.get('queue', ''),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': 1
    }

    departments.append(new_department)
    write_data('main_department_master.json', departments)
    return jsonify(new_department), 201

def create_department_settings_generic(data):
    required_fields = ['code', 'sub_name']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    settings = read_data('department_settings.json')
    new_id = 1
    if settings:
        new_id = max(s['id'] for s in settings) + 1

    new_setting = {
        'id': new_id,
        'main': data.get('main', ''),
        'code': data['code'],
        'sub_name': data['sub_name'],
        'service_time': data.get('service_time', 0),
        'room': data.get('room', ''),
        'order': data.get('order', 0),
        'dept_amt': data.get('dept_amt', 0),
        'short': data.get('short', ''),
        'collect': data.get('collect', ''),
        'process_receive': data.get('process_receive', ''),
        'receive': data.get('receive', ''),
        'no': data.get('no', ''),
        'pending': data.get('pending', ''),
        'dept': data.get('dept', ''),
        'barcode': data.get('barcode', ''),
        'appt': data.get('appt', ''),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': 1
    }

    settings.append(new_setting)
    write_data('department_settings.json', settings)
    return jsonify(new_setting), 201

def create_authorization_settings_generic(data):
    required_fields = ['code', 'sub_name']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    settings = read_data('authorization_settings.json')
    new_id = 1
    if settings:
        new_id = max(s['id'] for s in settings) + 1

    new_setting = {
        'id': new_id,
        'main': data.get('main', ''),
        'code': data['code'],
        'sub_name': data['sub_name'],
        'service_time': data.get('service_time', 0),
        'authorization': data.get('authorization', ''),
        'authorization_type': data.get('authorization_type', ''),
        'email_at': data.get('email_at', ''),
        'report_type': data.get('report_type', ''),
        'specimen': data.get('specimen', ''),
        'staging': data.get('staging', ''),
        'hide_sign': data.get('hide_sign', False),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': 1
    }

    settings.append(new_setting)
    write_data('authorization_settings.json', settings)
    return jsonify(new_setting), 201

def create_print_order_generic(data):
    required_fields = ['item']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    orders = read_data('print_order.json')
    new_id = 1
    if orders:
        new_id = max(o['id'] for o in orders) + 1

    new_order = {
        'id': new_id,
        'item': data['item'],
        'order': data.get('order', 0),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': 1
    }

    orders.append(new_order)
    write_data('print_order.json', orders)
    return jsonify(new_order), 201

# Update functions for new master data categories

def update_patient_generic(item_id, data):
    patients = read_data('patients.json')
    patient_index = next((i for i, p in enumerate(patients) if p['id'] == item_id), None)
    if patient_index is None:
        return jsonify({'message': 'Patient not found'}), 404

    patient = patients[patient_index]
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            patient[key] = value
    patient['updated_at'] = datetime.now().isoformat()
    write_data('patients.json', patients)
    return jsonify(patient)

def update_profile_master_generic(item_id, data):
    profiles = read_data('profile_master.json')
    profile_index = next((i for i, p in enumerate(profiles) if p['id'] == item_id), None)
    if profile_index is None:
        return jsonify({'message': 'Profile not found'}), 404

    profile = profiles[profile_index]
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            profile[key] = value
    profile['updated_at'] = datetime.now().isoformat()
    write_data('profile_master.json', profiles)
    return jsonify(profile)

def update_method_master_generic(item_id, data):
    methods = read_data('method_master.json')
    method_index = next((i for i, m in enumerate(methods) if m['id'] == item_id), None)
    if method_index is None:
        return jsonify({'message': 'Method not found'}), 404

    method = methods[method_index]
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            method[key] = value
    method['updated_at'] = datetime.now().isoformat()
    write_data('method_master.json', methods)
    return jsonify(method)

def update_antibiotic_master_generic(item_id, data):
    antibiotics = read_data('antibiotic_master.json')
    antibiotic_index = next((i for i, a in enumerate(antibiotics) if a['id'] == item_id), None)
    if antibiotic_index is None:
        return jsonify({'message': 'Antibiotic not found'}), 404

    antibiotic = antibiotics[antibiotic_index]
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            antibiotic[key] = value
    antibiotic['updated_at'] = datetime.now().isoformat()
    write_data('antibiotic_master.json', antibiotics)
    return jsonify(antibiotic)

def update_organism_master_generic(item_id, data):
    organisms = read_data('organism_master.json')
    organism_index = next((i for i, o in enumerate(organisms) if o['id'] == item_id), None)
    if organism_index is None:
        return jsonify({'message': 'Organism not found'}), 404

    organism = organisms[organism_index]
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            organism[key] = value
    organism['updated_at'] = datetime.now().isoformat()
    write_data('organism_master.json', organisms)
    return jsonify(organism)

def update_unit_of_measurement_generic(item_id, data):
    units = read_data('unit_of_measurement.json')
    unit_index = next((i for i, u in enumerate(units) if u['id'] == item_id), None)
    if unit_index is None:
        return jsonify({'message': 'Unit not found'}), 404

    unit = units[unit_index]
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            unit[key] = value
    unit['updated_at'] = datetime.now().isoformat()
    write_data('unit_of_measurement.json', units)
    return jsonify(unit)

def update_specimen_master_generic(item_id, data):
    specimens = read_data('specimen_master.json')
    specimen_index = next((i for i, s in enumerate(specimens) if s['id'] == item_id), None)
    if specimen_index is None:
        return jsonify({'message': 'Specimen not found'}), 404

    specimen = specimens[specimen_index]
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            specimen[key] = value
    specimen['updated_at'] = datetime.now().isoformat()
    write_data('specimen_master.json', specimens)
    return jsonify(specimen)

def update_organism_vs_antibiotic_generic(item_id, data):
    relationships = read_data('organism_vs_antibiotic.json')
    relationship_index = next((i for i, r in enumerate(relationships) if r['id'] == item_id), None)
    if relationship_index is None:
        return jsonify({'message': 'Relationship not found'}), 404

    relationship = relationships[relationship_index]
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            relationship[key] = value
    relationship['updated_at'] = datetime.now().isoformat()
    write_data('organism_vs_antibiotic.json', relationships)
    return jsonify(relationship)

def update_container_master_generic(item_id, data):
    containers = read_data('container_master.json')
    container_index = next((i for i, c in enumerate(containers) if c['id'] == item_id), None)
    if container_index is None:
        return jsonify({'message': 'Container not found'}), 404

    container = containers[container_index]
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            container[key] = value
    container['updated_at'] = datetime.now().isoformat()
    write_data('container_master.json', containers)
    return jsonify(container)

def update_main_department_master_generic(item_id, data):
    departments = read_data('main_department_master.json')
    department_index = next((i for i, d in enumerate(departments) if d['id'] == item_id), None)
    if department_index is None:
        return jsonify({'message': 'Department not found'}), 404

    department = departments[department_index]
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            department[key] = value
    department['updated_at'] = datetime.now().isoformat()
    write_data('main_department_master.json', departments)
    return jsonify(department)

def update_department_settings_generic(item_id, data):
    settings = read_data('department_settings.json')
    setting_index = next((i for i, s in enumerate(settings) if s['id'] == item_id), None)
    if setting_index is None:
        return jsonify({'message': 'Setting not found'}), 404

    setting = settings[setting_index]
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            setting[key] = value
    setting['updated_at'] = datetime.now().isoformat()
    write_data('department_settings.json', settings)
    return jsonify(setting)

def update_authorization_settings_generic(item_id, data):
    settings = read_data('authorization_settings.json')
    setting_index = next((i for i, s in enumerate(settings) if s['id'] == item_id), None)
    if setting_index is None:
        return jsonify({'message': 'Setting not found'}), 404

    setting = settings[setting_index]
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            setting[key] = value
    setting['updated_at'] = datetime.now().isoformat()
    write_data('authorization_settings.json', settings)
    return jsonify(setting)

def update_print_order_generic(item_id, data):
    orders = read_data('print_order.json')
    order_index = next((i for i, o in enumerate(orders) if o['id'] == item_id), None)
    if order_index is None:
        return jsonify({'message': 'Order not found'}), 404

    order = orders[order_index]
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            order[key] = value
    order['updated_at'] = datetime.now().isoformat()
    write_data('print_order.json', orders)
    return jsonify(order)

# Delete functions for new master data categories

def delete_patient_generic(item_id):
    patients = read_data('patients.json')
    patient_index = next((i for i, p in enumerate(patients) if p['id'] == item_id), None)
    if patient_index is None:
        return jsonify({'message': 'Patient not found'}), 404
    patients.pop(patient_index)
    write_data('patients.json', patients)
    return jsonify({'message': 'Patient deleted successfully'})

def delete_profile_master_generic(item_id):
    profiles = read_data('profile_master.json')
    profile_index = next((i for i, p in enumerate(profiles) if p['id'] == item_id), None)
    if profile_index is None:
        return jsonify({'message': 'Profile not found'}), 404
    profiles.pop(profile_index)
    write_data('profile_master.json', profiles)
    return jsonify({'message': 'Profile deleted successfully'})

def delete_method_master_generic(item_id):
    methods = read_data('method_master.json')
    method_index = next((i for i, m in enumerate(methods) if m['id'] == item_id), None)
    if method_index is None:
        return jsonify({'message': 'Method not found'}), 404
    methods.pop(method_index)
    write_data('method_master.json', methods)
    return jsonify({'message': 'Method deleted successfully'})

def delete_antibiotic_master_generic(item_id):
    antibiotics = read_data('antibiotic_master.json')
    antibiotic_index = next((i for i, a in enumerate(antibiotics) if a['id'] == item_id), None)
    if antibiotic_index is None:
        return jsonify({'message': 'Antibiotic not found'}), 404
    antibiotics.pop(antibiotic_index)
    write_data('antibiotic_master.json', antibiotics)
    return jsonify({'message': 'Antibiotic deleted successfully'})

def delete_organism_master_generic(item_id):
    organisms = read_data('organism_master.json')
    organism_index = next((i for i, o in enumerate(organisms) if o['id'] == item_id), None)
    if organism_index is None:
        return jsonify({'message': 'Organism not found'}), 404
    organisms.pop(organism_index)
    write_data('organism_master.json', organisms)
    return jsonify({'message': 'Organism deleted successfully'})

def delete_unit_of_measurement_generic(item_id):
    units = read_data('unit_of_measurement.json')
    unit_index = next((i for i, u in enumerate(units) if u['id'] == item_id), None)
    if unit_index is None:
        return jsonify({'message': 'Unit not found'}), 404
    units.pop(unit_index)
    write_data('unit_of_measurement.json', units)
    return jsonify({'message': 'Unit deleted successfully'})

def delete_specimen_master_generic(item_id):
    specimens = read_data('specimen_master.json')
    specimen_index = next((i for i, s in enumerate(specimens) if s['id'] == item_id), None)
    if specimen_index is None:
        return jsonify({'message': 'Specimen not found'}), 404
    specimens.pop(specimen_index)
    write_data('specimen_master.json', specimens)
    return jsonify({'message': 'Specimen deleted successfully'})

def delete_organism_vs_antibiotic_generic(item_id):
    relationships = read_data('organism_vs_antibiotic.json')
    relationship_index = next((i for i, r in enumerate(relationships) if r['id'] == item_id), None)
    if relationship_index is None:
        return jsonify({'message': 'Relationship not found'}), 404
    relationships.pop(relationship_index)
    write_data('organism_vs_antibiotic.json', relationships)
    return jsonify({'message': 'Relationship deleted successfully'})

def delete_container_master_generic(item_id):
    containers = read_data('container_master.json')
    container_index = next((i for i, c in enumerate(containers) if c['id'] == item_id), None)
    if container_index is None:
        return jsonify({'message': 'Container not found'}), 404
    containers.pop(container_index)
    write_data('container_master.json', containers)
    return jsonify({'message': 'Container deleted successfully'})

def delete_main_department_master_generic(item_id):
    departments = read_data('main_department_master.json')
    department_index = next((i for i, d in enumerate(departments) if d['id'] == item_id), None)
    if department_index is None:
        return jsonify({'message': 'Department not found'}), 404
    departments.pop(department_index)
    write_data('main_department_master.json', departments)
    return jsonify({'message': 'Department deleted successfully'})

def delete_department_settings_generic(item_id):
    settings = read_data('department_settings.json')
    setting_index = next((i for i, s in enumerate(settings) if s['id'] == item_id), None)
    if setting_index is None:
        return jsonify({'message': 'Setting not found'}), 404
    settings.pop(setting_index)
    write_data('department_settings.json', settings)
    return jsonify({'message': 'Setting deleted successfully'})

def delete_authorization_settings_generic(item_id):
    settings = read_data('authorization_settings.json')
    setting_index = next((i for i, s in enumerate(settings) if s['id'] == item_id), None)
    if setting_index is None:
        return jsonify({'message': 'Setting not found'}), 404
    settings.pop(setting_index)
    write_data('authorization_settings.json', settings)
    return jsonify({'message': 'Setting deleted successfully'})

def delete_print_order_generic(item_id):
    orders = read_data('print_order.json')
    order_index = next((i for i, o in enumerate(orders) if o['id'] == item_id), None)
    if order_index is None:
        return jsonify({'message': 'Order not found'}), 404
    orders.pop(order_index)
    write_data('print_order.json', orders)
    return jsonify({'message': 'Order deleted successfully'})

# Test Master and Sub Test Master functions

def create_test_master_generic(data):
    required_fields = ['department', 'testName']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    test_masters = read_data('test_master.json')
    new_id = 1
    if test_masters:
        new_id = max(t['id'] for t in test_masters) + 1

    new_test_master = {
        'id': new_id,
        'department': data['department'],
        'testName': data['testName'],
        'emrClassification': data.get('emrClassification', ''),
        'shortName': data.get('shortName', ''),
        'displayName': data.get('displayName', ''),
        'hmsCode': data.get('hmsCode', ''),
        'internationalCode': data.get('internationalCode', ''),
        'method': data.get('method', ''),
        'primarySpecimen': data.get('primarySpecimen', ''),
        'specimen': data.get('specimen', ''),
        'container': data.get('container', ''),
        'interpretation': data.get('interpretation', ''),
        'instructions': data.get('instructions', ''),
        'specialReport': data.get('specialReport', ''),
        'reportName': data.get('reportName', ''),
        'subTests': data.get('subTests', []),
        'unacceptableConditions': data.get('unacceptableConditions', ''),
        'minSampleQty': data.get('minSampleQty', ''),
        'cutoffTime': data.get('cutoffTime', ''),
        'testSuffix': data.get('testSuffix', ''),
        'suffixDesc': data.get('suffixDesc', ''),
        'minProcessTime': data.get('minProcessTime', 0),
        'minProcessPeriod': data.get('minProcessPeriod', ''),
        'emergencyProcessTime': data.get('emergencyProcessTime', 0),
        'emergencyProcessPeriod': data.get('emergencyProcessPeriod', ''),
        'expiryTime': data.get('expiryTime', 0),
        'expiryPeriod': data.get('expiryPeriod', ''),
        'serviceTime': data.get('serviceTime', ''),
        'applicableTo': data.get('applicableTo', 'both'),
        'reportingDays': data.get('reportingDays', 0),
        'testDoneOn': data.get('testDoneOn', {}),
        'alertSMS': data.get('alertSMS', False),
        'alertPeriod': data.get('alertPeriod', ''),
        'alertMessage': data.get('alertMessage', ''),
        'options': data.get('options', {}),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': 1
    }

    test_masters.append(new_test_master)
    write_data('test_master.json', test_masters)
    return jsonify(new_test_master), 201

def create_sub_test_master_generic(data):
    required_fields = ['sub_test_name', 'department_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    sub_test_masters = read_data('sub_test_master.json')
    new_id = 1
    if sub_test_masters:
        new_id = max(s['id'] for s in sub_test_masters) + 1

    new_sub_test_master = {
        'id': new_id,
        'sub_test_name': data['sub_test_name'],
        'department_id': data['department_id'],
        'description': data.get('description', ''),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': 1
    }

    sub_test_masters.append(new_sub_test_master)
    write_data('sub_test_master.json', sub_test_masters)
    return jsonify(new_sub_test_master), 201

def update_test_master_generic(item_id, data):
    test_masters = read_data('test_master.json')
    test_master_index = next((i for i, t in enumerate(test_masters) if t['id'] == item_id), None)
    if test_master_index is None:
        return jsonify({'message': 'Test Master not found'}), 404

    test_master = test_masters[test_master_index]
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            test_master[key] = value
    test_master['updated_at'] = datetime.now().isoformat()
    write_data('test_master.json', test_masters)
    return jsonify(test_master)

def update_sub_test_master_generic(item_id, data):
    sub_test_masters = read_data('sub_test_master.json')
    sub_test_master_index = next((i for i, s in enumerate(sub_test_masters) if s['id'] == item_id), None)
    if sub_test_master_index is None:
        return jsonify({'message': 'Sub Test Master not found'}), 404

    sub_test_master = sub_test_masters[sub_test_master_index]
    for key, value in data.items():
        if key not in ['id', 'created_at', 'created_by']:
            sub_test_master[key] = value
    sub_test_master['updated_at'] = datetime.now().isoformat()
    write_data('sub_test_master.json', sub_test_masters)
    return jsonify(sub_test_master)

def delete_test_master_generic(item_id):
    test_masters = read_data('test_master.json')
    test_master_index = next((i for i, t in enumerate(test_masters) if t['id'] == item_id), None)
    if test_master_index is None:
        return jsonify({'message': 'Test Master not found'}), 404
    test_masters.pop(test_master_index)
    write_data('test_master.json', test_masters)
    return jsonify({'message': 'Test Master deleted successfully'})

def delete_sub_test_master_generic(item_id):
    sub_test_masters = read_data('sub_test_master.json')
    sub_test_master_index = next((i for i, s in enumerate(sub_test_masters) if s['id'] == item_id), None)
    if sub_test_master_index is None:
        return jsonify({'message': 'Sub Test Master not found'}), 404
    sub_test_masters.pop(sub_test_master_index)
    write_data('sub_test_master.json', sub_test_masters)
    return jsonify({'message': 'Sub Test Master deleted successfully'})

# Test Sub Process Functions
def create_test_sub_process_generic(data):
    """Create test sub process"""
    try:
        # Validate required fields
        required_fields = ['processName', 'department_id']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'message': f'Missing required field: {field}'}), 400

        # Read existing data
        existing_data = read_data('test_sub_process.json')

        # Generate new ID
        new_id = 1
        if existing_data:
            new_id = max(item['id'] for item in existing_data) + 1

        # Create new item
        new_item = {
            'id': new_id,
            'processName': data['processName'],
            'department_id': int(data['department_id']),
            'description': data.get('description', ''),
            'duration': data.get('duration', ''),
            'is_active': data.get('is_active', True),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'created_by': 1  # Default user ID
        }

        # Add to data
        existing_data.append(new_item)
        write_data('test_sub_process.json', existing_data)

        return jsonify(new_item), 201

    except Exception as e:
        return jsonify({'message': f'Failed to create test sub process: {str(e)}'}), 500

def update_test_sub_process_generic(item_id, data):
    """Update test sub process"""
    try:
        existing_data = read_data('test_sub_process.json')

        # Find item to update
        item_index = next((i for i, item in enumerate(existing_data) if item['id'] == item_id), None)
        if item_index is None:
            return jsonify({'message': 'Test sub process not found'}), 404

        # Update item
        item = existing_data[item_index]
        for key, value in data.items():
            if key not in ['id', 'created_at', 'created_by']:
                if key == 'department_id' and value:
                    item[key] = int(value)
                else:
                    item[key] = value

        item['updated_at'] = datetime.now().isoformat()

        # Save data
        write_data('test_sub_process.json', existing_data)

        return jsonify(item)

    except Exception as e:
        return jsonify({'message': f'Failed to update test sub process: {str(e)}'}), 500

def delete_test_sub_process_generic(item_id):
    """Delete test sub process"""
    try:
        data = read_data('test_sub_process.json')

        # Find item to delete
        item_index = next((i for i, item in enumerate(data) if item['id'] == item_id), None)
        if item_index is None:
            return jsonify({'message': 'Test sub process not found'}), 404

        # Remove item
        data.pop(item_index)
        write_data('test_sub_process.json', data)

        return jsonify({'message': 'Test sub process deleted successfully'})

    except Exception as e:
        return jsonify({'message': f'Failed to delete test sub process: {str(e)}'}), 500

# Special Package Functions
def create_special_package_generic(data):
    """Create special package"""
    try:
        # Validate required fields
        required_fields = ['packageName']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'message': f'Missing required field: {field}'}), 400

        # Read existing data
        existing_data = read_data('special_package.json')

        # Generate new ID
        new_id = 1
        if existing_data:
            new_id = max(item['id'] for item in existing_data) + 1

        # Create new item
        new_item = {
            'id': new_id,
            'packageName': data['packageName'],
            'testsIncluded': data.get('testsIncluded', []),
            'price': float(data.get('price', 0)),
            'discount': float(data.get('discount', 0)),
            'is_active': data.get('is_active', True),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'created_by': 1  # Default user ID
        }

        # Add to data
        existing_data.append(new_item)
        write_data('special_package.json', existing_data)

        return jsonify(new_item), 201

    except Exception as e:
        return jsonify({'message': f'Failed to create special package: {str(e)}'}), 500

def update_special_package_generic(item_id, data):
    """Update special package"""
    try:
        existing_data = read_data('special_package.json')

        # Find item to update
        item_index = next((i for i, item in enumerate(existing_data) if item['id'] == item_id), None)
        if item_index is None:
            return jsonify({'message': 'Special package not found'}), 404

        # Update item
        item = existing_data[item_index]
        for key, value in data.items():
            if key not in ['id', 'created_at', 'created_by']:
                if key in ['price', 'discount'] and value:
                    item[key] = float(value)
                else:
                    item[key] = value

        item['updated_at'] = datetime.now().isoformat()

        # Save data
        write_data('special_package.json', existing_data)

        return jsonify(item)

    except Exception as e:
        return jsonify({'message': f'Failed to update special package: {str(e)}'}), 500

def delete_special_package_generic(item_id):
    """Delete special package"""
    try:
        data = read_data('special_package.json')

        # Find item to delete
        item_index = next((i for i, item in enumerate(data) if item['id'] == item_id), None)
        if item_index is None:
            return jsonify({'message': 'Special package not found'}), 404

        # Remove item
        data.pop(item_index)
        write_data('special_package.json', data)

        return jsonify({'message': 'Special package deleted successfully'})

    except Exception as e:
        return jsonify({'message': f'Failed to delete special package: {str(e)}'}), 500

# Profile Data Functions
def create_profile_data_generic(data):
    """Create profile data"""
    try:
        # Validate required fields
        required_fields = ['code', 'test_profile', 'test_price']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'message': f'Missing required field: {field}'}), 400

        # Read existing data
        existing_data = read_data('profile_data.json')

        # Generate new ID
        new_id = 1
        if existing_data:
            new_id = max(item['id'] for item in existing_data) + 1

        # Create new item
        new_item = {
            'id': new_id,
            'code': data['code'],
            'procedure_code': data.get('procedure_code', ''),
            'test_profile': data['test_profile'],
            'test_price': float(data['test_price']),
            'is_active': data.get('is_active', True),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'created_by': 1  # Default user ID
        }

        # Add to data
        existing_data.append(new_item)
        write_data('profile_data.json', existing_data)

        return jsonify(new_item), 201

    except Exception as e:
        return jsonify({'message': f'Failed to create profile data: {str(e)}'}), 500

def update_profile_data_generic(item_id, data):
    """Update profile data"""
    try:
        existing_data = read_data('profile_data.json')

        # Find item to update
        item_index = next((i for i, item in enumerate(existing_data) if item['id'] == item_id), None)
        if item_index is None:
            return jsonify({'message': 'Profile data not found'}), 404

        # Update item
        item = existing_data[item_index]
        for key, value in data.items():
            if key not in ['id', 'created_at', 'created_by']:
                if key == 'test_price' and value:
                    item[key] = float(value)
                else:
                    item[key] = value

        item['updated_at'] = datetime.now().isoformat()

        # Save data
        write_data('profile_data.json', existing_data)

        return jsonify(item)

    except Exception as e:
        return jsonify({'message': f'Failed to update profile data: {str(e)}'}), 500

def delete_profile_data_generic(item_id):
    """Delete profile data"""
    try:
        data = read_data('profile_data.json')

        # Find item to delete
        item_index = next((i for i, item in enumerate(data) if item['id'] == item_id), None)
        if item_index is None:
            return jsonify({'message': 'Profile data not found'}), 404

        # Remove item
        data.pop(item_index)
        write_data('profile_data.json', data)

        return jsonify({'message': 'Profile data deleted successfully'})

    except Exception as e:
        return jsonify({'message': f'Failed to delete profile data: {str(e)}'}), 500


