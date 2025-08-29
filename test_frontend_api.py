import requests
import json

# Test the exact same API call that the frontend would make
base_url = 'http://localhost:5001/api'

# Login as sirkazhi user (franchise admin)
login_response = requests.post(f'{base_url}/auth/login', json={
    'username': 'sirkazhi',
    'password': 'sirkazhi123'
})

if login_response.status_code == 200:
    token = login_response.json().get('token')
    user = login_response.json().get('user')
    print(f'✅ Login successful. User: {user.get("username")}, Role: {user.get("role")}, Tenant: {user.get("tenant_id")}')
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test the exact API call that frontend makes
    print('\n--- Testing Frontend API Call ---')
    
    # Simulate frontend call: search for "a" with branch_id=2 (Sirkazhi)
    search_url = f'{base_url}/patients/search?q=a&branch_id=2'
    print(f'Making request to: {search_url}')
    
    response = requests.get(search_url, headers=headers)
    print(f'Status: {response.status_code}')
    
    if response.status_code == 200:
        data = response.json()
        print(f'Response type: {type(data)}')
        print(f'Response keys: {list(data.keys()) if isinstance(data, dict) else "Not a dict"}')
        
        # Check if it has 'items' key (paginated response)
        if isinstance(data, dict) and 'items' in data:
            patients = data['items']
            print(f'✅ Found {len(patients)} patients in "items" key')
        elif isinstance(data, list):
            patients = data
            print(f'✅ Found {len(patients)} patients in direct list')
        else:
            patients = []
            print(f'❌ Unexpected response format')
        
        # Show first few patients
        for i, patient in enumerate(patients[:3]):
            print(f'  {i+1}. {patient.get("patient_id")}: {patient.get("first_name")} {patient.get("last_name")} (Tenant: {patient.get("tenant_id")})')
        
        # Test the exact response parsing that frontend uses
        frontend_patients = data.get('items', data) if isinstance(data, dict) else data
        print(f'\nFrontend would get: {len(frontend_patients)} patients')
        
    else:
        print(f'❌ Error: {response.status_code} - {response.text}')
        
    # Also test without branch filter
    print('\n--- Testing without branch filter ---')
    search_url = f'{base_url}/patients/search?q=a'
    response = requests.get(search_url, headers=headers)
    print(f'Status: {response.status_code}')
    
    if response.status_code == 200:
        data = response.json()
        patients = data.get('items', data) if isinstance(data, dict) else data
        print(f'Found {len(patients)} patients without branch filter')
    else:
        print(f'Error: {response.status_code} - {response.text}')
        
else:
    print(f'❌ Login failed: {login_response.status_code} - {login_response.text}')
