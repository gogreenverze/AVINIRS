#!/usr/bin/env python3
"""
Test billing creation with automatic report generation
"""

import requests
import json

def test_billing_creation_with_reports():
    """Test creating a billing and verify report is generated"""
    
    base_url = "http://localhost:5001"
    
    # Test billing data
    billing_data = {
        "patient_id": 1,
        "invoice_date": "2025-06-20",
        "due_date": "2025-06-27",
        "items": [
            {
                "test_id": 1,
                "test_name": "1,25 Dihydroxyvitamin D",
                "quantity": 1,
                "price": 2500,
                "amount": 2500
            }
        ],
        "subtotal": 2500,
        "tax_amount": 450,
        "total_amount": 2950,
        "payment_status": "pending",
        "notes": "Test billing for report generation"
    }
    
    # Headers (you'll need a valid token)
    headers = {
        "Content-Type": "application/json",
        # "Authorization": "Bearer YOUR_TOKEN_HERE"
    }
    
    print("Testing Billing Creation with Report Generation")
    print("=" * 50)
    
    try:
        # Create billing
        print("1. Creating billing...")
        response = requests.post(
            f"{base_url}/api/billing",
            headers=headers,
            json=billing_data
        )
        
        if response.status_code == 201:
            billing_result = response.json()
            billing_id = billing_result.get('id')
            sid_number = billing_result.get('sid_number')
            report_generated = billing_result.get('report_generated', False)
            
            print(f"✅ Billing created successfully!")
            print(f"   Billing ID: {billing_id}")
            print(f"   SID Number: {sid_number}")
            print(f"   Report Generated: {report_generated}")
            
            if report_generated:
                print("✅ Report was generated automatically!")
                
                # Verify report exists
                print("\n2. Verifying report exists...")
                report_response = requests.get(
                    f"{base_url}/api/billing-reports/sid/{sid_number}",
                    headers=headers
                )
                
                if report_response.status_code == 200:
                    report_data = report_response.json()
                    print(f"✅ Report found!")
                    print(f"   Report ID: {report_data.get('id')}")
                    print(f"   Patient: {report_data.get('patient_info', {}).get('full_name')}")
                    print(f"   Tests: {len(report_data.get('test_items', []))}")
                    return True
                else:
                    print(f"❌ Report not found: {report_response.status_code}")
                    return False
            else:
                print("❌ Report was not generated automatically")
                return False
                
        else:
            print(f"❌ Billing creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server")
        print("   Make sure the backend is running on http://localhost:5001")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_billing_creation_with_reports()
    if success:
        print("\n🎉 Billing creation with report generation is working!")
    else:
        print("\n❌ Billing creation with report generation failed!")
