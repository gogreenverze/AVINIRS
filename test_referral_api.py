#!/usr/bin/env python3
"""
Test script for Referral Master API endpoints
"""

import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:5002/api"
ADMIN_ENDPOINT = f"{BASE_URL}/admin/referral-master"

# Global token storage
AUTH_TOKEN = None

# Test data for the 5 referral entries
TEST_REFERRALS = [
    {
        "id": "metro_cardiology",
        "name": "Metro Cardiology Center",
        "description": "Specialized cardiac care center with comprehensive diagnostic services",
        "category": "medical",
        "defaultPricingScheme": "standard",
        "discountPercentage": 12,
        "commissionPercentage": 8,
        "isActive": True,
        "priority": 1
    },
    {
        "id": "techcorp_health",
        "name": "TechCorp Employee Health Program",
        "description": "Corporate health program for TechCorp employees and their families",
        "category": "corporate",
        "defaultPricingScheme": "corporate",
        "discountPercentage": 20,
        "commissionPercentage": 5,
        "isActive": True,
        "priority": 2
    },
    {
        "id": "city_general",
        "name": "City General Hospital",
        "description": "Multi-specialty hospital with 24/7 emergency services",
        "category": "institutional",
        "defaultPricingScheme": "hospital",
        "discountPercentage": 8,
        "commissionPercentage": 10,
        "isActive": True,
        "priority": 3
    },
    {
        "id": "senior_care_plus",
        "name": "Senior Care Plus Program",
        "description": "Specialized healthcare program for senior citizens with enhanced benefits",
        "category": "social",
        "defaultPricingScheme": "senior",
        "discountPercentage": 25,
        "commissionPercentage": 0,
        "isActive": True,
        "priority": 4
    },
    {
        "id": "quicklab_express",
        "name": "QuickLab Express Services",
        "description": "Express diagnostic services for urgent and same-day testing requirements",
        "category": "professional",
        "defaultPricingScheme": "wholesale",
        "discountPercentage": 15,
        "commissionPercentage": 12,
        "isActive": True,
        "priority": 5
    }
]

def get_auth_token():
    """Get authentication token for testing"""
    login_url = f"{BASE_URL}/auth/login"
    login_data = {
        "username": "admin",
        "password": "admin123"
    }

    try:
        response = requests.post(login_url, json=login_data)
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            if token:
                print(f"✓ Successfully logged in and got token")
                return token
            else:
                print("✗ Login successful but no token received")
                return None
        else:
            print(f"✗ Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"✗ Login error: {e}")
        return None

def test_get_referrals():
    """Test GET /api/admin/referral-master"""
    print("Testing GET referral master...")

    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(ADMIN_ENDPOINT, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data.get('success', False)}")
            print(f"Total referrals: {data.get('total', 0)}")
            print("✓ GET referrals test passed")
            return True
        else:
            print(f"✗ GET referrals test failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ GET referrals test error: {e}")
        return False

def test_add_referral(referral_data):
    """Test POST /api/admin/referral-master"""
    print(f"Testing POST referral: {referral_data['name']}")

    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(ADMIN_ENDPOINT, headers=headers, json=referral_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"Success: {data.get('success', False)}")
            print(f"Message: {data.get('message', '')}")
            print(f"✓ POST referral test passed for {referral_data['name']}")
            return True
        else:
            print(f"✗ POST referral test failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ POST referral test error: {e}")
        return False

def test_update_referral(referral_id, update_data):
    """Test PUT /api/admin/referral-master/{id}"""
    print(f"Testing PUT referral: {referral_id}")

    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.put(f"{ADMIN_ENDPOINT}/{referral_id}", headers=headers, json=update_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data.get('success', False)}")
            print(f"Message: {data.get('message', '')}")
            print(f"✓ PUT referral test passed for {referral_id}")
            return True
        else:
            print(f"✗ PUT referral test failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ PUT referral test error: {e}")
        return False

def test_delete_referral(referral_id):
    """Test DELETE /api/admin/referral-master/{id}"""
    print(f"Testing DELETE referral: {referral_id}")

    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.delete(f"{ADMIN_ENDPOINT}/{referral_id}", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data.get('success', False)}")
            print(f"Message: {data.get('message', '')}")
            print(f"✓ DELETE referral test passed for {referral_id}")
            return True
        else:
            print(f"✗ DELETE referral test failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ DELETE referral test error: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("REFERRAL MASTER API TESTING")
    print("=" * 60)

    # First, get authentication token
    print("\n0. Getting authentication token...")
    token = get_auth_token()
    if not token:
        print("✗ Failed to get authentication token. Exiting.")
        return

    # Store token globally for other functions
    global AUTH_TOKEN
    AUTH_TOKEN = token

    # Test 1: Get existing referrals
    print("\n1. Testing GET referrals...")
    test_get_referrals()
    
    # Test 2: Add new referrals
    print("\n2. Testing POST referrals...")
    for referral in TEST_REFERRALS:
        test_add_referral(referral)
        print()
    
    # Test 3: Update a referral
    print("\n3. Testing PUT referral...")
    update_data = {
        "discountPercentage": 15,
        "description": "Updated: Specialized cardiac care center with comprehensive diagnostic and preventive care services"
    }
    test_update_referral("metro_cardiology", update_data)
    
    # Test 4: Get referrals again to verify additions
    print("\n4. Testing GET referrals after additions...")
    test_get_referrals()
    
    # Test 5: Delete a referral
    print("\n5. Testing DELETE referral...")
    test_delete_referral("quicklab_express")
    
    # Test 6: Final GET to verify deletion
    print("\n6. Testing GET referrals after deletion...")
    test_get_referrals()
    
    print("\n" + "=" * 60)
    print("API TESTING COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    main()
