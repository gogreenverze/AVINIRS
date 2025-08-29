#!/usr/bin/env python3
"""
Analyze Excel file structure and compare with test_master fields
"""
import pandas as pd
import json
import sys

def analyze_excel_file():
    """Analyze the Excel file structure"""
    try:
        # Read the Excel file
        excel_file = 'dynamic_data_fetch_with_prices_v3.xlsx'
        
        # Get all sheet names
        xl_file = pd.ExcelFile(excel_file)
        sheet_names = xl_file.sheet_names
        
        print("=" * 80)
        print("EXCEL FILE ANALYSIS")
        print("=" * 80)
        print(f"File: {excel_file}")
        print(f"Number of sheets: {len(sheet_names)}")
        print(f"Sheet names: {sheet_names}")
        
        # Analyze each sheet
        for sheet_name in sheet_names:
            print(f"\n{'='*60}")
            print(f"SHEET: {sheet_name}")
            print(f"{'='*60}")
            
            try:
                df = pd.read_excel(excel_file, sheet_name=sheet_name)
                print(f"Rows: {len(df)}")
                print(f"Columns: {len(df.columns)}")
                
                print("\nColumn Names:")
                for i, col in enumerate(df.columns, 1):
                    print(f"{i:2d}. {col}")
                
                # Show first few rows
                if len(df) > 0:
                    print(f"\nFirst 3 rows of data:")
                    print(df.head(3).to_string())
                
            except Exception as e:
                print(f"Error reading sheet {sheet_name}: {e}")
        
        return xl_file, sheet_names
        
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return None, []

def load_test_master_fields():
    """Load current test_master field names"""
    try:
        with open('backend/data/test_master.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Get all unique field names
        all_fields = set()
        for record in data:
            all_fields.update(record.keys())
        
        return sorted(list(all_fields))
    except Exception as e:
        print(f"Error loading test_master: {e}")
        return []

def compare_fields(excel_fields, test_master_fields):
    """Compare Excel fields with test_master fields"""
    print("\n" + "=" * 80)
    print("FIELD MAPPING ANALYSIS")
    print("=" * 80)
    
    print(f"Excel fields: {len(excel_fields)}")
    print(f"Test_master fields: {len(test_master_fields)}")
    
    # Fields in Excel but not in test_master
    excel_only = set(excel_fields) - set(test_master_fields)
    if excel_only:
        print(f"\nFields in Excel but NOT in test_master ({len(excel_only)}):")
        for field in sorted(excel_only):
            print(f"  + {field}")
    
    # Fields in test_master but not in Excel
    test_master_only = set(test_master_fields) - set(excel_fields)
    if test_master_only:
        print(f"\nFields in test_master but NOT in Excel ({len(test_master_only)}):")
        for field in sorted(test_master_only):
            print(f"  - {field}")
    
    # Common fields
    common_fields = set(excel_fields) & set(test_master_fields)
    if common_fields:
        print(f"\nCommon fields ({len(common_fields)}):")
        for field in sorted(common_fields):
            print(f"  = {field}")
    
    return excel_only, test_master_only, common_fields

def suggest_field_mapping(excel_fields, test_master_fields):
    """Suggest field mapping between Excel and test_master"""
    print("\n" + "=" * 80)
    print("SUGGESTED FIELD MAPPING")
    print("=" * 80)
    
    # Manual mapping suggestions based on common patterns
    mapping_suggestions = {
        # Excel field -> test_master field
        'Test Name': 'testName',
        'Test_Name': 'testName',
        'test_name': 'testName',
        'Display Name': 'displayName',
        'Display_Name': 'displayName',
        'display_name': 'displayName',
        'Short Name': 'shortName',
        'Short_Name': 'shortName',
        'short_name': 'shortName',
        'Price': 'test_price',
        'Test Price': 'test_price',
        'Test_Price': 'test_price',
        'test_price': 'test_price',
        'Department': 'department',
        'dept': 'department',
        'HMS Code': 'hmsCode',
        'HMS_Code': 'hmsCode',
        'hms_code': 'hmsCode',
        'International Code': 'internationalCode',
        'International_Code': 'internationalCode',
        'international_code': 'internationalCode',
        'Reference Range': 'reference_range',
        'Reference_Range': 'reference_range',
        'reference_range': 'reference_range',
        'Unit': 'result_unit',
        'Result Unit': 'result_unit',
        'Result_Unit': 'result_unit',
        'result_unit': 'result_unit',
        'Instructions': 'instructions',
        'Interpretation': 'interpretation',
        'Method': 'method',
        'Specimen': 'specimen',
        'Container': 'container',
        'Profile': 'test_profile',
        'Test Profile': 'test_profile',
        'Test_Profile': 'test_profile',
        'test_profile': 'test_profile'
    }
    
    print("Suggested mappings (Excel -> test_master):")
    found_mappings = []
    
    for excel_field in excel_fields:
        if excel_field in mapping_suggestions:
            test_master_field = mapping_suggestions[excel_field]
            print(f"  {excel_field} -> {test_master_field}")
            found_mappings.append((excel_field, test_master_field))
        else:
            # Try to find similar fields
            excel_lower = excel_field.lower().replace(' ', '_').replace('-', '_')
            for tm_field in test_master_fields:
                tm_lower = tm_field.lower()
                if excel_lower == tm_lower or excel_lower in tm_lower or tm_lower in excel_lower:
                    print(f"  {excel_field} -> {tm_field} (suggested)")
                    found_mappings.append((excel_field, tm_field))
                    break
            else:
                print(f"  {excel_field} -> ??? (needs manual mapping)")
    
    return found_mappings

def main():
    """Main function"""
    print("Analyzing Excel file structure...")
    
    # Analyze Excel file
    xl_file, sheet_names = analyze_excel_file()
    if not xl_file:
        sys.exit(1)
    
    # Load test_master fields
    test_master_fields = load_test_master_fields()
    if not test_master_fields:
        sys.exit(1)
    
    print(f"\n{'='*80}")
    print("CURRENT TEST_MASTER FIELDS")
    print(f"{'='*80}")
    for i, field in enumerate(test_master_fields, 1):
        print(f"{i:2d}. {field}")
    
    # Get Excel fields from the main sheet (assuming first sheet has the data)
    if sheet_names:
        main_sheet = sheet_names[0]  # Use first sheet
        try:
            df = pd.read_excel('dynamic_data_fetch_with_prices_v3.xlsx', sheet_name=main_sheet)
            excel_fields = list(df.columns)
            
            # Compare fields
            excel_only, test_master_only, common_fields = compare_fields(excel_fields, test_master_fields)
            
            # Suggest mappings
            mappings = suggest_field_mapping(excel_fields, test_master_fields)
            
        except Exception as e:
            print(f"Error analyzing main sheet: {e}")

if __name__ == "__main__":
    main()
