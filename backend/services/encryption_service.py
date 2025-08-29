"""
Encryption Service for End-to-End Encrypted Communication
Handles message and file encryption for secure communication
"""

import base64
import hashlib
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from typing import Dict, Tuple, Optional
import json

class EncryptionService:
    """
    Service for handling end-to-end encryption of messages and files
    """
    
    @staticmethod
    def generate_key() -> bytes:
        """Generate a new encryption key"""
        return Fernet.generate_key()
    
    @staticmethod
    def derive_key_from_password(password: str, salt: bytes = None) -> Tuple[bytes, bytes]:
        """Derive encryption key from password"""
        if salt is None:
            salt = os.urandom(16)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key, salt
    
    @staticmethod
    def encrypt_message(message: str, key: bytes) -> str:
        """Encrypt a message using the provided key"""
        f = Fernet(key)
        encrypted_message = f.encrypt(message.encode())
        return base64.urlsafe_b64encode(encrypted_message).decode()
    
    @staticmethod
    def decrypt_message(encrypted_message: str, key: bytes) -> str:
        """Decrypt a message using the provided key"""
        try:
            f = Fernet(key)
            encrypted_data = base64.urlsafe_b64decode(encrypted_message.encode())
            decrypted_message = f.decrypt(encrypted_data)
            return decrypted_message.decode()
        except Exception as e:
            raise ValueError(f"Failed to decrypt message: {str(e)}")
    
    @staticmethod
    def encrypt_file_content(file_content: bytes, key: bytes) -> str:
        """Encrypt file content"""
        f = Fernet(key)
        encrypted_content = f.encrypt(file_content)
        return base64.urlsafe_b64encode(encrypted_content).decode()
    
    @staticmethod
    def decrypt_file_content(encrypted_content: str, key: bytes) -> bytes:
        """Decrypt file content"""
        try:
            f = Fernet(key)
            encrypted_data = base64.urlsafe_b64decode(encrypted_content.encode())
            decrypted_content = f.decrypt(encrypted_data)
            return decrypted_content
        except Exception as e:
            raise ValueError(f"Failed to decrypt file: {str(e)}")
    
    @staticmethod
    def generate_chat_room_key(routing_id: int, participants: list = None) -> bytes:
        """Generate a deterministic key for a chat room based on routing ID"""
        # Use only routing ID for key generation to allow all participants to decrypt
        seed_string = f"routing_{routing_id}_chat_room"

        # Use SHA256 to create a deterministic hash
        hash_object = hashlib.sha256(seed_string.encode())
        seed_bytes = hash_object.digest()

        # Use the hash as salt for key derivation
        key, _ = EncryptionService.derive_key_from_password("avini_routing_chat", seed_bytes[:16])
        return key
    
    @staticmethod
    def create_encrypted_chat_message(routing_id: int, sender_id: int, recipient_id: int,
                                    message: str, message_type: str = 'text') -> Dict:
        """Create an encrypted chat message"""
        # Use routing-based key so all participants can decrypt
        encryption_key = EncryptionService.generate_chat_room_key(routing_id)

        # Encrypt the message
        encrypted_content = EncryptionService.encrypt_message(message, encryption_key)

        return {
            'routing_id': routing_id,
            'sender_id': sender_id,
            'recipient_id': recipient_id,
            'message_type': message_type,
            'encrypted_content': encrypted_content,
            'is_encrypted': True
        }
    
    @staticmethod
    def decrypt_chat_message(message_data: Dict, user_id: int) -> str:
        """Decrypt a chat message for a specific user"""
        if not message_data.get('is_encrypted', False):
            return message_data.get('content', '')

        routing_id = message_data['routing_id']

        # Use routing-based key so all participants can decrypt
        encryption_key = EncryptionService.generate_chat_room_key(routing_id)

        try:
            decrypted_message = EncryptionService.decrypt_message(
                message_data['encrypted_content'],
                encryption_key
            )
            return decrypted_message
        except Exception as e:
            raise ValueError(f"Failed to decrypt message: {str(e)}")
    
    @staticmethod
    def create_encrypted_file_attachment(routing_id: int, sender_id: int, recipient_id: int,
                                       file_content: bytes, filename: str, 
                                       content_type: str) -> Dict:
        """Create an encrypted file attachment"""
        participants = [sender_id, recipient_id]
        encryption_key = EncryptionService.generate_chat_room_key(routing_id, participants)
        
        # Encrypt the file content
        encrypted_content = EncryptionService.encrypt_file_content(file_content, encryption_key)
        
        return {
            'routing_id': routing_id,
            'sender_id': sender_id,
            'recipient_id': recipient_id,
            'filename': filename,
            'content_type': content_type,
            'encrypted_content': encrypted_content,
            'is_encrypted': True,
            'file_size': len(file_content)
        }
    
    @staticmethod
    def decrypt_file_attachment(file_data: Dict, user_id: int) -> bytes:
        """Decrypt a file attachment for a specific user"""
        if not file_data.get('is_encrypted', False):
            raise ValueError("File is not encrypted")
        
        routing_id = file_data['routing_id']
        sender_id = file_data['sender_id']
        recipient_id = file_data['recipient_id']
        
        # Verify user has access to this file
        if user_id not in [sender_id, recipient_id]:
            raise ValueError("User does not have access to this file")
        
        participants = [sender_id, recipient_id]
        encryption_key = EncryptionService.generate_chat_room_key(routing_id, participants)
        
        try:
            decrypted_content = EncryptionService.decrypt_file_content(
                file_data['encrypted_content'], 
                encryption_key
            )
            return decrypted_content
        except Exception as e:
            raise ValueError(f"Failed to decrypt file: {str(e)}")
    
    @staticmethod
    def verify_message_integrity(message_data: Dict) -> bool:
        """Verify the integrity of an encrypted message"""
        try:
            # Basic integrity check - ensure required fields are present
            required_fields = ['routing_id', 'sender_id', 'recipient_id', 'encrypted_content']
            return all(field in message_data for field in required_fields)
        except Exception:
            return False
