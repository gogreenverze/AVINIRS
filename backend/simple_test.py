#!/usr/bin/env python3
"""
Simple test for billing API endpoints
"""

import requests
import json

BASE_URL = "http://localhost:5001/api"

def test_endpoints():
    print("🧪 Testing Billing API Endpoints")
    print("=" * 40)
    
    # Test 1: Due amounts endpoint
    print("1. Testing due amounts endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/billing/due-amounts", timeout=5)
        print(f"   Status: {response.status_code}")
        if response.status_code == 401:
            print("   ⚠️  Authentication required (expected)")
        elif response.status_code == 200:
            print("   ✅ Success!")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
    
    # Test 2: Refunds endpoint
    print("\n2. Testing refunds endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/billing/refunds", timeout=5)
        print(f"   Status: {response.status_code}")
        if response.status_code == 401:
            print("   ⚠️  Authentication required (expected)")
        elif response.status_code == 200:
            print("   ✅ Success!")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
    
    # Test 3: SID generation endpoint
    print("\n3. Testing SID generation endpoint...")
    try:
        response = requests.post(f"{BASE_URL}/billing/generate-sid", 
                               json={"tenant_id": 1}, 
                               timeout=5)
        print(f"   Status: {response.status_code}")
        if response.status_code == 401:
            print("   ⚠️  Authentication required (expected)")
        elif response.status_code == 200:
            print("   ✅ Success!")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
    
    # Test 4: Basic billing endpoint
    print("\n4. Testing billing list endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/billing", timeout=5)
        print(f"   Status: {response.status_code}")
        if response.status_code == 401:
            print("   ⚠️  Authentication required (expected)")
        elif response.status_code == 200:
            print("   ✅ Success!")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Connection error: {e}")

if __name__ == "__main__":
    test_endpoints()
