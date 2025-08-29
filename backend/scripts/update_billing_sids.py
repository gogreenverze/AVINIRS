#!/usr/bin/env python3
"""
Script to update existing billing records with new franchise-specific SID format.
Converts old SID format to new SITE_CODE + 3-digit sequential format.
"""

import json
import os
import sys
from datetime import datetime
from typing import Dict, List

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
    backup_path = f"{file_path}_backup_{timestamp}"
    
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

def generate_new_sid(tenant_id: int, site_code: str, existing_sids: Dict[int, List[int]]) -> str:
    """Generate new SID for a tenant"""
    if tenant_id not in existing_sids:
        existing_sids[tenant_id] = []
    
    # Find next available number for this franchise
    if existing_sids[tenant_id]:
        next_number = max(existing_sids[tenant_id]) + 1
    else:
        next_number = 1
    
    # Add to existing list
    existing_sids[tenant_id].append(next_number)
    
    return f"{site_code}{next_number:03d}"

def update_billing_sids():
    """Main function to update billing SIDs"""
    print("Starting billing SID update process...")
    
    # File paths
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    billings_file = os.path.join(data_dir, 'billings.json')
    tenants_file = os.path.join(data_dir, 'tenants.json')
    
    # Check if files exist
    if not os.path.exists(billings_file):
        print(f"Error: {billings_file} not found")
        return False
    
    if not os.path.exists(tenants_file):
        print(f"Error: {tenants_file} not found")
        return False
    
    # Create backup
    backup_path = backup_file(billings_file)
    if not backup_path:
        print("Failed to create backup. Aborting update.")
        return False
    
    # Load data
    billings = read_json_file(billings_file)
    tenants = read_json_file(tenants_file)
    
    if not billings:
        print("No billing records found")
        return False
    
    if not tenants:
        print("No tenant records found")
        return False
    
    # Create tenant mapping
    tenant_site_map = get_tenant_site_code_map(tenants)
    print(f"Loaded {len(tenants)} tenants")
    print("Tenant site code mapping:")
    for tenant_id, site_code in tenant_site_map.items():
        tenant_name = next((t.get('name', 'Unknown') for t in tenants if t.get('id') == tenant_id), 'Unknown')
        print(f"  {tenant_id}: {site_code} ({tenant_name})")
    
    # Track existing SIDs per franchise to maintain sequential numbering
    existing_sids = {}
    
    # First pass: collect existing valid SIDs in new format
    for billing in billings:
        tenant_id = billing.get('tenant_id')
        sid = billing.get('sid_number', '')
        
        if tenant_id and sid and tenant_id in tenant_site_map:
            site_code = tenant_site_map[tenant_id]
            if sid.startswith(site_code) and len(sid) == len(site_code) + 3:
                try:
                    number_part = sid[len(site_code):]
                    if number_part.isdigit():
                        if tenant_id not in existing_sids:
                            existing_sids[tenant_id] = []
                        existing_sids[tenant_id].append(int(number_part))
                except ValueError:
                    continue
    
    # Sort existing SIDs for each franchise
    for tenant_id in existing_sids:
        existing_sids[tenant_id].sort()
    
    print(f"\nExisting valid SIDs found:")
    for tenant_id, sids in existing_sids.items():
        site_code = tenant_site_map.get(tenant_id, 'XX')
        print(f"  {site_code}: {len(sids)} SIDs (highest: {max(sids) if sids else 0})")
    
    # Second pass: update records that need new SIDs
    updated_count = 0
    
    for billing in billings:
        tenant_id = billing.get('tenant_id')
        current_sid = billing.get('sid_number', '')
        
        if not tenant_id or tenant_id not in tenant_site_map:
            print(f"Warning: Billing ID {billing.get('id')} has invalid tenant_id: {tenant_id}")
            continue
        
        site_code = tenant_site_map[tenant_id]
        needs_update = False
        
        # Check if SID needs updating
        if not current_sid:
            needs_update = True
            reason = "missing SID"
        elif not current_sid.startswith(site_code):
            needs_update = True
            reason = f"wrong prefix (current: {current_sid[:3] if len(current_sid) >= 3 else current_sid}, expected: {site_code})"
        elif len(current_sid) != len(site_code) + 3:
            needs_update = True
            reason = f"wrong format (current: {current_sid}, expected: {site_code}XXX)"
        else:
            try:
                number_part = current_sid[len(site_code):]
                if not number_part.isdigit():
                    needs_update = True
                    reason = f"non-numeric suffix: {number_part}"
            except:
                needs_update = True
                reason = "invalid format"
        
        if needs_update:
            new_sid = generate_new_sid(tenant_id, site_code, existing_sids)
            old_sid = current_sid or "None"
            billing['sid_number'] = new_sid
            updated_count += 1
            print(f"  Updated billing ID {billing.get('id')}: {old_sid} -> {new_sid} ({reason})")
    
    # Save updated billings
    if updated_count > 0:
        if write_json_file(billings_file, billings):
            print(f"\nSuccessfully updated {updated_count} billing records")
            print(f"Backup saved as: {backup_path}")
            return True
        else:
            print("Error saving updated billings")
            return False
    else:
        print("\nNo billing records needed updating")
        # Remove backup since no changes were made
        try:
            os.remove(backup_path)
            print("Removed unnecessary backup file")
        except:
            pass
        return True

if __name__ == "__main__":
    print("AVINI Billing SID Update Script")
    print("=" * 50)
    
    success = update_billing_sids()
    
    if success:
        print("\nSID update completed successfully!")
    else:
        print("\nSID update failed!")
        sys.exit(1)
