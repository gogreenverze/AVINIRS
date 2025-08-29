#!/usr/bin/env python3
"""
Script to fix duplicate SID numbers in billing records.
"""

import json
import os
import sys
from datetime import datetime
from collections import defaultdict

# Add the parent directory to the path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import read_data, write_data

def generate_unique_sid_number(tenant_id, existing_sids):
    """
    Generate a unique SID number for a tenant
    """
    # Load tenants to get site codes
    tenants = read_data('tenants.json')
    tenant = next((t for t in tenants if t['id'] == tenant_id), None)
    
    if tenant and tenant.get('site_code'):
        site_code = tenant['site_code']
    else:
        site_code = "INV"
    
    # Find the next available number for this site code
    counter = 1
    while True:
        sid_number = f"{site_code}{counter:03d}"
        if sid_number not in existing_sids:
            return sid_number
        counter += 1

def fix_duplicate_sid_numbers():
    """
    Fix duplicate SID numbers in billing records
    """
    print("Starting duplicate SID number fix...")
    
    # Create backup
    billings = read_data('billings.json')
    backup_filename = f"billings_backup_before_duplicate_fix_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    backup_path = os.path.join('backend', 'data', backup_filename)
    
    try:
        with open(backup_path, 'w') as f:
            json.dump(billings, f, indent=2)
        print(f"Backup created: {backup_filename}")
    except Exception as e:
        print(f"Warning: Could not create backup: {e}")
    
    # Find duplicates
    sid_counts = defaultdict(list)
    for i, billing in enumerate(billings):
        sid = billing.get('sid_number')
        if sid:
            sid_counts[sid].append(i)
    
    # Identify duplicates
    duplicates = {sid: indices for sid, indices in sid_counts.items() if len(indices) > 1}
    
    if not duplicates:
        print("No duplicate SID numbers found")
        return 0
    
    print(f"Found {len(duplicates)} duplicate SID numbers:")
    for sid, indices in duplicates.items():
        print(f"  {sid}: invoices {[billings[i]['id'] for i in indices]}")
    
    # Collect all existing SIDs
    existing_sids = set(sid_counts.keys())
    fixed_count = 0
    
    # Fix duplicates - keep the first occurrence, reassign others
    for sid, indices in duplicates.items():
        # Keep the first occurrence, fix the rest
        for i in indices[1:]:
            billing = billings[i]
            tenant_id = billing.get('tenant_id', 1)

            # Generate new unique SID
            new_sid = generate_unique_sid_number(tenant_id, existing_sids)

            # Update billing record
            old_sid = billing['sid_number']
            billing['sid_number'] = new_sid
            billing['updated_at'] = datetime.now().isoformat()

            # Update existing SIDs set
            existing_sids.add(new_sid)

            print(f"Changed invoice ID {billing['id']}: {old_sid} -> {new_sid}")
            fixed_count += 1
    
    # Save updated data
    if fixed_count > 0:
        write_data('billings.json', billings)
        print(f"\nFixed {fixed_count} duplicate SID numbers")
    
    return fixed_count

def validate_sid_uniqueness():
    """
    Validate that all SID numbers are unique
    """
    print("\nValidating SID number uniqueness...")
    
    billings = read_data('billings.json')
    sid_numbers = []
    duplicates = []
    
    for billing in billings:
        sid = billing.get('sid_number')
        if sid:
            if sid in sid_numbers:
                duplicates.append(sid)
            else:
                sid_numbers.append(sid)
    
    if duplicates:
        print(f"WARNING: Found duplicate SID numbers: {duplicates}")
        return False
    else:
        print(f"All {len(sid_numbers)} SID numbers are unique")
        return True

def main():
    """
    Main function
    """
    print("=" * 60)
    print("FIXING DUPLICATE SID NUMBERS")
    print("=" * 60)
    
    try:
        # Fix duplicates
        fixed_count = fix_duplicate_sid_numbers()
        
        # Validate uniqueness
        is_unique = validate_sid_uniqueness()
        
        print("\n" + "=" * 60)
        if fixed_count > 0 and is_unique:
            print("DUPLICATE FIX COMPLETED SUCCESSFULLY")
        elif fixed_count == 0:
            print("NO DUPLICATES FOUND")
        else:
            print("DUPLICATE FIX COMPLETED WITH WARNINGS")
        print("=" * 60)
        
    except Exception as e:
        print(f"ERROR: Duplicate fix failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
