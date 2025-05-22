import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import { sampleAPI, tenantAPI } from '../../services/api';
import { useTenant } from '../../context/TenantContext';

const SampleTransferCreate = () => {
  const navigate = useNavigate();
  const { tenantData } = useTenant();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [samples, setSamples] = useState([]);
  const [tenants, setTenants] = useState([]);
  
  const [formData, setFormData] = useState({
    sample_id: '',
    to_tenant_id: '',
    reason: '',
    notes: ''
  });

  // Fetch samples and tenants on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [samplesResponse, tenantsResponse] = await Promise.all([
          sampleAPI.getSamples(),
          tenantAPI.getTenants()
        ]);
        
        setSamples(samplesResponse.data.data || []);
        setTenants(tenantsResponse.data.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data. Please try again.');
      }
    };

    fetchData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.sample_id || !formData.to_tenant_id || !formData.reason) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await sampleAPI.createSampleTransfer(formData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/samples/routing');
      }, 2000);
      
    } catch (err) {
      console.error('Error creating sample transfer:', err);
      setError(err.response?.data?.message || 'Failed to create sample transfer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter out current tenant from destination options
  const availableTenants = tenants.filter(tenant => tenant.id !== tenantData?.id);

  return (
    <div className="sample-transfer-create-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faExchangeAlt} className="me-2" />
          Create Sample Transfer
        </h1>
        <Button 
          variant="secondary" 
          onClick={() => navigate('/samples/routing')}
          className="btn-sm"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to Transfers
        </Button>
      </div>

      {/* Success Message */}
      {success && (
        <Alert variant="success">
          Sample transfer created successfully! Redirecting to transfers list...
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
          <h6 className="m-0 font-weight-bold text-primary">Transfer Details</h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sample <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="sample_id"
                    value={formData.sample_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a sample...</option>
                    {samples.map(sample => (
                      <option key={sample.id} value={sample.id}>
                        {sample.sample_id} - {sample.patient?.first_name} {sample.patient?.last_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Destination Site <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="to_tenant_id"
                    value={formData.to_tenant_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select destination...</option>
                    {availableTenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.site_code})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Transfer Reason <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select reason...</option>
                    <option value="Specialized testing required">Specialized testing required</option>
                    <option value="Hub processing required">Hub processing required</option>
                    <option value="Quality control review">Quality control review</option>
                    <option value="Equipment maintenance">Equipment maintenance</option>
                    <option value="Reagent shortage">Reagent shortage</option>
                    <option value="Technical expertise needed">Technical expertise needed</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Additional Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Enter any additional notes or special instructions..."
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={() => navigate('/samples/routing')}
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
                    Create Transfer
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

export default SampleTransferCreate;
