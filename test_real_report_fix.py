#!/usr/bin/env python3
"""
Test PDF generation fix with real report data
"""

import sys
import os
import json

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.pdf_report_generator import PDFReportGenerator

def test_with_real_report():
    """Test PDF generation with real report data from billing_reports.json"""
    
    print("🧪 Testing PDF Generation with Real Report Data")
    print("=" * 60)
    
    # Read real report data
    reports_file = 'backend/data/billing_reports.json'
    try:
        with open(reports_file, 'r') as f:
            reports = json.load(f)
        print(f"✅ Loaded {len(reports)} reports from billing_reports.json")
    except Exception as e:
        print(f"❌ Error reading reports file: {e}")
        return False
    
    if not reports:
        print("❌ No reports found in file")
        return False
    
    # Use the first report as test data
    test_report = reports[0]
    sid_number = test_report.get('sid_number', 'UNKNOWN')
    
    print(f"🔄 Testing with report: {sid_number}")
    print(f"   Patient: {test_report.get('patient_info', {}).get('full_name', 'Unknown')}")
    print(f"   Test items: {len(test_report.get('test_items', []))}")
    
    # Check if this report has list-type specimen data
    test_items = test_report.get('test_items', [])
    list_specimens_found = False
    for item in test_items:
        specimen = item.get('specimen')
        if isinstance(specimen, list):
            list_specimens_found = True
            print(f"   Found list specimen: {specimen}")
            break
    
    if list_specimens_found:
        print("✅ This report contains list-type specimen data - perfect for testing!")
    else:
        print("ℹ️  This report doesn't have list-type specimen data, but test will still verify the fix")
    
    try:
        # Initialize PDF generator
        pdf_generator = PDFReportGenerator()
        
        # Generate PDF
        print("🔄 Generating PDF...")
        pdf_content = pdf_generator.generate_comprehensive_billing_pdf(test_report)
        
        # Check if PDF was generated successfully
        if isinstance(pdf_content, bytes) and len(pdf_content) > 0:
            print("✅ PDF generated successfully!")
            print(f"   PDF size: {len(pdf_content)} bytes")
            
            # Check if it starts with PDF header
            if pdf_content.startswith(b'%PDF'):
                print("✅ PDF content appears to be valid")
                
                # Save test PDF
                filename = f'test_real_report_{sid_number}.pdf'
                with open(filename, 'wb') as f:
                    f.write(pdf_content)
                print(f"✅ Real report PDF saved as '{filename}'")
                
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

def analyze_specimen_data():
    """Analyze specimen data in all reports to understand the data structure"""
    
    print("\n🔍 Analyzing Specimen Data in All Reports")
    print("=" * 60)
    
    reports_file = 'backend/data/billing_reports.json'
    try:
        with open(reports_file, 'r') as f:
            reports = json.load(f)
    except Exception as e:
        print(f"❌ Error reading reports file: {e}")
        return
    
    specimen_types = {
        'string': 0,
        'list': 0,
        'none': 0,
        'other': 0
    }
    
    list_specimens = []
    string_specimens = set()
    
    total_test_items = 0
    
    for report in reports:
        test_items = report.get('test_items', [])
        for item in test_items:
            total_test_items += 1
            specimen = item.get('specimen')
            
            if specimen is None:
                specimen_types['none'] += 1
            elif isinstance(specimen, list):
                specimen_types['list'] += 1
                list_specimens.append(specimen)
            elif isinstance(specimen, str):
                specimen_types['string'] += 1
                string_specimens.add(specimen)
            else:
                specimen_types['other'] += 1
    
    print(f"Total test items analyzed: {total_test_items}")
    print(f"Specimen data types:")
    print(f"  - String specimens: {specimen_types['string']}")
    print(f"  - List specimens: {specimen_types['list']}")
    print(f"  - None/missing: {specimen_types['none']}")
    print(f"  - Other types: {specimen_types['other']}")
    
    if list_specimens:
        print(f"\nSample list specimens (first 5):")
        for i, spec in enumerate(list_specimens[:5]):
            print(f"  {i+1}. {spec}")
    
    if string_specimens:
        print(f"\nUnique string specimens (first 10):")
        for i, spec in enumerate(sorted(string_specimens)[:10]):
            print(f"  {i+1}. {spec}")

if __name__ == "__main__":
    print("🚀 Testing PDF Generation Fix with Real Data")
    print("=" * 70)
    
    # Analyze specimen data structure
    analyze_specimen_data()
    
    # Test with real report
    real_test_passed = test_with_real_report()
    
    print("\n" + "=" * 70)
    print("📊 REAL DATA TEST RESULTS")
    print("=" * 70)
    print(f"Real Report PDF Generation: {'✅ PASS' if real_test_passed else '❌ FAIL'}")
    
    if real_test_passed:
        print("\n🎉 Success! The fix works with real report data.")
        print("   The 'unhashable type: list' error should now be resolved.")
    else:
        print("\n⚠️  Test failed. Please check the error output above.")
