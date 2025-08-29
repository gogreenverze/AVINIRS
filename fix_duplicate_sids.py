#!/usr/bin/env python3
"""
Script to identify and fix duplicate SIDs in the system
"""

import sys
import os
import json
from datetime import datetime

# Add backend directory to path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

def find_duplicate_sids():
    """Find all duplicate SIDs in the system"""
    print("=" * 60)
    print("FINDING DUPLICATE SIDs")
    print("=" * 60)
    
    try:
        # Import SIDGenerator directly from the utils directory
        utils_dir = os.path.join(os.path.dirname(__file__), 'backend', 'utils')
        sys.path.insert(0, utils_dir)
        from sid_utils import SIDGenerator
        
        sid_gen = SIDGenerator(data_dir="backend/data")
        
        # Collect all SIDs with their sources
        all_sids = {}  # sid -> list of (source, record_id, record)
        
        # Check billings
        billings = sid_gen.read_json_file(sid_gen.billings_file)
        for billing in billings:
            sid = billing.get('sid_number')
            if sid:
                if sid not in all_sids:
                    all_sids[sid] = []
                all_sids[sid].append(('billings', billing.get('id'), billing))
        
        # Check reports
        reports = sid_gen.read_json_file(sid_gen.reports_file)
        for report in reports:
            sid = report.get('sid_number')
            if sid:
                if sid not in all_sids:
                    all_sids[sid] = []
                all_sids[sid].append(('reports', report.get('id'), report))
        
        # Find duplicates
        duplicates = {}
        for sid, sources in all_sids.items():
            if len(sources) > 1:
                duplicates[sid] = sources
        
        if duplicates:
            print(f"Found {len(duplicates)} duplicate SIDs:")
            for sid, sources in duplicates.items():
                print(f"\nSID: {sid} (appears {len(sources)} times)")
                for source, record_id, record in sources:
                    tenant_id = record.get('tenant_id', 'Unknown')
                    created_at = record.get('created_at', 'Unknown')
                    print(f"  - {source}.json, ID: {record_id}, Tenant: {tenant_id}, Created: {created_at}")
        else:
            print("No duplicate SIDs found!")
        
        return duplicates
        
    except Exception as e:
        print(f"Error finding duplicates: {str(e)}")
        import traceback
        traceback.print_exc()
        return {}

def fix_duplicate_sids(duplicates):
    """Fix duplicate SIDs by regenerating them for newer records"""
    print("\n" + "=" * 60)
    print("FIXING DUPLICATE SIDs")
    print("=" * 60)
    
    if not duplicates:
        print("No duplicates to fix!")
        return True
    
    try:
        # Import SIDGenerator directly from the utils directory
        utils_dir = os.path.join(os.path.dirname(__file__), 'backend', 'utils')
        sys.path.insert(0, utils_dir)
        from sid_utils import SIDGenerator
        
        sid_gen = SIDGenerator(data_dir="backend/data")
        
        # Create backups
        backup_timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Backup billings
        billings = sid_gen.read_json_file(sid_gen.billings_file)
        backup_billings_file = f"backend/data/billings_backup_before_sid_fix_{backup_timestamp}.json"
        with open(backup_billings_file, 'w', encoding='utf-8') as f:
            json.dump(billings, f, indent=2, ensure_ascii=False)
        print(f"Created backup: {backup_billings_file}")
        
        # Backup reports
        reports = sid_gen.read_json_file(sid_gen.reports_file)
        backup_reports_file = f"backend/data/billing_reports_backup_before_sid_fix_{backup_timestamp}.json"
        with open(backup_reports_file, 'w', encoding='utf-8') as f:
            json.dump(reports, f, indent=2, ensure_ascii=False)
        print(f"Created backup: {backup_reports_file}")
        
        fixed_count = 0
        
        for sid, sources in duplicates.items():
            print(f"\nFixing duplicate SID: {sid}")
            
            # Sort by creation date to keep the oldest record with the original SID
            sources_with_dates = []
            for source, record_id, record in sources:
                created_at = record.get('created_at', '1900-01-01T00:00:00')
                sources_with_dates.append((created_at, source, record_id, record))
            
            sources_with_dates.sort()  # Oldest first
            
            # Keep the first (oldest) record with the original SID
            print(f"  Keeping original SID for oldest record: {sources_with_dates[0][1]}.json ID {sources_with_dates[0][2]}")
            
            # Fix the newer records
            for i, (created_at, source, record_id, record) in enumerate(sources_with_dates[1:], 1):
                tenant_id = record.get('tenant_id')
                if not tenant_id:
                    print(f"  ✗ Cannot fix {source}.json ID {record_id}: No tenant_id")
                    continue
                
                try:
                    # Generate new SID for this tenant
                    new_sid = sid_gen.generate_next_sid(tenant_id)
                    print(f"  ✓ Generating new SID for {source}.json ID {record_id}: {sid} -> {new_sid}")
                    
                    # Update the record
                    if source == 'billings':
                        for billing in billings:
                            if billing.get('id') == record_id:
                                billing['sid_number'] = new_sid
                                billing['updated_at'] = datetime.now().isoformat()
                                break
                    elif source == 'reports':
                        for report in reports:
                            if report.get('id') == record_id:
                                report['sid_number'] = new_sid
                                report['updated_at'] = datetime.now().isoformat()
                                break
                    
                    fixed_count += 1
                    
                except Exception as e:
                    print(f"  ✗ Error fixing {source}.json ID {record_id}: {str(e)}")
        
        # Save updated files
        if fixed_count > 0:
            # Save billings
            with open(sid_gen.billings_file, 'w', encoding='utf-8') as f:
                json.dump(billings, f, indent=2, ensure_ascii=False)
            print(f"\nUpdated {sid_gen.billings_file}")
            
            # Save reports
            with open(sid_gen.reports_file, 'w', encoding='utf-8') as f:
                json.dump(reports, f, indent=2, ensure_ascii=False)
            print(f"Updated {sid_gen.reports_file}")
            
            print(f"\n✓ Fixed {fixed_count} duplicate SIDs")
        else:
            print("\nNo SIDs were fixed")
        
        return True
        
    except Exception as e:
        print(f"Error fixing duplicates: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def verify_fix():
    """Verify that all duplicates have been fixed"""
    print("\n" + "=" * 60)
    print("VERIFYING FIX")
    print("=" * 60)
    
    duplicates = find_duplicate_sids()
    
    if not duplicates:
        print("✅ All duplicate SIDs have been fixed!")
        return True
    else:
        print("❌ Some duplicate SIDs still exist!")
        return False

def main():
    """Main function to find and fix duplicate SIDs"""
    print("Starting Duplicate SID Fix Process...")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Step 1: Find duplicates
    duplicates = find_duplicate_sids()
    
    if not duplicates:
        print("\n🎉 No duplicate SIDs found! System is clean.")
        return True
    
    # Step 2: Ask for confirmation
    print(f"\nFound {len(duplicates)} duplicate SIDs.")
    response = input("Do you want to fix these duplicates? (y/N): ").strip().lower()
    
    if response != 'y':
        print("Fix cancelled by user.")
        return False
    
    # Step 3: Fix duplicates
    success = fix_duplicate_sids(duplicates)
    
    if not success:
        print("❌ Failed to fix duplicates!")
        return False
    
    # Step 4: Verify fix
    return verify_fix()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
