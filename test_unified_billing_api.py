#!/usr/bin/env python3
"""
Test script for the unified billing API
Tests both new patient creation and existing patient billing in a single API call
"""

import requests
import json

BASE_URL = 'http://localhost:5001/api'

def test_login():
    """Test login and get token"""
    print("🔐 Testing login...")
    
    login_data = {
        'username': 'sirkazhi',
        'password': 'sirkazhi123'
    }
    
    try:
        response = requests.post(f'{BASE_URL}/auth/login', json=login_data)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login successful. User: {data.get('user', {}).get('username')}")
            return data.get('token')
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_unified_billing_new_patient(token):
    """Test unified billing API with new patient creation"""
    print("\n🆕 Testing unified billing API - NEW PATIENT...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Test data for new patient + billing
    billing_data = {
        # New patient data
        'patient_data': {
            'first_name': 'Test',
            'last_name': 'Patient',
            'gender': 'Male',
            'date_of_birth': '1990-01-01',
            'phone': '9876543210',
            'email': 'test@example.com',
            'address': 'Test Address',
            'city': 'Test City',
            'state': 'Tamil Nadu',
            'postal_code': '600001',
            'emergency_contact': '',
            'emergency_phone': '',
            'blood_group': '',
            'insurance_provider': '',
            'insurance_id': '',
            'tenant_id': 2  # Sirkazhi branch
        },
        # Billing data
        'items': [
            {
                'test_id': 1,
                'test_name': 'Blood Test',
                'amount': 100.0,
                'quantity': 1
            }
        ],
        'total_amount': 100.0,
        'paid_amount': 100.0,
        'payment_method': 'Cash',
        'branch': 2
        # Let backend auto-generate SID
    }
    
    try:
        response = requests.post(f'{BASE_URL}/billing', json=billing_data, headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ SUCCESS: Created billing with ID {data.get('id')} and SID {data.get('sid_number')}")
            print(f"   Patient created with ID: {data.get('patient_id')}")
            return data.get('id')
        else:
            print(f"❌ FAILED: {response.text}")
            return None
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return None

def test_unified_billing_existing_patient(token):
    """Test unified billing API with existing patient"""
    print("\n👤 Testing unified billing API - EXISTING PATIENT...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Test data for existing patient billing
    billing_data = {
        # Existing patient ID
        'patient_id': 1,  # Use existing patient
        # Billing data
        'items': [
            {
                'test_id': 2,
                'test_name': 'X-Ray',
                'amount': 200.0,
                'quantity': 1
            }
        ],
        'total_amount': 200.0,
        'paid_amount': 200.0,
        'payment_method': 'Card',
        'branch': 2
        # Let backend auto-generate SID
    }
    
    try:
        response = requests.post(f'{BASE_URL}/billing', json=billing_data, headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ SUCCESS: Created billing with ID {data.get('id')} and SID {data.get('sid_number')}")
            print(f"   Used existing patient ID: {data.get('patient_id')}")
            return data.get('id')
        else:
            print(f"❌ FAILED: {response.text}")
            return None
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return None

def main():
    """Main test function"""
    print("🚀 Testing Unified Billing API")
    print("=" * 50)
    
    # Test login
    token = test_login()
    if not token:
        print("❌ Cannot proceed without valid token")
        return
    
    # Test new patient creation + billing
    new_billing_id = test_unified_billing_new_patient(token)
    
    # Test existing patient billing
    existing_billing_id = test_unified_billing_existing_patient(token)
    
    # Summary
    print("\n📊 TEST SUMMARY")
    print("=" * 50)
    print(f"New Patient Billing: {'✅ PASSED' if new_billing_id else '❌ FAILED'}")
    print(f"Existing Patient Billing: {'✅ PASSED' if existing_billing_id else '❌ FAILED'}")
    
    if new_billing_id and existing_billing_id:
        print("\n🎉 ALL TESTS PASSED! Unified billing API is working correctly.")
    else:
        print("\n⚠️ Some tests failed. Check the error messages above.")

if __name__ == '__main__':
    main()
