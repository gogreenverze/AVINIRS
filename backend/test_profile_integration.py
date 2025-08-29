#!/usr/bin/env python3
"""
Test script to verify profile master data integration in billing reports
Tests the enhanced profile test handling and clinical data aggregation
"""

import sys
import os
import json
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.billing_reports_service import BillingReportsService

def test_profile_lookup():
    """Test profile data lookup functionality"""
    print("=" * 60)
    print("TESTING PROFILE LOOKUP FUNCTIONALITY")
    print("=" * 60)
    
    service = BillingReportsService()
    
    # Test profile lookup by ID
    profile_id = "f66ca840-5a91-4e9f-acf0-5b6d19a05f6d"
    profile = service.get_profile_by_id(profile_id)
    
    if profile:
        print(f"✅ Profile found: {profile.get('test_profile')}")
        print(f"   Profile ID: {profile.get('id')}")
        print(f"   Test Items: {len(profile.get('testItems', []))}")
        for item in profile.get('testItems', []):
            print(f"     - {item.get('testName')} (ID: {item.get('test_id')})")
        return True
    else:
        print(f"❌ Profile not found for ID: {profile_id}")
        return False

def test_clinical_data_aggregation():
    """Test clinical data aggregation from sub-tests"""
    print("\n" + "=" * 60)
    print("TESTING CLINICAL DATA AGGREGATION")
    print("=" * 60)
    
    service = BillingReportsService()
    
    # Get profile data
    profile_id = "f66ca840-5a91-4e9f-acf0-5b6d19a05f6d"
    profile = service.get_profile_by_id(profile_id)
    
    if not profile:
        print("❌ Cannot test aggregation - profile not found")
        return False
    
    # Test aggregation
    aggregated_data = service.aggregate_profile_clinical_data(profile)
    
    print(f"✅ Clinical data aggregated for profile: {profile.get('test_profile')}")
    print(f"   Specimen: {aggregated_data.get('specimen', 'N/A')}")
    print(f"   Container: {aggregated_data.get('container', 'N/A')}")
    print(f"   Method: {aggregated_data.get('method', 'N/A')}")
    print(f"   Reference Range: {aggregated_data.get('reference_range', 'N/A')}")
    print(f"   Result Unit: {aggregated_data.get('result_unit', 'N/A')}")
    print(f"   Department: {aggregated_data.get('department', 'N/A')}")
    print(f"   Test Price: {aggregated_data.get('test_price', 'N/A')}")
    
    return True

def test_billing_validation():
    """Test billing test validation with profile tests"""
    print("\n" + "=" * 60)
    print("TESTING BILLING TEST VALIDATION")
    print("=" * 60)
    
    service = BillingReportsService()
    
    # Create test billing items with both individual and profile tests
    test_billing_items = [
        {
            "id": 1,
            "test_id": "f66ca840-5a91-4e9f-acf0-5b6d19a05f6d",  # Profile test
            "test_name": "liquid profile",
            "amount": 100,
            "quantity": 1
        },
        {
            "id": 2,
            "test_id": 175,  # Individual test (MCHC)
            "test_name": "MCHC",
            "amount": 50,
            "quantity": 1
        }
    ]
    
    # Validate tests
    matched_tests, unmatched_tests = service.validate_billing_tests(test_billing_items)
    
    print(f"✅ Validation completed:")
    print(f"   Total tests: {len(test_billing_items)}")
    print(f"   Matched tests: {len(matched_tests)}")
    print(f"   Unmatched tests: {len(unmatched_tests)}")
    
    # Display matched test details
    for i, test in enumerate(matched_tests):
        print(f"\n   Matched Test {i+1}:")
        print(f"     Name: {test.get('test_name')}")
        print(f"     Type: {'Profile' if test.get('profile_type') else 'Individual'}")
        print(f"     Department: {test.get('department', 'N/A')}")
        print(f"     Specimen: {test.get('specimen', 'N/A')}")
        print(f"     Container: {test.get('container', 'N/A')}")
        print(f"     Method: {test.get('method', 'N/A')}")
        print(f"     Reference Range: {test.get('reference_range', 'N/A')}")
        print(f"     Result Unit: {test.get('result_unit', 'N/A')}")
        
        if test.get('profile_type'):
            sub_tests = test.get('sub_tests', [])
            print(f"     Sub-tests: {len(sub_tests)}")
            for sub_test in sub_tests:
                print(f"       - {sub_test.get('testName')} (ID: {sub_test.get('test_id')})")
    
    # Display unmatched tests
    if unmatched_tests:
        print(f"\n   Unmatched tests: {unmatched_tests}")
    
    return len(matched_tests) > 0

def main():
    """Run all tests"""
    print("PROFILE MASTER DATA INTEGRATION TEST")
    print("Testing enhanced profile test handling in billing reports")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests_passed = 0
    total_tests = 3
    
    # Run tests
    if test_profile_lookup():
        tests_passed += 1
    
    if test_clinical_data_aggregation():
        tests_passed += 1
    
    if test_billing_validation():
        tests_passed += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Tests passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("🎉 ALL TESTS PASSED! Profile integration is working correctly.")
        return True
    else:
        print("❌ Some tests failed. Please check the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
