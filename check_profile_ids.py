#!/usr/bin/env python3
"""
Check profile IDs in profiles.json
"""

import json

def check_profile_ids():
    """Check what profile IDs exist"""
    with open('backend/data/profiles.json', 'r') as f:
        profiles = json.load(f)
    
    print("=" * 60)
    print("PROFILE IDS IN PROFILES.JSON")
    print("=" * 60)
    
    # Look for Lipid Profile specifically
    lipid_profiles = []
    for profile in profiles:
        test_profile = profile.get('test_profile', '').lower()
        if 'lipid' in test_profile:
            lipid_profiles.append(profile)
    
    print(f"Found {len(lipid_profiles)} Lipid Profile(s):")
    for profile in lipid_profiles:
        print(f"  ID: {profile.get('id')}")
        print(f"  Name: {profile.get('test_profile')}")
        print(f"  Sub-tests: {len(profile.get('testItems', []))}")
        print()
    
    # Check the specific ID from billing
    target_id = "c1d4fe27-8f93-4a8a-80ae-62aef9af3564"
    print(f"Looking for specific ID: {target_id}")
    
    found = False
    for profile in profiles:
        if str(profile.get('id')) == target_id:
            print(f"✅ Found matching profile: {profile.get('test_profile')}")
            found = True
            break
    
    if not found:
        print("❌ Target ID not found in profiles.json")
        
        # Check if there's a similar profile
        for profile in profiles:
            if profile.get('test_profile') == 'Lipid Profile':
                print(f"ℹ️  Found 'Lipid Profile' with different ID: {profile.get('id')}")

if __name__ == "__main__":
    check_profile_ids()
