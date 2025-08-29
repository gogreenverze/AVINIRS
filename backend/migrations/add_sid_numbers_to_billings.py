#!/usr/bin/env python3
"""
Migration script to add SID numbers to billing records that don't have them.
This script ensures all invoices have a unique SID number for search functionality.
"""

import json
import os
import sys
from datetime import datetime

# Add the parent directory to the path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import read_data, write_data

def generate_unique_sid_number(tenant_id, invoice_id, existing_sids):
    """
    Generate a unique SID number based on tenant and invoice ID
    Format: {SITE_CODE}{SEQUENTIAL_NUMBER:03d}
    """
    # Load tenants to get site codes
    tenants = read_data('tenants.json')
    tenant = next((t for t in tenants if t['id'] == tenant_id), None)

    if tenant and tenant.get('site_code'):
        site_code = tenant['site_code']
    else:
        # Fallback to generic format if tenant not found
        site_code = "INV"

    # Find the next available number for this site code
    counter = 1
    while True:
        sid_number = f"{site_code}{counter:03d}"
        if sid_number not in existing_sids:
            return sid_number
        counter += 1

def migrate_billing_sid_numbers():
    """
    Add SID numbers to billing records that don't have them
    """
    print("Starting SID number migration for billing records...")

    # Create backup
    billings = read_data('billings.json')
    backup_filename = f"billings_backup_before_sid_migration_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    backup_path = os.path.join('backend', 'data', backup_filename)

    try:
        with open(backup_path, 'w') as f:
            json.dump(billings, f, indent=2)
        print(f"Backup created: {backup_filename}")
    except Exception as e:
        print(f"Warning: Could not create backup: {e}")

    # Track changes and existing SIDs
    updated_count = 0
    total_count = len(billings)
    existing_sids = set()

    # First pass: collect existing SID numbers
    for billing in billings:
        if billing.get('sid_number'):
            existing_sids.add(billing['sid_number'])

    # Second pass: add missing SID numbers
    for billing in billings:
        if 'sid_number' not in billing or not billing.get('sid_number'):
            # Generate unique SID number
            tenant_id = billing.get('tenant_id', 1)
            invoice_id = billing.get('id', 1)
            sid_number = generate_unique_sid_number(tenant_id, invoice_id, existing_sids)

            # Add SID number to billing record and track it
            billing['sid_number'] = sid_number
            billing['updated_at'] = datetime.now().isoformat()
            existing_sids.add(sid_number)

            updated_count += 1
            print(f"Added SID number '{sid_number}' to invoice ID {invoice_id}")

    # Save updated data
    if updated_count > 0:
        write_data('billings.json', billings)
        print(f"\nMigration completed successfully!")
        print(f"Updated {updated_count} out of {total_count} billing records")
    else:
        print("No billing records needed SID number updates")

    return updated_count

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
    Main migration function
    """
    print("=" * 60)
    print("BILLING SID NUMBER MIGRATION")
    print("=" * 60)
    
    try:
        # Run migration
        updated_count = migrate_billing_sid_numbers()
        
        # Validate uniqueness
        is_unique = validate_sid_uniqueness()
        
        print("\n" + "=" * 60)
        if updated_count > 0 and is_unique:
            print("MIGRATION COMPLETED SUCCESSFULLY")
        elif updated_count == 0:
            print("NO MIGRATION NEEDED - ALL RECORDS ALREADY HAVE SID NUMBERS")
        else:
            print("MIGRATION COMPLETED WITH WARNINGS")
        print("=" * 60)
        
    except Exception as e:
        print(f"ERROR: Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
