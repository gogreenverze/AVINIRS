"""
SID (Sample Identification Number) Utility Functions
Provides centralized SID generation and validation for the AVINI franchise system.
"""

import json
import os
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class SIDGenerator:
    """Centralized SID generation utility for franchise-specific numbering"""

    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.tenants_file = os.path.join(data_dir, "tenants.json")
        self.billings_file = os.path.join(data_dir, "billings.json")
        self.reports_file = os.path.join(data_dir, "billing_reports.json")
        # Track generated SIDs in memory to prevent duplicates within the same session
        self._session_generated_sids = set()
    
    def read_json_file(self, file_path: str) -> List[Dict]:
        """Read JSON file with error handling"""
        try:
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return []
        except Exception as e:
            logger.error(f"Error reading {file_path}: {str(e)}")
            return []
    
    def get_tenant_site_code(self, tenant_id: int) -> str:
        """Get site code for a tenant from tenants.json"""
        try:
            tenants = self.read_json_file(self.tenants_file)
            tenant = next((t for t in tenants if t.get('id') == tenant_id), None)

            if not tenant:
                raise ValueError(f"Franchise with ID {tenant_id} not found in system. Please contact system administrator.")

            site_code = tenant.get('site_code')
            if not site_code:
                tenant_name = tenant.get('name') or f"Franchise ID {tenant_id}"
                raise ValueError(f"Franchise '{tenant_name}' (ID: {tenant_id}) does not have a valid site code. Please contact system administrator.")

            logger.info(f"Found site code '{site_code}' for tenant {tenant_id}")
            return site_code
        except Exception as e:
            logger.error(f"Error getting tenant site code: {str(e)}")
            raise ValueError(f"Unable to retrieve franchise site code for tenant {tenant_id}: {str(e)}")
    
    def get_all_tenant_site_codes(self) -> Dict[int, str]:
        """Get mapping of all tenant IDs to site codes"""
        try:
            tenants = self.read_json_file(self.tenants_file)
            site_codes = {}

            for tenant in tenants:
                tenant_id = tenant.get('id')
                site_code = tenant.get('site_code')

                if not tenant_id:
                    logger.warning(f"Skipping tenant with missing ID: {tenant}")
                    continue

                if not site_code:
                    tenant_name = tenant.get('name') or f"Franchise ID {tenant_id}"
                    raise ValueError(f"Franchise '{tenant_name}' (ID: {tenant_id}) does not have a valid site code. Please contact system administrator.")

                site_codes[tenant_id] = site_code

            return site_codes
        except Exception as e:
            logger.error(f"Error getting tenant site codes: {str(e)}")
            raise ValueError(f"Unable to retrieve franchise site codes: {str(e)}")

    def get_tenant_info(self, tenant_id: int) -> dict:
        """Get complete tenant information from tenants.json"""
        try:
            tenants = self.read_json_file(self.tenants_file)
            tenant = next((t for t in tenants if t.get('id') == tenant_id), None)

            if not tenant:
                raise ValueError(f"Franchise with ID {tenant_id} not found in system. Please contact system administrator.")

            return tenant

        except Exception as e:
            logger.error(f"Error getting tenant info for tenant {tenant_id}: {str(e)}")
            raise ValueError(f"Unable to retrieve franchise information for {tenant_id}: {str(e)}")

    def get_existing_sids_for_tenant(self, tenant_id: int, site_code: str = None, use_prefix: bool = None) -> List[int]:
        """Get existing SID numbers for a specific tenant"""
        existing_sids = []

        # Get tenant info to determine prefix usage if not provided
        if use_prefix is None or site_code is None:
            tenant_info = self.get_tenant_info(tenant_id)
            if use_prefix is None:
                use_prefix = tenant_info.get('use_site_code_prefix', False)  # Default to False for 3-digit format
            if site_code is None:
                site_code = tenant_info.get('site_code', '')

        # Check billings
        billings = self.read_json_file(self.billings_file)
        for billing in billings:
            if billing.get('tenant_id') == tenant_id:
                sid = billing.get('sid_number', '')
                if sid:
                    # Handle both prefixed and non-prefixed SIDs for backward compatibility
                    if sid.startswith(site_code) and len(sid) > len(site_code):
                        try:
                            number_part = sid[len(site_code):]
                            if number_part.isdigit() and len(number_part) == 3:
                                existing_sids.append(int(number_part))
                        except ValueError:
                            continue
                    elif sid.isdigit() and len(sid) == 3:
                        try:
                            existing_sids.append(int(sid))
                        except ValueError:
                            continue

        # Check reports
        reports = self.read_json_file(self.reports_file)
        for report in reports:
            if report.get('tenant_id') == tenant_id:
                sid = report.get('sid_number', '')
                if sid:
                    # Handle both prefixed and non-prefixed SIDs for backward compatibility
                    if sid.startswith(site_code) and len(sid) > len(site_code):
                        try:
                            number_part = sid[len(site_code):]
                            if number_part.isdigit() and len(number_part) == 3:
                                existing_sids.append(int(number_part))
                        except ValueError:
                            continue
                    elif sid.isdigit() and len(sid) == 3:
                        try:
                            existing_sids.append(int(sid))
                        except ValueError:
                            continue

        return sorted(list(set(existing_sids)))
    
    def validate_sid_format(self, sid: str, tenant_id: int) -> Tuple[bool, str]:
        """Validate SID format for a specific tenant"""
        if not sid:
            return False, "SID cannot be empty"

        # Get tenant info to determine expected format
        tenant_info = self.get_tenant_info(tenant_id)
        site_code = tenant_info.get('site_code', '')
        use_prefix = tenant_info.get('use_site_code_prefix', True)

        if use_prefix:
            # Validate prefix format: SITE_CODEXXX
            expected_length = len(site_code) + 3

            if len(sid) != expected_length:
                return False, f"SID must be {expected_length} characters long ({site_code}XXX format)"

            if not sid.startswith(site_code):
                return False, f"SID must start with site code '{site_code}'"

            number_part = sid[len(site_code):]
            if not number_part.isdigit():
                return False, "SID must end with 3 digits"

            if len(number_part) != 3:
                return False, "SID must end with exactly 3 digits"
        else:
            # Validate non-prefix format: XXX
            if len(sid) != 3:
                return False, "SID must be exactly 3 digits (XXX format)"

            if not sid.isdigit():
                return False, "SID must be 3 digits only"

        return True, "Valid SID format"
    
    def is_sid_unique(self, sid: str, tenant_id: int = None) -> bool:
        """Check if SID is unique across all records and session-generated SIDs"""
        # Check session-generated SIDs first
        if sid in self._session_generated_sids:
            return False

        # If tenant_id is provided, check for conflicts with both formats
        if tenant_id:
            tenant_info = self.get_tenant_info(tenant_id)
            site_code = tenant_info.get('site_code', '')

            # Generate both possible formats to check
            if sid.isdigit() and len(sid) == 3:
                # If checking a 3-digit SID, also check if prefixed version exists
                prefixed_sid = f"{site_code}{sid}"
                conflict_sids = [sid, prefixed_sid]
            elif sid.startswith(site_code) and len(sid) > len(site_code):
                # If checking a prefixed SID, also check if non-prefixed version exists
                number_part = sid[len(site_code):]
                if number_part.isdigit() and len(number_part) == 3:
                    conflict_sids = [sid, number_part]
                else:
                    conflict_sids = [sid]
            else:
                conflict_sids = [sid]
        else:
            conflict_sids = [sid]

        # Check billings for any conflicting SIDs
        billings = self.read_json_file(self.billings_file)
        if any(b.get('sid_number') in conflict_sids for b in billings):
            return False

        # Check reports for any conflicting SIDs
        reports = self.read_json_file(self.reports_file)
        if any(r.get('sid_number') in conflict_sids for r in reports):
            return False

        return True
    
    def generate_next_sid(self, tenant_id: int, max_retries: int = 3) -> str:
        """Generate the next available SID for a tenant with retry mechanism"""
        import time

        for attempt in range(max_retries):
            try:
                # Get tenant info to determine prefix usage
                tenant_info = self.get_tenant_info(tenant_id)
                site_code = tenant_info.get('site_code', '')
                use_prefix = tenant_info.get('use_site_code_prefix', False)  # Default to False for 3-digit format

                existing_sids = self.get_existing_sids_for_tenant(tenant_id, site_code, use_prefix)

                # Determine next number
                if existing_sids:
                    next_number = max(existing_sids) + 1
                else:
                    next_number = 1

                # Generate SID based on prefix setting
                if use_prefix:
                    sid = f"{site_code}{next_number:03d}"
                else:
                    sid = f"{next_number:03d}"

                # Ensure uniqueness across all records and session-generated SIDs
                max_attempts = 100  # Prevent infinite loop
                attempts = 0
                while not self.is_sid_unique(sid, tenant_id) and attempts < max_attempts:
                    next_number += 1
                    if use_prefix:
                        sid = f"{site_code}{next_number:03d}"
                    else:
                        sid = f"{next_number:03d}"
                    attempts += 1

                if attempts >= max_attempts:
                    raise Exception(f"Unable to find unique SID after {max_attempts} attempts")

                # Track this SID in the session to prevent duplicates
                self._session_generated_sids.add(sid)

                logger.info(f"Generated SID '{sid}' for tenant {tenant_id} (prefix: {use_prefix}, attempt: {attempt + 1})")
                return sid

            except Exception as e:
                logger.error(f"SID generation attempt {attempt + 1} failed for tenant {tenant_id}: {str(e)}")

                if attempt < max_retries - 1:
                    # Exponential backoff
                    wait_time = 0.1 * (2 ** attempt)
                    time.sleep(wait_time)
                    logger.info(f"Retrying SID generation for tenant {tenant_id} in {wait_time}s...")
                else:
                    # Final fallback with timestamp
                    import time
                    timestamp_suffix = int(time.time() * 1000) % 10000
                    fallback_sid = f"TMP{timestamp_suffix:04d}"
                    logger.warning(f"Using fallback SID {fallback_sid} for tenant {tenant_id}")
                    return fallback_sid

        raise Exception(f"Failed to generate SID for tenant {tenant_id} after {max_retries} attempts")

    def mark_sid_as_used(self, sid: str):
        """Mark a SID as used (when it's actually saved to a file)"""
        self._session_generated_sids.discard(sid)  # Remove from session tracking since it's now in the file

    def clear_session_sids(self):
        """Clear session-generated SIDs (useful for testing or when starting fresh)"""
        self._session_generated_sids.clear()
    
    def get_franchise_summary(self) -> Dict:
        """Get summary of all franchises and their SID usage"""
        try:
            tenant_codes = self.get_all_tenant_site_codes()
            summary = {}
            
            for tenant_id, site_code in tenant_codes.items():
                existing_sids = self.get_existing_sids_for_tenant(tenant_id, site_code)
                
                # Get tenant name
                tenants = self.read_json_file(self.tenants_file)
                tenant = next((t for t in tenants if t.get('id') == tenant_id), None)
                if not tenant:
                    raise ValueError(f"Franchise with ID {tenant_id} not found in system")
                tenant_name = tenant.get('name')
                if not tenant_name:
                    raise ValueError(f"Franchise with ID {tenant_id} does not have a valid name")
                
                summary[tenant_id] = {
                    'name': tenant_name,
                    'site_code': site_code,
                    'sid_count': len(existing_sids),
                    'highest_sid': max(existing_sids) if existing_sids else 0,
                    'next_sid': f"{site_code}{(max(existing_sids) + 1) if existing_sids else 1:03d}"
                }
            
            return summary
            
        except Exception as e:
            logger.error(f"Error getting franchise summary: {str(e)}")
            return {}

# Global instance for easy import
sid_generator = SIDGenerator()

def generate_sid_for_tenant(tenant_id: int) -> str:
    """Convenience function to generate SID for a tenant"""
    return sid_generator.generate_next_sid(tenant_id)

def validate_sid(sid: str, tenant_id: int) -> Tuple[bool, str]:
    """Convenience function to validate SID format"""
    return sid_generator.validate_sid_format(sid, tenant_id)

def get_franchise_sid_summary() -> Dict:
    """Convenience function to get franchise SID summary"""
    return sid_generator.get_franchise_summary()
