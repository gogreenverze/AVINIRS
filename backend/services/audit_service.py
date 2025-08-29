"""
Audit Service for Billing Reports System
Comprehensive error handling, logging, and audit trail for all report generation attempts
with user-friendly error messages and actionable guidance.
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging
from enum import Enum

# Configure logging
log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "billing_reports.log")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class AuditEventType(Enum):
    """Audit event types"""
    REPORT_GENERATION_STARTED = "report_generation_started"
    REPORT_GENERATION_SUCCESS = "report_generation_success"
    REPORT_GENERATION_FAILED = "report_generation_failed"
    TEST_MATCHING_ATTEMPT = "test_matching_attempt"
    TEST_MATCHING_SUCCESS = "test_matching_success"
    TEST_MATCHING_FAILED = "test_matching_failed"
    PDF_GENERATION_STARTED = "pdf_generation_started"
    PDF_GENERATION_SUCCESS = "pdf_generation_success"
    PDF_GENERATION_FAILED = "pdf_generation_failed"
    SEARCH_PERFORMED = "search_performed"
    ACCESS_DENIED = "access_denied"
    DATA_VALIDATION_ERROR = "data_validation_error"
    SYSTEM_ERROR = "system_error"

class ErrorSeverity(Enum):
    """Error severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AuditService:
    """Service for audit trail and error handling"""
    
    def __init__(self, data_dir: str = "backend/data"):
        self.data_dir = data_dir
        self.audit_file = os.path.join(data_dir, "audit_trail.json")
        self.error_log_file = os.path.join(data_dir, "error_log.json")
        
        # Ensure log directory exists
        log_dir = os.path.join(os.path.dirname(data_dir), "logs")
        os.makedirs(log_dir, exist_ok=True)
        
        # Initialize audit files
        self._init_audit_files()
    
    def _init_audit_files(self):
        """Initialize audit files if they don't exist"""
        # Ensure data directory exists
        os.makedirs(self.data_dir, exist_ok=True)

        for file_path in [self.audit_file, self.error_log_file]:
            if not os.path.exists(file_path):
                with open(file_path, 'w') as f:
                    json.dump([], f)
    
    def log_audit_event(self, 
                       event_type: AuditEventType, 
                       user_id: Optional[int] = None,
                       tenant_id: Optional[int] = None,
                       details: Optional[Dict] = None,
                       success: bool = True) -> str:
        """Log an audit event"""
        try:
            audit_entry = {
                'id': self._generate_audit_id(),
                'timestamp': datetime.now().isoformat(),
                'event_type': event_type.value,
                'user_id': user_id,
                'tenant_id': tenant_id,
                'success': success,
                'details': details or {},
                'ip_address': self._get_client_ip(),
                'user_agent': self._get_user_agent()
            }
            
            # Read existing audit trail
            audit_trail = self._read_json_file(self.audit_file)
            audit_trail.append(audit_entry)
            
            # Keep only last 10000 entries to prevent file from growing too large
            if len(audit_trail) > 10000:
                audit_trail = audit_trail[-10000:]
            
            # Write back to file
            self._write_json_file(self.audit_file, audit_trail)
            
            # Log to application logger
            log_message = f"Audit: {event_type.value} - User: {user_id} - Tenant: {tenant_id} - Success: {success}"
            if success:
                logger.info(log_message)
            else:
                logger.warning(log_message)
            
            return audit_entry['id']
            
        except Exception as e:
            logger.error(f"Failed to log audit event: {str(e)}")
            return ""
    
    def log_error(self, 
                  error_type: str,
                  error_message: str,
                  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
                  context: Optional[Dict] = None,
                  user_id: Optional[int] = None,
                  tenant_id: Optional[int] = None) -> str:
        """Log an error with detailed context"""
        try:
            error_entry = {
                'id': self._generate_error_id(),
                'timestamp': datetime.now().isoformat(),
                'error_type': error_type,
                'error_message': error_message,
                'severity': severity.value,
                'context': context or {},
                'user_id': user_id,
                'tenant_id': tenant_id,
                'resolved': False,
                'resolution_notes': None
            }
            
            # Read existing error log
            error_log = self._read_json_file(self.error_log_file)
            error_log.append(error_entry)
            
            # Keep only last 5000 entries
            if len(error_log) > 5000:
                error_log = error_log[-5000:]
            
            # Write back to file
            self._write_json_file(self.error_log_file, error_log)
            
            # Log to application logger based on severity
            log_message = f"Error: {error_type} - {error_message} - Severity: {severity.value}"
            if severity in [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL]:
                logger.error(log_message)
            elif severity == ErrorSeverity.MEDIUM:
                logger.warning(log_message)
            else:
                logger.info(log_message)
            
            return error_entry['id']
            
        except Exception as e:
            logger.critical(f"Failed to log error: {str(e)}")
            return ""
    
    def get_user_friendly_error_message(self, error_type: str, context: Optional[Dict] = None) -> Dict[str, str]:
        """Get user-friendly error message with actionable guidance"""
        error_messages = {
            'test_matching_failed': {
                'message': 'Some tests could not be matched with the test master database.',
                'guidance': 'Please verify test names are spelled correctly and exist in the test master. Contact admin if tests are missing.',
                'action': 'Review unmatched tests and correct spelling or add missing tests to master database.'
            },
            'patient_not_found': {
                'message': 'Patient information could not be found.',
                'guidance': 'Ensure the patient ID is correct and the patient exists in the system.',
                'action': 'Verify patient ID or create patient record if missing.'
            },
            'billing_not_found': {
                'message': 'Billing record could not be found.',
                'guidance': 'Check if the billing ID is correct and the record exists.',
                'action': 'Verify billing ID or check if record was deleted.'
            },
            'access_denied': {
                'message': 'You do not have permission to access this resource.',
                'guidance': 'Contact your administrator to request appropriate permissions.',
                'action': 'Request access from system administrator.'
            },
            'pdf_generation_failed': {
                'message': 'PDF report could not be generated.',
                'guidance': 'This may be a temporary issue. Please try again in a few moments.',
                'action': 'Retry operation or contact technical support if problem persists.'
            },
            'data_validation_error': {
                'message': 'The provided data contains errors.',
                'guidance': 'Please check all required fields are filled correctly.',
                'action': 'Review and correct the highlighted fields.'
            },
            'system_error': {
                'message': 'An unexpected system error occurred.',
                'guidance': 'This appears to be a technical issue. Please contact support.',
                'action': 'Contact technical support with error details.'
            }
        }
        
        default_message = {
            'message': 'An error occurred while processing your request.',
            'guidance': 'Please try again or contact support if the problem persists.',
            'action': 'Retry operation or contact support.'
        }
        
        error_info = error_messages.get(error_type, default_message)
        
        # Add context-specific information if available
        if context:
            if error_type == 'test_matching_failed' and 'unmatched_tests' in context:
                unmatched_count = len(context['unmatched_tests'])
                error_info['message'] += f' {unmatched_count} test(s) could not be matched.'
                error_info['details'] = f"Unmatched tests: {', '.join(context['unmatched_tests'])}"
        
        return error_info
    
    def get_audit_trail(self, 
                       user_id: Optional[int] = None,
                       tenant_id: Optional[int] = None,
                       event_type: Optional[str] = None,
                       start_date: Optional[str] = None,
                       end_date: Optional[str] = None,
                       limit: int = 100) -> List[Dict]:
        """Get filtered audit trail"""
        try:
            audit_trail = self._read_json_file(self.audit_file)
            
            # Apply filters
            filtered_trail = []
            for entry in audit_trail:
                # User filter
                if user_id is not None and entry.get('user_id') != user_id:
                    continue
                
                # Tenant filter
                if tenant_id is not None and entry.get('tenant_id') != tenant_id:
                    continue
                
                # Event type filter
                if event_type is not None and entry.get('event_type') != event_type:
                    continue
                
                # Date filters
                entry_date = entry.get('timestamp', '')[:10]  # YYYY-MM-DD
                if start_date and entry_date < start_date:
                    continue
                if end_date and entry_date > end_date:
                    continue
                
                filtered_trail.append(entry)
            
            # Sort by timestamp (newest first) and limit
            filtered_trail.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            return filtered_trail[:limit]
            
        except Exception as e:
            logger.error(f"Failed to get audit trail: {str(e)}")
            return []
    
    def get_error_statistics(self, days: int = 7) -> Dict[str, Any]:
        """Get error statistics for the specified number of days"""
        try:
            error_log = self._read_json_file(self.error_log_file)
            
            # Filter by date
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            recent_errors = [e for e in error_log if e.get('timestamp', '') >= cutoff_date]
            
            # Calculate statistics
            stats = {
                'total_errors': len(recent_errors),
                'by_severity': {},
                'by_type': {},
                'by_day': {},
                'unresolved_count': 0
            }
            
            for error in recent_errors:
                # By severity
                severity = error.get('severity', 'unknown')
                stats['by_severity'][severity] = stats['by_severity'].get(severity, 0) + 1
                
                # By type
                error_type = error.get('error_type', 'unknown')
                stats['by_type'][error_type] = stats['by_type'].get(error_type, 0) + 1
                
                # By day
                error_date = error.get('timestamp', '')[:10]
                stats['by_day'][error_date] = stats['by_day'].get(error_date, 0) + 1
                
                # Unresolved count
                if not error.get('resolved', False):
                    stats['unresolved_count'] += 1
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get error statistics: {str(e)}")
            return {}
    
    def _read_json_file(self, file_path: str) -> List[Dict]:
        """Read JSON file with error handling"""
        try:
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return []
        except Exception as e:
            logger.error(f"Error reading {file_path}: {str(e)}")
            return []
    
    def _write_json_file(self, file_path: str, data: List[Dict]) -> bool:
        """Write JSON file with error handling"""
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            logger.error(f"Error writing {file_path}: {str(e)}")
            return False
    
    def _generate_audit_id(self) -> str:
        """Generate unique audit ID"""
        return f"AUD_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{os.getpid()}"
    
    def _generate_error_id(self) -> str:
        """Generate unique error ID"""
        return f"ERR_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{os.getpid()}"
    
    def _get_client_ip(self) -> str:
        """Get client IP address (placeholder)"""
        return "127.0.0.1"  # In real implementation, extract from request
    
    def _get_user_agent(self) -> str:
        """Get user agent (placeholder)"""
        return "AVINI Labs System"  # In real implementation, extract from request
