#!/usr/bin/env python3
"""
Test script for new PDF generation features
Tests QR code endpoint and PDF generation functionality
"""

import requests
import json
import sys
import time

def test_qr_code_endpoint():
    """Test the new QR code PDF endpoint"""
    base_url = "http://localhost:5001"
    test_sid = "TNJ004"

    print("🧪 Testing QR Code PDF Endpoint")
    print("=" * 40)

    try:
        response = requests.get(f"{base_url}/api/billing-reports/sid/{test_sid}/pdf", timeout=15)
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type', 'N/A')}")
        print(f"Content-Length: {len(response.content)} bytes")

        if response.status_code == 200:
            if response.content.startswith(b'%PDF'):
                print("✅ Valid PDF generated successfully!")

                # Save the PDF for inspection
                timestamp = int(time.time())
                filename = f"test_qr_pdf_{test_sid}_{timestamp}.pdf"
                with open(filename, "wb") as f:
                    f.write(response.content)
                print(f"📄 PDF saved as {filename}")
                return True

            else:
                print("❌ Invalid PDF content")
                print(f"First 100 bytes: {response.content[:100]}")
                return False
        else:
            print(f"❌ Failed to generate PDF: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Error testing QR code endpoint: {e}")
        return False

def test_backend_health():
    """Test if backend is healthy"""
    base_url = "http://localhost:5001"

    print("🏥 Testing Backend Health")
    print("=" * 30)

    try:
        response = requests.get(f"{base_url}/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is healthy")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend is not accessible: {e}")
        return False

def test_frontend_accessibility():
    """Test if frontend is accessible"""
    print("\n🌐 Testing Frontend Accessibility")
    print("=" * 35)
    
    frontend_url = "http://localhost:3000"
    
    try:
        response = requests.get(frontend_url, timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is accessible")
            print(f"📱 Test URL: {frontend_url}/billing/reports/TNJ004")
            return True
        else:
            print(f"❌ Frontend returned status: {response.status_code}")
            return False
    except requests.exceptions.RequestException:
        print("❌ Frontend is not accessible")
        return False

if __name__ == "__main__":
    print("🚀 AVINI Labs New PDF Features Test")
    print("=" * 50)

    backend_health = test_backend_health()
    qr_success = test_qr_code_endpoint() if backend_health else False
    frontend_success = test_frontend_accessibility()

    print("\n📋 Test Summary:")
    print("=" * 20)
    print(f"Backend Health: {'✅ PASS' if backend_health else '❌ FAIL'}")
    print(f"QR Code PDF Endpoint: {'✅ PASS' if qr_success else '❌ FAIL'}")
    print(f"Frontend Accessibility: {'✅ PASS' if frontend_success else '❌ FAIL'}")

    if backend_health and qr_success and frontend_success:
        print("\n🎉 All tests passed!")
        print("\n📋 New Features Implemented:")
        print("   • QR Code generation with direct PDF download links")
        print("   • Header toggle functionality in UI")
        print("   • Professional PDF template design")
        print("   • Barcode generation for SID numbers")
        print("   • Public access endpoint for QR codes")

        print("\n🔗 Test URLs:")
        print(f"   • Frontend: http://localhost:3000/billing/reports/TNJ004")
        print(f"   • QR PDF: http://localhost:5001/api/billing-reports/sid/TNJ004/pdf")

        print("\n💡 Next Steps:")
        print("   1. Open the frontend URL to test the new PDF download with header toggle")
        print("   2. Try downloading PDFs with and without headers")
        print("   3. Scan the QR code in the generated PDF to test direct access")

    else:
        print("\n❌ Some tests failed. Please check the implementation.")
        if not backend_health:
            print("   • Make sure the backend is running: cd backend && python app.py")
        if not frontend_success:
            print("   • Make sure the frontend is running: npm start")
        sys.exit(1)
