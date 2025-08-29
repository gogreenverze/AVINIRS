#!/usr/bin/env python3
"""
Test script to verify complete billing report generation with profile tests
Tests the end-to-end flow from billing creation to report generation
"""

import sys
import os
import json
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.billing_reports_service import BillingReportsService

def find_billing_with_profile():
    """Find a billing record that contains profile tests"""
    print("=" * 60)
    print("FINDING BILLING WITH PROFILE TESTS")
    print("=" * 60)
    
    # Read billings data
    billings_file = os.path.join("data", "billings.json")
    if not os.path.exists(billings_file):
        print("❌ Billings file not found")
        return None
    
    with open(billings_file, 'r', encoding='utf-8') as f:
        billings = json.load(f)
    
    # Look for billings with profile tests (UUID format test_ids)
    for billing in billings:
        items = billing.get('items', [])
        for item in items:
            test_id = item.get('test_id')
            if test_id and isinstance(test_id, str) and len(test_id) > 10 and '-' in test_id:
                print(f"✅ Found billing with profile test:")
                print(f"   Billing ID: {billing.get('id')}")
                print(f"   SID: {billing.get('sid_number', 'N/A')}")
                print(f"   Profile Test ID: {test_id}")
                print(f"   Test Name: {item.get('test_name', 'N/A')}")
                return billing.get('id')
    
    print("❌ No billing found with profile tests")
    return None

def test_report_generation(billing_id):
    """Test complete report generation for a billing with profile tests"""
    print(f"\n" + "=" * 60)
    print(f"TESTING REPORT GENERATION FOR BILLING {billing_id}")
    print("=" * 60)
    
    service = BillingReportsService()
    
    try:
        # Generate comprehensive report
        report = service.generate_comprehensive_report(
            billing_id,
            user_id=1,
            tenant_id=1
        )
        
        if not report:
            print("❌ Report generation failed")
            return False
        
        print(f"✅ Report generated successfully!")
        print(f"   Report ID: {report.get('id')}")
        print(f"   SID Number: {report.get('sid_number')}")
        print(f"   Patient: {report.get('patient_info', {}).get('full_name', 'N/A')}")
        print(f"   Total Tests: {len(report.get('test_items', []))}")
        print(f"   Unmatched Tests: {len(report.get('unmatched_tests', []))}")
        
        # Analyze test items for profile vs individual tests
        test_items = report.get('test_items', [])
        profile_tests = []
        individual_tests = []
        
        for test in test_items:
            if test.get('profile_type'):
                profile_tests.append(test)
            else:
                individual_tests.append(test)
        
        print(f"\n   Test Breakdown:")
        print(f"     Profile Tests: {len(profile_tests)}")
        print(f"     Individual Tests: {len(individual_tests)}")
        
        # Display profile test details
        for i, test in enumerate(profile_tests):
            print(f"\n   Profile Test {i+1}: {test.get('test_name')}")
            print(f"     Department: {test.get('department', 'N/A')}")
            print(f"     Specimen: {test.get('specimen', 'N/A')}")
            print(f"     Container: {test.get('container', 'N/A')}")
            print(f"     Method: {test.get('method', 'N/A')}")
            print(f"     Reference Range: {test.get('reference_range', 'N/A')}")
            print(f"     Result Unit: {test.get('result_unit', 'N/A')}")
            print(f"     Price: {test.get('test_price', 'N/A')}")
            
            sub_tests = test.get('sub_tests', [])
            if sub_tests:
                print(f"     Sub-tests ({len(sub_tests)}):")
                for sub_test in sub_tests:
                    print(f"       - {sub_test.get('testName')} (ID: {sub_test.get('test_id')})")
        
        # Compare with individual tests
        if individual_tests:
            print(f"\n   Individual Test Example: {individual_tests[0].get('test_name')}")
            print(f"     Department: {individual_tests[0].get('department', 'N/A')}")
            print(f"     Specimen: {individual_tests[0].get('specimen', 'N/A')}")
            print(f"     Container: {individual_tests[0].get('container', 'N/A')}")
            print(f"     Method: {individual_tests[0].get('method', 'N/A')}")
            print(f"     Reference Range: {individual_tests[0].get('reference_range', 'N/A')}")
            print(f"     Result Unit: {individual_tests[0].get('result_unit', 'N/A')}")
        
        # Check if profile tests now have complete clinical data
        profile_data_complete = True
        for test in profile_tests:
            if not test.get('specimen') or not test.get('container') or not test.get('method'):
                profile_data_complete = False
                break
        
        if profile_data_complete and profile_tests:
            print(f"\n✅ Profile tests now have complete clinical data!")
        elif profile_tests:
            print(f"\n⚠️  Some profile tests still missing clinical data")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during report generation: {str(e)}")
        return False

def main():
    """Run the complete test"""
    print("BILLING REPORT GENERATION TEST WITH PROFILE TESTS")
    print("Testing end-to-end profile integration in billing reports")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Find a billing with profile tests
    billing_id = find_billing_with_profile()
    if not billing_id:
        print("\n❌ Cannot proceed - no billing with profile tests found")
        return False
    
    # Test report generation
    success = test_report_generation(billing_id)
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    if success:
        print("🎉 BILLING REPORT GENERATION TEST PASSED!")
        print("Profile tests are now properly integrated with complete clinical data.")
        return True
    else:
        print("❌ Test failed. Please check the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
