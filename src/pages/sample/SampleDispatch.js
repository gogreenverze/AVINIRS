import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, Row, Col, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { sampleAPI } from '../../services/api';

const SampleDispatch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    dispatch_date: new Date().toISOString().split('T')[0],
    dispatch_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    tracking_number: '',
    courier_service: '',
    notes: ''
  });

  // Fetch transfer details
  useEffect(() => {
    const fetchTransfer = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await sampleAPI.getSampleTransferById(id);
        setTransfer(response.data);
        
        // Check if already dispatched
        if (response.data.status !== 'Pending') {
          setError('This transfer has already been processed.');
        }
      } catch (err) {
        console.error('Error fetching transfer:', err);
        setError('Failed to load transfer details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTransfer();
    }
  }, [id]);

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
    
    if (!formData.tracking_number.trim()) {
      setError('Tracking number is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const dispatchData = {
        ...formData,
        status: 'In Transit',
        transferred_at: new Date().toISOString()
      };
      
      await sampleAPI.dispatchSampleTransfer(id, dispatchData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/samples/routing');
      }, 2000);
      
    } catch (err) {
      console.error('Error dispatching transfer:', err);
      setError(err.response?.data?.message || 'Failed to dispatch transfer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'In Transit': return 'info';
      case 'Completed': return 'success';
      case 'Cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary" />
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Dispatch Sample Transfer</h1>
        <Button 
          variant="secondary" 
          onClick={() => navigate('/samples/routing')}
          className="d-none d-sm-inline-block"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to Routing
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert variant="success">
          Transfer dispatched successfully! Redirecting to routing page...
        </Alert>
      )}

      {transfer && (
        <Row>
          <Col lg={8}>
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Dispatch Details</h6>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Dispatch Date *</Form.Label>
                        <Form.Control
                          type="date"
                          name="dispatch_date"
                          value={formData.dispatch_date}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Dispatch Time *</Form.Label>
                        <Form.Control
                          type="time"
                          name="dispatch_time"
                          value={formData.dispatch_time}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Tracking Number *</Form.Label>
                        <Form.Control
                          type="text"
                          name="tracking_number"
                          value={formData.tracking_number}
                          onChange={handleInputChange}
                          placeholder="Enter tracking number"
                          required
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

                  <Form.Group className="mb-3">
                    <Form.Label>Dispatch Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Enter any additional notes about the dispatch..."
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-end">
                    <Button 
                      variant="secondary" 
                      className="me-2"
                      onClick={() => navigate('/samples/routing')}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="primary" 
                      type="submit"
                      disabled={submitting || transfer.status !== 'Pending'}
                    >
                      {submitting ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                          Dispatching...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                          Dispatch Transfer
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Transfer Information</h6>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <strong>Sample ID:</strong>
                  <div>{transfer.sample?.sample_id || 'N/A'}</div>
                </div>
                <div className="mb-3">
                  <strong>From:</strong>
                  <div>{transfer.from_tenant?.name || 'Unknown'}</div>
                </div>
                <div className="mb-3">
                  <strong>To:</strong>
                  <div>{transfer.to_tenant?.name || 'Unknown'}</div>
                </div>
                <div className="mb-3">
                  <strong>Reason:</strong>
                  <div>{transfer.reason}</div>
                </div>
                <div className="mb-3">
                  <strong>Status:</strong>
                  <div>
                    <Badge bg={getStatusBadgeVariant(transfer.status)}>
                      {transfer.status}
                    </Badge>
                  </div>
                </div>
                <div className="mb-3">
                  <strong>Created:</strong>
                  <div>{new Date(transfer.created_at).toLocaleString()}</div>
                </div>
                {transfer.notes && (
                  <div className="mb-3">
                    <strong>Notes:</strong>
                    <div>{transfer.notes}</div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default SampleDispatch;
