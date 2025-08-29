#!/usr/bin/env python3
"""
Fix Lipid Profile test IDs in profiles.json
"""

import json
import os
from datetime import datetime

def fix_lipid_profile():
    """Fix the Lipid Profile test IDs"""
    os.chdir('backend')
    
    print("=" * 60)
    print("FIXING LIPID PROFILE TEST IDS")
    print("=" * 60)
    
    # Load current profiles
    with open('data/profiles.json', 'r') as f:
        profiles = json.load(f)
    
    # Load test_master to get correct IDs
    with open('data/test_master.json', 'r') as f:
        test_master = json.load(f)
    
    # Create mapping of test names to correct IDs
    test_name_to_id = {}
    for test in test_master:
        test_name_to_id[test.get('testName')] = test.get('id')
    
    # Find the Lipid Profile
    lipid_profile = None
    profile_index = None
    
    for i, profile in enumerate(profiles):
        if profile.get('id') == 'c1d4fe27-8f93-4a8a-80ae-62aef9af3564':
            lipid_profile = profile
            profile_index = i
            break
    
    if not lipid_profile:
        print("❌ Lipid Profile not found")
        return
    
    print(f"Found Lipid Profile: {lipid_profile.get('test_profile')}")
    print(f"Current test items: {len(lipid_profile.get('testItems', []))}")
    
    # Fix the test IDs
    test_items = lipid_profile.get('testItems', [])
    fixed_items = []
    
    for item in test_items:
        test_name = item.get('testName')
        old_id = item.get('test_id')
        
        # Find correct ID
        correct_id = test_name_to_id.get(test_name)
        
        if correct_id:
            fixed_item = {
                'test_id': correct_id,
                'testName': test_name,
                'amount': item.get('amount', 0)
            }
            fixed_items.append(fixed_item)
            print(f"✅ Fixed: {test_name} - {old_id} → {correct_id}")
        else:
            print(f"❌ Could not find correct ID for: {test_name}")
            # Keep original for now
            fixed_items.append(item)
    
    # Update the profile
    lipid_profile['testItems'] = fixed_items
    profiles[profile_index] = lipid_profile
    
    # Create backup
    backup_filename = f"data/profiles_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(backup_filename, 'w') as f:
        json.dump(profiles, f, indent=2)
    print(f"✅ Backup created: {backup_filename}")
    
    # Save updated profiles
    with open('data/profiles.json', 'w') as f:
        json.dump(profiles, f, indent=2)
    
    print(f"✅ Updated profiles.json with correct test IDs")
    
    # Verify the fix
    print(f"\nVerification:")
    for item in fixed_items:
        test_id = item.get('test_id')
        test_name = item.get('testName')
        
        # Check if this ID exists in test_master
        found = any(test.get('id') == test_id for test in test_master)
        status = "✅" if found else "❌"
        print(f"  {status} {test_name} (ID: {test_id})")

if __name__ == "__main__":
    fix_lipid_profile()
