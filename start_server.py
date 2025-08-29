#!/usr/bin/env python3
"""
Simple script to start the backend server with proper error handling
"""

import sys
import os

# Add backend to path
sys.path.append('backend')

try:
    print("Importing Flask app...")
    from app import app
    
    print("Flask app imported successfully")
    print("Starting server on http://localhost:5001")
    print("Available endpoints:")
    
    # List some key endpoints
    for rule in app.url_map.iter_rules():
        if 'admin' in rule.rule or 'dashboard' in rule.rule:
            print(f"  {rule.methods} {rule.rule}")
    
    print("\nStarting server...")
    app.run(debug=True, port=5001, host='127.0.0.1', use_reloader=False)
    
except ImportError as e:
    print(f"Import error: {e}")
    import traceback
    traceback.print_exc()
except Exception as e:
    print(f"Error starting server: {e}")
    import traceback
    traceback.print_exc()
