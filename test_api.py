import requests
import json

# Test patient search API directly
base_url = 'http://localhost:5001'

# Login as sirkazhi user
login_response = requests.post(f'{base_url}/api/auth/login', json={
    'username': 'sirkazhi',
    'password': 'sirkazhi123'
})

if login_response.status_code == 200:
    token = login_response.json().get('token')
    user = login_response.json().get('user')
    print(f'Login successful. User: {user.get("username")}, Role: {user.get("role")}, Tenant: {user.get("tenant_id")}')
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test 1: Search without branch filter
    print('\n--- Test 1: Search without branch filter ---')
    search_url = f'{base_url}/api/patients/search?q=a'
    response = requests.get(search_url, headers=headers)
    print(f'Status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        patients = data.get('items', data)
        print(f'Found {len(patients)} patients')
        for p in patients[:3]:  # Show first 3
            print(f'  - {p.get("patient_id")}: {p.get("first_name")} {p.get("last_name")} (Tenant: {p.get("tenant_id")})')
    else:
        print(f'Error: {response.text}')
    
    # Test 2: Search with branch filter (Sirkazhi = tenant_id 2)
    print('\n--- Test 2: Search with branch filter (Sirkazhi = 2) ---')
    search_url = f'{base_url}/api/patients/search?q=a&branch_id=2'
    response = requests.get(search_url, headers=headers)
    print(f'Status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        patients = data.get('items', data)
        print(f'Found {len(patients)} patients')
        for p in patients[:3]:  # Show first 3
            print(f'  - {p.get("patient_id")}: {p.get("first_name")} {p.get("last_name")} (Tenant: {p.get("tenant_id")})')
    else:
        print(f'Error: {response.text}')
        
    # Test 3: Search for specific patient
    print('\n--- Test 3: Search for SKZ patient ---')
    search_url = f'{base_url}/api/patients/search?q=SKZ&branch_id=2'
    response = requests.get(search_url, headers=headers)
    print(f'Status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        patients = data.get('items', data)
        print(f'Found {len(patients)} patients')
        for p in patients:
            print(f'  - {p.get("patient_id")}: {p.get("first_name")} {p.get("last_name")} (Tenant: {p.get("tenant_id")})')
    else:
        print(f'Error: {response.text}')
else:
    print(f'Login failed: {login_response.status_code} - {login_response.text}')
