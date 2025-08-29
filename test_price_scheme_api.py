#!/usr/bin/env python3
"""
Test script for Price Scheme Master API endpoints
"""

import requests
import json
import sys

BASE_URL = "http://localhost:5001"

def test_api_endpoint(endpoint, method="GET", data=None, headers=None):
    """Test an API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    
    if headers is None:
        headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'  # You may need to adjust this
        }
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=headers)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        
        print(f"\n{method} {endpoint}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code < 400:
            try:
                result = response.json()
                print(f"Response: {json.dumps(result, indent=2)[:500]}...")
                return True, result
            except:
                print(f"Response: {response.text[:200]}...")
                return True, response.text
        else:
            print(f"Error: {response.text}")
            return False, response.text
            
    except requests.exceptions.ConnectionError:
        print(f"Connection error - is the backend server running on {BASE_URL}?")
        return False, "Connection error"
    except Exception as e:
        print(f"Error: {e}")
        return False, str(e)

def main():
    """Run API tests"""
    print("Testing Price Scheme Master API Endpoints")
    print("=" * 50)
    
    # Test 1: Get price scheme master data
    success, data = test_api_endpoint("/api/admin/price-scheme-master")
    if not success:
        print("❌ Failed to get price scheme master data")
        return
    
    print("✅ Successfully retrieved price scheme master data")
    
    # Test 2: Get schemes master data
    success, schemes_data = test_api_endpoint("/api/admin/schemes-master")
    if not success:
        print("❌ Failed to get schemes master data")
        return
    
    print("✅ Successfully retrieved schemes master data")
    
    # Test 3: Add a new price scheme entry
    test_entry = {
        "dept_code": "@BC",
        "dept_name": "LAB",
        "scheme_code": "@000002",
        "scheme_name": "L2L",
        "test_type": "T",
        "test_code": "@TEST001",
        "test_name": "Test API Entry",
        "default_price": 100.0,
        "scheme_price": 80.0,
        "price_percentage": 80.0,
        "is_active": True
    }
    
    success, add_result = test_api_endpoint("/api/admin/price-scheme-master", "POST", test_entry)
    if success:
        print("✅ Successfully added new price scheme entry")
        
        # Test 4: Update the entry
        if 'data' in add_result and 'id' in add_result['data']:
            entry_id = add_result['data']['id']
            update_data = {
                "scheme_price": 75.0,
                "price_percentage": 75.0
            }
            
            success, update_result = test_api_endpoint(f"/api/admin/price-scheme-master/{entry_id}", "PUT", update_data)
            if success:
                print("✅ Successfully updated price scheme entry")
                
                # Test 5: Delete the entry
                success, delete_result = test_api_endpoint(f"/api/admin/price-scheme-master/{entry_id}", "DELETE")
                if success:
                    print("✅ Successfully deleted price scheme entry")
                else:
                    print("❌ Failed to delete price scheme entry")
            else:
                print("❌ Failed to update price scheme entry")
        else:
            print("⚠️ Could not get entry ID for update/delete tests")
    else:
        print("❌ Failed to add new price scheme entry")
    
    print("\n" + "=" * 50)
    print("API Testing Complete")

if __name__ == "__main__":
    main()
