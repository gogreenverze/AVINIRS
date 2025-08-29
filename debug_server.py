#!/usr/bin/env python3
"""
Debug script to identify server startup issues
"""

import sys
import os

# Add backend to path
sys.path.append('backend')

def test_imports():
    """Test all imports step by step"""
    print("Testing imports...")
    
    try:
        print("1. Testing Flask import...")
        from flask import Flask, jsonify
        print("   ✅ Flask imported successfully")
        
        print("2. Testing utils import...")
        from utils import read_data, write_data, token_required
        print("   ✅ Utils imported successfully")
        
        print("3. Testing admin routes import...")
        from routes.admin_routes import admin_bp
        print("   ✅ Admin routes imported successfully")
        
        print("4. Testing app import...")
        import app
        print("   ✅ App module imported successfully")
        
        print("5. Testing Flask app creation...")
        test_app = Flask(__name__)
        print("   ✅ Flask app created successfully")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_data_files():
    """Test if data files are accessible"""
    print("\nTesting data files...")
    
    try:
        from utils import read_data
        
        files_to_test = ['patients.json', 'billings.json', 'samples.json', 'results.json']
        
        for filename in files_to_test:
            try:
                data = read_data(filename)
                print(f"   ✅ {filename}: {len(data)} records")
            except Exception as e:
                print(f"   ❌ {filename}: {e}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Data file test failed: {e}")
        return False

def test_endpoint_logic():
    """Test the endpoint logic without Flask"""
    print("\nTesting endpoint logic...")
    
    try:
        from routes.admin_routes import safe_float
        from utils import read_data
        from datetime import datetime
        
        # Test safe_float function
        test_values = ["147", 123.45, None, ""]
        for val in test_values:
            result = safe_float(val)
            print(f"   safe_float({repr(val)}) = {result}")
        
        # Test data loading and calculation
        billings = read_data('billings.json')
        current_month = datetime.now().strftime('%Y-%m')
        monthly_revenue = sum(
            safe_float(b.get('total_amount', 0))
            for b in billings
            if b.get('invoice_date', '').startswith(current_month)
        )
        
        print(f"   ✅ Monthly revenue calculation: {monthly_revenue}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Endpoint logic test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_simple_server():
    """Test a simple Flask server"""
    print("\nTesting simple Flask server...")
    
    try:
        from flask import Flask, jsonify
        from flask_cors import CORS
        
        app = Flask(__name__)
        CORS(app)
        
        @app.route('/test')
        def test():
            return jsonify({'status': 'ok', 'message': 'Test server working'})
        
        print("   ✅ Simple Flask app created")
        print("   Starting test server on port 5002...")
        
        app.run(debug=False, port=5002, host='127.0.0.1', use_reloader=False)
        
    except Exception as e:
        print(f"   ❌ Simple server test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("AVINIRS Backend Debug")
    print("="*50)
    
    success1 = test_imports()
    success2 = test_data_files()
    success3 = test_endpoint_logic()
    
    if success1 and success2 and success3:
        print("\n✅ All tests passed! Trying simple server...")
        test_simple_server()
    else:
        print("\n❌ Some tests failed. Check the errors above.")
