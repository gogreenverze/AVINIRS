#!/usr/bin/env python3
"""
Migrate Billing Records to Test IDs
One-time migration script to add test_master IDs to existing billing records
"""

import sys
import os
import json
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.billing_reports_service import BillingReportsService

def main():
    """Migrate existing billing records to include test_master IDs"""
    
    print("🔄 Migrating Billing Records to Test IDs")
    print("=" * 60)
    
    # Initialize services
    reports_service = BillingReportsService(data_dir="backend/data")
    
    # Read billing records
    billings_file = 'backend/data/billings.json'
    try:
        with open(billings_file, 'r') as f:
            billings = json.load(f)
    except Exception as e:
        print(f"❌ Error reading billings file: {e}")
        return
    
    print(f"📊 Found {len(billings)} billing records to process")
    print()
    
    # Statistics
    total_records = len(billings)
    updated_records = 0
    total_items = 0
    matched_items = 0
    unmatched_items = 0
    
    # Process each billing record
    for i, billing in enumerate(billings, 1):
        billing_id = billing.get('id')
        invoice_number = billing.get('invoice_number', f'Record-{i}')
        items = billing.get('items', [])
        
        print(f"📋 Processing {invoice_number} (ID: {billing_id}) - {len(items)} items")
        
        record_updated = False
        
        # Process each item in the billing record
        for j, item in enumerate(items):
            total_items += 1
            
            # Check if item already has test_id
            if item.get('test_id'):
                print(f"   ✅ Item {j+1}: Already has test_id {item['test_id']}")
                matched_items += 1
                continue
            
            # Get test name
            test_name = item.get('test_name', '') or item.get('testName', '')
            
            if not test_name:
                print(f"   ⚠️  Item {j+1}: No test name found")
                unmatched_items += 1
                continue
            
            # Try to match with test_master
            matched_test = reports_service.match_test_in_master(test_name)
            
            if matched_test:
                # Add test_id to the item
                item['test_id'] = matched_test.get('id')
                # Ensure consistent naming
                item['test_name'] = matched_test.get('testName')
                # Remove testName if it exists to standardize
                if 'testName' in item:
                    del item['testName']
                
                print(f"   ✅ Item {j+1}: '{test_name}' -> ID {matched_test.get('id')} ('{matched_test.get('testName')}')")
                matched_items += 1
                record_updated = True
            else:
                print(f"   ❌ Item {j+1}: '{test_name}' -> No match found")
                unmatched_items += 1
        
        if record_updated:
            updated_records += 1
        
        print()
    
    # Save updated billing records
    try:
        # Create backup first
        backup_file = f'backend/data/billings_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        with open(backup_file, 'w') as f:
            json.dump(billings, f, indent=2)
        print(f"📁 Created backup: {backup_file}")
        
        # Save updated records
        with open(billings_file, 'w') as f:
            json.dump(billings, f, indent=2)
        print(f"✅ Updated billing records saved to {billings_file}")
        
    except Exception as e:
        print(f"❌ Error saving updated records: {e}")
        return
    
    # Print summary
    print()
    print("📈 Migration Summary:")
    print(f"   - Total billing records: {total_records}")
    print(f"   - Records updated: {updated_records}")
    print(f"   - Total test items: {total_items}")
    print(f"   - Items matched: {matched_items}")
    print(f"   - Items unmatched: {unmatched_items}")
    
    if total_items > 0:
        match_rate = (matched_items / total_items) * 100
        print(f"   - Match rate: {match_rate:.1f}%")
    
    print()
    if unmatched_items == 0:
        print("🎉 Migration Complete! All test items now have test_master IDs.")
    elif matched_items > unmatched_items:
        print("✅ Migration mostly successful. Some items may need manual review.")
    else:
        print("⚠️  Many items remain unmatched. Manual review recommended.")
    
    print()
    print("🔄 Next Steps:")
    print("   1. Review unmatched items and update test_master if needed")
    print("   2. Regenerate billing reports to use the new ID-based system")
    print("   3. Update frontend to use test_master IDs for new billing entries")

if __name__ == "__main__":
    main()
