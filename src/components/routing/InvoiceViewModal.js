import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Row, Col, Table, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, faEdit, faSave, faTimes, faFileInvoice,
  faPaperPlane, faCheckCircle, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { invoiceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import InvoiceLineItems from './InvoiceLineItems';

const InvoiceViewModal = ({ show, onHide, invoice, routing, onInvoiceUpdated }) => {
  const { currentUser } = useAuth();
  const { currentTenantContext } = useTenant();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoice_date: invoice.invoice_date || '',
        due_date: invoice.due_date || '',
        notes: invoice.notes || '',
        line_items: invoice.line_items || []
      });
    }
  }, [invoice]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'secondary';
      case 'sent':
        return 'warning';
      case 'paid':
        return 'success';
      case 'overdue':
        return 'danger';
      case 'cancelled':
        return 'dark';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return faFileInvoice;
      case 'sent':
        return faPaperPlane;
      case 'paid':
        return faCheckCircle;
      case 'overdue':
        return faExclamationTriangle;
      case 'cancelled':
        return faTimes;
      default:
        return faFileInvoice;
    }
  };

  const canEditInvoice = () => {
    const userRole = currentUser?.role;
    const userTenantId = currentTenantContext?.id;

    // Admin and hub_admin can edit any invoice
    if (userRole === 'admin' || userRole === 'hub_admin') {
      return true;
    }

    // Check if routing is completed - no editing after completion
    if (routing?.status === 'completed') {
      return false;
    }

    // Check ownership transfer status
    if (invoice?.ownership_transferred) {
      // After ownership transfer: only destination can edit
      return userTenantId === invoice?.to_tenant_id && invoice?.status !== 'paid';
    } else {
      // Before ownership transfer: only source can edit
      return userTenantId === invoice?.from_tenant_id && invoice?.status !== 'paid';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLineItemsChange = (lineItems) => {
    setFormData(prev => ({
      ...prev,
      line_items: lineItems
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await invoiceAPI.updateInvoice(invoice.id, formData);
      setIsEditing(false);
      onInvoiceUpdated();
    } catch (err) {
      console.error('Error updating invoice:', err);
      setError(err.response?.data?.message || 'Failed to update invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setError(null);
    onHide();
  };

  if (!invoice) return null;

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faEye} className="me-2" />
          Invoice {invoice.invoice_number}
          <Badge bg={getStatusBadgeVariant(invoice.status)} className="ms-2">
            <FontAwesomeIcon icon={getStatusIcon(invoice.status)} className="me-1" />
            {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
          </Badge>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className='text-white'>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        
        {/* Invoice Header */}
        <div className="mb-4 p-3 bg-light rounded">
          <Row>
            <Col md={6}>
              <h6 className="mb-2">Invoice Details</h6>
              <div><strong>Invoice Number:</strong> {invoice.invoice_number}</div>
              <div><strong>Created:</strong> {formatDate(invoice.created_at)}</div>
              <div><strong>Currency:</strong> {invoice.currency}</div>
              {invoice.ownership_transferred && (
                <div className="mt-2">
                  <Badge bg="info">
                    Ownership Transferred on {formatDate(invoice.ownership_transferred_at)}
                  </Badge>
                </div>
              )}
            </Col>
            <Col md={6}>
              <h6 className="mb-2">Routing Information</h6>
              <div><strong>Tracking:</strong> {routing?.tracking_number}</div>
              <div><strong>Sample ID:</strong> {routing?.sample?.sample_id || 'N/A'}</div>
              <div><strong>Route:</strong> {routing?.from_tenant?.name} → {routing?.to_tenant?.name}</div>
            </Col>
          </Row>
        </div>
        
        {/* Editable Fields */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Invoice Date</Form.Label>
              {isEditing ? (
                <Form.Control
                  type="date"
                  name="invoice_date"
                  value={formData.invoice_date}
                  onChange={handleInputChange}
                />
              ) : (
                <div className="form-control-plaintext">{formatDate(invoice.invoice_date)}</div>
              )}
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Due Date</Form.Label>
              {isEditing ? (
                <Form.Control
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                />
              ) : (
                <div className="form-control-plaintext">{formatDate(invoice.due_date)}</div>
              )}
            </Form.Group>
          </Col>
        </Row>
        
        <Form.Group className="mb-3">
          <Form.Label>Notes</Form.Label>
          {isEditing ? (
            <Form.Control
              as="textarea"
              rows={2}
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Additional notes..."
            />
          ) : (
            <div className="form-control-plaintext">
              {invoice.notes || 'No notes'}
            </div>
          )}
        </Form.Group>
        
        {/* Line Items */}
        <div className="mb-3">
          <Form.Label className="fw-bold">Line Items</Form.Label>
          {isEditing ? (
            <InvoiceLineItems
              lineItems={formData.line_items}
              onChange={handleLineItemsChange}
            />
          ) : (
            <Table striped bordered size="sm">
              <thead>
                <tr >
                  <th className='text-black'>Description</th>
                  <th className='text-black'>Quantity</th>
                  <th className='text-black'>Unit Price</th>
                  <th className='text-black'>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.line_items?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.unit_price, invoice.currency)}</td>
                    <td>{formatCurrency(item.total, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
        
        {/* Totals */}
        <div className="border-top pt-3">
          <Row>
            <Col md={8}></Col>
            <Col md={4}>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Tax ({(invoice.tax_rate * 100).toFixed(0)}%):</span>
                <span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
              </div>
              <div className="d-flex justify-content-between fw-bold border-top pt-2">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total_amount, invoice.currency)}</span>
              </div>
            </Col>
          </Row>
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          <FontAwesomeIcon icon={faTimes} className="me-1" />
          Close
        </Button>
        
        {canEditInvoice() && (
          <>
            {isEditing ? (
              <>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleSave}
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faSave} className="me-1" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button 
                variant="outline-primary" 
                onClick={() => setIsEditing(true)}
              >
                <FontAwesomeIcon icon={faEdit} className="me-1" />
                Edit Invoice
              </Button>
            )}
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default InvoiceViewModal;
