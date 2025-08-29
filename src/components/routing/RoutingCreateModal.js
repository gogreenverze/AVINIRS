import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faVial, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { routingAPI, sampleAPI, tenantAPI } from '../../services/api';
import { useTenant } from '../../context/TenantContext';
import PropTypes from 'prop-types';

const RoutingCreateModal = ({ show, onHide, onRoutingCreated }) => {
  const { tenantData } = useTenant();
  
  const [formData, setFormData] = useState({
    sample_id: '',
    to_tenant_id: '',
    reason: '',
    notes: '',
    priority: 'normal',
    expected_delivery_date: '',
    special_instructions: '',
    temperature_requirements: 'room_temperature',
    handling_requirements: []
  });

  const [samples, setSamples] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch available samples and tenants
  useEffect(() => {
    if (show) {
      fetchSamples();
      fetchTenants();
    }
  }, [show]);

  const fetchSamples = async () => {
    try {
      const response = await sampleAPI.getSamples({ limit: 100 });
      // Filter samples that don't have active routings
      const availableSamples = response.data.items?.filter(sample => 
        sample.status !== 'In Transit' && sample.status !== 'Transferred'
      ) || [];
      setSamples(availableSamples);
    } catch (err) {
      console.error('Error fetching samples:', err);
      setError('Failed to load samples');
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await tenantAPI.getAccessibleTenants();
      // Filter out current tenant
      const otherTenants = response.data.filter(tenant => 
        tenant.id !== tenantData?.id && tenant.is_active
      );
      setTenants(otherTenants);
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError('Failed to load facilities');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'handling_requirements') {
        setFormData(prev => ({
          ...prev,
          handling_requirements: checked 
            ? [...prev.handling_requirements, value]
            : prev.handling_requirements.filter(req => req !== value)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.sample_id) {
      errors.sample_id = 'Please select a sample';
    }

    if (!formData.to_tenant_id) {
      errors.to_tenant_id = 'Please select a destination facility';
    }

    if (!formData.reason.trim()) {
      errors.reason = 'Please provide a reason for routing';
    }

    if (formData.expected_delivery_date) {
      const deliveryDate = new Date(formData.expected_delivery_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deliveryDate < today) {
        errors.expected_delivery_date = 'Expected delivery date cannot be in the past';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        sample_id: parseInt(formData.sample_id),
        to_tenant_id: parseInt(formData.to_tenant_id)
      };

      await routingAPI.createRouting(submitData);
      
      // Reset form
      setFormData({
        sample_id: '',
        to_tenant_id: '',
        reason: '',
        notes: '',
        priority: 'normal',
        expected_delivery_date: '',
        special_instructions: '',
        temperature_requirements: 'room_temperature',
        handling_requirements: []
      });

      onRoutingCreated();
    } catch (err) {
      console.error('Error creating routing:', err);
      setError(err.response?.data?.message || 'Failed to create routing request');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      sample_id: '',
      to_tenant_id: '',
      reason: '',
      notes: '',
      priority: 'normal',
      expected_delivery_date: '',
      special_instructions: '',
      temperature_requirements: 'room_temperature',
      handling_requirements: []
    });
    setError(null);
    setValidationErrors({});
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Create Sample Routing Request
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              <FontAwesomeIcon icon={faTimes} className="me-2" />
              {error}
            </Alert>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FontAwesomeIcon icon={faVial} className="me-1" />
                  Sample *
                </Form.Label>
                <Form.Select
                  name="sample_id"
                  value={formData.sample_id}
                  onChange={handleInputChange}
                  isInvalid={!!validationErrors.sample_id}
                  required
                >
                  <option value="">Select a sample...</option>
                  {samples.map(sample => (
                    <option key={sample.id} value={sample.id}>
                      {sample.sample_id} - {sample.sample_type} 
                      {sample.patient && ` (${sample.patient.first_name} ${sample.patient.last_name})`}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {validationErrors.sample_id}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" />
                  Destination Facility *
                </Form.Label>
                <Form.Select
                  name="to_tenant_id"
                  value={formData.to_tenant_id}
                  onChange={handleInputChange}
                  isInvalid={!!validationErrors.to_tenant_id}
                  required
                >
                  <option value="">Select destination...</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.site_code})
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {validationErrors.to_tenant_id}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>Reason for Routing *</Form.Label>
                <Form.Control
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="e.g., Specialized testing required"
                  isInvalid={!!validationErrors.reason}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.reason}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Priority</Form.Label>
                <Form.Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Temperature Requirements</Form.Label>
                <Form.Select
                  name="temperature_requirements"
                  value={formData.temperature_requirements}
                  onChange={handleInputChange}
                >
                  <option value="room_temperature">Room Temperature</option>
                  <option value="cold">Cold (2-8°C)</option>
                  <option value="frozen">Frozen (-20°C)</option>
                  <option value="ultra_frozen">Ultra Frozen (-80°C)</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Expected Delivery Date</Form.Label>
                <Form.Control
                  type="date"
                  name="expected_delivery_date"
                  value={formData.expected_delivery_date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  isInvalid={!!validationErrors.expected_delivery_date}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.expected_delivery_date}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Special Handling Requirements</Form.Label>
            <div className="d-flex flex-wrap gap-3">
              {['fragile', 'sterile', 'chain_of_custody', 'urgent', 'biohazard'].map(requirement => (
                <Form.Check
                  key={requirement}
                  type="checkbox"
                  name="handling_requirements"
                  value={requirement}
                  label={requirement.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  checked={formData.handling_requirements.includes(requirement)}
                  onChange={handleInputChange}
                />
              ))}
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Special Instructions</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="special_instructions"
              value={formData.special_instructions}
              onChange={handleInputChange}
              placeholder="Any special handling or delivery instructions..."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Additional Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Additional information about this routing request..."
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Creating...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlus} className="me-1" />
                Create Routing Request
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

RoutingCreateModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onRoutingCreated: PropTypes.func.isRequired
};

export default RoutingCreateModal;
