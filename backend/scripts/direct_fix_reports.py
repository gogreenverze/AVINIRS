#!/usr/bin/env python3
"""
Direct fix for billing reports SID prefixes - simple and direct approach
"""

import json
import os
from datetime import datetime

def fix_reports_directly():
    """Direct fix for billing reports SID prefixes"""
    print("Direct Billing Reports SID Fix")
    print("=" * 40)
    
    # File paths
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    reports_file = os.path.join(data_dir, 'billing_reports.json')
    tenants_file = os.path.join(data_dir, 'tenants.json')
    
    # Read files
    with open(reports_file, 'r', encoding='utf-8') as f:
        reports = json.load(f)
    
    with open(tenants_file, 'r', encoding='utf-8') as f:
        tenants = json.load(f)
    
    # Create tenant mapping
    tenant_map = {t['id']: t['site_code'] for t in tenants}
    
    print(f"Loaded {len(reports)} reports and {len(tenants)} tenants")
    
    # Create backup
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = f"{reports_file}_direct_backup_{timestamp}"
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(reports, f, indent=2)
    print(f"Backup created: {backup_file}")
    
    # Fix SIDs
    updated_count = 0
    
    for report in reports:
        tenant_id = report.get('tenant_id')
        current_sid = report.get('sid_number', '')
        
        if tenant_id in tenant_map and current_sid:
            correct_site_code = tenant_map[tenant_id]
            
            # Check if needs fixing
            if not current_sid.startswith(correct_site_code):
                # Extract number from old SID
                old_prefix = current_sid[:2]  # AM, AS, AT, etc.
                number_part = current_sid[2:]  # 001, 002, etc.
                
                if number_part.isdigit():
                    # Create new SID
                    new_sid = f"{correct_site_code}{int(number_part):03d}"
                    
                    print(f"Fixing: {current_sid} -> {new_sid} (Tenant {tenant_id})")
                    report['sid_number'] = new_sid
                    updated_count += 1
    
    print(f"\nUpdated {updated_count} reports")
    
    # Save updated file
    with open(reports_file, 'w', encoding='utf-8') as f:
        json.dump(reports, f, indent=2, ensure_ascii=False)
    
    print(f"✅ File saved successfully!")
    
    # Verify first few records
    print("\nVerifying first 5 records:")
    for i, report in enumerate(reports[:5]):
        tenant_id = report.get('tenant_id')
        sid = report.get('sid_number', '')
        expected_prefix = tenant_map.get(tenant_id, 'XX')
        
        status = "✅" if sid.startswith(expected_prefix) else "❌"
        print(f"{status} Report {i+1}: {sid} (Tenant {tenant_id}, Expected: {expected_prefix})")

if __name__ == "__main__":
    fix_reports_directly()
