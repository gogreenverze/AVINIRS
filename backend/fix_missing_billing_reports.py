#!/usr/bin/env python3
"""
Fix Missing Billing Reports Script
This script generates missing billing reports for billing records that exist but don't have corresponding reports.
"""

import json
import os
import sys
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.billing_reports_service import BillingReportsService

def load_json_file(file_path):
    """Load JSON data from file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return []
    except json.JSONDecodeError as e:
        print(f"Error reading JSON file {file_path}: {e}")
        return []

def main():
    """Main function to fix missing billing reports"""
    print("🔧 Starting Missing Billing Reports Fix...")
    print("=" * 60)
    
    # Initialize the billing reports service
    reports_service = BillingReportsService()
    
    # Load existing data
    billings = load_json_file('data/billings.json')
    billing_reports = load_json_file('data/billing_reports.json')
    
    print(f"📊 Found {len(billings)} billing records")
    print(f"📋 Found {len(billing_reports)} billing reports")
    
    # Find billing records that don't have corresponding reports
    existing_billing_ids = {report.get('billing_id') for report in billing_reports}
    missing_reports = []
    
    for billing in billings:
        billing_id = billing.get('id')
        if billing_id not in existing_billing_ids:
            missing_reports.append(billing)
    
    print(f"❌ Found {len(missing_reports)} billing records without reports")
    
    if not missing_reports:
        print("✅ All billing records have corresponding reports!")
        return
    
    # Show details of missing reports
    print("\n📝 Missing Reports Details:")
    print("-" * 40)
    for billing in missing_reports:
        sid = billing.get('sid_number', 'N/A')
        invoice = billing.get('invoice_number', 'N/A')
        tenant_id = billing.get('tenant_id', 'N/A')
        patient_id = billing.get('patient_id', 'N/A')
        total = billing.get('total_amount', 0)
        print(f"  • ID: {billing.get('id')}, SID: {sid}, Invoice: {invoice}")
        print(f"    Tenant: {tenant_id}, Patient: {patient_id}, Amount: ₹{total}")
    
    # Ask for confirmation
    print(f"\n🤔 Do you want to generate {len(missing_reports)} missing reports? (y/n): ", end="")
    response = input().strip().lower()
    
    if response != 'y':
        print("❌ Operation cancelled.")
        return
    
    # Generate missing reports
    print(f"\n🚀 Generating {len(missing_reports)} missing reports...")
    print("-" * 50)
    
    success_count = 0
    error_count = 0
    
    for billing in missing_reports:
        billing_id = billing.get('id')
        sid_number = billing.get('sid_number', 'N/A')
        
        try:
            print(f"  📄 Generating report for Billing ID {billing_id} (SID: {sid_number})...")
            
            # Generate the comprehensive report
            report = reports_service.generate_comprehensive_report(
                billing_id=billing_id,
                user_id=billing.get('created_by', 1),
                tenant_id=billing.get('tenant_id', 1)
            )
            
            if report:
                # Save the report
                if reports_service.save_report(report):
                    print(f"    ✅ Successfully generated report for SID: {sid_number}")
                    success_count += 1
                else:
                    print(f"    ❌ Failed to save report for SID: {sid_number}")
                    error_count += 1
            else:
                print(f"    ❌ Failed to generate report for SID: {sid_number}")
                error_count += 1
                
        except Exception as e:
            print(f"    ❌ Error generating report for SID {sid_number}: {str(e)}")
            error_count += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 SUMMARY:")
    print(f"  ✅ Successfully generated: {success_count} reports")
    print(f"  ❌ Failed to generate: {error_count} reports")
    print(f"  📈 Total processed: {success_count + error_count} billing records")
    
    if success_count > 0:
        print(f"\n🎉 {success_count} billing reports have been generated!")
        print("   These records should now appear in the billing reports list.")
    
    if error_count > 0:
        print(f"\n⚠️  {error_count} reports failed to generate.")
        print("   Please check the logs for more details.")

if __name__ == "__main__":
    main()
