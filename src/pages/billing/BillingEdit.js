import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faSave, faPlus, faTrash, 
  faFileInvoiceDollar, faUser, faRupeeSign, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { billingAPI } from '../../services/api';
import { 
  TextInput, 
  DateInput, 
  NumberInput, 
  CurrencyInput, 
  PercentageInput,
  FormSection,
  SuccessModal,
  ErrorModal,
  ConfirmationModal
} from '../../components/common';
import '../../styles/BillingEdit.css';

const BillingEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Form state
  const [formData, setFormData] = useState({
    invoice_date: '',
    due_date: '',
    notes: '',
    items: [],
    subtotal: 0,
    discount: 0,
    tax_rate: 18,
    tax: 0,
    total_amount: 0
  });

  // Original billing data
  const [originalBilling, setOriginalBilling] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unit_price: 0,
    discount: 0,
    total: 0
  });

  // Fetch billing data
  useEffect(() => {
    const fetchBilling = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await billingAPI.getBillingById(id);
        const billingData = response.data;
        
        setOriginalBilling(billingData);
        
        // Format dates for form input
        if (billingData.invoice_date) {
          const date = new Date(billingData.invoice_date);
          billingData.invoice_date = date.toISOString().split('T')[0];
        }
        
        if (billingData.due_date) {
          const date = new Date(billingData.due_date);
          billingData.due_date = date.toISOString().split('T')[0];
        }
        
        // Ensure each item has an id for React keys
        if (billingData.items) {
          billingData.items = billingData.items.map(item => ({
            ...item,
            id: item.id || Date.now() + Math.random()
          }));
        }
        
        setFormData(billingData);
      } catch (err) {
        console.error('Error fetching billing:', err);
        setErrorMessage('Failed to load invoice data. Please try again later.');
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, [id]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handle new item field changes
  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      
      // Calculate total for the item
      if (name === 'quantity' || name === 'unit_price' || name === 'discount') {
        const quantity = parseFloat(updated.quantity) || 0;
        const unitPrice = parseFloat(updated.unit_price) || 0;
        const discount = parseFloat(updated.discount) || 0;
        
        const total = quantity * unitPrice * (1 - discount / 100);
        updated.total = parseFloat(total.toFixed(2));
      }
      
      return updated;
    });
  };

  // Add new item to the invoice
  const handleAddItem = () => {
    if (!newItem.description || newItem.quantity <= 0 || newItem.unit_price <= 0) {
      return;
    }
    
    setFormData(prev => {
      const updatedItems = [...prev.items, { ...newItem, id: Date.now() }];
      
      // Calculate invoice totals
      const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      const discount = parseFloat(prev.discount) || 0;
      const taxRate = parseFloat(prev.tax_rate) || 0;
      const tax = (subtotal - discount) * (taxRate / 100);
      const totalAmount = subtotal - discount + tax;
      
      return {
        ...prev,
        items: updatedItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total_amount: parseFloat(totalAmount.toFixed(2))
      };
    });
    
    // Reset new item form
    setNewItem({
      description: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      total: 0
    });
  };

  // Remove item from the invoice
  const handleRemoveItem = (itemId) => {
    setFormData(prev => {
      const updatedItems = prev.items.filter(item => item.id !== itemId);
      
      // Recalculate invoice totals
      const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      const discount = parseFloat(prev.discount) || 0;
      const taxRate = parseFloat(prev.tax_rate) || 0;
      const tax = (subtotal - discount) * (taxRate / 100);
      const totalAmount = subtotal - discount + tax;
      
      return {
        ...prev,
        items: updatedItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total_amount: parseFloat(totalAmount.toFixed(2))
      };
    });
  };

  // Update invoice totals when discount or tax rate changes
  useEffect(() => {
    if (formData.items && formData.items.length > 0) {
      const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
      const discount = parseFloat(formData.discount) || 0;
      const taxRate = parseFloat(formData.tax_rate) || 0;
      const tax = (subtotal - discount) * (taxRate / 100);
      const totalAmount = subtotal - discount + tax;
      
      setFormData(prev => ({
        ...prev,
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total_amount: parseFloat(totalAmount.toFixed(2))
      }));
    }
  }, [formData.discount, formData.tax_rate]);

  // Validate form before submission
  const validateForm = () => {
    if (formData.items.length === 0) {
      setError('Please add at least one item to the invoice.');
      return false;
    }
    
    setValidated(true);
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Prepare data for submission
      const submissionData = {
        ...formData,
        // Remove any properties that shouldn't be sent to the API
        patient: undefined
      };
      
      const response = await billingAPI.updateBilling(id, submissionData);
      
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error updating invoice:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to update invoice. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate(`/billing/${id}`);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowCancelModal(true);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading invoice details...</p>
      </div>
    );
  }

  // Check if invoice is editable
  const isEditable = originalBilling && originalBilling.status !== 'Paid' && originalBilling.status !== 'Cancelled';

  if (!isEditable) {
    return (
      <div className="billing-edit-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0 text-gray-800">
            <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
            Edit Invoice
          </h1>
          <Link to={`/billing/${id}`} className="btn btn-secondary">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Invoice
          </Link>
        </div>
        
        <Alert variant="warning">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          This invoice cannot be edited because it has already been {originalBilling?.status.toLowerCase()}.
        </Alert>
      </div>
    );
  }

  return (
    <div className="billing-edit-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
          Edit Invoice
        </h1>
        <div>
          <Button variant="secondary" className="me-2" onClick={handleCancel}>
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={submitting}
          >
            <FontAwesomeIcon icon={faSave} className="me-2" />
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Form noValidate validated={validated}>
        <Row>
          <Col lg={8}>
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Invoice Information</h6>
              </Card.Header>
              <Card.Body>
                {error && (
                  <Alert variant="danger" className="mb-4">
                    {error}
                  </Alert>
                )}

                {originalBilling.patient && (
                  <div className="selected-patient mb-4">
                    <div className="d-flex align-items-center">
                      <FontAwesomeIcon icon={faUser} className="me-2 text-primary" size="lg" />
                      <div>
                        <h5 className="mb-0">{originalBilling.patient.first_name} {originalBilling.patient.last_name}</h5>
                        <p className="text-muted mb-0">
                          ID: {originalBilling.patient.patient_id} | 
                          Phone: {originalBilling.patient.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Row>
                  <Col md={6}>
                    <DateInput
                      name="invoice_date"
                      label="Invoice Date"
                      value={formData.invoice_date}
                      onChange={handleChange}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <DateInput
                      name="due_date"
                      label="Due Date"
                      value={formData.due_date}
                      onChange={handleChange}
                      required
                    />
                  </Col>
                </Row>

                <TextInput
                  name="notes"
                  label="Notes"
                  value={formData.notes}
                  onChange={handleChange}
                  as="textarea"
                  rows={3}
                />
              </Card.Body>
            </Card>

            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Invoice Items</h6>
              </Card.Header>
              <Card.Body>
                <div className="invoice-items mb-4">
                  {formData.items.length > 0 ? (
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Quantity</th>
                          <th>Unit Price</th>
                          <th>Discount</th>
                          <th>Total</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map(item => (
                          <tr key={item.id}>
                            <td>{item.description}</td>
                            <td>{item.quantity}</td>
                            <td>{item.unit_price.toFixed(2)}</td>
                            <td>{item.discount}%</td>
                            <td>{item.total.toFixed(2)}</td>
                            <td>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="info">
                      No items added to this invoice yet. Use the form below to add items.
                    </Alert>
                  )}
                </div>

                <FormSection title="Add New Item">
                  <Row>
                    <Col md={12}>
                      <TextInput
                        name="description"
                        label="Description"
                        value={newItem.description}
                        onChange={handleItemChange}
                        required
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col md={4}>
                      <NumberInput
                        name="quantity"
                        label="Quantity"
                        value={newItem.quantity}
                        onChange={handleItemChange}
                        min={1}
                        required
                      />
                    </Col>
                    <Col md={4}>
                      <CurrencyInput
                        name="unit_price"
                        label="Unit Price"
                        value={newItem.unit_price}
                        onChange={handleItemChange}
                        required
                      />
                    </Col>
                    <Col md={4}>
                      <PercentageInput
                        name="discount"
                        label="Discount %"
                        value={newItem.discount}
                        onChange={handleItemChange}
                      />
                    </Col>
                  </Row>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <strong>Item Total:</strong> <FontAwesomeIcon icon={faRupeeSign} /> {newItem.total.toFixed(2)}
                    </div>
                    <Button
                      variant="primary"
                      onClick={handleAddItem}
                      disabled={!newItem.description || newItem.quantity <= 0 || newItem.unit_price <= 0}
                    >
                      <FontAwesomeIcon icon={faPlus} className="me-2" />
                      Add Item
                    </Button>
                  </div>
                </FormSection>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold">Invoice Summary</h6>
              </Card.Header>
              <Card.Body>
                <div className="invoice-summary">
                  <div className="summary-item">
                    <span>Subtotal:</span>
                    <span><FontAwesomeIcon icon={faRupeeSign} /> {formData.subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="summary-item">
                    <span>Discount:</span>
                    <div className="d-flex align-items-center">
                      <Form.Control
                        type="number"
                        name="discount"
                        value={formData.discount}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="form-control-sm me-2"
                        style={{ width: '80px' }}
                      />
                      <FontAwesomeIcon icon={faRupeeSign} />
                    </div>
                  </div>
                  
                  <div className="summary-item">
                    <span>Tax Rate:</span>
                    <div className="d-flex align-items-center">
                      <Form.Control
                        type="number"
                        name="tax_rate"
                        value={formData.tax_rate}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        step="0.01"
                        className="form-control-sm me-2"
                        style={{ width: '80px' }}
                      />
                      <span>%</span>
                    </div>
                  </div>
                  
                  <div className="summary-item">
                    <span>Tax Amount:</span>
                    <span><FontAwesomeIcon icon={faRupeeSign} /> {formData.tax.toFixed(2)}</span>
                  </div>
                  
                  <div className="summary-item total">
                    <span>Total:</span>
                    <span><FontAwesomeIcon icon={faRupeeSign} /> {formData.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="d-grid gap-2 mt-4">
                  <Button
                    variant="success"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={submitting || formData.items.length === 0}
                  >
                    <FontAwesomeIcon icon={faSave} className="me-2" />
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold">Invoice Status</h6>
              </Card.Header>
              <Card.Body>
                <div className="status-info">
                  <p><strong>Invoice Number:</strong> {originalBilling.invoice_number}</p>
                  <p><strong>Status:</strong> {originalBilling.status}</p>
                  <p><strong>Created:</strong> {new Date(originalBilling.created_at).toLocaleDateString()}</p>
                  {originalBilling.paid_amount > 0 && (
                    <p><strong>Amount Paid:</strong> {formatCurrency(originalBilling.paid_amount)}</p>
                  )}
                  {originalBilling.status === 'Partial' && (
                    <p><strong>Balance Due:</strong> {formatCurrency(originalBilling.total_amount - originalBilling.paid_amount)}</p>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={handleSuccessModalClose}
        title="Invoice Updated"
        message="The invoice has been successfully updated."
      />

      {/* Error Modal */}
      <ErrorModal
        show={showErrorModal}
        onHide={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        onConfirm={() => navigate(`/billing/${id}`)}
        title="Cancel Editing"
        message="Are you sure you want to cancel? All unsaved changes will be lost."
        confirmText="Yes, Cancel"
        cancelText="No, Continue Editing"
      />
    </div>
  );
};

export default BillingEdit;
