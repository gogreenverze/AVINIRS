import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Table, Badge, Alert, Modal, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faEdit, faTrash, faSave, faTimes, faInfoCircle,
  faCheckCircle, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import dynamicPricingService from '../../services/dynamicPricingService';
import referrerMasterData from '../../data/referrerMasterData.json';

const DynamicPricingManager = () => {
  const [testPricingData, setTestPricingData] = useState({});
  const [selectedTest, setSelectedTest] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [newPricing, setNewPricing] = useState({
    testId: '',
    testName: '',
    defaultPrice: 0,
    scheme: 'standard',
    referralSource: 'self',
    price: 0
  });

  useEffect(() => {
    loadPricingData();
    validateConfiguration();
  }, []);

  const loadPricingData = () => {
    // In a real implementation, this would fetch from an API
    // For now, we'll use the static configuration
    try {
      const config = dynamicPricingService.config;
      setTestPricingData(config.testPricingMappings);
    } catch (error) {
      setErrorMessage('Failed to load pricing data');
    }
  };

  const validateConfiguration = () => {
    const result = dynamicPricingService.validateConfiguration();
    setValidationResult(result);
  };

  const handleAddPricing = () => {
    setNewPricing({
      testId: '',
      testName: '',
      defaultPrice: 0,
      scheme: 'standard',
      referralSource: 'self',
      price: 0
    });
    setShowAddModal(true);
  };

  const handleEditPricing = (testId, scheme, referralSource) => {
    const testConfig = testPricingData[testId];
    if (testConfig && testConfig.schemes[scheme] && testConfig.schemes[scheme].referralSources[referralSource]) {
      setEditingItem({
        testId,
        testName: testConfig.testName,
        scheme,
        referralSource,
        price: testConfig.schemes[scheme].referralSources[referralSource],
        defaultPrice: testConfig.defaultPrice
      });
      setShowEditModal(true);
    }
  };

  const handleSaveNewPricing = () => {
    // In a real implementation, this would save to an API
    setSuccessMessage('Pricing configuration saved successfully!');
    setShowAddModal(false);
    loadPricingData();
  };

  const handleSaveEditPricing = () => {
    // In a real implementation, this would update via API
    setSuccessMessage('Pricing configuration updated successfully!');
    setShowEditModal(false);
    loadPricingData();
  };

  const getPricingMatrix = (testId) => {
    return dynamicPricingService.getTestPricingMatrix(testId);
  };

  const getSchemeColor = (scheme) => {
    const colors = {
      standard: 'primary',
      corporate: 'success',
      insurance: 'info',
      promotional: 'warning'
    };
    return colors[scheme] || 'secondary';
  };

  const getReferralColor = (referral) => {
    const colors = {
      doctor: 'primary',
      self: 'secondary',
      hospital: 'success',
      corporate: 'info',
      insurance: 'warning',
      lab: 'dark'
    };
    return colors[referral] || 'light';
  };

  return (
    <div className="dynamic-pricing-manager">
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Dynamic Pricing Configuration</h5>
          <Button variant="primary" onClick={handleAddPricing}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add Pricing Rule
          </Button>
        </Card.Header>
        <Card.Body>
          {/* Validation Status */}
          {validationResult && (
            <Alert variant={validationResult.isValid ? 'success' : 'warning'} className="mb-3">
              <FontAwesomeIcon 
                icon={validationResult.isValid ? faCheckCircle : faExclamationTriangle} 
                className="me-2" 
              />
              Configuration Status: {validationResult.isValid ? 'Valid' : 'Has Issues'}
              {validationResult.warnings.length > 0 && (
                <ul className="mb-0 mt-2">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              )}
            </Alert>
          )}

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

          {/* Test Selection */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Select Test to View/Edit Pricing</Form.Label>
                <Form.Select
                  value={selectedTest}
                  onChange={(e) => setSelectedTest(e.target.value)}
                >
                  <option value="">Select a test...</option>
                  {Object.keys(testPricingData).map((testId) => (
                    <option key={testId} value={testId}>
                      {testPricingData[testId].testName} ({testId})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Pricing Matrix for Selected Test */}
          {selectedTest && testPricingData[selectedTest] && (
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">
                  Pricing Matrix: {testPricingData[selectedTest].testName}
                  <Badge bg="secondary" className="ms-2">
                    Default: ₹{testPricingData[selectedTest].defaultPrice}
                  </Badge>
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Scheme</th>
                        <th>Default Price</th>
                        {referrerMasterData.referrerTypes.map((type) => (
                          <th key={type.id}>{type.name}</th>
                        ))}
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(testPricingData[selectedTest].schemes).map((schemeId) => {
                        const scheme = testPricingData[selectedTest].schemes[schemeId];
                        return (
                          <tr key={schemeId}>
                            <td>
                              <Badge bg={getSchemeColor(schemeId)}>
                                {schemeId}
                              </Badge>
                            </td>
                            <td>₹{scheme.price}</td>
                            {referrerMasterData.referrerTypes.map((type) => (
                              <td key={type.id}>
                                {scheme.referralSources && scheme.referralSources[type.id] ? (
                                  <span>
                                    ₹{scheme.referralSources[type.id]}
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      className="ms-1"
                                      onClick={() => handleEditPricing(selectedTest, schemeId, type.id)}
                                    >
                                      <FontAwesomeIcon icon={faEdit} />
                                    </Button>
                                  </span>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                            ))}
                            <td>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleEditPricing(selectedTest, schemeId, 'self')}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Available Schemes and Referral Sources */}
          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Available Pricing Schemes</h6>
                </Card.Header>
                <Card.Body>
                  {dynamicPricingService.getAvailableSchemes().map((scheme) => (
                    <Badge 
                      key={scheme.id} 
                      bg={getSchemeColor(scheme.id)} 
                      className="me-2 mb-2"
                    >
                      {scheme.name}
                      {scheme.isDefault && <span className="ms-1">(Default)</span>}
                    </Badge>
                  ))}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Available Referral Sources</h6>
                </Card.Header>
                <Card.Body>
                  {referrerMasterData.referrerTypes.map((type) => (
                    <Badge 
                      key={type.id} 
                      bg={getReferralColor(type.id)} 
                      className="me-2 mb-2"
                    >
                      {type.name}
                    </Badge>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Add Pricing Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Pricing Rule</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Test ID</Form.Label>
                  <Form.Control
                    type="text"
                    value={newPricing.testId}
                    onChange={(e) => setNewPricing({...newPricing, testId: e.target.value})}
                    placeholder="e.g., @000003"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Test Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={newPricing.testName}
                    onChange={(e) => setNewPricing({...newPricing, testName: e.target.value})}
                    placeholder="Test name"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Pricing Scheme</Form.Label>
                  <Form.Select
                    value={newPricing.scheme}
                    onChange={(e) => setNewPricing({...newPricing, scheme: e.target.value})}
                  >
                    {dynamicPricingService.getAvailableSchemes().map((scheme) => (
                      <option key={scheme.id} value={scheme.id}>
                        {scheme.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Referral Source</Form.Label>
                  <Form.Select
                    value={newPricing.referralSource}
                    onChange={(e) => setNewPricing({...newPricing, referralSource: e.target.value})}
                  >
                    {referrerMasterData.referrerTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Price</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>₹</InputGroup.Text>
                    <Form.Control
                      type="number"
                      value={newPricing.price}
                      onChange={(e) => setNewPricing({...newPricing, price: parseFloat(e.target.value) || 0})}
                      step="0.01"
                      min="0"
                    />
                  </InputGroup>
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
          <Button variant="primary" onClick={handleSaveNewPricing}>
            <FontAwesomeIcon icon={faSave} className="me-2" />
            Save Pricing Rule
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Pricing Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Pricing Rule</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingItem && (
            <Form>
              <Alert variant="info">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                Editing: {editingItem.testName} - {editingItem.scheme} scheme for {editingItem.referralSource} referrals
              </Alert>
              <Form.Group className="mb-3">
                <Form.Label>Price</Form.Label>
                <InputGroup>
                  <InputGroup.Text>₹</InputGroup.Text>
                  <Form.Control
                    type="number"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({...editingItem, price: parseFloat(e.target.value) || 0})}
                    step="0.01"
                    min="0"
                  />
                </InputGroup>
                <Form.Text className="text-muted">
                  Default price for this test: ₹{editingItem.defaultPrice}
                </Form.Text>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            <FontAwesomeIcon icon={faTimes} className="me-2" />
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEditPricing}>
            <FontAwesomeIcon icon={faSave} className="me-2" />
            Update Price
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DynamicPricingManager;
