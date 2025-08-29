#!/usr/bin/env python3
"""
Regenerate MYD088 report to test the fix
"""

import json
import os
import sys

# Change to backend directory
os.chdir('backend')

# Add to path
sys.path.append('.')

from services.billing_reports_service import BillingReportsService

def regenerate_myd088_report():
    """Regenerate the MYD088 report"""
    print("=" * 60)
    print("REGENERATING MYD088 REPORT WITH ENHANCED FALLBACK")
    print("=" * 60)
    
    service = BillingReportsService()
    billing_id = 98  # The billing ID for MYD088
    
    # First, let's check the current report
    with open('data/billing_reports.json', 'r') as f:
        reports = json.load(f)
    
    # Find existing MYD088 report
    existing_report = None
    for report in reports:
        if report.get('billing_id') == billing_id:
            existing_report = report
            break
    
    if existing_report:
        print(f"Found existing report:")
        print(f"  SID: {existing_report.get('sid_number')}")
        print(f"  Test items: {len(existing_report.get('test_items', []))}")
        print(f"  Profile sub-tests: {len([t for t in existing_report.get('test_items', []) if t.get('is_profile_subtest')])}")
    
    # Generate new report
    print(f"\nGenerating new report for billing ID: {billing_id}")
    new_report = service.generate_comprehensive_report(
        billing_id=billing_id,
        user_id=1,
        tenant_id=1
    )
    
    if new_report:
        print(f"✅ New report generated successfully!")
        print(f"   Report ID: {new_report.get('id')}")
        print(f"   SID: {new_report.get('sid_number')}")
        print(f"   Test items: {len(new_report.get('test_items', []))}")
        
        # Analyze test items
        test_items = new_report.get('test_items', [])
        profile_subtests = [t for t in test_items if t.get('is_profile_subtest')]
        individual_tests = [t for t in test_items if not t.get('is_profile_subtest')]
        
        print(f"   Profile sub-tests: {len(profile_subtests)}")
        print(f"   Individual tests: {len(individual_tests)}")
        
        if len(profile_subtests) > 0:
            print("   ✅ Profile expansion working!")
            print("   Profile sub-tests:")
            for test in profile_subtests:
                print(f"     - {test.get('test_name')} (from {test.get('parent_profile_name')})")
        
        if len(individual_tests) > 0:
            print("   Individual tests:")
            for test in individual_tests:
                print(f"     - {test.get('test_name')}")
        
        # Save the new report (it will automatically get a new ID and SID)
        print(f"\n✅ Report saved with SID: {new_report.get('sid_number')}")
        print(f"   You can now view this report at: http://localhost:3000/billing/reports/{new_report.get('sid_number')}?from=samples")
        
    else:
        print("❌ Report generation failed")

if __name__ == "__main__":
    regenerate_myd088_report()
