import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert, Badge, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faBuilding, faShieldAlt, faCheck } from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';

const FranchiseCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Available modules and selected permissions
  const [modules, setModules] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    site_code: '',
    address: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    contact_phone: '',
    email: '',
    license_number: '',
    established_date: '',
    is_hub: false,
    is_active: true,
    use_site_code_prefix: true,
    franchise_fee: '',
    monthly_fee: '',
    commission_rate: '',
    contact_person: '',
    contact_person_phone: '',
    notes: ''
  });

  // Load available modules on component mount
  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setModulesLoading(true);
      const response = await adminAPI.getModules();
      setModules(response.data.data);

      // Set default permissions based on franchise type
      updateDefaultPermissions(response.data.data, formData.is_hub);
    } catch (err) {
      console.error('Error loading modules:', err);
      setError('Failed to load available modules');
    } finally {
      setModulesLoading(false);
    }
  };

  // Update default permissions based on franchise type
  const updateDefaultPermissions = (availableModules, isHub) => {
    if (isHub) {
      // Hub franchises get all modules by default
      setSelectedPermissions(availableModules.map(module => module.id));
    } else {
      // Regular franchises get only core modules by default
      const coreModules = availableModules.filter(module => module.is_core);
      setSelectedPermissions(coreModules.map(module => module.id));
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Update default permissions when hub status changes
    if (name === 'is_hub' && modules.length > 0) {
      updateDefaultPermissions(modules, newValue);
    }
  };

  // Handle permission changes
  const handlePermissionChange = (moduleId, checked) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, moduleId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== moduleId));
    }
  };

  // Get modules organized by category
  const getModulesByCategory = () => {
    const categories = {};
    modules.forEach(module => {
      if (!categories[module.category]) {
        categories[module.category] = [];
      }
      categories[module.category].push(module);
    });
    return categories;
  };

  // Get category display name
  const getCategoryDisplayName = (category) => {
    const categoryNames = {
      'main': 'Main',
      'pre_analytical': 'Pre-Analytical',
      'analytical': 'Analytical',
      'post_analytical': 'Post-Analytical',
      'management': 'Management',
      'administration': 'Administration'
    };
    return categoryNames[category] || category;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.site_code || !formData.contact_phone) {
      setError('Please fill in all required fields.');
      return;
    }

    // Validate permissions
    if (selectedPermissions.length === 0) {
      setError('Please select at least one module permission for the franchise.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create franchise first
      const franchiseResponse = await adminAPI.createFranchise(formData);
      const franchiseId = franchiseResponse.data.franchise.id;

      // Then assign permissions
      await adminAPI.updateFranchisePermissions(franchiseId, {
        module_permissions: selectedPermissions
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/admin');
      }, 2000);

    } catch (err) {
      console.error('Error creating franchise:', err);
      setError(err.response?.data?.message || 'Failed to create franchise. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="franchise-create-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faBuilding} className="me-2" />
          Add New Franchise
        </h1>
        <Button 
          variant="secondary" 
          onClick={() => navigate('/admin')}
          className="btn-sm"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to Franchises
        </Button>
      </div>

      {/* Success Message */}
      {success && (
        <Alert variant="success">
          Franchise created successfully! Redirecting to franchises list...
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      {/* Create Form */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Franchise Information</h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <h6 className="text-primary mb-3">Basic Information</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Franchise Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., AVINI Labs Chidambaram"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Site Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="site_code"
                    value={formData.site_code}
                    onChange={handleInputChange}
                    style={{ textTransform: 'uppercase' }}
                    required
                    placeholder="e.g., CHD"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Phone <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Address Information */}
            <h6 className="text-primary mb-3 mt-4">Address Information</h6>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Pincode</Form.Label>
                  <Form.Control
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Legal Information */}
            <h6 className="text-primary mb-3 mt-4">Legal Information</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>License Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Established Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="established_date"
                    value={formData.established_date}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Contact Person */}
            <h6 className="text-primary mb-3 mt-4">Contact Person</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Person Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Person Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="contact_person_phone"
                    value={formData.contact_person_phone}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Financial Information */}
            <h6 className="text-primary mb-3 mt-4">Financial Information</h6>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Franchise Fee (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    name="franchise_fee"
                    value={formData.franchise_fee}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Monthly Fee (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    name="monthly_fee"
                    value={formData.monthly_fee}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Commission Rate (%)</Form.Label>
                  <Form.Control
                    type="number"
                    name="commission_rate"
                    value={formData.commission_rate}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Settings */}
            <h6 className="text-primary mb-3 mt-4">Settings</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="is_hub"
                    label="Is Hub Location"
                    checked={formData.is_hub}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="is_active"
                    label="Active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="use_site_code_prefix"
                    label="Use Site Code Prefix for SID Generation"
                    checked={formData.use_site_code_prefix}
                    onChange={handleInputChange}
                  />
                  <Form.Text className="text-muted">
                    When enabled, SIDs will be generated with site code prefix (e.g., MYD001).
                    When disabled, SIDs will be generated as numbers only (e.g., 001).
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional notes about the franchise..."
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Module Permissions */}
            <h6 className="text-primary mb-3 mt-4">
              <FontAwesomeIcon icon={faShieldAlt} className="me-2" />
              Module Access Permissions
            </h6>
            <p className="text-muted mb-3">
              Select which modules this franchise will have access to.
              {formData.is_hub ? (
                <span className="text-info"> Hub franchises have all modules selected by default.</span>
              ) : (
                <span> Core modules are selected by default for regular franchises.</span>
              )}
            </p>

            {modulesLoading ? (
              <div className="text-center py-3">
                <Spinner animation="border" size="sm" className="me-2" />
                Loading available modules...
              </div>
            ) : (
              <div className="border rounded p-3 mb-4">
                {Object.entries(getModulesByCategory()).map(([category, categoryModules]) => (
                  <div key={category} className="mb-4">
                    <h6 className="text-secondary mb-3">
                      {getCategoryDisplayName(category)}
                    </h6>
                    <Row>
                      {categoryModules.map((module) => (
                        <Col md={6} lg={4} key={module.id} className="mb-2">
                          <Form.Check
                            type="checkbox"
                            id={`module-${module.id}`}
                            label={
                              <div className="d-flex align-items-center">
                                <span className="me-2">{module.name}</span>
                                {module.is_core && (
                                  <Badge bg="info" size="sm">Core</Badge>
                                )}
                              </div>
                            }
                            checked={selectedPermissions.includes(module.id)}
                            onChange={(e) => handlePermissionChange(module.id, e.target.checked)}
                          />
                          <small className="text-muted d-block ms-3">
                            {module.description}
                          </small>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ))}

                {selectedPermissions.length > 0 && (
                  <div className="mt-3 p-2 bg-light rounded">
                    <small className="text-muted">
                      <FontAwesomeIcon icon={faCheck} className="me-1 text-success" />
                      {selectedPermissions.length} module(s) selected
                    </small>
                  </div>
                )}
              </div>
            )}

            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => navigate('/admin')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="me-2" />
                    Create Franchise
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default FranchiseCreate;
