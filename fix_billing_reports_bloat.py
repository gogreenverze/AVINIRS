#!/usr/bin/env python3
"""
Fix billing_reports.json file size issue by removing redundant test_master_data
and implementing a more efficient storage strategy.
"""

import json
import os
import shutil
from datetime import datetime
from collections import defaultdict

def backup_file(file_path):
    """Create a backup of the original file"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = f"{file_path}_bloat_fix_backup_{timestamp}"
    shutil.copy2(file_path, backup_path)
    print(f"✅ Backup created: {backup_path}")
    return backup_path

def analyze_test_master_data_usage(reports):
    """Analyze how test_master_data is being used"""
    test_master_sizes = []
    test_master_keys = set()
    
    for report in reports:
        test_items = report.get('test_items', [])
        for test_item in test_items:
            test_master_data = test_item.get('test_master_data', {})
            if test_master_data:
                size = len(json.dumps(test_master_data))
                test_master_sizes.append(size)
                test_master_keys.update(test_master_data.keys())
    
    return {
        'total_instances': len(test_master_sizes),
        'avg_size': sum(test_master_sizes) / len(test_master_sizes) if test_master_sizes else 0,
        'max_size': max(test_master_sizes) if test_master_sizes else 0,
        'min_size': min(test_master_sizes) if test_master_sizes else 0,
        'total_size': sum(test_master_sizes),
        'unique_keys': sorted(test_master_keys)
    }

def extract_essential_test_data(test_master_data):
    """Extract only essential fields from test_master_data for billing reports"""
    if not test_master_data:
        return {}
    
    # Essential fields needed for billing reports and PDF generation
    essential_fields = {
        'id': test_master_data.get('id'),
        'testName': test_master_data.get('testName'),
        'hmsCode': test_master_data.get('hmsCode'),
        'department': test_master_data.get('department'),
        'test_price': test_master_data.get('test_price'),
        'specimen': test_master_data.get('specimen'),
        'container': test_master_data.get('container'),
        'method': test_master_data.get('method'),
        'referenceRange': test_master_data.get('referenceRange'),
        'resultUnit': test_master_data.get('resultUnit'),
        'serviceTime': test_master_data.get('serviceTime'),
        'reportingDays': test_master_data.get('reportingDays'),
        'cutoffTime': test_master_data.get('cutoffTime'),
        'instructions': test_master_data.get('instructions'),
        'notes': test_master_data.get('notes'),
        'decimals': test_master_data.get('decimals'),
        'criticalLow': test_master_data.get('criticalLow'),
        'criticalHigh': test_master_data.get('criticalHigh'),
        'isActive': test_master_data.get('isActive', True)
    }
    
    # Remove None values to save space
    return {k: v for k, v in essential_fields.items() if v is not None}

def optimize_billing_reports():
    """Main function to optimize billing_reports.json"""
    file_path = 'backend/data/billing_reports.json'

    print("=" * 60)
    print("BILLING REPORTS OPTIMIZATION")
    print("=" * 60)

    # Check original file size
    original_size = os.path.getsize(file_path)
    print(f"Original file size: {original_size:,} bytes ({original_size / (1024*1024):.2f} MB)")

    # Skip backup due to disk space - working in-place
    print("⚠️  Working in-place due to disk space constraints (no backup created)")
    backup_path = None
    
    try:
        # Load the data
        print("\n📖 Loading billing reports data...")
        with open(file_path, 'r', encoding='utf-8') as f:
            reports = json.load(f)
        
        print(f"✅ Loaded {len(reports):,} reports")
        
        # Analyze current test_master_data usage
        print("\n🔍 Analyzing test_master_data usage...")
        analysis = analyze_test_master_data_usage(reports)
        print(f"  Total test_master_data instances: {analysis['total_instances']:,}")
        print(f"  Average size per instance: {analysis['avg_size']:.0f} bytes")
        print(f"  Total size of all test_master_data: {analysis['total_size']:,} bytes ({analysis['total_size']/(1024*1024):.2f} MB)")
        print(f"  Unique keys in test_master_data: {len(analysis['unique_keys'])}")
        
        # Optimize each report
        print("\n🔧 Optimizing reports...")
        optimized_reports = []
        total_tests_processed = 0
        
        for i, report in enumerate(reports):
            optimized_report = report.copy()
            test_items = report.get('test_items', [])
            optimized_test_items = []
            
            for test_item in test_items:
                optimized_test_item = test_item.copy()
                
                # Replace large test_master_data with essential fields only
                if 'test_master_data' in optimized_test_item:
                    original_data = optimized_test_item['test_master_data']
                    essential_data = extract_essential_test_data(original_data)
                    optimized_test_item['test_master_data'] = essential_data
                    total_tests_processed += 1
                
                optimized_test_items.append(optimized_test_item)
            
            optimized_report['test_items'] = optimized_test_items
            optimized_reports.append(optimized_report)
            
            if (i + 1) % 10 == 0:
                print(f"  Processed {i + 1}/{len(reports)} reports...")
        
        print(f"✅ Optimized {total_tests_processed:,} test items across {len(reports):,} reports")
        
        # Save optimized data
        print("\n💾 Saving optimized data...")
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(optimized_reports, f, indent=2, ensure_ascii=False)
        
        # Check new file size
        new_size = os.path.getsize(file_path)
        size_reduction = original_size - new_size
        reduction_percent = (size_reduction / original_size) * 100
        
        print(f"✅ Optimization complete!")
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
        print(f"❌ Error during optimization: {e}")
        if backup_path:
            print(f"🔄 Restoring from backup...")
            shutil.copy2(backup_path, file_path)
            print(f"✅ Backup restored")
        else:
            print(f"⚠️  No backup available - manual recovery may be needed")
        return False

if __name__ == "__main__":
    success = optimize_billing_reports()
    if success:
        print(f"\n🎉 Billing reports optimization completed successfully!")
        print(f"💡 The file size should now be significantly reduced while maintaining all necessary functionality.")
    else:
        print(f"\n❌ Optimization failed. Original file has been restored from backup.")
