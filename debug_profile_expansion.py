#!/usr/bin/env python3
"""
Debug profile expansion for MYD088 billing record
"""

import json
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from services.billing_reports_service import BillingReportsService

def debug_profile_expansion():
    """Debug profile expansion for MYD088"""
    print("=" * 60)
    print("DEBUGGING PROFILE EXPANSION FOR MYD088")
    print("=" * 60)
    
    service = BillingReportsService()
    
    # Load the billing data for billing ID 98
    with open('backend/data/billings.json', 'r') as f:
        billings = json.load(f)
    
    billing = None
    for b in billings:
        if b.get('id') == 98:
            billing = b
            break
    
    if not billing:
        print("❌ Billing ID 98 not found")
        return
    
    print(f"Found billing ID: {billing.get('id')}")
    print(f"SID Number: {billing.get('sid_number')}")
    
    # Get billing items
    items = billing.get('items', [])
    print(f"Original items count: {len(items)}")
    
    # Process each item
    for i, item in enumerate(items):
        print(f"\n--- Processing Item {i+1} ---")
        test_name = item.get('test_name', 'Unknown')
        test_id = item.get('test_id')
        test_master_data = item.get('test_master_data', {})
        
        print(f"Test Name: {test_name}")
        print(f"Test ID: {test_id}")
        print(f"Test ID Type: {type(test_id)}")
        print(f"Test Master Data Type: {test_master_data.get('type')}")
        
        # Check if this is a profile test
        if test_master_data.get('type') == 'profile':
            print("✅ This is a PROFILE TEST")
            
            # Test the profile lookup
            profile_data = service.get_profile_by_id(test_id)
            if profile_data:
                print(f"✅ Profile found in profiles.json: {profile_data.get('test_profile')}")
                print(f"   Profile has {len(profile_data.get('testItems', []))} sub-tests")
            else:
                print(f"❌ Profile NOT found in profiles.json for ID: {test_id}")
            
            # Test the validation logic
            print("\n--- Testing Validation Logic ---")
            
            # Check UUID format detection
            is_uuid_format = isinstance(test_id, str) and len(test_id) > 10 and '-' in test_id
            print(f"UUID format detected: {is_uuid_format}")
            
            if is_uuid_format:
                profile_match = service.get_profile_by_id(test_id)
                if profile_match:
                    print(f"✅ Profile validation successful: {profile_match.get('test_profile')}")
                    
                    # Test aggregation
                    aggregated_data = service.aggregate_profile_clinical_data(profile_match)
                    print(f"✅ Aggregated clinical data: {aggregated_data}")
                    
                    # Create enhanced item (similar to validation logic)
                    enhanced_item = {
                        'test_name': profile_match.get('test_profile', test_name),
                        'quantity': item.get('quantity', 1),
                        'price': item.get('price', item.get('amount', 0)),
                        'amount': item.get('amount', 0),
                        'id': item.get('id'),
                        'test_master_data': profile_match,
                        'test_master_id': profile_match.get('id'),
                        'profile_type': True,
                        'sub_tests': profile_match.get('testItems', [])
                    }
                    
                    print(f"✅ Enhanced item created with profile_type: {enhanced_item.get('profile_type')}")
                    print(f"   Sub-tests count: {len(enhanced_item.get('sub_tests', []))}")
                    
                    # Test expansion
                    print("\n--- Testing Profile Expansion ---")
                    expanded_tests = service.expand_profile_to_subtests(enhanced_item)
                    print(f"✅ Expansion result: {len(expanded_tests)} tests")
                    
                    for j, expanded_test in enumerate(expanded_tests):
                        print(f"   {j+1}. {expanded_test.get('test_name')} (Profile subtest: {expanded_test.get('is_profile_subtest')})")
                else:
                    print(f"❌ Profile validation failed for ID: {test_id}")
        else:
            print("ℹ️  This is an individual test")
    
    # Test the full validation process
    print("\n" + "=" * 60)
    print("TESTING FULL VALIDATION PROCESS")
    print("=" * 60)
    
    matched_tests, unmatched_tests = service.validate_billing_tests(items)
    print(f"Matched tests: {len(matched_tests)}")
    print(f"Unmatched tests: {len(unmatched_tests)}")
    
    for i, test in enumerate(matched_tests):
        print(f"{i+1}. {test.get('test_name')} - Profile: {test.get('profile_type', False)}")
        if test.get('profile_type'):
            print(f"   Sub-tests: {len(test.get('sub_tests', []))}")

if __name__ == "__main__":
    debug_profile_expansion()
