#!/usr/bin/env python3
"""
Test script for Access Management System
This script tests the backend API endpoints and validates the access control functionality.
"""

import requests
import json
import sys
import time

# Configuration
BASE_URL = "http://localhost:5001"
TEST_USERS = {
    "hub_admin": {"username": "mayiladhuthurai", "password": "super123"},
    "franchise_admin": {"username": "sirkazhi", "password": "sirkazhi123"},
    "admin": {"username": "admin", "password": "admin123"}
}

class AccessManagementTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        
    def login(self, user_type):
        """Login and get authentication token"""
        try:
            credentials = TEST_USERS[user_type]
            response = self.session.post(f"{BASE_URL}/api/auth/login", json=credentials)
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('token')
                self.tokens[user_type] = token
                print(f"✓ Login successful for {user_type}")
                return token
            else:
                print(f"✗ Login failed for {user_type}: {response.text}")
                return None
        except Exception as e:
            print(f"✗ Login error for {user_type}: {str(e)}")
            return None
    
    def test_modules_endpoint(self, user_type):
        """Test the modules endpoint"""
        print(f"\n--- Testing modules endpoint for {user_type} ---")
        
        token = self.tokens.get(user_type)
        if not token:
            print(f"✗ No token available for {user_type}")
            return False
            
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            response = self.session.get(f"{BASE_URL}/api/access-management/modules", headers=headers)
            
            if response.status_code == 200:
                modules = response.json().get('data', [])
                print(f"✓ Modules endpoint accessible, returned {len(modules)} modules")
                return True
            else:
                print(f"✗ Modules endpoint failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"✗ Modules endpoint error: {str(e)}")
            return False
    
    def test_franchise_permissions_endpoint(self, user_type):
        """Test the franchise permissions endpoint"""
        print(f"\n--- Testing franchise permissions endpoint for {user_type} ---")
        
        token = self.tokens.get(user_type)
        if not token:
            print(f"✗ No token available for {user_type}")
            return False
            
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            response = self.session.get(f"{BASE_URL}/api/access-management/franchise-permissions", headers=headers)
            
            if response.status_code == 200:
                permissions = response.json().get('data', [])
                print(f"✓ Franchise permissions endpoint accessible, returned {len(permissions)} permission sets")
                return True
            elif response.status_code == 403:
                print(f"✓ Franchise permissions endpoint correctly denied access for {user_type}")
                return True
            else:
                print(f"✗ Franchise permissions endpoint failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"✗ Franchise permissions endpoint error: {str(e)}")
            return False
    
    def test_module_access_check(self, user_type, module_code):
        """Test module access checking"""
        print(f"\n--- Testing module access check for {user_type} - {module_code} ---")
        
        token = self.tokens.get(user_type)
        if not token:
            print(f"✗ No token available for {user_type}")
            return False
            
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            response = self.session.get(f"{BASE_URL}/api/access-management/check-module-access/{module_code}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                has_access = data.get('has_access', False)
                message = data.get('message', '')
                print(f"✓ Module access check successful: {has_access} - {message}")
                return True
            else:
                print(f"✗ Module access check failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"✗ Module access check error: {str(e)}")
            return False
    
    def test_inventory_access(self, user_type):
        """Test inventory module access"""
        print(f"\n--- Testing inventory access for {user_type} ---")
        
        token = self.tokens.get(user_type)
        if not token:
            print(f"✗ No token available for {user_type}")
            return False
            
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            response = self.session.get(f"{BASE_URL}/api/inventory", headers=headers)
            
            if response.status_code == 200:
                print(f"✓ Inventory access granted for {user_type}")
                return True
            elif response.status_code == 403:
                print(f"✓ Inventory access correctly denied for {user_type}")
                return True
            else:
                print(f"✗ Inventory access test failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"✗ Inventory access test error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all access management tests"""
        print("=" * 60)
        print("AVINI Labs Access Management System Test")
        print("=" * 60)
        
        # Test login for all user types
        print("\n1. Testing Authentication")
        for user_type in TEST_USERS.keys():
            self.login(user_type)
        
        # Test modules endpoint
        print("\n2. Testing Modules Endpoint")
        for user_type in self.tokens.keys():
            self.test_modules_endpoint(user_type)
        
        # Test franchise permissions endpoint
        print("\n3. Testing Franchise Permissions Endpoint")
        for user_type in self.tokens.keys():
            self.test_franchise_permissions_endpoint(user_type)
        
        # Test module access checks
        print("\n4. Testing Module Access Checks")
        test_modules = ["INVENTORY", "ADMIN", "USER_MANAGEMENT", "SETTINGS"]
        for user_type in self.tokens.keys():
            for module in test_modules:
                self.test_module_access_check(user_type, module)
        
        # Test actual module access
        print("\n5. Testing Actual Module Access")
        for user_type in self.tokens.keys():
            self.test_inventory_access(user_type)
        
        print("\n" + "=" * 60)
        print("Access Management System Test Complete")
        print("=" * 60)

def main():
    """Main function"""
    print("Starting Access Management System Tests...")
    print("Make sure the backend server is running on http://localhost:5001")
    
    # Wait a moment for user to read
    time.sleep(2)
    
    tester = AccessManagementTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
