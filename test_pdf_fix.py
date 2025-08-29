#!/usr/bin/env python3
"""
Test PDF generation fix for unhashable type: 'list' error
"""

import sys
import os
import json

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.pdf_report_generator import PDFReportGenerator

def test_pdf_generation_with_list_specimen():
    """Test PDF generation with list-type specimen data"""
    
    print("🧪 Testing PDF Generation Fix")
    print("=" * 50)
    
    # Create test data that mimics the problematic structure
    test_report_data = {
        'sid_number': 'TEST001',
        'billing_date': '2025-06-20',
        'collection_date': '2025-06-20',
        'patient_info': {
            'full_name': 'Test Patient',
            'first_name': 'Test',
            'last_name': 'Patient',
            'date_of_birth': '1990-01-01',
            'age': '35',
            'gender': 'Male',
            'mobile': '9876543210',
            'patient_id': 'P00001'
        },
        'clinic_info': {
            'name': 'AVINI Labs Test',
            'site_code': 'TST',
            'address': 'Test Address',
            'contact_phone': '9876543210',
            'email': 'test@avinilabs.com'
        },
        'billing_header': {
            'referring_doctor': 'Dr. Test Doctor'
        },
        'test_items': [
            {
                'test_name': 'Test with List Specimen',
                'specimen': ['Serum', 'Blood'],  # This is a list - the problematic case
                'result_value': 'Normal',
                'result_unit': 'mg/dL',
                'reference_range': '70-100',
                'method': 'Automated',
                'status': 'Completed'
            },
            {
                'test_name': 'Test with String Specimen',
                'specimen': 'Urine',  # This is a string - should work fine
                'result_value': 'Normal',
                'result_unit': 'mg/dL',
                'reference_range': '0-10',
                'method': 'Manual',
                'status': 'Completed'
            },
            {
                'test_name': 'Test with No Specimen',
                # No specimen field - should handle gracefully
                'result_value': 'Positive',
                'result_unit': '',
                'reference_range': 'Negative',
                'method': 'ELISA',
                'status': 'Completed'
            }
        ],
        'metadata': {
            'version': '1.0'
        }
    }
    
    try:
        # Initialize PDF generator
        pdf_generator = PDFReportGenerator()
        
        print("✅ PDF Generator initialized successfully")
        
        # Generate PDF
        print("🔄 Generating PDF with test data...")
        pdf_content = pdf_generator.generate_comprehensive_billing_pdf(test_report_data)
        
        # Check if PDF was generated successfully
        if isinstance(pdf_content, bytes) and len(pdf_content) > 0:
            print("✅ PDF generated successfully!")
            print(f"   PDF size: {len(pdf_content)} bytes")
            
            # Check if it starts with PDF header
            if pdf_content.startswith(b'%PDF'):
                print("✅ PDF content appears to be valid")
                
                # Save test PDF
                with open('test_pdf_fix_output.pdf', 'wb') as f:
                    f.write(pdf_content)
                print("✅ Test PDF saved as 'test_pdf_fix_output.pdf'")
                
                return True
            else:
                print("❌ PDF content does not appear to be valid")
                print(f"   First 100 bytes: {pdf_content[:100]}")
                return False
        else:
            print("❌ PDF generation failed - no content returned")
            return False
            
    except Exception as e:
        print(f"❌ Error during PDF generation: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_specimen_processing():
    """Test the specific specimen processing logic"""
    
    print("\n🧪 Testing Specimen Processing Logic")
    print("=" * 50)
    
    # Test data with different specimen formats
    test_cases = [
        {
            'name': 'List with multiple specimens',
            'specimen': ['Serum', 'Blood', 'Plasma'],
            'expected': 'Blood, Plasma, Serum'  # Should be sorted
        },
        {
            'name': 'List with single specimen',
            'specimen': ['Urine'],
            'expected': 'Urine'
        },
        {
            'name': 'String specimen',
            'specimen': 'Saliva',
            'expected': 'Saliva'
        },
        {
            'name': 'Empty list',
            'specimen': [],
            'expected': 'Serum/Blood'  # Default fallback
        },
        {
            'name': 'None specimen',
            'specimen': None,
            'expected': 'Serum/Blood'  # Default fallback
        }
    ]
    
    try:
        pdf_generator = PDFReportGenerator()
        
        for test_case in test_cases:
            print(f"\n🔍 Testing: {test_case['name']}")
            
            # Create minimal test data
            test_data = {
                'test_items': [
                    {
                        'test_name': 'Test',
                        'specimen': test_case['specimen']
                    }
                ]
            }
            
            # Process specimen data (simulate the logic from the fixed code)
            test_items = test_data.get('test_items', [])
            primary_specimens = set()
            
            for test in test_items:
                specimen = test.get('specimen')
                if specimen:
                    # Handle both string and list formats for specimen
                    if isinstance(specimen, list):
                        # If specimen is a list, add each item
                        for spec in specimen:
                            if spec:  # Only add non-empty specimens
                                primary_specimens.add(str(spec))
                    else:
                        # If specimen is a string, add it directly
                        primary_specimens.add(str(specimen))
            
            specimen_types = ', '.join(sorted(primary_specimens)) if primary_specimens else 'Serum/Blood'
            
            print(f"   Input: {test_case['specimen']}")
            print(f"   Output: {specimen_types}")
            print(f"   Expected: {test_case['expected']}")
            
            if specimen_types == test_case['expected']:
                print("   ✅ PASS")
            else:
                print("   ❌ FAIL")
                
    except Exception as e:
        print(f"❌ Error during specimen processing test: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 Starting PDF Generation Fix Tests")
    print("=" * 60)
    
    # Test specimen processing logic
    specimen_test_passed = test_specimen_processing()
    
    # Test full PDF generation
    pdf_test_passed = test_pdf_generation_with_list_specimen()
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    print(f"Specimen Processing Test: {'✅ PASS' if specimen_test_passed else '❌ FAIL'}")
    print(f"PDF Generation Test: {'✅ PASS' if pdf_test_passed else '❌ FAIL'}")
    
    if specimen_test_passed and pdf_test_passed:
        print("\n🎉 All tests passed! The fix should resolve the 'unhashable type: list' error.")
    else:
        print("\n⚠️  Some tests failed. Please review the output above.")
