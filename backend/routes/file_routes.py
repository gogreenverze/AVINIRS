"""
File Routes - Secure file attachment system for sample routing
"""

from flask import Blueprint, request, jsonify, send_file
from datetime import datetime
import uuid
import os
import base64
from io import BytesIO
from utils import read_data, write_data, token_required
from services.encryption_service import EncryptionService
from services.notification_service import NotificationService

file_bp = Blueprint('file', __name__)

# Allowed file types and max size
ALLOWED_EXTENSIONS = {
    'pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 
    'xls', 'xlsx', 'csv', 'zip', 'rar'
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@file_bp.route('/api/routing/<int:routing_id>/files', methods=['GET'])
@token_required
def get_routing_files(routing_id):
    """Get file attachments for a specific routing"""
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
    
    # Get files
    files = read_data('routing_files.json')
    routing_files = [f for f in files if f.get('routing_id') == routing_id]
    
    # Sort by upload date
    routing_files.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    # Prepare file list (without encrypted content)
    file_list = []
    users = read_data('users.json')
    
    for file_record in routing_files:
        # Add uploader information
        uploader_id = file_record.get('uploaded_by')
        uploader = next((u for u in users if u['id'] == uploader_id), None)
        
        file_info = {
            'id': file_record['id'],
            'routing_id': file_record['routing_id'],
            'filename': file_record['filename'],
            'content_type': file_record['content_type'],
            'file_size': file_record['file_size'],
            'uploaded_by': uploader_id,
            'uploader_name': uploader.get('name', uploader.get('username', 'Unknown')) if uploader else 'Unknown',
            'created_at': file_record['created_at'],
            'description': file_record.get('description', ''),
            'is_encrypted': file_record.get('is_encrypted', False)
        }
        
        file_list.append(file_info)
    
    return jsonify({
        'files': file_list,
        'total_count': len(file_list)
    })

@file_bp.route('/api/routing/<int:routing_id>/files', methods=['POST'])
@token_required
def upload_routing_file(routing_id):
    """Upload a file attachment for a specific routing"""
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
    
    # Check if file is present
    if 'file' not in request.files:
        return jsonify({'message': 'No file provided'}), 400
    
    file = request.files['file']
    description = request.form.get('description', '')
    
    if file.filename == '':
        return jsonify({'message': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'message': 'File type not allowed'}), 400
    
    # Read file content
    file_content = file.read()
    
    if len(file_content) > MAX_FILE_SIZE:
        return jsonify({'message': 'File size exceeds maximum limit (10MB)'}), 400
    
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
    
    recipient_id = recipient_users[0]['id']
    
    # Create encrypted file attachment
    encrypted_file_data = EncryptionService.create_encrypted_file_attachment(
        routing_id=routing_id,
        sender_id=user_id,
        recipient_id=recipient_id,
        file_content=file_content,
        filename=file.filename,
        content_type=file.content_type or 'application/octet-stream'
    )
    
    # Create file record
    files = read_data('routing_files.json')
    
    new_file = {
        'id': str(uuid.uuid4()),
        'routing_id': routing_id,
        'filename': file.filename,
        'content_type': file.content_type or 'application/octet-stream',
        'file_size': len(file_content),
        'uploaded_by': user_id,
        'recipient_id': recipient_id,
        'encrypted_content': encrypted_file_data['encrypted_content'],
        'is_encrypted': True,
        'created_at': datetime.now().isoformat(),
        'description': description
    }
    
    files.append(new_file)
    write_data('routing_files.json', files)
    
    # Send notification
    sample = routing.get('sample', {})
    NotificationService.create_notification(
        notification_type='file_shared',
        recipient_id=recipient_id,
        routing_id=routing_id,
        data={
            'sample_id': sample.get('sample_id', 'Unknown'),
            'filename': file.filename,
            'uploader_name': request.current_user.get('name', request.current_user.get('username', 'Unknown'))
        },
        sender_id=user_id
    )
    
    # Return file info (without encrypted content)
    response_file = {
        'id': new_file['id'],
        'routing_id': routing_id,
        'filename': file.filename,
        'content_type': new_file['content_type'],
        'file_size': new_file['file_size'],
        'uploaded_by': user_id,
        'created_at': new_file['created_at'],
        'description': description
    }
    
    return jsonify(response_file), 201

@file_bp.route('/api/routing/<int:routing_id>/files/<file_id>/download', methods=['GET'])
@token_required
def download_routing_file(routing_id, file_id):
    """Download a file attachment"""
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
    
    # Find file
    files = read_data('routing_files.json')
    file_record = next((f for f in files 
                       if f['id'] == file_id and f['routing_id'] == routing_id), None)
    
    if not file_record:
        return jsonify({'message': 'File not found'}), 404
    
    try:
        # Decrypt file content
        if file_record.get('is_encrypted', False):
            decrypted_content = EncryptionService.decrypt_file_attachment(file_record, user_id)
        else:
            # For non-encrypted files (legacy support)
            decrypted_content = base64.b64decode(file_record.get('content', ''))
        
        # Create file-like object
        file_obj = BytesIO(decrypted_content)
        
        return send_file(
            file_obj,
            as_attachment=True,
            download_name=file_record['filename'],
            mimetype=file_record['content_type']
        )
        
    except Exception as e:
        return jsonify({'message': f'Failed to decrypt file: {str(e)}'}), 500

@file_bp.route('/api/routing/<int:routing_id>/files/<file_id>', methods=['DELETE'])
@token_required
def delete_routing_file(routing_id, file_id):
    """Delete a file attachment"""
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
    
    # Find and delete file
    files = read_data('routing_files.json')
    file_index = next((i for i, f in enumerate(files) 
                      if f['id'] == file_id and f['routing_id'] == routing_id), None)
    
    if file_index is None:
        return jsonify({'message': 'File not found'}), 404
    
    file_record = files[file_index]
    
    # Check if user is the uploader or admin
    if (file_record.get('uploaded_by') != user_id and 
        request.current_user.get('role') != 'admin'):
        return jsonify({'message': 'Can only delete own files'}), 403
    
    # Delete file
    deleted_file = files.pop(file_index)
    write_data('routing_files.json', files)
    
    return jsonify({'message': 'File deleted successfully'})

@file_bp.route('/api/routing/files/summary', methods=['GET'])
@token_required
def get_files_summary():
    """Get summary of files across all routings for current user"""
    user_id = request.current_user.get('id')
    user_tenant_id = request.current_user.get('tenant_id')
    
    # Get all routings user has access to
    routings = read_data('sample_routings.json')
    accessible_routings = [r for r in routings 
                          if r.get('from_tenant_id') == user_tenant_id or 
                             r.get('to_tenant_id') == user_tenant_id]
    
    accessible_routing_ids = [r['id'] for r in accessible_routings]
    
    # Get files
    files = read_data('routing_files.json')
    accessible_files = [f for f in files if f.get('routing_id') in accessible_routing_ids]
    
    # Calculate summary
    total_files = len(accessible_files)
    total_size = sum(f.get('file_size', 0) for f in accessible_files)
    
    # Group by routing
    routing_summary = {}
    for file_record in accessible_files:
        routing_id = file_record.get('routing_id')
        if routing_id not in routing_summary:
            routing_summary[routing_id] = {'count': 0, 'size': 0}
        routing_summary[routing_id]['count'] += 1
        routing_summary[routing_id]['size'] += file_record.get('file_size', 0)
    
    return jsonify({
        'total_files': total_files,
        'total_size': total_size,
        'routings_with_files': len(routing_summary),
        'routing_summary': routing_summary
    })
