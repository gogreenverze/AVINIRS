#!/usr/bin/env python3
"""
Working server with admin endpoints for testing
"""

import sys
import os
import json
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS

# Add backend to path
sys.path.append('backend')

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'http://localhost:3001'])

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

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'AVINIRS Backend Server is running'})

@app.route('/api/admin/analytics', methods=['GET'])
def get_analytics():
    """Admin analytics endpoint - no auth for testing"""
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
    """Comprehensive dashboard endpoint - no auth for testing"""
    try:
        print("Comprehensive dashboard endpoint called")
        
        # Get all data files
        patients = read_data('patients.json')
        samples = read_data('samples.json')
        results = read_data('results.json')
        billings = read_data('billings.json')
        
        # Calculate basic metrics
        today = datetime.now().strftime('%Y-%m-%d')
        current_month = datetime.now().strftime('%Y-%m')
        
        total_patients = len(patients)
        today_patients = len([p for p in patients if p.get('created_at', '').startswith(today)])
        monthly_patients = len([p for p in patients if p.get('created_at', '').startswith(current_month)])
        
        total_revenue = sum(safe_float(b.get('total_amount', 0)) for b in billings)
        monthly_revenue = sum(safe_float(b.get('total_amount', 0)) for b in billings if b.get('invoice_date', '').startswith(current_month))
        
        # Daily trends for last 7 days
        last_7_days = [(datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(6, -1, -1)]
        daily_trends = []
        for date in last_7_days:
            day_patients = len([p for p in patients if p.get('created_at', '').startswith(date)])
            day_samples = len([s for s in samples if s.get('created_at', '').startswith(date)])
            day_revenue = sum(safe_float(b.get('total_amount', 0)) for b in billings if b.get('invoice_date', '').startswith(date))

            daily_trends.append({
                'date': date,
                'patients': day_patients,
                'samples': day_samples,
                'revenue': day_revenue
            })

        response_data = {
            'success': True,
            'data': {
                'overview': {
                    'total_patients': total_patients,
                    'today_patients': today_patients,
                    'monthly_patients': monthly_patients,
                    'total_samples': len(samples),
                    'total_results': len(results),
                    'total_revenue': total_revenue,
                    'monthly_revenue': monthly_revenue
                },
                'trends': {
                    'daily_trends': daily_trends,
                    'monthly_revenue': monthly_revenue,
                    'revenue_growth': 0  # Simplified for testing
                },
                'recent_activities': {
                    'patients': patients[-5:] if patients else [],
                    'samples': samples[-5:] if samples else [],
                    'billings': billings[-5:] if billings else []
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

if __name__ == '__main__':
    print("Starting AVINIRS Working Backend Server...")
    print("Server will be available at: http://localhost:5001")
    print("Test endpoints:")
    print("  - GET http://localhost:5001/api/health")
    print("  - GET http://localhost:5001/api/admin/analytics")
    print("  - GET http://localhost:5001/api/dashboard/comprehensive")
    print("Press Ctrl+C to stop the server")
    
    app.run(debug=True, port=5001, host='127.0.0.1', use_reloader=False)
