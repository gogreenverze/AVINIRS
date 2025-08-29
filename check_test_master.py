#!/usr/bin/env python3
"""
Check test_master.json for missing sub-tests
"""

import json
import os

def check_test_master():
    """Check test_master.json for missing sub-tests"""
    os.chdir('backend')
    
    print("=" * 60)
    print("CHECKING TEST_MASTER.JSON FOR MISSING SUB-TESTS")
    print("=" * 60)
    
    # Load test_master.json
    with open('data/test_master.json', 'r') as f:
        test_master = json.load(f)
    
    print(f"Total tests in test_master: {len(test_master)}")
    
    # Check for the specific missing test IDs
    missing_ids = [445, 583, 442, 443, 446, 447, 526]
    
    print(f"\nChecking for missing test IDs: {missing_ids}")
    
    found_tests = []
    missing_tests = []
    
    for test_id in missing_ids:
        found = False
        for test in test_master:
            if test.get('id') == test_id:
                found_tests.append(test)
                found = True
                break
        
        if not found:
            missing_tests.append(test_id)
    
    print(f"\nFound tests: {len(found_tests)}")
    for test in found_tests:
        print(f"  ID: {test.get('id')} - {test.get('testName')}")
    
    print(f"\nMissing tests: {len(missing_tests)}")
    for test_id in missing_tests:
        print(f"  ID: {test_id}")
    
    # Check if there are any cholesterol-related tests
    print(f"\nSearching for cholesterol-related tests:")
    cholesterol_tests = []
    for test in test_master:
        test_name = test.get('testName', '').lower()
        if 'cholesterol' in test_name or 'triglyceride' in test_name or 'hdl' in test_name or 'ldl' in test_name:
            cholesterol_tests.append(test)
    
    print(f"Found {len(cholesterol_tests)} cholesterol-related tests:")
    for test in cholesterol_tests[:10]:  # Show first 10
        print(f"  ID: {test.get('id')} - {test.get('testName')}")
    
    # Check what the highest ID is in test_master
    max_id = max(test.get('id', 0) for test in test_master)
    print(f"\nHighest test ID in test_master: {max_id}")
    
    # Check if the missing IDs are higher than the max
    if missing_tests:
        print(f"Missing test IDs: {missing_tests}")
        print(f"Are missing IDs higher than max ID? {all(id > max_id for id in missing_tests)}")

if __name__ == "__main__":
    check_test_master()
