import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Table, Badge, Alert, Modal, InputGroup, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faEdit, faTrash, faSave, faTimes, faInfoCircle,
  faCheckCircle, faExclamationTriangle, faUsers, faPercentage,
  faMoneyBillWave, faChartLine, faCog, faFileInvoiceDollar, faFileImport
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import dynamicPricingService from '../../services/dynamicPricingService';
import referralValidationService from '../../services/referralValidationService';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';
import LabToLabPricingImport from './LabToLabPricingImport';

const ReferralMasterManagement = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { hasModuleAccess } = usePermissions();
  const [referralSources, setReferralSources] = useState([]);
  const [pricingSchemes, setPricingSchemes] = useState([]);
  const [selectedReferral, setSelectedReferral] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReferral, setEditingReferral] = useState(null);
  const [showEditSchemeModal, setShowEditSchemeModal] = useState(false);
  const [showConfigureSchemeModal, setShowConfigureSchemeModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);
  const [activeTab, setActiveTab] = useState('referrals');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [newReferral, setNewReferral] = useState({
    id: '',
    name: '',
    description: '',
    referralType: 'Doctor', // New field for specific referral types
    category: 'medical',
    defaultPricingScheme: 'standard',
    discountPercentage: 0,
    commissionPercentage: 0,
    isActive: true,
    priority: 1,
    // Common fields for all types
    email: '',
    phone: '',
    address: '',
    // Type-specific fields
    typeSpecificFields: {}
  });

  // Define referral types and their specific fields
  const referralTypes = {
    'Doctor': {
      category: 'medical',
      specificFields: [
        { name: 'specialization', label: 'Specialization', type: 'text', required: true, placeholder: 'e.g., Cardiology, Neurology' }
      ]
    },
    'Hospital': {
      category: 'institutional',
      specificFields: [
        { name: 'branch', label: 'Branch/Department', type: 'text', required: true, placeholder: 'e.g., Emergency, ICU, Cardiology Wing' }
      ]
    },
    'Lab': {
      category: 'institutional',
      specificFields: [
        { name: 'accreditation', label: 'Accreditation Details', type: 'text', required: true, placeholder: 'e.g., NABL, CAP, ISO 15189' }
      ]
    },
    'Corporate': {
      category: 'corporate',
      specificFields: [
        { name: 'registrationDetails', label: 'Company Registration Details', type: 'text', required: true, placeholder: 'e.g., CIN, Registration Number' }
      ]
    },
    'Insurance': {
      category: 'insurance',
      specificFields: [
        { name: 'policyCoverage', label: 'Policy Coverage Details', type: 'text', required: true, placeholder: 'e.g., Coverage limits, Policy types' }
      ]
    },
    'Patient': {
      category: 'direct',
      specificFields: [
        { name: 'patientReference', label: 'Patient ID/Reference', type: 'text', required: false, placeholder: 'e.g., Patient ID, Reference number' }
      ]
    }
  };

  useEffect(() => {
    loadReferralData();
  }, []);

  // Check if user has access to Referral Master
  const hasViewAccess = hasModuleAccess('REFERRAL_MASTER') || currentUser?.role === 'admin' || currentUser?.role === 'hub_admin';
  const hasManageAccess = currentUser?.role === 'admin' || currentUser?.role === 'hub_admin';

  if (!hasViewAccess) {
    return (
      <div className="referral-master-management">
        <Alert variant="warning">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          You don't have permission to access Referral Master. Please contact your administrator.
        </Alert>
      </div>
    );
  }

  const loadReferralData = async () => {
    try {
      setErrorMessage('');
      setSuccessMessage('');

      // Load referral sources from API
      const referrals = await dynamicPricingService.getAvailableReferralSourcesAsync();
      const schemes = dynamicPricingService.getAvailableSchemes();

      setReferralSources(referrals);
      setPricingSchemes(schemes);
    } catch (error) {
      console.error('Error loading referral data:', error);
      setErrorMessage('Failed to load referral data: ' + error.message);
    }
  };

  const handleAddReferral = () => {
    setNewReferral({
      id: '',
      name: '',
      description: '',
      referralType: 'Doctor',
      category: 'medical',
      defaultPricingScheme: 'standard',
      discountPercentage: 0,
      commissionPercentage: 0,
      isActive: true,
      priority: 1,
      email: '',
      phone: '',
      address: '',
      typeSpecificFields: {}
    });
    setShowAddModal(true);
  };

  // Handle referral type change and update category automatically
  const handleReferralTypeChange = (type) => {
    const typeConfig = referralTypes[type];
    setNewReferral(prev => ({
      ...prev,
      referralType: type,
      category: typeConfig.category,
      typeSpecificFields: {} // Reset type-specific fields
    }));
  };

  // Handle type-specific field changes
  const handleTypeSpecificFieldChange = (fieldName, value) => {
    setNewReferral(prev => ({
      ...prev,
      typeSpecificFields: {
        ...prev.typeSpecificFields,
        [fieldName]: value
      }
    }));
  };

  // Handle import completion
  const handleImportComplete = () => {
    setSuccessMessage('Lab-to-Lab pricing data imported successfully');
    setShowImportModal(false);
    // Optionally reload pricing schemes if needed
    loadReferralData();
  };

  const handleEditReferral = (referral) => {
    setEditingReferral({ ...referral });
    setShowEditModal(true);
  };

  const handleSaveNewReferral = async () => {
    try {
      setErrorMessage('');

      // Comprehensive validation using validation service
      const validationResult = referralValidationService.validateReferralData(newReferral);

      if (!validationResult.isValid) {
        setErrorMessage('Validation failed:\n• ' + validationResult.errors.join('\n• '));
        return;
      }

      // Check ID uniqueness
      if (!referralValidationService.validateIdUniqueness(newReferral.id, referralSources)) {
        setErrorMessage('A referral source with this ID already exists');
        return;
      }

      // Show warnings if any (optional - could be displayed to user)
      if (validationResult.warnings.length > 0) {
        console.warn('Validation warnings:', validationResult.warnings);
      }

      // Save via API
      await dynamicPricingService.addReferralSource(newReferral);

      setSuccessMessage('Referral source added successfully!');
      setShowAddModal(false);

      // Reset form
      setNewReferral({
        id: '',
        name: '',
        description: '',
        category: 'medical',
        defaultPricingScheme: 'standard',
        discountPercentage: 0,
        commissionPercentage: 0,
        isActive: true,
        priority: 1
      });

      // Reload data
      await loadReferralData();
    } catch (error) {
      console.error('Error saving referral source:', error);
      setErrorMessage('Failed to save referral source: ' + error.message);
    }
  };

  const handleSaveEditReferral = async () => {
    try {
      setErrorMessage('');

      // Validate required fields
      if (!editingReferral.name || !editingReferral.description) {
        setErrorMessage('Please fill in all required fields (Name, Description)');
        return;
      }

      // Save via API
      await dynamicPricingService.updateReferralSource(editingReferral.id, editingReferral);

      setSuccessMessage('Referral source updated successfully!');
      setShowEditModal(false);
      setEditingReferral(null);

      // Reload data
      await loadReferralData();
    } catch (error) {
      console.error('Error updating referral source:', error);
      setErrorMessage('Failed to update referral source: ' + error.message);
    }
  };

  const handleDeleteReferral = async (referral) => {
    if (!window.confirm(`Are you sure you want to delete "${referral.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setErrorMessage('');

      // Delete via API
      await dynamicPricingService.deleteReferralSource(referral.id);

      setSuccessMessage('Referral source deleted successfully!');

      // Reload data
      await loadReferralData();
    } catch (error) {
      console.error('Error deleting referral source:', error);
      setErrorMessage('Failed to delete referral source: ' + error.message);
    }
  };

  const handleEditScheme = (scheme) => {
    setEditingScheme({ ...scheme });
    setShowEditSchemeModal(true);
  };

  const handleConfigureScheme = (scheme) => {
    setEditingScheme({ ...scheme });
    setShowConfigureSchemeModal(true);
  };

  const handleSaveScheme = () => {
    // In a real implementation, this would save to an API
    setSuccessMessage('Pricing scheme updated successfully!');
    setShowEditSchemeModal(false);
    setEditingScheme(null);
    loadReferralData();
  };

  const handleSaveSchemeConfiguration = () => {
    // In a real implementation, this would save configuration to an API
    setSuccessMessage('Pricing scheme configuration saved successfully!');
    setShowConfigureSchemeModal(false);
    setEditingScheme(null);
    loadReferralData();
  };

  const getCategoryColor = (category) => {
    const colors = {
      medical: 'primary',
      direct: 'secondary',
      institutional: 'success',
      corporate: 'info',
      insurance: 'warning',
      professional: 'dark',
      digital: 'light',
      urgent: 'danger'
    };
    return colors[category] || 'secondary';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculatePricingExample = (referralId) => {
    // Example calculation for a standard test
    const exampleTestId = '@000003';
    const pricing = dynamicPricingService.getPricingBreakdown(exampleTestId, referralId, { volume: 1 });
    return pricing;
  };

  return (
    <div className="referral-master-management">
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FontAwesomeIcon icon={faUsers} className="me-2" />
            Referral Master Management
          </h5>
          <div className="d-flex gap-2">
            <Button
              variant="outline-success"
              onClick={() => navigate('/billing/registration')}
              title="Quick access to Billing Registration"
            >
              <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
              Billing Registration
            </Button>
            {hasManageAccess && (
              <Button variant="primary" onClick={handleAddReferral}>
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Add Referral Source
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          {/* Success/Error Messages */}
          {successMessage && (
            <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
              {successMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert variant="danger" dismissible onClose={() => setErrorMessage('')}>
              {errorMessage}
            </Alert>
          )}

          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
            {/* Referral Sources Tab */}
            <Tab eventKey="referrals" title={
              <span>
                <FontAwesomeIcon icon={faUsers} className="me-2" />
                Referral Sources
              </span>
            }>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead className="table-dark">
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Default Scheme</th>
                      <th>Discount %</th>
                      <th>Commission %</th>
                      <th>Status</th>
                      <th>Example Pricing</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralSources.map((referral) => {
                      const pricingExample = calculatePricingExample(referral.id);
                      return (
                        <tr key={referral.id}>
                          <td>
                            <div>
                              <strong>{referral.name}</strong>
                              <br />
                              <small className="text-muted">{referral.description}</small>
                            </div>
                          </td>
                          <td>
                            <Badge bg={getCategoryColor(referral.category)}>
                              {referral.category}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg="info">
                              {referral.defaultPricingScheme || 'standard'}
                            </Badge>
                          </td>
                          <td>
                            <span className="text-success">
                              <FontAwesomeIcon icon={faPercentage} className="me-1" />
                              {referral.discountPercentage || 0}%
                            </span>
                          </td>
                          <td>
                            <span className="text-primary">
                              <FontAwesomeIcon icon={faMoneyBillWave} className="me-1" />
                              {referral.commissionPercentage || 0}%
                            </span>
                          </td>
                          <td>
                            <Badge bg={referral.isActive !== false ? 'success' : 'danger'}>
                              {referral.isActive !== false ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td>
                            {pricingExample && (
                              <div>
                                <small>
                                  Base: {formatCurrency(pricingExample.breakdown?.basePrice || 0)}
                                  <br />
                                  Final: <strong>{formatCurrency(pricingExample.price)}</strong>
                                  {pricingExample.breakdown?.savings > 0 && (
                                    <>
                                      <br />
                                      <span className="text-success">
                                        Save: {formatCurrency(pricingExample.breakdown.savings)}
                                      </span>
                                    </>
                                  )}
                                </small>
                              </div>
                            )}
                          </td>
                          <td>
                            {hasManageAccess ? (
                              <>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => handleEditReferral(referral)}
                                  title="Edit Referral Source"
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteReferral(referral)}
                                  title="Delete Referral Source"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </Button>
                              </>
                            ) : (
                              <Badge bg="secondary">View Only</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Tab>

            {/* Pricing Schemes Tab */}
            <Tab eventKey="schemes" title={
              <span>
                <FontAwesomeIcon icon={faChartLine} className="me-2" />
                Pricing Schemes
              </span>
            }>
              {/* Import Button for Lab-to-Lab Pricing */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Pricing Schemes Management</h6>
                {hasManageAccess && (
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => setShowImportModal(true)}
                  >
                    <FontAwesomeIcon icon={faFileImport} className="me-2" />
                    Import Lab-to-Lab Pricing
                  </Button>
                )}
              </div>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead className="table-dark">
                    <tr>
                      <th>Scheme Name</th>
                      <th>Description</th>
                      <th>Base Multiplier</th>
                      <th>Applicable Referrals</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingSchemes.map((scheme) => (
                      <tr key={scheme.id}>
                        <td>
                          <strong>{scheme.name}</strong>
                          {scheme.isDefault && (
                            <Badge bg="warning" className="ms-2">Default</Badge>
                          )}
                        </td>
                        <td>{scheme.description}</td>
                        <td>
                          <Badge bg="info">
                            {scheme.baseMultiplier || 1.0}x
                          </Badge>
                        </td>
                        <td>
                          {scheme.applicableReferrals?.map(ref => (
                            <Badge key={ref} bg="secondary" className="me-1 mb-1">
                              {ref}
                            </Badge>
                          ))}
                        </td>
                        <td>
                          <Badge bg={scheme.isActive !== false ? 'success' : 'danger'}>
                            {scheme.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          {hasManageAccess ? (
                            <>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-1"
                                onClick={() => handleEditScheme(scheme)}
                                title="Edit Pricing Scheme"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleConfigureScheme(scheme)}
                                title="Configure Scheme Settings"
                              >
                                <FontAwesomeIcon icon={faCog} />
                              </Button>
                            </>
                          ) : (
                            <Badge bg="secondary">View Only</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Tab>

            {/* Commission Rules Tab */}
            <Tab eventKey="commission" title={
              <span>
                <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                Commission Rules
              </span>
            }>
              <Row>
                <Col md={12}>
                  <Alert variant="info">
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                    Commission rules define how referral partners are compensated for bringing in business.
                  </Alert>
                  
                  <div className="table-responsive">
                    <Table striped bordered hover>
                      <thead className="table-dark">
                        <tr>
                          <th>Referral Source</th>
                          <th>Commission %</th>
                          <th>Minimum Amount</th>
                          <th>Payment Cycle</th>
                          <th>Example Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referralSources
                          .filter(ref => (ref.commissionPercentage || 0) > 0)
                          .map((referral) => {
                            const exampleAmount = 5000;
                            const commission = (exampleAmount * (referral.commissionPercentage || 0)) / 100;
                            return (
                              <tr key={referral.id}>
                                <td>
                                  <strong>{referral.name}</strong>
                                </td>
                                <td>
                                  <Badge bg="primary">
                                    {referral.commissionPercentage}%
                                  </Badge>
                                </td>
                                <td>{formatCurrency(100)}</td>
                                <td>
                                  <Badge bg="info">Monthly</Badge>
                                </td>
                                <td>
                                  <small>
                                    On {formatCurrency(exampleAmount)}: <strong>{formatCurrency(commission)}</strong>
                                  </small>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </Table>
                  </div>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Add Referral Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Referral Source</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorMessage && (
            <Alert variant="danger" className="mb-3">
              {errorMessage}
            </Alert>
          )}
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Referral ID <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={newReferral.id}
                    onChange={(e) => setNewReferral({...newReferral, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                    placeholder="e.g., new_hospital"
                    isInvalid={!newReferral.id}
                    required
                  />
                  <Form.Text className="text-muted">
                    Unique identifier (lowercase letters, numbers, underscores only)
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={newReferral.name}
                    onChange={(e) => setNewReferral({...newReferral, name: e.target.value})}
                    placeholder="Display name"
                    isInvalid={!newReferral.name}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={newReferral.description}
                    onChange={(e) => setNewReferral({...newReferral, description: e.target.value})}
                    placeholder="Description of this referral source"
                    isInvalid={!newReferral.description}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            {/* Referral Type Selection */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Referral Type <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={newReferral.referralType}
                    onChange={(e) => handleReferralTypeChange(e.target.value)}
                  >
                    {Object.keys(referralTypes).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Category: {referralTypes[newReferral.referralType]?.category}
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Default Pricing Scheme</Form.Label>
                  <Form.Select
                    value={newReferral.defaultPricingScheme}
                    onChange={(e) => setNewReferral({...newReferral, defaultPricingScheme: e.target.value})}
                  >
                    {pricingSchemes.map((scheme) => (
                      <option key={scheme.id} value={scheme.id}>
                        {scheme.name} - {scheme.description}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Common Fields for All Types */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="email"
                    value={newReferral.email}
                    onChange={(e) => setNewReferral({...newReferral, email: e.target.value})}
                    placeholder="contact@example.com"
                    isInvalid={!newReferral.email}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="tel"
                    value={newReferral.phone}
                    onChange={(e) => setNewReferral({...newReferral, phone: e.target.value})}
                    placeholder="+91 9876543210"
                    isInvalid={!newReferral.phone}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Address <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={newReferral.address}
                    onChange={(e) => setNewReferral({...newReferral, address: e.target.value})}
                    placeholder="Complete address"
                    isInvalid={!newReferral.address}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Type-Specific Fields */}
            {referralTypes[newReferral.referralType]?.specificFields.length > 0 && (
              <>
                <hr />
                <h6 className="text-primary mb-3">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  {newReferral.referralType}-Specific Information
                </h6>
                <Row>
                  {referralTypes[newReferral.referralType].specificFields.map((field) => (
                    <Col md={6} key={field.name}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          {field.label} {field.required && <span className="text-danger">*</span>}
                        </Form.Label>
                        <Form.Control
                          type={field.type}
                          value={newReferral.typeSpecificFields[field.name] || ''}
                          onChange={(e) => handleTypeSpecificFieldChange(field.name, e.target.value)}
                          placeholder={field.placeholder}
                          isInvalid={field.required && !newReferral.typeSpecificFields[field.name]}
                          required={field.required}
                        />
                      </Form.Group>
                    </Col>
                  ))}
                </Row>
                <hr />
              </>
            )}

            {/* Pricing Configuration */}
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Percentage</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      value={newReferral.discountPercentage}
                      onChange={(e) => setNewReferral({...newReferral, discountPercentage: parseFloat(e.target.value) || 0})}
                      step="0.1"
                      min="0"
                      max="50"
                    />
                    <InputGroup.Text>%</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Commission Percentage</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      value={newReferral.commissionPercentage}
                      onChange={(e) => setNewReferral({...newReferral, commissionPercentage: parseFloat(e.target.value) || 0})}
                      step="0.1"
                      min="0"
                      max="25"
                    />
                    <InputGroup.Text>%</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Control
                    type="number"
                    value={newReferral.priority}
                    onChange={(e) => setNewReferral({...newReferral, priority: parseInt(e.target.value) || 1})}
                    min="1"
                    max="10"
                  />
                  <Form.Text className="text-muted">
                    Lower numbers appear first in dropdowns
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            <FontAwesomeIcon icon={faTimes} className="me-2" />
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveNewReferral}>
            <FontAwesomeIcon icon={faSave} className="me-2" />
            Save Referral Source
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Referral Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Referral Source</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingReferral && (
            <Form>
              <Alert variant="info">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                Editing: {editingReferral.name}
              </Alert>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={editingReferral.name}
                      onChange={(e) => setEditingReferral({...editingReferral, name: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      value={editingReferral.category}
                      onChange={(e) => setEditingReferral({...editingReferral, category: e.target.value})}
                    >
                      <option value="medical">Medical</option>
                      <option value="direct">Direct</option>
                      <option value="institutional">Institutional</option>
                      <option value="corporate">Corporate</option>
                      <option value="insurance">Insurance</option>
                      <option value="professional">Professional</option>
                      <option value="digital">Digital</option>
                      <option value="urgent">Urgent</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Discount Percentage</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        value={editingReferral.discountPercentage}
                        onChange={(e) => setEditingReferral({...editingReferral, discountPercentage: parseFloat(e.target.value) || 0})}
                        step="0.1"
                        min="0"
                        max="50"
                      />
                      <InputGroup.Text>%</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Commission Percentage</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        value={editingReferral.commissionPercentage}
                        onChange={(e) => setEditingReferral({...editingReferral, commissionPercentage: parseFloat(e.target.value) || 0})}
                        step="0.1"
                        min="0"
                        max="25"
                      />
                      <InputGroup.Text>%</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            <FontAwesomeIcon icon={faTimes} className="me-2" />
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEditReferral}>
            <FontAwesomeIcon icon={faSave} className="me-2" />
            Update Referral Source
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Pricing Scheme Modal */}
      <Modal show={showEditSchemeModal} onHide={() => setShowEditSchemeModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Pricing Scheme</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingScheme && (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Scheme Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={editingScheme.name || ''}
                      onChange={(e) => setEditingScheme({...editingScheme, name: e.target.value})}
                      placeholder="Scheme name"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Base Multiplier</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        value={editingScheme.baseMultiplier || 1.0}
                        onChange={(e) => setEditingScheme({...editingScheme, baseMultiplier: parseFloat(e.target.value) || 1.0})}
                        step="0.1"
                        min="0.1"
                        max="5.0"
                      />
                      <InputGroup.Text>x</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={editingScheme.description || ''}
                      onChange={(e) => setEditingScheme({...editingScheme, description: e.target.value})}
                      placeholder="Scheme description"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Set as Default Scheme"
                      checked={editingScheme.isDefault || false}
                      onChange={(e) => setEditingScheme({...editingScheme, isDefault: e.target.checked})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Active"
                      checked={editingScheme.isActive !== false}
                      onChange={(e) => setEditingScheme({...editingScheme, isActive: e.target.checked})}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditSchemeModal(false)}>
            <FontAwesomeIcon icon={faTimes} className="me-2" />
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveScheme}>
            <FontAwesomeIcon icon={faSave} className="me-2" />
            Save Scheme
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Configure Pricing Scheme Modal */}
      <Modal show={showConfigureSchemeModal} onHide={() => setShowConfigureSchemeModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Configure Pricing Scheme</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingScheme && (
            <div>
              <Alert variant="info">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                Configure advanced settings for the <strong>{editingScheme.name}</strong> pricing scheme.
              </Alert>

              <Tabs defaultActiveKey="referralPricing" className="mb-3">
                <Tab eventKey="referralPricing" title="Referral Pricing">
                  <Row>
                    <Col md={12}>
                      <h6>Referral-Specific Pricing</h6>
                      <p className="text-muted">Set specific pricing for different referral sources under this scheme.</p>

                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Referral Source</th>
                            <th>Custom Price Multiplier</th>
                            <th>Additional Discount %</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {referralSources.slice(0, 3).map((referral) => (
                            <tr key={referral.id}>
                              <td>{referral.name}</td>
                              <td>
                                <Form.Control
                                  type="number"
                                  size="sm"
                                  defaultValue="1.0"
                                  step="0.1"
                                  min="0.1"
                                  max="3.0"
                                />
                              </td>
                              <td>
                                <Form.Control
                                  type="number"
                                  size="sm"
                                  defaultValue="0"
                                  step="1"
                                  min="0"
                                  max="50"
                                />
                              </td>
                              <td>
                                <Button variant="outline-success" size="sm">
                                  <FontAwesomeIcon icon={faSave} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                </Tab>

                <Tab eventKey="volumeDiscounts" title="Volume Discounts">
                  <Row>
                    <Col md={12}>
                      <h6>Volume-Based Discounts</h6>
                      <p className="text-muted">Configure discounts based on test volume.</p>

                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>5+ Tests Discount (%)</Form.Label>
                            <Form.Control type="number" defaultValue="5" min="0" max="25" />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>10+ Tests Discount (%)</Form.Label>
                            <Form.Control type="number" defaultValue="10" min="0" max="25" />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>20+ Tests Discount (%)</Form.Label>
                            <Form.Control type="number" defaultValue="15" min="0" max="25" />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Tab>
              </Tabs>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfigureSchemeModal(false)}>
            <FontAwesomeIcon icon={faTimes} className="me-2" />
            Cancel
          </Button>
          <Button variant="success" onClick={handleSaveSchemeConfiguration}>
            <FontAwesomeIcon icon={faSave} className="me-2" />
            Save Configuration
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Lab-to-Lab Pricing Import Modal */}
      {showImportModal && (
        <LabToLabPricingImport
          onImportComplete={handleImportComplete}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
};

export default ReferralMasterManagement;
