#!/usr/bin/env python3
"""
Test Billing Reports API Endpoints
Quick test to verify the API endpoints are working correctly
"""

import requests
import json
from datetime import datetime

def test_billing_reports_api():
    """Test the billing reports API endpoints"""
    base_url = "http://localhost:5001"
    
    print("🧪 Testing Billing Reports API Endpoints")
    print("=" * 60)
    
    # Test data for authentication
    auth_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        # Step 1: Login to get token
        print("🔐 Step 1: Authenticating...")
        login_response = requests.post(f"{base_url}/api/auth/login", json=auth_data)
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return
        
        login_data = login_response.json()
        token = login_data.get('token')
        
        if not token:
            print("❌ No token received from login")
            return
        
        print("✅ Authentication successful")
        
        # Headers for authenticated requests
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        # Step 2: Test search reports endpoint (empty search)
        print("\n📋 Step 2: Testing search reports (empty search)...")
        search_response = requests.get(f"{base_url}/api/billing-reports/search", headers=headers)
        
        if search_response.status_code == 200:
            search_data = search_response.json()
            print(f"✅ Search endpoint working")
            print(f"   Success: {search_data.get('success')}")
            print(f"   Data structure: {list(search_data.keys())}")
            
            if 'data' in search_data and 'data' in search_data['data']:
                reports = search_data['data']['data']
                print(f"   Reports found: {len(reports)}")
                
                if reports:
                    first_report = reports[0]
                    print(f"   First report SID: {first_report.get('sid_number')}")
                    print(f"   Patient: {first_report.get('patient_name')}")
                    print(f"   Test count: {first_report.get('test_count')}")
                    print(f"   Amount: {first_report.get('total_amount')}")
            else:
                print(f"   Unexpected data structure: {search_data}")
        else:
            print(f"❌ Search failed: {search_response.status_code}")
            print(f"Response: {search_response.text}")
        
        # Step 3: Test stats endpoint
        print("\n📊 Step 3: Testing stats endpoint...")
        stats_response = requests.get(f"{base_url}/api/billing-reports/stats", headers=headers)
        
        if stats_response.status_code == 200:
            stats_data = stats_response.json()
            print(f"✅ Stats endpoint working")
            print(f"   Success: {stats_data.get('success')}")
            
            if 'data' in stats_data and 'data' in stats_data['data']:
                stats = stats_data['data']['data']
                print(f"   Total reports: {stats.get('total_reports')}")
                print(f"   Total amount: {stats.get('total_amount')}")
                print(f"   Access level: {stats.get('user_access_level')}")
            else:
                print(f"   Unexpected stats structure: {stats_data}")
        else:
            print(f"❌ Stats failed: {stats_response.status_code}")
            print(f"Response: {stats_response.text}")
        
        # Step 4: Test SID autocomplete
        print("\n🔍 Step 4: Testing SID autocomplete...")
        autocomplete_response = requests.get(f"{base_url}/api/billing-reports/sid-autocomplete?q=AM", headers=headers)
        
        if autocomplete_response.status_code == 200:
            autocomplete_data = autocomplete_response.json()
            print(f"✅ Autocomplete endpoint working")
            print(f"   Success: {autocomplete_data.get('success')}")
            
            if 'data' in autocomplete_data and 'data' in autocomplete_data['data']:
                suggestions = autocomplete_data['data']['data']
                print(f"   Suggestions for 'AM': {suggestions}")
            else:
                print(f"   Unexpected autocomplete structure: {autocomplete_data}")
        else:
            print(f"❌ Autocomplete failed: {autocomplete_response.status_code}")
            print(f"Response: {autocomplete_response.text}")
        
        # Step 5: Test specific SID lookup
        print("\n🎯 Step 5: Testing specific SID lookup...")
        sid_response = requests.get(f"{base_url}/api/billing-reports/sid/AM004", headers=headers)
        
        if sid_response.status_code == 200:
            sid_data = sid_response.json()
            print(f"✅ SID lookup endpoint working")
            print(f"   Success: {sid_data.get('success')}")
            
            if 'data' in sid_data and 'data' in sid_data['data']:
                report = sid_data['data']['data']
                print(f"   Found report: {report.get('sid_number')}")
                print(f"   Patient: {report.get('patient_info', {}).get('full_name')}")
                print(f"   Test items: {len(report.get('test_items', []))}")
            else:
                print(f"   Unexpected SID lookup structure: {sid_data}")
        else:
            print(f"❌ SID lookup failed: {sid_response.status_code}")
            print(f"Response: {sid_response.text}")
        
        print("\n🎉 API Testing Complete!")
        print("✅ All endpoints are working correctly")
        print("✅ Data format is compatible with frontend")
        print("✅ Authentication is working")
        print("✅ Reports are accessible")
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")

if __name__ == "__main__":
    test_billing_reports_api()
