#!/usr/bin/env python3
"""
Script to fix SID prefixes in billing reports.
Changes old prefixes (AM, AS, AT, etc.) to correct site codes (MYD, SKZ, TNJ, etc.)
"""

import json
import os
import sys
from datetime import datetime
from typing import Dict, List

def read_json_file(file_path: str) -> List[Dict]:
    """Read JSON file with error handling"""
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    except Exception as e:
        print(f"Error reading {file_path}: {str(e)}")
        return []

def write_json_file(file_path: str, data: List[Dict]) -> bool:
    """Write JSON file with error handling"""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error writing {file_path}: {str(e)}")
        return False

def backup_file(file_path: str) -> str:
    """Create backup of file before modification"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = f"{file_path}_reports_prefix_fix_backup_{timestamp}"
    
    try:
        data = read_json_file(file_path)
        write_json_file(backup_path, data)
        print(f"Backup created: {backup_path}")
        return backup_path
    except Exception as e:
        print(f"Error creating backup: {str(e)}")
        return ""

def get_tenant_site_code_map(tenants: List[Dict]) -> Dict[int, str]:
    """Create mapping of tenant_id to site_code"""
    site_code_map = {}
    for tenant in tenants:
        tenant_id = tenant.get('id')
        site_code = tenant.get('site_code')
        if not tenant_id or not site_code:
            raise ValueError(f"Invalid tenant data: tenant_id={tenant_id}, site_code={site_code}. All franchises must have valid site codes.")
        site_code_map[tenant_id] = site_code
    return site_code_map

def fix_billing_reports_sids():
    """Main function to fix SID prefixes in billing reports"""
    print("Starting Billing Reports SID Prefix Fix Process...")
    print("=" * 60)
    
    # File paths
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    reports_file = os.path.join(data_dir, 'billing_reports.json')
    tenants_file = os.path.join(data_dir, 'tenants.json')
    
    # Check if files exist
    if not os.path.exists(reports_file):
        print(f"Error: {reports_file} not found")
        return False
    
    if not os.path.exists(tenants_file):
        print(f"Error: {tenants_file} not found")
        return False
    
    # Create backup
    backup_path = backup_file(reports_file)
    if not backup_path:
        print("Failed to create backup. Aborting update.")
        return False
    
    # Load data
    reports = read_json_file(reports_file)
    tenants = read_json_file(tenants_file)
    
    if not reports:
        print("No billing reports found")
        return False
    
    if not tenants:
        print("No tenant records found")
        return False
    
    # Create tenant mapping
    tenant_site_map = get_tenant_site_code_map(tenants)
    print(f"Loaded {len(tenants)} tenants and {len(reports)} billing reports")
    
    print("\nTenant site code mapping:")
    for tenant_id, site_code in tenant_site_map.items():
        tenant_name = next((t.get('name', 'Unknown') for t in tenants if t.get('id') == tenant_id), 'Unknown')
        print(f"  {tenant_id}: {site_code} ({tenant_name})")
    
    # Track changes
    updated_count = 0
    prefix_changes = {}
    
    # Process each billing report
    print(f"\nProcessing billing reports...")
    print("-" * 50)
    
    for report in reports:
        tenant_id = report.get('tenant_id')
        current_sid = report.get('sid_number', '')
        report_id = report.get('id', 'Unknown')
        
        if not tenant_id or tenant_id not in tenant_site_map:
            if current_sid:
                print(f"⚠️  Report ID {report_id}: Invalid tenant_id {tenant_id}, SID: {current_sid}")
            continue
        
        if not current_sid:
            continue  # Skip reports without SID
        
        correct_site_code = tenant_site_map[tenant_id]
        tenant_name = next((t.get('name', 'Unknown') for t in tenants if t.get('id') == tenant_id), 'Unknown')
        
        # Check if SID needs prefix fix
        needs_fix = False
        old_prefix = ""
        
        if not current_sid.startswith(correct_site_code):
            needs_fix = True
            
            # Extract old prefix (assume it's 2-3 characters before the numbers)
            for i in range(2, min(5, len(current_sid))):
                potential_prefix = current_sid[:i]
                remaining = current_sid[i:]
                if remaining.isdigit():
                    old_prefix = potential_prefix
                    break
            
            if old_prefix:
                # Extract the number part
                number_part = current_sid[len(old_prefix):]
                
                # Create new SID with correct prefix
                if number_part.isdigit() and len(number_part) >= 1:
                    # Ensure 3-digit format
                    number = int(number_part)
                    new_sid = f"{correct_site_code}{number:03d}"
                    
                    # Update the report record
                    old_sid_value = report['sid_number']
                    report['sid_number'] = new_sid
                    updated_count += 1
                    print(f"    DEBUG: Changed {old_sid_value} to {report['sid_number']}")
                    
                    # Track the change
                    change_key = f"{old_prefix} -> {correct_site_code}"
                    if change_key not in prefix_changes:
                        prefix_changes[change_key] = []
                    prefix_changes[change_key].append({
                        'report_id': report_id,
                        'tenant_name': tenant_name,
                        'old_sid': current_sid,
                        'new_sid': new_sid
                    })
                    
                    print(f"✅ Fixed: {current_sid} -> {new_sid} (Report ID: {report_id}, {tenant_name})")
                else:
                    print(f"⚠️  Report ID {report_id}: Cannot parse number from SID '{current_sid}'")
            else:
                print(f"⚠️  Report ID {report_id}: Cannot determine old prefix from SID '{current_sid}'")
        else:
            # SID already has correct prefix, but check format
            remaining = current_sid[len(correct_site_code):]
            if remaining.isdigit() and len(remaining) == 3:
                # Already correct format
                continue
            elif remaining.isdigit():
                # Correct prefix but wrong number format
                number = int(remaining)
                new_sid = f"{correct_site_code}{number:03d}"
                report['sid_number'] = new_sid
                updated_count += 1
                print(f"✅ Format fix: {current_sid} -> {new_sid} (Report ID: {report_id}, {tenant_name})")
    
    # Display summary of changes
    print(f"\n" + "=" * 60)
    print("BILLING REPORTS PREFIX CHANGE SUMMARY")
    print("=" * 60)
    
    if prefix_changes:
        for change, records in prefix_changes.items():
            print(f"\n{change}: {len(records)} reports")
            for record in records[:5]:  # Show first 5 examples
                print(f"  - {record['old_sid']} -> {record['new_sid']} ({record['tenant_name']})")
            if len(records) > 5:
                print(f"  ... and {len(records) - 5} more")
    
    print(f"\nTotal reports updated: {updated_count}")
    
    # Save updated reports
    if updated_count > 0:
        if write_json_file(reports_file, reports):
            print(f"\n✅ Successfully updated {updated_count} billing reports")
            print(f"📁 Backup saved as: {backup_path}")
            
            # Verify the changes
            print(f"\nVerifying changes...")
            verification_passed = verify_reports_sid_prefixes(reports, tenant_site_map)
            
            if verification_passed:
                print("✅ All billing report SID prefixes are now correct!")
            else:
                print("⚠️  Some billing report SID prefixes still need attention")
            
            return verification_passed
        else:
            print("❌ Error saving updated billing reports")
            return False
    else:
        print("\n✅ No billing reports needed prefix updates")
        # Remove backup since no changes were made
        try:
            os.remove(backup_path)
            print("🗑️  Removed unnecessary backup file")
        except:
            pass
        return True

def verify_reports_sid_prefixes(reports: List[Dict], tenant_site_map: Dict[int, str]) -> bool:
    """Verify that all billing report SID prefixes are correct"""
    print("Verifying billing report SID prefixes...")
    
    incorrect_count = 0
    
    for report in reports:
        tenant_id = report.get('tenant_id')
        sid = report.get('sid_number', '')
        report_id = report.get('id', 'Unknown')
        
        if not tenant_id or tenant_id not in tenant_site_map or not sid:
            continue
        
        correct_site_code = tenant_site_map[tenant_id]
        
        if not sid.startswith(correct_site_code):
            print(f"❌ Report ID {report_id}: SID '{sid}' should start with '{correct_site_code}'")
            incorrect_count += 1
        elif len(sid) != len(correct_site_code) + 3:
            print(f"⚠️  Report ID {report_id}: SID '{sid}' has wrong length")
            incorrect_count += 1
        elif not sid[len(correct_site_code):].isdigit():
            print(f"⚠️  Report ID {report_id}: SID '{sid}' has non-numeric suffix")
            incorrect_count += 1
    
    if incorrect_count == 0:
        print("✅ All billing report SID prefixes are correct!")
        return True
    else:
        print(f"❌ Found {incorrect_count} billing reports with incorrect SID prefixes")
        return False

if __name__ == "__main__":
    print("AVINI Billing Reports SID Prefix Fix Script")
    print("=" * 60)
    
    success = fix_billing_reports_sids()
    
    if success:
        print("\n🎉 Billing reports SID prefix fix completed successfully!")
        print("All billing reports now use correct site code prefixes.")
    else:
        print("\n❌ Billing reports SID prefix fix failed!")
        print("Please review the errors above.")
        sys.exit(1)
