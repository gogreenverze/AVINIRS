#!/usr/bin/env python3
"""
Update test_master table with Excel data and show complete records
"""
import pandas as pd
import json
from datetime import datetime
import uuid

def load_excel_data():
    """Load all data from Excel file"""
    excel_file = 'dynamic_data_fetch_with_prices_v3.xlsx'
    xl_file = pd.ExcelFile(excel_file)
    
    all_data = []
    
    # Field mapping
    field_mapping = {
        'Test Name': 'testName',
        'code': 'hmsCode',
        'Code': 'hmsCode',
        'Department': 'department',
        'Notes': 'instructions',
        'Referance Range': 'reference_range',
        'Reference Range': 'reference_range',
        'Result Unit': 'result_unit',
        'Result unit': 'result_unit',
        'No of decimals': 'decimals',
        'No. of Decimals': 'decimals',
        'Test Price': 'test_price',
        'Critical Low': 'critical_low',
        'Critical High': 'critical_high'
    }
    
    for sheet_name in xl_file.sheet_names:
        try:
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            print(f"Processing {sheet_name}: {len(df)} records")
            
            for _, row in df.iterrows():
                # Skip empty rows
                if pd.isna(row.get('Test Name', '')):
                    continue
                
                # Create new record with all test_master fields
                record = {
                    'id': len(all_data) + 1,
                    'testName': '',
                    'hmsCode': '',
                    'department': sheet_name,  # Use sheet name as department
                    'instructions': '',
                    'reference_range': '',
                    'result_unit': '',
                    'decimals': 1,
                    'test_price': 0,
                    'critical_low': None,
                    'critical_high': None,
                    
                    # Existing test_master fields with default values
                    'alertMessage': '',
                    'alertPeriod': '',
                    'alertSMS': False,
                    'applicableTo': 'All',
                    'container': 'Serum',
                    'created_at': datetime.now().isoformat(),
                    'created_by': 'excel_import',
                    'cutoffTime': '10:00 AM',
                    'displayName': '',
                    'emergencyProcessPeriod': 'Hours',
                    'emergencyProcessTime': 2,
                    'emrClassification': 'Laboratory',
                    'expiryPeriod': 'Days',
                    'expiryTime': 7,
                    'internationalCode': '',
                    'interpretation': '',
                    'is_active': True,
                    'method': 'Automated',
                    'minProcessPeriod': 'Hours',
                    'minProcessTime': 4,
                    'minSampleQty': '2ml',
                    'options': {},
                    'primarySpecimen': 'Serum',
                    'reportName': '',
                    'reportingDays': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    'serviceTime': '24 Hours',
                    'shortName': '',
                    'specialReport': '',
                    'specimen': ['Serum', 'Plasma'],
                    'subTests': [],
                    'suffixDesc': '',
                    'testDoneOn': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    'testSuffix': '',
                    'test_profile': '',
                    'unacceptableConditions': ['Hemolyzed', 'Lipemic'],
                    'updated_at': datetime.now().isoformat()
                }
                
                # Map Excel data to test_master fields
                for excel_field, test_master_field in field_mapping.items():
                    if excel_field in row.index and not pd.isna(row[excel_field]):
                        value = row[excel_field]
                        
                        # Handle specific field types
                        if test_master_field == 'decimals':
                            try:
                                record[test_master_field] = int(float(value))
                            except:
                                record[test_master_field] = 1
                        elif test_master_field == 'test_price':
                            try:
                                record[test_master_field] = float(value)
                            except:
                                record[test_master_field] = 0
                        elif test_master_field in ['critical_low', 'critical_high']:
                            try:
                                record[test_master_field] = float(value)
                            except:
                                record[test_master_field] = None
                        else:
                            record[test_master_field] = str(value).strip()
                
                # Set derived fields
                test_name = record['testName']
                record['displayName'] = test_name
                record['reportName'] = test_name
                record['shortName'] = test_name[:20] if len(test_name) > 20 else test_name
                
                # Set department-specific defaults
                if sheet_name == 'IMMUNOLOGY':
                    record['container'] = 'Serum'
                    record['primarySpecimen'] = 'Serum'
                    record['specimen'] = ['Serum']
                elif sheet_name == 'HAEMATOLOGY':
                    record['container'] = 'EDTA'
                    record['primarySpecimen'] = 'Whole Blood'
                    record['specimen'] = ['Whole Blood']
                elif sheet_name == 'MICROBIOLOGY':
                    record['container'] = 'Sterile Container'
                    record['primarySpecimen'] = 'Various'
                    record['specimen'] = ['Urine', 'Sputum', 'Blood', 'CSF']
                elif sheet_name == 'BioChemistry':
                    record['container'] = 'Serum'
                    record['primarySpecimen'] = 'Serum'
                    record['specimen'] = ['Serum', 'Plasma']
                
                all_data.append(record)
                
        except Exception as e:
            print(f"Error processing {sheet_name}: {e}")
    
    return all_data

def save_updated_test_master(data):
    """Save updated test_master data"""
    try:
        # Backup original file
        with open('backend/data/test_master.json', 'r', encoding='utf-8') as f:
            original_data = json.load(f)
        
        with open('backend/data/test_master_backup.json', 'w', encoding='utf-8') as f:
            json.dump(original_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Backup created: test_master_backup.json")
        
        # Save new data
        with open('backend/data/test_master.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Updated test_master.json with {len(data)} records")
        
    except Exception as e:
        print(f"❌ Error saving data: {e}")

def show_complete_records(data):
    """Show records with all important fields populated"""
    print("\n" + "=" * 120)
    print("SAMPLE RECORDS WITH ALL FIELDS POPULATED")
    print("=" * 120)
    
    # Find records with most fields populated
    complete_records = []
    
    for record in data:
        # Count non-null, non-empty fields
        populated_fields = 0
        for key, value in record.items():
            if value is not None and value != '' and value != [] and value != {}:
                populated_fields += 1
        
        if populated_fields >= 25:  # Records with at least 25 populated fields
            complete_records.append((record, populated_fields))
    
    # Sort by most populated fields
    complete_records.sort(key=lambda x: x[1], reverse=True)
    
    # Show top 3 most complete records
    for i, (record, field_count) in enumerate(complete_records[:3], 1):
        print(f"\n{'='*80}")
        print(f"RECORD {i} - {field_count} fields populated")
        print(f"{'='*80}")
        
        # Show all fields
        for key, value in record.items():
            if value is not None and value != '' and value != [] and value != {}:
                if isinstance(value, str) and len(value) > 100:
                    display_value = value[:97] + "..."
                else:
                    display_value = value
                print(f"{key:25}: {display_value}")
        
        print("-" * 80)

def show_statistics(data):
    """Show statistics about the updated data"""
    print("\n" + "=" * 80)
    print("UPDATE STATISTICS")
    print("=" * 80)
    
    # Department distribution
    dept_count = {}
    for record in data:
        dept = record.get('department', 'Unknown')
        dept_count[dept] = dept_count.get(dept, 0) + 1
    
    print("Records by Department:")
    for dept, count in dept_count.items():
        print(f"  {dept}: {count} tests")
    
    # Price statistics
    prices = [record.get('test_price', 0) for record in data if record.get('test_price', 0) > 0]
    if prices:
        print(f"\nPrice Statistics:")
        print(f"  Total tests with prices: {len(prices)}")
        print(f"  Price range: ₹{min(prices)} - ₹{max(prices)}")
        print(f"  Average price: ₹{sum(prices)/len(prices):.2f}")
    
    # Critical values
    critical_low_count = len([r for r in data if r.get('critical_low') is not None])
    critical_high_count = len([r for r in data if r.get('critical_high') is not None])
    
    print(f"\nCritical Values:")
    print(f"  Tests with Critical Low: {critical_low_count}")
    print(f"  Tests with Critical High: {critical_high_count}")
    
    print(f"\nTotal Records: {len(data)}")
    print(f"Total Fields per Record: 47")

def main():
    """Main function"""
    print("Starting test_master update with Excel data...")
    
    # Load Excel data
    excel_data = load_excel_data()
    if not excel_data:
        print("❌ No data loaded from Excel")
        return
    
    # Save updated data
    save_updated_test_master(excel_data)
    
    # Show statistics
    show_statistics(excel_data)
    
    # Show complete records
    show_complete_records(excel_data)
    
    print(f"\n✅ Test master successfully updated!")
    print(f"✅ Backup saved as: test_master_backup.json")
    print(f"✅ New test_master.json has {len(excel_data)} records with 47 fields each")

if __name__ == "__main__":
    main()
