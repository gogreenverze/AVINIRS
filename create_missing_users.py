#!/usr/bin/env python3
"""
Create Missing Users - Add users mentioned in USER_CREDENTIALS.md
"""

import json
import os

def create_missing_users():
    """Create users that are mentioned in USER_CREDENTIALS.md but missing from the system"""
    
    # Path to users.json
    users_file = os.path.join('backend', 'data', 'users.json')
    
    # Load existing users
    try:
        with open(users_file, 'r') as f:
            users = json.load(f)
    except FileNotFoundError:
        users = []
    
    print(f"Current users: {len(users)}")
    for user in users:
        print(f"  - {user['username']} ({user['role']})")
    
    # Users to add based on USER_CREDENTIALS.md
    new_users = [
        {
            "id": 4,
            "username": "mayiladhuthurai",
            "password": "super123",
            "email": "mayiladhuthurai@avinilabs.com",
            "first_name": "Mayiladhuthurai",
            "last_name": "Admin",
            "role": "admin",
            "tenant_id": 1,
            "is_active": True
        },
        {
            "id": 5,
            "username": "sirkazhi",
            "password": "sirkazhi123",
            "email": "sirkazhi@avinilabs.com",
            "first_name": "Sirkazhi",
            "last_name": "Admin",
            "role": "franchise_admin",
            "tenant_id": 2,
            "is_active": True
        },
        {
            "id": 6,
            "username": "thanjavur",
            "password": "thanjavur123",
            "email": "thanjavur@avinilabs.com",
            "first_name": "Thanjavur",
            "last_name": "Admin",
            "role": "franchise_admin",
            "tenant_id": 3,
            "is_active": True
        },
        {
            "id": 7,
            "username": "kuthalam",
            "password": "kuthalam123",
            "email": "kuthalam@avinilabs.com",
            "first_name": "Kuthalam",
            "last_name": "Admin",
            "role": "franchise_admin",
            "tenant_id": 4,
            "is_active": True
        },
        {
            "id": 8,
            "username": "aduthurai",
            "password": "aduthurai123",
            "email": "aduthurai@avinilabs.com",
            "first_name": "Aduthurai",
            "last_name": "Admin",
            "role": "franchise_admin",
            "tenant_id": 5,
            "is_active": True
        },
        {
            "id": 9,
            "username": "thiruppanandal",
            "password": "thiruppanandal123",
            "email": "thiruppanandal@avinilabs.com",
            "first_name": "Thiruppanandal",
            "last_name": "Admin",
            "role": "franchise_admin",
            "tenant_id": 6,
            "is_active": True
        },
        {
            "id": 10,
            "username": "eravancherry",
            "password": "eravancherry123",
            "email": "eravancherry@avinilabs.com",
            "first_name": "Eravancherry",
            "last_name": "Admin",
            "role": "franchise_admin",
            "tenant_id": 7,
            "is_active": True
        }
    ]
    
    # Check which users already exist
    existing_usernames = {user['username'] for user in users}
    users_to_add = []
    
    for new_user in new_users:
        if new_user['username'] not in existing_usernames:
            users_to_add.append(new_user)
    
    if users_to_add:
        # Add new users
        users.extend(users_to_add)
        
        # Save updated users
        with open(users_file, 'w') as f:
            json.dump(users, f, indent=2)
        
        print(f"\n✅ Added {len(users_to_add)} new users:")
        for user in users_to_add:
            print(f"  - {user['username']} / {user['password']} ({user['role']})")
    else:
        print("\n✅ All users already exist")
    
    print(f"\nTotal users now: {len(users)}")
    
    return True

if __name__ == "__main__":
    print("Creating missing users...")
    success = create_missing_users()
    
    if success:
        print("\n🎉 Users created successfully!")
        print("\nYou can now login with any of these credentials:")
        print("- admin / admin123 (System Admin)")
        print("- mayiladhuthurai / super123 (Hub Admin)")
        print("- thanjavur / thanjavur123 (Franchise Admin)")
        print("- sirkazhi / sirkazhi123 (Franchise Admin)")
    else:
        print("\n❌ Failed to create users")
