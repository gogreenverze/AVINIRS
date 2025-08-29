import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { invoiceAPI } from '../../services/api';
import InvoiceLineItems from './InvoiceLineItems';

const InvoiceCreateModal = ({ show, onHide, routingId, routing, onInvoiceCreated }) => {
  const [formData, setFormData] = useState({
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    notes: '',
    currency: 'INR',
    line_items: [
      {
        description: '',
        quantity: 1,
        unit_price: 0
      }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const calculateTotals = () => {
    const subtotal = formData.line_items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) * parseFloat(item.unit_price));
    }, 0);
    
    const taxRate = 0.18; // 18% GST
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    
    return {
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const validateForm = () => {
    if (!formData.invoice_date) {
      setError('Invoice date is required');
      return false;
    }
    
    if (!formData.due_date) {
      setError('Due date is required');
      return false;
    }
    
    if (formData.line_items.length === 0) {
      setError('At least one line item is required');
      return false;
    }
    
    for (let i = 0; i < formData.line_items.length; i++) {
      const item = formData.line_items[i];
      if (!item.description.trim()) {
        setError(`Line item ${i + 1}: Description is required`);
        return false;
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        setError(`Line item ${i + 1}: Quantity must be greater than 0`);
        return false;
      }
      if (!item.unit_price || parseFloat(item.unit_price) <= 0) {
        setError(`Line item ${i + 1}: Unit price must be greater than 0`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await invoiceAPI.createInvoice(routingId, formData);
      onInvoiceCreated();
      
      // Reset form
      setFormData({
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
        currency: 'INR',
        line_items: [
          {
            description: '',
            quantity: 1,
            unit_price: 0
          }
        ]
      });
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err.response?.data?.message || 'Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onHide();
  };

  const totals = calculateTotals();

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Create New Invoice
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="text-white">
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}
          
          {/* Routing Information */}
          <div className="mb-4 p-3 bg-light rounded">
            <h6 className="mb-2">Routing Information</h6>
            <Row>
              <Col md={6}>
                <strong>Tracking Number:</strong> {routing?.tracking_number}
              </Col>
              <Col md={6}>
                <strong>Sample ID:</strong> {routing?.sample?.sample_id || 'N/A'}
              </Col>
            </Row>
            <Row className="mt-2">
              <Col md={6}>
                <strong>From:</strong> {routing?.from_tenant?.name || 'Unknown'}
              </Col>
              <Col md={6}>
                <strong>To:</strong> {routing?.to_tenant?.name || 'Unknown'}
              </Col>
            </Row>
          </div>
          
          {/* Invoice Details */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Invoice Date</Form.Label>
                <Form.Control
                  type="date"
                  name="invoice_date"
                  value={formData.invoice_date}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Due Date</Form.Label>
                <Form.Control
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Currency</Form.Label>
                <Form.Select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Notes (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes for this invoice..."
                />
              </Form.Group>
            </Col>
          </Row>
          
          {/* Line Items */}
          <div className="mb-3">
            <Form.Label className="fw-bold">Line Items</Form.Label>
            <InvoiceLineItems
              lineItems={formData.line_items}
              onChange={handleLineItemsChange}
            />
          </div>
          
          {/* Totals */}
          <div className="border-top pt-3">
            <Row>
              <Col md={8}></Col>
              <Col md={4}>
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal:</span>
                  <span>₹{totals.subtotal}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Tax (18% GST):</span>
                  <span>₹{totals.taxAmount}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold border-top pt-2">
                  <span>Total:</span>
                  <span>₹{totals.total}</span>
                </div>
              </Col>
            </Row>
          </div>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            <FontAwesomeIcon icon={faTimes} className="me-1" />
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            <FontAwesomeIcon icon={faSave} className="me-1" />
            {loading ? 'Creating...' : 'Create Invoice'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default InvoiceCreateModal;
