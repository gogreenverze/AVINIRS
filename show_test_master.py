#!/usr/bin/env python3
"""
Script to display all test_master data with all columns
"""
import json
import sys
import os

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

def display_test_master_data(data):
    """Display test_master data in a formatted table"""
    if not data:
        print("No data found in test_master.json")
        return

    print(f"\n{'='*100}")
    print(f"TEST MASTER DATA - TOTAL RECORDS: {len(data)}")
    print(f"{'='*100}")

    # Get all unique keys from all records
    all_keys = set()
    for record in data:
        all_keys.update(record.keys())
    all_keys = sorted(list(all_keys))

    print(f"\nColumns in test_master ({len(all_keys)} total):")
    for i, key in enumerate(all_keys, 1):
        print(f"{i:2d}. {key}")

    print(f"\n{'='*100}")
    print("COMPLETE TEST MASTER DATA:")
    print(f"{'='*100}")

    # Display each record
    for i, record in enumerate(data, 1):
        print(f"\n--- RECORD {i} ---")
        for key in all_keys:
            value = record.get(key, 'N/A')
            # Handle different data types
            if isinstance(value, list):
                if len(value) == 0:
                    value_str = "[]"
                else:
                    value_str = f"[{len(value)} items]: {str(value)[:100]}..."
            elif isinstance(value, dict):
                value_str = f"{{dict with {len(value)} keys}}: {str(value)[:100]}..."
            elif isinstance(value, str) and len(value) > 100:
                value_str = value[:97] + "..."
            else:
                value_str = str(value)

            print(f"  {key:25}: {value_str}")

        if i >= 5:  # Show first 5 records in detail
            print(f"\n... and {len(data) - 5} more records ...")
            break

    # Display summary statistics
    print(f"\n{'='*100}")
    print("SUMMARY STATISTICS:")
    print(f"{'='*100}")

    for key in all_keys:
        values = [record.get(key) for record in data]
        non_null_values = [v for v in values if v is not None]
        null_count = len(values) - len(non_null_values)

        # Count unique values (handle unhashable types)
        try:
            unique_values = len(set(str(v) for v in non_null_values))
        except:
            unique_values = "N/A (complex data)"

        print(f"{key:25}: {unique_values} unique values, {null_count} null values")

    # Show all test names and prices
    print(f"\n{'='*100}")
    print("ALL TESTS WITH PRICES:")
    print(f"{'='*100}")
    print(f"{'ID':>3} | {'Test Name':<50} | {'Price':>8} | {'Department':<15}")
    print("-" * 85)

    for record in data:
        test_id = record.get('id', 'N/A')
        test_name = record.get('testName', 'N/A')
        test_price = record.get('test_price', 'N/A')
        department = record.get('department', 'N/A')

        # Truncate long test names
        if len(test_name) > 50:
            test_name = test_name[:47] + "..."

        print(f"{test_id:>3} | {test_name:<50} | {test_price:>8} | {department:<15}")

def main():
    """Main function"""
    print("Loading test_master data...")
    data = load_test_master_data()
    
    if data is not None:
        display_test_master_data(data)
    else:
        print("Failed to load test_master data!")
        sys.exit(1)

if __name__ == "__main__":
    main()
