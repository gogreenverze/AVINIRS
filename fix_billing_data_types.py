#!/usr/bin/env python3
"""
Data cleanup script to fix type inconsistencies in billing data
This script will convert string numeric values to proper numeric types
"""

import json
import os
from datetime import datetime

def safe_float(value, default=0):
    """Safely convert value to float, handling strings and None"""
    try:
        if value is None or value == '':
            return default
        return float(value)
    except (ValueError, TypeError):
        return default

def fix_billing_data():
    """Fix type inconsistencies in billing data"""
    billing_file = 'backend/data/billings.json'
    backup_file = f'backend/data/billings_backup_before_type_fix_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    
    print("Fixing billing data type inconsistencies...")
    
    try:
        # Read current billing data
        with open(billing_file, 'r') as f:
            billings = json.load(f)
        
        print(f"Total billing records: {len(billings)}")
        
        # Create backup
        with open(backup_file, 'w') as f:
            json.dump(billings, f, indent=2)
        print(f"Backup created: {backup_file}")
        
        # Track changes
        changes_made = 0
        
        # Fix each billing record
        for i, billing in enumerate(billings):
            record_changed = False
            
            # Fix numeric fields that might be strings
            numeric_fields = [
                'total_amount', 'paid_amount', 'balance', 'subtotal', 
                'discount', 'tax', 'gst_amount', 'tax_amount', 'net_amount',
                'bill_amount', 'other_charges'
            ]
            
            for field in numeric_fields:
                if field in billing:
                    original_value = billing[field]
                    if isinstance(original_value, str) and original_value != '':
                        try:
                            # Convert string to float
                            new_value = float(original_value)
                            billing[field] = new_value
                            print(f"  Record {i+1} (ID {billing.get('id')}): {field} '{original_value}' -> {new_value}")
                            record_changed = True
                        except ValueError:
                            # If conversion fails, set to 0
                            billing[field] = 0
                            print(f"  Record {i+1} (ID {billing.get('id')}): {field} '{original_value}' -> 0 (invalid value)")
                            record_changed = True
                    elif original_value == '':
                        # Convert empty string to 0
                        billing[field] = 0
                        print(f"  Record {i+1} (ID {billing.get('id')}): {field} '' -> 0")
                        record_changed = True
            
            # Fix items array if it exists
            if 'items' in billing and isinstance(billing['items'], list):
                for j, item in enumerate(billing['items']):
                    item_numeric_fields = ['price', 'amount', 'total', 'quantity']
                    for field in item_numeric_fields:
                        if field in item:
                            original_value = item[field]
                            if isinstance(original_value, str) and original_value != '':
                                try:
                                    new_value = float(original_value)
                                    item[field] = new_value
                                    print(f"  Record {i+1} (ID {billing.get('id')}) Item {j+1}: {field} '{original_value}' -> {new_value}")
                                    record_changed = True
                                except ValueError:
                                    item[field] = 0
                                    print(f"  Record {i+1} (ID {billing.get('id')}) Item {j+1}: {field} '{original_value}' -> 0 (invalid)")
                                    record_changed = True
                            elif original_value == '':
                                item[field] = 0
                                print(f"  Record {i+1} (ID {billing.get('id')}) Item {j+1}: {field} '' -> 0")
                                record_changed = True
            
            # Fix test_items array if it exists
            if 'test_items' in billing and isinstance(billing['test_items'], list):
                for j, item in enumerate(billing['test_items']):
                    item_numeric_fields = ['price', 'amount', 'total', 'quantity']
                    for field in item_numeric_fields:
                        if field in item:
                            original_value = item[field]
                            if isinstance(original_value, str) and original_value != '':
                                try:
                                    new_value = float(original_value)
                                    item[field] = new_value
                                    print(f"  Record {i+1} (ID {billing.get('id')}) Test Item {j+1}: {field} '{original_value}' -> {new_value}")
                                    record_changed = True
                                except ValueError:
                                    item[field] = 0
                                    print(f"  Record {i+1} (ID {billing.get('id')}) Test Item {j+1}: {field} '{original_value}' -> 0 (invalid)")
                                    record_changed = True
                            elif original_value == '':
                                item[field] = 0
                                print(f"  Record {i+1} (ID {billing.get('id')}) Test Item {j+1}: {field} '' -> 0")
                                record_changed = True
            
            if record_changed:
                changes_made += 1
        
        # Save the fixed data
        with open(billing_file, 'w') as f:
            json.dump(billings, f, indent=2)
        
        print(f"\n✅ Data cleanup completed!")
        print(f"Records modified: {changes_made}")
        print(f"Backup saved as: {backup_file}")
        
        # Verify the fix
        print("\nVerifying the fix...")
        total_revenue = sum(safe_float(b.get('total_amount', 0)) for b in billings)
        print(f"Total revenue calculation successful: {total_revenue}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error fixing billing data: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("AVINIRS Billing Data Type Fix")
    print("="*50)
    
    success = fix_billing_data()
    
    if success:
        print("\n✅ Billing data types fixed successfully!")
        print("The TypeError in admin analytics should now be resolved.")
    else:
        print("\n❌ Failed to fix billing data types.")
