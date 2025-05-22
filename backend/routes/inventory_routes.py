from flask import Blueprint, jsonify, request
from datetime import datetime
import uuid
import json
import os
from functools import wraps

# Import utilities
from utils import token_required, read_data, write_data, paginate_results, filter_data_by_tenant, check_tenant_access

inventory_bp = Blueprint('inventory', __name__)

# Inventory Routes
@inventory_bp.route('/api/inventory', methods=['GET'])
@token_required
def get_inventory_items():
    inventory = read_data('inventory.json')

    # Apply tenant-based filtering
    inventory = filter_data_by_tenant(inventory, request.current_user)

    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)

    # Filter by category if provided
    category = request.args.get('category')
    if category:
        inventory = [i for i in inventory if i.get('category') == category]

    # Filter by low stock if provided
    low_stock = request.args.get('low_stock')
    if low_stock == 'true':
        inventory = [i for i in inventory if i.get('quantity', 0) <= i.get('reorder_level', 0)]

    # Sort by name
    inventory = sorted(inventory, key=lambda x: x.get('name', ''))

    # Paginate results
    paginated_data = paginate_results(inventory, page, per_page)

    return jsonify(paginated_data)

@inventory_bp.route('/api/inventory/<int:id>', methods=['GET'])
@token_required
def get_inventory_item(id):
    inventory = read_data('inventory.json')
    item = next((i for i in inventory if i['id'] == id), None)

    if not item:
        return jsonify({'message': 'Inventory item not found'}), 404

    return jsonify(item)

@inventory_bp.route('/api/inventory', methods=['POST'])
@token_required
def create_inventory_item():
    data = request.get_json()

    # Validate required fields
    required_fields = ['name', 'sku', 'category', 'quantity', 'unit', 'reorder_level']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    inventory = read_data('inventory.json')

    # Check if SKU already exists
    if any(i.get('sku') == data['sku'] for i in inventory):
        return jsonify({'message': 'SKU already exists'}), 400

    # Generate new inventory item ID
    new_id = 1
    if inventory:
        new_id = max(i['id'] for i in inventory) + 1

    # Create new inventory item
    new_item = {
        'id': new_id,
        'name': data['name'],
        'sku': data['sku'],
        'category': data['category'],
        'description': data.get('description', ''),
        'quantity': int(data['quantity']),
        'unit': data['unit'],
        'reorder_level': int(data['reorder_level']),
        'cost_price': float(data.get('cost_price', 0)),
        'selling_price': float(data.get('selling_price', 0)),
        'supplier': data.get('supplier', ''),
        'location': data.get('location', ''),
        'expiry_date': data.get('expiry_date'),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': request.current_user.get('id')
    }

    inventory.append(new_item)
    write_data('inventory.json', inventory)

    return jsonify(new_item), 201

@inventory_bp.route('/api/inventory/<int:id>', methods=['PUT'])
@token_required
def update_inventory_item(id):
    data = request.get_json()

    inventory = read_data('inventory.json')
    item_index = next((i for i, item in enumerate(inventory) if item['id'] == id), None)

    if item_index is None:
        return jsonify({'message': 'Inventory item not found'}), 404

    # Update inventory item
    item = inventory[item_index]

    # Update fields
    updatable_fields = ['name', 'category', 'description', 'quantity', 'unit',
                       'reorder_level', 'cost_price', 'selling_price', 'supplier',
                       'location', 'expiry_date']

    for field in updatable_fields:
        if field in data:
            if field in ['quantity', 'reorder_level']:
                item[field] = int(data[field])
            elif field in ['cost_price', 'selling_price']:
                item[field] = float(data[field])
            else:
                item[field] = data[field]

    # Check if SKU is being updated and doesn't conflict
    if 'sku' in data and data['sku'] != item['sku']:
        if any(i.get('sku') == data['sku'] for i in inventory if i['id'] != id):
            return jsonify({'message': 'SKU already exists'}), 400
        item['sku'] = data['sku']

    item['updated_at'] = datetime.now().isoformat()

    inventory[item_index] = item
    write_data('inventory.json', inventory)

    return jsonify(item)

@inventory_bp.route('/api/inventory/<int:id>', methods=['DELETE'])
@token_required
def delete_inventory_item(id):
    inventory = read_data('inventory.json')
    item_index = next((i for i, item in enumerate(inventory) if item['id'] == id), None)

    if item_index is None:
        return jsonify({'message': 'Inventory item not found'}), 404

    deleted_item = inventory.pop(item_index)
    write_data('inventory.json', inventory)

    return jsonify({'message': 'Inventory item deleted successfully', 'item': deleted_item})

@inventory_bp.route('/api/inventory/search', methods=['GET'])
@token_required
def search_inventory_items():
    query = request.args.get('q', '').lower()

    if not query:
        return jsonify({'items': [], 'total_items': 0})

    inventory = read_data('inventory.json')

    # Search in name, sku, category, and description
    filtered_items = []
    for item in inventory:
        if (query in item.get('name', '').lower() or
            query in item.get('sku', '').lower() or
            query in item.get('category', '').lower() or
            query in item.get('description', '').lower()):
            filtered_items.append(item)

    return jsonify({
        'items': filtered_items,
        'total_items': len(filtered_items)
    })

@inventory_bp.route('/api/inventory/low-stock', methods=['GET'])
@token_required
def get_low_stock_items():
    inventory = read_data('inventory.json')

    # Filter items where quantity <= reorder_level
    low_stock_items = [
        item for item in inventory
        if item.get('quantity', 0) <= item.get('reorder_level', 0)
    ]

    return jsonify({
        'items': low_stock_items,
        'total_items': len(low_stock_items)
    })

@inventory_bp.route('/api/inventory/<int:item_id>/transactions', methods=['GET'])
@token_required
def get_inventory_transactions(item_id):
    # For now, return empty transactions as this would require a separate transactions table
    return jsonify({
        'transactions': [],
        'total_transactions': 0
    })

@inventory_bp.route('/api/inventory/<int:item_id>/transactions', methods=['POST'])
@token_required
def add_inventory_transaction(item_id):
    data = request.get_json()

    # Validate required fields
    required_fields = ['type', 'quantity', 'reason']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    inventory = read_data('inventory.json')
    item_index = next((i for i, item in enumerate(inventory) if item['id'] == item_id), None)

    if item_index is None:
        return jsonify({'message': 'Inventory item not found'}), 404

    item = inventory[item_index]
    transaction_type = data['type']  # 'in' or 'out'
    quantity = int(data['quantity'])

    # Update inventory quantity
    if transaction_type == 'in':
        item['quantity'] += quantity
    elif transaction_type == 'out':
        if item['quantity'] < quantity:
            return jsonify({'message': 'Insufficient stock'}), 400
        item['quantity'] -= quantity
    else:
        return jsonify({'message': 'Invalid transaction type. Use "in" or "out"'}), 400

    item['updated_at'] = datetime.now().isoformat()

    inventory[item_index] = item
    write_data('inventory.json', inventory)

    # Create transaction record (simplified)
    transaction = {
        'id': len(inventory) + 1,  # Simple ID generation
        'item_id': item_id,
        'type': transaction_type,
        'quantity': quantity,
        'reason': data['reason'],
        'notes': data.get('notes', ''),
        'created_at': datetime.now().isoformat(),
        'created_by': request.current_user.get('id')
    }

    return jsonify({
        'message': 'Transaction completed successfully',
        'transaction': transaction,
        'updated_item': item
    })
