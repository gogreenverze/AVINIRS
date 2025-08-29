#!/usr/bin/env python3
"""
Debug script to test billing report creation
"""

import sys
import os
import json
from datetime import datetime

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_billing_report_creation():
    """Test the billing report creation process"""
    print("Testing Billing Report Creation")
    print("=" * 40)
    
    try:
        # Import the service
        from services.billing_reports_service import BillingReportsService
        
        # Initialize service
        reports_service = BillingReportsService()
        print("✅ BillingReportsService initialized successfully")
        
        # Load existing billings to test with
        with open('data/billings.json', 'r', encoding='utf-8') as f:
            billings = json.load(f)
        
        if not billings:
            print("❌ No billings found to test with")
            return False
        
        # Get the latest billing
        latest_billing = billings[-1]
        billing_id = latest_billing['id']
        tenant_id = latest_billing['tenant_id']
        
        print(f"Testing with billing ID: {billing_id}")
        print(f"Tenant ID: {tenant_id}")
        
        # Test SID generation first
        print("\n1. Testing SID Generation:")
        try:
            sid = reports_service.generate_sid_number(tenant_id)
            print(f"✅ Generated SID: {sid}")
        except Exception as e:
            print(f"❌ SID generation failed: {e}")
            return False
        
        # Test report generation
        print("\n2. Testing Report Generation:")
        try:
            report = reports_service.generate_comprehensive_report(
                billing_id, 
                user_id=1, 
                tenant_id=tenant_id
            )
            
            if report:
                print(f"✅ Report generated successfully!")
                print(f"   Report ID: {report['id']}")
                print(f"   SID: {report['sid_number']}")
                print(f"   Patient: {report['patient_info']['full_name']}")
                print(f"   Tests: {len(report['test_items'])} matched, {len(report['unmatched_tests'])} unmatched")
                
                # Test saving
                print("\n3. Testing Report Saving:")
                if reports_service.save_report(report):
                    print("✅ Report saved successfully!")
                    return True
                else:
                    print("❌ Failed to save report")
                    return False
            else:
                print("❌ Report generation returned None")
                return False
                
        except Exception as e:
            print(f"❌ Report generation failed: {e}")
            import traceback
            traceback.print_exc()
            return False
            
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_sid_generation_for_all_tenants():
    """Test SID generation for all tenants"""
    print("\n" + "=" * 40)
    print("Testing SID Generation for All Tenants")
    print("=" * 40)
    
    try:
        from services.billing_reports_service import BillingReportsService
        
        reports_service = BillingReportsService()
        
        # Load tenants
        with open('data/tenants.json', 'r', encoding='utf-8') as f:
            tenants = json.load(f)
        
        print(f"Testing SID generation for {len(tenants)} tenants:")
        
        for tenant in tenants:
            tenant_id = tenant['id']
            tenant_name = tenant['name']
            site_code = tenant['site_code']
            
            try:
                sid = reports_service.generate_sid_number(tenant_id)
                print(f"✅ {site_code}: {sid} ({tenant_name})")
            except Exception as e:
                print(f"❌ {site_code}: Failed - {e} ({tenant_name})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_file_permissions():
    """Check if we can read/write required files"""
    print("\n" + "=" * 40)
    print("Checking File Permissions")
    print("=" * 40)
    
    files_to_check = [
        'data/billings.json',
        'data/billing_reports.json',
        'data/tenants.json',
        'data/patients.json',
        'data/test_master.json'
    ]
    
    all_good = True
    
    for file_path in files_to_check:
        try:
            # Test read
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Test write (backup and restore)
            backup_path = f"{file_path}.test_backup"
            with open(backup_path, 'w', encoding='utf-8') as f:
                json.dump(data, f)
            
            os.remove(backup_path)
            
            print(f"✅ {file_path}: Read/Write OK")
            
        except Exception as e:
            print(f"❌ {file_path}: {e}")
            all_good = False
    
    return all_good

if __name__ == "__main__":
    print("AVINI Billing Reports Debug Tool")
    print("=" * 50)
    
    # Check file permissions first
    if not check_file_permissions():
        print("\n❌ File permission issues detected!")
        sys.exit(1)
    
    # Test SID generation for all tenants
    if not test_sid_generation_for_all_tenants():
        print("\n❌ SID generation test failed!")
        sys.exit(1)
    
    # Test full billing report creation
    if test_billing_report_creation():
        print("\n🎉 All tests passed! Billing report creation is working.")
    else:
        print("\n❌ Billing report creation test failed!")
        sys.exit(1)
