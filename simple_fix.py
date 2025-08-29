#!/usr/bin/env python3
import json
import os

def simple_fix():
    file_path = 'backend/data/billing_reports.json'
    
    print("Loading data...")
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Loaded {len(data)} reports")
    
    total_removed = 0
    
    for report in data:
        for test_item in report.get('test_items', []):
            # Remove large instructions
            if 'instructions' in test_item:
                size = len(str(test_item['instructions']))
                if size > 1000:
                    total_removed += size
                    test_item['instructions'] = ""
            
            # Remove large instructions from test_master_data
            tmd = test_item.get('test_master_data', {})
            if isinstance(tmd, dict) and 'instructions' in tmd:
                size = len(str(tmd['instructions']))
                if size > 1000:
                    total_removed += size
                    tmd['instructions'] = ""
    
    print(f"Removed {total_removed:,} bytes of instructions data")
    
    print("Saving...")
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    new_size = os.path.getsize(file_path)
    print(f"New file size: {new_size:,} bytes ({new_size/(1024*1024):.2f} MB)")

if __name__ == "__main__":
    simple_fix()
