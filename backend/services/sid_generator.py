"""
SID Generator Service
Provides robust SID (Sample Identification Number) generation with conflict resolution,
auto-increment logic, and branch-specific sequences.
"""

import json
import os
import time
import threading
from datetime import datetime
from typing import Optional, Dict, List, Tuple

class SIDGenerator:
    """
    Centralized SID generator with conflict resolution and branch-specific sequences
    """
    
    def __init__(self, data_dir: str = 'data'):
        self.data_dir = data_dir
        self.lock = threading.Lock()
        self.sequence_file = os.path.join(data_dir, 'sid_sequences.json')
        self.billing_file = os.path.join(data_dir, 'billing.json')
        self.tenants_file = os.path.join(data_dir, 'tenants.json')
        
        # Initialize sequence tracking
        self._initialize_sequences()
    
    def _initialize_sequences(self):
        """Initialize SID sequence tracking file if it doesn't exist"""
        if not os.path.exists(self.sequence_file):
            initial_sequences = {
                "sequences": {},
                "last_updated": datetime.now().isoformat(),
                "version": "1.0"
            }
            self._save_sequences(initial_sequences)
    
    def _load_sequences(self) -> Dict:
        """Load SID sequences from file"""
        try:
            with open(self.sequence_file, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {"sequences": {}, "last_updated": datetime.now().isoformat()}
    
    def _save_sequences(self, sequences: Dict):
        """Save SID sequences to file"""
        sequences["last_updated"] = datetime.now().isoformat()
        with open(self.sequence_file, 'w') as f:
            json.dump(sequences, f, indent=2)
    
    def _load_billing_data(self) -> List[Dict]:
        """Load existing billing data to check for conflicts"""
        try:
            with open(self.billing_file, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def _load_tenants(self) -> List[Dict]:
        """Load tenant configuration"""
        try:
            with open(self.tenants_file, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def _get_tenant_config(self, tenant_id: int) -> Optional[Dict]:
        """Get tenant configuration by ID"""
        tenants = self._load_tenants()
        return next((t for t in tenants if t.get('id') == tenant_id), None)
    
    def _get_existing_sids_for_tenant(self, tenant_id: int) -> List[str]:
        """Get all existing SID numbers for a specific tenant"""
        billing_data = self._load_billing_data()
        tenant_sids = []
        
        for bill in billing_data:
            if bill.get('tenant_id') == tenant_id and bill.get('sid_number'):
                tenant_sids.append(bill['sid_number'])
        
        return tenant_sids
    
    def _extract_number_from_sid(self, sid: str, site_code: str = None) -> Optional[int]:
        """Extract numeric part from SID"""
        try:
            if site_code and sid.startswith(site_code):
                # Remove site code prefix
                numeric_part = sid[len(site_code):]
            else:
                # Try to extract trailing digits
                numeric_part = ''.join(filter(str.isdigit, sid))
            
            return int(numeric_part) if numeric_part else None
        except (ValueError, TypeError):
            return None
    
    def _find_next_available_number(self, tenant_id: int, site_code: str, use_prefix: bool) -> int:
        """Find the next available SID number for a tenant"""
        existing_sids = self._get_existing_sids_for_tenant(tenant_id)
        existing_numbers = []
        
        for sid in existing_sids:
            number = self._extract_number_from_sid(sid, site_code if use_prefix else None)
            if number is not None:
                existing_numbers.append(number)
        
        # Get current sequence from tracking
        sequences = self._load_sequences()
        tenant_key = str(tenant_id)
        current_sequence = sequences["sequences"].get(tenant_key, 0)
        
        # Find next available number
        if existing_numbers:
            max_existing = max(existing_numbers)
            next_number = max(max_existing + 1, current_sequence + 1)
        else:
            next_number = max(1, current_sequence + 1)
        
        # Ensure the number is not already taken
        while next_number in existing_numbers:
            next_number += 1
        
        return next_number
    
    def _is_sid_unique(self, sid: str, tenant_id: int) -> bool:
        """Check if SID is unique within the tenant"""
        existing_sids = self._get_existing_sids_for_tenant(tenant_id)
        return sid not in existing_sids
    
    def generate_next_sid(self, tenant_id: int, max_retries: int = 3) -> str:
        """
        Generate next available SID for a tenant with conflict resolution
        
        Args:
            tenant_id: Tenant ID to generate SID for
            max_retries: Maximum number of retry attempts
            
        Returns:
            Generated SID string
            
        Raises:
            Exception: If SID generation fails after all retries
        """
        with self.lock:
            tenant_config = self._get_tenant_config(tenant_id)
            if not tenant_config:
                raise Exception(f"Tenant {tenant_id} not found")
            
            site_code = tenant_config.get('site_code', 'XX')
            use_prefix = tenant_config.get('use_site_code_prefix', False)
            
            for attempt in range(max_retries):
                try:
                    # Find next available number
                    next_number = self._find_next_available_number(tenant_id, site_code, use_prefix)
                    
                    # Generate SID
                    if use_prefix:
                        sid = f"{site_code}{next_number:03d}"
                    else:
                        sid = f"{next_number:03d}"
                    
                    # Double-check uniqueness
                    if self._is_sid_unique(sid, tenant_id):
                        # Update sequence tracking
                        sequences = self._load_sequences()
                        sequences["sequences"][str(tenant_id)] = next_number
                        self._save_sequences(sequences)
                        
                        print(f"✓ Generated SID {sid} for tenant {tenant_id} (attempt {attempt + 1})")
                        return sid
                    else:
                        print(f"✗ SID {sid} already exists for tenant {tenant_id} (attempt {attempt + 1})")
                        
                except Exception as e:
                    print(f"✗ SID generation attempt {attempt + 1} failed: {e}")
                
                # Exponential backoff for retries
                if attempt < max_retries - 1:
                    time.sleep(0.1 * (2 ** attempt))
            
            # Final fallback with timestamp
            timestamp_suffix = int(time.time() * 1000) % 10000
            fallback_sid = f"TMP{timestamp_suffix:04d}"
            print(f"⚠ Using fallback SID {fallback_sid} for tenant {tenant_id}")
            return fallback_sid
    
    def validate_sid_format(self, sid: str, tenant_id: int) -> Tuple[bool, str]:
        """
        Validate SID format for a specific tenant
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not sid:
            return False, "SID cannot be empty"
        
        tenant_config = self._get_tenant_config(tenant_id)
        if not tenant_config:
            return False, f"Tenant {tenant_id} not found"
        
        site_code = tenant_config.get('site_code', 'XX')
        use_prefix = tenant_config.get('use_site_code_prefix', False)
        
        if use_prefix:
            # Format: SITECODEXXX (e.g., MYD001)
            if not sid.startswith(site_code):
                return False, f"SID must start with site code '{site_code}'"
            
            numeric_part = sid[len(site_code):]
            if not numeric_part.isdigit() or len(numeric_part) != 3:
                return False, f"SID must be in format '{site_code}XXX' where XXX is 3 digits"
        else:
            # Format: XXX (e.g., 001)
            if not sid.isdigit() or len(sid) != 3:
                return False, "SID must be exactly 3 digits (XXX format)"
        
        return True, ""
    
    def check_sid_availability(self, sid: str, tenant_id: int) -> bool:
        """Check if a specific SID is available for use"""
        return self._is_sid_unique(sid, tenant_id)

# Global instance
sid_generator = SIDGenerator()
