#!/usr/bin/env python3
"""
Test script for the new franchise-specific SID generation system.
Validates that the system works correctly across all franchises.
"""

import sys
import os
import json
from datetime import datetime

# Add backend directory to path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

def test_sid_generation():
    """Test SID generation for all franchises"""
    print("Testing New SID Generation System")
    print("=" * 50)
    
    try:
        from utils.sid_utils import SIDGenerator, get_franchise_sid_summary
        
        # Initialize SID generator
        sid_gen = SIDGenerator(data_dir="backend/data")
        
        # Get franchise summary
        summary = get_franchise_sid_summary()
        
        print(f"Found {len(summary)} franchises:")
        print("-" * 50)
        
        for tenant_id, info in summary.items():
            print(f"Franchise: {info['name']}")
            print(f"  Site Code: {info['site_code']}")
            print(f"  Current SIDs: {info['sid_count']}")
            print(f"  Highest SID: {info['highest_sid']}")
            print(f"  Next SID: {info['next_sid']}")
            print()
        
        # Test SID generation for each franchise
        print("Testing SID Generation:")
        print("-" * 30)
        
        test_results = []
        
        for tenant_id, info in summary.items():
            try:
                # Generate new SID
                new_sid = sid_gen.generate_next_sid(tenant_id)
                
                # Validate format
                is_valid, message = sid_gen.validate_sid_format(new_sid, tenant_id)
                
                # Check uniqueness
                is_unique = sid_gen.is_sid_unique(new_sid)
                
                result = {
                    'tenant_id': tenant_id,
                    'franchise': info['name'],
                    'site_code': info['site_code'],
                    'generated_sid': new_sid,
                    'format_valid': is_valid,
                    'is_unique': is_unique,
                    'validation_message': message
                }
                
                test_results.append(result)
                
                status = "✓ PASS" if is_valid and is_unique else "✗ FAIL"
                print(f"{status} {info['site_code']}: {new_sid} ({info['name']})")
                
                if not is_valid:
                    print(f"    Format Error: {message}")
                if not is_unique:
                    print(f"    Uniqueness Error: SID already exists")
                    
            except Exception as e:
                print(f"✗ ERROR {info['site_code']}: {str(e)}")
                test_results.append({
                    'tenant_id': tenant_id,
                    'franchise': info['name'],
                    'site_code': info['site_code'],
                    'error': str(e)
                })
        
        # Summary
        print("\n" + "=" * 50)
        print("TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for r in test_results if r.get('format_valid') and r.get('is_unique'))
        total = len(test_results)
        
        print(f"Total Franchises: {total}")
        print(f"Tests Passed: {passed}")
        print(f"Tests Failed: {total - passed}")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED! The new SID system is working correctly.")
        else:
            print(f"\n⚠️  {total - passed} tests failed. Please review the errors above.")
        
        return passed == total
        
    except ImportError as e:
        print(f"Error importing SID utilities: {e}")
        print("Make sure you're running this from the correct directory.")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

def test_sid_validation():
    """Test SID validation functionality"""
    print("\n" + "=" * 50)
    print("Testing SID Validation")
    print("=" * 50)
    
    try:
        from utils.sid_utils import SIDGenerator
        
        sid_gen = SIDGenerator(data_dir="backend/data")
        
        # Test cases for validation
        test_cases = [
            (1, "MYD001", True, "Valid Mayiladuthurai SID"),
            (1, "MYD999", True, "Valid Mayiladuthurai SID with high number"),
            (2, "SKZ001", True, "Valid Sirkazhi SID"),
            (11, "SWM001", True, "Valid Swamimalai SID"),
            (1, "SKZ001", False, "Wrong site code for Mayiladuthurai"),
            (1, "MYD01", False, "Too short"),
            (1, "MYD0001", False, "Too long"),
            (1, "MYDABC", False, "Non-numeric suffix"),
            (1, "", False, "Empty SID"),
        ]
        
        passed = 0
        total = len(test_cases)
        
        for tenant_id, sid, expected_valid, description in test_cases:
            is_valid, message = sid_gen.validate_sid_format(sid, tenant_id)
            
            if is_valid == expected_valid:
                print(f"✓ PASS: {description} - {sid}")
                passed += 1
            else:
                print(f"✗ FAIL: {description} - {sid}")
                print(f"    Expected: {expected_valid}, Got: {is_valid}")
                print(f"    Message: {message}")
        
        print(f"\nValidation Tests: {passed}/{total} passed")
        return passed == total
        
    except Exception as e:
        print(f"Error during validation testing: {e}")
        return False

def test_franchise_addition():
    """Test that system works with new franchise additions"""
    print("\n" + "=" * 50)
    print("Testing New Franchise Addition")
    print("=" * 50)
    
    try:
        from utils.sid_utils import SIDGenerator
        
        sid_gen = SIDGenerator(data_dir="backend/data")
        
        # Simulate a new franchise (using existing tenant ID for testing)
        test_tenant_id = 18  # AVINI Labs Avadi
        
        # Get site code
        site_code = sid_gen.get_tenant_site_code(test_tenant_id)
        print(f"Testing with Tenant ID {test_tenant_id}, Site Code: {site_code}")
        
        # Generate SID
        new_sid = sid_gen.generate_next_sid(test_tenant_id)
        print(f"Generated SID: {new_sid}")
        
        # Validate
        is_valid, message = sid_gen.validate_sid_format(new_sid, test_tenant_id)
        is_unique = sid_gen.is_sid_unique(new_sid)
        
        print(f"Format Valid: {is_valid}")
        print(f"Is Unique: {is_unique}")
        print(f"Message: {message}")
        
        success = is_valid and is_unique
        print(f"\n{'✓ SUCCESS' if success else '✗ FAILED'}: New franchise SID generation")
        
        return success
        
    except Exception as e:
        print(f"Error testing new franchise addition: {e}")
        return False

def main():
    """Run all tests"""
    print("AVINI Franchise-Specific SID System Test Suite")
    print("=" * 60)
    print(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Run tests
    test1_passed = test_sid_generation()
    test2_passed = test_sid_validation()
    test3_passed = test_franchise_addition()
    
    # Final summary
    print("\n" + "=" * 60)
    print("FINAL TEST RESULTS")
    print("=" * 60)
    
    tests = [
        ("SID Generation", test1_passed),
        ("SID Validation", test2_passed),
        ("New Franchise Support", test3_passed)
    ]
    
    passed_count = sum(1 for _, passed in tests if passed)
    total_count = len(tests)
    
    for test_name, passed in tests:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\nOverall Result: {passed_count}/{total_count} test suites passed")
    
    if passed_count == total_count:
        print("\n🎉 ALL TEST SUITES PASSED!")
        print("The new franchise-specific SID system is ready for production use.")
        return True
    else:
        print(f"\n⚠️  {total_count - passed_count} test suite(s) failed.")
        print("Please review and fix the issues before deploying.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
