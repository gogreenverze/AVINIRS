#!/usr/bin/env python3
"""
Analyze MYD088 billing report to understand test structure
"""

import json
import sys
import os

def analyze_myd088_report():
    """Analyze the MYD088 billing report"""
    try:
        # Load billing reports data
        with open('backend/data/billing_reports.json', 'r') as f:
            reports = json.load(f)
        
        # Find MYD088 report
        myd088_report = None
        for report in reports:
            if report.get('sid_number') == 'MYD088':
                myd088_report = report
                break
        
        if not myd088_report:
            print("❌ MYD088 report not found")
            return
        
        print("=" * 60)
        print("MYD088 BILLING REPORT ANALYSIS")
        print("=" * 60)
        
        # Basic info
        print(f"Report ID: {myd088_report.get('id')}")
        print(f"Billing ID: {myd088_report.get('billing_id')}")
        print(f"Patient: {myd088_report.get('patient_info', {}).get('full_name')}")
        print(f"Generation Time: {myd088_report.get('generation_timestamp')}")
        
        # Test items analysis
        test_items = myd088_report.get('test_items', [])
        print(f"\nTotal Test Items: {len(test_items)}")
        
        profile_subtests = []
        individual_tests = []
        
        for i, item in enumerate(test_items):
            test_name = item.get('test_name', 'Unknown')
            is_profile_subtest = item.get('is_profile_subtest', False)
            parent_profile = item.get('parent_profile_name', 'N/A')
            
            print(f"{i+1:2d}. {test_name}")
            print(f"    Profile Subtest: {is_profile_subtest}")
            if is_profile_subtest:
                print(f"    Parent Profile: {parent_profile}")
                profile_subtests.append(item)
            else:
                individual_tests.append(item)
            print()
        
        print(f"Profile Sub-tests: {len(profile_subtests)}")
        print(f"Individual Tests: {len(individual_tests)}")
        
        # Check for unmatched tests
        unmatched_tests = myd088_report.get('unmatched_tests', [])
        print(f"Unmatched Tests: {len(unmatched_tests)}")
        
        if unmatched_tests:
            print("\nUnmatched Tests:")
            for test in unmatched_tests:
                print(f"  - {test.get('test_name', 'Unknown')}")
        
        # Check original billing data
        print("\n" + "=" * 60)
        print("CHECKING ORIGINAL BILLING DATA")
        print("=" * 60)
        
        billing_id = myd088_report.get('billing_id')
        with open('backend/data/billings.json', 'r') as f:
            billings = json.load(f)
        
        billing = None
        for b in billings:
            if b.get('id') == billing_id:
                billing = b
                break
        
        if billing:
            print(f"Billing ID: {billing.get('id')}")
            print(f"SID Number: {billing.get('sid_number')}")
            
            items = billing.get('items', [])
            print(f"Original Items Count: {len(items)}")
            
            for i, item in enumerate(items):
                test_name = item.get('test_name', 'Unknown')
                test_id = item.get('test_id')
                test_master_data = item.get('test_master_data', {})
                
                print(f"{i+1:2d}. {test_name} (ID: {test_id})")
                
                # Check if this is a profile
                if test_master_data.get('type') == 'profile':
                    print(f"    ✅ PROFILE TEST")
                    test_items = test_master_data.get('testItems', [])
                    print(f"    Sub-tests: {len(test_items)}")
                    for sub_test in test_items:
                        print(f"      - {sub_test.get('testName')} (ID: {sub_test.get('test_id')})")
                else:
                    print(f"    Individual Test")
                print()
        else:
            print("❌ Original billing data not found")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    analyze_myd088_report()
