#!/usr/bin/env python3
"""
Simple test server to verify admin endpoints work correctly
"""

import sys
import os
import json
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS

# Add backend to path
sys.path.append('backend')

app = Flask(__name__)
CORS(app)

def safe_float(value, default=0):
    """Safely convert value to float, handling strings and None"""
    try:
        if value is None or value == '':
            return default
        return float(value)
    except (ValueError, TypeError):
        return default

def read_data(filename):
    """Read data from JSON file"""
    filepath = os.path.join('backend', 'data', filename)
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: {filename} not found")
        return []

@app.route('/api/admin/analytics', methods=['GET'])
def get_analytics():
    """Test admin analytics endpoint"""
    try:
        print("Analytics endpoint called")
        
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

        print(f"Monthly revenue: {monthly_revenue}")

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

        # Calculate test count
        test_count = len(results)

        response_data = {
            'patient_count': len(patients),
            'sample_count': len(samples),
            'test_count': test_count,
            'monthly_revenue': monthly_revenue,
            'sample_types': sample_type_counts,
            'test_stats': test_stats
        }

        print("Analytics response prepared successfully")
        return jsonify(response_data)

    except Exception as e:
        print(f"Error in analytics endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/comprehensive', methods=['GET'])
def get_comprehensive_dashboard():
    """Test comprehensive dashboard endpoint"""
    try:
        print("Comprehensive dashboard endpoint called")
        
        # Simple mock response
        response_data = {
            'success': True,
            'data': {
                'overview': {
                    'total_patients': 84,
                    'total_samples': 100,
                    'total_results': 212,
                    'monthly_revenue': 34742.0
                },
                'trends': {
                    'daily_trends': [],
                    'monthly_revenue': 34742.0,
                    'revenue_growth': 0
                },
                'recent_activities': {
                    'patients': [],
                    'samples': [],
                    'billings': []
                },
                'alerts': [],
                'ai_insights': []
            },
            'user_context': {
                'role': 'admin',
                'tenant_id': 1,
                'access_level': 'system_wide'
            }
        }

        print("Comprehensive dashboard response prepared successfully")
        return jsonify(response_data)

    except Exception as e:
        print(f"Error in comprehensive dashboard endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Test server is running'})

if __name__ == '__main__':
    print("Starting AVINIRS Test Server...")
    print("Server will be available at: http://localhost:5001")
    print("Test endpoints:")
    print("  - GET http://localhost:5001/api/health")
    print("  - GET http://localhost:5001/api/admin/analytics")
    print("  - GET http://localhost:5001/api/dashboard/comprehensive")
    print("Press Ctrl+C to stop the server")
    
    app.run(debug=True, port=5001, host='127.0.0.1')
