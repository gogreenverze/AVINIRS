"""
Billing Reports Service
Handles comprehensive billing report generation, storage, and retrieval
with franchise-based access control and SID management.
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging
from .audit_service import AuditService, AuditEventType, ErrorSeverity

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BillingReportsService:
    """Service for managing billing reports with franchise-based access control"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.reports_file = os.path.join(data_dir, "billing_reports.json")
        self.billings_file = os.path.join(data_dir, "billings.json")
        self.patients_file = os.path.join(data_dir, "patients.json")
        self.test_master_file = os.path.join(data_dir, "test_master.json")
        self.test_master_enhanced_file = os.path.join(data_dir, "test_master_enhanced.json")
        self.profiles_file = os.path.join(data_dir, "profiles.json")
        self.tenants_file = os.path.join(data_dir, "tenants.json")

        # Initialize audit service
        self.audit_service = AuditService(data_dir)

        # Initialize tenant data for dynamic site code lookup
        self.tenants_cache = None
        self.last_tenants_load = None
    
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
    
    def write_json_file(self, file_path: str, data: List[Dict]) -> bool:
        """Write JSON file with error handling"""
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                logger.info("File successfully updated at: %s", f)
            return True
        except Exception as e:
            logger.error(f"Error writing {file_path}: {str(e)}")
            return False
    
    def get_tenant_site_code(self, tenant_id: int) -> str:
        """Get site code for a tenant from tenants.json"""
        try:
            # Load tenants data
            tenants = self.read_json_file(self.tenants_file)

            # Find tenant by ID
            tenant = next((t for t in tenants if t.get('id') == tenant_id), None)
            if tenant:
                return tenant.get('site_code', 'XX')
            else:
                logger.warning(f"Tenant not found: {tenant_id}")
                return 'XX'
        except Exception as e:
            logger.error(f"Error getting tenant site code: {str(e)}")
            return 'XX'

    def generate_sid_number(self, tenant_id: int) -> str:
        """Generate franchise-specific SID number using site code + 3-digit sequential number"""
        try:
            # Get site code from tenants.json
            site_code = self.get_tenant_site_code(tenant_id)

            # Get existing SID numbers from both reports and billings
            reports = self.read_json_file(self.reports_file)
            billings = self.read_json_file(self.billings_file)

            # Find the highest SID number for this franchise from both sources
            existing_sids = []

            # Check reports
            franchise_reports = [r for r in reports if r.get('tenant_id') == tenant_id]
            for report in franchise_reports:
                sid = report.get('sid_number', '')
                if sid and sid.startswith(site_code):
                    try:
                        number_part = sid[len(site_code):]
                        if number_part.isdigit() and len(number_part) == 3:
                            existing_sids.append(int(number_part))
                    except ValueError:
                        continue

            # Check billings
            franchise_billings = [b for b in billings if b.get('tenant_id') == tenant_id]
            for billing in franchise_billings:
                sid = billing.get('sid_number', '')
                if sid and sid.startswith(site_code):
                    try:
                        number_part = sid[len(site_code):]
                        if number_part.isdigit() and len(number_part) == 3:
                            existing_sids.append(int(number_part))
                    except ValueError:
                        continue

            # Determine next number
            if existing_sids:
                next_number = max(existing_sids) + 1
            else:
                next_number = 1

            # Format SID number
            sid_number = f"{site_code}{next_number:03d}"

            # Validate uniqueness across all records
            all_reports = self.read_json_file(self.reports_file)
            all_billings = self.read_json_file(self.billings_file)

            while (any(r.get('sid_number') == sid_number for r in all_reports) or
                   any(b.get('sid_number') == sid_number for b in all_billings)):
                next_number += 1
                sid_number = f"{site_code}{next_number:03d}"

            return sid_number
        except Exception as e:
            logger.error(f"Error generating SID number: {str(e)}")
            raise Exception(f"Failed to generate SID for tenant {tenant_id}: {str(e)}")
    
    def create_report_indexes(self) -> Dict[str, Dict]:
        """Create indexes for fast report retrieval"""
        reports = self.read_json_file(self.reports_file)
        
        indexes = {
            'sid_index': {},
            'patient_index': {},
            'franchise_index': {},
            'date_index': {}
        }
        
        for report in reports:
            report_id = report.get('id')
            sid = report.get('sid_number')
            patient_id = report.get('patient_id')
            tenant_id = report.get('tenant_id')
            billing_date = report.get('billing_date', '')[:10]  # YYYY-MM-DD
            
            # SID index
            if sid:
                indexes['sid_index'][sid] = report_id
            
            # Patient index
            if patient_id:
                if patient_id not in indexes['patient_index']:
                    indexes['patient_index'][patient_id] = []
                indexes['patient_index'][patient_id].append(report_id)
            
            # Franchise index
            if tenant_id:
                if tenant_id not in indexes['franchise_index']:
                    indexes['franchise_index'][tenant_id] = []
                indexes['franchise_index'][tenant_id].append(report_id)
            
            # Date index
            if billing_date:
                if billing_date not in indexes['date_index']:
                    indexes['date_index'][billing_date] = []
                indexes['date_index'][billing_date].append(report_id)
        
        return indexes
    
    def get_franchise_access_filter(self, user_tenant_id: int, user_role: str) -> Optional[List[int]]:
        """Get franchise access filter based on user role and tenant"""
        logger.info(f"[BillingReportsService] Checking access for user_role='{user_role}', user_tenant_id={user_tenant_id}")

        # Admin role users and Mayiladuthurai users (tenant_id=1) should have access to all franchises
        if user_role == 'admin' or (user_tenant_id == 1 and user_role in ['admin', 'hub_admin']):
            logger.info(f"[BillingReportsService] User has access to ALL franchises (admin role or Mayiladuthurai user)")
            return None  # Access to all franchises
        else:
            logger.info(f"[BillingReportsService] User has access to own franchise only: {user_tenant_id}")
            return [user_tenant_id]  # Access only to own franchise

    def get_test_name_mappings(self) -> Dict[str, str]:
        """
        Get common test name mappings for better matching
        Maps common billing test names to test_master names
        """
        return {
            # Common CBC variations
            'complete blood count (cbc)': 'CBC',
            'complete blood count': 'CBC',
            'cbc': 'CBC',
            'blood count': 'CBC',

            # HbA1c variations
            'hba1c': 'HBA1C',
            'hb a1c': 'HBA1C',
            'hemoglobin a1c': 'HBA1C',
            'glycated hemoglobin': 'HBA1C',

            # Urine routine variations
            'urine routine': 'URINE ROUTINE',
            'urine analysis': 'URINE ROUTINE',
            'urine r/e': 'URINE ROUTINE',
            'urine microscopy': 'URINE ROUTINE',

            # Lipid profile variations
            'lipid profile': 'LIPID PROFILE',
            'lipid panel': 'LIPID PROFILE',
            'cholesterol profile': 'LIPID PROFILE',

            # Liver function variations
            'liver function test': 'LFT',
            'lft': 'LFT',
            'liver profile': 'LFT',

            # Kidney function variations
            'kidney function test': 'KFT',
            'kft': 'KFT',
            'renal function test': 'KFT',
            'rft': 'KFT',

            # Thyroid variations
            'thyroid profile': 'THYROID PROFILE',
            'thyroid function test': 'THYROID PROFILE',
            'tft': 'THYROID PROFILE',

            # Blood glucose variations
            'blood glucose fasting': 'FBS',
            'fasting blood sugar': 'FBS',
            'fbs': 'FBS',
            'glucose fasting': 'FBS',

            # Stool routine variations
            'stool routine': 'STOOL ROUTINE',
            'stool analysis': 'STOOL ROUTINE',
            'stool r/e': 'STOOL ROUTINE',

            # Dengue variations
            'dengue ns1 antigen': 'DENGUE NS1',
            'dengue ns1': 'DENGUE NS1',
            'ns1 antigen': 'DENGUE NS1'
        }

    def match_test_in_master(self, test_name: str) -> Optional[Dict]:
        """
        Match test name with test_master using multiple strategies
        Returns matched test data or None if no match found
        """
        test_master = self.read_json_file(self.test_master_file)

        if not test_name or not test_master:
            return None

        # Get test name mappings
        mappings = self.get_test_name_mappings()

        # Strategy 1: Exact match (case-sensitive)
        for test in test_master:
            if test.get('testName') == test_name:
                logger.info(f"Exact match found for '{test_name}'")
                return test

        # Strategy 2: Case-insensitive match
        test_name_lower = test_name.lower()
        for test in test_master:
            if test.get('testName', '').lower() == test_name_lower:
                logger.info(f"Case-insensitive match found for '{test_name}'")
                return test

        # Strategy 3: Trimmed whitespace match
        test_name_trimmed = test_name.strip()
        for test in test_master:
            if test.get('testName', '').strip() == test_name_trimmed:
                logger.info(f"Trimmed match found for '{test_name}'")
                return test

        # Strategy 4: Common name mapping
        mapped_name = mappings.get(test_name_lower)
        if mapped_name:
            for test in test_master:
                if test.get('testName', '').upper() == mapped_name.upper():
                    logger.info(f"Mapping match found for '{test_name}' -> '{mapped_name}' -> '{test.get('testName')}'")
                    return test

        # Strategy 5: Partial match (contains) - more flexible
        for test in test_master:
            test_master_name = test.get('testName', '')
            test_master_lower = test_master_name.lower()

            # Check if any significant words match
            test_words = [w.strip() for w in test_name_lower.split() if len(w.strip()) > 2]
            master_words = [w.strip() for w in test_master_lower.split() if len(w.strip()) > 2]

            # If at least 2 words match or one exact word match for short names
            matching_words = set(test_words) & set(master_words)
            if (len(matching_words) >= 2 or
                (len(test_words) <= 2 and len(matching_words) >= 1) or
                test_name_lower in test_master_lower or
                test_master_lower in test_name_lower):
                logger.info(f"Partial match found for '{test_name}' -> '{test_master_name}'")
                return test

        # Strategy 6: HMS Code match
        for test in test_master:
            if test.get('hmsCode') == test_name:
                logger.info(f"HMS Code match found for '{test_name}'")
                return test

        # Strategy 7: Fuzzy matching for common abbreviations
        test_name_clean = test_name_lower.replace('(', '').replace(')', '').replace('-', ' ').strip()
        for test in test_master:
            test_master_clean = test.get('testName', '').lower().replace('(', '').replace(')', '').replace('-', ' ').strip()
            if test_name_clean == test_master_clean:
                logger.info(f"Fuzzy match found for '{test_name}' -> '{test.get('testName')}'")
                return test

        # No match found
        logger.warning(f"No match found for test: '{test_name}'")
        return None

    def get_test_by_id(self, test_id: int) -> Optional[Dict]:
        """
        Get test details from test_master by ID with fallback to enhanced test master

        Fallback strategy:
        1. First attempt to find the test by ID in the primary test_master.json file
        2. If not found, search for the same test ID in test_master_enhanced.json
        3. If still not found by ID, attempt name-based matching in test_master_enhanced.json

        Returns test data or None if not found
        """
        # Strategy 1: Search in primary test_master.json
        test_master = self.read_json_file(self.test_master_file)

        if test_master:
            for test in test_master:
                if test.get('id') == test_id:
                    logger.info(f"Found test by ID {test_id} in primary test_master: '{test.get('testName')}'")
                    return test

        # Strategy 2: Fallback to enhanced test_master.json
        logger.info(f"Test ID {test_id} not found in primary test_master, trying enhanced test_master...")
        enhanced_test_master = self.read_json_file(self.test_master_enhanced_file)

        if enhanced_test_master:
            for test in enhanced_test_master:
                if test.get('id') == test_id:
                    logger.info(f"Found test by ID {test_id} in enhanced test_master: '{test.get('testName')}'")
                    return test

        logger.warning(f"Test not found by ID {test_id} in either primary or enhanced test_master")
        return None

    def get_test_by_name_from_enhanced(self, test_name: str) -> Optional[Dict]:
        """
        Get test details from enhanced test_master by name
        This is used as a final fallback when ID-based lookup fails

        Returns test data or None if not found
        """
        enhanced_test_master = self.read_json_file(self.test_master_enhanced_file)

        if not enhanced_test_master:
            return None

        # Try exact name match first
        for test in enhanced_test_master:
            if test.get('testName') == test_name:
                logger.info(f"Found test by name in enhanced test_master: '{test_name}' (ID: {test.get('id')})")
                return test

        # Try case-insensitive match
        test_name_lower = test_name.lower()
        for test in enhanced_test_master:
            if test.get('testName', '').lower() == test_name_lower:
                logger.info(f"Found test by case-insensitive name in enhanced test_master: '{test.get('testName')}' (ID: {test.get('id')})")
                return test

        logger.warning(f"Test not found by name '{test_name}' in enhanced test_master")
        return None

    def extract_essential_test_data(self, test_data: Dict) -> Dict:
        """
        Extract only essential fields from test_master_data for billing reports
        This prevents massive file bloat from large instruction fields
        """
        if not test_data:
            return {}

        # Essential fields needed for billing reports and PDF generation
        essential_fields = {
            'id': test_data.get('id'),
            'testName': test_data.get('testName'),
            'hmsCode': test_data.get('hmsCode'),
            'department': test_data.get('department'),
            'test_price': test_data.get('test_price'),
            'specimen': test_data.get('specimen'),
            'container': test_data.get('container'),
            'method': test_data.get('method'),
            'referenceRange': test_data.get('referenceRange') or test_data.get('reference_range'),
            'resultUnit': test_data.get('resultUnit') or test_data.get('result_unit'),
            'serviceTime': test_data.get('serviceTime'),
            'reportingDays': test_data.get('reportingDays'),
            'cutoffTime': test_data.get('cutoffTime'),
            'decimals': test_data.get('decimals'),
            'criticalLow': test_data.get('criticalLow') or test_data.get('critical_low'),
            'criticalHigh': test_data.get('criticalHigh') or test_data.get('critical_high'),
            'isActive': test_data.get('isActive', True),
            'shortName': test_data.get('shortName'),
            'displayName': test_data.get('displayName'),
            'internationalCode': test_data.get('internationalCode'),
            'primarySpecimen': test_data.get('primarySpecimen'),
            'minSampleQty': test_data.get('minSampleQty'),
            'applicableTo': test_data.get('applicableTo'),
            'testDoneOn': test_data.get('testDoneOn')
        }

        # Remove None values to save space and only include non-empty strings
        return {k: v for k, v in essential_fields.items()
                if v is not None and (not isinstance(v, str) or v.strip())}

    def get_profile_by_id(self, profile_id: str) -> Optional[Dict]:
        """
        Get profile details from profiles.json by ID
        Returns profile data or None if not found
        """
        profiles = self.read_json_file(self.profiles_file)

        if not profiles:
            return None

        for profile in profiles:
            if str(profile.get('id')) == str(profile_id):
                logger.info(f"Found profile by ID {profile_id}: '{profile.get('test_profile')}'")
                return profile

        logger.warning(f"Profile not found by ID: {profile_id}")
        return None

    def aggregate_profile_clinical_data(self, profile: Dict) -> Dict:
        """
        Aggregate clinical data from profile's constituent sub-tests
        Returns aggregated clinical information
        """
        test_items = profile.get('testItems', [])
        if not test_items:
            logger.warning(f"Profile '{profile.get('test_profile')}' has no test items")
            return {}

        # Collect clinical data from all sub-tests
        specimens = set()
        containers = set()
        methods = set()
        reference_ranges = []
        result_units = set()
        departments = set()

        for test_item in test_items:
            test_id = test_item.get('test_id')
            if test_id:
                test_data = self.get_test_by_id(test_id)
                if test_data:
                    # Collect unique values, handling both strings and lists
                    specimen_data = test_data.get('specimen')
                    if specimen_data:
                        if isinstance(specimen_data, list):
                            specimens.update(specimen_data)
                        else:
                            specimens.add(specimen_data)

                    container_data = test_data.get('container')
                    if container_data:
                        if isinstance(container_data, list):
                            containers.update(container_data)
                        else:
                            containers.add(container_data)

                    method_data = test_data.get('method')
                    if method_data:
                        if isinstance(method_data, list):
                            methods.update(method_data)
                        else:
                            methods.add(method_data)

                    if test_data.get('reference_range'):
                        reference_ranges.append(f"{test_data.get('testName')}: {test_data.get('reference_range')}")

                    result_unit_data = test_data.get('result_unit')
                    if result_unit_data:
                        if isinstance(result_unit_data, list):
                            result_units.update(result_unit_data)
                        else:
                            result_units.add(result_unit_data)

                    department_data = test_data.get('department')
                    if department_data:
                        if isinstance(department_data, list):
                            departments.update(department_data)
                        else:
                            departments.add(department_data)

        # Aggregate the collected data
        aggregated_data = {
            'specimen': ', '.join(sorted(specimens)) if specimens else '',
            'container': ', '.join(sorted(containers)) if containers else '',
            'method': ', '.join(sorted(methods)) if methods else '',
            'reference_range': '; '.join(reference_ranges) if reference_ranges else '',
            'result_unit': ', '.join(sorted(result_units)) if result_units else '',
            'department': ', '.join(sorted(departments)) if departments else profile.get('department', 'General'),
            'test_price': profile.get('test_price', 0)
        }

        logger.info(f"Aggregated clinical data for profile '{profile.get('test_profile')}': {len(test_items)} sub-tests processed")
        return aggregated_data

    def expand_profile_to_subtests(self, profile_test_item: Dict) -> List[Dict]:
        """
        Expand a profile test into individual sub-test items
        Returns a list of individual test items with complete clinical data
        """
        if not profile_test_item.get('profile_type'):
            # Not a profile test, return as-is
            return [profile_test_item]

        sub_tests = profile_test_item.get('sub_tests', [])
        if not sub_tests:
            logger.warning(f"Profile test '{profile_test_item.get('test_name')}' has no sub-tests")
            return [profile_test_item]

        expanded_tests = []
        profile_name = profile_test_item.get('test_name', 'Unknown Profile')

        for i, sub_test in enumerate(sub_tests):
            test_id = sub_test.get('test_id')
            if not test_id:
                logger.warning(f"Sub-test in profile '{profile_name}' has no test_id")
                continue

            # Get individual test data from test_master with enhanced fallback
            test_data = self.get_test_by_id(test_id)
            if not test_data:
                # Final fallback: try name-based matching in enhanced test master
                test_name = sub_test.get('testName')
                if test_name:
                    logger.info(f"Attempting name-based fallback for sub-test '{test_name}' (ID: {test_id}) in profile '{profile_name}'")
                    test_data = self.get_test_by_name_from_enhanced(test_name)

                if not test_data:
                    logger.warning(f"Sub-test ID {test_id} ('{test_name}') not found in either test_master or enhanced test_master for profile '{profile_name}'")
                    continue
                else:
                    logger.info(f"Successfully found sub-test '{test_name}' using name-based fallback for profile '{profile_name}'")

            # Create individual test item with complete clinical data
            individual_test = {
                'test_name': test_data.get('testName', sub_test.get('testName', 'Unknown Test')),
                'quantity': profile_test_item.get('quantity', 1),
                'price': profile_test_item.get('price', 0) / len(sub_tests),  # Distribute profile price among sub-tests
                'amount': (profile_test_item.get('amount', 0) / len(sub_tests)),  # Distribute profile amount
                'id': f"{profile_test_item.get('id', 0)}_{i+1}",  # Unique ID for each sub-test

                # Complete clinical data from test_master (optimized for storage)
                'test_master_data': self.extract_essential_test_data(test_data),
                'test_master_id': test_data.get('id'),
                'hms_code': test_data.get('hmsCode', ''),
                'department': test_data.get('department', 'General'),
                'reference_range': test_data.get('reference_range', ''),
                'result_unit': test_data.get('result_unit', ''),
                'decimals': test_data.get('decimals', 0),
                'specimen': test_data.get('specimen', ''),
                'container': test_data.get('container', ''),
                'method': test_data.get('method', ''),
                'notes': test_data.get('notes', ''),
                'instructions': test_data.get('instructions', ''),
                'interpretation': test_data.get('interpretation', ''),
                'critical_low': test_data.get('critical_low'),
                'critical_high': test_data.get('critical_high'),
                'service_time': test_data.get('serviceTime', ''),
                'reporting_days': test_data.get('reportingDays', 0),
                'cutoff_time': test_data.get('cutoffTime', ''),

                # Additional test_master fields
                'short_name': test_data.get('shortName', ''),
                'display_name': test_data.get('displayName', test_data.get('testName', '')),
                'international_code': test_data.get('internationalCode', ''),
                'primary_specimen': test_data.get('primarySpecimen', test_data.get('specimen', '')),
                'unacceptable_conditions': test_data.get('unacceptableConditions', ''),
                'min_sample_qty': test_data.get('minSampleQty', ''),
                'test_suffix': test_data.get('testSuffix', ''),
                'suffix_desc': test_data.get('suffixDesc', ''),
                'applicable_to': test_data.get('applicableTo', 'Both'),
                'test_done_on': test_data.get('testDoneOn', ''),
                'test_price': test_data.get('testPrice', 0),

                # Profile context information
                'profile_type': False,  # This is now an individual test
                'parent_profile_name': profile_name,
                'parent_profile_id': profile_test_item.get('test_master_id'),
                'is_profile_subtest': True,
                'subtest_index': i + 1,
                'total_subtests': len(sub_tests)
            }

            # Handle list-type fields properly
            for field in ['specimen', 'container', 'method']:
                field_data = test_data.get(field)
                if isinstance(field_data, list):
                    individual_test[field] = ', '.join(field_data) if field_data else ''

            expanded_tests.append(individual_test)
            logger.info(f"Expanded sub-test: {individual_test['test_name']} from profile '{profile_name}'")

        logger.info(f"Expanded profile '{profile_name}' into {len(expanded_tests)} individual sub-tests")
        return expanded_tests

    def validate_billing_tests(self, billing_items: List[Dict], user_id: Optional[int] = None, tenant_id: Optional[int] = None) -> Tuple[List[Dict], List[str]]:
        """
        Validate all tests in billing items against test_master and profiles
        Uses test_id for direct lookup when available, falls back to name matching
        Handles both individual tests and profile tests
        Returns: (matched_tests, unmatched_test_names)
        """
        matched_tests = []
        unmatched_tests = []

        for item in billing_items:
            # Get test identifiers
            test_id = item.get('test_id')
            test_name = item.get('test_name', '') or item.get('testName', '')

            matched_test = None
            is_profile = False

            # Strategy 1: Check if this is a profile test (UUID format or profile type)
            if test_id and (isinstance(test_id, str) and len(test_id) > 10 and '-' in test_id):
                profile_data = self.get_profile_by_id(test_id)
                if profile_data:
                    logger.info(f"Profile match found for ID {test_id}: '{profile_data.get('test_profile')}'")
                    matched_test = profile_data
                    is_profile = True

            # Strategy 2: Use test_id for direct lookup in test_master (individual tests)
            if not matched_test and test_id:
                matched_test = self.get_test_by_id(test_id)
                if matched_test:
                    logger.info(f"Direct ID match for test_id {test_id}: '{matched_test.get('testName')}'")
                else:
                    logger.warning(f"Test ID {test_id} not found in test_master")

            # Strategy 3: Fall back to name matching for legacy records
            if not matched_test and test_name:
                logger.info(f"Falling back to name matching for: '{test_name}'")
                matched_test = self.match_test_in_master(test_name)

            if matched_test:
                # Handle profile tests differently from individual tests
                if is_profile:
                    # For profile tests, use profile name and aggregate clinical data
                    authoritative_test_name = matched_test.get('test_profile', test_name)
                    aggregated_clinical_data = self.aggregate_profile_clinical_data(matched_test)

                    enhanced_item = {
                        'test_name': authoritative_test_name,
                        'quantity': item.get('quantity', 1),
                        'price': item.get('price', item.get('amount', 0)),
                        'amount': item.get('amount', 0),
                        'id': item.get('id'),
                        # Enhanced data from profile and aggregated sub-tests (optimized for storage)
                        'test_master_data': self.extract_essential_test_data(matched_test),
                        'test_master_id': matched_test.get('id'),
                        'hms_code': matched_test.get('code', ''),
                        'department': aggregated_clinical_data.get('department', 'General'),
                        'reference_range': aggregated_clinical_data.get('reference_range', ''),
                        'result_unit': aggregated_clinical_data.get('result_unit', ''),
                        'decimals': 0,  # Profiles typically don't have decimals
                        'specimen': aggregated_clinical_data.get('specimen', ''),
                        'container': aggregated_clinical_data.get('container', ''),
                        'method': aggregated_clinical_data.get('method', ''),
                        'instructions': matched_test.get('description', ''),
                        'interpretation': '',
                        'critical_low': None,
                        'critical_high': None,
                        'service_time': '',
                        'reporting_days': 0,
                        'cutoff_time': '',
                        # Profile-specific fields
                        'short_name': matched_test.get('test_profile', ''),
                        'display_name': matched_test.get('test_profile', ''),
                        'international_code': matched_test.get('procedure_code', ''),
                        'primary_specimen': aggregated_clinical_data.get('specimen', ''),
                        'unacceptable_conditions': '',
                        'min_sample_qty': '',
                        'test_suffix': '',
                        'suffix_desc': '',
                        'applicable_to': 'Both',
                        'test_done_on': '',
                        'test_price': aggregated_clinical_data.get('test_price', 0),
                        'profile_type': True,
                        'sub_tests': matched_test.get('testItems', [])
                    }
                    logger.info(f"Successfully processed profile test: '{authoritative_test_name}' (ID: {matched_test.get('id')}) with {len(matched_test.get('testItems', []))} sub-tests")
                else:
                    # For individual tests, use test_master name as authoritative source
                    authoritative_test_name = matched_test.get('testName', test_name)

                    enhanced_item = {
                        'test_name': authoritative_test_name,
                        'quantity': item.get('quantity', 1),
                        'price': item.get('price', item.get('amount', 0)),
                        'amount': item.get('amount', 0),
                        'id': item.get('id'),
                        # Enhanced data from test_master (optimized for storage)
                        'test_master_data': self.extract_essential_test_data(matched_test),
                        'test_master_id': matched_test.get('id'),
                        'hms_code': matched_test.get('hmsCode'),
                        'department': matched_test.get('department'),
                        'reference_range': matched_test.get('reference_range'),
                        'result_unit': matched_test.get('result_unit'),
                        'decimals': matched_test.get('decimals'),
                        'specimen': matched_test.get('specimen'),
                        'container': matched_test.get('container'),
                        'method': matched_test.get('method'),
                        'instructions': matched_test.get('instructions'),
                        'interpretation': matched_test.get('interpretation'),
                        'critical_low': matched_test.get('critical_low'),
                        'critical_high': matched_test.get('critical_high'),
                        'service_time': matched_test.get('serviceTime'),
                        'reporting_days': matched_test.get('reportingDays'),
                        'cutoff_time': matched_test.get('cutoffTime'),
                        # Additional test_master fields for comprehensive reporting
                        'short_name': matched_test.get('shortName'),
                        'display_name': matched_test.get('displayName'),
                        'international_code': matched_test.get('internationalCode'),
                        'primary_specimen': matched_test.get('primarySpecimen'),
                        'unacceptable_conditions': matched_test.get('unacceptableConditions'),
                        'min_sample_qty': matched_test.get('minSampleQty'),
                        'test_suffix': matched_test.get('testSuffix'),
                        'suffix_desc': matched_test.get('suffixDesc'),
                        'applicable_to': matched_test.get('applicableTo'),
                        'test_done_on': matched_test.get('testDoneOn'),
                        'test_price': matched_test.get('testPrice'),
                        'profile_type': False
                    }
                    logger.info(f"Successfully processed individual test: '{authoritative_test_name}' (ID: {matched_test.get('id')})")

                matched_tests.append(enhanced_item)
            else:
                # Record unmatched test
                identifier = f"ID:{test_id}" if test_id else test_name
                unmatched_tests.append(identifier)
                logger.warning(f"Failed to match test: {identifier}")

        logger.info(f"Test validation complete: {len(matched_tests)} matched, {len(unmatched_tests)} unmatched")
        return matched_tests, unmatched_tests

    def generate_comprehensive_report(self, billing_id: int, user_id: Optional[int] = None, tenant_id: Optional[int] = None) -> Optional[Dict]:
        """
        Generate comprehensive billing report for a billing record
        Returns report data or None if generation fails
        """
        # Log audit event - report generation started
        audit_id = self.audit_service.log_audit_event(
            AuditEventType.REPORT_GENERATION_STARTED,
            user_id=user_id,
            tenant_id=tenant_id,
            details={'billing_id': billing_id}
        )

        try:
            # Load required data
            billings = self.read_json_file(self.billings_file)
            patients = self.read_json_file(self.patients_file)
            tenants = self.read_json_file(self.tenants_file)

            # Find billing record
            billing = next((b for b in billings if b.get('id') == billing_id), None)
            if not billing:
                error_msg = f"Billing record not found: {billing_id}"
                logger.error(error_msg)

                # Log error
                self.audit_service.log_error(
                    'billing_not_found',
                    error_msg,
                    ErrorSeverity.MEDIUM,
                    {'billing_id': billing_id},
                    user_id,
                    tenant_id
                )

                # Log audit event - failed
                self.audit_service.log_audit_event(
                    AuditEventType.REPORT_GENERATION_FAILED,
                    user_id=user_id,
                    tenant_id=tenant_id,
                    details={'billing_id': billing_id, 'error': 'billing_not_found'},
                    success=False
                )
                return None

            # Find patient
            patient_id = billing.get('patient_id')
            patient = next((p for p in patients if p.get('id') == patient_id), None)
            if not patient:
                error_msg = f"Patient not found: {patient_id}"
                logger.error(error_msg)

                # Log error
                self.audit_service.log_error(
                    'patient_not_found',
                    error_msg,
                    ErrorSeverity.MEDIUM,
                    {'patient_id': patient_id, 'billing_id': billing_id},
                    user_id,
                    tenant_id
                )

                # Log audit event - failed
                self.audit_service.log_audit_event(
                    AuditEventType.REPORT_GENERATION_FAILED,
                    user_id=user_id,
                    tenant_id=tenant_id,
                    details={'billing_id': billing_id, 'error': 'patient_not_found'},
                    success=False
                )
                return None

            # Find tenant/franchise
            billing_tenant_id = billing.get('tenant_id')
            tenant = next((t for t in tenants if t.get('id') == billing_tenant_id), None)

            # Validate and enhance test items
            billing_items = billing.get('items', [])
            matched_tests, unmatched_tests = self.validate_billing_tests(billing_items, user_id, billing_tenant_id)

            if unmatched_tests:
                warning_msg = f"Unmatched tests in billing {billing_id}: {unmatched_tests}"
                logger.warning(warning_msg)

                # Log test matching issues
                self.audit_service.log_error(
                    'test_matching_failed',
                    f"Failed to match {len(unmatched_tests)} tests",
                    ErrorSeverity.MEDIUM,
                    {
                        'billing_id': billing_id,
                        'unmatched_tests': unmatched_tests,
                        'total_tests': len(billing_items),
                        'match_rate': len(matched_tests) / len(billing_items) if billing_items else 0
                    },
                    user_id,
                    billing_tenant_id
                )

            # Generate SID number
            sid_number = self.generate_sid_number(billing_tenant_id)

            # Calculate patient age from DOB
            patient_age = self.calculate_age(patient.get('date_of_birth'))
            
            
            # Merge matched and unmatched so all billing items are included
            final_test_items = []
            matched_lookup = {(t.get('id'), t.get('test_name')): t for t in matched_tests}

            for item in billing_items:
                key = (item.get('id'), item.get('test_name') or item.get('testName'))
                if key in matched_lookup:
                    matched_item = matched_lookup[key]
                    # Check if this is a profile test that should be expanded
                    if matched_item.get('profile_type'):
                        # Expand profile into individual sub-tests
                        expanded_subtests = self.expand_profile_to_subtests(matched_item)
                        final_test_items.extend(expanded_subtests)
                        logger.info(f"Expanded profile '{matched_item.get('test_name')}' into {len(expanded_subtests)} sub-tests")
                    else:
                        final_test_items.append(matched_item)  # individual test
                else:
                    final_test_items.append(item)  # original from billing

            # Create comprehensive report
            report = {
                'id': self.get_next_report_id(),
                'sid_number': sid_number,
                'billing_id': billing_id,
                'patient_id': patient_id,
                'tenant_id': billing_tenant_id,
                'billing_date': billing.get('invoice_date', datetime.now().strftime('%Y-%m-%d')),
                'due_date': billing.get('due_date'),
                'generation_timestamp': datetime.now().isoformat(),
                'report_version': '1.0',

                # Patient Information
                'patient_info': {
                    'full_name': f"{patient.get('first_name', '')} {patient.get('last_name', '')}".strip(),
                    'first_name': patient.get('first_name'),
                    'last_name': patient.get('last_name'),
                    'date_of_birth': patient.get('date_of_birth'),
                    'age': patient_age,
                    'gender': patient.get('gender'),
                    'blood_group': patient.get('blood_group'),
                    'mobile': patient.get('phone'),
                    'email': patient.get('email'),
                    'address': {
                        'street': patient.get('address'),
                        'city': patient.get('city'),
                        'state': patient.get('state'),
                        'postal_code': patient.get('postal_code')
                    },
                    'patient_id': patient.get('patient_id')
                },

                # Franchise/Clinic Information
                'clinic_info': {
                    'name': tenant.get('name') if tenant else 'Unknown Clinic',
                    'site_code': tenant.get('site_code') if tenant else 'XX',
                    'address': tenant.get('address') if tenant else '',
                    'contact_phone': tenant.get('contact_phone') if tenant else '',
                    'email': tenant.get('email') if tenant else '',
                    'is_hub': tenant.get('is_hub', False) if tenant else False
                },

                # Billing Header
                'billing_header': {
                    'invoice_number': billing.get('invoice_number'),
                    'billing_period': f"{billing.get('invoice_date')} to {billing.get('due_date')}",
                    'referring_doctor': billing.get('referrer', 'N/A'),
                    'payment_status': billing.get('payment_status'),
                    'payment_method': billing.get('payment_method')
                },


                # Test Line Items with enhanced data
                'test_items': final_test_items,
                'unmatched_tests': unmatched_tests,

                # Financial Summary
                'financial_summary': {
                    'bill_amount': billing.get('bill_amount', 0),
                    'other_charges': billing.get('other_charges', 0),
                    'discount_percent': billing.get('discount_percent', 0),
                    'discount_amount': billing.get('discount', 0),
                    'subtotal': billing.get('subtotal', 0),
                    'gst_rate': billing.get('gst_rate', 0),
                    'gst_amount': billing.get('gst_amount', 0),
                    'total_amount': billing.get('total_amount', 0),
                    'paid_amount': billing.get('paid_amount', 0),
                    'balance': billing.get('balance', 0)
                },

                # Metadata
                'metadata': {
                    'created_at': datetime.now().isoformat(),
                    'created_by': billing.get('created_by'),
                    'status': 'generated',
                    'test_match_success_rate': len(matched_tests) / len(billing_items) if billing_items else 0,
                    'total_tests': len(billing_items),
                    'matched_tests_count': len(matched_tests),
                    'unmatched_tests_count': len(unmatched_tests)
                }
            }

            # Log successful report generation
            self.audit_service.log_audit_event(
                AuditEventType.REPORT_GENERATION_SUCCESS,
                user_id=user_id,
                tenant_id=billing_tenant_id,
                details={
                    'billing_id': billing_id,
                    'report_id': report['id'],
                    'sid_number': sid_number,
                    'total_tests': len(billing_items),
                    'matched_tests': len(matched_tests),
                    'unmatched_tests': len(unmatched_tests),
                    'test_match_rate': len(matched_tests) / len(billing_items) if billing_items else 0
                }
            )

            return report

        except Exception as e:
            error_msg = f"Error generating report for billing {billing_id}: {str(e)}"
            logger.error(error_msg)

            # Log critical error
            self.audit_service.log_error(
                'system_error',
                error_msg,
                ErrorSeverity.HIGH,
                {
                    'billing_id': billing_id,
                    'exception_type': type(e).__name__,
                    'exception_message': str(e)
                },
                user_id,
                tenant_id
            )

            # Log audit event - failed
            self.audit_service.log_audit_event(
                AuditEventType.REPORT_GENERATION_FAILED,
                user_id=user_id,
                tenant_id=tenant_id,
                details={'billing_id': billing_id, 'error': 'system_error', 'exception': str(e)},
                success=False
            )

            return None

    def calculate_age(self, date_of_birth: str) -> str:
        """Calculate age from date of birth"""
        try:
            if not date_of_birth:
                return "N/A"

            birth_date = datetime.strptime(date_of_birth, '%Y-%m-%d')
            today = datetime.now()
            age = today.year - birth_date.year

            # Adjust if birthday hasn't occurred this year
            if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
                age -= 1

            return str(age)
        except Exception:
            return "N/A"
        
    

    def get_next_report_id(self) -> int:
        """Get next available report ID"""
        reports = self.read_json_file(self.reports_file)
        if not reports:
            return 1
        return max(r.get('id', 0) for r in reports) + 1
    
    
    
    def save_report(self, report: Dict) -> bool:
        """Save report to storage"""
        try:
            reports = self.read_json_file(self.reports_file)
            reports.append(report)
            return self.write_json_file(self.reports_file, reports)
        except Exception as e:
            logger.error(f"Error saving report: {str(e)}")
            return False
    # def save_report(self, report: Dict) -> bool:
    #     """Save report to storage"""
    #     try:
    #         reports = self.read_json_file(self.reports_file)
    #         updated = False
    #         for i, r in enumerate(reports):
    #           if (
    #             r.get("sid_number") == report.get("sid_number")
    #             and r.get("test_id") == report.get("test_id")
    #            ):
    #             reports[i] = report  # Update existing report
    #             updated = True
    #             break
            
            
    #           if not updated:
    #            reports.append(report)  # Add new only if not found

        
    #         return self.write_json_file(self.reports_file, reports)
    #     except Exception as e:
    #         logger.error(f"Error saving report: {str(e)}")
    #         return False
    
    def save_report_sample_status(self, report: Dict) -> bool:
            """Save report to storage"""
            try:
                reports = self.read_json_file(self.reports_file)
                updated = False
    
                new_sid = report.get("sid_number")
                new_test_id = report.get("test_items", [{}])[0].get("id")
    
                for i, r in enumerate(reports):
                    existing_sid = r.get("sid_number")
                    existing_test_id = r.get("test_items", [{}])[0].get("id")
    
                    if existing_sid == new_sid and existing_test_id == new_test_id:
                        reports[i] = report  # Update existing report
                        updated = True
                        break
    
                if not updated:
                    reports.append(report)  # Add new only if not found
    
                return self.write_json_file(self.reports_file, reports)
            except Exception as e:
                logger.error(f"Error saving report: {str(e)}")
                return False


    
    def get_report_by_sid(self, sid_number: str, user_tenant_id: int, user_role: str) -> Optional[Dict]:
        """Get report by SID number with franchise access control"""
        try:
            reports = self.read_json_file(self.reports_file)
            franchise_filter = self.get_franchise_access_filter(user_tenant_id, user_role)

            for report in reports:
                if str(report.get('sid_number')) == str(sid_number):
                    # Check franchise access
                    if franchise_filter is None or report.get('tenant_id') in franchise_filter:
                        return report

            return None
        except Exception as e:
            logger.error(f"Error retrieving report by SID {sid_number}: {str(e)}")
            return None

    def search_reports(self, search_params: Dict, user_tenant_id: int, user_role: str) -> List[Dict]:
        """Search reports with franchise-based filtering"""
        try:
            reports = self.read_json_file(self.reports_file)
            logger.info(f"[BillingReportsService] Loaded {len(reports)} total reports from file")

            franchise_filter = self.get_franchise_access_filter(user_tenant_id, user_role)

            # Apply franchise filter
            if franchise_filter is not None:
                before_filter = len(reports)
                reports = [r for r in reports if r.get('tenant_id') in franchise_filter]
                logger.info(f"[BillingReportsService] After franchise filter: {len(reports)} reports (was {before_filter})")
            else:
                logger.info(f"[BillingReportsService] No franchise filter applied - user has access to all reports")

            # Apply search filters
            filtered_reports = []

            for report in reports:
                match = True

                # SID search (exact or partial)
                if 'sid' in search_params:
                    sid_query = search_params['sid'].upper()
                    report_sid = report.get('sid_number', '').upper()
                    if sid_query not in report_sid:
                        match = False

                # Patient name search
                if 'patient_name' in search_params and match:
                    name_query = search_params['patient_name'].lower()
                    patient_name = report.get('patient_info', {}).get('full_name', '').lower()
                    if name_query not in patient_name:
                        match = False

                # Mobile number search
                if 'mobile' in search_params and match:
                    mobile_query = search_params['mobile']
                    patient_mobile = report.get('patient_info', {}).get('mobile', '')
                    if mobile_query not in patient_mobile:
                        match = False

                # Date range search
                if 'date_from' in search_params and match:
                    date_from = search_params['date_from']
                    report_date = report.get('billing_date', '')
                    if report_date < date_from:
                        match = False

                if 'date_to' in search_params and match:
                    date_to = search_params['date_to']
                    report_date = report.get('billing_date', '')
                    if report_date > date_to:
                        match = False

                if match:
                    filtered_reports.append(report)

            # Sort by billing date (newest first)
            filtered_reports.sort(key=lambda x: x.get('billing_date', ''), reverse=True)

            return filtered_reports

        except Exception as e:
            logger.error(f"Error searching reports: {str(e)}")
            return []

    def get_sid_autocomplete(self, partial_sid: str, user_tenant_id: int, user_role: str, limit: int = 10) -> List[str]:
        """Get SID autocomplete suggestions"""
        try:
            reports = self.read_json_file(self.reports_file)
            franchise_filter = self.get_franchise_access_filter(user_tenant_id, user_role)

            # Apply franchise filter
            if franchise_filter is not None:
                reports = [r for r in reports if r.get('tenant_id') in franchise_filter]

            # Find matching SIDs
            partial_upper = partial_sid.upper()
            matching_sids = []

            for report in reports:
                sid = report.get('sid_number', '')
                if sid.upper().startswith(partial_upper):
                    matching_sids.append(sid)

            # Remove duplicates and sort
            unique_sids = list(set(matching_sids))
            unique_sids.sort()

            return unique_sids[:limit]

        except Exception as e:
            logger.error(f"Error getting SID autocomplete: {str(e)}")
            return []

    def get_report_by_sid_public(self, sid_number: str) -> Optional[Dict]:
        """Get billing report by SID number without authentication (for QR code access)"""
        try:
            reports = self.read_json_file(self.reports_file)
            logger.info(f"[BillingReportsService] Looking for SID {sid_number} in {len(reports)} reports (public access)")

            # Find report by SID
            for report in reports:
                if report.get('sid_number') == sid_number:
                    logger.info(f"[BillingReportsService] Found report for SID {sid_number} (public access)")
                    return report

            logger.warning(f"[BillingReportsService] No report found for SID {sid_number} (public access)")
            return None

        except Exception as e:
            logger.error(f"Error retrieving report by SID {sid_number} (public access): {str(e)}")
            return None

    def update_test_item(self, sid_number: str, test_index: int, update_data: Dict, user_tenant_id: int, user_role: str) -> Optional[Dict]:
        """Update a specific test item in a billing report"""
        try:
            reports = self.read_json_file(self.reports_file)
            franchise_filter = self.get_franchise_access_filter(user_tenant_id, user_role)

            # Find the report
            report_index = None
            for i, report in enumerate(reports):
                if report.get('sid_number') == sid_number:
                    # Check franchise access
                    if franchise_filter is None or report.get('tenant_id') in franchise_filter:
                        report_index = i
                        break

            if report_index is None:
                logger.warning(f"Report not found or access denied for SID {sid_number}")
                return None

            # Validate test index
            report = reports[report_index]
            if not report.get('test_items') or test_index >= len(report['test_items']) or test_index < 0:
                logger.warning(f"Invalid test index {test_index} for SID {sid_number}")
                return None

            # Update the test item
            test_item = report['test_items'][test_index]
            for key, value in update_data.items():
                if key not in ['id', 'test_master_id']:  # Protect certain fields
                    test_item[key] = value

            # Update metadata
            test_item['updated_at'] = datetime.now().isoformat()
            report['updated_at'] = datetime.now().isoformat()

            # Save the updated reports
            if self.write_json_file(self.reports_file, reports):
                logger.info(f"Test item {test_index} updated successfully for SID {sid_number}")
                return report
            else:
                logger.error(f"Failed to save updated report for SID {sid_number}")
                return None

        except Exception as e:
            logger.error(f"Error updating test item for SID {sid_number}: {str(e)}")
            return None

    def update_report(self, sid_number: str, update_data: Dict, user_tenant_id: int, user_role: str) -> Optional[Dict]:
        """Update entire billing report"""
        try:
            reports = self.read_json_file(self.reports_file)
            franchise_filter = self.get_franchise_access_filter(user_tenant_id, user_role)

            # Find the report
            report_index = None
            for i, report in enumerate(reports):
                if report.get('sid_number') == sid_number:
                    # Check franchise access
                    if franchise_filter is None or report.get('tenant_id') in franchise_filter:
                        report_index = i
                        break

            if report_index is None:
                logger.warning(f"Report not found or access denied for SID {sid_number}")
                return None

            # Update the report
            report = reports[report_index]
            for key, value in update_data.items():
                if key not in ['id', 'sid_number', 'tenant_id', 'created_at']:  # Protect certain fields
                    report[key] = value

            # Update metadata
            report['updated_at'] = datetime.now().isoformat()

            # Save the updated reports
            if self.write_json_file(self.reports_file, reports):
                logger.info(f"Report updated successfully for SID {sid_number}")
                return report
            else:
                logger.error(f"Failed to save updated report for SID {sid_number}")
                return None

        except Exception as e:
            logger.error(f"Error updating report for SID {sid_number}: {str(e)}")
            return None

    def authorize_report(self, report_id: int, user_tenant_id: int, user_role: str, authorization_data: Dict) -> Optional[Dict]:
        """Authorize a billing report with audit trail"""
        try:
            reports = self.read_json_file(self.reports_file)
            franchise_filter = self.get_franchise_access_filter(user_tenant_id, user_role)

            # Find the report
            report = None
            report_index = None
            for i, r in enumerate(reports):
                if r.get('id') == report_id:
                    # Check franchise access
                    if franchise_filter is not None and r.get('tenant_id') not in franchise_filter:
                        logger.warning(f"Access denied for report {report_id} - franchise restriction")
                        return None
                    report = r
                    report_index = i
                    break

            if not report:
                logger.warning(f"Report not found: {report_id}")
                return None

            # Update authorization data
            action = authorization_data.get('action', 'approve')
            authorization_info = {
                'authorized': action == 'approve',
                'authorization_status': 'approved' if action == 'approve' else 'rejected',
                'authorization': {
                    'authorizer_name': authorization_data.get('authorizer_name'),
                    'comments': authorization_data.get('comments', ''),
                    'action': action,
                    'timestamp': authorization_data.get('authorization_timestamp'),
                    'user_id': authorization_data.get('user_id'),
                    'user_role': authorization_data.get('user_role')
                },
                'updated_at': datetime.now().isoformat()
            }

            # Update the report
            report.update(authorization_info)
            reports[report_index] = report

            # Save the updated reports
            if self.write_json_file(self.reports_file, reports):
                # Log audit event
                self.audit_service.log_event(
                    event_type=AuditEventType.REPORT_AUTHORIZATION,
                    user_id=authorization_data.get('user_id'),
                    tenant_id=user_tenant_id,
                    resource_type='billing_report',
                    resource_id=str(report_id),
                    details={
                        'action': action,
                        'authorizer_name': authorization_data.get('authorizer_name'),
                        'comments': authorization_data.get('comments', ''),
                        'sid_number': report.get('sid_number')
                    },
                    success=True
                )

                logger.info(f"Report {action}d successfully: {report_id}")
                return report
            else:
                logger.error(f"Failed to save authorization for report {report_id}")
                return None

        except Exception as e:
            logger.error(f"Error authorizing report {report_id}: {str(e)}")

            # Log audit event for failure
            self.audit_service.log_event(
                event_type=AuditEventType.REPORT_AUTHORIZATION,
                user_id=authorization_data.get('user_id'),
                tenant_id=user_tenant_id,
                resource_type='billing_report',
                resource_id=str(report_id),
                details={
                    'action': authorization_data.get('action', 'approve'),
                    'error': str(e)
                },
                success=False
            )

            return None


