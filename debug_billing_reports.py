#!/usr/bin/env python3
"""
Debug script to test billing reports API and identify issues
"""

import requests
import json
import os

def read_json_file(file_path):
    """Simple function to read JSON file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return []

def test_billing_reports_api():
    """Test billing reports API and service"""

    print("=" * 60)
    print("BILLING REPORTS DEBUG TEST")
    print("=" * 60)

    # Test 1: Check if billing_reports.json exists and has data
    print("\n1. Checking billing_reports.json file...")
    reports_file = os.path.join('backend', 'data', 'billing_reports.json')

    if not os.path.exists(reports_file):
        print(f"❌ File not found: {reports_file}")
        return

    reports_data = read_json_file(reports_file)
    print(f"✓ Found {len(reports_data)} reports in billing_reports.json")

    if len(reports_data) > 0:
        sample_report = reports_data[0]
        print(f"✓ Sample report ID: {sample_report.get('id')}")
        print(f"✓ Sample SID: {sample_report.get('sid_number')}")
        print(f"✓ Sample tenant_id: {sample_report.get('tenant_id')}")
        print(f"✓ Sample patient: {sample_report.get('patient_info', {}).get('full_name')}")

        # Show all tenant IDs in reports
        tenant_ids = set(r.get('tenant_id') for r in reports_data)
        print(f"✓ Reports exist for tenant IDs: {sorted(tenant_ids)}")
    else:
        print("❌ No reports found in billing_reports.json")
        return

    # Test 2: Test API authentication
    print("\n2. Testing API authentication...")
    
    # First, try to login and get a token
    try:
        login_response = requests.post('http://localhost:5001/api/auth/login', json={
            'username': 'admin',
            'password': 'admin123'
        })
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            token = login_data.get('token')
            print(f"✓ Successfully logged in as admin")
            
            # Test the billing reports API
            headers = {'Authorization': f'Bearer {token}'}
            
            # Test search endpoint
            search_response = requests.get('http://localhost:5001/api/billing-reports/search', headers=headers)
            print(f"✓ Search API status: {search_response.status_code}")
            
            if search_response.status_code == 200:
                search_data = search_response.json()
                print(f"✓ Search API response: {json.dumps(search_data, indent=2)}")
                
                if search_data.get('success'):
                    reports_from_api = search_data.get('data', {}).get('data', [])
                    print(f"✓ API returned {len(reports_from_api)} reports")
                    
                    if len(reports_from_api) > 0:
                        sample_api_report = reports_from_api[0]
                        print(f"✓ Sample API report SID: {sample_api_report.get('sid_number')}")
                        print(f"✓ Sample API report patient: {sample_api_report.get('patient_name')}")
                    else:
                        print("❌ API returned empty reports list")
                else:
                    print(f"❌ API returned error: {search_data.get('message', 'Unknown error')}")
            else:
                print(f"❌ Search API failed: {search_response.text}")
                
            # Test stats endpoint
            stats_response = requests.get('http://localhost:5001/api/billing-reports/stats', headers=headers)
            print(f"✓ Stats API status: {stats_response.status_code}")
            
            if stats_response.status_code == 200:
                stats_data = stats_response.json()
                if stats_data.get('success'):
                    stats_info = stats_data.get('data', {}).get('data', {})
                    print(f"✓ Stats: {stats_info.get('total_reports')} total reports")
                    print(f"✓ Access level: {stats_info.get('user_access_level')}")
                else:
                    print(f"❌ Stats API error: {stats_data.get('message')}")
            else:
                print(f"❌ Stats API failed: {stats_response.text}")
                
        else:
            print(f"❌ Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"❌ Error testing API: {e}")
    
    print("\n" + "=" * 60)
    print("DEBUG TEST COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    test_billing_reports_api()
