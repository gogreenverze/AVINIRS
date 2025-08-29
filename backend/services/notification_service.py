"""
Notification Service for Sample Routing System
Handles real-time notifications and alerts for routing events
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from utils import read_data, write_data
import uuid

class NotificationService:
    """
    Service for handling notifications and alerts in the sample routing system
    """
    
    NOTIFICATION_TYPES = {
        'routing_created': {
            'title': 'New Sample Routing Request',
            'template': 'A new sample routing request has been created for sample {sample_id}',
            'priority': 'medium'
        },
        'routing_approved': {
            'title': 'Sample Routing Approved',
            'template': 'Sample routing for {sample_id} has been approved',
            'priority': 'medium'
        },
        'routing_rejected': {
            'title': 'Sample Routing Rejected',
            'template': 'Sample routing for {sample_id} has been rejected: {reason}',
            'priority': 'high'
        },
        'sample_dispatched': {
            'title': 'Sample Dispatched',
            'template': 'Sample {sample_id} has been dispatched. Tracking: {tracking_number}',
            'priority': 'medium'
        },
        'sample_in_transit': {
            'title': 'Sample In Transit',
            'template': 'Sample {sample_id} is now in transit',
            'priority': 'low'
        },
        'sample_delivered': {
            'title': 'Sample Delivered',
            'template': 'Sample {sample_id} has been delivered successfully',
            'priority': 'medium'
        },
        'sample_received': {
            'title': 'Sample Received',
            'template': 'Sample {sample_id} has been received and confirmed',
            'priority': 'medium'
        },
        'new_message': {
            'title': 'New Message',
            'template': 'You have a new message regarding sample {sample_id}',
            'priority': 'medium'
        },
        'file_shared': {
            'title': 'File Shared',
            'template': 'A file has been shared for sample {sample_id}: {filename}',
            'priority': 'medium'
        },
        'routing_issue': {
            'title': 'Routing Issue Reported',
            'template': 'An issue has been reported for sample {sample_id}: {issue_description}',
            'priority': 'high'
        },
        'routing_cancelled': {
            'title': 'Sample Routing Cancelled',
            'template': 'Sample routing for {sample_id} has been cancelled',
            'priority': 'high'
        }
    }
    
    @staticmethod
    def create_notification(notification_type: str, recipient_id: int, routing_id: int,
                          data: Dict = None, sender_id: int = None) -> Dict:
        """Create a new notification"""
        if notification_type not in NotificationService.NOTIFICATION_TYPES:
            raise ValueError(f"Unknown notification type: {notification_type}")
        
        notification_config = NotificationService.NOTIFICATION_TYPES[notification_type]
        data = data or {}
        
        # Generate notification content
        title = notification_config['title']
        message = notification_config['template'].format(**data)
        
        notification = {
            'id': str(uuid.uuid4()),
            'type': notification_type,
            'title': title,
            'message': message,
            'recipient_id': recipient_id,
            'sender_id': sender_id,
            'routing_id': routing_id,
            'priority': notification_config['priority'],
            'is_read': False,
            'created_at': datetime.now().isoformat(),
            'read_at': None,
            'data': data
        }
        
        # Save notification
        notifications = read_data('notifications.json')
        notifications.append(notification)
        write_data('notifications.json', notifications)
        
        return notification
    
    @staticmethod
    def get_user_notifications(user_id: int, unread_only: bool = False,
                             limit: int = 50) -> List[Dict]:
        """Get notifications for a specific user"""
        notifications = read_data('notifications.json')
        
        # Filter by user
        user_notifications = [n for n in notifications if n['recipient_id'] == user_id]
        
        # Filter by read status if requested
        if unread_only:
            user_notifications = [n for n in user_notifications if not n['is_read']]
        
        # Sort by creation date (newest first)
        user_notifications.sort(key=lambda x: x['created_at'], reverse=True)
        
        # Apply limit
        return user_notifications[:limit]
    
    @staticmethod
    def mark_notification_as_read(notification_id: str, user_id: int) -> bool:
        """Mark a notification as read"""
        notifications = read_data('notifications.json')
        
        for i, notification in enumerate(notifications):
            if (notification['id'] == notification_id and 
                notification['recipient_id'] == user_id):
                notifications[i]['is_read'] = True
                notifications[i]['read_at'] = datetime.now().isoformat()
                write_data('notifications.json', notifications)
                return True
        
        return False
    
    @staticmethod
    def mark_all_notifications_as_read(user_id: int) -> int:
        """Mark all notifications as read for a user"""
        notifications = read_data('notifications.json')
        count = 0
        
        for i, notification in enumerate(notifications):
            if (notification['recipient_id'] == user_id and not notification['is_read']):
                notifications[i]['is_read'] = True
                notifications[i]['read_at'] = datetime.now().isoformat()
                count += 1
        
        if count > 0:
            write_data('notifications.json', notifications)
        
        return count
    
    @staticmethod
    def get_unread_count(user_id: int) -> int:
        """Get count of unread notifications for a user"""
        notifications = read_data('notifications.json')
        return len([n for n in notifications 
                   if n['recipient_id'] == user_id and not n['is_read']])
    
    @staticmethod
    def notify_routing_participants(routing_id: int, notification_type: str,
                                  data: Dict = None, exclude_user_id: int = None):
        """Send notification to all participants in a routing"""
        # Get routing data
        routings = read_data('sample_routings.json')
        routing = next((r for r in routings if r['id'] == routing_id), None)
        
        if not routing:
            return
        
        # Get participant user IDs
        participants = []
        
        # Add source tenant users
        if routing.get('from_tenant_id'):
            users = read_data('users.json')
            source_users = [u for u in users if u.get('tenant_id') == routing['from_tenant_id']]
            participants.extend([u['id'] for u in source_users])
        
        # Add destination tenant users
        if routing.get('to_tenant_id'):
            users = read_data('users.json')
            dest_users = [u for u in users if u.get('tenant_id') == routing['to_tenant_id']]
            participants.extend([u['id'] for u in dest_users])
        
        # Remove duplicates and excluded user
        participants = list(set(participants))
        if exclude_user_id:
            participants = [p for p in participants if p != exclude_user_id]
        
        # Send notifications to all participants
        for participant_id in participants:
            NotificationService.create_notification(
                notification_type=notification_type,
                recipient_id=participant_id,
                routing_id=routing_id,
                data=data,
                sender_id=exclude_user_id
            )
    
    @staticmethod
    def notify_workflow_change(routing_id: int, old_stage: str, new_stage: str,
                             user_id: int, notes: str = ''):
        """Send notification when workflow stage changes"""
        # Get routing data for context
        routings = read_data('sample_routings.json')
        routing = next((r for r in routings if r['id'] == routing_id), None)
        
        if not routing:
            return
        
        # Determine notification type based on stage change
        notification_type = 'routing_created'  # default
        
        stage_notification_map = {
            'approved': 'routing_approved',
            'rejected': 'routing_rejected',
            'in_transit': 'sample_in_transit',
            'delivered': 'sample_delivered',
            'completed': 'sample_received',
            'cancelled': 'routing_cancelled'
        }
        
        if new_stage in stage_notification_map:
            notification_type = stage_notification_map[new_stage]
        
        # Prepare notification data
        data = {
            'sample_id': routing.get('sample', {}).get('sample_id', 'Unknown'),
            'old_stage': old_stage,
            'new_stage': new_stage,
            'notes': notes,
            'tracking_number': routing.get('tracking_number', ''),
            'reason': notes  # For rejection notifications
        }
        
        # Send notification to all participants except the user who made the change
        NotificationService.notify_routing_participants(
            routing_id=routing_id,
            notification_type=notification_type,
            data=data,
            exclude_user_id=user_id
        )
    
    @staticmethod
    def cleanup_old_notifications(days_old: int = 30):
        """Clean up notifications older than specified days"""
        from datetime import datetime, timedelta
        
        notifications = read_data('notifications.json')
        cutoff_date = datetime.now() - timedelta(days=days_old)
        
        # Keep notifications newer than cutoff date
        filtered_notifications = [
            n for n in notifications 
            if datetime.fromisoformat(n['created_at']) > cutoff_date
        ]
        
        if len(filtered_notifications) < len(notifications):
            write_data('notifications.json', filtered_notifications)
            return len(notifications) - len(filtered_notifications)
        
        return 0
