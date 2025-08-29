import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Form,
  Row,
  Col,
  Alert,
  Badge,
  InputGroup,
  Modal
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faSync,
  faDollarSign,
  faPercentage,
  faCalculator
} from '@fortawesome/free-solid-svg-icons';
import { Autocomplete, TextField } from '@mui/material';
import { adminAPI } from '../../services/api';
import {
  TextInput,
  NumberInput,
  SelectInput,
  FormModal,
  DeleteConfirmationModal,
  SuccessModal,
  ErrorModal
} from '../common';

const PriceSchemeMaster = () => {
  // State management
  const [data, setData] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [testMasterData, setTestMasterData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    dept_code: '',
    dept_name: '',
    scheme_code: '',
    scheme_name: '',
    test_type: 'T',
    test_code: '',
    test_name: '',
    default_price: 0,
    scheme_price: 0,
    price_percentage: 0,
    is_active: true
  });

  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [priceSchemeResponse, schemesResponse, testMasterResponse] = await Promise.all([
        adminAPI.get('/admin/price-scheme-master'),
        adminAPI.get('/admin/schemes-master'),
        adminAPI.get('/admin/test-master-enhanced')
      ]);

      setData(priceSchemeResponse.data.data || []);
      setSchemes(schemesResponse.data.data || []);
      setTestMasterData(testMasterResponse.data.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle scheme selection
  const handleSchemeChange = (event, newValue) => {
    if (newValue) {
      setFormData(prev => ({
        ...prev,
        scheme_code: newValue.scheme_code,
        scheme_name: newValue.scheme_name
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        scheme_code: '',
        scheme_name: ''
      }));
    }
  };

  // Handle test selection
  const handleTestChange = (event, newValue) => {
    if (newValue) {
      setFormData(prev => ({
        ...prev,
        test_code: newValue.hmsCode || newValue.test_code || '',
        test_name: newValue.testName || newValue.test_name || '',
        dept_code: newValue.department || '',
        dept_name: newValue.department || '',
        default_price: newValue.test_price || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        test_code: '',
        test_name: '',
        dept_code: '',
        dept_name: '',
        default_price: 0
      }));
    }
  };

  // Calculate price percentage when prices change
  useEffect(() => {
    const defaultPrice = parseFloat(formData.default_price) || 0;
    const schemePrice = parseFloat(formData.scheme_price) || 0;

    if (defaultPrice > 0) {
      const percentage = (schemePrice / defaultPrice) * 100;
      setFormData(prev => ({
        ...prev,
        price_percentage: Math.round(percentage * 100) / 100
      }));
    } else if (defaultPrice === 0) {
      setFormData(prev => ({
        ...prev,
        price_percentage: 0
      }));
    }
  }, [formData.default_price, formData.scheme_price]);

  // Calculate scheme price when percentage changes
  const handlePercentageChange = (e) => {
    const percentage = parseFloat(e.target.value) || 0;
    const defaultPrice = parseFloat(formData.default_price) || 0;
    const schemePrice = (defaultPrice * percentage) / 100;

    setFormData(prev => ({
      ...prev,
      price_percentage: percentage,
      scheme_price: Math.round(schemePrice * 100) / 100
    }));
  };

  // Calculate scheme price when default price changes
  const handleDefaultPriceChange = (e) => {
    const defaultPrice = parseFloat(e.target.value) || 0;
    const percentage = parseFloat(formData.price_percentage) || 0;
    const schemePrice = (defaultPrice * percentage) / 100;

    setFormData(prev => ({
      ...prev,
      default_price: defaultPrice,
      scheme_price: Math.round(schemePrice * 100) / 100
    }));
  };

  // Validate form data
  const validateForm = () => {
    const errors = [];

    if (!formData.scheme_code) {
      errors.push('Scheme is required');
    }

    if (!formData.test_code || !formData.test_name) {
      errors.push('Test/Profile selection is required');
    }

    if (parseFloat(formData.default_price) <= 0) {
      errors.push('Default price must be greater than 0');
    }

    if (parseFloat(formData.scheme_price) < 0) {
      errors.push('Scheme price cannot be negative');
    }

    if (parseFloat(formData.price_percentage) < 0) {
      errors.push('Price percentage cannot be negative');
    }

    return errors;
  };

  // Calculate savings/markup
  const calculatePriceDifference = (defaultPrice, schemePrice) => {
    const diff = schemePrice - defaultPrice;
    const percentage = ((diff / defaultPrice) * 100).toFixed(1);

    if (diff > 0) {
      return { type: 'markup', amount: diff, percentage };
    } else if (diff < 0) {
      return { type: 'discount', amount: Math.abs(diff), percentage: Math.abs(percentage) };
    } else {
      return { type: 'same', amount: 0, percentage: '0' };
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      dept_code: '',
      dept_name: '',
      scheme_code: '',
      scheme_name: '',
      test_type: 'T',
      test_code: '',
      test_name: '',
      default_price: 0,
      scheme_price: 0,
      price_percentage: 0,
      is_active: true
    });
  };

  // Handle add
  const handleAddClick = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors.join(', '));
      setShowErrorModal(true);
      return;
    }

    try {
      await adminAPI.post('/admin/price-scheme-master', formData);
      setShowAddModal(false);
      setSuccessMessage('Price scheme entry added successfully!');
      setShowSuccessModal(true);
      fetchAllData();
      resetForm();
    } catch (err) {
      console.error('Error adding price scheme:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to add price scheme entry. Please try again.');
      setShowErrorModal(true);
    }
  };

  // Handle edit
  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors.join(', '));
      setShowErrorModal(true);
      return;
    }

    try {
      await adminAPI.put(`/admin/price-scheme-master/${editingItem.id}`, formData);
      setShowEditModal(false);
      setSuccessMessage('Price scheme entry updated successfully!');
      setShowSuccessModal(true);
      fetchAllData();
    } catch (err) {
      console.error('Error updating price scheme:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to update price scheme entry. Please try again.');
      setShowErrorModal(true);
    }
  };

  // Handle delete
  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await adminAPI.delete(`/admin/price-scheme-master/${itemToDelete.id}`);
      setShowDeleteModal(false);
      setSuccessMessage('Price scheme entry deleted successfully!');
      setShowSuccessModal(true);
      fetchAllData();
    } catch (err) {
      console.error('Error deleting price scheme:', err);
      setErrorMessage('Failed to delete price scheme entry. Please try again.');
      setShowErrorModal(true);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter data based on search
  const getFilteredData = () => {
    if (!searchQuery) return data;
    
    return data.filter(item =>
      item.test_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.scheme_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dept_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.test_code?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="price-scheme-master">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 text-black">
              <FontAwesomeIcon icon={faDollarSign} className="me-2 text-black" />
              Price Scheme Master
            </h5>
            <small className="text-muted">
              Manage test pricing schemes with default prices, percentages, and scheme prices
            </small>
          </div>
          <div className="d-flex gap-2">
            <Button variant="success" onClick={handleAddClick}>
              <FontAwesomeIcon icon={faPlus} className="me-1" />
              Add New
            </Button>
            <Button variant="outline-primary" onClick={fetchAllData}>
              <FontAwesomeIcon icon={faSync} className="me-1" />
              Refresh
            </Button>
          </div>
        </Card.Header>

        <div className="card-header-search py-2 px-3 border-bottom">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search by test name, scheme, department, or test code..."
              value={searchQuery}
              onChange={handleSearch}
            />
            <Button variant="outline-secondary">
              <FontAwesomeIcon icon={faSearch} />
            </Button>
          </InputGroup>
        </div>

        <Card.Body>
          {error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <div className="table-responsive">
              <Table className="table-hover">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Test Code</th>
                    <th>Test Name</th>
                    <th>Scheme</th>
                    <th>Default Price</th>
                    <th>Price %</th>
                    <th>Scheme Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : getFilteredData().length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-4 text-muted">
                        No price scheme entries found
                      </td>
                    </tr>
                  ) : (
                    getFilteredData().map(item => (
                      <tr key={item.id}>
                        <td>{item.dept_name}</td>
                        <td>
                          <code className="text-primary">{item.test_code}</code>
                        </td>
                        <td>{item.test_name}</td>
                        <td>
                          <Badge bg="info">{item.scheme_name}</Badge>
                        </td>
                        <td>
                          <span className="text-success fw-bold">
                            ₹{parseFloat(item.default_price || 0).toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <Badge bg="warning" text="dark">
                            {parseFloat(item.price_percentage || 0).toFixed(1)}%
                          </Badge>
                        </td>
                        <td>
                          <span className="text-primary fw-bold">
                            ₹{parseFloat(item.scheme_price || 0).toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <Badge bg={item.is_active ? 'success' : 'secondary'}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(item)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteClick(item)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add Modal */}
      <FormModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSubmit={handleAddSubmit}
        title="Add New Price Scheme Entry"
      >
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Scheme*</Form.Label>
              <Autocomplete
                options={schemes}
                getOptionLabel={(option) => `${option.scheme_code} - ${option.scheme_name}`}
                value={schemes.find(s => s.scheme_code === formData.scheme_code) || null}
                onChange={handleSchemeChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select scheme..."
                    variant="outlined"
                    size="small"
                    required
                  />
                )}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Test/Profile*</Form.Label>
              <Autocomplete
                options={testMasterData}
                getOptionLabel={(option) => `${option.testName || option.test_name} (${option.hmsCode || option.test_code})`}
                value={testMasterData.find(t => (t.hmsCode || t.test_code) === formData.test_code) || null}
                onChange={handleTestChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select test..."
                    variant="outlined"
                    size="small"
                    required
                  />
                )}
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <NumberInput
              name="default_price"
              label="Default Price*"
              value={formData.default_price}
              onChange={handleDefaultPriceChange}
              min={0}
              step={0.01}
              required
              placeholder="0.00"
            />
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Price Percentage*</Form.Label>
              <InputGroup>
                <Form.Control
                  type="number"
                  name="price_percentage"
                  value={formData.price_percentage}
                  onChange={handlePercentageChange}
                  min={0}
                  max={200}
                  step={0.1}
                  required
                  placeholder="100.0"
                />
                <InputGroup.Text>
                  <FontAwesomeIcon icon={faPercentage} />
                </InputGroup.Text>
              </InputGroup>
            </Form.Group>
          </Col>
          <Col md={4}>
            <NumberInput
              name="scheme_price"
              label="Scheme Price*"
              value={formData.scheme_price}
              onChange={handleChange}
              min={0}
              step={0.01}
              required
              placeholder="0.00"
            />
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <TextInput
              name="test_code"
              label="Test Code"
              value={formData.test_code}
              onChange={handleChange}
              disabled
              placeholder="Auto-filled from test selection"
            />
          </Col>
          <Col md={6}>
            <SelectInput
              name="test_type"
              label="Test Type"
              value={formData.test_type}
              onChange={handleChange}
              options={[
                { value: 'T', label: 'Test' },
                { value: 'P', label: 'Profile' }
              ]}
            />
          </Col>
        </Row>

        <Form.Check
          type="switch"
          id="is_active_add"
          name="is_active"
          label="Active"
          checked={formData.is_active}
          onChange={handleChange}
        />
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        title="Edit Price Scheme Entry"
      >
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Scheme*</Form.Label>
              <Autocomplete
                options={schemes}
                getOptionLabel={(option) => `${option.scheme_code} - ${option.scheme_name}`}
                value={schemes.find(s => s.scheme_code === formData.scheme_code) || null}
                onChange={handleSchemeChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select scheme..."
                    variant="outlined"
                    size="small"
                    required
                  />
                )}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Test/Profile*</Form.Label>
              <Autocomplete
                options={testMasterData}
                getOptionLabel={(option) => `${option.testName || option.test_name} (${option.hmsCode || option.test_code})`}
                value={testMasterData.find(t => (t.hmsCode || t.test_code) === formData.test_code) || null}
                onChange={handleTestChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select test..."
                    variant="outlined"
                    size="small"
                    required
                  />
                )}
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <NumberInput
              name="default_price"
              label="Default Price*"
              value={formData.default_price}
              onChange={handleDefaultPriceChange}
              min={0}
              step={0.01}
              required
              placeholder="0.00"
            />
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Price Percentage*</Form.Label>
              <InputGroup>
                <Form.Control
                  type="number"
                  name="price_percentage"
                  value={formData.price_percentage}
                  onChange={handlePercentageChange}
                  min={0}
                  max={200}
                  step={0.1}
                  required
                  placeholder="100.0"
                />
                <InputGroup.Text>
                  <FontAwesomeIcon icon={faPercentage} />
                </InputGroup.Text>
              </InputGroup>
            </Form.Group>
          </Col>
          <Col md={4}>
            <NumberInput
              name="scheme_price"
              label="Scheme Price*"
              value={formData.scheme_price}
              onChange={handleChange}
              min={0}
              step={0.01}
              required
              placeholder="0.00"
            />
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <TextInput
              name="test_code"
              label="Test Code"
              value={formData.test_code}
              onChange={handleChange}
              disabled
              placeholder="Auto-filled from test selection"
            />
          </Col>
          <Col md={6}>
            <SelectInput
              name="test_type"
              label="Test Type"
              value={formData.test_type}
              onChange={handleChange}
              options={[
                { value: 'T', label: 'Test' },
                { value: 'P', label: 'Profile' }
              ]}
            />
          </Col>
        </Row>

        <Form.Check
          type="switch"
          id="is_active_edit"
          name="is_active"
          label="Active"
          checked={formData.is_active}
          onChange={handleChange}
        />
      </FormModal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Price Scheme Entry"
        message={`Are you sure you want to delete the price scheme entry for "${itemToDelete?.test_name}" under scheme "${itemToDelete?.scheme_name}"?`}
      />

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        message={successMessage}
      />

      {/* Error Modal */}
      <ErrorModal
        show={showErrorModal}
        onHide={() => setShowErrorModal(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default PriceSchemeMaster;
