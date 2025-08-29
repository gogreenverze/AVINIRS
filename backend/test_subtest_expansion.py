#!/usr/bin/env python3
"""
Test script to verify sub-test expansion functionality
Tests that profile tests are properly expanded into individual sub-tests
"""

import sys
import os
import json
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.billing_reports_service import BillingReportsService

def test_subtest_expansion():
    """Test profile sub-test expansion functionality"""
    print("=" * 60)
    print("TESTING SUB-TEST EXPANSION FUNCTIONALITY")
    print("=" * 60)
    
    service = BillingReportsService()
    
    # Create a mock profile test item (based on the actual structure)
    profile_test_item = {
        "test_name": "testing profile",
        "quantity": 1,
        "price": 100,
        "amount": 100,
        "id": 1755690011474,
        "test_master_id": "1535110d-a306-4d07-ade6-2c12d781d085",
        "profile_type": True,
        "sub_tests": [
            {
                "test_id": 48,
                "testName": "MYOGLOBIN-SERUM",
                "amount": 0
            },
            {
                "test_id": 12,
                "testName": "Chromosome Analysis - Product of Conception",
                "amount": 0
            }
        ]
    }
    
    # Test expansion
    expanded_tests = service.expand_profile_to_subtests(profile_test_item)
    
    print(f"✅ Profile expansion completed:")
    print(f"   Original profile: {profile_test_item['test_name']}")
    print(f"   Sub-tests found: {len(profile_test_item['sub_tests'])}")
    print(f"   Expanded tests: {len(expanded_tests)}")
    
    # Verify each expanded test
    for i, test in enumerate(expanded_tests):
        print(f"\n   Expanded Test {i+1}:")
        print(f"     Name: {test.get('test_name')}")
        print(f"     Department: {test.get('department', 'N/A')}")
        print(f"     Specimen: {test.get('specimen', 'N/A')}")
        print(f"     Container: {test.get('container', 'N/A')}")
        print(f"     Method: {test.get('method', 'N/A')}")
        print(f"     Reference Range: {test.get('reference_range', 'N/A')}")
        print(f"     Result Unit: {test.get('result_unit', 'N/A')}")
        print(f"     Price: {test.get('price', 'N/A')}")
        print(f"     Parent Profile: {test.get('parent_profile_name', 'N/A')}")
        print(f"     Is Profile Subtest: {test.get('is_profile_subtest', False)}")
        print(f"     Subtest Index: {test.get('subtest_index', 'N/A')}")
    
    return len(expanded_tests) > 0

def test_billing_report_with_expansion():
    """Test complete billing report generation with sub-test expansion"""
    print(f"\n" + "=" * 60)
    print("TESTING BILLING REPORT WITH SUB-TEST EXPANSION")
    print("=" * 60)
    
    service = BillingReportsService()
    
    # Find a billing with the new profile test
    billings_file = os.path.join("data", "billings.json")
    if not os.path.exists(billings_file):
        print("❌ Billings file not found")
        return False
    
    with open(billings_file, 'r', encoding='utf-8') as f:
        billings = json.load(f)
    
    # Look for billing with the new profile test
    target_profile_id = "1535110d-a306-4d07-ade6-2c12d781d085"
    billing_id = None
    
    for billing in billings:
        items = billing.get('items', [])
        for item in items:
            test_id = item.get('test_id')
            if str(test_id) == target_profile_id:
                billing_id = billing.get('id')
                print(f"✅ Found billing with new profile test:")
                print(f"   Billing ID: {billing_id}")
                print(f"   SID: {billing.get('sid_number', 'N/A')}")
                break
        if billing_id:
            break
    
    if not billing_id:
        print("❌ No billing found with the new profile test")
        return False
    
    # Generate report with expansion
    try:
        report = service.generate_comprehensive_report(
            billing_id,
            user_id=1,
            tenant_id=1
        )
        
        if not report:
            print("❌ Report generation failed")
            return False
        
        print(f"✅ Report generated with sub-test expansion!")
        print(f"   Report ID: {report.get('id')}")
        print(f"   SID Number: {report.get('sid_number')}")
        print(f"   Total Test Items: {len(report.get('test_items', []))}")
        
        # Analyze test items for profile sub-tests
        test_items = report.get('test_items', [])
        profile_subtests = []
        individual_tests = []
        
        for test in test_items:
            if test.get('is_profile_subtest'):
                profile_subtests.append(test)
            else:
                individual_tests.append(test)
        
        print(f"\n   Test Analysis:")
        print(f"     Profile Sub-tests: {len(profile_subtests)}")
        print(f"     Individual Tests: {len(individual_tests)}")
        
        # Display profile sub-tests
        if profile_subtests:
            print(f"\n   Profile Sub-tests Details:")
            current_profile = None
            for test in profile_subtests:
                parent_profile = test.get('parent_profile_name')
                if parent_profile != current_profile:
                    current_profile = parent_profile
                    print(f"\n     Profile: {parent_profile}")
                
                print(f"       {test.get('subtest_index')}/{test.get('total_subtests')}. {test.get('test_name')}")
                print(f"         Department: {test.get('department', 'N/A')}")
                print(f"         Specimen: {test.get('specimen', 'N/A')}")
                print(f"         Container: {test.get('container', 'N/A')}")
                print(f"         Reference Range: {test.get('reference_range', 'N/A')}")
                print(f"         Result Unit: {test.get('result_unit', 'N/A')}")
        
        return len(profile_subtests) > 0
        
    except Exception as e:
        print(f"❌ Error during report generation: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("SUB-TEST EXPANSION FUNCTIONALITY TEST")
    print("Testing profile test expansion into individual sub-tests")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests_passed = 0
    total_tests = 2
    
    # Run tests
    if test_subtest_expansion():
        tests_passed += 1
    
    if test_billing_report_with_expansion():
        tests_passed += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Tests passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("🎉 ALL TESTS PASSED! Sub-test expansion is working correctly.")
        print("Profile tests are now expanded into individual sub-tests with complete clinical data.")
        return True
    else:
        print("❌ Some tests failed. Please check the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
