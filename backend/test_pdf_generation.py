#!/usr/bin/env python3
"""
Simple test script to verify PDF generation is working
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.pdf_report_generator import PDFReportGenerator
from datetime import datetime

def test_simple_pdf():
    """Test basic PDF generation with minimal data"""
    print("Testing PDF generation...")
    
    # Create PDF generator
    generator = PDFReportGenerator()
    
    # Simple test data
    test_data = {
        'sid_number': 'TEST001',
        'billing_date': '2025-06-20',
        'generation_timestamp': datetime.now().isoformat(),
        'status': 'generated',
        'patient_info': {
            'full_name': 'Test Patient',
            'patient_id': 'P001',
            'age': '30',
            'gender': 'Male',
            'blood_group': 'O+',
            'mobile': '9876543210',
            'email': 'test@example.com',
            'date_of_birth': '1993-06-20'
        },
        'clinic_info': {
            'name': 'AVINI Labs Test',
            'site_code': 'TST',
            'phone': '9876543210',
            'email': 'test@avinilabs.com'
        },
        'billing_header': {
            'invoice_number': 'INV-2025-001',
            'referring_doctor': 'Dr. Test Doctor',
            'payment_status': 'Paid',
            'payment_method': 'Cash'
        },
        'test_items': [
            {
                'test_name': 'Complete Blood Count',
                'short_name': 'CBC',
                'test_master_id': 'T001',
                'department': 'HEMATOLOGY',
                'specimen': 'Blood',
                'price': 250.00,
                'quantity': 1,
                'test_master_data': {
                    'hmsCode': 'H001',
                    'department': 'HEMATOLOGY',
                    'primarySpecimen': 'Blood',
                    'referenceRange': '4.5-11.0 x10^3/uL',
                    'instructions': 'Fasting not required'
                }
            },
            {
                'test_name': 'Lipid Profile',
                'short_name': 'LIPID',
                'test_master_id': 'T002',
                'department': 'BIOCHEMISTRY',
                'specimen': 'Serum',
                'price': 400.00,
                'quantity': 1,
                'test_master_data': {
                    'hmsCode': 'B002',
                    'department': 'BIOCHEMISTRY',
                    'primarySpecimen': 'Serum',
                    'referenceRange': 'Total Cholesterol: <200 mg/dL',
                    'instructions': '12 hours fasting required'
                }
            }
        ],
        'financial_summary': {
            'bill_amount': 650.00,
            'other_charges': 0.00,
            'discount_percent': 10,
            'discount_amount': 65.00,
            'subtotal': 585.00,
            'gst_rate': 18,
            'gst_amount': 105.30,
            'total_amount': 690.30,
            'paid_amount': 690.30,
            'balance': 0.00
        },
        'unmatched_tests': ['Unknown Test 1', 'Unknown Test 2'],
        'metadata': {
            'total_tests': 1,
            'matched_tests_count': 1,
            'unmatched_tests_count': 0,
            'test_match_success_rate': 1.0
        }
    }
    
    try:
        # Generate PDF
        pdf_content = generator.generate_comprehensive_billing_pdf(test_data)
        
        if pdf_content and len(pdf_content) > 0:
            # Save test PDF
            with open('test_output.pdf', 'wb') as f:
                f.write(pdf_content)
            print("✅ PDF generated successfully!")
            print(f"📄 PDF size: {len(pdf_content)} bytes")
            print("📁 Saved as: test_output.pdf")
            return True
        else:
            print("❌ PDF generation failed - empty content")
            return False
            
    except Exception as e:
        print(f"❌ PDF generation failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_simple_pdf()
    if success:
        print("\n🎉 PDF generation test PASSED!")
    else:
        print("\n💥 PDF generation test FAILED!")
        sys.exit(1)
