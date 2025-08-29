import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faExchangeAlt, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { sampleAPI, tenantAPI, billingAPI } from '../../services/api';
import { useTenant } from '../../context/TenantContext';

const SampleTransferCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantData } = useTenant();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [samples, setSamples] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [billingInfo, setBillingInfo] = useState(null);

  // Get URL parameters
  const queryParams = new URLSearchParams(location.search);
  const billingId = queryParams.get('billing_id');
  const sampleId = queryParams.get('sample_id');
  
  const [formData, setFormData] = useState({
    sample_id: sampleId || '',
    to_tenant_id: '',
    reason: '',
    notes: '',
    dispatch_immediately: false,
    dispatch_date: new Date().toISOString().split('T')[0],
    dispatch_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    tracking_number: '',
    courier_service: ''
  });

  // Fetch samples and tenants on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        let promises = [
          sampleAPI.getAllSamples(),
         tenantAPI.getAllTenants()
        ];

        // If billing_id is provided, fetch billing info
        // if (billingId) {
        //   promises.push(billingAPI.getBilling(billingId));
        // }

        const responses = await Promise.all(promises);
        const [samplesResponse, tenantsResponse, billingResponse] = responses;

        console.log("responses", responses);
        console.log("setSamples", samplesResponse);
        console.log("setTenants", tenantsResponse);

        setSamples(samplesResponse?.data?.items || []);
        setTenants(tenantsResponse?.data || []);

        // If billing info was fetched, set it and filter samples by patient
        if (billingResponse) {
          const billing = billingResponse.data;
          setBillingInfo(billing);
          console.log("setBillingInfo", billing);

          // Filter samples to show only those for the same patient
          const patientSamples = samplesResponse?.data?.items?.filter(
            sample => sample.patient_id === billing.patient_id
          ) || [];
          setSamples(patientSamples);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data. Please try again.');
      }
    };

    fetchData();
  }, [billingId]);


  console.log("smaples",samples)
  console.log("tenants",tenants)

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

    // Validate dispatch fields if dispatching immediately
    if (formData.dispatch_immediately && !formData.tracking_number.trim()) {
      setError('Tracking number is required when dispatching immediately.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create the transfer
      const transferData = {
        sample_id: formData.sample_id,
        to_tenant_id: formData.to_tenant_id,
        reason: formData.reason,
        notes: formData.notes
      };

      const response = await sampleAPI.createSampleTransfer(transferData);

      // If dispatching immediately, dispatch the transfer
      if (formData.dispatch_immediately) {
        const dispatchData = {
          dispatch_date: formData.dispatch_date,
          dispatch_time: formData.dispatch_time,
          tracking_number: formData.tracking_number,
          courier_service: formData.courier_service,
          status: 'In Transit',
          transferred_at: new Date().toISOString()
        };

        await sampleAPI.dispatchSampleTransfer(response.data.id, dispatchData);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate(billingInfo ? '/samples' : '/samples/routing');
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
          {billingInfo ? 'Transfer Billing Report Sample' : 'Create Sample Transfer'}
        </h1>
        <Button
          variant="secondary"
          onClick={() => navigate(billingInfo ? '/samples' : '/samples/routing')}
          className="btn-sm"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          {billingInfo ? 'Back to Reports' : 'Back to Transfers'}
        </Button>
      </div>

      {/* Billing Information Card */}
      {billingInfo && (
        <Card className="shadow mb-4 border-left-info">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-info">
              <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
              Billing Report Information
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p><strong>Invoice Number:</strong> {billingInfo.invoice_number}</p>
                <p><strong>SID Number:</strong> {billingInfo.sid_number}</p>
              </Col>
              <Col md={6}>
                <p><strong>Patient:</strong> {billingInfo.patient?.first_name} {billingInfo.patient?.last_name}</p>
                <p><strong>Total Amount:</strong> ₹{billingInfo.total_amount}</p>
              </Col>
            </Row>
            <Alert variant="info" className="mb-0">
              <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
              Showing samples for this patient only. Select a sample to transfer for this billing report.
            </Alert>
          </Card.Body>
        </Card>
      )}

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
                    <option value="">
                      {samples?.length === 0
                        ? (billingInfo ? 'No samples available for this patient' : 'No samples available')
                        : 'Select a sample...'
                      }
                    </option>
                    {samples?.map(sample => (
                      <option key={sample.id} value={sample.id}>
                        {sample?.sample_id} - {sample.patient?.first_name} {sample.patient?.last_name}
                      </option>
                    ))}
                  </Form.Select>
                  {billingInfo && samples?.length === 0 && (
                    <Form.Text className="text-muted">
                      No samples found for this patient. You may need to create a sample first before transferring.
                    </Form.Text>
                  )}
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
                    {availableTenants?.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant?.name} ({tenant?.site_code})
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

            {/* Dispatch Options */}
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="dispatch_immediately"
                    checked={formData.dispatch_immediately}
                    onChange={handleInputChange}
                    label="Dispatch immediately after creating transfer"
                  />
                </Form.Group>
              </Col>
            </Row>

            {formData.dispatch_immediately && (
              <>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Dispatch Date <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="date"
                        name="dispatch_date"
                        value={formData.dispatch_date}
                        onChange={handleInputChange}
                        required={formData.dispatch_immediately}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Dispatch Time <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="time"
                        name="dispatch_time"
                        value={formData.dispatch_time}
                        onChange={handleInputChange}
                        required={formData.dispatch_immediately}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tracking Number <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="tracking_number"
                        value={formData.tracking_number}
                        onChange={handleInputChange}
                        placeholder="Enter tracking number"
                        required={formData.dispatch_immediately}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Courier Service</Form.Label>
                      <Form.Select
                        name="courier_service"
                        value={formData.courier_service}
                        onChange={handleInputChange}
                      >
                        <option value="">Select courier service</option>
                        <option value="FedEx">FedEx</option>
                        <option value="UPS">UPS</option>
                        <option value="DHL">DHL</option>
                        <option value="USPS">USPS</option>
                        <option value="Local Courier">Local Courier</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}

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
