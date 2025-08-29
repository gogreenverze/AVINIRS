import os
import json
import random
from datetime import datetime, timedelta

# Create data directory
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

# Tamil Nadu cities and districts
tn_cities = [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 
    'Tirunelveli', 'Tiruppur', 'Vellore', 'Erode', 'Thoothukkudi',
    'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur', 
    'Udhagamandalam', 'Hosur', 'Nagercoil', 'Kanchipuram', 'Kumarapalayam'
]

# Tamil Nadu common first names
tn_first_names = [
    # Male names
    'Anand', 'Arun', 'Bala', 'Chandran', 'Dhanush', 'Ganesh', 'Harish', 
    'Karthik', 'Kumar', 'Lokesh', 'Mahesh', 'Naveen', 'Prabhu', 'Rajesh', 
    'Ramesh', 'Saravanan', 'Senthil', 'Suresh', 'Thamizh', 'Vijay',
    'Murugan', 'Selvam', 'Rajan', 'Kannan', 'Mani', 'Palani', 'Muthu',
    
    # Female names
    'Anitha', 'Bhavani', 'Chitra', 'Deepa', 'Eswari', 'Geetha', 'Hema', 
    'Indhu', 'Jaya', 'Kala', 'Lakshmi', 'Meena', 'Nithya', 'Padma', 
    'Radha', 'Saranya', 'Tamilselvi', 'Uma', 'Valli', 'Yamuna',
    'Selvi', 'Parvathi', 'Malathi', 'Kavitha', 'Shanthi', 'Revathi'
]

# Tamil Nadu common last names
tn_last_names = [
    'Murugan', 'Raman', 'Krishnan', 'Subramanian', 'Venkatesh', 'Narayanan',
    'Sundaram', 'Govindan', 'Kannan', 'Palaniappan', 'Shanmugam', 'Annamalai',
    'Chidambaram', 'Devarajan', 'Elangovan', 'Ganesan', 'Iyengar', 'Jeyaraman',
    'Kalyanasundaram', 'Lakshmanan', 'Muthukumar', 'Natarajan', 'Paramasivam',
    'Rajagopal', 'Srinivasan', 'Thangavelu', 'Vasudevan', 'Veerasamy',
    'Iyer', 'Pillai', 'Nadar', 'Gounder', 'Thevar', 'Chettiar', 'Nayak'
]

# Sample types
sample_types = [
    {'id': 1, 'type_name': 'Blood', 'type_code': 'BLD', 'description': 'Whole blood sample'},
    {'id': 2, 'type_name': 'Serum', 'type_code': 'SER', 'description': 'Blood serum sample'},
    {'id': 3, 'type_name': 'Plasma', 'type_code': 'PLS', 'description': 'Blood plasma sample'},
    {'id': 4, 'type_name': 'Urine', 'type_code': 'URN', 'description': 'Urine sample'},
    {'id': 5, 'type_name': 'Stool', 'type_code': 'STL', 'description': 'Stool sample'},
    {'id': 6, 'type_name': 'CSF', 'type_code': 'CSF', 'description': 'Cerebrospinal fluid'},
    {'id': 7, 'type_name': 'Sputum', 'type_code': 'SPT', 'description': 'Sputum sample'},
    {'id': 8, 'type_name': 'Swab', 'type_code': 'SWB', 'description': 'Swab sample'},
    {'id': 9, 'type_name': 'Tissue', 'type_code': 'TSU', 'description': 'Tissue sample'},
    {'id': 10, 'type_name': 'Bone Marrow', 'type_code': 'BMA', 'description': 'Bone marrow aspirate'}
]

# Containers
containers = [
    {'id': 1, 'container_name': 'Red Top Tube', 'color_code': 'Red', 'sample_type_id': 2, 'volume_required': '5ml', 'additive': 'None'},
    {'id': 2, 'container_name': 'Purple Top Tube', 'color_code': 'Purple', 'sample_type_id': 1, 'volume_required': '3ml', 'additive': 'EDTA'},
    {'id': 3, 'container_name': 'Blue Top Tube', 'color_code': 'Blue', 'sample_type_id': 3, 'volume_required': '2.7ml', 'additive': 'Sodium Citrate'},
    {'id': 4, 'container_name': 'Green Top Tube', 'color_code': 'Green', 'sample_type_id': 3, 'volume_required': '4ml', 'additive': 'Heparin'},
    {'id': 5, 'container_name': 'Gray Top Tube', 'color_code': 'Gray', 'sample_type_id': 3, 'volume_required': '4ml', 'additive': 'Sodium Fluoride'},
    {'id': 6, 'container_name': 'Urine Container', 'color_code': 'Yellow', 'sample_type_id': 4, 'volume_required': '30ml', 'additive': 'None'},
    {'id': 7, 'container_name': 'Stool Container', 'color_code': 'Brown', 'sample_type_id': 5, 'volume_required': '10g', 'additive': 'None'},
    {'id': 8, 'container_name': 'CSF Tube', 'color_code': 'Clear', 'sample_type_id': 6, 'volume_required': '1ml', 'additive': 'None'},
    {'id': 9, 'container_name': 'Sputum Container', 'color_code': 'Clear', 'sample_type_id': 7, 'volume_required': '5ml', 'additive': 'None'},
    {'id': 10, 'container_name': 'Swab Tube', 'color_code': 'Pink', 'sample_type_id': 8, 'volume_required': 'N/A', 'additive': 'Transport Medium'}
]

# Tests
tests = [
    {'id': 1, 'test_name': 'Complete Blood Count (CBC)', 'sample_type_id': 1, 'turnaround_time': '1 day', 'price': 350},
    {'id': 2, 'test_name': 'Blood Glucose Fasting', 'sample_type_id': 2, 'turnaround_time': '1 day', 'price': 150},
    {'id': 3, 'test_name': 'HbA1c', 'sample_type_id': 1, 'turnaround_time': '1 day', 'price': 450},
    {'id': 4, 'test_name': 'Lipid Profile', 'sample_type_id': 2, 'turnaround_time': '1 day', 'price': 600},
    {'id': 5, 'test_name': 'Liver Function Test', 'sample_type_id': 2, 'turnaround_time': '1 day', 'price': 800},
    {'id': 6, 'test_name': 'Kidney Function Test', 'sample_type_id': 2, 'turnaround_time': '1 day', 'price': 700},
    {'id': 7, 'test_name': 'Thyroid Profile', 'sample_type_id': 2, 'turnaround_time': '1 day', 'price': 850},
    {'id': 8, 'test_name': 'Urine Routine', 'sample_type_id': 4, 'turnaround_time': '1 day', 'price': 200},
    {'id': 9, 'test_name': 'Stool Routine', 'sample_type_id': 5, 'turnaround_time': '1 day', 'price': 250},
    {'id': 10, 'test_name': 'Dengue NS1 Antigen', 'sample_type_id': 2, 'turnaround_time': '1 day', 'price': 700}
]

# Tenants (Labs) - Real franchise data based on PRABAGARAN.pdf reference
tenants = [
    {
        "id": 1,
        "name": "AVINI Labs Mayiladuthurai",
        "site_code": "MYD",
        "address": "Main Hub, Mayiladuthurai, Tamil Nadu",
        "contact_phone": "6384440505",
        "email": "info@avinilabs.com",
        "is_hub": True,
        "is_active": True
    },
    {
        "id": 2,
        "name": "AVINI Labs Sirkazhi",
        "site_code": "SKZ",
        "address": "Sirkazhi, Tamil Nadu",
        "contact_phone": "6384440502",
        "email": "admin@sirkazhi.avinilabs.com",
        "is_hub": False,
        "is_active": True
    },
    {
        "id": 3,
        "name": "AVINI Labs Thanjavur",
        "site_code": "TNJ",
        "address": "Thanjavur, Tamil Nadu",
        "contact_phone": "6384440520",
        "email": "admin@thanjavur.avinilabs.com",
        "is_hub": False,
        "is_active": True
    },
    {
        "id": 4,
        "name": "AVINI Labs Kuthalam",
        "site_code": "KTL",
        "address": "Kuthalam, Tamil Nadu",
        "contact_phone": "9488776966",
        "email": "admin@kuthalam.avinilabs.com",
        "is_hub": False,
        "is_active": True
    },
    {
        "id": 5,
        "name": "AVINI Labs Aduthurai",
        "site_code": "ADT",
        "address": "Aduthurai, Tamil Nadu",
        "contact_phone": "6384440510",
        "email": "admin@aduthurai.avinilabs.com",
        "is_hub": False,
        "is_active": True
    }
]

# Users
users = [
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
    },
    {
        "id": 2,
        "username": "labtech",
        "password": "labtech123",
        "email": "labtech@example.com",
        "first_name": "Lab",
        "last_name": "Technician",
        "role": "lab_tech",
        "tenant_id": 1,
        "is_active": True
    },
    {
        "id": 3,
        "username": "reception",
        "password": "reception123",
        "email": "reception@example.com",
        "first_name": "Front",
        "last_name": "Desk",
        "role": "receptionist",
        "tenant_id": 1,
        "is_active": True
    }
]

# Generate random patients
def generate_random_patient(id):
    gender = random.choice(['Male', 'Female'])
    first_name = random.choice(tn_first_names)
    last_name = random.choice(tn_last_names)
    city = random.choice(tn_cities)
    blood_groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    blood_group = random.choice(blood_groups)
    
    # Generate a random date of birth (18-80 years old)
    now = datetime.now()
    min_age = 18
    max_age = 80
    birth_year = now.year - min_age - random.randint(0, max_age - min_age)
    birth_month = random.randint(1, 12)
    birth_day = random.randint(1, 28)  # Avoid invalid dates
    date_of_birth = datetime(birth_year, birth_month, birth_day).strftime('%Y-%m-%d')
    
    # Generate a random 10-digit phone number starting with 9, 8, or 7
    phone_prefix = random.choice([9, 8, 7])
    phone_number = str(phone_prefix) + ''.join([str(random.randint(0, 9)) for _ in range(9)])
    
    # Generate a random creation date (within the last year)
    days_ago = random.randint(0, 365)
    created_at = (now - timedelta(days=days_ago)).isoformat()
    
    return {
        'id': id,
        'patient_id': f"P{id:05d}",
        'first_name': first_name,
        'last_name': last_name,
        'gender': gender,
        'date_of_birth': date_of_birth,
        'phone': phone_number,
        'email': f"{first_name.lower()}.{last_name.lower()}@example.com",
        'address': f"{random.randint(1, 100)}, {random.choice(['Main Road', 'Cross Street', 'Temple Street', 'Nehru Street', 'Gandhi Road'])}",
        'city': city,
        'state': 'Tamil Nadu',
        'postal_code': str(random.randint(600000, 699999)),
        'blood_group': blood_group,
        'created_at': created_at,
        'updated_at': created_at,
        'tenant_id': random.choice([1, 2, 3]),
        'created_by': random.choice([1, 2, 3])
    }

# Generate random samples
def generate_random_sample(id, patient_id):
    sample_type_id = random.choice([1, 2, 3, 4, 5])
    container_id = next((c['id'] for c in containers if c['sample_type_id'] == sample_type_id), None)
    
    # Generate a random creation date (within the last 30 days)
    days_ago = random.randint(0, 30)
    created_at = (datetime.now() - timedelta(days=days_ago)).isoformat()
    
    # Generate collection date (same as created_at)
    collection_date = created_at.split('T')[0]
    
    # Generate collection time
    collection_time = created_at.split('T')[1].split('.')[0]
    
    # Generate status
    status = random.choice(['Collected', 'In Transit', 'Received', 'Processed', 'Completed'])
    
    return {
        'id': id,
        'sample_id': f"S{id:05d}",
        'patient_id': patient_id,
        'sample_type_id': sample_type_id,
        'sample_type': next((st['type_name'] for st in sample_types if st['id'] == sample_type_id), None),
        'container_id': container_id,
        'collection_date': collection_date,
        'collection_time': collection_time,
        'status': status,
        'created_at': created_at,
        'updated_at': created_at,
        'tenant_id': random.choice([1, 2, 3]),
        'collected_by': random.choice([1, 2, 3])
    }

# Generate random results
def generate_random_result(id, sample_id, test_id):
    # Generate a random creation date (within the last 30 days)
    days_ago = random.randint(0, 30)
    created_at = (datetime.now() - timedelta(days=days_ago)).isoformat()
    
    # Generate result date (same as created_at)
    result_date = created_at
    
    # Generate status
    status = random.choice(['Pending', 'Completed', 'Verified'])
    
    # Generate random value based on test
    if test_id == 1:  # CBC
        value = f"WBC: {random.randint(4000, 11000)}/µL, RBC: {random.uniform(4.0, 6.0):.2f}M/µL, Hb: {random.randint(12, 18)}g/dL"
        unit = "Various"
        reference_range = "WBC: 4000-11000/µL, RBC: 4.5-5.5M/µL, Hb: 12-18g/dL"
    elif test_id == 2:  # Blood Glucose
        value = str(random.randint(70, 180))
        unit = "mg/dL"
        reference_range = "70-100 mg/dL"
    elif test_id == 3:  # HbA1c
        value = str(random.uniform(4.0, 10.0))
        unit = "%"
        reference_range = "4.0-5.6%"
    elif test_id == 4:  # Lipid Profile
        value = f"TC: {random.randint(120, 250)}, TG: {random.randint(50, 200)}, HDL: {random.randint(30, 80)}, LDL: {random.randint(50, 180)}"
        unit = "mg/dL"
        reference_range = "TC: <200, TG: <150, HDL: >40, LDL: <100"
    else:
        value = str(random.randint(1, 100))
        unit = "units"
        reference_range = "1-100 units"
    
    return {
        'id': id,
        'result_id': f"R{id:05d}",
        'sample_id': sample_id,
        'test_id': test_id,
        'value': value,
        'unit': unit,
        'reference_range': reference_range,
        'status': status,
        'result_date': result_date,
        'created_at': created_at,
        'updated_at': created_at,
        'tenant_id': random.choice([1, 2, 3]),
        'created_by': random.choice([1, 2, 3])
    }

# Generate data
patients = []
samples = []
results = []
billings = []

# Generate 50 patients
for i in range(1, 51):
    patients.append(generate_random_patient(i))

# Generate 100 samples (some patients have multiple samples)
for i in range(1, 101):
    patient_id = random.randint(1, 50)
    samples.append(generate_random_sample(i, patient_id))

# Generate 200 results (some samples have multiple tests)
result_id = 1
for sample in samples:
    # Each sample has 1-3 tests
    num_tests = random.randint(1, 3)
    test_ids = random.sample(range(1, len(tests) + 1), min(num_tests, len(tests)))
    
    for test_id in test_ids:
        results.append(generate_random_result(result_id, sample['id'], test_id))
        result_id += 1

# Generate 30 billings
for i in range(1, 31):
    patient_id = random.randint(1, 50)
    
    # Generate a random creation date (within the last 90 days)
    days_ago = random.randint(0, 90)
    created_at = (datetime.now() - timedelta(days=days_ago)).isoformat()
    
    # Generate invoice date (same as created_at)
    invoice_date = created_at.split('T')[0]
    
    # Generate due date (30 days after invoice date)
    due_date = (datetime.fromisoformat(created_at) + timedelta(days=30)).strftime('%Y-%m-%d')
    
    # Generate items (1-5 tests)
    num_items = random.randint(1, 5)
    items = []
    subtotal = 0
    
    for j in range(num_items):
        test_id = random.randint(1, len(tests))
        test = next((t for t in tests if t['id'] == test_id), None)
        
        if test:
            quantity = random.randint(1, 3)
            price = test['price']
            amount = quantity * price
            subtotal += amount
            
            items.append({
                'id': j + 1,
                'test_id': test_id,
                'test_name': test['test_name'],
                'quantity': quantity,
                'price': price,
                'amount': amount
            })
    
    # Calculate total
    discount = round(subtotal * random.uniform(0, 0.2), 2)  # 0-20% discount
    tax = round(subtotal * 0.18, 2)  # 18% GST
    total_amount = subtotal - discount + tax
    
    # Generate payment status
    status = random.choice(['Pending', 'Paid', 'Partial'])
    
    # Generate paid amount based on status
    if status == 'Paid':
        paid_amount = total_amount
        balance = 0
    elif status == 'Partial':
        paid_amount = round(total_amount * random.uniform(0.1, 0.9), 2)
        balance = total_amount - paid_amount
    else:
        paid_amount = 0
        balance = total_amount
    
    billings.append({
        'id': i,
        'invoice_number': f"INV{i:05d}",
        'patient_id': patient_id,
        'items': items,
        'subtotal': subtotal,
        'discount': discount,
        'tax': tax,
        'total_amount': total_amount,
        'paid_amount': paid_amount,
        'balance': balance,
        'payment_method': random.choice(['Cash', 'Card', 'UPI', 'Bank Transfer']),
        'payment_status': status,
        'status': status,
        'invoice_date': invoice_date,
        'due_date': due_date,
        'created_at': created_at,
        'updated_at': created_at,
        'tenant_id': random.choice([1, 2, 3]),
        'created_by': random.choice([1, 2, 3])
    })

# Write data to files
def write_data(filename, data):
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

write_data('users.json', users)
write_data('tenants.json', tenants)
write_data('sample_types.json', sample_types)
write_data('containers.json', containers)
write_data('tests.json', tests)
write_data('patients.json', patients)
write_data('samples.json', samples)
write_data('results.json', results)
write_data('billings.json', billings)

print(f"Mock data initialized with:")
print(f"- {len(users)} users")
print(f"- {len(tenants)} tenants")
print(f"- {len(sample_types)} sample types")
print(f"- {len(containers)} containers")
print(f"- {len(tests)} tests")
print(f"- {len(patients)} patients")
print(f"- {len(samples)} samples")
print(f"- {len(results)} results")
print(f"- {len(billings)} billings")
