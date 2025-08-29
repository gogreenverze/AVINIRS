#!/usr/bin/env python3
"""
Find the missing tests for Lipid Profile
"""

import json
import os

def find_missing_tests():
    """Find the missing tests"""
    os.chdir('backend')
    
    with open('data/test_master.json', 'r') as f:
        test_master = json.load(f)
    
    print("=" * 60)
    print("FINDING MISSING TESTS FOR LIPID PROFILE")
    print("=" * 60)
    
    # Search for triglyceride tests
    print("Searching for Triglyceride tests:")
    triglyceride_tests = []
    for test in test_master:
        test_name = test.get('testName', '').lower()
        if 'triglyceride' in test_name:
            triglyceride_tests.append(test)
    
    for test in triglyceride_tests:
        print(f"  ID: {test.get('id')} - {test.get('testName')}")
    
    # Search for ratio tests
    print(f"\nSearching for ratio tests:")
    ratio_tests = []
    for test in test_master:
        test_name = test.get('testName', '').lower()
        if 'ratio' in test_name:
            ratio_tests.append(test)
    
    for test in ratio_tests:
        print(f"  ID: {test.get('id')} - {test.get('testName')}")
    
    # Search for LDL/HDL specifically
    print(f"\nSearching for LDL/HDL tests:")
    ldl_hdl_tests = []
    for test in test_master:
        test_name = test.get('testName', '').lower()
        if ('ldl' in test_name and 'hdl' in test_name) or 'ldl/hdl' in test_name:
            ldl_hdl_tests.append(test)
    
    for test in ldl_hdl_tests:
        print(f"  ID: {test.get('id')} - {test.get('testName')}")

if __name__ == "__main__":
    find_missing_tests()
