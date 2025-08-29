#!/usr/bin/env python3
"""
Test script to verify billing API endpoints are working correctly
"""

import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:5001/api"
TEST_USER_CREDENTIALS = {
    "username": "admin",
    "password": "admin123"
}

def test_auth():
    """Test authentication and get token"""
    print("🔐 Testing authentication...")
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=TEST_USER_CREDENTIALS)
        if response.status_code == 200:
            token = response.json().get('token')
            print(f"✅ Authentication successful. Token: {token[:20]}...")
            return token
        else:
            print(f"❌ Authentication failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return None

def test_billing_endpoints(token):
    """Test billing API endpoints"""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    print("\n📋 Testing billing endpoints...")
    
    # Test GET /api/billing
    print("1. Testing GET /api/billing...")
    try:
        response = requests.get(f"{BASE_URL}/billing", headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success: Found {len(data.get('items', []))} billing records")
        else:
            print(f"   ❌ Failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test POST /api/billing (create billing)
    print("\n2. Testing POST /api/billing...")
    test_billing_data = {
        "patient_id": 1,
        "items": [
            {
                "test_id": 1,
                "test_name": "Blood Test",
                "quantity": 1,
                "price": 100,
                "amount": 100
            }
        ],
        "total_amount": 100,
        "paid_amount": 0,
        "branch": 1
    }
    
    try:
        response = requests.post(f"{BASE_URL}/billing", json=test_billing_data, headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 201:
            data = response.json()
            print(f"   ✅ Success: Created billing with ID {data.get('id')} and SID {data.get('sid_number')}")
            return data.get('id')
        else:
            print(f"   ❌ Failed: {response.text}")
            return None
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return None

def test_due_amounts_endpoint(token):
    """Test due amounts endpoint"""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    print("\n💰 Testing due amounts endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/billing/due-amounts", headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success: Found {len(data.get('items', []))} due amounts")
        else:
            print(f"   ❌ Failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")

def test_refund_endpoints(token):
    """Test refund endpoints"""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    print("\n🔄 Testing refund endpoints...")
    
    # Test GET refunds
    print("1. Testing GET /api/billing/refunds...")
    try:
        response = requests.get(f"{BASE_URL}/billing/refunds", headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success: Found {len(data.get('items', []))} refund requests")
        else:
            print(f"   ❌ Failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")

def test_sid_generation(token):
    """Test SID generation endpoint"""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    print("\n🔢 Testing SID generation...")
    test_data = {"tenant_id": 1}
    
    try:
        response = requests.post(f"{BASE_URL}/billing/generate-sid", json=test_data, headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success: Generated SID {data.get('sid_number')}")
        else:
            print(f"   ❌ Failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")

def main():
    """Main test function"""
    print("🧪 AVINI Labs Billing API Test Suite")
    print("=" * 50)
    
    # Test authentication
    token = test_auth()
    if not token:
        print("❌ Cannot proceed without authentication token")
        sys.exit(1)
    
    # Test billing endpoints
    billing_id = test_billing_endpoints(token)
    
    # Test due amounts
    test_due_amounts_endpoint(token)
    
    # Test refund endpoints
    test_refund_endpoints(token)
    
    # Test SID generation
    test_sid_generation(token)
    
    print("\n" + "=" * 50)
    print("🏁 Test suite completed!")

if __name__ == "__main__":
    main()
