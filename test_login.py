#!/usr/bin/env python3
"""
Test Login - Verify authentication is working
"""

import requests
import json

def test_login():
    """Test login functionality"""
    
    print("🔐 Testing Login Functionality")
    print("=" * 50)
    
    base_url = "http://localhost:5001"
    login_url = f"{base_url}/api/auth/login"
    
    # Test credentials
    credentials = [
        {"username": "admin", "password": "admin123", "description": "Primary Admin"},
        {"username": "mayiladhuthurai", "password": "super123", "description": "Alternative Admin"},
        {"username": "thanjavur", "password": "thanjavur123", "description": "Franchise Admin"}
    ]
    
    for cred in credentials:
        print(f"\nTesting {cred['description']}:")
        print(f"Username: {cred['username']}")
        print(f"Password: {cred['password']}")
        
        try:
            response = requests.post(
                login_url,
                json={
                    "username": cred['username'],
                    "password": cred['password']
                },
                headers={"Content-Type": "application/json"}
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Login successful!")
                print(f"   Token received: {data.get('token', 'N/A')[:50]}...")
                print(f"   User role: {data.get('user', {}).get('role', 'N/A')}")
                print(f"   Tenant: {data.get('user', {}).get('tenant_name', 'N/A')}")
                
                # Test accessing a protected endpoint
                token = data.get('token')
                if token:
                    print("\n   Testing protected endpoint...")
                    headers = {"Authorization": f"Bearer {token}"}
                    
                    # Test billing reports endpoint
                    reports_url = f"{base_url}/api/billing-reports"
                    reports_response = requests.get(reports_url, headers=headers)
                    print(f"   Billing reports access: {reports_response.status_code}")
                    
                    if reports_response.status_code == 200:
                        reports_data = reports_response.json()
                        print(f"   Found {len(reports_data.get('reports', []))} reports")
                    
                return True
                
            else:
                print("❌ Login failed!")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Error during login test: {str(e)}")
    
    return False

if __name__ == "__main__":
    print("Starting Login Tests...")
    success = test_login()
    
    if success:
        print("\n🎉 Authentication is working correctly!")
        print("\nYou can now login to the web application using:")
        print("URL: http://localhost:3000")
        print("Username: admin")
        print("Password: admin123")
    else:
        print("\n❌ Authentication needs to be fixed.")
