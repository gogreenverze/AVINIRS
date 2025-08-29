#!/usr/bin/env python3
"""
Check All Reports Test Details - Verify test details across all billing reports
"""

import sys
import os
import json

def main():
    """Check test details across all billing reports"""
    
    print("🔍 Checking All Billing Reports Test Details")
    print("=" * 60)
    
    # Read the billing reports file
    reports_file = 'backend/data/billing_reports.json'
    try:
        with open(reports_file, 'r') as f:
            reports = json.load(f)
    except Exception as e:
        print(f"❌ Error reading reports file: {e}")
        return
    
    print(f"📊 Total Reports Found: {len(reports)}")
    print()
    
    # Analyze each report
    reports_with_tests = 0
    reports_without_tests = 0
    total_matched_tests = 0
    total_unmatched_tests = 0
    
    for i, report in enumerate(reports, 1):
        sid = report.get('sid_number', f'Report-{i}')
        test_items = report.get('test_items', [])
        unmatched_tests = report.get('unmatched_tests', [])
        
        print(f"📋 {sid}:")
        print(f"   - Test Items: {len(test_items)}")
        print(f"   - Unmatched Tests: {len(unmatched_tests)}")
        
        if test_items:
            reports_with_tests += 1
            total_matched_tests += len(test_items)
            print(f"   ✅ Has test details")
            
            # Show first test details
            first_test = test_items[0]
            print(f"   - First Test: {first_test.get('test_name', 'N/A')}")
            print(f"   - Department: {first_test.get('department', 'N/A')}")
            print(f"   - HMS Code: {first_test.get('hms_code', 'N/A')}")
        else:
            reports_without_tests += 1
            print(f"   ❌ No test details")
            if unmatched_tests:
                print(f"   - Unmatched: {unmatched_tests[:3]}{'...' if len(unmatched_tests) > 3 else ''}")
        
        total_unmatched_tests += len(unmatched_tests)
        print()
    
    # Summary
    print("📈 Summary:")
    print(f"   - Reports with test details: {reports_with_tests}")
    print(f"   - Reports without test details: {reports_without_tests}")
    print(f"   - Total matched tests: {total_matched_tests}")
    print(f"   - Total unmatched tests: {total_unmatched_tests}")
    print()
    
    # Calculate success rate
    if len(reports) > 0:
        success_rate = (reports_with_tests / len(reports)) * 100
        print(f"📊 Test Details Success Rate: {success_rate:.1f}%")
    
    # Check for problematic reports
    problematic_reports = []
    for report in reports:
        test_items = report.get('test_items', [])
        unmatched_tests = report.get('unmatched_tests', [])
        
        # Check if report has unmatched tests that should be matched
        if not test_items and unmatched_tests:
            # Filter out empty strings
            real_unmatched = [t for t in unmatched_tests if t and t.strip()]
            if real_unmatched:
                problematic_reports.append({
                    'sid': report.get('sid_number'),
                    'billing_id': report.get('billing_id'),
                    'unmatched': real_unmatched
                })
    
    if problematic_reports:
        print()
        print("⚠️  Problematic Reports (may need regeneration):")
        for report in problematic_reports:
            print(f"   - {report['sid']} (Billing ID: {report['billing_id']})")
            print(f"     Unmatched: {report['unmatched'][:3]}{'...' if len(report['unmatched']) > 3 else ''}")
    
    print()
    if reports_without_tests == 0:
        print("🎉 All reports have proper test details!")
    elif reports_with_tests > reports_without_tests:
        print("✅ Most reports have test details. Some may need regeneration.")
    else:
        print("⚠️  Many reports are missing test details. Consider regenerating them.")

if __name__ == "__main__":
    main()
