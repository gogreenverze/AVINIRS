#!/usr/bin/env python3
"""
Test Role-Based PDF Access - Verify that PDF downloads respect role-based permissions
"""

import requests
import json

def test_admin_access():
    """Test admin user can access all reports"""
    
    print("🧪 Testing Admin User Access (Mayiladuthurai)")
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
            
            # Get list of reports
            reports_response = requests.get(f"{base_url}/api/billing-reports/list", headers=headers)
            
            if reports_response.status_code == 200:
                response_data = reports_response.json()
                reports = response_data.get('data', {}).get('data', [])
                print(f"✅ Admin can see {len(reports)} reports")
                
                # Test PDF access for different franchise reports
                test_reports = []
                franchises_tested = set()
                
                for report in reports[:10]:  # Test first 10 reports
                    sid = report.get('sid_number', '')
                    franchise = sid[:3] if len(sid) >= 3 else 'UNK'
                    
                    if franchise not in franchises_tested:
                        test_reports.append(report)
                        franchises_tested.add(franchise)
                        
                        if len(test_reports) >= 3:  # Test 3 different franchises
                            break
                
                success_count = 0
                for report in test_reports:
                    report_id = report.get('id')
                    sid = report.get('sid_number')
                    
                    pdf_response = requests.get(f"{base_url}/api/billing-reports/{report_id}/pdf", headers=headers)
                    
                    if pdf_response.status_code == 200 and pdf_response.content.startswith(b'%PDF'):
                        print(f"✅ Admin can download PDF for {sid} ({len(pdf_response.content)} bytes)")
                        success_count += 1
                    else:
                        print(f"❌ Admin failed to download PDF for {sid}: {pdf_response.status_code}")
                
                print(f"📊 Admin PDF Access: {success_count}/{len(test_reports)} successful")
                return success_count == len(test_reports)
            else:
                print(f"❌ Failed to get reports list: {reports_response.status_code}")
                return False
        else:
            print(f"❌ Admin login failed: {login_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error during admin test: {str(e)}")
        return False

def test_franchise_access():
    """Test franchise user can only access their own reports"""
    
    print("\n🧪 Testing Franchise User Access (Thanjavur)")
    print("=" * 60)
    
    base_url = "http://localhost:5001"
    
    # Login as franchise user
    login_data = {
        "username": "thanjavur",
        "password": "thanjavur123"
    }
    
    try:
        login_response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        
        if login_response.status_code == 200:
            token = login_response.json().get('token')
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            # Get list of reports (should only see Thanjavur reports)
            reports_response = requests.get(f"{base_url}/api/billing-reports/list", headers=headers)
            
            if reports_response.status_code == 200:
                response_data = reports_response.json()
                reports = response_data.get('data', {}).get('data', [])
                print(f"✅ Franchise user can see {len(reports)} reports")
                
                # Verify all reports are from Thanjavur (TNJ prefix)
                tnj_reports = 0
                other_reports = 0
                
                for report in reports:
                    sid = report.get('sid_number', '')
                    if sid.startswith('TNJ'):
                        tnj_reports += 1
                    else:
                        other_reports += 1
                        print(f"⚠️  Non-TNJ report found: {sid}")
                
                print(f"✅ TNJ reports: {tnj_reports}")
                print(f"❌ Other franchise reports: {other_reports}")
                
                # Test PDF access for their own reports
                success_count = 0
                test_count = min(3, len(reports))
                
                for i in range(test_count):
                    report = reports[i]
                    report_id = report.get('id')
                    sid = report.get('sid_number')
                    
                    pdf_response = requests.get(f"{base_url}/api/billing-reports/{report_id}/pdf", headers=headers)
                    
                    if pdf_response.status_code == 200 and pdf_response.content.startswith(b'%PDF'):
                        print(f"✅ Franchise user can download PDF for {sid} ({len(pdf_response.content)} bytes)")
                        success_count += 1
                    else:
                        print(f"❌ Franchise user failed to download PDF for {sid}: {pdf_response.status_code}")
                
                # Test access to other franchise report (should fail)
                print("\n🔒 Testing access to other franchise report...")
                
                # Try to access report ID 1 (TNJ004) - this should work since it's TNJ
                # Try to access a MYD report (should fail for TNJ user)
                
                # First get a MYD report ID by logging in as admin
                admin_login = requests.post(f"{base_url}/api/auth/login", json={"username": "mayiladhuthurai", "password": "super123"})
                if admin_login.status_code == 200:
                    admin_token = admin_login.json().get('token')
                    admin_headers = {'Authorization': f'Bearer {admin_token}'}
                    
                    admin_reports = requests.get(f"{base_url}/api/billing-reports/list", headers=admin_headers)
                    if admin_reports.status_code == 200:
                        all_reports = admin_reports.json().get('reports', [])
                        myd_report = None
                        
                        for report in all_reports:
                            if report.get('sid_number', '').startswith('MYD'):
                                myd_report = report
                                break
                        
                        if myd_report:
                            myd_id = myd_report.get('id')
                            myd_sid = myd_report.get('sid_number')
                            
                            # Try to access MYD report with TNJ user token
                            unauthorized_response = requests.get(f"{base_url}/api/billing-reports/{myd_id}/pdf", headers=headers)
                            
                            if unauthorized_response.status_code == 404:
                                print(f"✅ Franchise user correctly denied access to {myd_sid} (404 - not found in their scope)")
                            elif unauthorized_response.status_code == 403:
                                print(f"✅ Franchise user correctly denied access to {myd_sid} (403 - forbidden)")
                            else:
                                print(f"❌ Franchise user unexpectedly got access to {myd_sid}: {unauthorized_response.status_code}")
                                return False
                
                print(f"📊 Franchise PDF Access: {success_count}/{test_count} successful")
                print(f"📊 Role Isolation: {other_reports == 0}")
                
                return success_count == test_count and other_reports == 0
            else:
                print(f"❌ Failed to get reports list: {reports_response.status_code}")
                return False
        else:
            print(f"❌ Franchise login failed: {login_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error during franchise test: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting Role-Based PDF Access Tests...")
    
    # Test 1: Admin access
    admin_success = test_admin_access()
    
    # Test 2: Franchise access
    franchise_success = test_franchise_access()
    
    print("\n" + "=" * 60)
    print("ROLE-BASED ACCESS TEST RESULTS")
    print("=" * 60)
    print(f"Admin Access Test: {'✅ PASS' if admin_success else '❌ FAIL'}")
    print(f"Franchise Access Test: {'✅ PASS' if franchise_success else '❌ FAIL'}")
    
    if admin_success and franchise_success:
        print("\n🎉 ALL ROLE-BASED ACCESS TESTS PASSED!")
        print("✅ Admin/Mayiladuthurai users can access all franchise reports")
        print("✅ Franchise users can only access their own franchise reports")
        print("✅ PDF downloads respect role-based access permissions")
        print("✅ Unauthorized access is properly blocked")
    else:
        print("\n❌ Some role-based access tests failed. Please check the implementation.")
