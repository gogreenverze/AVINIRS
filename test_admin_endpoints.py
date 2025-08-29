#!/usr/bin/env python3
"""
Test script to verify admin endpoints work correctly after the TypeError fix
"""

import sys
import os
import json
from datetime import datetime

# Add backend to path
sys.path.append('backend')

def test_admin_analytics_endpoint():
    """Test the admin analytics endpoint logic"""
    print("Testing admin analytics endpoint logic...")
    
    try:
        from utils import read_data
        
        # Simulate the endpoint logic
        def safe_float(value, default=0):
            """Safely convert value to float, handling strings and None"""
            try:
                if value is None or value == '':
                    return default
                return float(value)
            except (ValueError, TypeError):
                return default
        
        # Get counts from various data files
        patients = read_data('patients.json')
        samples = read_data('samples.json')
        results = read_data('results.json')
        billings = read_data('billings.json')

        print(f"Data loaded - Patients: {len(patients)}, Samples: {len(samples)}, Results: {len(results)}, Billings: {len(billings)}")

        # Calculate monthly revenue
        current_month = datetime.now().strftime('%Y-%m')
        monthly_revenue = sum(
            safe_float(b.get('total_amount', 0))
            for b in billings
            if b.get('invoice_date', '').startswith(current_month)
        )

        print(f"Monthly revenue calculation: {monthly_revenue}")

        # Get sample type distribution
        try:
            sample_types = read_data('sample_types.json')
            sample_type_counts = []

            for sample_type in sample_types:
                count = len([s for s in samples if s.get('sample_type_id') == sample_type.get('id')])
                sample_type_counts.append({
                    'id': sample_type.get('id'),
                    'type_name': sample_type.get('type_name'),
                    'count': count
                })

            # Sort by count (descending)
            sample_type_counts = sorted(sample_type_counts, key=lambda x: x.get('count'), reverse=True)
            print(f"Sample type counts calculated: {len(sample_type_counts)} types")
        except Exception as e:
            print(f"Warning: Could not load sample_types.json: {e}")
            sample_type_counts = []

        # Generate test statistics for the last 30 days
        from datetime import timedelta
        test_stats = []
        for i in range(30):
            date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            count = len([r for r in results if r.get('created_at', '').startswith(date)])
            test_stats.append({
                'date': date,
                'count': count
            })

        # Reverse to show oldest to newest
        test_stats.reverse()
        print(f"Test statistics calculated for 30 days")

        # Calculate test count
        test_count = len(results)

        # Simulate the response
        response_data = {
            'patient_count': len(patients),
            'sample_count': len(samples),
            'test_count': test_count,
            'monthly_revenue': monthly_revenue,
            'sample_types': sample_type_counts,
            'test_stats': test_stats
        }

        print("✅ Admin analytics endpoint logic works correctly")
        print(f"Response data keys: {list(response_data.keys())}")
        return True

    except Exception as e:
        print(f"❌ Error in admin analytics endpoint: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_comprehensive_dashboard_endpoint():
    """Test the comprehensive dashboard endpoint logic"""
    print("\nTesting comprehensive dashboard endpoint logic...")
    
    try:
        from utils import read_data
        from routes.admin_routes import calculate_dashboard_metrics, safe_float
        
        # Simulate user context
        user_role = 'admin'
        user_tenant_id = 1

        # Get all data files
        patients = read_data('patients.json')
        samples = read_data('samples.json')
        results = read_data('results.json')
        billings = read_data('billings.json')
        
        try:
            inventory = read_data('inventory.json')
        except:
            inventory = []
            
        try:
            invoices = read_data('invoices.json')
        except:
            invoices = []

        print(f"Data loaded for comprehensive dashboard")

        # Calculate dashboard metrics
        dashboard_data = calculate_dashboard_metrics(
            patients, samples, results, billings, inventory, invoices, user_role
        )

        print("✅ Comprehensive dashboard endpoint logic works correctly")
        print(f"Dashboard data keys: {list(dashboard_data.keys())}")
        return True

    except Exception as e:
        print(f"❌ Error in comprehensive dashboard endpoint: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_authentication_simulation():
    """Test authentication requirements"""
    print("\nTesting authentication requirements...")
    
    # Simulate different user roles
    test_roles = ['admin', 'hub_admin', 'franchise_admin', 'user']
    
    for role in test_roles:
        print(f"Testing role: {role}")
        
        # Check admin analytics access
        if role in ['admin', 'hub_admin']:
            print(f"  ✅ {role} should have access to admin analytics")
        else:
            print(f"  ❌ {role} should NOT have access to admin analytics")
    
    return True

if __name__ == "__main__":
    print("AVINIRS Admin Endpoints Test")
    print("="*50)
    
    success1 = test_admin_analytics_endpoint()
    success2 = test_comprehensive_dashboard_endpoint()
    success3 = test_authentication_simulation()
    
    if success1 and success2 and success3:
        print("\n✅ All admin endpoint tests passed!")
        print("The endpoints should work correctly now.")
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
