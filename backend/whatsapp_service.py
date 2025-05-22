"""
WhatsApp API integration service for RSAVINI LIS.
Handles sending messages via WhatsApp API and tracking message status.
"""
import requests
import json
import logging
from datetime import datetime
from utils import read_data, write_data

logger = logging.getLogger(__name__)

class WhatsAppService:
    """Service for interacting with WhatsApp API."""
    
    @staticmethod
    def get_config(tenant_id):
        """Get WhatsApp configuration for a tenant."""
        configs = read_data('whatsapp_config.json')
        return next((config for config in configs if config['tenant_id'] == tenant_id), None)
    
    @staticmethod
    def is_enabled(tenant_id):
        """Check if WhatsApp integration is enabled for a tenant."""
        config = WhatsAppService.get_config(tenant_id)
        return config is not None and config.get('is_enabled', False)
    
    @staticmethod
    def send_message(user_id, tenant_id, recipient_number, message_content, message_type, order_id=None, billing_id=None):
        """
        Send a WhatsApp message and log it in the database.
        
        Args:
            user_id: ID of the user sending the message
            tenant_id: ID of the tenant
            recipient_number: Recipient's phone number
            message_content: Message content
            message_type: Type of message ('invoice', 'report', etc.)
            order_id: Optional order ID reference
            billing_id: Optional billing ID reference
            
        Returns:
            dict with the result
        """
        # Create message record
        messages = read_data('whatsapp_messages.json')
        message_id = len(messages) + 1
        
        message = {
            'id': message_id,
            'tenant_id': tenant_id,
            'user_id': user_id,
            'recipient_number': recipient_number,
            'message_content': message_content,
            'message_type': message_type,
            'order_id': order_id,
            'billing_id': billing_id,
            'status': 'pending',
            'created_at': datetime.utcnow().isoformat(),
            'sent_at': None,
            'delivered_at': None,
            'message_id': None,
            'error_message': None
        }
        
        messages.append(message)
        write_data('whatsapp_messages.json', messages)
        
        # Get WhatsApp configuration
        config = WhatsAppService.get_config(tenant_id)
        if not config or not config.get('is_enabled', False):
            message['status'] = 'failed'
            message['error_message'] = 'WhatsApp integration is not enabled for this tenant'
            # Update the message in the list
            messages[-1] = message
            write_data('whatsapp_messages.json', messages)
            return message
        
        try:
            # Format the phone number (remove spaces, ensure it starts with country code)
            formatted_number = WhatsAppService._format_phone_number(recipient_number)
            
            # In a real implementation, this would call the WhatsApp API
            # For now, we'll simulate a successful API call
            
            # Simulate API call
            # In a real implementation, this would be:
            # response = requests.post(
            #     f"https://graph.facebook.com/v17.0/{config['phone_number_id']}/messages",
            #     headers={
            #         "Authorization": f"Bearer {config['api_key']}",
            #         "Content-Type": "application/json"
            #     },
            #     data=json.dumps({
            #         "messaging_product": "whatsapp",
            #         "to": formatted_number,
            #         "type": "text",
            #         "text": {"body": message_content}
            #     })
            # )
            # response_data = response.json()
            
            # Simulate successful response
            message['status'] = 'sent'
            message['message_id'] = f"simulated-message-id-{message['id']}"
            message['sent_at'] = datetime.utcnow().isoformat()
            
            # Update the message in the list
            messages[-1] = message
            write_data('whatsapp_messages.json', messages)
            
            return message
            
        except Exception as e:
            logger.error(f"Error sending WhatsApp message: {str(e)}")
            message['status'] = 'failed'
            message['error_message'] = str(e)
            # Update the message in the list
            messages[-1] = message
            write_data('whatsapp_messages.json', messages)
            return message
    
    @staticmethod
    def _format_phone_number(phone_number):
        """Format phone number for WhatsApp API."""
        # Remove any non-digit characters
        digits_only = ''.join(filter(str.isdigit, phone_number))
        
        # Ensure it starts with country code (default to India +91)
        if not digits_only.startswith('91'):
            digits_only = '91' + digits_only
        
        return digits_only
    
    @staticmethod
    def get_message_history(tenant_id, limit=100):
        """Get message history for a tenant."""
        messages = read_data('whatsapp_messages.json')
        tenant_messages = [msg for msg in messages if msg['tenant_id'] == tenant_id]
        # Sort by created_at (newest first)
        tenant_messages.sort(key=lambda x: x['created_at'], reverse=True)
        return tenant_messages[:limit]
    
    @staticmethod
    def get_message(message_id):
        """Get a specific message by ID."""
        messages = read_data('whatsapp_messages.json')
        return next((msg for msg in messages if msg['id'] == message_id), None)
    
    @staticmethod
    def update_message_status(message_id, status, error_message=None):
        """Update the status of a message."""
        messages = read_data('whatsapp_messages.json')
        for i, message in enumerate(messages):
            if message['id'] == message_id:
                message['status'] = status
                if error_message:
                    message['error_message'] = error_message
                if status == 'delivered':
                    message['delivered_at'] = datetime.utcnow().isoformat()
                messages[i] = message
                write_data('whatsapp_messages.json', messages)
                return message
        return None
    
    @staticmethod
    def format_message_with_headers(user, tenant, patient_name, message_body):
        """
        Format a message with the required headers.
        
        Args:
            user: User object of the sender
            tenant: Tenant object
            patient_name: Name of the patient
            message_body: Main message content
            
        Returns:
            Formatted message string
        """
        user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
        tenant_name = tenant.get('name', '')
        
        headers = [
            f"From: {user_name} ({tenant_name})",
            f"Patient: {patient_name}",
            f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        ]
        
        return "\n".join(headers) + "\n\n" + message_body
