#!/usr/bin/env python3
"""
Debug User Access to Billing Reports
Check what reports a specific user should see based on franchise access control
"""

import json
import sys
import os

# Add the parent directory to the path to import services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.billing_reports_service import BillingReportsService

def debug_user_access():
    """Debug what reports a user should see"""
    print("🔍 Debugging User Access to Billing Reports")
    print("=" * 60)
    
    # Initialize service
    service = BillingReportsService("backend/data")
    
    # Test user: mayiladhuthurai (ID: 19, tenant_id: 1, role: admin)
    user_tenant_id = 1
    user_role = "admin"
    
    print(f"👤 Testing User Access:")
    print(f"   User Tenant ID: {user_tenant_id}")
    print(f"   User Role: {user_role}")
    
    # Check franchise access filter
    franchise_filter = service.get_franchise_access_filter(user_tenant_id, user_role)
    print(f"   Franchise Filter: {franchise_filter}")
    
    # Load all reports
    reports = service.read_json_file(service.reports_file)
    print(f"\n📊 All Reports in Database: {len(reports)}")
    
    for report in reports:
        print(f"   - SID: {report.get('sid_number')} | Tenant ID: {report.get('tenant_id')} | Patient: {report.get('patient_info', {}).get('full_name')}")
    
    # Apply franchise filter
    if franchise_filter is not None:
        filtered_reports = [r for r in reports if r.get('tenant_id') in franchise_filter]
        print(f"\n🔒 After Franchise Filter: {len(filtered_reports)}")
        for report in filtered_reports:
            print(f"   - SID: {report.get('sid_number')} | Tenant ID: {report.get('tenant_id')} | Patient: {report.get('patient_info', {}).get('full_name')}")
    else:
        print(f"\n🌐 No Franchise Filter (Hub Admin): {len(reports)} reports visible")
        filtered_reports = reports
    
    # Test search function
    search_results = service.search_reports({}, user_tenant_id, user_role)
    print(f"\n🔍 Search Results: {len(search_results)}")
    for report in search_results:
        print(f"   - SID: {report.get('sid_number')} | Tenant ID: {report.get('tenant_id')} | Patient: {report.get('patient_info', {}).get('full_name')}")
    
    # Check tenants
    tenants = service.read_json_file(service.tenants_file)
    print(f"\n🏢 Tenants in Database:")
    for tenant in tenants:
        print(f"   - ID: {tenant.get('id')} | Name: {tenant.get('name')} | Prefix: {tenant.get('sid_prefix')}")
    
    # Check users
    users_file = os.path.join(service.data_dir, "users.json")
    users = service.read_json_file(users_file)
    mayiladhuthurai_user = next((u for u in users if u.get('id') == 19), None)
    print(f"\n👤 Mayiladhuthurai User Details:")
    if mayiladhuthurai_user:
        print(f"   - ID: {mayiladhuthurai_user.get('id')}")
        print(f"   - Username: {mayiladhuthurai_user.get('username')}")
        print(f"   - Role: {mayiladhuthurai_user.get('role')}")
        print(f"   - Tenant ID: {mayiladhuthurai_user.get('tenant_id')}")
        print(f"   - Email: {mayiladhuthurai_user.get('email')}")
    else:
        print("   User not found!")

if __name__ == "__main__":
    debug_user_access()
