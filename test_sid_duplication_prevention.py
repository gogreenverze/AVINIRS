#!/usr/bin/env python3
"""
Test script to verify SID duplication prevention across all franchises
"""

import sys
import os
import json
from datetime import datetime

# Add backend directory to path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

def test_sid_duplication_prevention():
    """Test that SID generation prevents duplicates across all systems"""
    print("=" * 60)
    print("SID DUPLICATION PREVENTION TEST")
    print("=" * 60)
    
    try:
        # Import SIDGenerator directly from the utils directory
        utils_dir = os.path.join(os.path.dirname(__file__), 'backend', 'utils')
        sys.path.insert(0, utils_dir)
        from sid_utils import SIDGenerator
        
        sid_gen = SIDGenerator(data_dir="backend/data")
        
        # Get all franchises
        summary = sid_gen.get_franchise_summary()
        
        if not summary:
            print("✗ No franchise data found")
            return False
        
        print(f"Testing {len(summary)} franchises for SID duplication prevention...")
        print()
        
        all_tests_passed = True
        
        for tenant_id, info in summary.items():
            print(f"Testing Franchise: {info['name']} ({info['site_code']})")
            print(f"  Current SID count: {info['sid_count']}")
            print(f"  Next expected SID: {info['next_sid']}")

            # Clear session SIDs before testing each franchise
            sid_gen.clear_session_sids()
            
            # Test 1: Generate multiple SIDs and ensure no duplicates
            generated_sids = []
            for i in range(5):
                try:
                    new_sid = sid_gen.generate_next_sid(tenant_id)

                    # Check if this SID was already generated in this test
                    if new_sid in generated_sids:
                        print(f"  ✗ DUPLICATE SID GENERATED: {new_sid}")
                        all_tests_passed = False
                    else:
                        generated_sids.append(new_sid)
                        print(f"  ✓ Generated unique SID: {new_sid}")

                    # Validate format
                    is_valid, message = sid_gen.validate_sid_format(new_sid, tenant_id)
                    if not is_valid:
                        print(f"  ✗ Invalid SID format: {new_sid} - {message}")
                        all_tests_passed = False

                except Exception as e:
                    print(f"  ✗ Error generating SID: {str(e)}")
                    all_tests_passed = False
            
            # Test 2: Try to validate an existing SID (should fail uniqueness)
            existing_sids = sid_gen.get_existing_sids_for_tenant(tenant_id, info['site_code'])
            if existing_sids:
                test_existing_sid = f"{info['site_code']}{existing_sids[0]:03d}"
                if sid_gen.is_sid_unique(test_existing_sid):
                    print(f"  ✗ Existing SID {test_existing_sid} incorrectly reported as unique")
                    all_tests_passed = False
                else:
                    print(f"  ✓ Existing SID {test_existing_sid} correctly identified as duplicate")
            
            print()
        
        return all_tests_passed
        
    except Exception as e:
        print(f"✗ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_cross_franchise_uniqueness():
    """Test that SIDs are unique across all franchises (no cross-franchise duplicates)"""
    print("=" * 60)
    print("CROSS-FRANCHISE SID UNIQUENESS TEST")
    print("=" * 60)
    
    try:
        # Import SIDGenerator directly from the utils directory
        utils_dir = os.path.join(os.path.dirname(__file__), 'backend', 'utils')
        sys.path.insert(0, utils_dir)
        from sid_utils import SIDGenerator
        
        sid_gen = SIDGenerator(data_dir="backend/data")
        
        # Collect all existing SIDs across all franchises
        all_sids = []
        
        # Check billings
        billings = sid_gen.read_json_file(sid_gen.billings_file)
        for billing in billings:
            sid = billing.get('sid_number')
            if sid:
                all_sids.append(sid)
        
        # Check reports
        reports = sid_gen.read_json_file(sid_gen.reports_file)
        for report in reports:
            sid = report.get('sid_number')
            if sid:
                all_sids.append(sid)
        
        print(f"Found {len(all_sids)} total SIDs across all systems")
        
        # Check for duplicates
        unique_sids = set(all_sids)
        if len(unique_sids) != len(all_sids):
            duplicates = []
            for sid in unique_sids:
                count = all_sids.count(sid)
                if count > 1:
                    duplicates.append((sid, count))
            
            print(f"✗ FOUND {len(duplicates)} DUPLICATE SIDs:")
            for sid, count in duplicates:
                print(f"  - {sid}: appears {count} times")
            return False
        else:
            print("✓ All SIDs are unique across all franchises and systems")
            return True
            
    except Exception as e:
        print(f"✗ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_sid_format_validation():
    """Test SID format validation for all franchises"""
    print("=" * 60)
    print("SID FORMAT VALIDATION TEST")
    print("=" * 60)
    
    try:
        # Import SIDGenerator directly from the utils directory
        utils_dir = os.path.join(os.path.dirname(__file__), 'backend', 'utils')
        sys.path.insert(0, utils_dir)
        from sid_utils import SIDGenerator
        
        sid_gen = SIDGenerator(data_dir="backend/data")
        summary = sid_gen.get_franchise_summary()
        
        all_tests_passed = True
        
        for tenant_id, info in summary.items():
            site_code = info['site_code']
            print(f"Testing format validation for {info['name']} ({site_code})")
            
            # Test valid formats
            valid_sids = [
                f"{site_code}001",
                f"{site_code}999",
                f"{site_code}123"
            ]
            
            for sid in valid_sids:
                is_valid, message = sid_gen.validate_sid_format(sid, tenant_id)
                if not is_valid:
                    print(f"  ✗ Valid SID {sid} rejected: {message}")
                    all_tests_passed = False
                else:
                    print(f"  ✓ Valid SID {sid} accepted")
            
            # Test invalid formats
            invalid_sids = [
                f"{site_code}01",      # Too short
                f"{site_code}0001",    # Too long
                f"{site_code}ABC",     # Non-numeric
                f"XXX001",             # Wrong site code
                "",                    # Empty
                "123"                  # No site code
            ]
            
            for sid in invalid_sids:
                is_valid, message = sid_gen.validate_sid_format(sid, tenant_id)
                if is_valid:
                    print(f"  ✗ Invalid SID {sid} incorrectly accepted")
                    all_tests_passed = False
                else:
                    print(f"  ✓ Invalid SID {sid} correctly rejected: {message}")
            
            print()
        
        return all_tests_passed
        
    except Exception as e:
        print(f"✗ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all SID duplication prevention tests"""
    print("Starting SID Duplication Prevention Tests...")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    tests = [
        ("SID Duplication Prevention", test_sid_duplication_prevention),
        ("Cross-Franchise Uniqueness", test_cross_franchise_uniqueness),
        ("SID Format Validation", test_sid_format_validation)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"Running {test_name}...")
        try:
            result = test_func()
            results.append((test_name, result))
            status = "PASSED" if result else "FAILED"
            print(f"{test_name}: {status}")
        except Exception as e:
            print(f"{test_name}: FAILED with error: {str(e)}")
            results.append((test_name, False))
        print()
    
    # Summary
    print("=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASSED" if result else "✗ FAILED"
        print(f"{status} {test_name}")
    
    print()
    print(f"Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All SID duplication prevention tests PASSED!")
        return True
    else:
        print("❌ Some SID duplication prevention tests FAILED!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
