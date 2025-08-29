"""
Notification Routes - API endpoints for notification management
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from utils import read_data, write_data, token_required, paginate_results
from services.notification_service import NotificationService

notification_bp = Blueprint('notification', __name__)

@notification_bp.route('/api/notifications', methods=['GET'])
@token_required
def get_notifications():
    """Get notifications for the current user"""
    user_id = request.current_user.get('id')
    
    # Get query parameters
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    
    # Get notifications
    notifications = NotificationService.get_user_notifications(
        user_id=user_id,
        unread_only=unread_only,
        limit=limit * page  # Get more to handle pagination
    )
    
    # Paginate results
    paginated_data = paginate_results(notifications, page, limit)
    
    return jsonify(paginated_data)

@notification_bp.route('/api/notifications/<notification_id>/read', methods=['POST'])
@token_required
def mark_notification_as_read(notification_id):
    """Mark a specific notification as read"""
    user_id = request.current_user.get('id')
    
    success = NotificationService.mark_notification_as_read(notification_id, user_id)
    
    if success:
        return jsonify({'message': 'Notification marked as read'})
    else:
        return jsonify({'message': 'Notification not found or access denied'}), 404

@notification_bp.route('/api/notifications/mark-all-read', methods=['POST'])
@token_required
def mark_all_notifications_as_read():
    """Mark all notifications as read for the current user"""
    user_id = request.current_user.get('id')
    
    count = NotificationService.mark_all_notifications_as_read(user_id)
    
    return jsonify({
        'message': f'{count} notifications marked as read',
        'count': count
    })

@notification_bp.route('/api/notifications/unread-count', methods=['GET'])
@token_required
def get_unread_notification_count():
    """Get count of unread notifications for the current user"""
    user_id = request.current_user.get('id')
    
    count = NotificationService.get_unread_count(user_id)
    
    return jsonify({'unread_count': count})

@notification_bp.route('/api/notifications/cleanup', methods=['POST'])
@token_required
def cleanup_old_notifications():
    """Clean up old notifications (admin only)"""
    if request.current_user.get('role') != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    days_old = request.json.get('days_old', 30)
    
    if days_old < 7:
        return jsonify({'message': 'Cannot delete notifications newer than 7 days'}), 400
    
    deleted_count = NotificationService.cleanup_old_notifications(days_old)
    
    return jsonify({
        'message': f'{deleted_count} old notifications deleted',
        'deleted_count': deleted_count
    })
