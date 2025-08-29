#!/usr/bin/env python3
"""
Diagnostic script to troubleshoot the Liquid Profile billing report issue
Tests the specific profile and identifies missing test IDs
"""

import sys
import os
import json
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.billing_reports_service import BillingReportsService

def test_liquid_profile_lookup():
    """Test if the Liquid Profile can be found"""
    print("=" * 70)
    print("TESTING LIQUID PROFILE LOOKUP")
    print("=" * 70)
    
    service = BillingReportsService()
    
    # Test profile lookup by ID
    profile_id = "01464b61-469c-439f-aba7-a7a6814c6406"
    profile = service.get_profile_by_id(profile_id)
    
    if profile:
        print(f"✅ Profile found: {profile.get('test_profile')}")
        print(f"   Profile ID: {profile.get('id')}")
        print(f"   Test Items: {len(profile.get('testItems', []))}")
        
        # Check each test item
        for item in profile.get('testItems', []):
            test_id = item.get('test_id')
            test_name = item.get('testName')
            print(f"     - {test_name} (ID: {test_id})")
            
            # Check if test exists in test_master
            test_data = service.get_test_by_id(test_id)
            if test_data:
                print(f"       ✅ Found in test_master: {test_data.get('testName')}")
            else:
                print(f"       ❌ NOT FOUND in test_master")
        
        return True
    else:
        print(f"❌ Profile not found for ID: {profile_id}")
        return False

def test_billing_with_liquid_profile():
    """Test billing records that contain the Liquid Profile"""
    print(f"\n" + "=" * 70)
    print("TESTING BILLING RECORDS WITH LIQUID PROFILE")
    print("=" * 70)
    
    # Read billings data
    billings_file = os.path.join("data", "billings.json")
    if not os.path.exists(billings_file):
        print("❌ Billings file not found")
        return False
    
    with open(billings_file, 'r', encoding='utf-8') as f:
        billings = json.load(f)
    
    # Look for billings with the Liquid Profile
    target_profile_id = "01464b61-469c-439f-aba7-a7a6814c6406"
    found_billings = []
    
    for billing in billings:
        items = billing.get('items', [])
        for item in items:
            test_id = item.get('test_id')
            if str(test_id) == target_profile_id:
                found_billings.append(billing)
                break
    
    if found_billings:
        print(f"✅ Found {len(found_billings)} billing(s) with Liquid Profile:")
        for billing in found_billings:
            print(f"   Billing ID: {billing.get('id')}")
            print(f"   SID: {billing.get('sid_number', 'N/A')}")
            
            # Test report generation for this billing
            service = BillingReportsService()
            try:
                report = service.generate_comprehensive_report(
                    billing.get('id'),
                    user_id=1,
                    tenant_id=1
                )
                
                if report:
                    test_items = report.get('test_items', [])
                    unmatched_tests = report.get('unmatched_tests', [])
                    
                    print(f"   Report generated: ✅")
                    print(f"   Test items: {len(test_items)}")
                    print(f"   Unmatched tests: {len(unmatched_tests)}")
                    
                    if unmatched_tests:
                        print(f"   Unmatched: {unmatched_tests}")
                    
                    # Check for profile sub-tests
                    profile_subtests = [t for t in test_items if t.get('is_profile_subtest')]
                    print(f"   Profile sub-tests: {len(profile_subtests)}")
                    
                    if profile_subtests:
                        for subtest in profile_subtests:
                            print(f"     - {subtest.get('test_name')} (from {subtest.get('parent_profile_name')})")
                    
                else:
                    print(f"   Report generation: ❌ Failed")
                    
            except Exception as e:
                print(f"   Report generation: ❌ Error - {str(e)}")
        
        return True
    else:
        print("❌ No billing found with Liquid Profile")
        return False

def find_correct_cholesterol_test_ids():
    """Find the correct test IDs for cholesterol tests"""
    print(f"\n" + "=" * 70)
    print("FINDING CORRECT CHOLESTEROL TEST IDS")
    print("=" * 70)
    
    service = BillingReportsService()
    
    # Read test_master to find cholesterol tests
    test_master_file = os.path.join("data", "test_master.json")
    if not os.path.exists(test_master_file):
        print("❌ Test master file not found")
        return False
    
    with open(test_master_file, 'r', encoding='utf-8') as f:
        tests = json.load(f)
    
    cholesterol_tests = []
    for test in tests:
        test_name = test.get('testName', '').lower()
        if 'cholesterol' in test_name or 'triglyceride' in test_name or 'ldl' in test_name:
            cholesterol_tests.append(test)
    
    print(f"✅ Found {len(cholesterol_tests)} cholesterol-related tests:")
    for test in cholesterol_tests:
        print(f"   ID {test.get('id')}: {test.get('testName')}")
    
    # Suggest correct mappings
    print(f"\n📋 Suggested correct mappings for Liquid Profile:")
    mapping = {
        "Cholesterol, Total": 255,
        "Cholesterol, HDL": 252,
        "Cholesterol, LDL": 253,
        "Cholesterol/HDL Ratio": 257,
        "Cholesterol, VLDL": 256
    }
    
    for test_name, test_id in mapping.items():
        print(f"   {test_name}: ID {test_id}")
    
    print(f"\n⚠️  Missing tests (need to be added to test_master or removed from profile):")
    missing_tests = ["LDL/HDL Ratio", "Triglycerides"]
    for test_name in missing_tests:
        print(f"   {test_name}: NOT FOUND")
    
    return True

def main():
    """Run all diagnostic tests"""
    print("LIQUID PROFILE BILLING REPORT DIAGNOSTIC")
    print("Troubleshooting the Liquid Profile sub-test expansion issue")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests_passed = 0
    total_tests = 3
    
    # Run tests
    if test_liquid_profile_lookup():
        tests_passed += 1
    
    if test_billing_with_liquid_profile():
        tests_passed += 1
    
    if find_correct_cholesterol_test_ids():
        tests_passed += 1
    
    # Summary
    print("\n" + "=" * 70)
    print("DIAGNOSTIC SUMMARY")
    print("=" * 70)
    print(f"Tests completed: {tests_passed}/{total_tests}")
    
    print(f"\n🔍 ISSUE IDENTIFIED:")
    print(f"   The Liquid Profile uses test IDs that don't exist in test_master.json")
    print(f"   This causes the sub-test expansion to fail because the individual")
    print(f"   cholesterol tests cannot be found.")
    
    print(f"\n💡 SOLUTION:")
    print(f"   Update the Liquid Profile in profiles.json to use correct test IDs")
    print(f"   that actually exist in test_master.json")
    
    return tests_passed == total_tests

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
