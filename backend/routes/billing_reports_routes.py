"""
Billing Reports Routes
API endpoints for comprehensive billing report generation, retrieval, and management
with franchise-based access control.
"""

from flask import Blueprint, request, jsonify, make_response
from datetime import datetime
import logging
import sys
import os
import json



# Add the parent directory to the path to import services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.billing_reports_service import BillingReportsService
from services.pdf_report_generator import PDFReportGenerator
from utils import token_required

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
billing_reports_bp = Blueprint('billing_reports', __name__)

def safe_float(value, default=0):
    """Safely convert value to float, handling strings and None"""
    try:
        if value is None or value == '':
            return default
        return float(value)
    except (ValueError, TypeError):
        return default

# Initialize services
reports_service = BillingReportsService()
pdf_generator = PDFReportGenerator()

@billing_reports_bp.route('/api/billing-reports/generate/<int:billing_id>', methods=['POST'])
@token_required
def generate_billing_report(billing_id):
    """Generate comprehensive billing report for a billing record"""
    try:
        # Generate the report
        report = reports_service.generate_comprehensive_report(billing_id)
        
        if not report:
            return jsonify({
                'success': False,
                'message': f'Failed to generate report for billing ID {billing_id}'
            }), 400
        
        # Save the report
        if reports_service.save_report(report):
            logger.info(f"Report generated successfully for billing {billing_id}, SID: {report.get('sid_number')}")
            return jsonify({
                'success': True,
                'message': 'Report generated successfully',
                'data': {
                    'report_id': report.get('id'),
                    'sid_number': report.get('sid_number'),
                    'billing_id': billing_id,
                    'patient_name': report.get('patient_info', {}).get('full_name'),
                    'generation_timestamp': report.get('generation_timestamp'),
                    'test_match_success_rate': report.get('metadata', {}).get('test_match_success_rate', 0),
                    'total_tests': report.get('metadata', {}).get('total_tests', 0),
                    'unmatched_tests': report.get('unmatched_tests', [])
                }
            }), 201
        else:
            return jsonify({
                'success': False,
                'message': 'Report generated but failed to save'
            }), 500
            
    except Exception as e:
        logger.error(f"Error generating billing report: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error during report generation'
        }), 500

@billing_reports_bp.route('/api/billing-reports/list', methods=['GET'])
@token_required
def list_billing_reports():
    """List all billing reports with franchise-based access control"""
    try:
        # Get user context
        user_tenant_id = request.current_user.get('tenant_id')
        user_role = request.current_user.get('role')

        # Get optional franchise filter parameter
        franchise_id = request.args.get('franchise_id', type=int)

        # Determine effective tenant ID for filtering
        effective_tenant_id = user_tenant_id
        if franchise_id and user_role == 'admin':
            # Admin can filter by specific franchise
            effective_tenant_id = franchise_id
        elif franchise_id and user_role == 'hub_admin':
            # Hub admin can filter by franchises they have access to
            effective_tenant_id = franchise_id

        # Get all reports without search filters
        reports = reports_service.search_reports({}, effective_tenant_id, user_role)

        # Format response
        formatted_reports = []
        for report in reports:
            formatted_reports.append({
                'id': report.get('id'),
                'sid_number': report.get('sid_number'),
                'billing_id': report.get('billing_id'),
                'patient_name': report.get('patient_info', {}).get('full_name'),
                'patient_mobile': report.get('patient_info', {}).get('mobile'),
                'billing_date': report.get('billing_date'),
                'total_amount': report.get('financial_summary', {}).get('total_amount'),
                'clinic_name': report.get('clinic_info', {}).get('name'),
                'test_count': report.get('metadata', {}).get('total_tests'),
                'status': report.get('metadata', {}).get('status'),
                'authorized': report.get('authorized', False), 
                 'authorization_status': report.get('authorization_status', 'pending') ,
                'generation_timestamp': report.get('generation_timestamp'),
                'tenant_id': report.get('tenant_id')
            })

        return jsonify({
            'success': True,
            'data': {
                'data': formatted_reports,
                'total': len(formatted_reports)
            }
        }), 200

    except Exception as e:
        logger.error(f"Error listing billing reports: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error during listing'
        }), 500

@billing_reports_bp.route('/api/billing-reports/search', methods=['GET'])
@token_required
def search_billing_reports():
    """Search billing reports with franchise-based access control"""
    try:
        # Get user context
        user_tenant_id = request.current_user.get('tenant_id')
        user_role = request.current_user.get('role')

        # Get optional franchise filter parameter
        franchise_id = request.args.get('franchise_id', type=int)

        # Determine effective tenant ID for filtering
        effective_tenant_id = user_tenant_id
        if franchise_id and user_role == 'admin':
            # Admin can filter by specific franchise
            effective_tenant_id = franchise_id
        elif franchise_id and user_role == 'hub_admin':
            # Hub admin can filter by franchises they have access to
            effective_tenant_id = franchise_id

        # Get search parameters
        search_params = {}

        if request.args.get('sid'):
            search_params['sid'] = request.args.get('sid')

        if request.args.get('patient_name'):
            search_params['patient_name'] = request.args.get('patient_name')

        if request.args.get('mobile'):
            search_params['mobile'] = request.args.get('mobile')

        if request.args.get('date_from'):
            search_params['date_from'] = request.args.get('date_from')

        if request.args.get('date_to'):
            search_params['date_to'] = request.args.get('date_to')

        # Perform search
        reports = reports_service.search_reports(search_params, effective_tenant_id, user_role)

        # Format response
        formatted_reports = []
        for report in reports:
            formatted_reports.append({
                'id': report.get('id'),
                'sid_number': report.get('sid_number'),
                'billing_id': report.get('billing_id'),
                'patient_name': report.get('patient_info', {}).get('full_name'),
                'patient_mobile': report.get('patient_info', {}).get('mobile'),
                'billing_date': report.get('billing_date'),
                'total_amount': report.get('financial_summary', {}).get('total_amount'),
                'clinic_name': report.get('clinic_info', {}).get('name'),
                'test_count': report.get('metadata', {}).get('total_tests'),
                'status': report.get('metadata', {}).get('status'),
                'authorized': report.get('authorized', False), 
                 'authorization_status': report.get('authorization_status', 'pending') ,
                'generation_timestamp': report.get('generation_timestamp')
            })

        return jsonify({
            'success': True,
            'data': {
                'data': formatted_reports,
                'count': len(formatted_reports),
                'search_params': search_params
            }
        }), 200

    except Exception as e:
        logger.error(f"Error searching billing reports: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error during search'
        }), 500

@billing_reports_bp.route('/api/billing-reports/sid/<sid_number>', methods=['GET'])
@token_required
def get_report_by_sid(sid_number):
    """Get billing report by SID number"""
    try:
        # Get user context
        user_tenant_id = request.current_user.get('tenant_id')
        user_role = request.current_user.get('role')
        
        # Get report
        report = reports_service.get_report_by_sid(sid_number, user_tenant_id, user_role)
        
        if not report:
            return jsonify({
                'success': False,
                'message': f'Report not found for SID: {sid_number}'
            }), 404
            
           
           
         # ✅ Ensure all sample fields are included
        for test in report.get("test_items", []):
            if "sample_received" not in test:
                test["sample_received"] = False
            if "sample_status" not in test:
                test["sample_status"] = "Not Received"
            if "sample_received_timestamp" not in test:
                test["sample_received_timestamp"] = None
        
      
   
  
        return jsonify({
            'success': True,
            'data': {
                'data': report
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving report by SID {sid_number}: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error during retrieval'
        }), 500



# @billing_reports_bp.route('/api/billing-reports/sid/<sid_number>/test/<int:test_id>/sample-status', methods=['PUT'])
# @token_required
# def update_sample_status(sid_number, test_id):
#     """Update sample status of a test item in a report by SID"""
#     try:
#         user_tenant_id = request.current_user.get('tenant_id')
#         user_role = request.current_user.get('role')
#         data = request.json
#         sample_received = data.get('sample_received')

#         if sample_received is None:
#             return jsonify({'success': False, 'message': 'Missing sample_received field'}), 400

#         # Get report
#         report = reports_service.get_report_by_sid(sid_number, user_tenant_id, user_role)

#         if not report:
#             return jsonify({'success': False, 'message': 'Report not found'}), 404

#         # Update test item
#         updated = False
#         for test in report.get('test_items', []):
#             if test.get('id') == test_id:
#                 test['sample_received'] = sample_received
#                 test['status'] = 'In Progress' if sample_received else 'Ordered'
#                 updated = True
#                 break

#         if not updated:
#             return jsonify({'success': False, 'message': 'Test ID not found in report'}), 404

#         # Save updated report
#         if not reports_service.update_report_by_sid(sid_number, report):
#             return jsonify({'success': False, 'message': 'Failed to save updated report'}), 500

#         return jsonify({'success': True, 'message': 'Sample status updated successfully'}), 200

#     except Exception as e:
#         logger.error(f"Error updating sample status for test {test_id}: {str(e)}")
#         return jsonify({'success': False, 'message': 'Internal server error'}), 500




@billing_reports_bp.route('/api/billing-reports/sid-autocomplete', methods=['GET'])
@token_required
def get_sid_autocomplete():
    """Get SID autocomplete suggestions"""
    try:
        # Get user context
        user_tenant_id = request.current_user.get('tenant_id')
        user_role = request.current_user.get('role')
        
        # Get search parameters
        partial_sid = request.args.get('q', '')
        limit = int(request.args.get('limit', 10))
        
        if len(partial_sid) < 1:
            return jsonify({
                'success': True,
                'data': {
                    'data': []
                }
            }), 200
        
        # Get suggestions
        suggestions = reports_service.get_sid_autocomplete(partial_sid, user_tenant_id, user_role, limit)
        
        return jsonify({
            'success': True,
            'data': {
                'data': suggestions
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting SID autocomplete: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error during autocomplete'
        }), 500

@billing_reports_bp.route('/api/billing-reports/stats', methods=['GET'])
@token_required
def get_reports_stats():
    """Get billing reports statistics with franchise filtering"""
    try:
        # Get user context
        user_tenant_id = request.current_user.get('tenant_id')
        user_role = request.current_user.get('role')

        # Get optional franchise filter parameter
        franchise_id = request.args.get('franchise_id', type=int)

        # Determine effective tenant ID for filtering
        effective_tenant_id = user_tenant_id
        if franchise_id and user_role == 'admin':
            # Admin can filter by specific franchise
            effective_tenant_id = franchise_id
        elif franchise_id and user_role == 'hub_admin':
            # Hub admin can filter by franchises they have access to
            effective_tenant_id = franchise_id

        # Get all accessible reports
        all_reports = reports_service.search_reports({}, effective_tenant_id, user_role)
        
        # Calculate statistics
        total_reports = len(all_reports)
        total_amount = sum(safe_float(r.get('financial_summary', {}).get('total_amount', 0)) for r in all_reports)
        
        # Group by status
        status_counts = {}
        for report in all_reports:
            status = report.get('metadata', {}).get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Group by franchise
        franchise_counts = {}
        for report in all_reports:
            clinic_name = report.get('clinic_info', {}).get('name', 'Unknown')
            franchise_counts[clinic_name] = franchise_counts.get(clinic_name, 0) + 1
        
        # Recent reports (last 7 days)
        from datetime import datetime, timedelta
        seven_days_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        recent_reports = [r for r in all_reports if r.get('billing_date', '') >= seven_days_ago]
        
        return jsonify({
            'success': True,
            'data': {
                'data': {
                    'total_reports': total_reports,
                    'total_amount': total_amount,
                    'recent_reports_count': len(recent_reports),
                    'status_distribution': status_counts,
                    'franchise_distribution': franchise_counts,
                    'user_access_level': 'all_franchises' if user_role == 'admin' or (user_tenant_id == 1 and user_role in ['admin', 'hub_admin']) else 'own_franchise'
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting reports stats: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error during stats calculation'
        }), 500

@billing_reports_bp.route('/api/billing-reports/<int:report_id>/pdf', methods=['GET'])
@token_required
def generate_report_pdf(report_id):
    """Generate PDF for billing report"""
    try:
        # Get user context
        user_tenant_id = request.current_user.get('tenant_id')
        user_role = request.current_user.get('role')

        # Get all reports and find the requested one
        all_reports = reports_service.search_reports({}, user_tenant_id, user_role)
        report = next((r for r in all_reports if r.get('id') == report_id), None)

        if not report:
            return jsonify({
                'success': False,
                'message': f'Report not found: {report_id}'
            }), 404

        # Generate professional PDF content using PRABAGARAN format
        pdf_content = pdf_generator.generate_prabagaran_format_pdf(report)

        # Create response
        response = make_response(pdf_content)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename="billing_report_{report.get("sid_number")}.pdf"'

        return response

    except Exception as e:
        logger.error(f"Error generating PDF for report {report_id}: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error during PDF generation'
        }), 500

@billing_reports_bp.route('/api/billing-reports/sid/<sid_number>/pdf', methods=['GET'])
def generate_report_pdf_by_sid(sid_number):
    """Generate PDF for billing report by SID number (public access for QR codes)"""
    try:
        # This endpoint is public to allow QR code access
        # Get report by SID without authentication for QR code functionality
        report = reports_service.get_report_by_sid_public(sid_number)

        if not report:
            return jsonify({
                'success': False,
                'message': f'Report not found for SID: {sid_number}'
            }), 404

        # Generate professional PDF content using PRABAGARAN format
        pdf_content = pdf_generator.generate_prabagaran_format_pdf(report)

        # Create response
        response = make_response(pdf_content)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'inline; filename="billing_report_{sid_number}.pdf"'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'

        return response

    except Exception as e:
        logger.error(f"Error generating PDF for SID {sid_number}: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error during PDF generation'
        }), 500

@billing_reports_bp.route('/api/billing-reports/sid/<sid_number>/test/<int:test_index>', methods=['PUT'])
@token_required
def update_test_item(sid_number, test_index):
    """Update a specific test item in a billing report"""
    try:
        # Get user context
        user_tenant_id = request.current_user.get('tenant_id')
        user_role = request.current_user.get('role')

        # Get the report first
        report = reports_service.get_report_by_sid(sid_number, user_tenant_id, user_role)

        if not report:
            return jsonify({
                'success': False,
                'message': f'Report not found for SID: {sid_number}'
            }), 404

        # Validate test index
        if not report.get('test_items') or test_index >= len(report['test_items']) or test_index < 0:
            return jsonify({
                'success': False,
                'message': f'Invalid test index: {test_index}'
            }), 400

        # Get update data
        update_data = request.get_json()
        if not update_data:
            return jsonify({
                'success': False,
                'message': 'No update data provided'
            }), 400

        # Update the test item
        updated_report = reports_service.update_test_item(sid_number, test_index, update_data, user_tenant_id, user_role)

        if updated_report:
            return jsonify({
                'success': True,
                'data': updated_report['test_items'][test_index],
                'message': 'Test item updated successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to update test item'
            }), 500

    except Exception as e:
        logger.error(f"Error updating test item for SID {sid_number}, index {test_index}: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error during test item update'
        }), 500

@billing_reports_bp.route('/api/billing-reports/<int:report_id>/authorize', methods=['POST'])
@token_required
def authorize_report(report_id):
    """Authorize a billing report with audit trail"""
    try:
        # Get user context
        user_tenant_id = request.current_user.get('tenant_id')
        user_role = request.current_user.get('role')
        user_id = request.current_user.get('id')

        # Get authorization data
        auth_data = request.get_json()
        if not auth_data:
            return jsonify({
                'success': False,
                'message': 'No authorization data provided'
            }), 400

        # Validate required fields
        if not auth_data.get('authorizerName'):
            return jsonify({
                'success': False,
                'message': 'Authorizer name is required'
            }), 400

        action = auth_data.get('action', 'approve')
        if action not in ['approve', 'reject']:
            return jsonify({
                'success': False,
                'message': 'Invalid authorization action'
            }), 400

        # If rejecting, comments are required
        if action == 'reject' and not auth_data.get('comments', '').strip():
            return jsonify({
                'success': False,
                'message': 'Comments are required when rejecting a report'
            }), 400

        # Update the report with authorization data
        authorization_result = reports_service.authorize_report(
            report_id,
            user_tenant_id,
            user_role,
            {
                'authorizer_name': auth_data.get('authorizerName'),
                'comments': auth_data.get('comments', ''),
                'action': action,
                'authorization_timestamp': auth_data.get('authorizationTimestamp') or datetime.utcnow().isoformat(),
                'user_id': user_id,
                'user_role': user_role
            }
        )

        if authorization_result:
            return jsonify({
                'success': True,
                'message': f'Report {action}d successfully',
                'data': authorization_result
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': f'Failed to {action} report'
            }), 400

    except Exception as e:
        logger.error(f"Error authorizing report {report_id}: {str(e)}")
        return jsonify({
           
        }), 500


@billing_reports_bp.route('/api/billing-reports/sid/<sid_number>', methods=['PUT'])
@token_required
def update_billing_report(sid_number):
    """Update entire billing report"""
    try:
        # Get user context
        user_tenant_id = request.current_user.get('tenant_id')
        user_role = request.current_user.get('role')

        # Get update data
        update_data = request.get_json()
        if not update_data:
            return jsonify({
                'success': False,
                'message': 'No update data provided'
            }), 400

        # Update the report
        updated_report = reports_service.update_report(sid_number, update_data, user_tenant_id, user_role)

        if updated_report:
            return jsonify({
                'success': True,
                'data': updated_report,
                'message': 'Report updated successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to update report or report not found'
            }), 404

    except Exception as e:
        logger.error(f"Error updating report for SID {sid_number}: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error during report update'
        }), 500





@billing_reports_bp.route('/api/billing-reports/sid/<sid_number>/sample-status', methods=['PUT'])
@token_required
def update_sample_status_by_sid(sid_number):
    data = request.get_json()

    if not data or 'test_items' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    test_items = data['test_items']

    try:
        with open('data/billing_reports.json', 'r') as f:
            billing_data = json.load(f)

        # Use .get() to avoid KeyErrors
        report = next((item for item in billing_data if item.get('sid_number') == sid_number), None)
        if not report:
            return jsonify({'error': 'SID not found'}), 404

        existing_tests = report.get('test_items', [])
        existing_tests_dict = {str(item.get('id')): item for item in existing_tests}

        for update_item in test_items:
            uid = str(update_item.get('id'))
            if uid in existing_tests_dict:
                # Update existing test item
                existing_item = existing_tests_dict[uid]
                existing_item['sample_status'] = update_item.get('sample_status', existing_item.get('sample_status'))
                existing_item['sample_received'] = update_item.get('sample_received', existing_item.get('sample_received'))
                existing_item['sample_received_timestamp'] = update_item.get('sample_received_timestamp', existing_item.get('sample_received_timestamp'))
                existing_item['sample_status_updated_at'] = update_item.get('sample_status_updated_at', existing_item.get('sample_status_updated_at'))
            else:
                # Add new test item to the list
                existing_tests.append(update_item)

        # Save back updated billing data
        with open('data/billing_reports.json', 'w') as f:
            json.dump(billing_data, f, indent=2)

        return jsonify({'message': 'Sample status updated successfully'}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
