#!/usr/bin/env python3
"""
Debug profile lookup in detail
"""

import json
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from services.billing_reports_service import BillingReportsService

def debug_profile_lookup():
    """Debug the profile lookup process in detail"""
    print("=" * 60)
    print("DEBUGGING PROFILE LOOKUP PROCESS")
    print("=" * 60)
    
    # Initialize service
    service = BillingReportsService()
    target_id = "c1d4fe27-8f93-4a8a-80ae-62aef9af3564"
    
    print(f"Target Profile ID: {target_id}")
    print(f"Profiles file path: {service.profiles_file}")
    
    # Check if file exists
    if os.path.exists(service.profiles_file):
        print(f"✅ Profiles file exists")
    else:
        print(f"❌ Profiles file does not exist")
        return
    
    # Read file directly
    try:
        with open(service.profiles_file, 'r') as f:
            profiles_direct = json.load(f)
        print(f"✅ Direct file read successful: {len(profiles_direct)} profiles")
    except Exception as e:
        print(f"❌ Direct file read failed: {e}")
        return
    
    # Use service method
    try:
        profiles_service = service.read_json_file(service.profiles_file)
        print(f"✅ Service file read successful: {len(profiles_service)} profiles")
    except Exception as e:
        print(f"❌ Service file read failed: {e}")
        return
    
    # Compare results
    if len(profiles_direct) == len(profiles_service):
        print("✅ Direct and service reads match")
    else:
        print(f"❌ Mismatch: Direct={len(profiles_direct)}, Service={len(profiles_service)}")
    
    # Test profile lookup
    print(f"\n--- Testing Profile Lookup ---")
    
    # Direct lookup
    found_direct = False
    for profile in profiles_direct:
        if str(profile.get('id')) == str(target_id):
            print(f"✅ Direct lookup found: {profile.get('test_profile')}")
            found_direct = True
            break
    
    if not found_direct:
        print("❌ Direct lookup failed")
    
    # Service lookup
    profile_service = service.get_profile_by_id(target_id)
    if profile_service:
        print(f"✅ Service lookup found: {profile_service.get('test_profile')}")
    else:
        print("❌ Service lookup failed")
    
    # Debug the comparison
    print(f"\n--- Debugging ID Comparison ---")
    print(f"Target ID: '{target_id}' (type: {type(target_id)})")
    
    for i, profile in enumerate(profiles_direct[:5]):  # Check first 5 profiles
        profile_id = profile.get('id')
        print(f"Profile {i+1}: '{profile_id}' (type: {type(profile_id)})")
        print(f"  str(profile_id) == str(target_id): {str(profile_id) == str(target_id)}")
        print(f"  profile_id == target_id: {profile_id == target_id}")
        if str(profile_id) == str(target_id):
            print(f"  ✅ MATCH FOUND!")
            break
        print()

if __name__ == "__main__":
    debug_profile_lookup()
