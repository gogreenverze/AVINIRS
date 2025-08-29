#!/usr/bin/env python3
"""
Test script for billing module enhancements
Tests SID search, role-based access, and other new features
"""

import requests
import json
import sys
import os

# Configuration
BASE_URL = "http://localhost:5001"
TEST_USERS = {
    "admin": {"username": "admin", "password": "admin123"},
    "hub_admin": {"username": "mayiladhuthurai", "password": "super123"},
    "franchise_admin": {"username": "sirkazhi", "password": "sirkazhi123"}
}

class BillingTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        
    def login(self, user_type):
        """Login and get token for user type"""
        try:
            response = self.session.post(
                f"{BASE_URL}/api/auth/login",
                json=TEST_USERS[user_type]
            )
            
            if response.status_code == 200:
                data = response.json()
                self.tokens[user_type] = data['token']
                print(f"✓ Login successful for {user_type}")
                return True
            else:
                print(f"✗ Login failed for {user_type}: {response.text}")
                return False
        except Exception as e:
            print(f"✗ Login error for {user_type}: {e}")
            return False
    
    def test_sid_search(self, user_type):
        """Test SID number search functionality"""
        print(f"\n--- Testing SID Search for {user_type} ---")
        
        if user_type not in self.tokens:
            print(f"✗ No token for {user_type}")
            return False
            
        headers = {
            "Authorization": f"Bearer {self.tokens[user_type]}",
            "Content-Type": "application/json"
        }
        
        # Test SID search
        test_sids = ["MYD001", "SKZ001", "TNJ002"]
        
        for sid in test_sids:
            try:
                response = self.session.get(
                    f"{BASE_URL}/api/billing/search?q={sid}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    items = data.get('items', [])
                    print(f"  ✓ SID search '{sid}': Found {len(items)} results")
                    
                    # Verify results contain the SID
                    for item in items:
                        if sid.lower() in item.get('sid_number', '').lower():
                            print(f"    ✓ Found matching SID: {item.get('sid_number')}")
                            break
                else:
                    print(f"  ✗ SID search '{sid}' failed: {response.status_code}")
                    
            except Exception as e:
                print(f"  ✗ SID search error for '{sid}': {e}")
        
        return True
    
    def test_role_based_access(self):
        """Test role-based access control"""
        print(f"\n--- Testing Role-Based Access Control ---")
        
        for user_type in ["admin", "hub_admin", "franchise_admin"]:
            if user_type not in self.tokens:
                continue
                
            headers = {
                "Authorization": f"Bearer {self.tokens[user_type]}",
                "Content-Type": "application/json"
            }
            
            try:
                response = self.session.get(
                    f"{BASE_URL}/api/billing?limit=10",
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    items = data.get('items', [])
                    print(f"  ✓ {user_type}: Can access {len(items)} invoices")
                    
                    # Check tenant filtering
                    tenant_ids = set(item.get('tenant_id') for item in items)
                    print(f"    - Accessible tenant IDs: {sorted(tenant_ids)}")
                    
                else:
                    print(f"  ✗ {user_type}: Access failed - {response.status_code}")
                    
            except Exception as e:
                print(f"  ✗ {user_type}: Access error - {e}")
    
    def test_enhanced_filtering(self, user_type):
        """Test enhanced filtering capabilities"""
        print(f"\n--- Testing Enhanced Filtering for {user_type} ---")
        
        if user_type not in self.tokens:
            return False
            
        headers = {
            "Authorization": f"Bearer {self.tokens[user_type]}",
            "Content-Type": "application/json"
        }
        
        # Test different filters
        filters = [
            {"status": "Paid"},
            {"status": "Pending"},
            {"sid_number": "MYD"},
            {"invoice_number": "INV"},
            {"start_date": "2025-01-01", "end_date": "2025-12-31"}
        ]
        
        for filter_params in filters:
            try:
                response = self.session.get(
                    f"{BASE_URL}/api/billing",
                    params=filter_params,
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    items = data.get('items', [])
                    print(f"  ✓ Filter {filter_params}: Found {len(items)} results")
                else:
                    print(f"  ✗ Filter {filter_params}: Failed - {response.status_code}")
                    
            except Exception as e:
                print(f"  ✗ Filter error for {filter_params}: {e}")
    
    def test_sid_uniqueness(self):
        """Test SID number uniqueness"""
        print(f"\n--- Testing SID Number Uniqueness ---")
        
        # Use admin token for comprehensive access
        if "admin" not in self.tokens:
            print("✗ No admin token for uniqueness test")
            return False
            
        headers = {
            "Authorization": f"Bearer {self.tokens['admin']}",
            "Content-Type": "application/json"
        }
        
        try:
            response = self.session.get(
                f"{BASE_URL}/api/billing?limit=1000",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                items = data.get('items', [])
                
                # Check SID uniqueness
                sid_numbers = []
                duplicates = []
                
                for item in items:
                    sid = item.get('sid_number')
                    if sid:
                        if sid in sid_numbers:
                            duplicates.append(sid)
                        else:
                            sid_numbers.append(sid)
                
                if duplicates:
                    print(f"  ✗ Found duplicate SID numbers: {duplicates}")
                    return False
                else:
                    print(f"  ✓ All {len(sid_numbers)} SID numbers are unique")
                    return True
                    
            else:
                print(f"  ✗ Failed to fetch invoices: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"  ✗ SID uniqueness test error: {e}")
            return False
    
    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("=" * 60)
        print("BILLING MODULE ENHANCEMENT TESTS")
        print("=" * 60)
        
        # Login all users
        login_success = True
        for user_type in TEST_USERS.keys():
            if not self.login(user_type):
                login_success = False
        
        if not login_success:
            print("\n✗ Some logins failed. Continuing with available users...")
        
        # Test SID search for each user type
        for user_type in self.tokens.keys():
            self.test_sid_search(user_type)
        
        # Test role-based access
        self.test_role_based_access()
        
        # Test enhanced filtering
        for user_type in self.tokens.keys():
            self.test_enhanced_filtering(user_type)
        
        # Test SID uniqueness
        self.test_sid_uniqueness()
        
        print("\n" + "=" * 60)
        print("TESTING COMPLETED")
        print("=" * 60)

def main():
    """Main test function"""
    tester = BillingTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
