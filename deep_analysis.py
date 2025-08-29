#!/usr/bin/env python3
"""
Deep analysis of billing_reports.json to find the real cause of the large file size
"""

import json
import os
from collections import defaultdict

def deep_analyze():
    file_path = 'backend/data/billing_reports.json'
    
    print("=" * 60)
    print("DEEP ANALYSIS OF BILLING REPORTS")
    print("=" * 60)
    
    # Check file size
    file_size = os.path.getsize(file_path)
    print(f"File size: {file_size:,} bytes ({file_size / (1024*1024):.2f} MB)")
    
    try:
        # Load the data
        print("\nLoading data...")
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"✅ Loaded {len(data):,} reports")
        
        # Analyze each top-level field
        print(f"\n🔍 FIELD SIZE ANALYSIS:")
        field_sizes = defaultdict(int)
        
        for report in data:
            for key, value in report.items():
                field_size = len(json.dumps(value))
                field_sizes[key] += field_size
        
        # Sort by total size
        sorted_fields = sorted(field_sizes.items(), key=lambda x: x[1], reverse=True)
        
        for field, total_size in sorted_fields:
            avg_size = total_size / len(data)
            print(f"  {field}: {total_size:,} bytes total ({total_size/(1024*1024):.2f} MB), avg {avg_size:.0f} bytes per report")
        
        # Deep dive into test_items
        print(f"\n🔬 TEST_ITEMS DEEP ANALYSIS:")
        test_items_field_sizes = defaultdict(int)
        total_test_items = 0
        
        for report in data:
            test_items = report.get('test_items', [])
            total_test_items += len(test_items)
            
            for test_item in test_items:
                for key, value in test_item.items():
                    field_size = len(json.dumps(value))
                    test_items_field_sizes[key] += field_size
        
        print(f"Total test items across all reports: {total_test_items:,}")
        
        # Sort test_items fields by size
        sorted_test_fields = sorted(test_items_field_sizes.items(), key=lambda x: x[1], reverse=True)
        
        for field, total_size in sorted_test_fields:
            avg_size = total_size / total_test_items if total_test_items > 0 else 0
            print(f"  {field}: {total_size:,} bytes total ({total_size/(1024*1024):.2f} MB), avg {avg_size:.0f} bytes per test")
        
        # Analyze the largest test_master_data objects
        print(f"\n📊 LARGEST TEST_MASTER_DATA OBJECTS:")
        test_master_sizes = []
        
        for i, report in enumerate(data):
            test_items = report.get('test_items', [])
            for j, test_item in enumerate(test_items):
                test_master_data = test_item.get('test_master_data', {})
                if test_master_data:
                    size = len(json.dumps(test_master_data))
                    test_master_sizes.append({
                        'report_index': i,
                        'test_index': j,
                        'sid': report.get('sid_number'),
                        'test_name': test_item.get('test_name'),
                        'size': size,
                        'keys': list(test_master_data.keys())
                    })
        
        # Sort by size and show top 10
        test_master_sizes.sort(key=lambda x: x['size'], reverse=True)
        
        for i, item in enumerate(test_master_sizes[:10]):
            print(f"  #{i+1}: SID {item['sid']}, Test '{item['test_name']}' - {item['size']:,} bytes")
            print(f"       Keys: {item['keys'][:10]}{'...' if len(item['keys']) > 10 else ''}")
        
        # Check for specific large fields in test_master_data
        print(f"\n🔍 LARGE FIELDS IN TEST_MASTER_DATA:")
        large_field_examples = defaultdict(list)
        
        for report in data[:5]:  # Check first 5 reports
            test_items = report.get('test_items', [])
            for test_item in test_items:
                test_master_data = test_item.get('test_master_data', {})
                for key, value in test_master_data.items():
                    field_size = len(json.dumps(value))
                    if field_size > 1000:  # Fields larger than 1KB
                        large_field_examples[key].append({
                            'size': field_size,
                            'value_preview': str(value)[:100] + '...' if len(str(value)) > 100 else str(value),
                            'sid': report.get('sid_number'),
                            'test_name': test_item.get('test_name')
                        })
        
        for field, examples in large_field_examples.items():
            print(f"  {field}:")
            for example in examples[:3]:  # Show first 3 examples
                print(f"    SID {example['sid']}, {example['test_name']}: {example['size']:,} bytes")
                print(f"    Preview: {example['value_preview']}")
        
        # Check for duplicate data
        print(f"\n🔄 DUPLICATE DATA ANALYSIS:")
        test_master_data_hashes = defaultdict(int)
        
        for report in data:
            test_items = report.get('test_items', [])
            for test_item in test_items:
                test_master_data = test_item.get('test_master_data', {})
                if test_master_data:
                    # Create a hash of the test_master_data
                    data_str = json.dumps(test_master_data, sort_keys=True)
                    test_master_data_hashes[data_str] += 1
        
        duplicate_count = sum(1 for count in test_master_data_hashes.values() if count > 1)
        total_duplicates = sum(count - 1 for count in test_master_data_hashes.values() if count > 1)
        
        print(f"  Unique test_master_data objects: {len(test_master_data_hashes):,}")
        print(f"  Objects with duplicates: {duplicate_count:,}")
        print(f"  Total duplicate instances: {total_duplicates:,}")
        
        if duplicate_count > 0:
            print(f"  Most duplicated objects:")
            sorted_duplicates = sorted(test_master_data_hashes.items(), key=lambda x: x[1], reverse=True)
            for i, (data_str, count) in enumerate(sorted_duplicates[:5]):
                if count > 1:
                    data_obj = json.loads(data_str)
                    test_name = data_obj.get('testName', 'Unknown')
                    size = len(data_str)
                    print(f"    #{i+1}: '{test_name}' appears {count} times, {size:,} bytes each")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    deep_analyze()
