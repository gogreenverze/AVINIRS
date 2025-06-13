import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Badge, Button, Row, Col, Alert, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faEye, faPaperPlane, faSpinner, faExchangeAlt,
  faCalendarAlt, faMapMarkerAlt, faUser, faClipboardList
} from '@fortawesome/free-solid-svg-icons';
import { sampleAPI } from '../../services/api';

const SampleTransferView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch transfer details
  useEffect(() => {
    const fetchTransfer = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await sampleAPI.getSampleTransferById(id);
        setTransfer(response.data);
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

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'In Transit': return 'info';
      case 'Completed': return 'success';
      case 'Cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <Alert variant="danger">
          {error}
        </Alert>
        <Button variant="secondary" onClick={() => navigate('/samples/routing')}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to Routing
        </Button>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faExchangeAlt} className="me-2" />
          Transfer Details #{transfer?.id}
        </h1>
        <div>
          <Button 
            variant="secondary" 
            onClick={() => navigate('/samples/routing')}
            className="me-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Routing
          </Button>
          {transfer?.status === 'Pending' && (
            <Link 
              to={`/samples/routing/${transfer.id}/dispatch`} 
              className="btn btn-primary"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
              Dispatch Transfer
            </Link>
          )}
        </div>
      </div>

      {transfer && (
        <Row>
          <Col lg={8}>
            {/* Transfer Information */}
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Transfer Information</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong className="text-muted">Transfer ID:</strong>
                      <div className="h5 mb-0">#{transfer.id}</div>
                    </div>
                    <div className="mb-3">
                      <strong className="text-muted">Status:</strong>
                      <div>
                        <Badge bg={getStatusBadgeVariant(transfer.status)} className="fs-6">
                          {transfer.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="mb-3">
                      <strong className="text-muted">Reason:</strong>
                      <div>{transfer.reason}</div>
                    </div>
                    {transfer.notes && (
                      <div className="mb-3">
                        <strong className="text-muted">Notes:</strong>
                        <div>{transfer.notes}</div>
                      </div>
                    )}
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong className="text-muted">Created:</strong>
                      <div>{formatDateTime(transfer.created_at)}</div>
                    </div>
                    <div className="mb-3">
                      <strong className="text-muted">Last Updated:</strong>
                      <div>{formatDateTime(transfer.updated_at)}</div>
                    </div>
                    {transfer.transferred_at && (
                      <div className="mb-3">
                        <strong className="text-muted">Transferred:</strong>
                        <div>{formatDateTime(transfer.transferred_at)}</div>
                      </div>
                    )}
                    {transfer.received_at && (
                      <div className="mb-3">
                        <strong className="text-muted">Received:</strong>
                        <div>{formatDateTime(transfer.received_at)}</div>
                      </div>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Sample Information */}
            {transfer.sample && (
              <Card className="shadow mb-4">
                <Card.Header className="py-3">
                  <h6 className="m-0 font-weight-bold text-primary">Sample Information</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <strong className="text-muted">Sample ID:</strong>
                        <div>
                          <Link to={`/samples/${transfer.sample.id}`} className="text-decoration-none">
                            {transfer.sample.sample_id}
                          </Link>
                        </div>
                      </div>
                      <div className="mb-3">
                        <strong className="text-muted">Sample Type:</strong>
                        <div>{transfer.sample.sample_type || 'N/A'}</div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <strong className="text-muted">Collection Date:</strong>
                        <div>{formatDate(transfer.sample.collection_date)}</div>
                      </div>
                      <div className="mb-3">
                        <strong className="text-muted">Sample Status:</strong>
                        <div>
                          <Badge bg="info">{transfer.sample.status || 'Unknown'}</Badge>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* Dispatch Information */}
            {(transfer.dispatch_date || transfer.tracking_number) && (
              <Card className="shadow mb-4">
                <Card.Header className="py-3">
                  <h6 className="m-0 font-weight-bold text-primary">Dispatch Information</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      {transfer.dispatch_date && (
                        <div className="mb-3">
                          <strong className="text-muted">Dispatch Date:</strong>
                          <div>{formatDate(transfer.dispatch_date)}</div>
                        </div>
                      )}
                      {transfer.tracking_number && (
                        <div className="mb-3">
                          <strong className="text-muted">Tracking Number:</strong>
                          <div className="font-monospace">{transfer.tracking_number}</div>
                        </div>
                      )}
                    </Col>
                    <Col md={6}>
                      {transfer.courier_service && (
                        <div className="mb-3">
                          <strong className="text-muted">Courier Service:</strong>
                          <div>{transfer.courier_service}</div>
                        </div>
                      )}
                      {transfer.dispatch_notes && (
                        <div className="mb-3">
                          <strong className="text-muted">Dispatch Notes:</strong>
                          <div>{transfer.dispatch_notes}</div>
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Col>

          <Col lg={4}>
            {/* Transfer Route */}
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Transfer Route</h6>
              </Card.Header>
              <Card.Body>
                <div className="text-center">
                  <div className="mb-3">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-success fa-2x" />
                    <div className="mt-2">
                      <strong>From:</strong>
                      <div>{transfer.from_tenant?.name || 'Unknown'}</div>
                      {transfer.from_tenant?.site_code && (
                        <small className="text-muted">({transfer.from_tenant.site_code})</small>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <FontAwesomeIcon icon={faArrowLeft} className="text-primary fa-rotate-270" />
                  </div>
                  
                  <div className="mb-3">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-danger fa-2x" />
                    <div className="mt-2">
                      <strong>To:</strong>
                      <div>{transfer.to_tenant?.name || 'Unknown'}</div>
                      {transfer.to_tenant?.site_code && (
                        <small className="text-muted">({transfer.to_tenant.site_code})</small>
                      )}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Quick Actions</h6>
              </Card.Header>
              <Card.Body>
                {transfer.sample && (
                  <div className="mb-2">
                    <Link 
                      to={`/samples/${transfer.sample.id}`} 
                      className="btn btn-info btn-sm w-100"
                    >
                      <FontAwesomeIcon icon={faEye} className="me-2" />
                      View Sample Details
                    </Link>
                  </div>
                )}
                
                {transfer.status === 'Pending' && (
                  <div className="mb-2">
                    <Link 
                      to={`/samples/routing/${transfer.id}/dispatch`} 
                      className="btn btn-primary btn-sm w-100"
                    >
                      <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                      Dispatch Transfer
                    </Link>
                  </div>
                )}
                
                <div className="mb-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-100"
                    onClick={() => navigate('/samples/routing')}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                    Back to Routing
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default SampleTransferView;
