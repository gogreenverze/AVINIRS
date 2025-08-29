#!/usr/bin/env python3
"""
Debug Reports API - Check what's happening with the reports list API
"""

import requests
import json

def debug_reports_api():
    """Debug the reports API response"""
    
    print("🔍 Debugging Reports API")
    print("=" * 60)
    
    base_url = "http://localhost:5001"
    
    # Login as admin
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
            
            print("✅ Login successful")
            
            # Get list of reports
            reports_response = requests.get(f"{base_url}/api/billing-reports/list", headers=headers)
            
            print(f"Reports API Status: {reports_response.status_code}")
            print(f"Response Headers: {dict(reports_response.headers)}")
            
            if reports_response.status_code == 200:
                response_data = reports_response.json()
                print(f"Response Keys: {list(response_data.keys())}")
                
                # Check different possible keys
                if 'reports' in response_data:
                    reports = response_data['reports']
                    print(f"Found 'reports' key with {len(reports)} items")
                elif 'data' in response_data:
                    reports = response_data['data']
                    print(f"Found 'data' key with {len(reports)} items")
                else:
                    print("Response structure:")
                    print(json.dumps(response_data, indent=2)[:1000])
                    
                    # Try to find reports in the response
                    if isinstance(response_data, list):
                        reports = response_data
                        print(f"Response is a list with {len(reports)} items")
                    else:
                        reports = []
                        print("Could not find reports in response")
                
                if reports and len(reports) > 0:
                    print(f"\nFirst report structure:")
                    print(json.dumps(reports[0], indent=2)[:500])
                    
                    # Test PDF download for first report
                    first_report = reports[0]
                    report_id = first_report.get('id')
                    sid = first_report.get('sid_number')
                    
                    if report_id:
                        print(f"\nTesting PDF download for report {report_id} ({sid})...")
                        pdf_response = requests.get(f"{base_url}/api/billing-reports/{report_id}/pdf", headers=headers)
                        
                        print(f"PDF Response Status: {pdf_response.status_code}")
                        print(f"PDF Content-Type: {pdf_response.headers.get('content-type')}")
                        print(f"PDF Content-Length: {len(pdf_response.content)} bytes")
                        
                        if pdf_response.content.startswith(b'%PDF'):
                            print("✅ Valid PDF received!")
                        else:
                            print("❌ Invalid PDF content")
                            print(f"First 100 bytes: {pdf_response.content[:100]}")
                else:
                    print("No reports found in response")
                    
            else:
                print(f"❌ Reports API failed: {reports_response.status_code}")
                print(f"Response: {reports_response.text}")
                
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            
    except Exception as e:
        print(f"❌ Error during debug: {str(e)}")

if __name__ == "__main__":
    debug_reports_api()
