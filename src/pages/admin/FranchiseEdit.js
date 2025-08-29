import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faBuilding, faShieldAlt, faCheck, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';

const FranchiseEdit = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [franchise, setFranchise] = useState([]);
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [validated, setValidated] = useState(false);
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
 const { id } = useParams();

  // Load modules for permissions
  const loadModules = async () => {
    try {
      setModulesLoading(true);
      const response = await adminAPI.getModules();
      setModules(response.data.data);
    } catch (err) {
      console.error('Error loading modules:', err);
      setError('Failed to load available modules');
    } finally {
      setModulesLoading(false);
    }
  };

  // Load franchise permissions
  const loadFranchisePermissions = async () => {
    try {
      const response = await adminAPI.getFranchisesWithPermissions();
      console.log('Franchise permissions response:', response.data);

      // Find the franchise data by matching franchise.id with the current id
      const franchiseData = response.data.data.find(f => f.franchise.id === parseInt(id));
      console.log('Found franchise data:', franchiseData);

      if (franchiseData && franchiseData.permissions && franchiseData.permissions.module_permissions) {
        console.log('Setting permissions:', franchiseData.permissions.module_permissions);
        setSelectedPermissions(franchiseData.permissions.module_permissions);
      } else {
        console.log('No permissions found for franchise, setting empty array');
        setSelectedPermissions([]);
      }
    } catch (err) {
      console.error('Error loading franchise permissions:', err);
      setSelectedPermissions([]);
    }
  };

  // Handle permission changes
  const handlePermissionChange = (moduleId, isChecked) => {
    setSelectedPermissions(prev => {
      if (isChecked) {
        return [...prev, moduleId];
      } else {
        return prev.filter(id => id !== moduleId);
      }
    });

    // Clear permission error when user selects permissions
    if (fieldErrors.permissions) {
      setFieldErrors(prev => ({
        ...prev,
        permissions: null
      }));
    }
  };

  // Group modules by category
  const getModulesByCategory = () => {
    const grouped = {};
    modules.forEach(module => {
      const category = module.category || 'general';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(module);
    });
    return grouped;
  };

  // Get category display name
  const getCategoryDisplayName = (category) => {
    const categoryNames = {
      'admin': 'Administration',
      'billing': 'Billing & Reports',
      'inventory': 'Inventory Management',
      'general': 'General Features'
    };
    return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

 console.log("franchise", franchise)

   useEffect(() => {
       const fetchData = async () => {
         try {
           setLoading(true);
           setError(null);

           console.log('Fetching franchise with ID:', id);

           // Load modules and franchise data in parallel
           await Promise.all([
             loadModules(),
             (async () => {
               const response = await adminAPI.getFranchiseById(id);
               console.log('Franchise response:', response);
               setFranchise(response.data);
               setFormData(prev => ({
                 ...prev,
                 ...response.data,
                 established_date: response.data.established_date ? response.data.established_date.split('T')[0] : ''
               }));
             })(),
             loadFranchisePermissions()
           ]);

         } catch (err) {
           console.error('Error fetching data:', err);
           console.error('Error details:', {
             message: err.message,
             response: err.response?.data,
             status: err.response?.status,
             url: err.config?.url
           });
           setError(`Failed to load franchise data. ${err.response?.data?.message || err.message || 'Please try again later.'}`);
         } finally {
           setLoading(false);
         }
       };

       fetchData();
     }, [id]); // eslint-disable-line react-hooks/exhaustive-deps


  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validate form fields
  const validateForm = () => {
    const errors = {};

    // Required field validation
    if (!formData.name?.trim()) {
      errors.name = 'Franchise name is required';
    }

    if (!formData.site_code?.trim()) {
      errors.site_code = 'Site code is required';
    }

    if (!formData.contact_phone?.trim()) {
      errors.contact_phone = 'Contact phone is required';
    }

    // Email validation (if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (formData.contact_phone) {
      const phoneDigits = formData.contact_phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        errors.contact_phone = 'Please enter a valid phone number (at least 10 digits)';
      }
    }

    // Permissions validation
    if (selectedPermissions.length === 0) {
      errors.permissions = 'Please select at least one module permission for the franchise';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidated(true);

    // Validate form
    if (!validateForm()) {
      setError('Please fix the errors below and try again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFieldErrors({});

      // Update franchise data
      await adminAPI.updateFranchise(id, formData);

      // Update permissions
      await adminAPI.updateFranchisePermissions(id, {
        module_permissions: selectedPermissions
      });

      // Reload permissions data to ensure UI reflects the current state
      await loadFranchisePermissions();

      setSuccess(true);
      setTimeout(() => {
        navigate('/admin');
      }, 2000);

    } catch (err) {
      console.error('Error updating franchise:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update franchise. Please try again.';
      setError(errorMessage);

      // Handle specific field errors
      if (err.response?.status === 400 && errorMessage.includes('Site code already exists')) {
        setFieldErrors({ site_code: 'This site code is already in use by another franchise' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="franchise-create-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faBuilding} className="me-2" />
          Edit Franchise
        </h1>
        <Button
          variant="secondary"
          onClick={() => navigate('/admin')}
          className="btn-sm"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to Admin
        </Button>
      </div>

      {/* Success Message */}
      {success && (
        <Alert variant="success">
          Franchise updated successfully! Redirecting to franchises list...
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
          <Form onSubmit={handleSubmit} noValidate validated={validated}>
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
                    isInvalid={!!fieldErrors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.name}
                  </Form.Control.Feedback>
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
                    isInvalid={!!fieldErrors.site_code}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.site_code}
                  </Form.Control.Feedback>
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
                    placeholder="e.g., 9876543210"
                    isInvalid={!!fieldErrors.contact_phone}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.contact_phone}
                  </Form.Control.Feedback>
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
                    placeholder="e.g., admin@franchise.avinilabs.com"
                    isInvalid={!!fieldErrors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.email}
                  </Form.Control.Feedback>
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
              <div className={`border rounded p-3 mb-4 ${fieldErrors.permissions ? 'border-danger' : ''}`}>
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

                {fieldErrors.permissions && (
                  <div className="mt-2">
                    <small className="text-danger">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                      {fieldErrors.permissions}
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
                    Updating...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="me-2" />
                    Update Franchise
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

export default FranchiseEdit;
