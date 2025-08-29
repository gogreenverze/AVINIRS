#!/usr/bin/env python3
"""
Regenerate All Billing Reports with ID-based System
Regenerate all existing billing reports using the new ID-based test matching
"""

import sys
import os
import json
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.billing_reports_service import BillingReportsService

def main():
    """Regenerate all billing reports with the new ID-based system"""
    
    print("🔄 Regenerating All Billing Reports with ID-based System")
    print("=" * 70)
    
    # Initialize services
    reports_service = BillingReportsService(data_dir="backend/data")
    
    # Read existing reports
    reports_file = 'backend/data/billing_reports.json'
    try:
        with open(reports_file, 'r') as f:
            existing_reports = json.load(f)
    except Exception as e:
        print(f"❌ Error reading reports file: {e}")
        return
    
    print(f"📊 Found {len(existing_reports)} existing reports")
    
    # Create backup
    backup_file = f'backend/data/billing_reports_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    try:
        with open(backup_file, 'w') as f:
            json.dump(existing_reports, f, indent=2)
        print(f"📁 Created backup: {backup_file}")
    except Exception as e:
        print(f"⚠️  Could not create backup: {e}")
    
    print()
    
    # Statistics
    total_reports = len(existing_reports)
    successful_regenerations = 0
    failed_regenerations = 0
    total_matched_tests = 0
    total_unmatched_tests = 0
    
    new_reports = []
    
    # Process each existing report
    for i, old_report in enumerate(existing_reports, 1):
        sid_number = old_report.get('sid_number', f'Report-{i}')
        billing_id = old_report.get('billing_id')
        tenant_id = old_report.get('tenant_id', 1)
        
        print(f"📋 Regenerating {sid_number} (Billing ID: {billing_id})")
        
        if not billing_id:
            print(f"   ❌ No billing ID found, skipping")
            new_reports.append(old_report)  # Keep original
            failed_regenerations += 1
            continue
        
        try:
            # Regenerate the report
            new_report = reports_service.generate_comprehensive_report(
                billing_id=billing_id,
                user_id=1,  # Admin user
                tenant_id=tenant_id
            )
            
            if new_report:
                # Preserve original report ID and SID
                new_report['id'] = old_report['id']
                new_report['sid_number'] = sid_number
                
                # Count test details
                test_items = new_report.get('test_items', [])
                unmatched_tests = new_report.get('unmatched_tests', [])
                
                total_matched_tests += len(test_items)
                total_unmatched_tests += len([t for t in unmatched_tests if t and t.strip()])
                
                print(f"   ✅ Success: {len(test_items)} matched, {len(unmatched_tests)} unmatched")
                
                new_reports.append(new_report)
                successful_regenerations += 1
            else:
                print(f"   ❌ Failed to regenerate")
                new_reports.append(old_report)  # Keep original
                failed_regenerations += 1
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            new_reports.append(old_report)  # Keep original
            failed_regenerations += 1
    
    # Save regenerated reports
    try:
        with open(reports_file, 'w') as f:
            json.dump(new_reports, f, indent=2)
        print(f"\n✅ Saved {len(new_reports)} reports to {reports_file}")
    except Exception as e:
        print(f"\n❌ Error saving reports: {e}")
        return
    
    # Print summary
    print()
    print("📈 Regeneration Summary:")
    print(f"   - Total reports: {total_reports}")
    print(f"   - Successfully regenerated: {successful_regenerations}")
    print(f"   - Failed regenerations: {failed_regenerations}")
    print(f"   - Total matched tests: {total_matched_tests}")
    print(f"   - Total unmatched tests: {total_unmatched_tests}")
    
    if total_matched_tests + total_unmatched_tests > 0:
        match_rate = (total_matched_tests / (total_matched_tests + total_unmatched_tests)) * 100
        print(f"   - Overall test match rate: {match_rate:.1f}%")
    
    print()
    if failed_regenerations == 0 and total_unmatched_tests == 0:
        print("🎉 Perfect! All reports regenerated successfully with complete test details.")
    elif successful_regenerations > failed_regenerations:
        print("✅ Regeneration mostly successful. All reports now use ID-based test matching.")
    else:
        print("⚠️  Some regenerations failed. Manual review may be needed.")
    
    print()
    print("🔍 Next Steps:")
    print("   1. Check the regenerated reports in the frontend")
    print("   2. Verify that test details are now properly displayed")
    print("   3. Update frontend billing module to use test_master IDs")

if __name__ == "__main__":
    main()
