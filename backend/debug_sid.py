#!/usr/bin/env python3
"""
Debug SID generation issues
"""

from sid_utils import sid_generator
import json

def debug_sid_generation():
    print("🔍 Debugging SID Generation")
    print("=" * 50)
    
    tenant_id = 1
    
    # Check tenant info
    print(f"1. Checking tenant {tenant_id} configuration...")
    try:
        tenant_info = sid_generator.get_tenant_info(tenant_id)
        print(f"   Tenant: {tenant_info.get('name')}")
        print(f"   Site Code: {tenant_info.get('site_code')}")
        print(f"   Use Prefix: {tenant_info.get('use_site_code_prefix')}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Check existing SIDs
    print(f"\n2. Checking existing SIDs for tenant {tenant_id}...")
    try:
        site_code = tenant_info.get('site_code', '')
        use_prefix = tenant_info.get('use_site_code_prefix', False)
        existing_sids = sid_generator.get_existing_sids_for_tenant(tenant_id, site_code, use_prefix)
        print(f"   Existing SID numbers: {existing_sids}")
        print(f"   Highest SID: {max(existing_sids) if existing_sids else 'None'}")
        print(f"   Next should be: {max(existing_sids) + 1 if existing_sids else 1}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Check specific SID uniqueness
    test_sids = ["040", "041", "042", "MYD040", "MYD041", "MYD042"]
    print(f"\n3. Checking uniqueness of test SIDs...")
    for test_sid in test_sids:
        is_unique = sid_generator.is_sid_unique(test_sid)
        print(f"   SID '{test_sid}': {'✅ Unique' if is_unique else '❌ Not Unique'}")
    
    # Check session SIDs
    print(f"\n4. Checking session-generated SIDs...")
    print(f"   Session SIDs: {sid_generator._session_generated_sids}")
    
    # Try to generate a new SID
    print(f"\n5. Attempting to generate new SID...")
    try:
        new_sid = sid_generator.generate_next_sid(tenant_id)
        print(f"   ✅ Generated SID: {new_sid}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Check all SIDs in billings file
    print(f"\n6. Checking all SIDs in billings file...")
    try:
        billings = sid_generator.read_json_file(sid_generator.billings_file)
        all_sids = [b.get('sid_number') for b in billings if b.get('sid_number')]
        tenant_1_sids = [b.get('sid_number') for b in billings if b.get('tenant_id') == 1 and b.get('sid_number')]
        
        print(f"   Total billings: {len(billings)}")
        print(f"   Total SIDs: {len(all_sids)}")
        print(f"   Tenant 1 SIDs: {len(tenant_1_sids)}")
        print(f"   Last 10 tenant 1 SIDs: {tenant_1_sids[-10:]}")
        
        # Check for "041" specifically
        has_041 = "041" in all_sids
        has_myd041 = "MYD041" in all_sids
        print(f"   Contains '041': {has_041}")
        print(f"   Contains 'MYD041': {has_myd041}")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")

if __name__ == "__main__":
    debug_sid_generation()
