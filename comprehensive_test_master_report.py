#!/usr/bin/env python3
"""
Comprehensive Test Master Report - All Columns with Detailed Analysis
"""
import json
import sys
from datetime import datetime

def load_test_master_data():
    """Load test_master data from JSON file"""
    try:
        with open('backend/data/test_master.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        print("Error: test_master.json file not found!")
        return None
    except json.JSONDecodeError:
        print("Error: Invalid JSON format in test_master.json!")
        return None

def analyze_column_data(data, column_name):
    """Analyze data for a specific column"""
    values = [record.get(column_name) for record in data]
    non_null_values = [v for v in values if v is not None and v != ""]
    
    analysis = {
        'total_records': len(values),
        'non_null_count': len(non_null_values),
        'null_count': len(values) - len(non_null_values),
        'unique_values': [],
        'sample_values': [],
        'data_types': set()
    }
    
    # Get unique values and data types
    unique_set = set()
    for value in non_null_values[:10]:  # Sample first 10 non-null values
        analysis['sample_values'].append(value)
        analysis['data_types'].add(type(value).__name__)
        if len(str(value)) < 100:  # Only add short values to unique set
            unique_set.add(str(value))
    
    analysis['unique_values'] = list(unique_set)[:10]  # First 10 unique values
    analysis['data_types'] = list(analysis['data_types'])
    
    return analysis

def generate_comprehensive_report(data):
    """Generate comprehensive report for all test_master columns"""
    
    print("=" * 120)
    print("COMPREHENSIVE TEST MASTER DATABASE REPORT")
    print("=" * 120)
    print(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Total Records: {len(data)}")
    print("=" * 120)
    
    # Get all columns
    all_columns = set()
    for record in data:
        all_columns.update(record.keys())
    all_columns = sorted(list(all_columns))
    
    print(f"\nTOTAL COLUMNS: {len(all_columns)}")
    print("-" * 120)
    
    # Column descriptions and purposes
    column_descriptions = {
        'id': 'Primary key - Unique identifier for each test',
        'department': 'Department/Category where the test belongs (e.g., Immunology, Biochemistry)',
        'testName': 'Full name of the laboratory test',
        'emrClassification': 'Electronic Medical Record classification type',
        'shortName': 'Abbreviated name for the test (for display purposes)',
        'displayName': 'Name displayed to users in the interface',
        'hmsCode': 'Hospital Management System code for the test',
        'internationalCode': 'International standard code (CPT/LOINC)',
        'method': 'Testing methodology or technique used',
        'primarySpecimen': 'Primary specimen type required for the test',
        'specimen': 'All acceptable specimen types',
        'container': 'Container type required for specimen collection',
        'interpretation': 'Clinical interpretation guidelines for results',
        'instructions': 'Pre-test instructions for patients',
        'specialReport': 'Special reporting requirements or formats',
        'reportName': 'Name used in the final report',
        'subTests': 'List of sub-tests or components included',
        'unacceptableConditions': 'Conditions that make specimen unacceptable',
        'minSampleQty': 'Minimum sample quantity required',
        'cutoffTime': 'Time cutoff for sample acceptance',
        'testSuffix': 'Suffix added to test name',
        'suffixDesc': 'Description of the suffix meaning',
        'minProcessTime': 'Minimum processing time required',
        'minProcessPeriod': 'Period unit for minimum processing time',
        'emergencyProcessTime': 'Processing time for emergency/stat tests',
        'emergencyProcessPeriod': 'Period unit for emergency processing',
        'expiryTime': 'Sample expiry time',
        'expiryPeriod': 'Period unit for sample expiry',
        'serviceTime': 'Service/turnaround time',
        'applicableTo': 'Patient demographics this test applies to',
        'reportingDays': 'Days of the week when results are reported',
        'testDoneOn': 'Days of the week when test is performed',
        'alertSMS': 'Whether SMS alerts are enabled',
        'alertPeriod': 'Period for alert notifications',
        'alertMessage': 'Custom alert message template',
        'options': 'Various test configuration options and flags',
        'is_active': 'Whether the test is currently active/available',
        'created_at': 'Timestamp when test was created',
        'updated_at': 'Timestamp when test was last updated',
        'created_by': 'User ID who created the test',
        'test_price': 'Price/cost of the test',
        'test_profile': 'Test profile or panel this test belongs to',
        'reference_range': 'Normal reference ranges for test results',
        'result_unit': 'Unit of measurement for test results',
        'decimals': 'Number of decimal places for result display'
    }
    
    # Analyze each column
    for i, column in enumerate(all_columns, 1):
        print(f"\n{i:2d}. COLUMN: {column.upper()}")
        print("-" * 80)
        
        # Description
        description = column_descriptions.get(column, "No description available")
        print(f"Description: {description}")
        
        # Analyze data
        analysis = analyze_column_data(data, column)
        
        print(f"Data Type(s): {', '.join(analysis['data_types'])}")
        print(f"Total Records: {analysis['total_records']}")
        print(f"Non-null Values: {analysis['non_null_count']}")
        print(f"Null/Empty Values: {analysis['null_count']}")
        
        # Sample values
        if analysis['sample_values']:
            print("Sample Values:")
            for j, value in enumerate(analysis['sample_values'][:5], 1):
                value_str = str(value)
                if len(value_str) > 80:
                    value_str = value_str[:77] + "..."
                print(f"  {j}. {value_str}")
        
        # Unique values (for categorical data)
        if len(analysis['unique_values']) <= 10 and analysis['unique_values']:
            print(f"Unique Values: {', '.join(analysis['unique_values'])}")
        elif len(analysis['unique_values']) > 10:
            print(f"Unique Values: {len(analysis['unique_values'])} different values")
    
    # Summary statistics
    print("\n" + "=" * 120)
    print("SUMMARY STATISTICS")
    print("=" * 120)
    
    # Price analysis
    prices = [record.get('test_price', 0) for record in data if record.get('test_price') is not None]
    if prices:
        print(f"Price Range: ₹{min(prices)} - ₹{max(prices)}")
        print(f"Average Price: ₹{sum(prices)/len(prices):.2f}")
    
    # Department distribution
    departments = [record.get('department') for record in data]
    dept_count = {}
    for dept in departments:
        if dept:
            dept_count[dept] = dept_count.get(dept, 0) + 1
    
    print(f"Departments: {', '.join(dept_count.keys())}")
    for dept, count in dept_count.items():
        print(f"  {dept}: {count} tests")
    
    # Active vs inactive tests
    active_tests = sum(1 for record in data if record.get('is_active', False))
    print(f"Active Tests: {active_tests}/{len(data)}")

def load_patient_data():
    """Load patient data from JSON file"""
    try:
        with open('backend/data/patients.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        print("Error: patients.json file not found!")
        return None
    except json.JSONDecodeError:
        print("Error: Invalid JSON format in patients.json!")
        return None

def load_results_data():
    """Load results data from JSON file"""
    try:
        with open('backend/data/results.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        print("Error: results.json file not found!")
        return None
    except json.JSONDecodeError:
        print("Error: Invalid JSON format in results.json!")
        return None

def load_samples_data():
    """Load samples data from JSON file"""
    try:
        with open('backend/data/samples.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        print("Error: samples.json file not found!")
        return None
    except json.JSONDecodeError:
        print("Error: Invalid JSON format in samples.json!")
        return None

def generate_patient_test_report(patients, tests, results, samples):
    """Generate comprehensive patient-test report"""
    print("\n" + "=" * 120)
    print("PATIENT-TEST COMPREHENSIVE REPORT")
    print("=" * 120)

    # Create lookup dictionaries
    test_lookup = {test['id']: test for test in tests}
    patient_lookup = {patient['id']: patient for patient in patients}
    sample_lookup = {sample['id']: sample for sample in samples} if samples else {}

    print(f"Total Patients: {len(patients)}")
    print(f"Total Tests Available: {len(tests)}")
    print(f"Total Results: {len(results)}")
    print(f"Total Samples: {len(samples) if samples else 0}")

    # Patient details with their tests
    print("\n" + "-" * 120)
    print("PATIENT DETAILS WITH TEST RESULTS")
    print("-" * 120)

    # Group results by patient (via sample)
    patient_results = {}
    for result in results:
        sample_id = result.get('sample_id')
        if sample_id and sample_id in sample_lookup:
            sample = sample_lookup[sample_id]
            patient_id = sample.get('patient_id')
            if patient_id:
                if patient_id not in patient_results:
                    patient_results[patient_id] = []
                patient_results[patient_id].append(result)

    # Display patient information with their test results
    for patient_id, results_list in list(patient_results.items())[:10]:  # Show first 10 patients
        if patient_id in patient_lookup:
            patient = patient_lookup[patient_id]
            print(f"\nPATIENT ID: {patient.get('patient_id', 'N/A')}")
            print(f"Name: {patient.get('first_name', '')} {patient.get('last_name', '')}")
            print(f"Gender: {patient.get('gender', 'N/A')}")
            print(f"DOB: {patient.get('date_of_birth', 'N/A')}")
            print(f"Phone: {patient.get('phone', 'N/A')}")
            print(f"Email: {patient.get('email', 'N/A')}")
            print(f"Address: {patient.get('address', 'N/A')}")
            print(f"Blood Group: {patient.get('blood_group', 'N/A')}")

            print(f"\nTEST RESULTS ({len(results_list)} tests):")
            for result in results_list:
                test_id = result.get('test_id')
                if test_id in test_lookup:
                    test = test_lookup[test_id]
                    print(f"  • {test.get('testName', 'Unknown Test')}")
                    print(f"    Result: {result.get('value', 'N/A')} {result.get('unit', '')}")
                    print(f"    Reference: {result.get('reference_range', 'N/A')}")
                    print(f"    Status: {result.get('status', 'N/A')}")
                    print(f"    Date: {result.get('result_date', 'N/A')}")
                    print(f"    Price: ₹{test.get('test_price', 0)}")
            print("-" * 80)

def main():
    """Main function"""
    print("Loading test_master data...")
    test_data = load_test_master_data()

    print("Loading patient data...")
    patient_data = load_patient_data()

    print("Loading results data...")
    results_data = load_results_data()

    print("Loading samples data...")
    samples_data = load_samples_data()

    if test_data is not None:
        generate_comprehensive_report(test_data)

        if patient_data and results_data:
            generate_patient_test_report(patient_data, test_data, results_data, samples_data)
    else:
        print("Failed to load test_master data!")
        sys.exit(1)

if __name__ == "__main__":
    main()
