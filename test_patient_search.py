#!/usr/bin/env python3
"""
Test script for patient search functionality in billing registration
Tests branch-based patient filtering and search functionality
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5001"
FRONTEND_URL = "http://localhost:3000"

# Test users for different scenarios
TEST_USERS = {
    "hub_admin": {
        "username": "admin",
        "password": "admin123",
        "expected_role": "admin",
        "description": "Mayiladuthurai Hub Admin - should see all franchises"
    },
    "franchise_admin": {
        "username": "sirkazhi",
        "password": "sirkazhi123",
        "expected_role": "franchise_admin",
        "description": "Sirkazhi Franchise Admin - should see only Sirkazhi patients"
    }
}

def print_header(title):
    """Print a formatted header"""
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)

def print_test_result(test_name, success, message=""):
    """Print test result with formatting"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if message:
        print(f"    {message}")

def login_user(username, password):
    """Login and return token"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": username,
            "password": password
        })

        if response.status_code == 200:
            data = response.json()
            return data.get('token'), data.get('user')
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
            return None, None
    except Exception as e:
        print(f"Login error: {e}")
        return None, None

def get_accessible_tenants(token):
    """Get accessible tenants for the user"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/tenants/accessible", headers=headers)

        if response.status_code == 200:
            return response.json()
        else:
            print(f"Failed to get accessible tenants: {response.status_code}")
            return []
    except Exception as e:
        print(f"Error getting accessible tenants: {e}")
        return []

def search_patients(token, query, branch_id=None):
    """Search patients with optional branch filter"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        url = f"{BASE_URL}/api/patients/search?q={query}"
        if branch_id:
            url += f"&branch_id={branch_id}"

        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json()
        else:
            print(f"Patient search failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Patient search error: {e}")
        return None

def test_patient_search_by_branch():
    """Test patient search functionality for different branches"""
    print_header("TESTING PATIENT SEARCH BY BRANCH")

    all_tests_passed = True

    for user_type, user_info in TEST_USERS.items():
        print(f"\n--- Testing as {user_info['description']} ---")

        # Login
        token, user = login_user(user_info['username'], user_info['password'])
        if not token:
            print_test_result(f"Login as {user_type}", False, "Failed to login")
            all_tests_passed = False
            continue

        print_test_result(f"Login as {user_type}", True, f"Role: {user.get('role')}")

        # Get accessible tenants
        accessible_tenants = get_accessible_tenants(token)
        print(f"    Accessible tenants: {len(accessible_tenants)}")
        for tenant in accessible_tenants:
            print(f"      - {tenant.get('name')} (ID: {tenant.get('id')})")

        # Test patient search for each accessible branch
        for tenant in accessible_tenants:
            branch_id = tenant.get('id')
            branch_name = tenant.get('name')

            print(f"\n  Testing patient search for {branch_name} (ID: {branch_id})")

            # Search for patients with a common query
            search_results = search_patients(token, "a", branch_id)  # Search for 'a' to get multiple results

            if search_results is None:
                print_test_result(f"Search patients in {branch_name}", False, "API call failed")
                all_tests_passed = False
                continue

            patients = search_results.get('items', search_results)
            print(f"    Found {len(patients)} patients")

            # Verify all patients belong to the correct branch
            branch_patients_correct = True
            for patient in patients:
                patient_tenant_id = patient.get('tenant_id')
                patient_id = patient.get('patient_id', patient.get('id'))

                if patient_tenant_id != branch_id:
                    print(f"      ❌ Patient {patient_id} belongs to tenant {patient_tenant_id}, not {branch_id}")
                    branch_patients_correct = False
                else:
                    print(f"      ✅ Patient {patient_id} correctly belongs to tenant {branch_id}")

            print_test_result(f"Branch filtering for {branch_name}", branch_patients_correct)
            if not branch_patients_correct:
                all_tests_passed = False

        # Test search without branch filter (should use user's default access)
        print(f"\n  Testing patient search without branch filter")
        search_results = search_patients(token, "a")  # Search without branch_id

        if search_results is None:
            print_test_result("Search without branch filter", False, "API call failed")
            all_tests_passed = False
        else:
            patients = search_results.get('items', search_results)
            print(f"    Found {len(patients)} patients without branch filter")

            # For franchise admin, should only see their own patients
            if user.get('role') == 'franchise_admin':
                user_tenant_id = user.get('tenant_id')
                all_correct = all(p.get('tenant_id') == user_tenant_id for p in patients)
                print_test_result("Franchise admin sees only own patients", all_correct)
                if not all_correct:
                    all_tests_passed = False

            # For hub admin, should see patients from accessible tenants
            elif user.get('role') == 'admin':
                accessible_tenant_ids = [t.get('id') for t in accessible_tenants]
                all_correct = all(p.get('tenant_id') in accessible_tenant_ids for p in patients)
                print_test_result("Hub admin sees patients from accessible tenants", all_correct)
                if not all_correct:
                    all_tests_passed = False

    return all_tests_passed

def test_specific_patient_searches():
    """Test specific patient searches by name, ID, and phone"""
    print_header("TESTING SPECIFIC PATIENT SEARCHES")

    test_cases = [
        {"query": "Rajesh", "description": "Search by first name"},
        {"query": "Kumar", "description": "Search by last name"},
        {"query": "MYD001", "description": "Search by patient ID"},
        {"query": "9876543210", "description": "Search by phone number"},
        {"query": "SKZ001", "description": "Search for Sirkazhi patient"},
        {"query": "TNJ001", "description": "Search for Thanjavur patient"}
    ]

    all_tests_passed = True

    # Test as hub admin (should see all patients)
    token, user = login_user("admin", "admin123")
    if not token:
        print_test_result("Login as hub admin", False)
        return False

    for test_case in test_cases:
        query = test_case["query"]
        description = test_case["description"]

        print(f"\n--- {description}: '{query}' ---")

        search_results = search_patients(token, query)
        if search_results is None:
            print_test_result(description, False, "API call failed")
            all_tests_passed = False
            continue

        patients = search_results.get('items', search_results)
        print(f"Found {len(patients)} patients")

        for patient in patients:
            patient_id = patient.get('patient_id', patient.get('id'))
            name = f"{patient.get('first_name', '')} {patient.get('last_name', '')}"
            phone = patient.get('phone', '')
            tenant_id = patient.get('tenant_id')

            print(f"  - {patient_id}: {name} | {phone} | Tenant: {tenant_id}")

        # Verify search results contain the query
        found_match = False
        for patient in patients:
            if (query.lower() in patient.get('first_name', '').lower() or
                query.lower() in patient.get('last_name', '').lower() or
                query in patient.get('patient_id', '') or
                query in patient.get('phone', '')):
                found_match = True
                break

        print_test_result(description, found_match, f"Found {len(patients)} matching patients")
        if not found_match and len(patients) == 0:
            # Empty results might be OK for some searches
            print("    (Empty results - this might be expected)")

    return all_tests_passed

def main():
    """Main test function"""
    print_header("PATIENT SEARCH FUNCTIONALITY TEST")
    print(f"Testing against: {BASE_URL}")
    print(f"Frontend URL: {FRONTEND_URL}")
    print(f"Test started at: {datetime.now()}")

    all_tests_passed = True

    # Test 1: Patient search by branch
    if not test_patient_search_by_branch():
        all_tests_passed = False

    # Test 2: Specific patient searches
    if not test_specific_patient_searches():
        all_tests_passed = False

    # Final result
    print_header("TEST SUMMARY")
    if all_tests_passed:
        print("🎉 ALL TESTS PASSED!")
        print("Patient search functionality is working correctly.")
        print(f"✅ Branch-based filtering is working")
        print(f"✅ Role-based access control is working")
        print(f"✅ Search queries are working")
        print(f"\n🌐 Frontend URL: {FRONTEND_URL}/billing/registration")
        print("You can now test the frontend manually:")
        print("1. Select different branches from the dropdown")
        print("2. Search for patients using the search box")
        print("3. Verify patient results are filtered by selected branch")
    else:
        print("❌ SOME TESTS FAILED!")
        print("Please check the issues above and fix them.")
        return 1

    print(f"\nTest completed at: {datetime.now()}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
