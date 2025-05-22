import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBoxes, faArrowLeft, faSave, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { inventoryAPI } from '../../services/api';
import { 
  TextInput, 
  SelectInput, 
  TextareaInput,
  NumberInput,
  CurrencyInput,
  DateInput,
  FormSection,
  SuccessModal,
  ErrorModal
} from '../../components/common';
import '../../styles/InventoryCreate.css';

const InventoryCreate = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    description: '',
    quantity: 0,
    unit: 'units',
    reorder_level: 0,
    supplier: '',
    location: '',
    cost_per_unit: '',
    expiry_date: '',
    batch_number: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Category options
  const categoryOptions = [
    { value: '', label: 'Select Category' },
    { value: 'Reagents', label: 'Reagents' },
    { value: 'Consumables', label: 'Consumables' },
    { value: 'Equipment', label: 'Equipment' },
    { value: 'Chemicals', label: 'Chemicals' },
    { value: 'Glassware', label: 'Glassware' }
  ];
  
  // Unit options
  const unitOptions = [
    { value: 'units', label: 'Units' },
    { value: 'boxes', label: 'Boxes' },
    { value: 'packs', label: 'Packs' },
    { value: 'bottles', label: 'Bottles' },
    { value: 'vials', label: 'Vials' },
    { value: 'tubes', label: 'Tubes' },
    { value: 'kits', label: 'Kits' },
    { value: 'ml', label: 'Milliliters (ml)' },
    { value: 'l', label: 'Liters (L)' },
    { value: 'g', label: 'Grams (g)' },
    { value: 'kg', label: 'Kilograms (kg)' }
  ];

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Generate SKU
  const generateSKU = () => {
    if (!formData.category) {
      setError('Please select a category first to generate SKU.');
      return;
    }
    
    const categoryPrefix = formData.category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().substring(7);
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    const sku = `${categoryPrefix}-${timestamp}-${randomNum}`;
    
    setFormData(prevData => ({
      ...prevData,
      sku
    }));
  };

  // Validate form before submission
  const validateForm = () => {
    if (!formData.name) {
      setError('Please enter a name for the inventory item.');
      return false;
    }
    
    if (!formData.sku) {
      setError('Please enter a SKU or generate one.');
      return false;
    }
    
    if (!formData.category) {
      setError('Please select a category.');
      return false;
    }
    
    if (formData.quantity < 0) {
      setError('Quantity cannot be negative.');
      return false;
    }
    
    if (formData.reorder_level < 0) {
      setError('Reorder level cannot be negative.');
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
      
      const response = await inventoryAPI.createInventoryItem(formData);
      
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error creating inventory item:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to create inventory item. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/inventory');
  };

  return (
    <div className="inventory-create-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faBoxes} className="me-2" />
          Add New Inventory Item
        </h1>
        <div>
          <Link to="/inventory" className="btn btn-secondary me-2">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to List
          </Link>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={submitting}
          >
            <FontAwesomeIcon icon={faSave} className="me-2" />
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Row>
          <Col lg={8}>
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Basic Information</h6>
              </Card.Header>
              <Card.Body>
                {error && (
                  <Alert variant="danger" className="mb-4">
                    {error}
                  </Alert>
                )}

                <Row>
                  <Col md={6}>
                    <TextInput
                      name="name"
                      label="Item Name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter item name"
                    />
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <Form.Label>
                        SKU <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="input-group">
                        <Form.Control
                          type="text"
                          name="sku"
                          value={formData.sku}
                          onChange={handleChange}
                          required
                          placeholder="Enter SKU"
                        />
                        <Button 
                          variant="outline-secondary"
                          onClick={generateSKU}
                        >
                          Generate
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <SelectInput
                      name="category"
                      label="Category"
                      value={formData.category}
                      onChange={handleChange}
                      options={categoryOptions}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <TextInput
                      name="supplier"
                      label="Supplier"
                      value={formData.supplier}
                      onChange={handleChange}
                      placeholder="Enter supplier name"
                    />
                  </Col>
                </Row>

                <TextareaInput
                  name="description"
                  label="Description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter item description"
                />
              </Card.Body>
            </Card>

            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Stock Information</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <NumberInput
                      name="quantity"
                      label="Initial Quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      min={0}
                    />
                  </Col>
                  <Col md={4}>
                    <SelectInput
                      name="unit"
                      label="Unit of Measure"
                      value={formData.unit}
                      onChange={handleChange}
                      options={unitOptions}
                      required
                    />
                  </Col>
                  <Col md={4}>
                    <NumberInput
                      name="reorder_level"
                      label="Reorder Level"
                      value={formData.reorder_level}
                      onChange={handleChange}
                      min={0}
                    />
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <TextInput
                      name="location"
                      label="Storage Location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Enter storage location"
                    />
                  </Col>
                  <Col md={6}>
                    <CurrencyInput
                      name="cost_per_unit"
                      label="Cost per Unit"
                      value={formData.cost_per_unit}
                      onChange={handleChange}
                      placeholder="Enter cost per unit"
                    />
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <DateInput
                      name="expiry_date"
                      label="Expiry Date"
                      value={formData.expiry_date}
                      onChange={handleChange}
                    />
                  </Col>
                  <Col md={6}>
                    <TextInput
                      name="batch_number"
                      label="Batch Number"
                      value={formData.batch_number}
                      onChange={handleChange}
                      placeholder="Enter batch number"
                    />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Summary</h6>
              </Card.Header>
              <Card.Body>
                <div className="summary-item">
                  <span>Item Name:</span>
                  <span>{formData.name || 'Not specified'}</span>
                </div>
                <div className="summary-item">
                  <span>SKU:</span>
                  <span>{formData.sku || 'Not specified'}</span>
                </div>
                <div className="summary-item">
                  <span>Category:</span>
                  <span>{formData.category || 'Not specified'}</span>
                </div>
                <div className="summary-item">
                  <span>Initial Quantity:</span>
                  <span>{formData.quantity} {formData.unit}</span>
                </div>
                <div className="summary-item">
                  <span>Reorder Level:</span>
                  <span>{formData.reorder_level} {formData.unit}</span>
                </div>
                <div className="summary-item">
                  <span>Cost per Unit:</span>
                  <span>{formData.cost_per_unit ? `₹${formData.cost_per_unit}` : 'Not specified'}</span>
                </div>

                <div className="d-grid gap-2 mt-4">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    <FontAwesomeIcon icon={faSave} className="me-2" />
                    {submitting ? 'Saving...' : 'Save Inventory Item'}
                  </Button>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Help</h6>
              </Card.Header>
              <Card.Body>
                <Alert variant="info">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  <strong>SKU</strong> (Stock Keeping Unit) is a unique identifier for each inventory item. You can generate a SKU automatically by clicking the "Generate" button.
                </Alert>
                <p>
                  <strong>Reorder Level:</strong> The minimum quantity at which you should reorder this item.
                </p>
                <p>
                  <strong>Unit of Measure:</strong> How the item is counted or measured (e.g., units, boxes, ml).
                </p>
                <p>
                  <strong>Storage Location:</strong> Where the item is stored in your facility.
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
        title="Inventory Item Created"
        message="The inventory item has been successfully created."
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

export default InventoryCreate;
