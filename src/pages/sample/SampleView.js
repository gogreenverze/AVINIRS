import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Row, Col, Button, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faEdit, faExchangeAlt, faFlask, faClipboardCheck,
  faVial, faUser, faCalendarAlt, faClock, faInfoCircle,
  faMapMarkerAlt, faUserMd, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { sampleAPI } from '../../services/api';
import '../../styles/SampleView.css';

const SampleView = () => {
  const { id } = useParams();
  const [sample, setSample] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSample = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await sampleAPI.getSampleById(id);
        setSample(response.data);
      } catch (err) {
        console.error('Error fetching sample:', err);
        setError('Failed to load sample details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSample();
  }, [id]);

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Collected':
        return 'primary';
      case 'In Transit':
        return 'info';
      case 'Received':
        return 'success';
      case 'Rejected':
        return 'danger';
      case 'Processed':
        return 'warning';
      case 'Transferred':
        return 'secondary';
      default:
        return 'dark';
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading sample details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        {error}
      </div>
    );
  }

  if (!sample) {
    return (
      <div className="alert alert-warning m-4" role="alert">
        Sample not found.
      </div>
    );
  }

  return (
    <div className="sample-view-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faVial} className="me-2" />
          Sample Details
        </h1>
        <div>
          <Link to="/samples" className="btn btn-secondary me-2">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to List
          </Link>
          <Link to={`/samples/${id}/edit`} className="btn btn-primary me-2">
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Edit Sample
          </Link>
          {sample.status === 'Collected' && (
            <Link to={`/samples/routing/create?sample_id=${sample.id}`} className="btn btn-warning">
              <FontAwesomeIcon icon={faExchangeAlt} className="me-2" />
              Transfer Sample
            </Link>
          )}
        </div>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">
                Sample {sample.sample_id}
                <Badge 
                  bg={getStatusBadgeVariant(sample.status)} 
                  className="float-end"
                >
                  {sample.status}
                </Badge>
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="sample-detail-item">
                    <FontAwesomeIcon icon={faVial} className="me-2 text-primary" />
                    <strong>Sample Type:</strong>
                    <span>{sample.sample_type}</span>
                  </div>
                  <div className="sample-detail-item">
                    <FontAwesomeIcon icon={faFlask} className="me-2 text-primary" />
                    <strong>Container:</strong>
                    <span>{sample.container?.container_name || 'Not specified'}</span>
                  </div>
                  <div className="sample-detail-item">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                    <strong>Collection Date:</strong>
                    <span>{new Date(sample.collection_date).toLocaleDateString()}</span>
                  </div>
                  <div className="sample-detail-item">
                    <FontAwesomeIcon icon={faClock} className="me-2 text-primary" />
                    <strong>Collection Time:</strong>
                    <span>{sample.collection_time || 'Not specified'}</span>
                  </div>
                </Col>
                <Col md={6}>
                  {sample.patient && (
                    <div className="sample-detail-item">
                      <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                      <strong>Patient:</strong>
                      <span>
                        <Link to={`/patients/${sample.patient.id}`}>
                          {sample.patient.first_name} {sample.patient.last_name}
                        </Link>
                      </span>
                    </div>
                  )}
                  {sample.order && (
                    <div className="sample-detail-item">
                      <FontAwesomeIcon icon={faClipboardCheck} className="me-2 text-primary" />
                      <strong>Order:</strong>
                      <span>
                        <Link to={`/orders/${sample.order.id}`}>
                          {sample.order.order_id}
                        </Link>
                      </span>
                    </div>
                  )}
                  <div className="sample-detail-item">
                    <FontAwesomeIcon icon={faUserMd} className="me-2 text-primary" />
                    <strong>Collected By:</strong>
                    <span>{sample.collected_by_user?.get_full_name() || 'Not specified'}</span>
                  </div>
                  <div className="sample-detail-item">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-primary" />
                    <strong>Location:</strong>
                    <span>{sample.tenant?.name || 'Not specified'}</span>
                  </div>
                </Col>
              </Row>

              {sample.notes && (
                <>
                  <hr />
                  <div className="sample-detail-item">
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2 text-primary" />
                    <strong>Notes:</strong>
                    <span>{sample.notes}</span>
                  </div>
                </>
              )}

              {sample.status === 'Rejected' && (
                <>
                  <hr />
                  <div className="rejection-info">
                    <h6 className="font-weight-bold text-danger mb-3">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                      Rejection Information
                    </h6>
                    <div className="sample-detail-item">
                      <strong>Rejection Reason:</strong>
                      <span>{sample.rejection_criteria?.criteria_name || 'Not specified'}</span>
                    </div>
                    {sample.rejection_reason && (
                      <div className="sample-detail-item">
                        <strong>Additional Notes:</strong>
                        <span>{sample.rejection_reason}</span>
                      </div>
                    )}
                    <div className="sample-detail-item">
                      <strong>Rejected By:</strong>
                      <span>{sample.rejected_by_user?.get_full_name() || 'Not specified'}</span>
                    </div>
                    <div className="sample-detail-item">
                      <strong>Rejected At:</strong>
                      <span>
                        {sample.rejected_at ? new Date(sample.rejected_at).toLocaleString() : 'Not specified'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>

          {sample.tests && sample.tests.length > 0 && (
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Tests</h6>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Test</th>
                        <th>Status</th>
                        <th>Result</th>
                        <th>Reference Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sample.tests.map(test => (
                        <tr key={test.id}>
                          <td>{test.test_catalog.test_name}</td>
                          <td>
                            <Badge bg={getStatusBadgeVariant(test.status)}>
                              {test.status}
                            </Badge>
                          </td>
                          <td>{test.result?.value || 'Pending'}</td>
                          <td>{test.test_catalog.reference_range || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col lg={4}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold">Quick Actions</h6>
            </Card.Header>
            <Card.Body>
              {sample.status === 'Collected' && (
                <div className="mb-3">
                  <Link to={`/lab/process?sample_id=${sample.id}`} className="btn btn-success btn-block w-100">
                    <FontAwesomeIcon icon={faFlask} className="me-2" /> Process Sample
                  </Link>
                </div>
              )}
              {sample.status === 'Processed' && (
                <div className="mb-3">
                  <Link to={`/results/create?sample_id=${sample.id}`} className="btn btn-info btn-block w-100">
                    <FontAwesomeIcon icon={faClipboardCheck} className="me-2" /> Enter Results
                  </Link>
                </div>
              )}
              {sample.status === 'Collected' && (
                <div className="mb-3">
                  <Link to={`/samples/${sample.id}/reject`} className="btn btn-danger btn-block w-100">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" /> Reject Sample
                  </Link>
                </div>
              )}
            </Card.Body>
          </Card>

          {sample.routing && (
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold">Transfer Information</h6>
              </Card.Header>
              <Card.Body>
                <div className="sample-detail-item">
                  <strong>Source:</strong>
                  <span>{sample.routing.source_tenant.name}</span>
                </div>
                <div className="sample-detail-item">
                  <strong>Destination:</strong>
                  <span>{sample.routing.destination_tenant.name}</span>
                </div>
                <div className="sample-detail-item">
                  <strong>Status:</strong>
                  <span>
                    <Badge bg={getStatusBadgeVariant(sample.routing.status)}>
                      {sample.routing.status}
                    </Badge>
                  </span>
                </div>
                <div className="sample-detail-item">
                  <strong>Dispatch Date:</strong>
                  <span>
                    {sample.routing.dispatch_date ? 
                      new Date(sample.routing.dispatch_date).toLocaleDateString() : 
                      'Not dispatched yet'}
                  </span>
                </div>
                {sample.routing.tracking_number && (
                  <div className="sample-detail-item">
                    <strong>Tracking #:</strong>
                    <span>{sample.routing.tracking_number}</span>
                  </div>
                )}
                <div className="mt-3">
                  <Link to={`/samples/routing/${sample.routing.id}`} className="btn btn-info btn-block w-100">
                    <FontAwesomeIcon icon={faExchangeAlt} className="me-2" /> View Transfer Details
                  </Link>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default SampleView;
