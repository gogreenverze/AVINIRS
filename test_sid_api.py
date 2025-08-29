#!/usr/bin/env python3
"""
Test the SID generation API endpoint
"""

import requests
import json

def test_sid_generation():
    """Test SID generation for different franchises"""
    
    # API endpoint
    base_url = "http://localhost:5001"
    
    # Test data - different tenant IDs
    test_cases = [
        {"tenant_id": 1, "expected_prefix": "MYD", "name": "Mayiladuthurai"},
        {"tenant_id": 2, "expected_prefix": "SKZ", "name": "Sirkazhi"},
        {"tenant_id": 11, "expected_prefix": "SWM", "name": "Swamimalai"},
        {"tenant_id": 3, "expected_prefix": "TNJ", "name": "Thanjavur"},
    ]
    
    print("Testing SID Generation API")
    print("=" * 40)
    
    # You'll need a valid token - this is just a test structure
    headers = {
        "Content-Type": "application/json",
        # "Authorization": "Bearer YOUR_TOKEN_HERE"
    }
    
    for test_case in test_cases:
        print(f"\nTesting {test_case['name']} (ID: {test_case['tenant_id']})")
        print(f"Expected prefix: {test_case['expected_prefix']}")
        
        try:
            # Test the generate-sid endpoint
            response = requests.post(
                f"{base_url}/api/billing/generate-sid",
                headers=headers,
                json={"tenant_id": test_case["tenant_id"]}
            )
            
            if response.status_code == 200:
                data = response.json()
                sid = data.get("sid_number", "")
                site_code = data.get("site_code", "")
                
                print(f"✅ Generated SID: {sid}")
                print(f"   Site Code: {site_code}")
                
                # Validate format
                if sid.startswith(test_case["expected_prefix"]):
                    print("✅ Correct prefix")
                else:
                    print(f"❌ Wrong prefix - expected {test_case['expected_prefix']}")
                
                if len(sid) == len(test_case["expected_prefix"]) + 3:
                    print("✅ Correct length")
                else:
                    print("❌ Wrong length")
                
                if sid[len(test_case["expected_prefix"]):].isdigit():
                    print("✅ Numeric suffix")
                else:
                    print("❌ Non-numeric suffix")
                    
            else:
                print(f"❌ API Error: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Cannot connect to backend server")
            print("   Make sure the backend is running on http://localhost:5001")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_sid_generation()
