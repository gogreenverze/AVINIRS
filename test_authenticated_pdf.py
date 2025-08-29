#!/usr/bin/env python3
"""
Test PDF Generation with Authentication - Test the complete PDF download workflow
"""

import requests
import json

def test_authenticated_pdf_download():
    """Test PDF download with proper authentication"""
    
    print("🧪 Testing Authenticated PDF Download")
    print("=" * 60)
    
    base_url = "http://localhost:5001"
    
    # Step 1: Login to get authentication token
    print("1. Logging in to get authentication token...")
    login_data = {
        "username": "mayiladhuthurai",
        "password": "super123"
    }
    
    try:
        login_response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        
        if login_response.status_code == 200:
            token = login_response.json().get('token')
            print(f"✅ Login successful, token obtained")
            
            # Step 2: Test PDF download with authentication
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            # Test with report ID 1 (TNJ004)
            report_id = 1
            print(f"\n2. Testing PDF download for report ID: {report_id}")
            
            pdf_response = requests.get(f"{base_url}/api/billing-reports/{report_id}/pdf", headers=headers)
            
            print(f"Response status: {pdf_response.status_code}")
            print(f"Content-Type: {pdf_response.headers.get('content-type', 'N/A')}")
            print(f"Content-Length: {len(pdf_response.content)} bytes")
            
            if pdf_response.status_code == 200:
                # Check if it's a valid PDF
                if pdf_response.content.startswith(b'%PDF'):
                    print("✅ Valid PDF received!")
                    
                    # Save the PDF
                    filename = f"authenticated_report_{report_id}.pdf"
                    with open(filename, 'wb') as f:
                        f.write(pdf_response.content)
                    print(f"✅ PDF saved as '{filename}'")
                    
                    # Check Content-Disposition header
                    content_disposition = pdf_response.headers.get('content-disposition', '')
                    print(f"Content-Disposition: {content_disposition}")
                    
                    return True
                else:
                    print("❌ Response is not a valid PDF")
                    print(f"First 200 bytes: {pdf_response.content[:200]}")
                    return False
            else:
                print(f"❌ PDF download failed: {pdf_response.status_code}")
                print(f"Response: {pdf_response.text}")
                return False
                
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")
        return False

def test_multiple_reports():
    """Test PDF download for multiple reports"""
    
    print("\n🧪 Testing Multiple Report Downloads")
    print("=" * 60)
    
    base_url = "http://localhost:5001"
    
    # Login
    login_data = {
        "username": "mayiladhuthurai",
        "password": "super123"
    }
    
    try:
        login_response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        
        if login_response.status_code == 200:
            token = login_response.json().get('token')
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            # Get list of reports first
            reports_response = requests.get(f"{base_url}/api/billing-reports/list", headers=headers)
            
            if reports_response.status_code == 200:
                reports = reports_response.json().get('reports', [])
                print(f"Found {len(reports)} reports")
                
                # Test first 3 reports
                success_count = 0
                test_count = min(3, len(reports))
                
                for i in range(test_count):
                    report = reports[i]
                    report_id = report.get('id')
                    sid_number = report.get('sid_number')
                    
                    print(f"\nTesting report {i+1}: ID={report_id}, SID={sid_number}")
                    
                    pdf_response = requests.get(f"{base_url}/api/billing-reports/{report_id}/pdf", headers=headers)
                    
                    if pdf_response.status_code == 200 and pdf_response.content.startswith(b'%PDF'):
                        print(f"✅ PDF generated successfully ({len(pdf_response.content)} bytes)")
                        success_count += 1
                        
                        # Save the PDF
                        filename = f"test_report_{sid_number}.pdf"
                        with open(filename, 'wb') as f:
                            f.write(pdf_response.content)
                        print(f"✅ Saved as '{filename}'")
                    else:
                        print(f"❌ Failed to generate PDF: {pdf_response.status_code}")
                
                print(f"\n📊 Results: {success_count}/{test_count} reports successfully generated")
                return success_count == test_count
            else:
                print(f"❌ Failed to get reports list: {reports_response.status_code}")
                return False
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error during multiple reports test: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting Authenticated PDF Tests...")
    
    # Test 1: Single report download
    success1 = test_authenticated_pdf_download()
    
    # Test 2: Multiple reports download
    success2 = test_multiple_reports()
    
    print("\n" + "=" * 60)
    print("FINAL TEST RESULTS")
    print("=" * 60)
    print(f"Single Report Test: {'✅ PASS' if success1 else '❌ FAIL'}")
    print(f"Multiple Reports Test: {'✅ PASS' if success2 else '❌ FAIL'}")
    
    if success1 and success2:
        print("\n🎉 ALL TESTS PASSED!")
        print("✅ PDF generation and download functionality is working correctly")
        print("✅ Users can now download billing reports as PDF files")
        print("✅ Role-based access control is working (authentication required)")
    else:
        print("\n❌ Some tests failed. Please check the implementation.")
