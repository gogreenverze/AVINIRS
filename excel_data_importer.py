#!/usr/bin/env python3
"""
Excel Data Importer for Medical Laboratory Management System
Imports test and result master data from Excel file into JSON database
"""

import json
import os
import sys
from datetime import datetime
import pandas as pd
from typing import Dict, List, Any, Optional

# Add backend directory to path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

try:
    from utils import read_data, write_data
except ImportError:
    # Fallback implementation
    def read_data(filename):
        filepath = os.path.join('backend', 'data', filename)
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    
    def write_data(filename, data):
        os.makedirs(os.path.join('backend', 'data'), exist_ok=True)
        filepath = os.path.join('backend', 'data', filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)

class ExcelDataImporter:
    def __init__(self, excel_file_path: str):
        self.excel_file_path = excel_file_path
        self.imported_data = {}
        self.errors = []
        self.stats = {
            'total_records': 0,
            'successful_imports': 0,
            'failed_imports': 0,
            'sheets_processed': 0
        }
    
    def normalize_field_names(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize Excel field names to match our schema"""
        field_mapping = {
            'Test Name': 'test_name',
            'code': 'test_code',
            'Department': 'department',
            'Notes': 'notes',
            'Referance Range': 'reference_range',  # Fix typo in Excel
            'Result Unit': 'result_unit',
            'No of decimals': 'decimals',
            'Critical Low': 'critical_low',
            '   Critical High': 'critical_high',
            'Price': 'price',
            'price': 'price',  # Some sheets use lowercase
            'Result Type': 'result_type',
            'Short Name': 'short_name',
            'Method code': 'method_code',
            'Method': 'method',
            'Primary specimen code': 'primary_specimen_code',
            'Primary specimen ': 'primary_specimen',
            'Specimen Code': 'specimen_code',
            'Specimen': 'specimen',
            'Container Code': 'container_code',
            'Container': 'container',
            'Instructions': 'instructions',
            'Cut-off Time': 'cutoff_time',
            'Min. Sample Qty': 'min_sample_qty',
            'Min. Process Time': 'min_process_time',
            '      Test Done On': 'test_done_on',
            'Test Done On ': 'test_done_on',
            'Applicable to': 'applicable_to',
            '  Reporting Days': 'reporting_days',
            ' Reporting Days': 'reporting_days'
        }
        
        normalized = {}
        for key, value in data.items():
            # Clean up the key
            clean_key = key.strip() if isinstance(key, str) else str(key)
            
            # Map to normalized field name
            normalized_key = field_mapping.get(clean_key, clean_key.lower().replace(' ', '_'))
            
            # Clean up the value
            if pd.isna(value) or value == '' or value is None:
                normalized[normalized_key] = None
            elif isinstance(value, (pd.Timestamp, datetime)):
                normalized[normalized_key] = value.isoformat() if hasattr(value, 'isoformat') else str(value)
            else:
                normalized[normalized_key] = value
        
        return normalized
    
    def format_test_code(self, code: Any) -> str:
        """Format test code as 6-digit zero-padded string"""
        if code is None or pd.isna(code):
            return "000000"
        
        try:
            # Convert to integer first, then format
            code_int = int(float(str(code)))
            return f"{code_int:06d}"
        except (ValueError, TypeError):
            return "000000"
    
    def normalize_department(self, department: str) -> str:
        """Normalize department names"""
        if not department:
            return "GENERAL"
        
        # Clean up department name
        dept = str(department).strip().upper()
        
        # Handle common variations
        dept_mapping = {
            'BIOCHEMISTRY': 'BIOCHEMISTRY',
            'BIOCHMEISTRY': 'BIOCHEMISTRY',
            'CLINICAL PATHOLOGY': 'CLINICAL_PATHOLOGY',
            'MOLECULAR BIOLOGY': 'MOLECULAR_BIOLOGY',
            'HISTOPATHOLOGY': 'HISTOPATHOLOGY',
            ' HISTOPATHOLOGY': 'HISTOPATHOLOGY',
            'SEROLOGY': 'SEROLOGY',
            '\nSEROLOGY': 'SEROLOGY',
            'IMMUNOHAEMATOLOGY': 'IMMUNOHAEMATOLOGY',
            'MICROBIOLOGY SURVEILLANCE': 'MICROBIOLOGY_SURVEILLANCE',
            'ENDOCRINOLOGY': 'ENDOCRINOLOGY',
            'HAEMATOLOGY': 'HAEMATOLOGY'
        }
        
        return dept_mapping.get(dept, dept)
    
    def process_excel_sheet(self, sheet_name: str, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Process a single Excel sheet and return normalized data"""
        processed_records = []
        
        print(f"Processing sheet: {sheet_name} ({len(df)} records)")
        
        for index, row in df.iterrows():
            try:
                # Convert row to dictionary
                row_dict = row.to_dict()
                
                # Normalize field names
                normalized_data = self.normalize_field_names(row_dict)
                
                # Skip empty rows
                if not normalized_data.get('test_name'):
                    continue
                
                # Format and enhance data
                enhanced_record = {
                    'id': None,  # Will be assigned during save
                    'test_name': normalized_data.get('test_name', '').strip(),
                    'test_code': self.format_test_code(normalized_data.get('test_code')),
                    'department': self.normalize_department(normalized_data.get('department')),
                    'reference_range': normalized_data.get('reference_range'),
                    'result_unit': normalized_data.get('result_unit'),
                    'decimals': int(normalized_data.get('decimals', 0)) if normalized_data.get('decimals') else 0,
                    'critical_low': normalized_data.get('critical_low'),
                    'critical_high': normalized_data.get('critical_high'),
                    'price': float(normalized_data.get('price', 0)) if normalized_data.get('price') else 0,
                    'result_type': normalized_data.get('result_type', 'Numeric'),
                    'short_name': normalized_data.get('short_name'),
                    'method_code': normalized_data.get('method_code'),
                    'method': normalized_data.get('method'),
                    'specimen_code': normalized_data.get('specimen_code'),
                    'specimen': normalized_data.get('specimen'),
                    'container_code': normalized_data.get('container_code'),
                    'container': normalized_data.get('container'),
                    'instructions': normalized_data.get('instructions'),
                    'notes': normalized_data.get('notes'),  # Added notes field
                    'min_sample_qty': normalized_data.get('min_sample_qty'),
                    'test_done_on': normalized_data.get('test_done_on', 'all'),
                    'applicable_to': normalized_data.get('applicable_to', 'Both'),
                    'reporting_days': int(normalized_data.get('reporting_days', 0)) if normalized_data.get('reporting_days') else 0,
                    'source_sheet': sheet_name,
                    'excel_source': True,
                    'is_active': True,
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }
                
                processed_records.append(enhanced_record)
                self.stats['successful_imports'] += 1
                
            except Exception as e:
                error_msg = f"Error processing row {index + 1} in sheet {sheet_name}: {str(e)}"
                self.errors.append(error_msg)
                self.stats['failed_imports'] += 1
                print(f"Warning: {error_msg}")
        
        return processed_records
    
    def import_excel_data(self) -> Dict[str, Any]:
        """Import data from Excel file"""
        print(f"Starting Excel import from: {self.excel_file_path}")
        
        try:
            # Read Excel file
            excel_file = pd.ExcelFile(self.excel_file_path)
            
            all_records = []
            
            for sheet_name in excel_file.sheet_names:
                try:
                    # Read sheet
                    df = pd.read_excel(self.excel_file_path, sheet_name=sheet_name)
                    
                    if df.empty:
                        print(f"Skipping empty sheet: {sheet_name}")
                        continue
                    
                    # Process sheet
                    sheet_records = self.process_excel_sheet(sheet_name, df)
                    all_records.extend(sheet_records)
                    
                    self.stats['sheets_processed'] += 1
                    self.stats['total_records'] += len(df)
                    
                except Exception as e:
                    error_msg = f"Error processing sheet {sheet_name}: {str(e)}"
                    self.errors.append(error_msg)
                    print(f"Error: {error_msg}")
            
            # Assign IDs
            for i, record in enumerate(all_records, 1):
                record['id'] = i
            
            # Save to JSON files
            self.save_imported_data(all_records)
            
            return {
                'success': True,
                'stats': self.stats,
                'errors': self.errors,
                'total_imported': len(all_records)
            }
            
        except Exception as e:
            error_msg = f"Failed to import Excel data: {str(e)}"
            self.errors.append(error_msg)
            return {
                'success': False,
                'stats': self.stats,
                'errors': self.errors,
                'total_imported': 0
            }
    
    def save_imported_data(self, records: List[Dict[str, Any]]):
        """Save imported data to JSON files"""
        print(f"Saving {len(records)} records to JSON files...")
        
        # Save complete Excel data
        write_data('excel_test_data.json', records)
        
        # Create enhanced test master data
        test_master_records = []
        for record in records:
            test_master_record = {
                'id': record['id'],
                'department': record['department'],
                'testName': record['test_name'],
                'hmsCode': record['test_code'],
                'test_code': record['test_code'],
                'short_name': record['short_name'],
                'method': record['method'],
                'method_code': record['method_code'],
                'specimen': [record['specimen']] if record['specimen'] else [],
                'specimen_code': record['specimen_code'],
                'container': record['container'],
                'container_code': record['container_code'],
                'reference_range': record['reference_range'],
                'result_unit': record['result_unit'],
                'decimals': record['decimals'],
                'critical_low': record['critical_low'],
                'critical_high': record['critical_high'],
                'test_price': record['price'],
                'result_type': record['result_type'],
                'instructions': record['instructions'],
                'notes': record['notes'],  # Added notes field
                'min_sample_qty': record['min_sample_qty'],
                'serviceTime': '24 Hours',  # Default value
                'reporting_days': record['reporting_days'],
                'test_done_on': record['test_done_on'],
                'applicable_to': record['applicable_to'],
                'excel_source': True,
                'source_sheet': record['source_sheet'],
                'is_active': record['is_active'],
                'created_at': record['created_at'],
                'updated_at': record['updated_at']
            }
            test_master_records.append(test_master_record)
        
        write_data('test_master_enhanced.json', test_master_records)
        
        # Create enhanced result master data
        result_master_records = []
        for record in records:
            result_master_record = {
                'id': record['id'],
                'test_name': record['test_name'],
                'test_code': record['test_code'],
                'department': record['department'],
                'result_name': record['test_name'],
                'parameter_name': record['test_name'],
                'unit': record['result_unit'],
                'result_type': record['result_type'],
                'reference_range': record['reference_range'],
                'critical_low': record['critical_low'],
                'critical_high': record['critical_high'],
                'decimal_places': record['decimals'],
                'method': record['method'],
                'specimen_type': record['specimen'],
                'container': record['container'],
                'instructions': record['instructions'],
                'notes': record['notes'],  # Added notes field
                'min_sample_qty': record['min_sample_qty'],
                'excel_source': True,
                'source_sheet': record['source_sheet'],
                'is_active': record['is_active'],
                'created_at': record['created_at'],
                'updated_at': record['updated_at']
            }
            result_master_records.append(result_master_record)
        
        write_data('result_master_enhanced.json', result_master_records)
        
        print(f"✅ Saved {len(records)} records to excel_test_data.json")
        print(f"✅ Saved {len(test_master_records)} records to test_master_enhanced.json")
        print(f"✅ Saved {len(result_master_records)} records to result_master_enhanced.json")

def main():
    """Main function to run the import"""
    excel_file_path = os.path.join('Test master & Result Master', 'Test Master & Result Master.xlsx')
    
    if not os.path.exists(excel_file_path):
        print(f"❌ Excel file not found: {excel_file_path}")
        sys.exit(1)
    
    print("🚀 Starting Excel Data Import Process")
    print("=" * 60)
    
    importer = ExcelDataImporter(excel_file_path)
    result = importer.import_excel_data()
    
    print("\n" + "=" * 60)
    print("📊 IMPORT SUMMARY")
    print("=" * 60)
    print(f"Success: {result['success']}")
    print(f"Total Records Processed: {result['stats']['total_records']}")
    print(f"Sheets Processed: {result['stats']['sheets_processed']}")
    print(f"Successful Imports: {result['stats']['successful_imports']}")
    print(f"Failed Imports: {result['stats']['failed_imports']}")
    print(f"Total Imported: {result['total_imported']}")
    
    if result['errors']:
        print(f"\n⚠️ Errors ({len(result['errors'])}):")
        for error in result['errors'][:10]:  # Show first 10 errors
            print(f"  - {error}")
        if len(result['errors']) > 10:
            print(f"  ... and {len(result['errors']) - 10} more errors")
    
    if result['success']:
        print("\n✅ Excel data import completed successfully!")
    else:
        print("\n❌ Excel data import failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
