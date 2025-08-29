#!/usr/bin/env python3
"""
Fix AM004 Report - Regenerate billing report with improved test matching
"""

import sys
import os
import json
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.billing_reports_service import BillingReportsService
from services.audit_service import AuditService

def main():
    """Fix AM004 report by regenerating it with improved test matching"""
    
    print("🔧 Fixing AM004 Billing Report")
    print("=" * 50)
    
    # Initialize services with correct data directory
    reports_service = BillingReportsService(data_dir="backend/data")
    
    # Find the AM004 report
    reports_file = 'backend/data/billing_reports.json'
    try:
        with open(reports_file, 'r') as f:
            reports = json.load(f)
    except Exception as e:
        print(f"❌ Error reading reports file: {e}")
        return
    
    # Find AM004 report
    am004_report = None
    am004_index = None
    for i, report in enumerate(reports):
        if report.get('sid_number') == 'AM004':
            am004_report = report
            am004_index = i
            break
    
    if not am004_report:
        print("❌ AM004 report not found!")
        return
    
    print(f"📋 Found AM004 Report:")
    print(f"   - Report ID: {am004_report.get('id')}")
    print(f"   - Billing ID: {am004_report.get('billing_id')}")
    print(f"   - Patient: {am004_report.get('patient_info', {}).get('full_name')}")
    print(f"   - Current Test Items: {len(am004_report.get('test_items', []))}")
    print(f"   - Current Unmatched Tests: {am004_report.get('unmatched_tests', [])}")
    print()
    
    # Get the billing ID
    billing_id = am004_report.get('billing_id')
    if not billing_id:
        print("❌ No billing ID found in AM004 report!")
        return
    
    print(f"🔄 Regenerating report for billing ID {billing_id}...")
    
    # Test the improved matching first
    print("🧪 Testing improved test matching...")
    test_names = am004_report.get('unmatched_tests', [])
    for test_name in test_names:
        if test_name and test_name.strip():
            matched_test = reports_service.match_test_in_master(test_name)
            if matched_test:
                print(f"   ✅ '{test_name}' -> '{matched_test.get('testName')}'")
            else:
                print(f"   ❌ '{test_name}' -> No match")
    print()
    
    # Regenerate the report
    try:
        new_report = reports_service.generate_comprehensive_report(
            billing_id=billing_id,
            user_id=1,  # Admin user
            tenant_id=3  # Thanjavur (based on original report)
        )
        
        if not new_report:
            print("❌ Failed to regenerate report!")
            return
        
        # Preserve the original report ID and SID
        new_report['id'] = am004_report['id']
        new_report['sid_number'] = 'AM004'
        
        print(f"✅ Successfully regenerated report!")
        print(f"   - New Test Items: {len(new_report.get('test_items', []))}")
        print(f"   - New Unmatched Tests: {new_report.get('unmatched_tests', [])}")
        print()
        
        # Show test details
        if new_report.get('test_items'):
            print("🧪 Test Details Found:")
            for i, test in enumerate(new_report['test_items'], 1):
                print(f"   {i}. {test.get('test_name')}")
                print(f"      - Department: {test.get('department', 'N/A')}")
                print(f"      - HMS Code: {test.get('hms_code', 'N/A')}")
                print(f"      - Price: ₹{test.get('price', 0)}")
                print(f"      - Amount: ₹{test.get('amount', 0)}")
                print()
        else:
            print("⚠️  No test items matched!")
            if new_report.get('unmatched_tests'):
                print(f"   Unmatched tests: {new_report['unmatched_tests']}")
        
        # Replace the old report with the new one
        reports[am004_index] = new_report
        
        # Save the updated reports
        try:
            with open(reports_file, 'w') as f:
                json.dump(reports, f, indent=2)
            print("✅ Successfully updated AM004 report in billing_reports.json")
        except Exception as e:
            print(f"❌ Error saving updated reports: {e}")
            return
        
        print()
        print("🎉 AM004 Report Fix Complete!")
        if new_report.get('test_items'):
            print("   The report now contains proper test details from test_master database.")
        else:
            print("   The report still has matching issues. Manual review may be needed.")
        
    except Exception as e:
        print(f"❌ Error regenerating report: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
