from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
from utils import token_required, read_data, write_data, check_tenant_access
import uuid

invoice_bp = Blueprint('invoice', __name__)

def generate_invoice_number():
    """Generate a unique invoice number in format INV-YYYYMMDD-XXXX"""
    today = datetime.now()
    date_str = today.strftime('%Y%m%d')

    # Get existing invoices to find the next sequence number
    invoices = read_data('invoices.json')
    today_invoices = [inv for inv in invoices if inv.get('invoice_number', '').startswith(f'INV-{date_str}')]

    if today_invoices:
        # Extract sequence numbers and find the max
        sequence_numbers = []
        for inv in today_invoices:
            try:
                seq = int(inv['invoice_number'].split('-')[-1])
                sequence_numbers.append(seq)
            except (ValueError, IndexError):
                continue
        next_seq = max(sequence_numbers) + 1 if sequence_numbers else 1
    else:
        next_seq = 1

    return f'INV-{date_str}-{next_seq:04d}'

def create_automatic_invoice(routing, created_by_user_id):
    """Create an automatic draft invoice when a routing is created"""
    try:
        invoices = read_data('invoices.json')

        # Generate new invoice ID
        new_id = 1
        if invoices:
            new_id = max(inv['id'] for inv in invoices) + 1

        # Create default line items for sample processing
        default_line_items = [
            {
                'description': 'Sample Processing Fee',
                'quantity': 1,
                'unit_price': 500.0,
                'total': 500.0
            },
            {
                'description': 'Laboratory Analysis',
                'quantity': 1,
                'unit_price': 300.0,
                'total': 300.0
            }
        ]

        # Calculate totals
        subtotal = sum(item['total'] for item in default_line_items)
        tax_rate = 0.18  # 18% GST
        tax_amount = subtotal * tax_rate
        total_amount = subtotal + tax_amount

        # Create new invoice owned by source franchise initially
        new_invoice = {
            'id': new_id,
            'invoice_number': generate_invoice_number(),
            'routing_id': routing['id'],
            'sample_id': routing.get('sample_id'),
            'from_tenant_id': routing.get('from_tenant_id'),
            'to_tenant_id': routing.get('to_tenant_id'),
            'created_by': created_by_user_id,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'invoice_date': datetime.now().strftime('%Y-%m-%d'),
            'due_date': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
            'status': 'draft',
            'subtotal': round(subtotal, 2),
            'tax_rate': tax_rate,
            'tax_amount': round(tax_amount, 2),
            'total_amount': round(total_amount, 2),
            'currency': 'INR',
            'notes': 'Automatically generated invoice for sample routing',
            'line_items': default_line_items,
            'ownership_transferred': False,  # Track if ownership has been transferred
            'original_owner': routing.get('from_tenant_id')  # Track original owner
        }

        invoices.append(new_invoice)
        write_data('invoices.json', invoices)

        return new_invoice
    except Exception as e:
        print(f"Warning: Failed to create automatic invoice for routing {routing['id']}: {e}")
        return None

def transfer_invoice_ownership(routing_id, user_id):
    """Transfer invoice ownership when routing is approved/received"""
    try:
        invoices = read_data('invoices.json')

        # Find invoices for this routing
        routing_invoices = [inv for inv in invoices if inv.get('routing_id') == routing_id]

        for invoice in routing_invoices:
            if not invoice.get('ownership_transferred', False):
                # Transfer ownership to destination tenant
                invoice['ownership_transferred'] = True
                invoice['ownership_transferred_at'] = datetime.now().isoformat()
                invoice['ownership_transferred_by'] = user_id
                invoice['updated_at'] = datetime.now().isoformat()

                # Update notes to reflect transfer
                if invoice.get('notes'):
                    invoice['notes'] += f"\n\nOwnership transferred to destination facility on {datetime.now().strftime('%Y-%m-%d')}"
                else:
                    invoice['notes'] = f"Ownership transferred to destination facility on {datetime.now().strftime('%Y-%m-%d')}"

        write_data('invoices.json', invoices)
        return True
    except Exception as e:
        print(f"Warning: Failed to transfer invoice ownership for routing {routing_id}: {e}")
        return False

@invoice_bp.route('/api/routing/<int:routing_id>/invoices', methods=['GET'])
@token_required
def get_routing_invoices(routing_id):
    """Get all invoices for a specific routing"""
    # Verify user has access to this routing
    routings = read_data('sample_routings.json')
    routing = next((r for r in routings if r['id'] == routing_id), None)
    
    if not routing:
        return jsonify({'message': 'Routing not found'}), 404
    
    user_tenant_id = request.current_user.get('tenant_id')
    user_role = request.current_user.get('role')
    
    # Check access permissions
    if (routing.get('from_tenant_id') != user_tenant_id and 
        routing.get('to_tenant_id') != user_tenant_id and
        user_role not in ['admin', 'hub_admin']):
        return jsonify({'message': 'Access denied'}), 403
    
    # Get all invoices for this routing
    invoices = read_data('invoices.json')
    routing_invoices = [inv for inv in invoices if inv.get('routing_id') == routing_id]
    
    # Filter based on role-based access control with ownership transfer logic
    filtered_invoices = []
    for invoice in routing_invoices:
        # Admin and hub_admin can see all invoices
        if user_role in ['admin', 'hub_admin']:
            filtered_invoices.append(invoice)
        # Check ownership transfer status
        elif invoice.get('ownership_transferred', False):
            # After ownership transfer: destination has full access, source has read-only
            if user_tenant_id == invoice.get('to_tenant_id'):
                filtered_invoices.append(invoice)
            elif user_tenant_id == invoice.get('from_tenant_id'):
                # Source franchise gets read-only access after transfer
                filtered_invoices.append(invoice)
        else:
            # Before ownership transfer: source has full access, destination has read-only
            if user_tenant_id == invoice.get('from_tenant_id'):
                filtered_invoices.append(invoice)
            elif user_tenant_id == invoice.get('to_tenant_id'):
                # Destination can view but not edit before transfer
                filtered_invoices.append(invoice)
    
    return jsonify(filtered_invoices)

@invoice_bp.route('/api/routing/<int:routing_id>/invoices', methods=['POST'])
@token_required
def create_routing_invoice(routing_id):
    """Create a new invoice for a routing"""
    data = request.get_json()
    
    # Verify user has access to this routing
    routings = read_data('sample_routings.json')
    routing = next((r for r in routings if r['id'] == routing_id), None)
    
    if not routing:
        return jsonify({'message': 'Routing not found'}), 404
    
    user_tenant_id = request.current_user.get('tenant_id')
    user_role = request.current_user.get('role')
    user_id = request.current_user.get('id')
    
    # Check if user can create invoices based on ownership transfer status
    # Before transfer: source franchise can create invoices
    # After transfer: destination franchise can create invoices
    can_create = False
    if user_role in ['admin', 'hub_admin']:
        can_create = True
    else:
        # Check existing invoices for this routing to determine ownership status
        existing_invoices = read_data('invoices.json')
        routing_invoices = [inv for inv in existing_invoices if inv.get('routing_id') == routing_id]

        if routing_invoices:
            # Check if ownership has been transferred
            ownership_transferred = any(inv.get('ownership_transferred', False) for inv in routing_invoices)
            if ownership_transferred:
                # After transfer: only destination can create new invoices
                can_create = user_tenant_id == routing.get('to_tenant_id')
            else:
                # Before transfer: only source can create invoices
                can_create = user_tenant_id == routing.get('from_tenant_id')
        else:
            # No existing invoices: source franchise can create
            can_create = user_tenant_id == routing.get('from_tenant_id')

    if not can_create:
        return jsonify({'message': 'You do not have permission to create invoices for this routing'}), 403
    
    # Validate required fields
    required_fields = ['line_items']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    # Validate line items
    line_items = data.get('line_items', [])
    if not line_items:
        return jsonify({'message': 'At least one line item is required'}), 400
    
    for item in line_items:
        if not all(key in item for key in ['description', 'quantity', 'unit_price']):
            return jsonify({'message': 'Each line item must have description, quantity, and unit_price'}), 400
    
    # Calculate totals
    subtotal = sum(float(item['quantity']) * float(item['unit_price']) for item in line_items)
    tax_rate = data.get('tax_rate', 0.18)  # Default 18% GST
    tax_amount = subtotal * tax_rate
    total_amount = subtotal + tax_amount
    
    # Add calculated total to each line item
    for item in line_items:
        item['total'] = float(item['quantity']) * float(item['unit_price'])
    
    invoices = read_data('invoices.json')
    
    # Generate new invoice ID
    new_id = 1
    if invoices:
        new_id = max(inv['id'] for inv in invoices) + 1
    
    # Create new invoice
    new_invoice = {
        'id': new_id,
        'invoice_number': generate_invoice_number(),
        'routing_id': routing_id,
        'sample_id': routing.get('sample_id'),
        'from_tenant_id': routing.get('from_tenant_id'),
        'to_tenant_id': routing.get('to_tenant_id'),
        'created_by': user_id,
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'invoice_date': data.get('invoice_date', datetime.now().strftime('%Y-%m-%d')),
        'due_date': data.get('due_date', (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')),
        'status': 'draft',
        'subtotal': round(subtotal, 2),
        'tax_rate': tax_rate,
        'tax_amount': round(tax_amount, 2),
        'total_amount': round(total_amount, 2),
        'currency': data.get('currency', 'INR'),
        'notes': data.get('notes', ''),
        'line_items': line_items
    }
    
    invoices.append(new_invoice)
    write_data('invoices.json', invoices)
    
    return jsonify(new_invoice), 201

@invoice_bp.route('/api/invoices/<int:invoice_id>', methods=['GET'])
@token_required
def get_invoice_by_id(invoice_id):
    """Get a specific invoice by ID"""
    invoices = read_data('invoices.json')
    invoice = next((inv for inv in invoices if inv['id'] == invoice_id), None)
    
    if not invoice:
        return jsonify({'message': 'Invoice not found'}), 404
    
    user_tenant_id = request.current_user.get('tenant_id')
    user_role = request.current_user.get('role')
    
    # Check access permissions
    if (user_role not in ['admin', 'hub_admin'] and
        user_tenant_id != invoice.get('from_tenant_id') and
        user_tenant_id != invoice.get('to_tenant_id')):
        return jsonify({'message': 'Access denied'}), 403
    
    return jsonify(invoice)

@invoice_bp.route('/api/invoices/<int:invoice_id>', methods=['PUT'])
@token_required
def update_invoice(invoice_id):
    """Update an invoice (role-restricted)"""
    data = request.get_json()
    
    invoices = read_data('invoices.json')
    invoice_index = next((i for i, inv in enumerate(invoices) if inv['id'] == invoice_id), None)
    
    if invoice_index is None:
        return jsonify({'message': 'Invoice not found'}), 404
    
    invoice = invoices[invoice_index]
    user_tenant_id = request.current_user.get('tenant_id')
    user_role = request.current_user.get('role')
    
    # Check edit permissions based on ownership transfer status
    can_edit = False
    if user_role in ['admin', 'hub_admin']:
        can_edit = True
    elif invoice.get('ownership_transferred', False):
        # After ownership transfer: only destination can edit
        can_edit = user_tenant_id == invoice.get('to_tenant_id')
    else:
        # Before ownership transfer: only source can edit
        can_edit = user_tenant_id == invoice.get('from_tenant_id')

    if not can_edit:
        return jsonify({'message': 'You do not have permission to edit this invoice'}), 403

    # Check if routing is completed - no editing after completion
    routings = read_data('sample_routings.json')
    routing = next((r for r in routings if r['id'] == invoice.get('routing_id')), None)
    if routing and routing.get('status') == 'completed':
        return jsonify({'message': 'Cannot edit invoices for completed routings'}), 403
    
    # Don't allow editing of paid invoices
    if invoice.get('status') == 'paid':
        return jsonify({'message': 'Cannot edit paid invoices'}), 400
    
    # Update allowed fields
    updatable_fields = ['invoice_date', 'due_date', 'notes', 'line_items']
    for field in updatable_fields:
        if field in data:
            invoice[field] = data[field]
    
    # Recalculate totals if line items changed
    if 'line_items' in data:
        line_items = data['line_items']
        subtotal = sum(float(item['quantity']) * float(item['unit_price']) for item in line_items)
        tax_rate = invoice.get('tax_rate', 0.18)
        tax_amount = subtotal * tax_rate
        total_amount = subtotal + tax_amount
        
        # Add calculated total to each line item
        for item in line_items:
            item['total'] = float(item['quantity']) * float(item['unit_price'])
        
        invoice['subtotal'] = round(subtotal, 2)
        invoice['tax_amount'] = round(tax_amount, 2)
        invoice['total_amount'] = round(total_amount, 2)
    
    invoice['updated_at'] = datetime.now().isoformat()
    
    invoices[invoice_index] = invoice
    write_data('invoices.json', invoices)
    
    return jsonify(invoice)

@invoice_bp.route('/api/invoices/<int:invoice_id>', methods=['DELETE'])
@token_required
def delete_invoice(invoice_id):
    """Delete an invoice (role-restricted)"""
    invoices = read_data('invoices.json')
    invoice_index = next((i for i, inv in enumerate(invoices) if inv['id'] == invoice_id), None)
    
    if invoice_index is None:
        return jsonify({'message': 'Invoice not found'}), 404
    
    invoice = invoices[invoice_index]
    user_tenant_id = request.current_user.get('tenant_id')
    user_role = request.current_user.get('role')
    
    # Check delete permissions based on ownership transfer status
    can_delete = False
    if user_role in ['admin', 'hub_admin']:
        can_delete = True
    elif invoice.get('ownership_transferred', False):
        # After ownership transfer: only destination can delete
        can_delete = user_tenant_id == invoice.get('to_tenant_id')
    else:
        # Before ownership transfer: only source can delete
        can_delete = user_tenant_id == invoice.get('from_tenant_id')

    if not can_delete:
        return jsonify({'message': 'You do not have permission to delete this invoice'}), 403
    
    # Don't allow deletion of sent or paid invoices
    if invoice.get('status') in ['sent', 'paid']:
        return jsonify({'message': 'Cannot delete sent or paid invoices'}), 400
    
    invoices.pop(invoice_index)
    write_data('invoices.json', invoices)
    
    return jsonify({'message': 'Invoice deleted successfully'})

@invoice_bp.route('/api/invoices/<int:invoice_id>/status', methods=['POST'])
@token_required
def update_invoice_status(invoice_id):
    """Update invoice status"""
    data = request.get_json()
    new_status = data.get('status')
    
    if new_status not in ['draft', 'sent', 'paid', 'overdue', 'cancelled']:
        return jsonify({'message': 'Invalid status'}), 400
    
    invoices = read_data('invoices.json')
    invoice_index = next((i for i, inv in enumerate(invoices) if inv['id'] == invoice_id), None)
    
    if invoice_index is None:
        return jsonify({'message': 'Invoice not found'}), 404
    
    invoice = invoices[invoice_index]
    user_tenant_id = request.current_user.get('tenant_id')
    user_role = request.current_user.get('role')
    
    # Check permissions based on status change and ownership transfer
    can_change_status = False
    if user_role in ['admin', 'hub_admin']:
        can_change_status = True
    elif new_status in ['sent', 'cancelled']:
        # Check who can send/cancel based on ownership
        if invoice.get('ownership_transferred', False):
            # After transfer: destination can send/cancel
            can_change_status = user_tenant_id == invoice.get('to_tenant_id')
        else:
            # Before transfer: source can send/cancel
            can_change_status = user_tenant_id == invoice.get('from_tenant_id')
    elif new_status == 'paid':
        # Both source and destination can mark as paid
        can_change_status = (user_tenant_id == invoice.get('from_tenant_id') or
                           user_tenant_id == invoice.get('to_tenant_id'))

    if not can_change_status:
        return jsonify({'message': 'You do not have permission to change this invoice status'}), 403
    
    invoice['status'] = new_status
    invoice['updated_at'] = datetime.now().isoformat()
    
    invoices[invoice_index] = invoice
    write_data('invoices.json', invoices)

    return jsonify(invoice)

@invoice_bp.route('/api/invoices/<int:invoice_id>/pdf', methods=['GET'])
@token_required
def generate_invoice_pdf(invoice_id):
    """Generate PDF invoice (placeholder implementation)"""
    invoices = read_data('invoices.json')
    invoice = next((inv for inv in invoices if inv['id'] == invoice_id), None)

    if not invoice:
        return jsonify({'message': 'Invoice not found'}), 404

    user_tenant_id = request.current_user.get('tenant_id')
    user_role = request.current_user.get('role')

    # Check access permissions
    if (user_role not in ['admin', 'hub_admin'] and
        user_tenant_id != invoice.get('from_tenant_id') and
        user_tenant_id != invoice.get('to_tenant_id')):
        return jsonify({'message': 'Access denied'}), 403

    # For now, return a simple text response
    # In a real implementation, you would generate a PDF using libraries like reportlab
    pdf_content = f"""
INVOICE: {invoice['invoice_number']}
Date: {invoice['invoice_date']}
Due Date: {invoice['due_date']}
Status: {invoice['status']}

Line Items:
"""
    for item in invoice.get('line_items', []):
        pdf_content += f"- {item['description']}: {item['quantity']} x ₹{item['unit_price']} = ₹{item['total']}\n"

    pdf_content += f"""
Subtotal: ₹{invoice['subtotal']}
Tax: ₹{invoice['tax_amount']}
Total: ₹{invoice['total_amount']}
"""

    from flask import make_response
    response = make_response(pdf_content)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'attachment; filename="{invoice["invoice_number"]}.pdf"'

    return response
