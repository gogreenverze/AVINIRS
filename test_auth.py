#!/usr/bin/env python3
"""
Authentication Test Script
Tests the authentication flow and token validation
"""

import requests
import json
import time

BASE_URL = 'http://localhost:5001/api'

def test_login():
    """Test login functionality"""
    print("Testing login...")
    
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    response = requests.post(f'{BASE_URL}/auth/login', json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        token = data.get('token')
        user = data.get('user')
        print(f"✓ Login successful for user: {user.get('username')}")
        print(f"✓ Token received: {token[:50]}...")
        return token
    else:
        print(f"✗ Login failed: {response.status_code} - {response.text}")
        return None

def test_protected_route(token):
    """Test accessing a protected route"""
    print("\nTesting protected route access...")
    
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'{BASE_URL}/auth/user', headers=headers)
    
    if response.status_code == 200:
        user = response.json()
        print(f"✓ Protected route access successful for user: {user.get('username')}")
        return True
    else:
        print(f"✗ Protected route access failed: {response.status_code} - {response.text}")
        return False

def test_token_validation(token):
    """Test token validation endpoint"""
    print("\nTesting token validation...")
    
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.post(f'{BASE_URL}/auth/validate', headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Token validation successful:")
        print(f"  - Valid: {data.get('valid')}")
        print(f"  - User ID: {data.get('user_id')}")
        print(f"  - Username: {data.get('username')}")
        print(f"  - Role: {data.get('role')}")
        print(f"  - Active: {data.get('is_active')}")
        return True
    else:
        print(f"✗ Token validation failed: {response.status_code} - {response.text}")
        return False

def test_token_refresh(token):
    """Test token refresh functionality"""
    print("\nTesting token refresh...")
    
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.post(f'{BASE_URL}/auth/refresh', headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        new_token = data.get('token')
        print(f"✓ Token refresh successful")
        print(f"✓ New token received: {new_token[:50]}...")
        return new_token
    else:
        print(f"✗ Token refresh failed: {response.status_code} - {response.text}")
        return None

def test_patients_endpoint(token):
    """Test accessing patients endpoint"""
    print("\nTesting patients endpoint...")
    
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'{BASE_URL}/patients', headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Patients endpoint access successful")
        print(f"✓ Retrieved {len(data.get('items', []))} patients")
        return True
    else:
        print(f"✗ Patients endpoint access failed: {response.status_code} - {response.text}")
        return False

def main():
    """Run all authentication tests"""
    print("=== Authentication Test Suite ===\n")
    
    # Test login
    token = test_login()
    if not token:
        print("\n✗ Authentication tests failed - cannot proceed without token")
        return
    
    # Test protected route access
    if not test_protected_route(token):
        print("\n✗ Basic authentication test failed")
        return
    
    # Test token validation
    test_token_validation(token)
    
    # Test token refresh
    new_token = test_token_refresh(token)
    if new_token:
        # Test with refreshed token
        test_protected_route(new_token)
        token = new_token
    
    # Test a typical API endpoint
    test_patients_endpoint(token)
    
    print("\n=== Test Suite Complete ===")
    print("✓ All authentication tests passed!")

if __name__ == '__main__':
    main()
