#!/usr/bin/env python3
"""
Test report generation for billing ID 98 (MYD088)
"""

import json
import os
import sys

# Change to backend directory
os.chdir('backend')

# Add to path
sys.path.append('.')

from services.billing_reports_service import BillingReportsService

def test_report_generation():
    """Test report generation for billing ID 98"""
    print("=" * 60)
    print("TESTING REPORT GENERATION FOR BILLING ID 98")
    print("=" * 60)
    
    service = BillingReportsService()
    billing_id = 98
    
    print(f"Working directory: {os.getcwd()}")
    print(f"Data directory exists: {os.path.exists('data')}")
    print(f"Profiles file exists: {os.path.exists('data/profiles.json')}")
    
    # Test the full report generation process
    try:
        print(f"\nGenerating report for billing ID: {billing_id}")
        report = service.generate_comprehensive_report(
            billing_id=billing_id,
            user_id=1,
            tenant_id=1
        )
        
        if report:
            print(f"✅ Report generated successfully!")
            print(f"   Report ID: {report.get('id')}")
            print(f"   SID: {report.get('sid_number')}")
            print(f"   Test items: {len(report.get('test_items', []))}")
            
            # Analyze test items
            test_items = report.get('test_items', [])
            profile_subtests = [t for t in test_items if t.get('is_profile_subtest')]
            individual_tests = [t for t in test_items if not t.get('is_profile_subtest')]
            
            print(f"   Profile sub-tests: {len(profile_subtests)}")
            print(f"   Individual tests: {len(individual_tests)}")
            
            if len(profile_subtests) > 0:
                print("   ✅ Profile expansion working!")
                for test in profile_subtests:
                    print(f"     - {test.get('test_name')} (from {test.get('parent_profile_name')})")
            else:
                print("   ❌ No profile expansion")
            
            # Check unmatched tests
            unmatched = report.get('unmatched_tests', [])
            if unmatched:
                print(f"   ⚠️  Unmatched tests: {len(unmatched)}")
                for test in unmatched:
                    print(f"     - {test.get('test_name', 'Unknown')}")
        else:
            print("❌ Report generation failed")
            
    except Exception as e:
        print(f"❌ Error during report generation: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_report_generation()
