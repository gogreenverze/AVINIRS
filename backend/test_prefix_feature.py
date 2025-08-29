#!/usr/bin/env python3
"""
Test script for the new prefix checkbox feature
Tests SID generation with and without prefix for franchises
"""

import sys
import os
import json

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from sid_utils import SIDGenerator

def test_prefix_feature():
    """Test the prefix checkbox feature"""
    print("🧪 Testing Prefix Checkbox Feature for Franchise SID Generation")
    print("=" * 60)
    
    # Initialize SID generator
    sid_gen = SIDGenerator()
    
    # Test with existing franchise (should have prefix enabled by default)
    test_tenant_id = 1  # Mayiladuthurai
    
    print(f"\n📋 Testing with Tenant ID: {test_tenant_id}")
    
    try:
        # Get tenant info
        tenant_info = sid_gen.get_tenant_info(test_tenant_id)
        print(f"Tenant: {tenant_info.get('name')}")
        print(f"Site Code: {tenant_info.get('site_code')}")
        print(f"Use Prefix: {tenant_info.get('use_site_code_prefix', 'Not set (defaults to True)')}")
        
        # Generate SID with current settings
        sid = sid_gen.generate_next_sid(test_tenant_id)
        print(f"Generated SID: {sid}")
        
        # Validate the SID
        is_valid, message = sid_gen.validate_sid_format(sid, test_tenant_id)
        print(f"Validation: {'✅ Valid' if is_valid else '❌ Invalid'} - {message}")
        
        # Test uniqueness
        is_unique = sid_gen.is_sid_unique(sid)
        print(f"Uniqueness: {'✅ Unique' if is_unique else '❌ Duplicate'}")
        
    except Exception as e:
        print(f"❌ Error testing tenant {test_tenant_id}: {str(e)}")
    
    print("\n" + "=" * 60)
    print("✅ Prefix feature test completed!")
    print("\nTo test the feature fully:")
    print("1. Open http://localhost:3001/admin/franchises/create")
    print("2. Create a new franchise with 'Use Site Code Prefix' checked")
    print("3. Create another franchise with 'Use Site Code Prefix' unchecked")
    print("4. Test SID generation in billing for both franchises")

def test_manual_prefix_scenarios():
    """Test manual scenarios for prefix/no-prefix"""
    print("\n🔧 Testing Manual Prefix Scenarios")
    print("=" * 40)
    
    sid_gen = SIDGenerator()
    
    # Test scenario 1: Franchise with prefix enabled
    print("\n📝 Scenario 1: Franchise WITH prefix")
    test_data_with_prefix = {
        'id': 999,
        'name': 'Test Franchise With Prefix',
        'site_code': 'TST',
        'use_site_code_prefix': True
    }
    
    # Temporarily add test data
    tenants_file = os.path.join('data', 'tenants.json')
    with open(tenants_file, 'r') as f:
        tenants = json.load(f)
    
    # Add test franchise
    tenants.append(test_data_with_prefix)
    
    with open(tenants_file, 'w') as f:
        json.dump(tenants, f, indent=2)
    
    try:
        sid_with_prefix = sid_gen.generate_next_sid(999)
        print(f"Generated SID with prefix: {sid_with_prefix}")
        
        # Validate format
        is_valid, message = sid_gen.validate_sid_format(sid_with_prefix, 999)
        print(f"Validation: {'✅' if is_valid else '❌'} {message}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Test scenario 2: Franchise with prefix disabled
    print("\n📝 Scenario 2: Franchise WITHOUT prefix")
    test_data_without_prefix = {
        'id': 998,
        'name': 'Test Franchise Without Prefix',
        'site_code': 'TST2',
        'use_site_code_prefix': False
    }
    
    tenants.append(test_data_without_prefix)
    
    with open(tenants_file, 'w') as f:
        json.dump(tenants, f, indent=2)
    
    try:
        sid_without_prefix = sid_gen.generate_next_sid(998)
        print(f"Generated SID without prefix: {sid_without_prefix}")
        
        # Validate format
        is_valid, message = sid_gen.validate_sid_format(sid_without_prefix, 998)
        print(f"Validation: {'✅' if is_valid else '❌'} {message}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Clean up - remove test franchises
    tenants = [t for t in tenants if t.get('id') not in [999, 998]]
    with open(tenants_file, 'w') as f:
        json.dump(tenants, f, indent=2)
    
    print("\n🧹 Cleaned up test data")

if __name__ == "__main__":
    test_prefix_feature()
    test_manual_prefix_scenarios()
