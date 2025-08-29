import React, { useState } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxes, faExclamationTriangle, faPlus, faEye, faEdit,
  faWarehouse, faShoppingCart, faTruck, faChartLine
} from '@fortawesome/free-solid-svg-icons';

const InventorySection = ({ data, userRole }) => {
  const [filter, setFilter] = useState('all');

  // Mock inventory data - replace with actual API call
  const inventoryItems = [
    {
      id: 1,
      name: 'Blood Collection Tubes',
      sku: 'BCT-001',
      category: 'Consumables',
      quantity: 150,
      reorder_level: 100,
      unit: 'pieces',
      cost_price: 5.50,
      supplier: 'MedSupply Co.',
      expiry_date: '2024-12-31'
    },
    {
      id: 2,
      name: 'Reagent Kit A',
      sku: 'RK-A-001',
      category: 'Reagents',
      quantity: 25,
      reorder_level: 50,
      unit: 'kits',
      cost_price: 450.00,
      supplier: 'LabChem Ltd.',
      expiry_date: '2024-06-30'
    },
    {
      id: 3,
      name: 'Disposable Gloves',
      sku: 'DG-001',
      category: 'Safety',
      quantity: 0,
      reorder_level: 200,
      unit: 'boxes',
      cost_price: 25.00,
      supplier: 'SafetyFirst Inc.',
      expiry_date: '2025-03-15'
    }
  ];

  // Filter items based on stock status
  const getFilteredItems = () => {
    switch (filter) {
      case 'low_stock':
        return inventoryItems.filter(item => 
          item.quantity > 0 && item.quantity <= item.reorder_level
        );
      case 'out_of_stock':
        return inventoryItems.filter(item => item.quantity === 0);
      case 'expiring_soon':
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return inventoryItems.filter(item => 
          new Date(item.expiry_date) <= thirtyDaysFromNow
        );
      default:
        return inventoryItems;
    }
  };

  const getStockStatus = (item) => {
    if (item.quantity === 0) {
      return { variant: 'danger', text: 'Out of Stock', icon: faExclamationTriangle };
    } else if (item.quantity <= item.reorder_level) {
      return { variant: 'warning', text: 'Low Stock', icon: faExclamationTriangle };
    } else {
      return { variant: 'success', text: 'In Stock', icon: null };
    }
  };

  const getStockPercentage = (item) => {
    const maxStock = item.reorder_level * 2; // Assume max stock is 2x reorder level
    return Math.min((item.quantity / maxStock) * 100, 100);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const lowStockCount = inventoryItems.filter(item => 
    item.quantity > 0 && item.quantity <= item.reorder_level
  ).length;

  const outOfStockCount = inventoryItems.filter(item => item.quantity === 0).length;

  const expiringCount = inventoryItems.filter(item => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return new Date(item.expiry_date) <= thirtyDaysFromNow;
  }).length;

  return (
    <div className="inventory-section p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">
            <FontAwesomeIcon icon={faBoxes} className="me-2 text-primary" />
            Inventory Management
          </h4>
          <p className="text-muted mb-0">
            Stock levels, supply tracking, and equipment management
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm">
            <FontAwesomeIcon icon={faChartLine} className="me-1" />
            Analytics
          </Button>
          <Button variant="primary" size="sm">
            <FontAwesomeIcon icon={faPlus} className="me-1" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Alert for Critical Items */}
      {(outOfStockCount > 0 || lowStockCount > 0) && (
        <Alert variant="warning" className="mb-4">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          <strong>Inventory Alert:</strong> {outOfStockCount} items out of stock, {lowStockCount} items low on stock.
          Immediate attention required!
        </Alert>
      )}

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="text-center border-primary">
            <Card.Body>
              <FontAwesomeIcon icon={faWarehouse} size="2x" className="text-primary mb-2" />
              <h3 className="text-primary">{data?.overview?.total_inventory_items || inventoryItems.length}</h3>
              <p className="mb-0 text-muted">Total Items</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center border-danger">
            <Card.Body>
              <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="text-danger mb-2" />
              <h3 className="text-danger">{outOfStockCount}</h3>
              <p className="mb-0 text-muted">Out of Stock</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center border-warning">
            <Card.Body>
              <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="text-warning mb-2" />
              <h3 className="text-warning">{lowStockCount}</h3>
              <p className="mb-0 text-muted">Low Stock</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center border-info">
            <Card.Body>
              <FontAwesomeIcon icon={faTruck} size="2x" className="text-info mb-2" />
              <h3 className="text-info">{expiringCount}</h3>
              <p className="mb-0 text-muted">Expiring Soon</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filter Buttons */}
      <div className="mb-4">
        <div className="btn-group" role="group">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline-primary'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Items ({inventoryItems.length})
          </Button>
          <Button
            variant={filter === 'low_stock' ? 'warning' : 'outline-warning'}
            size="sm"
            onClick={() => setFilter('low_stock')}
          >
            Low Stock ({lowStockCount})
          </Button>
          <Button
            variant={filter === 'out_of_stock' ? 'danger' : 'outline-danger'}
            size="sm"
            onClick={() => setFilter('out_of_stock')}
          >
            Out of Stock ({outOfStockCount})
          </Button>
          <Button
            variant={filter === 'expiring_soon' ? 'info' : 'outline-info'}
            size="sm"
            onClick={() => setFilter('expiring_soon')}
          >
            Expiring Soon ({expiringCount})
          </Button>
        </div>
      </div>

      {/* Inventory Table */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <h6 className="mb-0 text-black">
            <FontAwesomeIcon icon={faBoxes} className="me-2" />
            Inventory Items
          </h6>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table className="table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className='text-black'>Item</th>
                  <th className='text-black'>Category</th>
                  <th className='text-black'>Stock Level</th>
                  <th className='text-black'>Status</th>
                  <th className='text-black'>Supplier</th>
                  <th className='text-black'>Expiry</th>
                  <th className='text-black'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredItems().map((item) => {
                  const status = getStockStatus(item);
                  const stockPercentage = getStockPercentage(item);
                  
                  return (
                    <tr key={item.id}>
                      <td>
                        <div>
                          <strong>{item.name}</strong>
                          <div className="text-muted small">SKU: {item.sku}</div>
                        </div>
                      </td>
                      <td>
                        <Badge bg="secondary">{item.category}</Badge>
                      </td>
                      <td>
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span>{item.quantity} {item.unit}</span>
                            <small className="text-muted">
                              Reorder: {item.reorder_level}
                            </small>
                          </div>
                          <ProgressBar 
                            now={stockPercentage} 
                            variant={
                              item.quantity === 0 ? 'danger' : 
                              item.quantity <= item.reorder_level ? 'warning' : 'success'
                            }
                            style={{ height: '4px' }}
                          />
                        </div>
                      </td>
                      <td>
                        <Badge bg={status.variant}>
                          {status.icon && <FontAwesomeIcon icon={status.icon} className="me-1" />}
                          {status.text}
                        </Badge>
                      </td>
                      <td>
                        <small>{item.supplier}</small>
                      </td>
                      <td>
                        <div>
                          {new Date(item.expiry_date).toLocaleDateString()}
                          {new Date(item.expiry_date) <= new Date(Date.now() + 30*24*60*60*1000) && (
                            <div>
                              <Badge bg="warning" className="mt-1">
                                Expiring Soon
                              </Badge>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            title="View Details"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </Button>
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            title="Edit Item"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            title="Reorder"
                            disabled={item.quantity > item.reorder_level}
                          >
                            <FontAwesomeIcon icon={faShoppingCart} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Quick Actions */}
      <Row className="mt-4">
        <Col xs={12}>
          <Card className="bg-light">
            <Card.Body>
              <h6 className="mb-3">Quick Actions</h6>
              <Row>
                <Col md={3} className="mb-2">
                  <Button variant="primary" size="sm" className="w-100">
                    <FontAwesomeIcon icon={faPlus} className="me-1" />
                    Add New Item
                  </Button>
                </Col>
                <Col md={3} className="mb-2">
                  <Button variant="warning" size="sm" className="w-100">
                    <FontAwesomeIcon icon={faShoppingCart} className="me-1" />
                    Bulk Reorder
                  </Button>
                </Col>
                <Col md={3} className="mb-2">
                  <Button variant="info" size="sm" className="w-100">
                    <FontAwesomeIcon icon={faChartLine} className="me-1" />
                    Usage Report
                  </Button>
                </Col>
                <Col md={3} className="mb-2">
                  <Button variant="success" size="sm" className="w-100">
                    <FontAwesomeIcon icon={faTruck} className="me-1" />
                    Receive Stock
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default InventorySection;
