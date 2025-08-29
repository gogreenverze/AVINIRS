#!/usr/bin/env python3
"""
Test script to verify the chat message visibility fixes.
This script tests the chat functionality between different franchise admins.
"""

import requests
import json
import sys

BASE_URL = "http://localhost:5001"

def login(username, password):
    """Login and get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": username,
        "password": password
    })
    if response.status_code == 200:
        return response.json().get('token')
    else:
        print(f"Login failed: {response.status_code} - {response.text}")
        return None

def get_routing_messages(token, routing_id):
    """Get chat messages for a routing"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/routing/{routing_id}/messages", headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error getting messages: {response.status_code} - {response.text}")
        return None

def send_message(token, routing_id, content):
    """Send a chat message"""
    headers = {"Authorization": f"Bearer {token}"}
    data = {"content": content, "message_type": "text"}
    response = requests.post(f"{BASE_URL}/api/routing/{routing_id}/messages", 
                           headers=headers, json=data)
    
    if response.status_code == 201:
        return response.json()
    else:
        print(f"Error sending message: {response.status_code} - {response.text}")
        return None

def approve_routing(token, routing_id, notes="Test approval"):
    """Approve a routing"""
    headers = {"Authorization": f"Bearer {token}"}
    data = {"notes": notes}
    response = requests.post(f"{BASE_URL}/api/samples/routing/{routing_id}/approve", 
                           headers=headers, json=data)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error approving routing: {response.status_code} - {response.text}")
        return None

def main():
    print("Testing Chat Message Visibility Fixes")
    print("=" * 50)
    
    # Test with routing ID 7 (from Mayiladuthurai to Sirkazhi, pending approval)
    routing_id = 7
    
    # Login as Mayiladuthurai admin (source)
    print("\n1. Testing as Mayiladuthurai admin (source)...")
    mayil_token = login("mayiladhuthurai", "super123")
    if not mayil_token:
        print("Failed to login as Mayiladuthurai admin")
        return
    
    # Login as Sirkazhi admin (destination)
    print("\n2. Testing as Sirkazhi admin (destination)...")
    sirkazhi_token = login("sirkazhi", "sirkazhi123")
    if not sirkazhi_token:
        print("Failed to login as Sirkazhi admin")
        return
    
    print(f"\n3. Testing chat for routing ID {routing_id}...")
    
    # Get initial messages from both perspectives
    print("\n--- Initial Messages (Mayiladuthurai view) ---")
    mayil_messages = get_routing_messages(mayil_token, routing_id)
    if mayil_messages:
        print(f"Mayiladuthurai sees {len(mayil_messages.get('messages', []))} messages")
        for msg in mayil_messages.get('messages', []):
            print(f"  - {msg['sender_name']}: {msg['content'][:50]}...")
    
    print("\n--- Initial Messages (Sirkazhi view) ---")
    sirkazhi_messages = get_routing_messages(sirkazhi_token, routing_id)
    if sirkazhi_messages:
        print(f"Sirkazhi sees {len(sirkazhi_messages.get('messages', []))} messages")
        for msg in sirkazhi_messages.get('messages', []):
            print(f"  - {msg['sender_name']}: {msg['content'][:50]}...")
    
    # Send a message from Sirkazhi to Mayiladuthurai
    print("\n4. Sirkazhi sending message 'accepted'...")
    sent_message = send_message(sirkazhi_token, routing_id, "accepted")
    if sent_message:
        print(f"✓ Message sent successfully: {sent_message['id']}")
    
    # Check if Mayiladuthurai can see the new message
    print("\n5. Checking if Mayiladuthurai can see the new message...")
    mayil_messages_after = get_routing_messages(mayil_token, routing_id)
    if mayil_messages_after:
        new_count = len(mayil_messages_after.get('messages', []))
        old_count = len(mayil_messages.get('messages', [])) if mayil_messages else 0
        print(f"Mayiladuthurai now sees {new_count} messages (was {old_count})")
        
        if new_count > old_count:
            print("✅ SUCCESS: Message visibility is working!")
            # Show the latest message
            latest_msg = mayil_messages_after['messages'][-1]
            print(f"Latest message: {latest_msg['sender_name']}: {latest_msg['content']}")
        else:
            print("❌ ISSUE: New message not visible to Mayiladuthurai")
    
    # Test status change
    print("\n6. Testing status change (approval)...")
    approval_result = approve_routing(sirkazhi_token, routing_id, "Approved via test")
    if approval_result:
        print("✅ SUCCESS: Status change is working!")
        print(f"Routing status: {approval_result.get('routing', {}).get('status', 'unknown')}")
    else:
        print("❌ ISSUE: Status change failed")
    
    print("\n" + "=" * 50)
    print("Test completed!")

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the backend server at http://localhost:5001")
        print("Please make sure the backend server is running.")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
