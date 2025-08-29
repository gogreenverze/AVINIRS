#!/usr/bin/env python3
"""
Check recent billing reports
"""

import json
import os

def check_recent_reports():
    """Check recent billing reports"""
    os.chdir('backend')  # Change to backend directory
    
    with open('data/billing_reports.json', 'r') as f:
        reports = json.load(f)
    
    print("=" * 60)
    print("RECENT BILLING REPORTS ANALYSIS")
    print("=" * 60)
    
    # Filter reports from today
    recent_reports = [r for r in reports if r.get('generation_timestamp', '').startswith('2025-08-21')]
    print(f"Reports generated today: {len(recent_reports)}")
    
    # Check last 5 reports
    last_reports = reports[-5:]
    print(f"\nLast 5 reports:")
    for i, report in enumerate(last_reports):
        sid = report.get('sid_number')
        test_count = len(report.get('test_items', []))
        timestamp = report.get('generation_timestamp', '')
        print(f"  {i+1}. {sid} - {test_count} tests - {timestamp}")
        
        # Check for profile tests
        test_items = report.get('test_items', [])
        profile_tests = [t for t in test_items if t.get('is_profile_subtest')]
        individual_tests = [t for t in test_items if not t.get('is_profile_subtest')]
        
        print(f"     Profile sub-tests: {len(profile_tests)}")
        print(f"     Individual tests: {len(individual_tests)}")
        
        if len(profile_tests) > 0:
            print(f"     ✅ Has profile expansion")
        else:
            print(f"     ⚠️  No profile expansion")

if __name__ == "__main__":
    check_recent_reports()
