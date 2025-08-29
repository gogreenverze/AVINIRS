from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import uuid
import json
import os
from functools import wraps

# Import utilities
from utils import token_required, read_data, write_data, paginate_results, filter_data_by_tenant, check_tenant_access

# Import centralized SID generator
try:
    from sid_utils import sid_generator
    SID_GENERATOR_AVAILABLE = True
    print("✓ SIDGenerator imported successfully")
except ImportError as e:
    SID_GENERATOR_AVAILABLE = False
    print(f"✗ Failed to import SIDGenerator: {e}")

# Import billing reports service
try:
    from services.billing_reports_service import BillingReportsService
    REPORTS_SERVICE_AVAILABLE = True
    print("✓ BillingReportsService imported successfully")
except ImportError as e:
    REPORTS_SERVICE_AVAILABLE = False
    print(f"✗ Failed to import BillingReportsService: {e}")

def safe_float(value, default=0):
    """Safely convert value to float, handling strings and None"""
    try:
        if value is None or value == '':
            return default
        return float(value)
    except (ValueError, TypeError):
        return default

def generate_franchise_sid(tenant_id):
    """Generate franchise-specific SID using centralized SIDGenerator to prevent duplicates"""
    if SID_GENERATOR_AVAILABLE:
        try:
            return sid_generator.generate_next_sid(tenant_id)
        except Exception as e:
            print(f"✗ Error using SIDGenerator: {e}")
            # Fall back to legacy method as last resort
            pass

    # Legacy fallback method (only checks billings.json - not recommended)
    print("⚠ Using legacy SID generation - may cause duplicates")
    tenants = read_data('tenants.json')
    tenant = next((t for t in tenants if t.get('id') == tenant_id), None)
    if not tenant:
        raise ValueError(f"Tenant {tenant_id} not found")

    site_code = tenant.get('site_code')
    if not site_code:
        raise ValueError(f"No site code for tenant {tenant_id}")

    # Get existing SIDs for this franchise
    billings = read_data('billings.json')
    existing_numbers = []

    for billing in billings:
        if billing.get('tenant_id') == tenant_id:
            sid = billing.get('sid_number', '')
            if sid and sid.startswith(site_code) and len(sid) == len(site_code) + 3:
                try:
                    number = int(sid[len(site_code):])
                    existing_numbers.append(number)
                except ValueError:
                    continue

    # Get next number
    next_number = max(existing_numbers) + 1 if existing_numbers else 1

    # Generate SID
    return f"{site_code}{next_number:03d}"

billing_bp = Blueprint('billing', __name__)

# Billing Routes
@billing_bp.route('/api/billing', methods=['GET'])
@token_required
def get_billings():
    billings = read_data('billings.json')

    # Apply tenant-based filtering
    billings = filter_data_by_tenant(billings, request.current_user)

    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)

    # Filter by patient_id if provided
    patient_id = request.args.get('patient_id')
    if patient_id:
        billings = [b for b in billings if str(b.get('patient_id')) == str(patient_id)]

    # Filter by SID number if provided
    sid_number = request.args.get('sid_number')
    if sid_number:
        billings = [b for b in billings if sid_number.lower() in b.get('sid_number', '').lower()]

    # Filter by invoice number if provided
    invoice_number = request.args.get('invoice_number')
    if invoice_number:
        billings = [b for b in billings if invoice_number.lower() in b.get('invoice_number', '').lower()]

    # Filter by status if provided
    status = request.args.get('status')
    if status:
        billings = [b for b in billings if b.get('status') == status]

    # Filter by date range if provided
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if start_date:
        billings = [b for b in billings if b.get('invoice_date', '') >= start_date]

    if end_date:
        billings = [b for b in billings if b.get('invoice_date', '') <= end_date]

    # Sort by created_at (newest first)
    billings = sorted(billings, key=lambda x: x.get('created_at', ''), reverse=True)

    # Add patient information
    patients = read_data('patients.json')
    for billing in billings:
        patient_id = billing.get('patient_id')
        if patient_id:
            patient = next((p for p in patients if p.get('id') == patient_id), None)
            if patient:
                billing['patient'] = {
                    'id': patient.get('id'),
                    'first_name': patient.get('first_name'),
                    'last_name': patient.get('last_name')
                }

    # Paginate results
    paginated_data = paginate_results(billings, page, per_page)

    return jsonify(paginated_data)


@billing_bp.route('/api/billing/<int:id>', methods=['DELETE'])
@token_required
def delete_billing_report(id):
    billing_data = read_data('billings.json')  # Load all billing records
    billing_index = next((i for i, bill in enumerate(billing_data) if bill['id'] == id), None)

    if billing_index is None:
        return jsonify({'success': False, 'message': 'Billing report not found'}), 404

   
    # Remove and save
    deleted_item = billing_data.pop(billing_index)
    write_data('billings.json', billing_data)

    return jsonify({'success': True, 'message': 'Billing report deleted successfully', 'item': deleted_item}), 200




@billing_bp.route('/api/billing/<int:id>', methods=['PUT'])
@token_required
def update_billing_report(id):
    # Load all existing billing records
    billing_data = read_data('billings.json')
    
    # Find the index of the billing record to update
    billing_index = next((i for i, bill in enumerate(billing_data) if bill['id'] == id), None)

    if billing_index is None:
        return jsonify({'success': False, 'message': 'Billing record not found'}), 404

    # Get the new data from the request
    updated_data = request.get_json()
    print(f"🔧 Updating billing ID {id} with data:", updated_data)

    # Update the record
    billing_data[billing_index].update(updated_data)

    # Save changes back to the file
    write_data('billings.json', billing_data)

    return jsonify({
        'success': True,
        'message': 'Billing record updated successfully',
        'updated_record': billing_data[billing_index]
    }), 200


@billing_bp.route('/api/billing/<int:id>', methods=['GET'])
@token_required
# def get_billing(id):
#     billings = read_data('billings.json')
#     billing = next((b for b in billings if b['id'] == id), None)

#     if not billing:
#         return jsonify({'message': 'Billing not found'}), 404

#     # Check franchise-based access control
#     user_tenant_id = request.current_user.get('tenant_id')
#     user_role = request.current_user.get('role')
#     billing_tenant_id = billing.get('tenant_id')

#     # Apply access control
#     if user_role == 'admin':
#         # Check if user is from Mayiladuthurai hub (can see all)
#         tenants = read_data('tenants.json')
#         user_tenant = next((t for t in tenants if t.get('id') == user_tenant_id), None)
#         if not (user_tenant and user_tenant.get('is_hub')):
#             # Non-hub admin can only see their own franchise
#             if billing_tenant_id != user_tenant_id:
#                 return jsonify({'message': 'Access denied'}), 403
#     elif user_role in ['franchise_admin', 'user']:
#         # Franchise admin and users can only see their own franchise
#         if billing_tenant_id != user_tenant_id:
#             return jsonify({'message': 'Access denied'}), 403

#     # Add comprehensive patient information
#     patient_id = billing.get('patient_id')
#     if patient_id:
#         patients = read_data('patients.json')
#         patient = next((p for p in patients if p.get('id') == patient_id), None)
#         if patient:
#             # Calculate age from date of birth
#             age = None
#             if patient.get('date_of_birth'):
#                 try:
#                     from datetime import datetime
#                     dob = datetime.strptime(patient['date_of_birth'], '%Y-%m-%d')
#                     today = datetime.now()
#                     age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
#                 except:
#                     age = None

#             # Enhanced patient information
#             billing['patient'] = {
#                 **patient,
#                 'age': age,
#                 'full_name': f"{patient.get('first_name', '')} {patient.get('last_name', '')}".strip(),
#                 'full_address': f"{patient.get('address', '')}, {patient.get('city', '')}, {patient.get('state', '')} {patient.get('postal_code', '')}".strip(', ')
#             }

#     # Add franchise/clinic information
#     tenants = read_data('tenants.json')
#     tenant = next((t for t in tenants if t.get('id') == billing_tenant_id), None)
#     if tenant:
#         billing['clinic'] = {
#             'name': tenant.get('name'),
#             'site_code': tenant.get('site_code'),
#             'address': tenant.get('address'),
#             'phone': tenant.get('contact_phone'),
#             'email': tenant.get('email'),
#             'is_hub': tenant.get('is_hub', False)
#         }

#     # Enhance items with test information
#     if billing.get('items'):
#         tests = read_data('tests.json')
#         enhanced_items = []

#         for item in billing['items']:
#             enhanced_item = dict(item)

#             # Find test information
#             test_id = item.get('test_id')
#             if test_id:
#                 test = next((t for t in tests if t.get('id') == test_id), None)
#                 if test:
#                     enhanced_item.update({
#                         'test_code': f"T{test_id:03d}",
#                         'test_name': test.get('test_name'),
#                         'sample_type_id': test.get('sample_type_id'),
#                         'turnaround_time': test.get('turnaround_time'),
#                         'department': 'Laboratory',  # Default department
#                         'category': 'Diagnostic Test'  # Default category
#                     })

#             # Ensure proper structure for display
#             enhanced_item.update({
#                 'description': enhanced_item.get('test_name') or enhanced_item.get('description', f"Test Item {item.get('id', '')}"),
#                 'quantity': enhanced_item.get('quantity', 1),
#                 'unit_price': enhanced_item.get('price') or enhanced_item.get('unit_price', 0),
#                 'total': enhanced_item.get('amount') or enhanced_item.get('total', 0),
#                 'discount': enhanced_item.get('discount', 0)
#             })

#             enhanced_items.append(enhanced_item)

#         billing['items'] = enhanced_items

#     # Add SID number if not present (for backward compatibility)
#     if not billing.get('sid_number') and billing.get('no'):
#         billing['sid_number'] = billing['no']

#     # Add additional invoice information
#     billing['invoice_info'] = {
#         'payment_terms': '30 days',
#         'service_period': billing.get('invoice_date', ''),
#         'tax_rate': billing.get('gst_rate', billing.get('tax_rate', 18)),
#         'notes': billing.get('notes', ''),
#         'created_by_name': 'System User'  # Could be enhanced to get actual user name
#     }

#     return jsonify(billing)
def get_billing(id):
    billings = read_data('billings.json')
    billing = next((b for b in billings if b['id'] == id), None)

    if not billing:
        return jsonify({'message': 'Billing not found'}), 404

    # Access control...
    user_tenant_id = request.current_user.get('tenant_id')
    user_role = request.current_user.get('role')
    billing_tenant_id = billing.get('tenant_id')

    if user_role == 'admin':
        tenants = read_data('tenants.json')
        user_tenant = next((t for t in tenants if t.get('id') == user_tenant_id), None)
        if not (user_tenant and user_tenant.get('is_hub')):
            if billing_tenant_id != user_tenant_id:
                return jsonify({'message': 'Access denied'}), 403
    elif user_role in ['franchise_admin', 'user']:
        if billing_tenant_id != user_tenant_id:
            return jsonify({'message': 'Access denied'}), 403

    # Patient info...
    patient_id = billing.get('patient_id')
    if patient_id:
        patients = read_data('patients.json')
        patient = next((p for p in patients if p.get('id') == patient_id), None)
        if patient:
            age = None
            if patient.get('date_of_birth'):
                try:
                    dob = datetime.strptime(patient['date_of_birth'], '%Y-%m-%d')
                    today = datetime.now()
                    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                except:
                    pass
            billing['patient'] = {
                **patient,
                'age': age,
                'full_name': f"{patient.get('first_name', '')} {patient.get('last_name', '')}".strip(),
                'full_address': f"{patient.get('address', '')}, {patient.get('city', '')}, {patient.get('state', '')} {patient.get('postal_code', '')}".strip(', ')
            }

    # Clinic info...
    tenants = read_data('tenants.json')
    tenant = next((t for t in tenants if t.get('id') == billing_tenant_id), None)
    if tenant:
        billing['clinic'] = {
            'name': tenant.get('name'),
            'site_code': tenant.get('site_code'),
            'address': tenant.get('address'),
            'phone': tenant.get('contact_phone'),
            'email': tenant.get('email'),
            'is_hub': tenant.get('is_hub', False)
        }

    # Enhance items...
    if billing.get('items'):
        tests = read_data('tests.json')
        enhanced_items = []
        for item in billing['items']:
            enhanced_item = dict(item)
            test_id = item.get('test_id')
            if test_id:
                test = next((t for t in tests if t.get('id') == test_id), None)
                if test:
                    enhanced_item.update({
                        'test_code': f"T{test_id:03d}",
                        'test_name': test.get('test_name'),
                        'sample_type_id': test.get('sample_type_id'),
                        'turnaround_time': test.get('turnaround_time'),
                        'department': 'Laboratory',
                        'category': 'Diagnostic Test'
                    })
            enhanced_item.update({
                'description': enhanced_item.get('test_name') or enhanced_item.get('description', f"Test Item {item.get('id', '')}"),
                'quantity': enhanced_item.get('quantity', 1),
                'unit_price': enhanced_item.get('price') or enhanced_item.get('unit_price', 0),
                'total': enhanced_item.get('amount') or enhanced_item.get('total', 0),
                'discount': enhanced_item.get('discount', 0)
            })
            enhanced_items.append(enhanced_item)
        billing['items'] = enhanced_items

    # SID backward compatibility
    if not billing.get('sid_number') and billing.get('no'):
        billing['sid_number'] = billing['no']

    # Invoice info
    billing['invoice_info'] = {
        'payment_terms': '30 days',
        'service_period': billing.get('invoice_date', ''),
        # 'tax_rate': billing.get('gst_rate', billing.get('tax_rate', 18)),
        'notes': billing.get('notes', ''),
        'created_by_name': 'System User'
    }

    # ✅ Recalculate totals right before returning
    subtotal = sum(safe_float(item.get('total', item.get('amount', 0))) for item in billing.get('items', []))
    # gst_rate = safe_float(billing.get('gst_rate', billing.get('tax_rate', 18)))
    # gst_amount = round(subtotal * gst_rate / 100.0, 2)
    other_charges = safe_float(billing.get('other_charges', 0))
    discount = safe_float(billing.get('discount', 0))
    bill_amount = round(subtotal + other_charges - discount, 2)
    paid = safe_float(billing.get('paid_amount', 0))
    balance = round(bill_amount - paid, 2)

    billing['subtotal'] = round(subtotal, 2)
    # billing['gst_amount'] = gst_amount
    # billing['tax'] = gst_amount
    billing['bill_amount'] = bill_amount
    billing['total_amount'] = bill_amount
    billing['balance'] = balance

    return jsonify(billing)


@billing_bp.route('/api/billing', methods=['POST'])
@billing_bp.route('/api/billing/', methods=['POST'])
@token_required
def create_billing():
    data = request.get_json()

    # UNIFIED BILLING API: Handle both new patient creation and existing patient billing
    patient_id = data.get('patient_id')
    patient_data = data.get('patient_data')

    # Validate that we have either patient_id OR patient_data
    if not patient_id and not patient_data:
        return jsonify({'message': 'Either patient_id (for existing patient) or patient_data (for new patient) is required'}), 400

    # Validate billing data
    if 'items' not in data or not data['items']:
        return jsonify({'message': 'Missing required field: items'}), 400
    if 'total_amount' not in data:
        return jsonify({'message': 'Missing required field: total_amount'}), 400

    # STEP 1: Handle patient creation if needed
    if not patient_id and patient_data:
        # Create new patient first
        try:
            # Validate required patient fields
            patient_required_fields = ['gender', 'date_of_birth', 'phone']
            for field in patient_required_fields:
                if field not in patient_data or not patient_data[field]:
                    return jsonify({'message': f'Missing required patient field: {field}'}), 400

            # Load patients data
            patients = read_data('patients.json')

            # Generate new patient ID
            new_patient_id = 1
            if patients:
                new_patient_id = max(p['id'] for p in patients) + 1

            # Generate patient_id (format: P00001)
            patient_id_code = f"P{new_patient_id:05d}"

            # Ensure first_name and last_name have default values if not provided
            if 'first_name' not in patient_data or not patient_data['first_name']:
                patient_data['first_name'] = 'Patient'
            if 'last_name' not in patient_data or not patient_data['last_name']:
                patient_data['last_name'] = f"#{new_patient_id}"

            # Determine target tenant_id for patient
            user_tenant_id = request.current_user.get('tenant_id')
            user_role = request.current_user.get('role')

            if user_role in ['admin', 'hub_admin']:
                target_tenant_id = patient_data.get('tenant_id') or data.get('branch') or user_tenant_id
            else:
                target_tenant_id = user_tenant_id

            # Create new patient record
            new_patient = {
                'id': new_patient_id,
                'patient_id': patient_id_code,
                'first_name': patient_data['first_name'],
                'last_name': patient_data['last_name'],
                'gender': patient_data['gender'],
                'date_of_birth': patient_data['date_of_birth'],
                'phone': patient_data['phone'],
                'email': patient_data.get('email', ''),
                'address': patient_data.get('address', ''),
                'city': patient_data.get('city', ''),
                'state': patient_data.get('state', 'Tamil Nadu'),
                'postal_code': patient_data.get('postal_code', ''),
                'emergency_contact': patient_data.get('emergency_contact', ''),
                'emergency_phone': patient_data.get('emergency_phone', ''),
                'blood_group': patient_data.get('blood_group', ''),
                'insurance_provider': patient_data.get('insurance_provider', ''),
                'insurance_id': patient_data.get('insurance_id', ''),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat(),
                'tenant_id': int(target_tenant_id),
                'created_by': request.current_user.get('id')
            }

            # Save new patient
            patients.append(new_patient)
            write_data('patients.json', patients)

            # Use the newly created patient ID for billing
            patient_id = new_patient_id

        except Exception as e:
            return jsonify({'message': f'Failed to create patient: {str(e)}'}), 500

    # STEP 2: Create billing record
    billings = read_data('billings.json')

    # Generate new billing ID
    new_id = 1
    if billings:
        new_id = max(b['id'] for b in billings) + 1

    # Generate invoice_number (format: INV00001)
    invoice_number = f"INV{new_id:05d}"

    # Determine target tenant_id based on user role and selected branch
    user_tenant_id = request.current_user.get('tenant_id')
    user_role = request.current_user.get('role')

    # For admin and hub_admin roles, use the selected branch as tenant_id
    # For other roles, use their own tenant_id
    if user_role in ['admin', 'hub_admin']:
        # Check if user is from Mayiladuthurai hub (can create for all franchises)
        tenants = read_data('tenants.json')
        user_tenant = next((t for t in tenants if t.get('id') == user_tenant_id), None)

        if user_tenant and user_tenant.get('is_hub'):
            # Use selected branch from form data
            target_tenant_id = data.get('branch')
            if target_tenant_id:
                target_tenant_id = int(target_tenant_id)

                # Validate that the target tenant exists
                target_tenant = next((t for t in tenants if t.get('id') == target_tenant_id), None)
                if not target_tenant:
                    return jsonify({'message': 'Selected branch not found'}), 400
            else:
                target_tenant_id = user_tenant_id  # Fallback to user's own tenant
        else:
            # Non-hub admin can only create for their own franchise
            target_tenant_id = user_tenant_id
    else:
        # Other roles can only create for their own franchise
        target_tenant_id = user_tenant_id

    # Auto-generate SID number if not provided
    sid_number = data.get('no') or data.get('sid_number', '')
    if not sid_number:
        # Generate SID automatically for the target tenant
        try:
            sid_number = generate_franchise_sid(target_tenant_id)
        except Exception as e:
            return jsonify({'message': f'Failed to generate SID: {str(e)}'}), 500
    else:
        # Validate provided SID for uniqueness and format
        if SID_GENERATOR_AVAILABLE:
            try:
                # Validate format
                is_valid, message = sid_generator.validate_sid_format(sid_number, target_tenant_id)
                if not is_valid:
                    return jsonify({'message': f'Invalid SID format: {message}'}), 400

                # Check uniqueness
                if not sid_generator.is_sid_unique(sid_number):
                    return jsonify({'message': f'SID {sid_number} already exists. Please use a different SID.'}), 400
            except Exception as e:
                return jsonify({'message': f'SID validation failed: {str(e)}'}), 500

    # Create new billing
    new_billing = {
        'id': new_id,
        'invoice_number': invoice_number,
        'sid_number': sid_number,  # Store auto-generated or provided SID number
        'patient_id': patient_id,  # Use the patient_id (either existing or newly created)
        'items': data['items'],
        'bill_amount': data.get('bill_amount', 0),
        'other_charges': data.get('other_charges', 0),
        'discount_percent': data.get('discount_percent', 0),
        'subtotal': data.get('subtotal', data['total_amount']),
        'discount': data.get('discount', 0),
        'gst_rate': data.get('gst_rate', 0),
        'gst_amount': data.get('gst_amount', 0),
        'tax': data.get('tax', data.get('gst_amount', 0)),  # Map GST to tax for compatibility
        'total_amount': data['total_amount'],
        'paid_amount': data.get('paid_amount', 0),
        'balance': data['total_amount'] - data.get('paid_amount', 0),
        'payment_method': data.get('payment_method', ''),
        'payment_status': 'Pending' if data.get('paid_amount', 0) == 0 else ('Paid' if data.get('paid_amount', 0) >= data['total_amount'] else 'Partial'),
        'status': 'Pending',
        'invoice_date': datetime.now().isoformat().split('T')[0],
        'due_date': data.get('due_date', (datetime.now() + timedelta(days=30)).isoformat().split('T')[0]),
        'notes': data.get('notes', ''),
        'branch': data.get('branch', ''),  # Store branch information
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'tenant_id': target_tenant_id,  # Use role-based target tenant
        'created_by': request.current_user.get('id')
    }

    billings.append(new_billing)
    write_data('billings.json', billings)

    # Automatically generate comprehensive billing report
    if REPORTS_SERVICE_AVAILABLE:
        try:
            reports_service = BillingReportsService()
            print(f"✓ Attempting to generate report for billing {new_billing['id']}")

            # Generate report with user context
            user_id = request.current_user.get('id') if hasattr(request, 'current_user') else None
            tenant_id = request.current_user.get('tenant_id') if hasattr(request, 'current_user') else new_billing.get('tenant_id')

            report = reports_service.generate_comprehensive_report(
                new_billing['id'],
                user_id=user_id,
                tenant_id=tenant_id
            )

            if report:
                # Save report
                if reports_service.save_report(report):
                    new_billing['report_generated'] = True
                    new_billing['sid_number'] = report.get('sid_number')
                    new_billing['report_id'] = report.get('id')
                    print(f"✓ Billing report generated successfully: SID {report.get('sid_number')}")
                else:
                    new_billing['report_generated'] = False
                    print(f"✗ Failed to save billing report for billing {new_billing['id']}")
            else:
                new_billing['report_generated'] = False
                print(f"✗ Failed to generate billing report for billing {new_billing['id']}")

        except Exception as e:
            new_billing['report_generated'] = False
            print(f"✗ Error during automatic report generation: {str(e)}")
            import traceback
            traceback.print_exc()
    else:
        new_billing['report_generated'] = False
        print("✗ BillingReportsService not available")

    return jsonify(new_billing), 201


@billing_bp.route('/api/billing/<int:id>', methods=['PUT'])
@token_required
def update_billing(id):
    data = request.get_json()

    billings = read_data('billings.json')
    billing_index = next((i for i, b in enumerate(billings) if b['id'] == id), None)

    if billing_index is None:
        return jsonify({'message': 'Billing not found'}), 404

    billing = billings[billing_index]

    # Define non-updatable fields
    protected_fields = ['id', 'invoice_number', 'created_at', 'tenant_id', 'created_by']

    # Overwrite existing fields (except protected ones)
    for key in billing:
        if key not in protected_fields and key in data:
            billing[key] = data[key]

    # If any new fields are in the incoming data, add them
    for key, value in data.items():
        if key not in billing and key not in protected_fields:
            billing[key] = value

    # Recalculate balance if total or paid amount changed
    if 'total_amount' in billing and 'paid_amount' in billing:
        billing['balance'] = billing['total_amount'] - billing['paid_amount']

        # Update status based on balance
        if billing['balance'] <= 0:
            billing['status'] = 'Paid'
            billing['payment_status'] = 'Paid'
        elif billing['paid_amount'] > 0:
            billing['status'] = 'Partial'
            billing['payment_status'] = 'Partial'
        else:
            billing['status'] = 'Pending'
            billing['payment_status'] = 'Pending'

    billing['updated_at'] = datetime.now().isoformat()

    write_data('billings.json', billings)

    return jsonify({
        "message": "Billing record updated successfully",
        "success": True,
        "updated_record": billing
    })




@billing_bp.route('/api/billing/<int:id>/collect', methods=['POST'])
@token_required
def collect_payment(id):
    data = request.get_json()

    # Validate required fields
    required_fields = ['amount', 'payment_method']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    billings = read_data('billings.json')
    billing_index = next((i for i, b in enumerate(billings) if b['id'] == id), None)

    if billing_index is None:
        return jsonify({'message': 'Billing not found'}), 404

    # Update billing with payment
    billing = billings[billing_index]

    # Check if billing is already paid
    if billing.get('status') == 'Paid':
        return jsonify({'message': 'Invoice is already paid'}), 400

    # Check if payment amount is valid
    amount = float(data['amount'])
    if amount <= 0:
        return jsonify({'message': 'Payment amount must be greater than zero'}), 400

    if amount > billing['balance']:
        return jsonify({'message': 'Payment amount exceeds balance'}), 400

    # Update payment information
    billing['paid_amount'] = billing.get('paid_amount', 0) + amount
    billing['balance'] = billing['total_amount'] - billing['paid_amount']
    billing['payment_method'] = data['payment_method']

    # Add payment to history
    if 'payments' not in billing:
        billing['payments'] = []

    payment = {
        'amount': amount,
        'payment_method': data['payment_method'],
        'payment_date': datetime.now().isoformat(),
        'reference': data.get('reference', ''),
        'notes': data.get('notes', ''),
        'collected_by': request.current_user.get('id')
    }

    billing['payments'].append(payment)

    # Update status
    if billing['balance'] <= 0:
        billing['status'] = 'Paid'
        billing['payment_status'] = 'Paid'
    else:
        billing['status'] = 'Partial'
        billing['payment_status'] = 'Partial'

    billing['updated_at'] = datetime.now().isoformat()

    # Save updated billings
    write_data('billings.json', billings)

    return jsonify(billing)

@billing_bp.route('/api/billing/search', methods=['GET'])
@token_required
def search_billings():
    query = request.args.get('q', '')

    if not query:
        return jsonify({'message': 'Search query is required'}), 400

    billings = read_data('billings.json')

    # Apply tenant-based filtering
    billings = filter_data_by_tenant(billings, request.current_user)

    # Enhanced search by invoice number, SID number, or patient name
    results = []
    patients = read_data('patients.json')

    for billing in billings:
        match_found = False

        # Check invoice number
        if query.lower() in billing.get('invoice_number', '').lower():
            results.append(billing)
            match_found = True
            continue

        # Check SID number
        if query.lower() in billing.get('sid_number', '').lower():
            results.append(billing)
            match_found = True
            continue

        # Check patient name
        patient_id = billing.get('patient_id')
        if patient_id and not match_found:
            patient = next((p for p in patients if p.get('id') == patient_id), None)
            if patient:
                full_name = f"{patient.get('first_name', '')} {patient.get('last_name', '')}".lower()
                if query.lower() in full_name:
                    results.append(billing)
                    match_found = True

    # Sort by created_at (newest first)
    results = sorted(results, key=lambda x: x.get('created_at', ''), reverse=True)

    # Add patient information
    for billing in results:
        patient_id = billing.get('patient_id')
        if patient_id:
            patient = next((p for p in patients if p.get('id') == patient_id), None)
            if patient:
                billing['patient'] = {
                    'id': patient.get('id'),
                    'first_name': patient.get('first_name'),
                    'last_name': patient.get('last_name')
                }

    # Paginate results
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)
    paginated_data = paginate_results(results, page, per_page)

    return jsonify(paginated_data)

@billing_bp.route('/api/billing/generate-sid', methods=['POST'])
@token_required
def generate_sid():
    """Generate SID (Sample Identification Number) based on franchise site code and sequential numbering"""
    data = request.get_json()

    # Get tenant information
    tenants = read_data('tenants.json')
    user_tenant_id = request.current_user.get('tenant_id')
    user_role = request.current_user.get('role')

    # Determine which tenant to generate SID for
    target_tenant_id = data.get('tenant_id', user_tenant_id)
    # Convert to integer if it's a string
    if isinstance(target_tenant_id, str):
        target_tenant_id = int(target_tenant_id)

    # Access control: Mayiladuthurai and Admin roles can generate for all, others only for their own
    if user_role in ['admin'] or (user_tenant_id == 1 and user_role in ['admin', 'hub_admin']):
        # Admin or Mayiladuthurai users can generate for any franchise
        pass
    else:
        # Other users can only generate for their own franchise
        target_tenant_id = user_tenant_id

    # Get target tenant information
    target_tenant = next((t for t in tenants if t.get('id') == target_tenant_id), None)
    if not target_tenant:
        return jsonify({'message': 'Tenant not found'}), 404

    try:
        # Generate SID using centralized generator with retry mechanism
        sid_number = generate_franchise_sid(target_tenant_id)
        site_code = target_tenant.get('site_code', 'XX')

        # Validate SID format
        if SID_GENERATOR_AVAILABLE:
            is_valid, error_msg = sid_generator.validate_sid_format(sid_number, target_tenant_id)
            if not is_valid:
                raise Exception(f"Generated SID format validation failed: {error_msg}")
            # Note: Uniqueness is already checked by the SID generator during generation

        return jsonify({
            'sid_number': sid_number,
            'tenant_id': target_tenant_id,
            'tenant_name': target_tenant.get('name'),
            'site_code': site_code,
            'success': True
        })
    except Exception as e:
        error_message = str(e)
        if "already exists" in error_message.lower():
            error_code = 'SID_DUPLICATE_ERROR'
        else:
            error_code = 'SID_GENERATION_FAILED'

        return jsonify({
            'message': f'Failed to generate SID: {error_message}',
            'error': error_code,
            'tenant_id': target_tenant_id,
            'success': False
        }), 500

@billing_bp.route('/api/billing/due-amounts', methods=['GET'])
@token_required
def get_due_amounts():
    """Get outstanding due amounts for patients"""
    try:
        # Get query parameters
        patient_id = request.args.get('patient_id')
        patient_name = request.args.get('patient_name', '').strip()
        mobile = request.args.get('mobile', '').strip()
        sid_number = request.args.get('sid_number', '').strip()
        branch_id = request.args.get('branch_id')

        # Load billing data
        billings = read_data('billings.json')
        patients = read_data('patients.json')

        # Filter billings with outstanding amounts
        due_billings = []

        for billing in billings:
            # Calculate due amount
            total_amount = float(billing.get('total_amount', 0))
            paid_amount = float(billing.get('paid_amount', 0))
            due_amount = total_amount - paid_amount

            # Skip if no due amount
            if due_amount <= 0:
                continue

            # Apply filters
            if patient_id and str(billing.get('patient_id')) != str(patient_id):
                continue

            if sid_number and billing.get('sid_number', '').lower() != sid_number.lower():
                continue

            if branch_id and str(billing.get('tenant_id')) != str(branch_id):
                continue

            # Get patient details
            patient = next((p for p in patients if p.get('id') == billing.get('patient_id')), None)
            if not patient:
                continue

            # Apply patient name filter
            if patient_name:
                full_name = f"{patient.get('first_name', '')} {patient.get('last_name', '')}".strip().lower()
                if patient_name.lower() not in full_name:
                    continue

            # Apply mobile filter
            if mobile and patient.get('phone', '') != mobile:
                continue

            # Add to results
            due_billings.append({
                'billing_id': billing.get('id'),
                'sid_number': billing.get('sid_number'),
                'patient_id': billing.get('patient_id'),
                'patient_name': f"{patient.get('first_name', '')} {patient.get('last_name', '')}".strip(),
                'patient_mobile': patient.get('phone', ''),
                'billing_date': billing.get('created_at', ''),
                'total_amount': total_amount,
                'paid_amount': paid_amount,
                'due_amount': due_amount,
                'payment_status': 'Partial' if paid_amount > 0 else 'Pending',
                'items': billing.get('items', []),
                'tenant_id': billing.get('tenant_id')
            })

        # Sort by due amount descending
        due_billings.sort(key=lambda x: x['due_amount'], reverse=True)

        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        paginated_data = paginate_results(due_billings, page, per_page)

        return jsonify(paginated_data)

    except Exception as e:
        return jsonify({'message': f'Error fetching due amounts: {str(e)}'}), 500

@billing_bp.route('/api/billing/due-payment', methods=['POST'])
@token_required
def process_due_payment():
    """Process payment for outstanding due amounts"""
    try:
        data = request.get_json()
        billing_id = data.get('billing_id')
        payment_amount = float(data.get('payment_amount', 0))
        payment_method = data.get('payment_method', 'Cash')
        payment_reference = data.get('payment_reference', '')
        notes = data.get('notes', '')

        if not billing_id or payment_amount <= 0:
            return jsonify({'message': 'Invalid billing ID or payment amount'}), 400

        # Load billing data
        billings = read_data('billings.json')
        billing = next((b for b in billings if b.get('id') == billing_id), None)

        if not billing:
            return jsonify({'message': 'Billing record not found'}), 404

        # Calculate current due amount
        total_amount = float(billing.get('total_amount', 0))
        current_paid = float(billing.get('paid_amount', 0))
        due_amount = total_amount - current_paid

        if due_amount <= 0:
            return jsonify({'message': 'No outstanding amount for this billing'}), 400

        if payment_amount > due_amount:
            return jsonify({'message': f'Payment amount cannot exceed due amount of ₹{due_amount:.2f}'}), 400

        # Update billing record
        new_paid_amount = current_paid + payment_amount
        new_due_amount = total_amount - new_paid_amount

        billing['paid_amount'] = new_paid_amount
        billing['payment_status'] = 'Paid' if new_due_amount <= 0 else 'Partial'
        billing['last_payment_date'] = datetime.now().isoformat()
        billing['last_payment_method'] = payment_method
        billing['last_payment_reference'] = payment_reference

        # Add payment history
        if 'payment_history' not in billing:
            billing['payment_history'] = []

        billing['payment_history'].append({
            'payment_date': datetime.now().isoformat(),
            'amount': payment_amount,
            'method': payment_method,
            'reference': payment_reference,
            'notes': notes,
            'processed_by': request.current_user.get('id'),
            'remaining_due': new_due_amount
        })

        # Save updated billing data
        write_data('billings.json', billings)

        return jsonify({
            'message': 'Payment processed successfully',
            'billing_id': billing_id,
            'payment_amount': payment_amount,
            'new_paid_amount': new_paid_amount,
            'remaining_due': new_due_amount,
            'payment_status': billing['payment_status']
        })

    except Exception as e:
        return jsonify({'message': f'Error processing payment: {str(e)}'}), 500

@billing_bp.route('/api/billing/payment-history/<int:patient_id>', methods=['GET'])
@token_required
def get_payment_history(patient_id):
    """Get complete payment history for a patient"""
    try:
        billings = read_data('billings.json')
        patients = read_data('patients.json')

        # Get patient details
        patient = next((p for p in patients if p.get('id') == patient_id), None)
        if not patient:
            return jsonify({'message': 'Patient not found'}), 404

        # Get all billings for this patient
        patient_billings = [b for b in billings if b.get('patient_id') == patient_id]

        payment_history = []
        for billing in patient_billings:
            history = billing.get('payment_history', [])
            for payment in history:
                payment_history.append({
                    'billing_id': billing.get('id'),
                    'sid_number': billing.get('sid_number'),
                    'payment_date': payment.get('payment_date'),
                    'amount': payment.get('amount'),
                    'method': payment.get('method'),
                    'reference': payment.get('reference'),
                    'notes': payment.get('notes'),
                    'remaining_due': payment.get('remaining_due')
                })

        # Sort by payment date descending
        payment_history.sort(key=lambda x: x['payment_date'], reverse=True)

        return jsonify({
            'patient_id': patient_id,
            'patient_name': f"{patient.get('first_name', '')} {patient.get('last_name', '')}".strip(),
            'payment_history': payment_history
        })

    except Exception as e:
        return jsonify({'message': f'Error fetching payment history: {str(e)}'}), 500

@billing_bp.route('/api/billing/refund', methods=['POST'])
@token_required
def process_refund():
    """Process refund request for billing"""
    try:
        data = request.get_json()
        billing_id = data.get('billing_id')
        refund_amount = float(data.get('refund_amount', 0))
        refund_reason = data.get('refund_reason', '')
        refund_type = data.get('refund_type', 'full')  # 'full' or 'partial'
        refund_items = data.get('refund_items', [])  # For partial refunds
        notes = data.get('notes', '')

        if not billing_id or refund_amount <= 0:
            return jsonify({'message': 'Invalid billing ID or refund amount'}), 400

        if not refund_reason:
            return jsonify({'message': 'Refund reason is required'}), 400

        # Load billing data
        billings = read_data('billings.json')
        billing = next((b for b in billings if b.get('id') == billing_id), None)

        if not billing:
            return jsonify({'message': 'Billing record not found'}), 404

        # Check refund eligibility
        paid_amount = float(billing.get('paid_amount', 0))
        existing_refunds = sum(r.get('amount', 0) for r in billing.get('refund_history', []))
        refundable_amount = paid_amount - existing_refunds

        if refundable_amount <= 0:
            return jsonify({'message': 'No refundable amount available'}), 400

        if refund_amount > refundable_amount:
            return jsonify({'message': f'Refund amount cannot exceed refundable amount of ₹{refundable_amount:.2f}'}), 400

        # Check if approval is required (for amounts above threshold)
        approval_threshold = 1000.0  # ₹1000
        requires_approval = refund_amount > approval_threshold

        # Create refund record
        refund_id = len(billing.get('refund_history', [])) + 1
        refund_record = {
            'refund_id': refund_id,
            'amount': refund_amount,
            'reason': refund_reason,
            'type': refund_type,
            'items': refund_items,
            'notes': notes,
            'status': 'Pending Approval' if requires_approval else 'Approved',
            'requested_by': request.current_user.get('id'),
            'requested_at': datetime.now().isoformat(),
            'approved_by': None if requires_approval else request.current_user.get('id'),
            'approved_at': None if requires_approval else datetime.now().isoformat(),
            'processed_at': None,
            'refund_method': data.get('refund_method', 'Original Payment Method')
        }

        # Add to billing record
        if 'refund_history' not in billing:
            billing['refund_history'] = []

        billing['refund_history'].append(refund_record)

        # Update billing status if fully refunded
        total_refunds = existing_refunds + refund_amount
        if total_refunds >= paid_amount:
            billing['refund_status'] = 'Fully Refunded'
        else:
            billing['refund_status'] = 'Partially Refunded'

        # Save updated billing data
        write_data('billings.json', billings)

        response_data = {
            'message': 'Refund request created successfully',
            'refund_id': refund_id,
            'billing_id': billing_id,
            'refund_amount': refund_amount,
            'status': refund_record['status'],
            'requires_approval': requires_approval
        }

        if requires_approval:
            response_data['message'] += ' - Pending manager approval'

        return jsonify(response_data)

    except Exception as e:
        return jsonify({'message': f'Error processing refund: {str(e)}'}), 500

@billing_bp.route('/api/billing/refund/<int:billing_id>/<int:refund_id>/approve', methods=['POST'])
@token_required
def approve_refund(billing_id, refund_id):
    """Approve a pending refund request"""
    try:
        # Check if user has approval permissions (manager role)
        user_role = request.current_user.get('role', '').lower()
        if user_role not in ['manager', 'admin', 'super_admin']:
            return jsonify({'message': 'Insufficient permissions to approve refunds'}), 403

        # Load billing data
        billings = read_data('billings.json')
        billing = next((b for b in billings if b.get('id') == billing_id), None)

        if not billing:
            return jsonify({'message': 'Billing record not found'}), 404

        # Find refund record
        refund_history = billing.get('refund_history', [])
        refund = next((r for r in refund_history if r.get('refund_id') == refund_id), None)

        if not refund:
            return jsonify({'message': 'Refund record not found'}), 404

        if refund.get('status') != 'Pending Approval':
            return jsonify({'message': 'Refund is not pending approval'}), 400

        # Approve refund
        refund['status'] = 'Approved'
        refund['approved_by'] = request.current_user.get('id')
        refund['approved_at'] = datetime.now().isoformat()
        refund['processed_at'] = datetime.now().isoformat()

        # Save updated billing data
        write_data('billings.json', billings)

        return jsonify({
            'message': 'Refund approved successfully',
            'refund_id': refund_id,
            'billing_id': billing_id,
            'approved_by': request.current_user.get('username'),
            'approved_at': refund['approved_at']
        })

    except Exception as e:
        return jsonify({'message': f'Error approving refund: {str(e)}'}), 500

@billing_bp.route('/api/billing/refunds', methods=['GET'])
@token_required
def get_refund_requests():
    """Get refund requests with filtering"""
    try:
        status_filter = request.args.get('status', '')  # 'pending', 'approved', 'rejected'
        patient_name = request.args.get('patient_name', '').strip()

        # Load data
        billings = read_data('billings.json')
        patients = read_data('patients.json')

        refund_requests = []

        for billing in billings:
            refund_history = billing.get('refund_history', [])
            if not refund_history:
                continue

            # Get patient details
            patient = next((p for p in patients if p.get('id') == billing.get('patient_id')), None)
            if not patient:
                continue

            patient_full_name = f"{patient.get('first_name', '')} {patient.get('last_name', '')}".strip()

            # Apply patient name filter
            if patient_name and patient_name.lower() not in patient_full_name.lower():
                continue

            for refund in refund_history:
                # Apply status filter
                if status_filter:
                    if status_filter.lower() == 'pending' and refund.get('status') != 'Pending Approval':
                        continue
                    elif status_filter.lower() == 'approved' and refund.get('status') != 'Approved':
                        continue

                refund_requests.append({
                    'billing_id': billing.get('id'),
                    'sid_number': billing.get('sid_number'),
                    'patient_name': patient_full_name,
                    'patient_mobile': patient.get('phone', ''),
                    'refund_id': refund.get('refund_id'),
                    'amount': refund.get('amount'),
                    'reason': refund.get('reason'),
                    'type': refund.get('type'),
                    'status': refund.get('status'),
                    'requested_at': refund.get('requested_at'),
                    'approved_at': refund.get('approved_at'),
                    'notes': refund.get('notes', ''),
                    'refund_method': refund.get('refund_method', '')
                })

        # Sort by requested date descending
        refund_requests.sort(key=lambda x: x['requested_at'], reverse=True)

        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        paginated_data = paginate_results(refund_requests, page, per_page)

        return jsonify(paginated_data)

    except Exception as e:
        return jsonify({'message': f'Error fetching refund requests: {str(e)}'}), 500

@billing_bp.route('/api/billing/validate', methods=['POST'])
@token_required
def validate_billing():
    """Validate billing data before creation"""
    data = request.get_json()

    errors = []

    # Validate required fields
    required_fields = ['patient_id', 'items', 'total_amount']
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f'Missing required field: {field}')

    # Validate items array
    if 'items' in data and isinstance(data['items'], list):
        if len(data['items']) == 0:
            errors.append('At least one test item is required')
        else:
            for i, item in enumerate(data['items']):
                # Require test_id for new ID-based system
                if not item.get('test_id'):
                    errors.append(f'Test ID is required for item {i + 1}')
                # Also require test name for display
                test_name = item.get('test_name') or item.get('testName')
                if not test_name:
                    errors.append(f'Test name is required for item {i + 1}')
                if not item.get('amount') or float(item.get('amount', 0)) <= 0:
                    errors.append(f'Valid amount is required for item {i + 1}')

    # Validate patient exists
    if 'patient_id' in data and data['patient_id']:
        patients = read_data('patients.json')
        patient = next((p for p in patients if p.get('id') == data['patient_id']), None)
        if not patient:
            errors.append('Selected patient not found')

    # Validate total amount
    if 'total_amount' in data:
        try:
            total = float(data['total_amount'])
            if total <= 0:
                errors.append('Total amount must be greater than zero')
        except (ValueError, TypeError):
            errors.append('Invalid total amount')

    # Validate SID if provided
    sid_number = data.get('no') or data.get('sid_number', '')
    if sid_number and SID_GENERATOR_AVAILABLE:
        try:
            # Determine target tenant for SID validation
            user_tenant_id = request.current_user.get('tenant_id')
            user_role = request.current_user.get('role')
            target_tenant_id = data.get('branch', user_tenant_id)

            if isinstance(target_tenant_id, str):
                target_tenant_id = int(target_tenant_id)

            # Validate SID format
            is_valid, message = sid_generator.validate_sid_format(sid_number, target_tenant_id)
            if not is_valid:
                errors.append(f'Invalid SID format: {message}')

            # Check uniqueness
            if is_valid and not sid_generator.is_sid_unique(sid_number):
                errors.append(f'SID {sid_number} already exists. Please use a different SID.')

        except Exception as e:
            errors.append(f'SID validation failed: {str(e)}')

    if errors:
        return jsonify({'message': '; '.join(errors), 'errors': errors}), 400

    return jsonify({'message': 'Validation successful', 'valid': True})

@billing_bp.route('/api/billing/test-master', methods=['GET'])
@token_required
def get_test_master():
    """Get test master data for billing test selection"""
    try:
        test_master = read_data('test_master.json')

        # Format for frontend consumption
        formatted_tests = []
        for test in test_master:
            formatted_tests.append({
                'id': test.get('id'),
                'testName': test.get('testName'),
                'displayName': test.get('displayName'),
                'department': test.get('department'),
                'hmsCode': test.get('hmsCode'),
                'testPrice': test.get('test_price', 0),
                'specimen': test.get('specimen'),
                'container': test.get('container'),
                'serviceTime': test.get('serviceTime'),
                'reportingDays': test.get('reportingDays'),
                'cutoffTime': test.get('cutoffTime')
            })

        return jsonify({
            'success': True,
            'data': formatted_tests,
            'total': len(formatted_tests)
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch test master data: {str(e)}'
        }), 500

@billing_bp.route('/api/billing/test-master/search', methods=['GET'])
@token_required
def search_test_master():
    """Search test master data for billing test selection"""
    try:
        query = request.args.get('q', '').lower()
        department = request.args.get('department', '').lower()
        limit = request.args.get('limit', 50, type=int)

        test_master = read_data('test_master.json')

        # Filter tests based on search criteria
        filtered_tests = []
        for test in test_master:
            test_name = test.get('testName', '').lower()
            test_dept = test.get('department', '').lower()

            # Apply filters
            if query and query not in test_name:
                continue
            if department and department not in test_dept:
                continue

            filtered_tests.append({
                'id': test.get('id'),
                'testName': test.get('testName'),
                'displayName': test.get('displayName'),
                'department': test.get('department'),
                'hmsCode': test.get('hmsCode'),
                'testPrice': test.get('test_price', 0),
                'specimen': test.get('specimen'),
                'container': test.get('container'),
                'serviceTime': test.get('serviceTime'),
                'reportingDays': test.get('reportingDays'),
                'cutoffTime': test.get('cutoffTime')
            })

        # Limit results
        filtered_tests = filtered_tests[:limit]

        return jsonify({
            'success': True,
            'data': filtered_tests,
            'total': len(filtered_tests),
            'query': query,
            'department': department
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to search test master data: {str(e)}'
        }), 500


def to_camel_case(snake_dict):
    """Convert snake_case keys in a dict to camelCase."""
    camel_dict = {}
    for k, v in snake_dict.items():
        parts = k.split('_')
        camel_key = parts[0] + ''.join(word.capitalize() for word in parts[1:])
        camel_dict[camel_key] = v
    return camel_dict

@billing_bp.route("/api/billing/<int:id>/add-test", methods=["POST"])
@token_required
def add_test_to_billing(id):
    data = request.get_json()
    new_tests = data.get('test_items', [])

    if not new_tests:
        return jsonify({"success": False, "message": "No test items provided"}), 400

    # Load billings
    billings = read_data('billings.json')
    billing_index = next((i for i, b in enumerate(billings) if b['id'] == id), None)
    if billing_index is None:
        return jsonify({"success": False, "message": "Billing not found"}), 404

    billing = billings[billing_index]

    # Ensure arrays exist
    billing.setdefault('test_items', [])
    billing.setdefault('items', [])

    # Template: Use the first test item as the structure template (if exists)
    template = billing['test_items'][0] if billing['test_items'] else {}

    # Get existing IDs for test_items
    existing_ids = [t.get('id', 0) for t in billing['test_items']]
    next_test_id = max(existing_ids) + 1 if existing_ids else 1

    for test in new_tests:
        # Convert selectedTestData keys to camelCase if present
        selected_test_data = test.get('selectedTestData', {})
        camel_selected_test_data = to_camel_case(selected_test_data)

        # Build new test item using template keys if present, else default values
        new_test_item = {
            "id": next_test_id,
            "amount": test.get("amount", template.get("amount", 0)),
            "applicable_to": test.get("applicable_to", template.get("applicable_to", "All")),
            "container": test.get("container", template.get("container", None)),
            "critical_high": template.get("critical_high", None),
            "critical_low": template.get("critical_low", None),
            "cutoff_time": test.get("cutoff_time", template.get("cutoff_time", "")),
            "decimals": test.get("decimals", template.get("decimals", 1)),
            "department": test.get("department", template.get("department", "")),
            "display_name": test.get("name", template.get("display_name", "")),
            "hms_code": test.get("hms_code", template.get("hms_code", "")),
            "instructions": test.get("instructions", template.get("instructions", "")),
            "international_code": test.get("international_code", template.get("international_code", "")),
            "interpretation": test.get("interpretation", template.get("interpretation", "")),
            "method": test.get("method", template.get("method", "")),
            "min_sample_qty": test.get("min_sample_qty", template.get("min_sample_qty", "")),
            "price": test.get("amount", template.get("price", 0)),
            "primary_specimen": test.get("primary_specimen", template.get("primary_specimen", "")),
            "quantity": 1,
            "reference_range": test.get("reference_range", template.get("reference_range", "")),
            "reporting_days": test.get("reporting_days", template.get("reporting_days", [])),
            "result_unit": test.get("result_unit", template.get("result_unit", "")),
            "sample_received": False,
            "sample_received_timestamp": None,
            "sample_status": "Not Received",
            "service_time": test.get("service_time", template.get("service_time", "")),
            "short_name": test.get("short_name", template.get("short_name", "")),
            "specimen": test.get("specimen", template.get("specimen", [])),
            "suffix_desc": test.get("suffix_desc", template.get("suffix_desc", "")),
            "test_done_on": test.get("test_done_on", template.get("test_done_on", [])),
            "test_master_data": camel_selected_test_data,
            "test_master_id": test.get("test_master_id", template.get("test_master_id", 0)),
            "test_name": test.get("name", template.get("test_name", "")),
            "test_price": test.get("test_price", template.get("test_price", None)),
            "test_suffix": test.get("test_suffix", template.get("test_suffix", "")),
            "unacceptable_conditions": test.get("unacceptable_conditions", template.get("unacceptable_conditions", [])),
        }

        billing['test_items'].append(new_test_item)

        billing['items'].append({
            "amount": test.get("amount", 0),
            "description": test.get("name", ""),
            "display_name": test.get("name", ""),
            "id": int(datetime.now().timestamp() * 1000) + next_test_id,
            "price": test.get("amount", 0),
            "quantity": 1,
            "test_id": test.get("test_id"),
            "test_name": test.get("name", ""),
            "unit_price": test.get("amount", 0),
            "total": test.get("amount", 0),
            "status": "Pending",
            "test_master_data": camel_selected_test_data
        })

        next_test_id += 1

    # Recalculate billing totals
    subtotal = sum(safe_float(item.get('amount', 0)) for item in billing['test_items'])
    discount = safe_float(billing.get('discount', 0))
    tax_rate = safe_float(billing.get('gst_rate', billing.get('tax_rate', 0)))
    tax_amount = (subtotal - discount) * (tax_rate / 100)
    net_amount = subtotal - discount + tax_amount

    billing['total_amount'] = subtotal
    billing['tax_amount'] = tax_amount
    billing['net_amount'] = net_amount
    billing['balance'] = net_amount - safe_float(billing.get('paid_amount', 0))
    billing['updated_at'] = datetime.now().isoformat()

    # Save billings
    billings[billing_index] = billing
    write_data('billings.json', billings)

    # Update billing reports
    billing_reports = read_data('billing_reports.json')
    report_index = next((i for i, r in enumerate(billing_reports) if r.get('billing_id') == id), None)
    if report_index is not None:
        report = billing_reports[report_index]
        report.setdefault('test_items', [])
        report.setdefault('financial_summary', {})

        existing_report_ids = [t.get('id', 0) for t in report['test_items']]
        current_id_base = max(existing_report_ids, default=0) + 1

        for idx, test in enumerate(new_tests):
            camel_selected_test_data = to_camel_case(test.get('selectedTestData', {}))
            test_master = camel_selected_test_data or {}
            reference_range_val = test.get('reference_range') or test_master.get('referenceRange', '')
            result_unit_val = test.get('result_unit') or test_master.get('resultUnit', '')

            report['test_items'].append({
                "id": current_id_base + idx,
                "test_name": test.get('name', ''),
                "amount": test.get('amount', 0),
                "price": test.get('amount', 0),
                "quantity": 1,
                "sample_received": False,
                "sample_received_timestamp": None,
                "sample_status": "Not Received",
                "referenceRange": reference_range_val,
                "resultUnit": result_unit_val,
                "test_master_data": camel_selected_test_data
            })

        subtotal_report = sum(item.get('amount', 0) for item in report['test_items'])
        tax_amount_report = (subtotal_report - discount) * (tax_rate / 100)
        net_amount_report = subtotal_report - discount + tax_amount_report

        report['financial_summary'].update({
            "bill_amount": subtotal_report,
            "subtotal": subtotal_report,
            "discount_amount": discount,
            "discount_percent": 0,
            "gst_rate": tax_rate,
            "gst_amount": tax_amount_report,
            "total_amount": net_amount_report,
            "paid_amount": billing.get('paid_amount', 0),
            "balance": net_amount_report - billing.get('paid_amount', 0),
            "other_charges": report['financial_summary'].get('other_charges', 0)
        })

        report['updated_at'] = datetime.now().isoformat()
        billing_reports[report_index] = report
        write_data('billing_reports.json', billing_reports)

    return jsonify({
        "data": {
            "data": billing
        },
        "success": True
    }), 200



    data = request.get_json()
    new_tests = data.get('test_items', [])

    if not new_tests:
        return jsonify({"success": False, "message": "No test items provided"}), 400

    # Load billings
    billings = read_data('billings.json')
    billing_index = next((i for i, b in enumerate(billings) if b['id'] == id), None)
    if billing_index is None:
        return jsonify({"success": False, "message": "Billing not found"}), 404

    billing = billings[billing_index]

    # Ensure arrays exist
    billing.setdefault('test_items', [])
    billing.setdefault('items', [])

    # Generate next test id
    existing_ids = [t.get('id', 0) for t in billing['test_items']]
    next_test_id = max(existing_ids) + 1 if existing_ids else 1

    # Add new tests to billing
    for test in new_tests:
        billing['test_items'].append({
            "id": next_test_id,
            "name": test.get("name", "Unknown Test"),
            "amount": test.get("amount", 0),
            "status": "Pending"
        })
        billing['items'].append({
            "amount": test.get("amount", 0),
            "description": test.get("name", ""),
            "display_name": test.get("name", ""),
            "id": int(datetime.now().timestamp() * 1000) + next_test_id,
            "price": test.get("amount", 0),
            "quantity": 1,
            "test_id": test.get("test_id"),
            "test_name": test.get("name", ""),
            "unit_price": test.get("amount", 0),
            "total": test.get("amount", 0),
            "status": "Pending",
            "test_master_data": test.get("selectedTestData", {})
        })
        next_test_id += 1

    # Recalculate billing totals
    subtotal = sum(safe_float(item.get('amount', 0)) for item in billing['test_items'])
    discount = safe_float(billing.get('discount', 0))
    tax_rate = safe_float(billing.get('gst_rate', billing.get('tax_rate', 0)))
    tax_amount = (subtotal - discount) * (tax_rate / 100)
    net_amount = subtotal - discount + tax_amount

    billing['total_amount'] = subtotal
    billing['tax_amount'] = tax_amount
    billing['net_amount'] = net_amount
    billing['balance'] = net_amount - safe_float(billing.get('paid_amount', 0))
    billing['updated_at'] = datetime.now().isoformat()

    # Save billings
    billings[billing_index] = billing
    write_data('billings.json', billings)

    # Update billing reports
    billing_reports = read_data('billing_reports.json')
    report_index = next((i for i, r in enumerate(billing_reports) if r.get('billing_id') == id), None)
    if report_index is not None:
        report = billing_reports[report_index]
        report.setdefault('test_items', [])
        report.setdefault('financial_summary', {})

        # Add new tests to report
        existing_report_ids = [t.get('id', 0) for t in report['test_items']]
        current_id_base = max(existing_report_ids, default=0) + 1

        for idx, test in enumerate(new_tests):
            report['test_items'].append({
                "id": current_id_base + idx,
                "test_name": test.get('name', ''),
                "amount": test.get('amount', 0),
                "price": test.get('amount', 0),
                "quantity": 1,
                "sample_received": False,
                "sample_received_timestamp": None,
                "sample_status": "Not Received",
                "test_master_data": test.get('selectedTestData', {})
            })

        # Recalculate financial summary
        subtotal_report = sum(safe_float(item.get('amount', 0)) for item in report['test_items'])
        tax_amount_report = (subtotal_report - discount) * (tax_rate / 100)
        net_amount_report = subtotal_report - discount + tax_amount_report

        report['financial_summary'].update({
            "bill_amount": subtotal_report,
            "subtotal": subtotal_report,
            "discount_amount": discount,
            "discount_percent": 0,
            "gst_rate": tax_rate,
            "gst_amount": tax_amount_report,
            "total_amount": net_amount_report,
            "paid_amount": safe_float(billing.get('paid_amount', 0)),
            "balance": net_amount_report - safe_float(billing.get('paid_amount', 0)),
            "other_charges": safe_float(report['financial_summary'].get('other_charges', 0))
        })

        report['updated_at'] = datetime.now().isoformat()
        billing_reports[report_index] = report
        write_data('billing_reports.json', billing_reports)

    # Return in the exact structure required
    return jsonify({
        "data": {
            "data": billing
        },
        "success": True
    }), 200

    data = request.get_json()
    new_tests = data.get('test_items', [])

    if not new_tests:
        return jsonify({"message": "No test items provided"}), 400

    billings = read_data('billings.json')

    # Find billing by ID
    billing_index = next((i for i, b in enumerate(billings) if b['id'] == id), None)
    if billing_index is None:
        return jsonify({"message": "Billing not found"}), 404

    billing = billings[billing_index]

    # Initialize arrays if missing
    if 'test_items' not in billing:
        billing['test_items'] = []
    if 'items' not in billing:
        billing['items'] = []

    existing_ids = [t.get('id', 0) for t in billing['test_items']]
    next_test_id = max(existing_ids) + 1 if existing_ids else 1

    # Add new tests to billing
    for test in new_tests:
        billing['test_items'].append({
            "id": next_test_id,
            "name": test.get("name", "Unknown Test"),
            "amount": test.get("amount", 0),
            "status": "Pending"
        })
        billing['items'].append({
            "amount": test.get("amount", 0),
            "description": test.get("name", ""),
            "display_name": test.get("name", ""),
            "id": int(datetime.now().timestamp() * 1000) + next_test_id,  # Unique id per item
            "price": test.get("amount", 0),
            "quantity": 1,
            "test_id": test.get("test_id"),
            "test_name": test.get("name", ""),
            "unit_price": test.get("amount", 0),
            "total": test.get("amount", 0),
            "status": "Pending",
            "test_master_data": test.get("selectedTestData", {})
        })
        next_test_id += 1

    # Recalculate totals for billing
    subtotal = sum(safe_float(item.get('amount', 0)) for item in billing['test_items'])
    discount = safe_float(billing.get('discount', 0))
    tax_rate = safe_float(billing.get('gst_rate', billing.get('tax_rate', 0)))  # default 0 if none
    tax_amount = (subtotal - discount) * (tax_rate / 100)
    net_amount = subtotal - discount + tax_amount

    billing['total_amount'] = subtotal
    billing['tax_amount'] = tax_amount
    billing['net_amount'] = net_amount
    billing['balance'] = net_amount - safe_float(billing.get('paid_amount', 0))
    billing['updated_at'] = datetime.now().isoformat()

    billings[billing_index] = billing
    write_data('billings.json', billings)

    # Update billing report
    billing_reports = read_data('billing_reports.json')
    report_index = next((i for i, r in enumerate(billing_reports) if r.get('billing_id') == id), None)
    if report_index is not None:
        report = billing_reports[report_index]

        existing_report_tests = report.get('test_items', [])

        # Prepare new tests for report (from just new_tests)
        new_report_tests = []
        current_id_base = max([t.get('id', 0) for t in existing_report_tests], default=0) + 1
        for idx, test in enumerate(new_tests):
            new_report_tests.append({
                "id": current_id_base + idx,
                "test_name": test.get('name', ''),
                "amount": test.get('amount', 0),
                "price": test.get('amount', 0),
                "quantity": 1,
                "sample_received": False,
                "sample_received_timestamp": None,
                "sample_status": "Not Received",
                "test_master_data": test.get('selectedTestData', {})
            })

        # Append new tests to existing report tests
        report['test_items'] = existing_report_tests + new_report_tests

        # Recalculate financial summary for report
        subtotal_report = sum(safe_float(item.get('amount', 0)) for item in report['test_items'])
        discount_report = safe_float(billing.get('discount', 0))
        tax_rate_report = safe_float(billing.get('gst_rate', billing.get('tax_rate', 0)))
        tax_amount_report = (subtotal_report - discount_report) * (tax_rate_report / 100)
        net_amount_report = subtotal_report - discount_report + tax_amount_report

        if 'financial_summary' not in report:
            report['financial_summary'] = {}

        report['financial_summary'].update({
            "bill_amount": subtotal_report,
            "discount_amount": discount_report,
            "discount_percent": 0,
            "gst_rate": tax_rate_report,
            "gst_amount": tax_amount_report,
            "total_amount": net_amount_report,
            "paid_amount": billing.get('paid_amount', 0),
            "balance": net_amount_report - billing.get('paid_amount', 0),
            "other_charges": report['financial_summary'].get('other_charges', 0)
        })

        report['updated_at'] = datetime.now().isoformat()

        billing_reports[report_index] = report
        write_data('billing_reports.json', billing_reports)

        return jsonify({
        "message": "Test(s) added successfully",
        "success": True,
        "billing": billing
      }), 200
    data = request.get_json()
    new_tests = data.get('test_items', [])

    if not new_tests:
        return jsonify({"message": "No test items provided"}), 400

    billings = read_data('billings.json')

    # Find billing by ID
    billing_index = next((i for i, b in enumerate(billings) if b['id'] == id), None)
    if billing_index is None:
        return jsonify({"message": "Billing not found"}), 404

    billing = billings[billing_index]

    # Initialize arrays if missing
    if 'test_items' not in billing:
        billing['test_items'] = []
    if 'items' not in billing:
        billing['items'] = []

    existing_ids = [t.get('id', 0) for t in billing['test_items']]
    next_test_id = max(existing_ids) + 1 if existing_ids else 1

    for test in new_tests:
        billing['test_items'].append({
            "id": next_test_id,
            "name": test.get("name", "Unknown Test"),
            "amount": test.get("amount", 0),
            "status": "Pending"
        })
        billing['items'].append({
            "amount": test.get("amount", 0),
            "description": test.get("name", ""),
            "display_name": test.get("name", ""),
            "id": int(datetime.now().timestamp() * 1000),
            "price": test.get("amount", 0),
            "quantity": 1,
            "test_id": test.get("test_id"),
            "test_name": test.get("name", ""),
            "unit_price": test.get("amount", 0),
            "total": test.get("amount", 0),
            "status": "Pending",
            "test_master_data": test.get("selectedTestData", {})
        })
        next_test_id += 1

    # Recalculate totals
    subtotal = sum(safe_float(item.get('amount', 0)) for item in billing['test_items'])
    discount = safe_float(billing.get('discount', 0))
    tax_rate = safe_float(billing.get('gst_rate', billing.get('tax_rate', 0)))  # default 0 if none
    tax_amount = (subtotal - discount) * (tax_rate / 100)
    net_amount = subtotal - discount + tax_amount

    billing['total_amount'] = subtotal
    billing['tax_amount'] = tax_amount
    billing['net_amount'] = net_amount
    billing['balance'] = net_amount - safe_float(billing.get('paid_amount', 0))
    billing['updated_at'] = datetime.now().isoformat()

    billings[billing_index] = billing
    write_data('billings.json', billings)

    billing_reports = read_data('billing_reports.json')
    report_index = next((i for i, r in enumerate(billing_reports) if r.get('billing_id') == id), None)
    if report_index is not None:
        report = billing_reports[report_index]

        # Update only test_items
        report['test_items'] = [
            {
                "test_name": item.get('test_name'),
                "quantity": item.get('quantity', 1),
                "price": item.get('unit_price'),
                "amount": item.get('total'),
                "id": item.get('id'),
                "test_master_data": item.get('test_master_data', {}),
            }
            for item in billing.get('items', [])
        ]

        # Update financial_summary
        if 'financial_summary' not in report:
            report['financial_summary'] = {}

        report['financial_summary'].update({
            "bill_amount": subtotal,
            "subtotal": subtotal,
            "discount_amount": discount,
            "gst_rate": tax_rate,
            "gst_amount": tax_amount,
            "total_amount": net_amount,
            "paid_amount": billing.get('paid_amount', 0),
            "balance": net_amount - billing.get('paid_amount', 0)
        })

        report['updated_at'] = datetime.now().isoformat()

        billing_reports[report_index] = report
        write_data('billing_reports.json', billing_reports)

    return jsonify({
        "message": "Test(s) added successfully",
        "success": True,
        "billing": billing
    }), 200