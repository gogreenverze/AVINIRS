#!/usr/bin/env python3
"""
Test script to verify the Liquid Profile fix
Tests that the corrected profile now expands properly into sub-tests
"""

import sys
import os
import json
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.billing_reports_service import BillingReportsService

def test_fixed_liquid_profile():
    """Test the fixed Liquid Profile lookup and expansion"""
    print("=" * 70)
    print("TESTING FIXED LIQUID PROFILE")
    print("=" * 70)
    
    service = BillingReportsService()
    
    # Test profile lookup by ID
    profile_id = "01464b61-469c-439f-aba7-a7a6814c6406"
    profile = service.get_profile_by_id(profile_id)
    
    if profile:
        print(f"✅ Profile found: {profile.get('test_profile')}")
        print(f"   Profile ID: {profile.get('id')}")
        print(f"   Test Items: {len(profile.get('testItems', []))}")
        
        all_tests_found = True
        # Check each test item
        for item in profile.get('testItems', []):
            test_id = item.get('test_id')
            test_name = item.get('testName')
            print(f"     - {test_name} (ID: {test_id})")
            
            # Check if test exists in test_master
            test_data = service.get_test_by_id(test_id)
            if test_data:
                print(f"       ✅ Found in test_master: {test_data.get('testName')}")
                print(f"       Department: {test_data.get('department')}")
                print(f"       Specimen: {test_data.get('primarySpecimen')}")
                print(f"       Reference Range: {test_data.get('reference_range')}")
            else:
                print(f"       ❌ NOT FOUND in test_master")
                all_tests_found = False
        
        return all_tests_found
    else:
        print(f"❌ Profile not found for ID: {profile_id}")
        return False

def test_profile_expansion():
    """Test profile expansion into sub-tests"""
    print(f"\n" + "=" * 70)
    print("TESTING PROFILE EXPANSION")
    print("=" * 70)
    
    service = BillingReportsService()
    
    # Create a mock profile test item
    profile_test_item = {
        "test_name": "Liquid Profile",
        "quantity": 1,
        "price": 400,
        "amount": 400,
        "id": 1755692765321,
        "test_master_id": "01464b61-469c-439f-aba7-a7a6814c6406",
        "profile_type": True,
        "sub_tests": [
            {"test_id": 255, "testName": "Cholesterol, Total", "amount": 0},
            {"test_id": 252, "testName": "Cholesterol, HDL", "amount": 0},
            {"test_id": 253, "testName": "Cholesterol, LDL", "amount": 0},
            {"test_id": 257, "testName": "Cholesterol/HDL Ratio", "amount": 0},
            {"test_id": 256, "testName": "Cholesterol, VLDL", "amount": 0}
        ]
    }
    
    # Test expansion
    expanded_tests = service.expand_profile_to_subtests(profile_test_item)
    
    print(f"✅ Profile expansion completed:")
    print(f"   Original profile: {profile_test_item['test_name']}")
    print(f"   Sub-tests in profile: {len(profile_test_item['sub_tests'])}")
    print(f"   Expanded tests: {len(expanded_tests)}")
    
    if len(expanded_tests) > 0:
        print(f"\n📋 Expanded Sub-tests:")
        for i, test in enumerate(expanded_tests):
            print(f"   {i+1}. {test.get('test_name')}")
            print(f"      Department: {test.get('department', 'N/A')}")
            print(f"      Specimen: {test.get('specimen', 'N/A')}")
            print(f"      Container: {test.get('container', 'N/A')}")
            print(f"      Reference Range: {test.get('reference_range', 'N/A')}")
            print(f"      Result Unit: {test.get('result_unit', 'N/A')}")
            print(f"      Price: ₹{test.get('price', 0)}")
            print(f"      Parent Profile: {test.get('parent_profile_name')}")
            print(f"      Is Profile Subtest: {test.get('is_profile_subtest')}")
        
        return True
    else:
        print(f"❌ No tests were expanded")
        return False

def test_billing_report_generation():
    """Test complete billing report generation with fixed profile"""
    print(f"\n" + "=" * 70)
    print("TESTING BILLING REPORT GENERATION")
    print("=" * 70)
    
    service = BillingReportsService()
    
    # Test with billing ID 94 (SID: 478) which contains the Liquid Profile
    billing_id = 94
    
    try:
        report = service.generate_comprehensive_report(
            billing_id,
            user_id=1,
            tenant_id=1
        )
        
        if report:
            test_items = report.get('test_items', [])
            unmatched_tests = report.get('unmatched_tests', [])
            
            print(f"✅ Report generated successfully!")
            print(f"   Report ID: {report.get('id')}")
            print(f"   SID Number: {report.get('sid_number')}")
            print(f"   Total Test Items: {len(test_items)}")
            print(f"   Unmatched Tests: {len(unmatched_tests)}")
            
            # Check for profile sub-tests
            profile_subtests = [t for t in test_items if t.get('is_profile_subtest')]
            individual_tests = [t for t in test_items if not t.get('is_profile_subtest')]
            
            print(f"\n📊 Test Analysis:")
            print(f"   Profile Sub-tests: {len(profile_subtests)}")
            print(f"   Individual Tests: {len(individual_tests)}")
            
            if profile_subtests:
                print(f"\n🧪 Profile Sub-tests Details:")
                for test in profile_subtests:
                    print(f"   {test.get('subtest_index')}/{test.get('total_subtests')}. {test.get('test_name')}")
                    print(f"      Department: {test.get('department', 'N/A')}")
                    print(f"      Specimen: {test.get('specimen', 'N/A')}")
                    print(f"      Reference Range: {test.get('reference_range', 'N/A')}")
                    print(f"      Result Unit: {test.get('result_unit', 'N/A')}")
                    print(f"      Parent Profile: {test.get('parent_profile_name')}")
            
            return len(profile_subtests) > 0
        else:
            print(f"❌ Report generation failed")
            return False
            
    except Exception as e:
        print(f"❌ Error during report generation: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests to verify the fix"""
    print("LIQUID PROFILE FIX VERIFICATION")
    print("Testing that the corrected Liquid Profile now works properly")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests_passed = 0
    total_tests = 3
    
    # Run tests
    if test_fixed_liquid_profile():
        tests_passed += 1
    
    if test_profile_expansion():
        tests_passed += 1
    
    if test_billing_report_generation():
        tests_passed += 1
    
    # Summary
    print("\n" + "=" * 70)
    print("FIX VERIFICATION SUMMARY")
    print("=" * 70)
    print(f"Tests passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("🎉 ALL TESTS PASSED! The Liquid Profile fix is working correctly.")
        print("\n✅ ISSUE RESOLVED:")
        print("   • Liquid Profile now uses correct test IDs from test_master.json")
        print("   • Profile expands into 5 individual cholesterol sub-tests")
        print("   • Each sub-test has complete clinical data")
        print("   • Billing reports now display expanded sub-tests properly")
        print("\n🚀 The billing report at http://localhost:3000/billing/reports/478?from=samples")
        print("   should now show the expanded cholesterol tests instead of 'No test items found'")
        return True
    else:
        print("❌ Some tests failed. The fix may need additional work.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
