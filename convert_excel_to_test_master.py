#!/usr/bin/env python3
"""
Script to convert dynamic_data_fetch_with_prices_v3.xlsx to test_master.json format
"""

import pandas as pd
import json
from datetime import datetime
import os

def clean_value(value):
    """Clean and convert values from Excel"""
    if pd.isna(value):
        return ""
    if isinstance(value, str):
        return value.strip()
    return value

def convert_excel_to_test_master():
    """Convert Excel data to test_master.json format"""
    
    # Read the Excel file
    print("Reading Excel file...")
    df = pd.read_excel('dynamic_data_fetch_with_prices_v3.xlsx')
    
    print(f"Found {len(df)} rows in Excel file")
    print(f"Columns: {df.columns.tolist()}")
    
    # Create test master data
    test_master_data = []
    
    # Department mapping for common departments
    department_mapping = {
        'IMMUNOLOGY': 'Immunology',
        'BIOCHEMISTRY': 'Biochemistry', 
        'HEMATOLOGY': 'Hematology',
        'MICROBIOLOGY': 'Microbiology',
        'PATHOLOGY': 'Pathology',
        'CARDIOLOGY': 'Cardiology',
        'ENDOCRINOLOGY': 'Endocrinology',
        'RADIOLOGY': 'Radiology'
    }
    
    current_time = datetime.now().isoformat()
    
    for index, row in df.iterrows():
        # Skip rows with empty test names
        test_name = clean_value(row.get('Test Name', ''))
        if not test_name:
            continue
            
        # Extract data from Excel columns
        code = clean_value(row.get('code', ''))
        department = clean_value(row.get('Department', ''))
        notes = clean_value(row.get('Notes', ''))
        reference_range = clean_value(row.get('Referance Range', ''))  # Note: typo in Excel
        result_unit = clean_value(row.get('Result Unit', ''))
        decimals = row.get('No of decimals', 0)
        test_price = row.get('Test Price', 0)
        
        # Convert department to proper format
        department_name = department_mapping.get(department.upper(), department)
        
        # Handle decimals
        if pd.isna(decimals):
            decimals = 0
        else:
            decimals = int(decimals)
            
        # Handle test price
        if pd.isna(test_price):
            test_price = 0
        else:
            test_price = float(test_price)
        
        # Create test master entry
        test_entry = {
            "id": index + 1,
            "department": department_name,
            "testName": test_name,
            "emrClassification": "test",
            "shortName": test_name[:20] if len(test_name) > 20 else test_name,
            "displayName": test_name,
            "hmsCode": str(code) if code else "",
            "internationalCode": str(code) if code else "",
            "method": "",
            "primarySpecimen": "",
            "specimen": "",
            "container": "",
            "interpretation": notes if notes else "",
            "instructions": notes if notes else "",
            "specialReport": "",
            "reportName": test_name,
            "subTests": [],
            "unacceptableConditions": "",
            "minSampleQty": "",
            "cutoffTime": "",
            "testSuffix": "",
            "suffixDesc": "",
            "minProcessTime": 0,
            "minProcessPeriod": "",
            "emergencyProcessTime": 0,
            "emergencyProcessPeriod": "",
            "expiryTime": 0,
            "expiryPeriod": "",
            "serviceTime": "",
            "applicableTo": "both",
            "reportingDays": 0,
            "testDoneOn": {
                "sun": False,
                "mon": True,
                "tue": True,
                "wed": True,
                "thu": True,
                "fri": True,
                "sat": False
            },
            "alertSMS": False,
            "alertPeriod": "",
            "alertMessage": "",
            "options": {
                "noSale": False,
                "inactive": False,
                "noBarCode": False,
                "allowDiscount": True,
                "hideOnlineReport": False,
                "noDiscount": False,
                "allowModifySpecimen": False,
                "editComment": False,
                "accreditedTest": False,
                "preferDoctor": False,
                "appointment": False,
                "allowNegative": False,
                "onlineRegistration": True,
                "automatedService": False,
                "allowIncreaseAmount": False,
                "noHouseVisit": False,
                "editBill": False,
                "noResult": False,
                "allowComma": False,
                "autoAuthorise": False,
                "isCovid": False,
                "noLoyalty": False,
                "outsourced": False,
                "editQuantity": False,
                "attachServiceDoctor": False,
                "noSMS": False,
                "noMembershipDiscount": False,
                "noAppDiscount": False,
                "printInsideBox": False
            },
            "is_active": True,
            "created_at": current_time,
            "updated_at": current_time,
            "created_by": 1,
            # Additional fields for billing integration
            "test_price": test_price,
            "test_profile": test_name,
            "reference_range": reference_range,
            "result_unit": result_unit,
            "decimals": decimals
        }
        
        test_master_data.append(test_entry)
    
    return test_master_data

def backup_existing_file():
    """Create backup of existing test_master.json"""
    backup_path = 'backend/data/test_master_backup.json'
    original_path = 'backend/data/test_master.json'
    
    if os.path.exists(original_path):
        print(f"Creating backup at {backup_path}")
        with open(original_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print("Backup created successfully")

def main():
    """Main function"""
    try:
        # Create backup
        backup_existing_file()
        
        # Convert Excel to test master format
        test_master_data = convert_excel_to_test_master()
        
        print(f"Converted {len(test_master_data)} test entries")
        
        # Write to test_master.json
        output_path = 'backend/data/test_master.json'
        print(f"Writing to {output_path}")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(test_master_data, f, indent=2, ensure_ascii=False)
        
        print("Successfully updated test_master.json")
        
        # Print summary
        departments = set(entry['department'] for entry in test_master_data)
        print(f"\nSummary:")
        print(f"- Total tests: {len(test_master_data)}")
        print(f"- Departments: {', '.join(sorted(departments))}")
        print(f"- Price range: ₹{min(entry['test_price'] for entry in test_master_data):.2f} - ₹{max(entry['test_price'] for entry in test_master_data):.2f}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
