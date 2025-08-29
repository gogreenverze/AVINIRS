#!/usr/bin/env python3
"""
Check test_master_enhanced.json for missing test IDs
"""

import json
import os

def check_enhanced_test_master():
    """Check if missing test IDs exist in enhanced test master"""
    os.chdir('backend')
    
    print("=" * 60)
    print("CHECKING test_master_enhanced.json FOR MISSING TEST IDS")
    print("=" * 60)
    
    # Load enhanced test master
    with open('data/test_master_enhanced.json', 'r') as f:
        enhanced_data = json.load(f)
    
    print(f"Enhanced test master has {len(enhanced_data)} tests")
    
    # Check for missing test IDs from Lipid Profile
    missing_ids = [445, 583, 442, 443, 446, 447, 526]
    
    print(f"\nChecking for missing test IDs: {missing_ids}")
    
    found_tests = []
    still_missing = []
    
    for test_id in missing_ids:
        found_test = None
        for test in enhanced_data:
            if test.get('id') == test_id:
                found_test = test
                break
        
        if found_test:
            found_tests.append((test_id, found_test.get('testName')))
            print(f"✅ Found ID {test_id}: {found_test.get('testName')}")
        else:
            still_missing.append(test_id)
            print(f"❌ Still missing ID {test_id}")
    
    print(f"\nSummary:")
    print(f"Found in enhanced file: {len(found_tests)}")
    print(f"Still missing: {len(still_missing)}")
    
    if found_tests:
        print(f"\nTests found in enhanced file:")
        for test_id, name in found_tests:
            print(f"  ID: {test_id} - {name}")
    
    if still_missing:
        print(f"\nStill missing test IDs: {still_missing}")
        
        # Try name-based search for missing ones
        print(f"\nTrying name-based search for missing tests:")
        lipid_test_names = [
            "Triglycerides", 
            "LDL/HDL Ratio",
            "Cholesterol, Total",
            "Cholesterol, HDL", 
            "Cholesterol, LDL",
            "Cholesterol, VLDL",
            "Cholesterol/HDL Ratio"
        ]
        
        for name in lipid_test_names:
            found_by_name = []
            for test in enhanced_data:
                if test.get('testName') == name:
                    found_by_name.append(test)
            
            if found_by_name:
                print(f"  '{name}' found by name:")
                for test in found_by_name:
                    print(f"    ID: {test.get('id')} - {test.get('testName')}")

if __name__ == "__main__":
    check_enhanced_test_master()
