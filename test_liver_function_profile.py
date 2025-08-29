#!/usr/bin/env python3
"""
Test Liver Function Test profile to ensure fallback works for other profiles
"""

import json
import os
import sys

# Change to backend directory
os.chdir('backend')

# Add to path
sys.path.append('.')

from services.billing_reports_service import BillingReportsService

def test_liver_function_profile():
    """Test Liver Function Test profile expansion"""
    print("=" * 60)
    print("TESTING LIVER FUNCTION TEST PROFILE EXPANSION")
    print("=" * 60)
    
    service = BillingReportsService()
    
    # Load profiles to find Liver Function Test
    with open('data/profiles.json', 'r') as f:
        profiles = json.load(f)
    
    liver_profile = None
    for profile in profiles:
        if 'liver function' in profile.get('test_profile', '').lower():
            liver_profile = profile
            break
    
    if not liver_profile:
        print("❌ Liver Function Test profile not found")
        return
    
    print(f"Found Liver Function Test profile:")
    print(f"  ID: {liver_profile.get('id')}")
    print(f"  Name: {liver_profile.get('test_profile')}")
    print(f"  Sub-tests: {len(liver_profile.get('testItems', []))}")
    
    # Test each sub-test
    test_items = liver_profile.get('testItems', [])
    print(f"\nTesting sub-test lookup:")
    
    found_in_primary = 0
    found_in_enhanced = 0
    not_found = 0
    
    for item in test_items:
        test_id = item.get('test_id')
        test_name = item.get('testName')
        
        # Test the enhanced get_test_by_id method
        test_data = service.get_test_by_id(test_id)
        
        if test_data:
            # Check which file it was found in by looking at the logs
            print(f"  ✅ {test_name} (ID: {test_id}) - Found")
        else:
            print(f"  ❌ {test_name} (ID: {test_id}) - Not found")
            not_found += 1
    
    print(f"\nSummary:")
    print(f"  Total sub-tests: {len(test_items)}")
    print(f"  Not found: {not_found}")
    
    if not_found == 0:
        print("  ✅ All sub-tests found - profile expansion should work!")
    else:
        print(f"  ⚠️  {not_found} sub-tests missing - profile expansion may be incomplete")

if __name__ == "__main__":
    test_liver_function_profile()
