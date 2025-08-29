#!/usr/bin/env python3
"""
Test script to generate a sample billing report using the new PRABAGARAN format
This demonstrates the redesigned PDF generator with professional medical report layout
"""

import sys
import os
from datetime import datetime

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.pdf_report_generator import PDFReportGenerator

def create_sample_report_data():
    """Create sample report data that matches the application's data structure"""
    return {
        'id': 1,
        'sid_number': 'MYD001',
        'billing_id': 1,
        'patient_id': 1,
        'tenant_id': 1,
        'billing_date': '2025-06-20',
        'due_date': '2025-07-20',
        'generation_timestamp': datetime.now().isoformat(),
        'report_version': '1.0',
        
        # Patient Information
        'patient_info': {
            'full_name': 'PRABAGARAN S',
            'first_name': 'PRABAGARAN',
            'last_name': 'S',
            'date_of_birth': '1985-03-15',
            'age': '39',
            'gender': 'Male',
            'blood_group': 'B+',
            'mobile': '9876543210',
            'email': 'prabagaran.s@example.com',
            'address': {
                'street': '123, Main Street',
                'city': 'Mayiladuthurai',
                'state': 'Tamil Nadu',
                'postal_code': '609001'
            },
            'patient_id': 'MYD001'
        },
        
        # Clinic Information
        'clinic_info': {
            'name': 'AVINI Labs Mayiladuthurai',
            'site_code': 'MYD',
            'address': 'Main Hub, Mayiladuthurai, Tamil Nadu - 609001',
            'contact_phone': '6384440505',
            'email': 'hub@avinilabs.com',
            'is_hub': True
        },
        
        # Billing Header
        'billing_header': {
            'invoice_number': 'INV00001',
            'billing_period': '2025-06-20 to 2025-07-20',
            'referring_doctor': 'Dr. Rajesh Kumar, MD',
            'payment_status': 'Paid',
            'payment_method': 'UPI'
        },
        
        # Test Items with enhanced data
        'test_items': [
            {
                'test_name': 'Complete Blood Count (CBC)',
                'quantity': 1,
                'price': 350,
                'amount': 350,
                'id': 1,
                'test_master_data': {
                    'id': 1,
                    'testName': 'Complete Blood Count (CBC)',
                    'hmsCode': '1.0',
                    'department': 'HEMATOLOGY',
                    'primarySpecimen': 'EDTA Blood',
                    'method': 'Automated Cell Counter',
                    'referenceRange': 'Age and Gender Specific',
                    'unit': 'Various',
                    'interpretation': 'Complete evaluation of blood cells including RBC, WBC, and Platelets',
                    'instructions': 'No special preparation required'
                },
                'result_value': 'Normal',
                'status': 'Completed'
            },
            {
                'test_name': 'Lipid Profile',
                'quantity': 1,
                'price': 600,
                'amount': 600,
                'id': 2,
                'test_master_data': {
                    'id': 2,
                    'testName': 'Lipid Profile',
                    'hmsCode': '2.0',
                    'department': 'BIOCHEMISTRY',
                    'primarySpecimen': 'Serum',
                    'method': 'Enzymatic Method',
                    'referenceRange': 'See Individual Parameters',
                    'unit': 'mg/dL',
                    'interpretation': 'Cardiovascular risk assessment panel',
                    'instructions': '12-14 hours fasting required'
                },
                'result_value': 'Within Normal Limits',
                'status': 'Completed'
            },
            {
                'test_name': 'HbA1c',
                'quantity': 1,
                'price': 450,
                'amount': 450,
                'id': 3,
                'test_master_data': {
                    'id': 3,
                    'testName': 'HbA1c (Glycated Hemoglobin)',
                    'hmsCode': '3.0',
                    'department': 'BIOCHEMISTRY',
                    'primarySpecimen': 'EDTA Blood',
                    'method': 'HPLC',
                    'referenceRange': '<5.7% (Normal), 5.7-6.4% (Prediabetes), ≥6.5% (Diabetes)',
                    'unit': '%',
                    'interpretation': 'Average blood glucose control over 2-3 months',
                    'instructions': 'No fasting required'
                },
                'result_value': '5.2%',
                'status': 'Completed'
            }
        ],
        
        # Financial Summary
        'financial_summary': {
            'bill_amount': 1400,
            'other_charges': 0,
            'discount_percent': 0,
            'discount_amount': 0,
            'subtotal': 1400,
            'gst_rate': 18,
            'gst_amount': 252,
            'total_amount': 1652,
            'paid_amount': 1652,
            'balance': 0
        },
        
        # Additional fields for specimen collection
        'collection_date': '2025-06-20',
        'collection_time': '09:30 AM',
        'collection_method': 'Venipuncture',
        'fasting_status': '12 hours fasting',
        
        # Metadata
        'metadata': {
            'created_at': datetime.now().isoformat(),
            'created_by': 1,
            'status': 'generated',
            'test_match_success_rate': 1.0,
            'total_tests': 3,
            'matched_tests_count': 3,
            'unmatched_tests_count': 0
        }
    }

def main():
    """Generate and save a sample PRABAGARAN format report"""
    print("Generating sample billing report in PRABAGARAN format...")
    
    try:
        # Create PDF generator
        pdf_generator = PDFReportGenerator()
        
        # Create sample data
        report_data = create_sample_report_data()
        
        # Generate PDF
        pdf_content = pdf_generator.generate_comprehensive_billing_pdf(report_data)
        
        # Save to file
        output_filename = f"sample_prabagaran_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        with open(output_filename, 'wb') as f:
            f.write(pdf_content)
        
        print(f"✓ Sample report generated successfully: {output_filename}")
        print(f"✓ PDF size: {len(pdf_content)} bytes")
        print(f"✓ Patient: {report_data['patient_info']['full_name']}")
        print(f"✓ SID: {report_data['sid_number']}")
        print(f"✓ Tests: {len(report_data['test_items'])}")
        print("\nThe report has been generated with the new PRABAGARAN format:")
        print("- Professional header with clinic information")
        print("- Clean patient demographics section")
        print("- Non-tabular test results layout")
        print("- Proper specimen collection information")
        print("- Professional signature and certification section")
        print("- Improved typography and spacing")
        
    except Exception as e:
        print(f"✗ Error generating sample report: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
