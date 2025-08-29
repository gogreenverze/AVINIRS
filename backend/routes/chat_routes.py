"""
Chat Routes - End-to-end encrypted communication system for sample routing
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid
from utils import read_data, write_data, token_required
from services.encryption_service import EncryptionService
from services.notification_service import NotificationService

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/api/routing/<int:routing_id>/messages', methods=['GET'])
@token_required
def get_routing_messages(routing_id):
    """Get chat messages for a specific routing"""
    # Verify user has access to this routing
    routings = read_data('sample_routings.json')
    routing = next((r for r in routings if r['id'] == routing_id), None)
    
    if not routing:
        return jsonify({'message': 'Routing not found'}), 404
    
    user_tenant_id = request.current_user.get('tenant_id')
    user_id = request.current_user.get('id')
    
    if (routing.get('from_tenant_id') != user_tenant_id and 
        routing.get('to_tenant_id') != user_tenant_id and
        request.current_user.get('role') != 'admin'):
        return jsonify({'message': 'Access denied'}), 403
    
    # Get messages
    messages = read_data('routing_messages.json')
    routing_messages = [m for m in messages if m.get('routing_id') == routing_id]
    
    # Sort by timestamp
    routing_messages.sort(key=lambda x: x.get('created_at', ''))
    
    # Decrypt messages for the current user
    decrypted_messages = []
    users = read_data('users.json')
    
    for message in routing_messages:
        try:
            # Decrypt message content
            if message.get('is_encrypted', False):
                decrypted_content = EncryptionService.decrypt_chat_message(message, user_id)
            else:
                decrypted_content = message.get('content', '')

            # Add sender information
            sender_id = message.get('sender_id')
            sender = next((u for u in users if u['id'] == sender_id), None)

            # Determine if this message is read by current user
            # For now, we'll check if the current user is the recipient
            is_read_by_user = (message.get('recipient_id') == user_id and message.get('is_read', False))

            decrypted_message = {
                'id': message['id'],
                'routing_id': message['routing_id'],
                'sender_id': sender_id,
                'sender_name': sender.get('name', sender.get('username', 'Unknown')) if sender else 'Unknown',
                'message_type': message.get('message_type', 'text'),
                'content': decrypted_content,
                'created_at': message['created_at'],
                'is_read': is_read_by_user,
                'read_at': message.get('read_at') if is_read_by_user else None,
                'metadata': message.get('metadata', {}),
                'is_own_message': sender_id == user_id
            }

            decrypted_messages.append(decrypted_message)

        except Exception as e:
            # Log the error for debugging but continue processing other messages
            print(f"Warning: Failed to decrypt message {message.get('id', 'unknown')}: {e}")
            continue
    
    return jsonify({
        'messages': decrypted_messages,
        'total_count': len(decrypted_messages)
    })

@chat_bp.route('/api/routing/<int:routing_id>/messages', methods=['POST'])
@token_required
def send_routing_message(routing_id):
    """Send a chat message for a specific routing"""
    data = request.get_json()
    
    if not data.get('content'):
        return jsonify({'message': 'Message content is required'}), 400
    
    # Verify user has access to this routing
    routings = read_data('sample_routings.json')
    routing = next((r for r in routings if r['id'] == routing_id), None)
    
    if not routing:
        return jsonify({'message': 'Routing not found'}), 404
    
    user_tenant_id = request.current_user.get('tenant_id')
    user_id = request.current_user.get('id')
    
    if (routing.get('from_tenant_id') != user_tenant_id and 
        routing.get('to_tenant_id') != user_tenant_id and
        request.current_user.get('role') != 'admin'):
        return jsonify({'message': 'Access denied'}), 403
    
    # Determine recipient
    if routing.get('from_tenant_id') == user_tenant_id:
        recipient_tenant_id = routing.get('to_tenant_id')
    else:
        recipient_tenant_id = routing.get('from_tenant_id')
    
    # Get a representative user from the recipient tenant
    users = read_data('users.json')
    recipient_users = [u for u in users if u.get('tenant_id') == recipient_tenant_id]
    
    if not recipient_users:
        return jsonify({'message': 'No users found in recipient tenant'}), 400
    
    # For simplicity, send to the first active user in the tenant
    recipient_id = recipient_users[0]['id']
    
    # Create encrypted message
    encrypted_message_data = EncryptionService.create_encrypted_chat_message(
        routing_id=routing_id,
        sender_id=user_id,
        recipient_id=recipient_id,
        message=data['content'],
        message_type=data.get('message_type', 'text')
    )
    
    # Create message record
    messages = read_data('routing_messages.json')
    
    new_message = {
        'id': str(uuid.uuid4()),
        'routing_id': routing_id,
        'sender_id': user_id,
        'recipient_id': recipient_id,
        'message_type': data.get('message_type', 'text'),
        'encrypted_content': encrypted_message_data['encrypted_content'],
        'is_encrypted': True,
        'created_at': datetime.now().isoformat(),
        'is_read': False,
        'read_at': None,
        'metadata': data.get('metadata', {})
    }
    
    messages.append(new_message)
    write_data('routing_messages.json', messages)
    
    # Send notification to recipient
    sample = routing.get('sample', {})
    NotificationService.create_notification(
        notification_type='new_message',
        recipient_id=recipient_id,
        routing_id=routing_id,
        data={
            'sample_id': sample.get('sample_id', 'Unknown'),
            'sender_name': request.current_user.get('name', request.current_user.get('username', 'Unknown'))
        },
        sender_id=user_id
    )
    
    # Return the message with decrypted content for the sender
    response_message = {
        'id': new_message['id'],
        'routing_id': routing_id,
        'sender_id': user_id,
        'message_type': data.get('message_type', 'text'),
        'content': data['content'],  # Original content for sender
        'created_at': new_message['created_at'],
        'is_read': False
    }
    
    return jsonify(response_message), 201

@chat_bp.route('/api/routing/<int:routing_id>/messages/<message_id>/read', methods=['POST'])
@token_required
def mark_message_as_read(routing_id, message_id):
    """Mark a message as read"""
    # Verify user has access to this routing
    routings = read_data('sample_routings.json')
    routing = next((r for r in routings if r['id'] == routing_id), None)
    
    if not routing:
        return jsonify({'message': 'Routing not found'}), 404
    
    user_tenant_id = request.current_user.get('tenant_id')
    user_id = request.current_user.get('id')
    
    if (routing.get('from_tenant_id') != user_tenant_id and 
        routing.get('to_tenant_id') != user_tenant_id and
        request.current_user.get('role') != 'admin'):
        return jsonify({'message': 'Access denied'}), 403
    
    # Find and update message
    messages = read_data('routing_messages.json')
    message_index = next((i for i, m in enumerate(messages) 
                         if m['id'] == message_id and m['routing_id'] == routing_id), None)
    
    if message_index is None:
        return jsonify({'message': 'Message not found'}), 404
    
    message = messages[message_index]
    
    # Check if user is the recipient
    if message.get('recipient_id') != user_id:
        return jsonify({'message': 'Can only mark own messages as read'}), 403
    
    # Update message
    messages[message_index]['is_read'] = True
    messages[message_index]['read_at'] = datetime.now().isoformat()
    
    write_data('routing_messages.json', messages)
    
    return jsonify({'message': 'Message marked as read'})

@chat_bp.route('/api/routing/<int:routing_id>/messages/unread-count', methods=['GET'])
@token_required
def get_unread_message_count(routing_id):
    """Get count of unread messages for a routing"""
    # Verify user has access to this routing
    routings = read_data('sample_routings.json')
    routing = next((r for r in routings if r['id'] == routing_id), None)
    
    if not routing:
        return jsonify({'message': 'Routing not found'}), 404
    
    user_tenant_id = request.current_user.get('tenant_id')
    user_id = request.current_user.get('id')
    
    if (routing.get('from_tenant_id') != user_tenant_id and 
        routing.get('to_tenant_id') != user_tenant_id and
        request.current_user.get('role') != 'admin'):
        return jsonify({'message': 'Access denied'}), 403
    
    # Count unread messages for this user
    messages = read_data('routing_messages.json')
    unread_count = len([m for m in messages 
                       if m.get('routing_id') == routing_id and 
                          m.get('recipient_id') == user_id and 
                          not m.get('is_read', False)])
    
    return jsonify({'unread_count': unread_count})

@chat_bp.route('/api/routing/messages/unread-summary', methods=['GET'])
@token_required
def get_unread_messages_summary():
    """Get summary of unread messages across all routings for current user"""
    user_id = request.current_user.get('id')
    user_tenant_id = request.current_user.get('tenant_id')
    
    # Get all routings user has access to
    routings = read_data('sample_routings.json')
    accessible_routings = [r for r in routings 
                          if r.get('from_tenant_id') == user_tenant_id or 
                             r.get('to_tenant_id') == user_tenant_id]
    
    # Get unread messages
    messages = read_data('routing_messages.json')
    unread_messages = [m for m in messages 
                      if m.get('recipient_id') == user_id and 
                         not m.get('is_read', False)]
    
    # Group by routing
    routing_summary = {}
    for message in unread_messages:
        routing_id = message.get('routing_id')
        if routing_id not in routing_summary:
            routing_summary[routing_id] = 0
        routing_summary[routing_id] += 1
    
    # Add routing details
    summary = []
    for routing_id, count in routing_summary.items():
        routing = next((r for r in accessible_routings if r['id'] == routing_id), None)
        if routing:
            summary.append({
                'routing_id': routing_id,
                'unread_count': count,
                'sample_id': routing.get('sample', {}).get('sample_id', 'Unknown'),
                'tracking_number': routing.get('tracking_number', ''),
                'status': routing.get('status', '')
            })
    
    return jsonify({
        'total_unread': sum(routing_summary.values()),
        'routings': summary
    })
