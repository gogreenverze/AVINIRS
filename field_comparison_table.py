#!/usr/bin/env python3
"""
Create a clear comparison table between Excel fields and test_master fields
"""
import pandas as pd
import json

def load_excel_fields():
    """Load all unique field names from Excel file"""
    excel_file = 'dynamic_data_fetch_with_prices_v3.xlsx'
    xl_file = pd.ExcelFile(excel_file)
    
    all_excel_fields = set()
    sheet_field_mapping = {}
    
    for sheet_name in xl_file.sheet_names:
        try:
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            sheet_fields = list(df.columns)
            sheet_field_mapping[sheet_name] = sheet_fields
            all_excel_fields.update(sheet_fields)
        except Exception as e:
            print(f"Error reading {sheet_name}: {e}")
    
    return sorted(list(all_excel_fields)), sheet_field_mapping

def load_test_master_fields():
    """Load test_master field names"""
    try:
        with open('backend/data/test_master.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        all_fields = set()
        for record in data:
            all_fields.update(record.keys())
        
        return sorted(list(all_fields))
    except Exception as e:
        print(f"Error loading test_master: {e}")
        return []

def create_field_comparison():
    """Create detailed field comparison"""
    
    print("=" * 100)
    print("EXCEL vs TEST_MASTER FIELD COMPARISON")
    print("=" * 100)
    
    # Load fields
    excel_fields, sheet_mapping = load_excel_fields()
    test_master_fields = load_test_master_fields()
    
    # Show which sheets have which fields
    print("\nFIELD DISTRIBUTION ACROSS EXCEL SHEETS:")
    print("-" * 60)
    
    for sheet_name, fields in sheet_mapping.items():
        print(f"\n{sheet_name} ({len(fields)} fields):")
        for i, field in enumerate(fields, 1):
            print(f"  {i:2d}. {field}")
    
    # Create mapping table
    print(f"\n{'=' * 100}")
    print("FIELD MAPPING TABLE")
    print("=" * 100)
    print(f"{'EXCEL FIELD NAME':<30} | {'TEST_MASTER FIELD NAME':<30} | {'STATUS':<15}")
    print("-" * 100)
    
    # Define the mapping
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
        'Critical Low': 'critical_low',      # NEW FIELD NEEDED
        'Critical High': 'critical_high'     # NEW FIELD NEEDED
    }
    
    # Show mapped fields
    for excel_field in sorted(excel_fields):
        if excel_field in field_mapping:
            test_master_field = field_mapping[excel_field]
            if test_master_field in test_master_fields:
                status = "✅ EXISTS"
            else:
                status = "❌ NEW FIELD"
            print(f"{excel_field:<30} | {test_master_field:<30} | {status:<15}")
        else:
            print(f"{excel_field:<30} | {'??? NEEDS MAPPING':<30} | {'⚠️  UNMAPPED':<15}")
    
    # Show test_master fields that don't have Excel equivalents
    print(f"\n{'=' * 100}")
    print("TEST_MASTER FIELDS WITHOUT EXCEL EQUIVALENTS (WILL BE PRESERVED)")
    print("=" * 100)
    
    mapped_test_master_fields = set(field_mapping.values())
    unmapped_test_master_fields = set(test_master_fields) - mapped_test_master_fields
    
    for i, field in enumerate(sorted(unmapped_test_master_fields), 1):
        print(f"{i:2d}. {field}")
    
    # Summary
    print(f"\n{'=' * 100}")
    print("SUMMARY")
    print("=" * 100)
    print(f"Excel fields: {len(excel_fields)}")
    print(f"Test_master fields: {len(test_master_fields)}")
    print(f"Mapped fields: {len([f for f in excel_fields if f in field_mapping])}")
    print(f"New fields needed: {len([f for f in field_mapping.values() if f not in test_master_fields])}")
    print(f"Preserved test_master fields: {len(unmapped_test_master_fields)}")
    
    # Show the exact mapping for implementation
    print(f"\n{'=' * 100}")
    print("IMPLEMENTATION MAPPING (for code)")
    print("=" * 100)
    print("field_mapping = {")
    for excel_field, test_master_field in field_mapping.items():
        print(f"    '{excel_field}': '{test_master_field}',")
    print("}")
    
    return field_mapping, excel_fields, test_master_fields

def main():
    """Main function"""
    create_field_comparison()

if __name__ == "__main__":
    main()
