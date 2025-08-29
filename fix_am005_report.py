#!/usr/bin/env python3
"""
Fix AM005 Report - Regenerate billing report with proper test details
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
    """Fix AM005 report by regenerating it with proper test details"""
    
    print("🔧 Fixing AM005 Billing Report")
    print("=" * 50)
    
    # Initialize services with correct data directory
    reports_service = BillingReportsService(data_dir="backend/data")
    
    # Find the AM005 report
    reports_file = 'backend/data/billing_reports.json'
    try:
        with open(reports_file, 'r') as f:
            reports = json.load(f)
    except Exception as e:
        print(f"❌ Error reading reports file: {e}")
        return
    
    # Find AM005 report
    am005_report = None
    am005_index = None
    for i, report in enumerate(reports):
        if report.get('sid_number') == 'AM005':
            am005_report = report
            am005_index = i
            break
    
    if not am005_report:
        print("❌ AM005 report not found!")
        return
    
    print(f"📋 Found AM005 Report:")
    print(f"   - Report ID: {am005_report.get('id')}")
    print(f"   - Billing ID: {am005_report.get('billing_id')}")
    print(f"   - Patient: {am005_report.get('patient_info', {}).get('full_name')}")
    print(f"   - Current Test Items: {len(am005_report.get('test_items', []))}")
    print(f"   - Current Unmatched Tests: {am005_report.get('unmatched_tests', [])}")
    print()
    
    # Get the billing ID
    billing_id = am005_report.get('billing_id')
    if not billing_id:
        print("❌ No billing ID found in AM005 report!")
        return
    
    print(f"🔄 Regenerating report for billing ID {billing_id}...")
    
    # Regenerate the report
    try:
        new_report = reports_service.generate_comprehensive_report(
            billing_id=billing_id,
            user_id=1,  # Admin user
            tenant_id=1  # Mayiladuthurai
        )
        
        if not new_report:
            print("❌ Failed to regenerate report!")
            return
        
        # Preserve the original report ID and SID
        new_report['id'] = am005_report['id']
        new_report['sid_number'] = 'AM005'
        
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
        reports[am005_index] = new_report
        
        # Save the updated reports
        try:
            with open(reports_file, 'w') as f:
                json.dump(reports, f, indent=2)
            print("✅ Successfully updated AM005 report in billing_reports.json")
        except Exception as e:
            print(f"❌ Error saving updated reports: {e}")
            return
        
        print()
        print("🎉 AM005 Report Fix Complete!")
        print("   The report now contains proper test details from test_master database.")
        
    except Exception as e:
        print(f"❌ Error regenerating report: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
