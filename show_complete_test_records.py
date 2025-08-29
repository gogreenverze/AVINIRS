#!/usr/bin/env python3
"""
Show complete test_master records with all 47 fields
"""
import json

def show_all_fields():
    """Show complete records with all 47 fields"""
    try:
        with open('backend/data/test_master.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print("=" * 120)
        print("COMPLETE TEST_MASTER RECORDS - ALL 47 FIELDS")
        print("=" * 120)
        print(f"Total Records: {len(data)}")
        
        # Show first 3 complete records
        for i, record in enumerate(data[:3], 1):
            print(f"\n{'='*100}")
            print(f"RECORD {i}: {record.get('testName', 'Unknown Test')}")
            print(f"{'='*100}")
            
            # Group fields by category for better readability
            categories = {
                'Basic Info': ['id', 'testName', 'displayName', 'shortName', 'reportName'],
                'Classification': ['department', 'hmsCode', 'internationalCode', 'emrClassification'],
                'Clinical Data': ['reference_range', 'result_unit', 'decimals', 'instructions', 'interpretation'],
                'Pricing & Critical': ['test_price', 'critical_low', 'critical_high'],
                'Specimen Info': ['primarySpecimen', 'specimen', 'container', 'minSampleQty', 'unacceptableConditions'],
                'Workflow': ['testDoneOn', 'reportingDays', 'serviceTime', 'cutoffTime'],
                'Processing': ['method', 'minProcessTime', 'minProcessPeriod', 'emergencyProcessTime', 'emergencyProcessPeriod'],
                'Expiry & Storage': ['expiryTime', 'expiryPeriod'],
                'Alerts': ['alertSMS', 'alertMessage', 'alertPeriod'],
                'Advanced': ['test_profile', 'subTests', 'testSuffix', 'suffixDesc', 'specialReport', 'options'],
                'Applicability': ['applicableTo'],
                'Status': ['is_active'],
                'Metadata': ['created_at', 'created_by', 'updated_at']
            }
            
            for category, fields in categories.items():
                print(f"\n{category}:")
                print("-" * 50)
                for field in fields:
                    value = record.get(field, 'N/A')
                    if isinstance(value, str) and len(value) > 80:
                        display_value = value[:77] + "..."
                    elif isinstance(value, list) and len(value) > 0:
                        display_value = f"[{len(value)} items]: {', '.join(map(str, value[:3]))}" + ("..." if len(value) > 3 else "")
                    elif isinstance(value, dict):
                        display_value = f"{{dict with {len(value)} keys}}"
                    else:
                        display_value = value
                    
                    print(f"  {field:25}: {display_value}")
        
        # Show field statistics
        print(f"\n{'='*100}")
        print("FIELD STATISTICS")
        print(f"{'='*100}")
        
        field_stats = {}
        for record in data:
            for field, value in record.items():
                if field not in field_stats:
                    field_stats[field] = {'populated': 0, 'empty': 0}
                
                if value is not None and value != '' and value != [] and value != {}:
                    field_stats[field]['populated'] += 1
                else:
                    field_stats[field]['empty'] += 1
        
        print(f"{'Field Name':<25} | {'Populated':<10} | {'Empty':<10} | {'Fill Rate':<10}")
        print("-" * 70)
        
        for field, stats in sorted(field_stats.items()):
            total = stats['populated'] + stats['empty']
            fill_rate = (stats['populated'] / total * 100) if total > 0 else 0
            print(f"{field:<25} | {stats['populated']:<10} | {stats['empty']:<10} | {fill_rate:>7.1f}%")
        
        # Show department-wise distribution
        print(f"\n{'='*100}")
        print("DEPARTMENT-WISE DISTRIBUTION")
        print(f"{'='*100}")
        
        dept_stats = {}
        for record in data:
            dept = record.get('department', 'Unknown')
            if dept not in dept_stats:
                dept_stats[dept] = {'count': 0, 'total_price': 0, 'avg_price': 0}
            
            dept_stats[dept]['count'] += 1
            price = record.get('test_price', 0)
            if isinstance(price, (int, float)) and price > 0:
                dept_stats[dept]['total_price'] += price
        
        for dept, stats in dept_stats.items():
            if stats['count'] > 0:
                stats['avg_price'] = stats['total_price'] / stats['count']
        
        print(f"{'Department':<20} | {'Tests':<8} | {'Avg Price':<12}")
        print("-" * 45)
        for dept, stats in sorted(dept_stats.items()):
            print(f"{dept:<20} | {stats['count']:<8} | ₹{stats['avg_price']:>9.2f}")
        
        return data
        
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

def main():
    """Main function"""
    show_all_fields()

if __name__ == "__main__":
    main()
