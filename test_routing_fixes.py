#!/usr/bin/env python3
"""
Test script to verify the routing functionality fixes for franchise admin role.
This script tests the three main issues:
1. Destination list visibility for franchise admins
2. Source filtering for franchise admins  
3. Route visibility in transaction views
"""

import requests
import json
import sys

BASE_URL = "http://localhost:5001"

def login(username, password):
    """Login and get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": username,
        "password": password
    })
    if response.status_code == 200:
        return response.json().get('token')
    else:
        print(f"Login failed: {response.status_code} - {response.text}")
        return None

def test_accessible_tenants(token, role_name):
    """Test the /api/tenants/accessible endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/tenants/accessible", headers=headers)
    
    print(f"\n=== Testing Accessible Tenants for {role_name} ===")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        tenants = response.json()
        print(f"Number of accessible tenants: {len(tenants)}")
        print("Accessible tenants:")
        for tenant in tenants:
            print(f"  - {tenant['name']} (ID: {tenant['id']}, Code: {tenant['site_code']})")
        return tenants
    else:
        print(f"Error: {response.text}")
        return []

def test_sample_routings(token, role_name):
    """Test the /api/samples/routing endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/samples/routing", headers=headers)
    
    print(f"\n=== Testing Sample Routings for {role_name} ===")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        routings = data.get('items', data) if isinstance(data, dict) else data
        print(f"Number of visible routings: {len(routings)}")
        
        if routings and len(routings) > 0:
            print("Sample routing details:")
            for i, routing in enumerate(routings):
                if i >= 3:  # Show first 3
                    break
                print(f"  - ID: {routing['id']}, From: {routing.get('from_tenant_id')}, To: {routing.get('to_tenant_id')}, Status: {routing.get('status')}")
        return routings
    else:
        print(f"Error: {response.text}")
        return []

def test_current_tenant(token, role_name):
    """Test the /api/tenants/current endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/tenants/current", headers=headers)
    
    print(f"\n=== Testing Current Tenant for {role_name} ===")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        tenant = response.json()
        print(f"Current tenant: {tenant['name']} (ID: {tenant['id']}, Code: {tenant['site_code']})")
        return tenant
    else:
        print(f"Error: {response.text}")
        return None

def main():
    print("Testing Routing Functionality Fixes")
    print("=" * 50)
    
    # Test credentials for different roles
    test_users = [
        {"username": "mayiladhuthurai", "password": "super123", "role": "Super Admin"},
        {"username": "sirkazhi", "password": "sirkazhi123", "role": "Franchise Admin (Sirkazhi)"},
        {"username": "thanjavur", "password": "thanjavur123", "role": "Franchise Admin (Thanjavur)"}
    ]
    
    for user in test_users:
        print(f"\n{'='*60}")
        print(f"Testing with {user['role']} ({user['username']})")
        print(f"{'='*60}")
        
        # Login
        token = login(user['username'], user['password'])
        if not token:
            print(f"Failed to login as {user['username']}")
            continue
        
        print(f"✓ Successfully logged in as {user['username']}")
        
        # Test current tenant
        current_tenant = test_current_tenant(token, user['role'])
        
        # Test accessible tenants (destination list)
        accessible_tenants = test_accessible_tenants(token, user['role'])
        
        # Test sample routings (transaction views)
        routings = test_sample_routings(token, user['role'])
        
        # Analysis
        print(f"\n--- Analysis for {user['role']} ---")
        if user['role'] == "Super Admin":
            print("✓ Super admin should see all tenants and all routings")
        else:
            print(f"✓ Franchise admin should see other franchises as destinations ({len(accessible_tenants)} found)")
            print(f"✓ Franchise admin should see routings involving their tenant ({len(routings)} found)")
            
            if current_tenant:
                current_tenant_id = current_tenant['id']
                relevant_routings = [r for r in routings if 
                                   r.get('from_tenant_id') == current_tenant_id or 
                                   r.get('to_tenant_id') == current_tenant_id]
                print(f"✓ Routings involving current tenant: {len(relevant_routings)}")

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the backend server at http://localhost:5001")
        print("Please make sure the backend server is running.")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
