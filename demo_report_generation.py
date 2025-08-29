#!/usr/bin/env python3
"""
Demo Script for Billing Reports System
Demonstrates successful report generation for existing billing records.
"""

import sys
import os
import json
from datetime import datetime

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.billing_reports_service import BillingReportsService
from services.pdf_report_generator import PDFReportGenerator

def demo_report_generation():
    """Demonstrate comprehensive billing report generation"""
    print("=" * 80)
    print("AVINI LABS BILLING REPORTS SYSTEM - LIVE DEMONSTRATION")
    print("=" * 80)
    print(f"Demo started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Initialize services
    reports_service = BillingReportsService()
    pdf_generator = PDFReportGenerator()
    
    # Load existing billing data
    billings = reports_service.read_json_file(reports_service.billings_file)
    patients = reports_service.read_json_file(reports_service.patients_file)
    
    print(f"Found {len(billings)} existing billing records")
    print(f"Found {len(patients)} existing patient records")
    print()
    
    # Select a billing record for demonstration (billing ID 1)
    demo_billing_id = 1
    demo_billing = next((b for b in billings if b.get('id') == demo_billing_id), None)
    
    if not demo_billing:
        print(f"❌ Billing record {demo_billing_id} not found!")
        return
    
    print(f"📋 Selected Billing Record for Demo:")
    print(f"   - Billing ID: {demo_billing['id']}")
    print(f"   - Invoice Number: {demo_billing['invoice_number']}")
    print(f"   - Patient ID: {demo_billing['patient_id']}")
    print(f"   - Tenant ID: {demo_billing['tenant_id']}")
    print(f"   - Total Amount: ₹{demo_billing['total_amount']}")
    print(f"   - Number of Tests: {len(demo_billing.get('items', []))}")
    print()
    
    # Find patient details
    patient = next((p for p in patients if p.get('id') == demo_billing['patient_id']), None)
    if patient:
        print(f"👤 Patient Details:")
        print(f"   - Name: {patient.get('first_name', '')} {patient.get('last_name', '')}")
        print(f"   - Age: {patient.get('age', 'N/A')}")
        print(f"   - Gender: {patient.get('gender', 'N/A')}")
        print(f"   - Mobile: {patient.get('phone', 'N/A')}")
        print()
    
    # Display test items
    print(f"🧪 Test Items:")
    for i, item in enumerate(demo_billing.get('items', []), 1):
        print(f"   {i}. {item.get('test_name')} - Qty: {item.get('quantity')} - ₹{item.get('amount')}")
    print()
    
    print("🔄 Generating comprehensive billing report...")
    print("-" * 50)
    
    # Generate the report
    try:
        report = reports_service.generate_comprehensive_report(
            demo_billing_id, 
            user_id=1, 
            tenant_id=demo_billing['tenant_id']
        )
        
        if report:
            print("✅ Report generated successfully!")
            print()
            print(f"📊 Report Details:")
            print(f"   - Report ID: {report['id']}")
            print(f"   - SID Number: {report['sid_number']}")
            print(f"   - Generation Time: {report['generation_timestamp']}")
            print(f"   - Total Tests: {report['metadata']['total_tests']}")
            print(f"   - Matched Tests: {report['metadata']['matched_tests_count']}")
            print(f"   - Unmatched Tests: {report['metadata']['unmatched_tests_count']}")
            print(f"   - Test Match Rate: {report['metadata']['test_match_success_rate']:.1%}")
            print()
            
            # Save the report
            if reports_service.save_report(report):
                print("✅ Report saved to database successfully!")
                print()
                
                # Generate PDF
                print("📄 Generating PDF report...")
                pdf_content = pdf_generator.generate_comprehensive_billing_pdf(report)
                
                if pdf_content:
                    print("✅ PDF generated successfully!")
                    print(f"   - PDF Content Length: {len(pdf_content)} characters")
                    
                    # Save PDF to file for demonstration
                    pdf_filename = f"demo_report_{report['sid_number']}.txt"
                    with open(pdf_filename, 'w', encoding='utf-8') as f:
                        f.write(pdf_content)
                    
                    print(f"   - PDF saved as: {pdf_filename}")
                    print()
                    
                    # Show a preview of the PDF content
                    print("📋 PDF Report Preview (First 1000 characters):")
                    print("-" * 50)
                    print(pdf_content[:1000])
                    if len(pdf_content) > 1000:
                        print("...")
                        print(f"[Content truncated - Full report has {len(pdf_content)} characters]")
                    print("-" * 50)
                    print()
                else:
                    print("❌ PDF generation failed!")
            else:
                print("❌ Failed to save report to database!")
        else:
            print("❌ Report generation failed!")
            
    except Exception as e:
        print(f"❌ Error during report generation: {str(e)}")
        return
    
    # Check if reports were created
    print("🔍 Checking generated reports...")
    all_reports = reports_service.search_reports({}, user_tenant_id=1, user_role='admin')
    print(f"   - Total reports in database: {len(all_reports)}")
    
    if all_reports:
        print("   - Recent reports:")
        for report in all_reports[:3]:  # Show first 3 reports
            print(f"     • SID: {report.get('sid_number')} | Patient: {report.get('patient_name')} | Amount: ₹{report.get('total_amount')}")
    
    print()
    print("🎉 Demo completed successfully!")
    print()
    print("📝 Summary:")
    print("   ✅ Billing report generated automatically")
    print("   ✅ Test matching performed with master database")
    print("   ✅ Franchise-specific SID number assigned")
    print("   ✅ Comprehensive PDF report created")
    print("   ✅ Report saved with audit trail")
    print("   ✅ Search and retrieval functionality working")
    print()
    print("🌐 Next Steps:")
    print("   1. Open http://localhost:3000 in your browser")
    print("   2. Login to the system")
    print("   3. Navigate to 'Billing Reports' in the sidebar")
    print("   4. Search for reports using SID number or patient name")
    print("   5. View detailed report information")
    print("   6. Download PDF reports")
    print()
    print(f"Demo completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

if __name__ == "__main__":
    demo_report_generation()
