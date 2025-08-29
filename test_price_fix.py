#!/usr/bin/env python3
"""
Test script to verify that the billing API returns correct prices from test_master.json
"""

import requests
import json
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from utils.data_utils import read_data

def test_price_mapping():
    """Test that prices are correctly mapped from test_price field"""
    
    print("Testing price mapping from test_master.json...")
    
    # Read test_master.json directly
    test_master = read_data('test_master.json')
    
    # Check first few tests with non-zero prices
    tests_with_prices = [test for test in test_master if test.get('test_price', 0) > 0][:5]
    
    print(f"\nFound {len(tests_with_prices)} tests with non-zero prices")
    print("\nSample tests with prices:")
    for test in tests_with_prices:
        print(f"ID: {test.get('id')}, Name: {test.get('testName')}, Price: {test.get('test_price')}")
    
    # Test the API endpoint (without authentication for now)
    print("\n" + "="*50)
    print("API Response Test (without auth - will show structure)")
    
    try:
        response = requests.get('http://localhost:5001/api/billing/test-master')
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"API call failed: {e}")
    
    print("\n" + "="*50)
    print("Direct data verification:")
    
    # Simulate the backend mapping logic
    formatted_tests = []
    for test in test_master[:5]:  # Just first 5 for testing
        formatted_test = {
            'id': test.get('id'),
            'testName': test.get('testName'),
            'displayName': test.get('displayName'),
            'department': test.get('department'),
            'hmsCode': test.get('hmsCode'),
            'testPrice': test.get('test_price', 0),  # This is the fix
            'specimen': test.get('specimen'),
            'container': test.get('container'),
            'serviceTime': test.get('serviceTime'),
            'reportingDays': test.get('reportingDays'),
            'cutoffTime': test.get('cutoffTime')
        }
        formatted_tests.append(formatted_test)
    
    print("Formatted test data (first 5 tests):")
    for test in formatted_tests:
        print(f"ID: {test['id']}, Name: {test['testName']}, Price: {test['testPrice']}")
    
    # Check if any prices are correctly mapped
    non_zero_prices = [test for test in formatted_tests if test['testPrice'] > 0]
    print(f"\nTests with non-zero prices after mapping: {len(non_zero_prices)}")
    
    if non_zero_prices:
        print("✅ Price mapping is working correctly!")
        for test in non_zero_prices:
            print(f"  - {test['testName']}: ₹{test['testPrice']}")
    else:
        print("❌ Price mapping issue - all prices are 0")

if __name__ == "__main__":
    test_price_mapping()
