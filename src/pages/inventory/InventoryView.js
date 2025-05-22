import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, Button, Table, Badge, Row, Col, Alert, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxes, faArrowLeft, faEdit, faExchangeAlt, faTrash,
  faPlus, faMinus, faHistory, faInfoCircle, faBarcode
} from '@fortawesome/free-solid-svg-icons';
import { inventoryAPI } from '../../services/api';
import {
  LineChart,
  DeleteConfirmationModal,
  SuccessModal,
  ErrorModal,
  FormModal
} from '../../components/common';
import '../../styles/InventoryView.css';

const InventoryView = () => {
  const { id } = useParams();

  // State for inventory item
  const [item, setItem] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [usageData, setUsageData] = useState({});

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [stockInAmount, setStockInAmount] = useState(0);
  const [stockOutAmount, setStockOutAmount] = useState(0);
  const [stockInReason, setStockInReason] = useState('Purchase');
  const [stockOutReason, setStockOutReason] = useState('Usage');

  // Fetch inventory item
  useEffect(() => {
    const fetchInventoryItem = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await inventoryAPI.getInventoryItemById(id);
        setItem(response.data);

        // Fetch transactions
        const transactionsResponse = await inventoryAPI.getInventoryTransactions(id);
        const transactionsData = transactionsResponse.data.transactions || transactionsResponse.data || [];
        setTransactions(transactionsData);

        // Generate usage data
        generateUsageData(transactionsData);
      } catch (err) {
        console.error('Error fetching inventory item:', err);
        setError('Failed to load inventory item. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryItem();
  }, [id]);

  // Generate usage data for chart
  const generateUsageData = (transactions) => {
    // Get last 6 months
    const months = [];
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push(date.toLocaleString('default', { month: 'short' }));
    }

    // Calculate usage for each month
    const usageByMonth = months.map(month => {
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return transactionDate.toLocaleString('default', { month: 'short' }) === month && t.type === 'out';
      });

      return monthTransactions.reduce((sum, t) => sum + t.quantity, 0);
    });

    // Create chart data
    const chartData = {
      labels: months,
      datasets: [
        {
          label: 'Monthly Usage',
          data: usageByMonth,
          borderColor: 'rgba(78, 115, 223, 1)',
          backgroundColor: 'rgba(78, 115, 223, 0.1)',
          fill: true,
          tension: 0.1
        }
      ]
    };

    setUsageData(chartData);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await inventoryAPI.deleteInventoryItem(id);
      setShowDeleteModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      setErrorMessage('Failed to delete inventory item. Please try again.');
      setShowDeleteModal(false);
      setShowErrorModal(true);
    }
  };

  // Handle stock in
  const handleStockIn = async () => {
    if (stockInAmount <= 0) {
      setErrorMessage('Please enter a valid quantity.');
      setShowErrorModal(true);
      return;
    }

    try {
      await inventoryAPI.addInventoryTransaction(id, {
        type: 'in',
        quantity: stockInAmount,
        reason: stockInReason,
        transaction_date: new Date().toISOString()
      });

      // Update item quantity
      setItem(prevItem => ({
        ...prevItem,
        quantity: prevItem.quantity + stockInAmount
      }));

      // Add transaction to list
      setTransactions(prevTransactions => [
        {
          id: Date.now(),
          type: 'in',
          quantity: stockInAmount,
          reason: stockInReason,
          transaction_date: new Date().toISOString()
        },
        ...prevTransactions
      ]);

      setShowStockInModal(false);
      setStockInAmount(0);
      setStockInReason('Purchase');
    } catch (err) {
      console.error('Error adding stock:', err);
      setErrorMessage('Failed to add stock. Please try again.');
      setShowErrorModal(true);
    }
  };

  // Handle stock out
  const handleStockOut = async () => {
    if (stockOutAmount <= 0) {
      setErrorMessage('Please enter a valid quantity.');
      setShowErrorModal(true);
      return;
    }

    if (stockOutAmount > item.quantity) {
      setErrorMessage('Cannot remove more than available quantity.');
      setShowErrorModal(true);
      return;
    }

    try {
      await inventoryAPI.addInventoryTransaction(id, {
        type: 'out',
        quantity: stockOutAmount,
        reason: stockOutReason,
        transaction_date: new Date().toISOString()
      });

      // Update item quantity
      setItem(prevItem => ({
        ...prevItem,
        quantity: prevItem.quantity - stockOutAmount
      }));

      // Add transaction to list
      setTransactions(prevTransactions => [
        {
          id: Date.now(),
          type: 'out',
          quantity: stockOutAmount,
          reason: stockOutReason,
          transaction_date: new Date().toISOString()
        },
        ...prevTransactions
      ]);

      setShowStockOutModal(false);
      setStockOutAmount(0);
      setStockOutReason('Usage');
    } catch (err) {
      console.error('Error removing stock:', err);
      setErrorMessage('Failed to remove stock. Please try again.');
      setShowErrorModal(true);
    }
  };

  // Get stock level badge variant
  const getStockLevelBadgeVariant = (quantity, reorderLevel) => {
    if (quantity <= 0) {
      return 'danger';
    } else if (quantity <= reorderLevel) {
      return 'warning';
    } else {
      return 'success';
    }
  };

  // Get stock level text
  const getStockLevelText = (quantity, reorderLevel) => {
    if (quantity <= 0) {
      return 'Out of Stock';
    } else if (quantity <= reorderLevel) {
      return 'Low Stock';
    } else {
      return 'In Stock';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading inventory item...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (!item) {
    return (
      <div className="alert alert-warning" role="alert">
        Inventory item not found.
      </div>
    );
  }

  return (
    <div className="inventory-view-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faBoxes} className="me-2" />
          Inventory Item Details
        </h1>
        <div>
          <Link to="/inventory" className="btn btn-secondary me-2">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to List
          </Link>
          <Link to={`/inventory/${id}/edit`} className="btn btn-primary me-2">
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Edit
          </Link>
          <Link to={`/inventory/${id}/transactions`} className="btn btn-info me-2">
            <FontAwesomeIcon icon={faExchangeAlt} className="me-2" />
            Transactions
          </Link>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            Delete
          </Button>
        </div>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Item Information</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="item-detail">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{item.name}</span>
                  </div>
                  <div className="item-detail">
                    <span className="detail-label">SKU:</span>
                    <span className="detail-value">
                      <FontAwesomeIcon icon={faBarcode} className="me-2" />
                      {item.sku}
                    </span>
                  </div>
                  <div className="item-detail">
                    <span className="detail-label">Category:</span>
                    <span className="detail-value">{item.category}</span>
                  </div>
                  <div className="item-detail">
                    <span className="detail-label">Supplier:</span>
                    <span className="detail-value">{item.supplier || 'N/A'}</span>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="item-detail">
                    <span className="detail-label">Current Quantity:</span>
                    <span className="detail-value">
                      <strong>{item.quantity}</strong> {item.unit}
                    </span>
                  </div>
                  <div className="item-detail">
                    <span className="detail-label">Reorder Level:</span>
                    <span className="detail-value">{item.reorder_level} {item.unit}</span>
                  </div>
                  <div className="item-detail">
                    <span className="detail-label">Stock Status:</span>
                    <span className="detail-value">
                      <Badge bg={getStockLevelBadgeVariant(item.quantity, item.reorder_level)}>
                        {getStockLevelText(item.quantity, item.reorder_level)}
                      </Badge>
                    </span>
                  </div>
                  <div className="item-detail">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{item.location || 'N/A'}</span>
                  </div>
                </Col>
              </Row>

              <div className="item-description mt-4">
                <h6 className="font-weight-bold">Description</h6>
                <p>{item.description || 'No description available.'}</p>
              </div>

              <div className="stock-actions mt-4">
                <Button
                  variant="success"
                  className="me-2"
                  onClick={() => setShowStockInModal(true)}
                >
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Add Stock
                </Button>
                <Button
                  variant="warning"
                  onClick={() => setShowStockOutModal(true)}
                  disabled={item.quantity <= 0}
                >
                  <FontAwesomeIcon icon={faMinus} className="me-2" />
                  Remove Stock
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow mb-4">
            <Card.Header className="py-3 d-flex justify-content-between align-items-center">
              <h6 className="m-0 font-weight-bold text-primary">Recent Transactions</h6>
              <Link to={`/inventory/${id}/transactions`} className="btn btn-sm btn-primary">
                <FontAwesomeIcon icon={faHistory} className="me-2" />
                View All
              </Link>
            </Card.Header>
            <Card.Body>
              {transactions.length > 0 ? (
                <div className="table-responsive">
                  <Table className="table-hover" width="100%" cellSpacing="0">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 5).map(transaction => (
                        <tr key={transaction.id}>
                          <td>{formatDate(transaction.transaction_date)}</td>
                          <td>
                            <Badge bg={transaction.type === 'in' ? 'success' : 'danger'}>
                              {transaction.type === 'in' ? 'Stock In' : 'Stock Out'}
                            </Badge>
                          </td>
                          <td>{transaction.quantity} {item.unit}</td>
                          <td>{transaction.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="info">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  No transactions found for this item.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Usage Statistics</h6>
            </Card.Header>
            <Card.Body>
              {Object.keys(usageData).length > 0 ? (
                <div className="chart-container">
                  <LineChart
                    data={usageData}
                    height={250}
                    options={{
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: item.unit
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <Alert variant="info">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  No usage data available for this item.
                </Alert>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Additional Information</h6>
            </Card.Header>
            <Card.Body>
              <div className="item-detail">
                <span className="detail-label">Cost per Unit:</span>
                <span className="detail-value">
                  {item.cost_per_unit ? `₹${item.cost_per_unit.toFixed(2)}` : 'N/A'}
                </span>
              </div>
              <div className="item-detail">
                <span className="detail-label">Expiry Date:</span>
                <span className="detail-value">
                  {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="item-detail">
                <span className="detail-label">Batch Number:</span>
                <span className="detail-value">{item.batch_number || 'N/A'}</span>
              </div>
              <div className="item-detail">
                <span className="detail-label">Date Added:</span>
                <span className="detail-value">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="item-detail">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">
                  {new Date(item.updated_at).toLocaleDateString()}
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Inventory Item"
        message={`Are you sure you want to delete the inventory item "${item.name}"? This action cannot be undone.`}
      />

      {/* Stock In Modal */}
      <FormModal
        show={showStockInModal}
        onHide={() => setShowStockInModal(false)}
        onSubmit={handleStockIn}
        title="Add Stock"
        submitText="Add Stock"
      >
        <Form.Group className="mb-3">
          <Form.Label>Quantity to Add</Form.Label>
          <Form.Control
            type="number"
            min="1"
            value={stockInAmount}
            onChange={(e) => setStockInAmount(parseInt(e.target.value) || 0)}
            required
          />
          <Form.Text className="text-muted">
            Current quantity: {item.quantity} {item.unit}
          </Form.Text>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Reason</Form.Label>
          <Form.Select
            value={stockInReason}
            onChange={(e) => setStockInReason(e.target.value)}
          >
            <option value="Purchase">Purchase</option>
            <option value="Return">Return</option>
            <option value="Adjustment">Adjustment</option>
            <option value="Transfer">Transfer</option>
            <option value="Other">Other</option>
          </Form.Select>
        </Form.Group>
      </FormModal>

      {/* Stock Out Modal */}
      <FormModal
        show={showStockOutModal}
        onHide={() => setShowStockOutModal(false)}
        onSubmit={handleStockOut}
        title="Remove Stock"
        submitText="Remove Stock"
      >
        <Form.Group className="mb-3">
          <Form.Label>Quantity to Remove</Form.Label>
          <Form.Control
            type="number"
            min="1"
            max={item.quantity}
            value={stockOutAmount}
            onChange={(e) => setStockOutAmount(parseInt(e.target.value) || 0)}
            required
          />
          <Form.Text className="text-muted">
            Available quantity: {item.quantity} {item.unit}
          </Form.Text>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Reason</Form.Label>
          <Form.Select
            value={stockOutReason}
            onChange={(e) => setStockOutReason(e.target.value)}
          >
            <option value="Usage">Usage</option>
            <option value="Damage">Damage</option>
            <option value="Expired">Expired</option>
            <option value="Transfer">Transfer</option>
            <option value="Other">Other</option>
          </Form.Select>
        </Form.Group>
      </FormModal>

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        title="Success"
        message="Inventory item has been deleted successfully."
      />

      {/* Error Modal */}
      <ErrorModal
        show={showErrorModal}
        onHide={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
      />
    </div>
  );
};

export default InventoryView;
