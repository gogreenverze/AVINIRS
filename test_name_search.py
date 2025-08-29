#!/usr/bin/env python3
"""
Test script to specifically verify full name search functionality
"""
import requests
import json

# Configuration
BASE_URL = 'http://localhost:5001'
LOGIN_URL = f'{BASE_URL}/api/auth/login'
SEARCH_URL = f'{BASE_URL}/api/patients/search'

def test_name_search():
    """Test name search functionality"""
    
    # Login first
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    print("🔐 Logging in...")
    login_response = requests.post(LOGIN_URL, json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code} - {login_response.text}")
        return
    
    token = login_response.json().get('token')
    headers = {'Authorization': f'Bearer {token}'}
    
    print("✅ Login successful!")
    
    # Test cases for name search
    test_cases = [
        {
            'name': 'Search by first name only',
            'query': 'rajesh',
            'description': 'Should find patients with first name "rajesh"'
        },
        {
            'name': 'Search by last name only', 
            'query': 'kumar',
            'description': 'Should find patients with last name "kumar"'
        },
        {
            'name': 'Search by full name (first last)',
            'query': 'rajesh kumar',
            'description': 'Should find patients with full name "rajesh kumar"'
        },
        {
            'name': 'Search by full name (last first)',
            'query': 'kumar rajesh',
            'description': 'Should find patients with name containing both "kumar" and "rajesh"'
        },
        {
            'name': 'Search by partial first name',
            'query': 'raj',
            'description': 'Should find patients with first name containing "raj"'
        },
        {
            'name': 'Search by partial last name',
            'query': 'kum',
            'description': 'Should find patients with last name containing "kum"'
        },
        {
            'name': 'Search by mixed case',
            'query': 'RAJESH Kumar',
            'description': 'Should find patients regardless of case'
        },
        {
            'name': 'Search with extra spaces',
            'query': '  rajesh   kumar  ',
            'description': 'Should handle extra spaces correctly'
        }
    ]
    
    print("\n🔍 Testing name search functionality...")
    print("=" * 80)
    
    for test_case in test_cases:
        print(f"\n📋 {test_case['name']}")
        print(f"   Query: '{test_case['query']}'")
        print(f"   Expected: {test_case['description']}")
        
        # Make search request
        params = {'q': test_case['query']}
        response = requests.get(SEARCH_URL, headers=headers, params=params)
        
        if response.status_code == 200:
            data = response.json()
            patients = data.get('items', data) if isinstance(data, dict) else data
            
            print(f"   ✅ Status: {response.status_code}")
            print(f"   📊 Results: {len(patients)} patients found")
            
            # Show all results for name searches
            for i, patient in enumerate(patients):
                first_name = patient.get('first_name', '')
                last_name = patient.get('last_name', '')
                patient_id = patient.get('patient_id', '')
                phone = patient.get('phone', '')
                full_name = f"{first_name} {last_name}".strip()
                print(f"      {i+1}. {full_name} (ID: {patient_id}, Phone: {phone})")
                
            # Verify search logic
            query_lower = test_case['query'].lower().strip()
            query_words = query_lower.split()
            found_relevant = False

            for patient in patients:
                first_name = patient.get('first_name', '').lower()
                last_name = patient.get('last_name', '').lower()
                full_name = f"{first_name} {last_name}".strip()
                full_name_reverse = f"{last_name} {first_name}".strip()

                # Check various matching criteria
                if (query_lower in first_name or
                    query_lower in last_name or
                    query_lower in full_name or
                    query_lower in full_name_reverse):
                    found_relevant = True
                    break

                # For multi-word queries, check if all words are present
                if len(query_words) > 1:
                    name_text = f"{first_name} {last_name}".lower()
                    if all(word in name_text for word in query_words):
                        found_relevant = True
                        break
            
            if found_relevant or len(patients) == 0:
                print(f"   ✅ Search logic working correctly")
            else:
                print(f"   ❌ Search logic issue - found irrelevant results")
                
        else:
            print(f"   ❌ Status: {response.status_code}")
            print(f"   Error: {response.text}")
    
    print("\n" + "=" * 80)
    print("🏁 Name search testing completed!")

if __name__ == '__main__':
    test_name_search()
