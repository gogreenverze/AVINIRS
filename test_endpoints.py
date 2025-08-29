#!/usr/bin/env python3
"""
Test script to check if the backend endpoints are working
"""

import requests
import json

def test_endpoint(url, description):
    """Test a single endpoint"""
    try:
        print(f"Testing {description}...")
        print(f"URL: {url}")
        
        response = requests.get(url, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"✅ Success: {description}")
                print(f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                return True
            except json.JSONDecodeError:
                print(f"❌ Invalid JSON response for {description}")
                print(f"Response text: {response.text[:200]}...")
                return False
        else:
            print(f"❌ Failed: {description}")
            print(f"Response: {response.text[:200]}...")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection Error: Cannot connect to {url}")
        print("   Make sure the backend server is running on localhost:5001")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ Timeout: {description} took too long to respond")
        return False
    except Exception as e:
        print(f"❌ Error testing {description}: {e}")
        return False

def main():
    print("AVINIRS Backend Endpoint Test")
    print("="*50)
    
    base_url = "http://localhost:5001"
    
    endpoints = [
        (f"{base_url}/api/health", "Health Check"),
        (f"{base_url}/api/admin/analytics", "Admin Analytics"),
        (f"{base_url}/api/dashboard/comprehensive", "Comprehensive Dashboard"),
    ]
    
    results = []
    
    for url, description in endpoints:
        success = test_endpoint(url, description)
        results.append((description, success))
        print("-" * 30)
    
    print("\nSUMMARY:")
    print("="*50)
    
    all_passed = True
    for description, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {description}")
        if not success:
            all_passed = False
    
    if all_passed:
        print("\n🎉 All endpoints are working correctly!")
        print("The admin dashboard pages should now load successfully.")
    else:
        print("\n⚠️  Some endpoints failed.")
        print("Check if the backend server is running and try again.")

if __name__ == "__main__":
    main()
