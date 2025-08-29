#!/usr/bin/env python3
"""
Test script to verify the new Excel data integration API endpoints
"""

import requests
import json
import sys

# Base URL for the API
BASE_URL = "http://localhost:5001/api"

def test_excel_data_endpoints():
    """Test the Excel data integration endpoints"""
    print("🧪 Testing Excel Data Integration API Endpoints")
    print("=" * 60)
    
    # Test 1: Get all Excel data
    print("\n1. Testing GET /admin/excel-data")
    try:
        response = requests.get(f"{BASE_URL}/admin/excel-data")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: Retrieved {len(data.get('data', []))} Excel records")
        else:
            print(f"❌ Failed: Status {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Search Excel data
    print("\n2. Testing GET /admin/excel-data/search")
    try:
        response = requests.get(f"{BASE_URL}/admin/excel-data/search?q=glucose")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: Found {len(data.get('data', []))} records for 'glucose'")
            if data.get('data'):
                print(f"Sample result: {data['data'][0].get('test_name', 'N/A')}")
        else:
            print(f"❌ Failed: Status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Lookup by test code
    print("\n3. Testing GET /admin/excel-data/lookup/000003")
    try:
        response = requests.get(f"{BASE_URL}/admin/excel-data/lookup/000003")
        if response.status_code == 200:
            data = response.json()
            if data.get('found'):
                print(f"✅ Success: Found test - {data['data'].get('test_name', 'N/A')}")
                print(f"Department: {data['data'].get('department', 'N/A')}")
                print(f"Price: {data['data'].get('price', 'N/A')}")
            else:
                print("⚠️ No data found for test code 000003")
        else:
            print(f"❌ Failed: Status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: Lookup by test name
    print("\n4. Testing GET /admin/excel-data/lookup-by-name")
    try:
        test_name = "17 HYDROXY CORTICO STEROID 24 HR URINE"
        response = requests.get(f"{BASE_URL}/admin/excel-data/lookup-by-name/{requests.utils.quote(test_name)}")
        if response.status_code == 200:
            data = response.json()
            if data.get('found'):
                print(f"✅ Success: Found test by name")
                print(f"Test Code: {data['data'].get('test_code', 'N/A')}")
                print(f"Department: {data['data'].get('department', 'N/A')}")
            else:
                print("⚠️ No data found for test name")
        else:
            print(f"❌ Failed: Status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 5: Get enhanced test master
    print("\n5. Testing GET /admin/test-master-enhanced")
    try:
        response = requests.get(f"{BASE_URL}/admin/test-master-enhanced")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: Retrieved {len(data.get('data', []))} enhanced test master records")
        else:
            print(f"❌ Failed: Status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 6: Get enhanced result master
    print("\n6. Testing GET /admin/result-master-enhanced")
    try:
        response = requests.get(f"{BASE_URL}/admin/result-master-enhanced")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: Retrieved {len(data.get('data', []))} enhanced result master records")
        else:
            print(f"❌ Failed: Status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_data_statistics():
    """Display statistics about the imported data"""
    print("\n📊 Data Statistics")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/admin/excel-data")
        if response.status_code == 200:
            data = response.json().get('data', [])
            
            # Count by department
            dept_counts = {}
            for item in data:
                dept = item.get('department', 'Unknown')
                dept_counts[dept] = dept_counts.get(dept, 0) + 1
            
            print("Records by Department:")
            for dept, count in sorted(dept_counts.items()):
                print(f"  {dept}: {count}")
            
            # Count by result type
            result_type_counts = {}
            for item in data:
                result_type = item.get('result_type', 'Unknown')
                result_type_counts[result_type] = result_type_counts.get(result_type, 0) + 1
            
            print("\nRecords by Result Type:")
            for result_type, count in sorted(result_type_counts.items()):
                print(f"  {result_type}: {count}")
            
            # Price statistics
            prices = [item.get('price', 0) for item in data if item.get('price')]
            if prices:
                print(f"\nPrice Statistics:")
                print(f"  Total tests with prices: {len(prices)}")
                print(f"  Average price: ₹{sum(prices) / len(prices):.2f}")
                print(f"  Min price: ₹{min(prices)}")
                print(f"  Max price: ₹{max(prices)}")
        
    except Exception as e:
        print(f"❌ Error getting statistics: {e}")

def main():
    """Main test function"""
    print("🚀 Excel Data Integration API Test Suite")
    print("Testing backend server at:", BASE_URL)
    print("Make sure the backend server is running on port 5001")
    
    # Test if server is running
    try:
        response = requests.get(f"http://localhost:5001/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend server is running")
        else:
            print("⚠️ Backend server responded but may have issues")
    except Exception as e:
        print(f"❌ Cannot connect to backend server: {e}")
        print("Please start the backend server first: python backend/app.py")
        sys.exit(1)
    
    # Run tests
    test_excel_data_endpoints()
    test_data_statistics()
    
    print("\n" + "=" * 60)
    print("✅ API Testing Complete!")
    print("\nNext Steps:")
    print("1. Start the frontend: npm start")
    print("2. Navigate to: http://localhost:3000/admin/unified-test-result-master")
    print("3. Test the auto-population functionality")

if __name__ == "__main__":
    main()
