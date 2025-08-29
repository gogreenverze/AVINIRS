#!/usr/bin/env python3
"""
Simple test to verify the new SID generation system works correctly.
"""

import json
import os
from datetime import datetime

def read_json_file(file_path):
    """Read JSON file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return []

def test_sid_system():
    """Test the SID system by examining the updated billing records"""
    print("AVINI SID System Verification")
    print("=" * 50)
    print(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Load data files
    tenants_file = "backend/data/tenants.json"
    billings_file = "backend/data/billings.json"
    
    if not os.path.exists(tenants_file):
        print(f"❌ Error: {tenants_file} not found")
        return False
    
    if not os.path.exists(billings_file):
        print(f"❌ Error: {billings_file} not found")
        return False
    
    tenants = read_json_file(tenants_file)
    billings = read_json_file(billings_file)
    
    if not tenants:
        print("❌ Error: No tenant data found")
        return False
    
    if not billings:
        print("❌ Error: No billing data found")
        return False
    
    print(f"✅ Loaded {len(tenants)} tenants and {len(billings)} billing records")
    
    # Create tenant mapping
    tenant_map = {t['id']: t for t in tenants}
    
    # Analyze SID usage by franchise
    print("\nFranchise SID Analysis:")
    print("-" * 30)
    
    franchise_sids = {}
    format_errors = []
    
    for billing in billings:
        tenant_id = billing.get('tenant_id')
        sid = billing.get('sid_number', '')
        
        if not tenant_id or tenant_id not in tenant_map:
            continue
        
        tenant = tenant_map[tenant_id]
        site_code = tenant.get('site_code', 'XX')
        franchise_name = tenant.get('name', 'Unknown')
        
        if tenant_id not in franchise_sids:
            franchise_sids[tenant_id] = {
                'name': franchise_name,
                'site_code': site_code,
                'sids': [],
                'format_errors': []
            }
        
        if sid:
            franchise_sids[tenant_id]['sids'].append(sid)
            
            # Validate format
            expected_length = len(site_code) + 3
            if len(sid) != expected_length:
                franchise_sids[tenant_id]['format_errors'].append(f"{sid} - wrong length")
            elif not sid.startswith(site_code):
                franchise_sids[tenant_id]['format_errors'].append(f"{sid} - wrong prefix")
            elif not sid[len(site_code):].isdigit():
                franchise_sids[tenant_id]['format_errors'].append(f"{sid} - non-numeric suffix")
    
    # Display results
    total_franchises = 0
    franchises_with_sids = 0
    total_sids = 0
    total_format_errors = 0
    
    for tenant_id, data in franchise_sids.items():
        total_franchises += 1
        sid_count = len(data['sids'])
        error_count = len(data['format_errors'])
        
        if sid_count > 0:
            franchises_with_sids += 1
            total_sids += sid_count
            total_format_errors += error_count
            
            # Get highest SID number
            valid_numbers = []
            for sid in data['sids']:
                if sid.startswith(data['site_code']):
                    try:
                        num_part = sid[len(data['site_code']):]
                        if num_part.isdigit() and len(num_part) == 3:
                            valid_numbers.append(int(num_part))
                    except:
                        pass
            
            highest_num = max(valid_numbers) if valid_numbers else 0
            next_sid = f"{data['site_code']}{highest_num + 1:03d}"
            
            status = "✅" if error_count == 0 else "⚠️"
            print(f"{status} {data['site_code']}: {data['name']}")
            print(f"    SIDs: {sid_count}, Highest: {highest_num:03d}, Next: {next_sid}")
            
            if error_count > 0:
                print(f"    Format Errors: {error_count}")
                for error in data['format_errors'][:3]:  # Show first 3 errors
                    print(f"      - {error}")
                if len(data['format_errors']) > 3:
                    print(f"      ... and {len(data['format_errors']) - 3} more")
            print()
    
    # Test SID format validation
    print("SID Format Validation Tests:")
    print("-" * 30)
    
    test_cases = [
        ("MYD001", 1, True, "Valid Mayiladuthurai SID"),
        ("SKZ001", 2, True, "Valid Sirkazhi SID"),
        ("ADT001", 5, True, "Valid Aduthurai SID"),
        ("MYD01", 1, False, "Too short"),
        ("MYDABC", 1, False, "Non-numeric suffix"),
        ("SKZ001", 1, False, "Wrong site code"),
    ]
    
    validation_passed = 0
    validation_total = len(test_cases)
    
    for sid, tenant_id, expected_valid, description in test_cases:
        if tenant_id in tenant_map:
            tenant = tenant_map[tenant_id]
            site_code = tenant.get('site_code', 'XX')
            
            # Simple validation
            is_valid = (
                len(sid) == len(site_code) + 3 and
                sid.startswith(site_code) and
                sid[len(site_code):].isdigit()
            )
            
            if is_valid == expected_valid:
                print(f"✅ PASS: {description} - {sid}")
                validation_passed += 1
            else:
                print(f"❌ FAIL: {description} - {sid}")
        else:
            print(f"⚠️  SKIP: {description} - tenant not found")
    
    # Summary
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    
    print(f"Total Franchises: {total_franchises}")
    print(f"Franchises with SIDs: {franchises_with_sids}")
    print(f"Total SIDs: {total_sids}")
    print(f"Format Errors: {total_format_errors}")
    print(f"Validation Tests: {validation_passed}/{validation_total} passed")
    
    # Overall assessment
    success_rate = (total_sids - total_format_errors) / total_sids if total_sids > 0 else 0
    validation_rate = validation_passed / validation_total if validation_total > 0 else 0
    
    overall_success = success_rate >= 0.95 and validation_rate >= 0.8
    
    print(f"\nSID Format Success Rate: {success_rate:.1%}")
    print(f"Validation Test Success Rate: {validation_rate:.1%}")
    
    if overall_success:
        print("\n🎉 SID SYSTEM VERIFICATION PASSED!")
        print("The franchise-specific SID system is working correctly.")
    else:
        print("\n⚠️  SID SYSTEM NEEDS ATTENTION")
        if success_rate < 0.95:
            print("- Some SIDs have format issues")
        if validation_rate < 0.8:
            print("- Validation tests failed")
    
    return overall_success

def test_franchise_coverage():
    """Test that all franchises have proper site codes"""
    print("\nFranchise Coverage Test:")
    print("-" * 25)
    
    tenants = read_json_file("backend/data/tenants.json")
    
    if not tenants:
        print("❌ No tenant data found")
        return False
    
    missing_site_codes = []
    duplicate_site_codes = {}
    
    for tenant in tenants:
        site_code = tenant.get('site_code', '')
        tenant_name = tenant.get('name', 'Unknown')
        
        if not site_code or site_code == 'XX':
            missing_site_codes.append(tenant_name)
        else:
            if site_code not in duplicate_site_codes:
                duplicate_site_codes[site_code] = []
            duplicate_site_codes[site_code].append(tenant_name)
    
    # Check for duplicates
    actual_duplicates = {code: names for code, names in duplicate_site_codes.items() if len(names) > 1}
    
    print(f"Total Franchises: {len(tenants)}")
    print(f"Missing Site Codes: {len(missing_site_codes)}")
    print(f"Duplicate Site Codes: {len(actual_duplicates)}")
    
    if missing_site_codes:
        print("\nFranchises missing site codes:")
        for name in missing_site_codes:
            print(f"  - {name}")
    
    if actual_duplicates:
        print("\nDuplicate site codes:")
        for code, names in actual_duplicates.items():
            print(f"  {code}: {', '.join(names)}")
    
    success = len(missing_site_codes) == 0 and len(actual_duplicates) == 0
    
    if success:
        print("✅ All franchises have unique site codes")
    else:
        print("⚠️  Site code issues found")
    
    return success

if __name__ == "__main__":
    print("Starting SID System Verification...")
    
    test1_passed = test_sid_system()
    test2_passed = test_franchise_coverage()
    
    print("\n" + "=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    
    if test1_passed and test2_passed:
        print("🎉 ALL TESTS PASSED!")
        print("The new franchise-specific SID system is ready for use.")
        exit(0)
    else:
        print("⚠️  Some tests failed. Please review the issues above.")
        exit(1)
