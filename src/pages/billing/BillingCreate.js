import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faSave, faPlus, faTrash, faSearch, 
  faFileInvoiceDollar, faUser, faRupeeSign
} from '@fortawesome/free-solid-svg-icons';
import { billingAPI, patientAPI } from '../../services/api';
import { 
  TextInput, 
  SelectInput, 
  DateInput, 
  NumberInput, 
  CurrencyInput, 
  PercentageInput,
  FormSection,
  SuccessModal,
  ErrorModal
} from '../../components/common';
import '../../styles/BillingCreate.css';

const BillingCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const patientIdParam = queryParams.get('patient_id');

  // Form state
  const [formData, setFormData] = useState({
    patient_id: patientIdParam || '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    items: [],
    subtotal: 0,
    discount: 0,
    tax_rate: 18, // Default GST rate in India
    tax: 0,
    total_amount: 0
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unit_price: 0,
    discount: 0,
    total: 0
  });

  // Fetch patient if ID is provided
  useEffect(() => {
    if (patientIdParam) {
      const fetchPatient = async () => {
        try {
          setLoading(true);
          const response = await patientAPI.getPatientById(patientIdParam);
          setSelectedPatient(response.data);
          setFormData(prev => ({
            ...prev,
            patient_id: response.data.id
          }));
        } catch (err) {
          console.error('Error fetching patient:', err);
          setError('Failed to load patient details. Please try again later.');
        } finally {
          setLoading(false);
        }
      };

      fetchPatient();
    }
  }, [patientIdParam]);

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
  }, [formData.discount, formData.tax_rate]);

  // Search for patients
  const handlePatientSearch = async () => {
    if (!searchQuery) return;
    
    try {
      setLoading(true);
      const response = await patientAPI.searchPatients(searchQuery);
      setSearchResults(response.data);
    } catch (err) {
      console.error('Error searching patients:', err);
      setError('Failed to search patients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Select a patient from search results
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patient_id: patient.id
    }));
    setSearchResults([]);
    setSearchQuery('');
  };

  // Validate form before submission
  const validateForm = () => {
    if (!formData.patient_id) {
      setError('Please select a patient.');
      return false;
    }
    
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
      
      const response = await billingAPI.createBilling(formData);
      
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error creating invoice:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to create invoice. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/billing');
  };

  return (
    <div className="billing-create-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
          Create New Invoice
        </h1>
        <Link to="/billing" className="btn btn-secondary">
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to List
        </Link>
      </div>

      <Form onSubmit={handleSubmit} noValidate validated={validated}>
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

                {selectedPatient ? (
                  <div className="selected-patient mb-4">
                    <div className="d-flex align-items-center">
                      <FontAwesomeIcon icon={faUser} className="me-2 text-primary" size="lg" />
                      <div>
                        <h5 className="mb-0">{selectedPatient.first_name} {selectedPatient.last_name}</h5>
                        <p className="text-muted mb-0">
                          ID: {selectedPatient.patient_id} | 
                          Phone: {selectedPatient.phone}
                        </p>
                      </div>
                      <Button 
                        variant="link" 
                        className="ms-auto"
                        onClick={() => {
                          setSelectedPatient(null);
                          setFormData(prev => ({ ...prev, patient_id: '' }));
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="patient-search mb-4">
                    <FormSection title="Select Patient">
                      <div className="d-flex mb-3">
                        <Form.Control
                          type="text"
                          placeholder="Search by name, ID, or phone number"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="me-2"
                        />
                        <Button 
                          variant="primary" 
                          onClick={handlePatientSearch}
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faSearch} />
                        </Button>
                      </div>
                      
                      {searchResults.length > 0 && (
                        <div className="search-results mb-3">
                          <Table hover size="sm">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>ID</th>
                                <th>Phone</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {searchResults.map(patient => (
                                <tr key={patient.id}>
                                  <td>{patient.first_name} {patient.last_name}</td>
                                  <td>{patient.patient_id}</td>
                                  <td>{patient.phone}</td>
                                  <td>
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm"
                                      onClick={() => handleSelectPatient(patient)}
                                    >
                                      Select
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </FormSection>
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
                    type="submit"
                    disabled={submitting || formData.items.length === 0 || !formData.patient_id}
                  >
                    <FontAwesomeIcon icon={faSave} className="me-2" />
                    {submitting ? 'Creating...' : 'Create Invoice'}
                  </Button>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold">Help</h6>
              </Card.Header>
              <Card.Body>
                <p>
                  <strong>Invoice Date:</strong> The date when the invoice is created.
                </p>
                <p>
                  <strong>Due Date:</strong> The date by which payment is expected.
                </p>
                <p>
                  <strong>Items:</strong> Add all services or products to be billed.
                </p>
                <p>
                  <strong>Discount:</strong> Enter any discount amount to be applied to the entire invoice.
                </p>
                <p>
                  <strong>Tax Rate:</strong> Enter the applicable tax rate (e.g., GST).
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={handleSuccessModalClose}
        title="Invoice Created"
        message="The invoice has been successfully created."
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

export default BillingCreate;
