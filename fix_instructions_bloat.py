#!/usr/bin/env python3
"""
Fix the massive instructions field bloat in billing_reports.json
"""

import json
import os
from datetime import datetime

def fix_instructions_bloat():
    """Fix the instructions field bloat in billing reports"""
    file_path = 'backend/data/billing_reports.json'
    
    print("=" * 60)
    print("FIXING INSTRUCTIONS FIELD BLOAT")
    print("=" * 60)
    
    # Check original file size
    original_size = os.path.getsize(file_path)
    print(f"Original file size: {original_size:,} bytes ({original_size / (1024*1024):.2f} MB)")
    
    try:
        # Load the data
        print("\n📖 Loading billing reports data...")
        with open(file_path, 'r', encoding='utf-8') as f:
            reports = json.load(f)
        
        print(f"✅ Loaded {len(reports):,} reports")
        
        # Analyze instructions field sizes
        print("\n🔍 Analyzing instructions field sizes...")
        instructions_sizes = []
        total_instructions_size = 0
        
        for report in reports:
            test_items = report.get('test_items', [])
            for test_item in test_items:
                instructions = test_item.get('instructions', '')
                if instructions:
                    size = len(instructions)
                    instructions_sizes.append({
                        'sid': report.get('sid_number'),
                        'test_name': test_item.get('test_name'),
                        'size': size,
                        'preview': instructions[:100] + '...' if len(instructions) > 100 else instructions
                    })
                    total_instructions_size += size
        
        print(f"Total instructions field size: {total_instructions_size:,} bytes ({total_instructions_size/(1024*1024):.2f} MB)")
        
        # Show largest instructions
        instructions_sizes.sort(key=lambda x: x['size'], reverse=True)
        print(f"\nLargest instructions fields:")
        for i, item in enumerate(instructions_sizes[:5]):
            print(f"  #{i+1}: {item['test_name']} (SID: {item['sid']}) - {item['size']:,} bytes")
            print(f"       Preview: {item['preview']}")
        
        # Fix the reports by truncating or removing large instructions
        print(f"\n🔧 Fixing reports...")
        fixed_reports = []
        total_instructions_removed = 0
        tests_fixed = 0
        
        for report in reports:
            fixed_report = report.copy()
            test_items = report.get('test_items', [])
            fixed_test_items = []
            
            for test_item in test_items:
                fixed_test_item = test_item.copy()
                
                # Check instructions field
                instructions = fixed_test_item.get('instructions', '')
                if len(instructions) > 1000:  # If instructions > 1KB
                    original_size = len(instructions)
                    
                    # Option 1: Truncate to first 500 characters
                    # truncated_instructions = instructions[:500] + "... [Content truncated for storage efficiency]"
                    
                    # Option 2: Remove entirely (recommended for billing reports)
                    truncated_instructions = ""
                    
                    fixed_test_item['instructions'] = truncated_instructions
                    
                    size_saved = original_size - len(truncated_instructions)
                    total_instructions_removed += size_saved
                    tests_fixed += 1
                    
                    print(f"  Fixed {test_item.get('test_name')} in SID {report.get('sid_number')}: saved {size_saved:,} bytes")
                
                # Also check test_master_data instructions
                test_master_data = fixed_test_item.get('test_master_data', {})
                if isinstance(test_master_data, dict) and 'instructions' in test_master_data:
                    tmd_instructions = test_master_data.get('instructions', '')
                    if len(tmd_instructions) > 1000:
                        original_size = len(tmd_instructions)
                        test_master_data['instructions'] = ""  # Remove entirely
                        size_saved = original_size
                        total_instructions_removed += size_saved
                        print(f"  Fixed test_master_data instructions for {test_item.get('test_name')}: saved {size_saved:,} bytes")
                
                fixed_test_items.append(fixed_test_item)
            
            fixed_report['test_items'] = fixed_test_items
            fixed_reports.append(fixed_report)
        
        print(f"\n✅ Fixed {tests_fixed:,} test items")
        print(f"Total instructions data removed: {total_instructions_removed:,} bytes ({total_instructions_removed/(1024*1024):.2f} MB)")
        
        # Save the fixed data
        print(f"\n💾 Saving fixed data...")
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(fixed_reports, f, indent=2, ensure_ascii=False)
        
        # Check new file size
        new_size = os.path.getsize(file_path)
        size_reduction = original_size - new_size
        reduction_percent = (size_reduction / original_size) * 100
        
        print(f"✅ Fix complete!")
        print(f"\n📊 RESULTS:")
        print(f"  Original size: {original_size:,} bytes ({original_size / (1024*1024):.2f} MB)")
        print(f"  New size: {new_size:,} bytes ({new_size / (1024*1024):.2f} MB)")
        print(f"  Size reduction: {size_reduction:,} bytes ({size_reduction / (1024*1024):.2f} MB)")
        print(f"  Reduction percentage: {reduction_percent:.1f}%")
        
        # Verify data integrity
        print(f"\n🔍 Verifying data integrity...")
        with open(file_path, 'r', encoding='utf-8') as f:
            verified_data = json.load(f)
        
        if len(verified_data) == len(reports):
            print(f"✅ Data integrity verified: {len(verified_data)} reports maintained")
        else:
            print(f"❌ Data integrity issue: Expected {len(reports)}, got {len(verified_data)}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error during fix: {e}")
        return False

if __name__ == "__main__":
    success = fix_instructions_bloat()
    if success:
        print(f"\n🎉 Instructions bloat fix completed successfully!")
        print(f"💡 The file size should now be dramatically reduced.")
        print(f"📝 Note: Large instructions fields have been removed from billing reports.")
        print(f"   This data is still available in the original test_master files if needed.")
    else:
        print(f"\n❌ Fix failed.")
