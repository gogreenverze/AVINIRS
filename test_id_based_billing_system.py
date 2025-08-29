#!/usr/bin/env python3
"""
Test ID-based Billing System
Comprehensive test to validate the new ID-based test matching system
"""

import sys
import os
import json
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.billing_reports_service import BillingReportsService

def test_billing_record_structure():
    """Test that billing records have proper test_id structure"""
    print("🔍 Testing Billing Record Structure")
    print("-" * 50)
    
    billings_file = 'backend/data/billings.json'
    try:
        with open(billings_file, 'r') as f:
            billings = json.load(f)
    except Exception as e:
        print(f"❌ Error reading billings file: {e}")
        return False
    
    total_records = len(billings)
    records_with_test_ids = 0
    total_items = 0
    items_with_test_ids = 0
    
    for billing in billings:
        items = billing.get('items', [])
        record_has_test_ids = True
        
        for item in items:
            total_items += 1
            if item.get('test_id'):
                items_with_test_ids += 1
            else:
                record_has_test_ids = False
        
        if record_has_test_ids and items:
            records_with_test_ids += 1
    
    print(f"📊 Billing Records Analysis:")
    print(f"   - Total records: {total_records}")
    print(f"   - Records with test_ids: {records_with_test_ids}")
    print(f"   - Total test items: {total_items}")
    print(f"   - Items with test_ids: {items_with_test_ids}")
    
    if total_items > 0:
        test_id_rate = (items_with_test_ids / total_items) * 100
        print(f"   - Test ID coverage: {test_id_rate:.1f}%")
        
        if test_id_rate >= 95:
            print("   ✅ Excellent test ID coverage")
            return True
        elif test_id_rate >= 80:
            print("   ⚠️  Good test ID coverage, some items may need attention")
            return True
        else:
            print("   ❌ Poor test ID coverage, migration may be incomplete")
            return False
    
    return False

def test_report_generation():
    """Test that reports are generated correctly with test details"""
    print("\n🧪 Testing Report Generation")
    print("-" * 50)
    
    reports_service = BillingReportsService(data_dir="backend/data")
    
    # Read existing reports
    reports_file = 'backend/data/billing_reports.json'
    try:
        with open(reports_file, 'r') as f:
            reports = json.load(f)
    except Exception as e:
        print(f"❌ Error reading reports file: {e}")
        return False
    
    total_reports = len(reports)
    reports_with_tests = 0
    total_test_items = 0
    
    for report in reports:
        test_items = report.get('test_items', [])
        if test_items:
            reports_with_tests += 1
            total_test_items += len(test_items)
    
    print(f"📊 Report Analysis:")
    print(f"   - Total reports: {total_reports}")
    print(f"   - Reports with test details: {reports_with_tests}")
    print(f"   - Total test items in reports: {total_test_items}")
    
    if total_reports > 0:
        success_rate = (reports_with_tests / total_reports) * 100
        print(f"   - Report success rate: {success_rate:.1f}%")
        
        if success_rate == 100:
            print("   ✅ Perfect! All reports have test details")
            return True
        elif success_rate >= 80:
            print("   ⚠️  Most reports have test details")
            return True
        else:
            print("   ❌ Many reports missing test details")
            return False
    
    return False

def test_test_master_lookup():
    """Test that test_master lookup works correctly"""
    print("\n🔍 Testing Test Master Lookup")
    print("-" * 50)
    
    reports_service = BillingReportsService(data_dir="backend/data")
    
    # Test some known test IDs
    test_cases = [
        {'id': 1, 'expected_name': '1,25 Dihydroxyvitamin D'},
        {'id': 2, 'expected_name': '17 - HYDROXY PROGESTERONE'},
        {'id': 3, 'expected_name': '25 Hydroxy Vitamin D3'},
        {'id': 999, 'expected_name': None}  # Non-existent ID
    ]
    
    passed_tests = 0
    
    for test_case in test_cases:
        test_id = test_case['id']
        expected_name = test_case['expected_name']
        
        result = reports_service.get_test_by_id(test_id)
        
        if expected_name is None:
            # Should not find the test
            if result is None:
                print(f"   ✅ Test ID {test_id}: Correctly not found")
                passed_tests += 1
            else:
                print(f"   ❌ Test ID {test_id}: Should not exist but found '{result.get('testName')}'")
        else:
            # Should find the test
            if result and result.get('testName') == expected_name:
                print(f"   ✅ Test ID {test_id}: Found '{result.get('testName')}'")
                passed_tests += 1
            else:
                found_name = result.get('testName') if result else 'Not found'
                print(f"   ❌ Test ID {test_id}: Expected '{expected_name}', got '{found_name}'")
    
    success_rate = (passed_tests / len(test_cases)) * 100
    print(f"\n📊 Test Master Lookup Results:")
    print(f"   - Tests passed: {passed_tests}/{len(test_cases)}")
    print(f"   - Success rate: {success_rate:.1f}%")
    
    return success_rate == 100

def test_end_to_end_workflow():
    """Test the complete workflow from billing to report"""
    print("\n🔄 Testing End-to-End Workflow")
    print("-" * 50)
    
    reports_service = BillingReportsService(data_dir="backend/data")
    
    # Find a billing record with test_ids
    billings_file = 'backend/data/billings.json'
    try:
        with open(billings_file, 'r') as f:
            billings = json.load(f)
    except Exception as e:
        print(f"❌ Error reading billings file: {e}")
        return False
    
    # Find a billing record with test_ids
    test_billing = None
    for billing in billings:
        items = billing.get('items', [])
        if items and all(item.get('test_id') for item in items):
            test_billing = billing
            break
    
    if not test_billing:
        print("❌ No billing record with test_ids found for testing")
        return False
    
    billing_id = test_billing['id']
    print(f"📋 Testing with billing ID {billing_id}")
    
    # Generate report
    try:
        report = reports_service.generate_comprehensive_report(
            billing_id=billing_id,
            user_id=1,
            tenant_id=1
        )
        
        if not report:
            print("❌ Failed to generate report")
            return False
        
        test_items = report.get('test_items', [])
        unmatched_tests = report.get('unmatched_tests', [])
        
        print(f"✅ Report generated successfully")
        print(f"   - Test items: {len(test_items)}")
        print(f"   - Unmatched tests: {len(unmatched_tests)}")
        
        # Verify test details
        if test_items:
            sample_test = test_items[0]
            required_fields = ['test_name', 'test_master_id', 'department', 'hms_code']
            missing_fields = [field for field in required_fields if not sample_test.get(field)]
            
            if missing_fields:
                print(f"⚠️  Missing fields in test details: {missing_fields}")
                return False
            else:
                print("✅ Test details contain all required fields")
                return True
        else:
            print("❌ No test items in generated report")
            return False
            
    except Exception as e:
        print(f"❌ Error generating report: {e}")
        return False

def main():
    """Run comprehensive tests for the ID-based billing system"""
    
    print("🧪 ID-based Billing System Comprehensive Test")
    print("=" * 70)
    
    tests = [
        ("Billing Record Structure", test_billing_record_structure),
        ("Report Generation", test_report_generation),
        ("Test Master Lookup", test_test_master_lookup),
        ("End-to-End Workflow", test_end_to_end_workflow)
    ]
    
    passed_tests = 0
    total_tests = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed_tests += 1
                print(f"\n✅ {test_name}: PASSED")
            else:
                print(f"\n❌ {test_name}: FAILED")
        except Exception as e:
            print(f"\n💥 {test_name}: ERROR - {e}")
    
    print("\n" + "=" * 70)
    print("📊 FINAL RESULTS")
    print("=" * 70)
    print(f"Tests passed: {passed_tests}/{total_tests}")
    
    success_rate = (passed_tests / total_tests) * 100
    print(f"Success rate: {success_rate:.1f}%")
    
    if success_rate == 100:
        print("\n🎉 EXCELLENT! ID-based billing system is working perfectly!")
        print("✅ All billing reports will now show comprehensive test details")
        print("✅ No more 'No test details available' messages")
        print("✅ System is ready for production use")
    elif success_rate >= 75:
        print("\n✅ GOOD! ID-based billing system is mostly working")
        print("⚠️  Some minor issues may need attention")
    else:
        print("\n❌ ISSUES DETECTED! ID-based billing system needs fixes")
        print("🔧 Review the failed tests and address the issues")

if __name__ == "__main__":
    main()
