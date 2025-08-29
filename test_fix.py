#!/usr/bin/env python3
"""
Test script to verify the TypeError fix for admin analytics dashboard
"""

import sys
import os
import json

# Add backend to path
sys.path.append('backend')

def safe_float(value, default=0):
    """Safely convert value to float, handling strings and None"""
    try:
        if value is None or value == '':
            return default
        return float(value)
    except (ValueError, TypeError):
        return default

def test_billing_data_types():
    """Test the billing data for type inconsistencies"""
    print("Testing billing data for type inconsistencies...")
    
    try:
        # Read billing data
        with open('backend/data/billings.json', 'r') as f:
            billings = json.load(f)
        
        print(f"Total billing records: {len(billings)}")
        
        # Check for string total_amount values
        string_total_amounts = []
        string_discounts = []
        
        for i, billing in enumerate(billings):
            total_amount = billing.get('total_amount')
            discount = billing.get('discount')
            
            if isinstance(total_amount, str):
                string_total_amounts.append((i, billing.get('id'), total_amount))
            
            if isinstance(discount, str):
                string_discounts.append((i, billing.get('id'), discount))
        
        print(f"Found {len(string_total_amounts)} records with string total_amount:")
        for idx, bill_id, value in string_total_amounts[:5]:  # Show first 5
            print(f"  Record {idx}, ID {bill_id}: total_amount = '{value}'")
        
        print(f"Found {len(string_discounts)} records with string discount:")
        for idx, bill_id, value in string_discounts[:5]:  # Show first 5
            print(f"  Record {idx}, ID {bill_id}: discount = '{value}'")
        
        # Test safe_float conversion
        print("\nTesting safe_float conversion:")
        test_values = ["147", "801", "209", "", None, 123.45, "abc"]
        for val in test_values:
            converted = safe_float(val)
            print(f"  safe_float({repr(val)}) = {converted}")
        
        # Test revenue calculation with safe_float
        print("\nTesting revenue calculation with safe_float:")
        total_revenue = sum(safe_float(b.get('total_amount', 0)) for b in billings)
        print(f"Total revenue (with safe_float): {total_revenue}")
        
        # Test without safe_float to see if it would fail
        try:
            total_revenue_unsafe = sum(b.get('total_amount', 0) for b in billings)
            print(f"Total revenue (without safe_float): {total_revenue_unsafe}")
        except TypeError as e:
            print(f"TypeError without safe_float: {e}")
        
        return True
        
    except Exception as e:
        print(f"Error testing billing data: {e}")
        return False

def test_admin_analytics_logic():
    """Test the admin analytics calculation logic"""
    print("\n" + "="*50)
    print("Testing admin analytics calculation logic...")
    
    try:
        from utils import read_data
        from datetime import datetime
        
        # Read data
        billings = read_data('billings.json')
        
        # Test monthly revenue calculation
        current_month = datetime.now().strftime('%Y-%m')
        monthly_revenue = sum(
            safe_float(b.get('total_amount', 0))
            for b in billings
            if b.get('invoice_date', '').startswith(current_month)
        )
        
        print(f"Current month ({current_month}) revenue: {monthly_revenue}")
        
        # Test daily trends calculation
        from datetime import timedelta
        last_7_days = [(datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(6, -1, -1)]
        
        daily_trends = []
        for date in last_7_days:
            day_revenue = sum(safe_float(b.get('total_amount', 0)) for b in billings if b.get('invoice_date', '').startswith(date))
            daily_trends.append({
                'date': date,
                'revenue': day_revenue
            })
        
        print("Daily revenue trends (last 7 days):")
        for trend in daily_trends:
            print(f"  {trend['date']}: {trend['revenue']}")
        
        return True
        
    except Exception as e:
        print(f"Error testing admin analytics logic: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("AVINIRS TypeError Fix Test")
    print("="*50)
    
    success1 = test_billing_data_types()
    success2 = test_admin_analytics_logic()
    
    if success1 and success2:
        print("\n✅ All tests passed! The TypeError fix should work.")
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
