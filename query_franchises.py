#!/usr/bin/env python3
"""
Query script to display franchise names with their site IDs
"""

import json
import os
from tabulate import tabulate

def load_franchise_data():
    """Load franchise data from tenants.json"""
    try:
        # Get the path to the tenants.json file
        data_path = os.path.join('backend', 'data', 'tenants.json')
        
        with open(data_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"Error: Could not find {data_path}")
        return []
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in {data_path}")
        return []

def display_franchises():
    """Display franchises in a formatted table"""
    franchises = load_franchise_data()
    
    if not franchises:
        print("No franchise data found.")
        return
    
    # Prepare data for table display
    table_data = []
    for franchise in franchises:
        table_data.append([
            franchise.get('id', 'N/A'),
            franchise.get('site_code', 'N/A'),
            franchise.get('name', 'N/A'),
            franchise.get('address', 'N/A'),
            franchise.get('contact_phone', 'N/A'),
            franchise.get('email', 'N/A'),
            'Yes' if franchise.get('is_hub', False) else 'No',
            'Active' if franchise.get('is_active', True) else 'Inactive'
        ])
    
    # Define headers
    headers = [
        'Site ID',
        'Site Code', 
        'Franchise Name',
        'Address',
        'Phone',
        'Email',
        'Is Hub',
        'Status'
    ]
    
    # Display the table
    print("\n" + "="*120)
    print("AVINI FRANCHISE DIRECTORY")
    print("="*120)
    print(f"Total Franchises: {len(franchises)}")
    print("="*120)
    
    print(tabulate(table_data, headers=headers, tablefmt='grid', maxcolwidths=[8, 10, 25, 30, 15, 25, 8, 10]))
    
    # Display summary statistics
    hub_count = sum(1 for f in franchises if f.get('is_hub', False))
    active_count = sum(1 for f in franchises if f.get('is_active', True))
    
    print("\n" + "="*120)
    print("SUMMARY STATISTICS")
    print("="*120)
    print(f"Total Franchises: {len(franchises)}")
    print(f"Hub Locations: {hub_count}")
    print(f"Regular Franchises: {len(franchises) - hub_count}")
    print(f"Active Franchises: {active_count}")
    print(f"Inactive Franchises: {len(franchises) - active_count}")
    print("="*120)

def display_simple_list():
    """Display a simple list of Site ID and Franchise Name"""
    franchises = load_franchise_data()
    
    if not franchises:
        print("No franchise data found.")
        return
    
    print("\n" + "="*80)
    print("FRANCHISE LIST - SITE ID & NAME")
    print("="*80)
    
    for franchise in franchises:
        site_id = franchise.get('id', 'N/A')
        site_code = franchise.get('site_code', 'N/A')
        name = franchise.get('name', 'N/A')
        hub_indicator = " [HUB]" if franchise.get('is_hub', False) else ""
        
        print(f"Site ID: {site_id:2} | Code: {site_code:3} | {name}{hub_indicator}")
    
    print("="*80)

if __name__ == "__main__":
    print("AVINI Franchise Database Query")
    print("Choose display format:")
    print("1. Detailed table view")
    print("2. Simple list view")
    
    try:
        choice = input("\nEnter your choice (1 or 2): ").strip()
        
        if choice == "1":
            display_franchises()
        elif choice == "2":
            display_simple_list()
        else:
            print("Invalid choice. Showing simple list by default.")
            display_simple_list()
            
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
    except Exception as e:
        print(f"\nError: {e}")
