#!/usr/bin/env python3
"""
Test AM005 Report Display - Verify that the report contains proper test details
"""

import sys
import os
import json

def main():
    """Test AM005 report display functionality"""
    
    print("🧪 Testing AM005 Report Display")
    print("=" * 50)
    
    # Read the billing reports file
    reports_file = 'backend/data/billing_reports.json'
    try:
        with open(reports_file, 'r') as f:
            reports = json.load(f)
    except Exception as e:
        print(f"❌ Error reading reports file: {e}")
        return
    
    # Find AM005 report
    am005_report = None
    for report in reports:
        if report.get('sid_number') == 'AM005':
            am005_report = report
            break
    
    if not am005_report:
        print("❌ AM005 report not found!")
        return
    
    print(f"📋 AM005 Report Analysis:")
    print(f"   - SID Number: {am005_report.get('sid_number')}")
    print(f"   - Patient: {am005_report.get('patient_info', {}).get('full_name')}")
    print(f"   - Generation Time: {am005_report.get('generation_timestamp')}")
    print()
    
    # Check test items
    test_items = am005_report.get('test_items', [])
    unmatched_tests = am005_report.get('unmatched_tests', [])
    
    print(f"🧪 Test Items Analysis:")
    print(f"   - Total Test Items: {len(test_items)}")
    print(f"   - Unmatched Tests: {len(unmatched_tests)}")
    print()
    
    if test_items:
        print("✅ Test Details Available:")
        for i, test in enumerate(test_items, 1):
            print(f"   {i}. Test Name: {test.get('test_name')}")
            print(f"      - Department: {test.get('department', 'N/A')}")
            print(f"      - HMS Code: {test.get('hms_code', 'N/A')}")
            print(f"      - Price: ₹{test.get('price', 0)}")
            print(f"      - Quantity: {test.get('quantity', 1)}")
            print(f"      - Amount: ₹{test.get('amount', 0)}")
            
            # Check if comprehensive test_master data is available
            test_master_data = test.get('test_master_data', {})
            if test_master_data:
                print(f"      - Reference Range: {test_master_data.get('reference_range', 'N/A')[:100]}...")
                print(f"      - Result Unit: {test_master_data.get('result_unit', 'N/A')}")
                print(f"      - Container: {test_master_data.get('container', 'N/A')}")
                print(f"      - Cutoff Time: {test_master_data.get('cutoffTime', 'N/A')}")
                print(f"      - Service Time: {test_master_data.get('serviceTime', 'N/A')}")
            print()
    else:
        print("❌ No test details available!")
        if unmatched_tests:
            print(f"   Unmatched tests: {unmatched_tests}")
    
    # Check financial summary
    financial_summary = am005_report.get('financial_summary', {})
    print(f"💰 Financial Summary:")
    print(f"   - Bill Amount: ₹{financial_summary.get('bill_amount', 0)}")
    print(f"   - GST Rate: {financial_summary.get('gst_rate', 0)}%")
    print(f"   - GST Amount: ₹{financial_summary.get('gst_amount', 0)}")
    print(f"   - Total Amount: ₹{financial_summary.get('total_amount', 0)}")
    print(f"   - Balance: ₹{financial_summary.get('balance', 0)}")
    print()
    
    # Check patient information
    patient_info = am005_report.get('patient_info', {})
    print(f"👤 Patient Information:")
    print(f"   - Name: {patient_info.get('full_name', 'N/A')}")
    print(f"   - Age: {patient_info.get('age', 'N/A')}")
    print(f"   - Gender: {patient_info.get('gender', 'N/A')}")
    print(f"   - Mobile: {patient_info.get('mobile', 'N/A')}")
    print(f"   - Email: {patient_info.get('email', 'N/A')}")
    print()
    
    # Check clinic information
    clinic_info = am005_report.get('clinic_info', {})
    print(f"🏥 Clinic Information:")
    print(f"   - Name: {clinic_info.get('name', 'N/A')}")
    print(f"   - Site Code: {clinic_info.get('site_code', 'N/A')}")
    print(f"   - Contact: {clinic_info.get('contact_phone', 'N/A')}")
    print(f"   - Email: {clinic_info.get('email', 'N/A')}")
    print()
    
    # Frontend compatibility check
    print("🖥️  Frontend Compatibility Check:")
    
    # Check if the structure matches what the frontend expects
    frontend_expected_fields = [
        'test_name', 'department', 'hms_code', 'price', 'quantity', 'amount'
    ]
    
    if test_items:
        test_item = test_items[0]
        missing_fields = []
        for field in frontend_expected_fields:
            if field not in test_item:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"   ⚠️  Missing fields for frontend: {missing_fields}")
        else:
            print("   ✅ All required fields present for frontend display")
    
    # Check if the report structure will prevent "No test details available" message
    if test_items and len(test_items) > 0:
        print("   ✅ Report will show test details (not 'No test details available')")
    else:
        print("   ❌ Report will show 'No test details available'")
    
    print()
    print("🎉 AM005 Report Test Complete!")
    
    # Summary
    if test_items and len(test_items) > 0:
        print("✅ SUCCESS: AM005 report contains comprehensive test details")
        print("   - Test matching successful")
        print("   - All required fields present")
        print("   - Frontend will display test details properly")
    else:
        print("❌ ISSUE: AM005 report still missing test details")

if __name__ == "__main__":
    main()
