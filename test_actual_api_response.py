#!/usr/bin/env python3
"""
Test Actual API Response Format
Check exactly what the frontend is receiving from the backend
"""

import requests
import json

def test_actual_api_response():
    """Test the actual API response format"""
    base_url = "http://localhost:5001"
    
    print("🧪 Testing Actual API Response Format")
    print("=" * 60)
    
    # Login as mayiladhuthurai user
    auth_data = {
        "username": "mayiladhuthurai",
        "password": "super123"
    }
    
    try:
        # Step 1: Login
        print("🔐 Step 1: Logging in as mayiladhuthurai...")
        login_response = requests.post(f"{base_url}/api/auth/login", json=auth_data)
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return
        
        login_data = login_response.json()
        token = login_data.get('token')
        print("✅ Login successful")
        
        # Headers for authenticated requests
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        # Step 2: Test search reports endpoint
        print("\n📋 Step 2: Testing search reports endpoint...")
        search_response = requests.get(f"{base_url}/api/billing-reports/search", headers=headers)
        
        print(f"Status Code: {search_response.status_code}")
        print(f"Response Headers: {dict(search_response.headers)}")
        
        if search_response.status_code == 200:
            response_data = search_response.json()
            print(f"\n📊 Raw Response Data:")
            print(json.dumps(response_data, indent=2))
            
            print(f"\n🔍 Response Analysis:")
            print(f"   Success: {response_data.get('success')}")
            print(f"   Top-level keys: {list(response_data.keys())}")
            
            if 'data' in response_data:
                data_section = response_data['data']
                print(f"   Data section type: {type(data_section)}")
                print(f"   Data section keys: {list(data_section.keys()) if isinstance(data_section, dict) else 'Not a dict'}")
                
                if isinstance(data_section, dict) and 'data' in data_section:
                    reports_array = data_section['data']
                    print(f"   Reports array type: {type(reports_array)}")
                    print(f"   Reports array length: {len(reports_array) if isinstance(reports_array, list) else 'Not a list'}")
                    
                    if isinstance(reports_array, list) and len(reports_array) > 0:
                        print(f"   First report keys: {list(reports_array[0].keys())}")
                        print(f"   First report SID: {reports_array[0].get('sid_number')}")
                        print(f"   First report patient: {reports_array[0].get('patient_name')}")
                else:
                    print(f"   Data section content: {data_section}")
            
            # Test what frontend code would do
            print(f"\n🖥️  Frontend Code Simulation:")
            
            # This is what the frontend code does:
            if response_data.get('success'):
                reports_data = response_data.get('data', {}).get('data') or response_data.get('data') or []
                print(f"   Frontend would get: {type(reports_data)} with length {len(reports_data) if isinstance(reports_data, list) else 'N/A'}")
                print(f"   Is array: {isinstance(reports_data, list)}")
                
                if isinstance(reports_data, list):
                    print(f"   ✅ Frontend would work correctly")
                    for i, report in enumerate(reports_data):
                        print(f"      Report {i+1}: {report.get('sid_number')} - {report.get('patient_name')}")
                else:
                    print(f"   ❌ Frontend would fail - reports_data is not an array")
                    print(f"   reports_data content: {reports_data}")
        else:
            print(f"❌ Search failed: {search_response.status_code}")
            print(f"Response: {search_response.text}")
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")

if __name__ == "__main__":
    test_actual_api_response()
