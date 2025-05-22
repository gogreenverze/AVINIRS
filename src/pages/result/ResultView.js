import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Badge, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faEdit, faCheck, faPrint, faDownload, faEnvelope,
  faUser, faVial, faCalendarAlt, faClipboardCheck, faInfoCircle,
  faFlask, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { resultAPI } from '../../services/api';
import {
  ConfirmationModal,
  SuccessModal,
  ErrorModal
} from '../../components/common';
import WhatsAppSend from '../../components/common/WhatsAppSend';
import '../../styles/ResultView.css';

const ResultView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch result data
  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await resultAPI.getResultById(id);
        setResult(response.data);
      } catch (err) {
        console.error('Error fetching result:', err);
        setError('Failed to load result details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id]);

  // Handle result verification
  const handleVerify = async () => {
    try {
      const response = await resultAPI.verifyResult(id);
      setResult(response.data);
      setShowVerifyModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error verifying result:', err);
      setErrorMessage('Failed to verify result. Please try again later.');
      setShowErrorModal(true);
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Completed':
        return 'success';
      case 'Verified':
        return 'primary';
      case 'Rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading result details...</p>
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

  if (!result) {
    return (
      <div className="alert alert-warning m-4" role="alert">
        Result not found.
      </div>
    );
  }

  return (
    <div className="result-view-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faClipboardCheck} className="me-2" />
          Result Details
        </h1>
        <div>
          <Link to="/results" className="btn btn-secondary me-2">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to List
          </Link>
          {result.status === 'Pending' && (
            <Link to={`/results/${id}/edit`} className="btn btn-primary me-2">
              <FontAwesomeIcon icon={faEdit} className="me-2" />
              Edit Result
            </Link>
          )}
          {result.status === 'Completed' && (
            <Button variant="success" className="me-2" onClick={() => setShowVerifyModal(true)}>
              <FontAwesomeIcon icon={faCheck} className="me-2" />
              Verify Result
            </Button>
          )}
          <Button variant="info" className="me-2">
            <FontAwesomeIcon icon={faPrint} className="me-2" />
            Print
          </Button>
        </div>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">
                Result {result.result_id}
                <Badge
                  bg={getStatusBadgeVariant(result.status)}
                  className="float-end"
                >
                  {result.status}
                </Badge>
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  {result.patient && (
                    <div className="result-detail-item">
                      <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                      <strong>Patient:</strong>
                      <span>
                        <Link to={`/patients/${result.patient.id}`}>
                          {result.patient.first_name} {result.patient.last_name}
                        </Link>
                      </span>
                    </div>
                  )}
                  {result.sample && (
                    <div className="result-detail-item">
                      <FontAwesomeIcon icon={faVial} className="me-2 text-primary" />
                      <strong>Sample:</strong>
                      <span>
                        <Link to={`/samples/${result.sample.id}`}>
                          {result.sample.sample_id}
                        </Link>
                      </span>
                    </div>
                  )}
                  <div className="result-detail-item">
                    <FontAwesomeIcon icon={faFlask} className="me-2 text-primary" />
                    <strong>Test:</strong>
                    <span>{result.test?.test_name || 'N/A'}</span>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="result-detail-item">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                    <strong>Result Date:</strong>
                    <span>
                      {result.result_date ? new Date(result.result_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="result-detail-item">
                    <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                    <strong>Created By:</strong>
                    <span>{result.created_by_user?.get_full_name() || 'N/A'}</span>
                  </div>
                  {result.status === 'Verified' && (
                    <div className="result-detail-item">
                      <FontAwesomeIcon icon={faCheck} className="me-2 text-primary" />
                      <strong>Verified By:</strong>
                      <span>{result.verified_by_user?.get_full_name() || 'N/A'}</span>
                    </div>
                  )}
                </Col>
              </Row>

              <hr />

              <h6 className="font-weight-bold mb-3">Result Details</h6>
              <div className="result-value-container">
                <div className="result-detail-item">
                  <strong>Value:</strong>
                  <span className="result-value">{result.value}</span>
                </div>
                <div className="result-detail-item">
                  <strong>Unit:</strong>
                  <span>{result.unit}</span>
                </div>
                <div className="result-detail-item">
                  <strong>Reference Range:</strong>
                  <span>{result.reference_range || 'Not specified'}</span>
                </div>
              </div>

              {result.notes && (
                <>
                  <hr />
                  <div className="result-detail-item">
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2 text-primary" />
                    <strong>Notes:</strong>
                    <span>{result.notes}</span>
                  </div>
                </>
              )}

              {result.status === 'Rejected' && (
                <>
                  <hr />
                  <div className="rejection-info">
                    <h6 className="font-weight-bold text-danger mb-3">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                      Rejection Information
                    </h6>
                    <div className="result-detail-item">
                      <strong>Rejection Reason:</strong>
                      <span>{result.rejection_reason || 'Not specified'}</span>
                    </div>
                    <div className="result-detail-item">
                      <strong>Rejected By:</strong>
                      <span>{result.rejected_by_user?.get_full_name() || 'Not specified'}</span>
                    </div>
                    <div className="result-detail-item">
                      <strong>Rejected At:</strong>
                      <span>
                        {result.rejected_at ? new Date(result.rejected_at).toLocaleString() : 'Not specified'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold">Quick Actions</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <Button variant="info" className="btn-block w-100 mb-2">
                  <FontAwesomeIcon icon={faPrint} className="me-2" /> Print Result
                </Button>
                <Button variant="success" className="btn-block w-100 mb-2">
                  <FontAwesomeIcon icon={faDownload} className="me-2" /> Download PDF
                </Button>
                <Button variant="warning" className="btn-block w-100">
                  <FontAwesomeIcon icon={faEnvelope} className="me-2" /> Email Result
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* WhatsApp Send Component */}
          {result.status === 'Verified' && (
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold">WhatsApp</h6>
              </Card.Header>
              <Card.Body>
                <WhatsAppSend
                  type="report"
                  patientName={result.patient ? `${result.patient.first_name} ${result.patient.last_name}` : ''}
                  orderId={result.id}
                  defaultPhone={result.patient?.phone || ''}
                  defaultMessage={`Your test results are ready. Test: ${result.test?.test_name || 'N/A'}, Result: ${result.value} ${result.unit || ''}`}
                  onSuccess={(message) => {
                    // Show success notification
                    console.log('WhatsApp message sent:', message);
                  }}
                  onError={(error) => {
                    // Show error notification
                    console.error('WhatsApp error:', error);
                  }}
                />
              </Card.Body>
            </Card>
          )}

          {result.sample && (
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold">Sample Information</h6>
              </Card.Header>
              <Card.Body>
                <div className="result-detail-item">
                  <strong>Sample ID:</strong>
                  <span>{result.sample.sample_id}</span>
                </div>
                <div className="result-detail-item">
                  <strong>Sample Type:</strong>
                  <span>{result.sample.sample_type || 'N/A'}</span>
                </div>
                <div className="result-detail-item">
                  <strong>Collection Date:</strong>
                  <span>
                    {result.sample.collection_date ?
                      new Date(result.sample.collection_date).toLocaleDateString() :
                      'N/A'}
                  </span>
                </div>
                <div className="mt-3">
                  <Link to={`/samples/${result.sample.id}`} className="btn btn-primary btn-block w-100">
                    <FontAwesomeIcon icon={faVial} className="me-2" /> View Sample Details
                  </Link>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Verification Confirmation Modal */}
      <ConfirmationModal
        show={showVerifyModal}
        onHide={() => setShowVerifyModal(false)}
        onConfirm={handleVerify}
        title="Verify Result"
        message="Are you sure you want to verify this result? This action cannot be undone."
        confirmText="Verify"
        confirmVariant="success"
        icon={faCheck}
        iconColor="success"
      />

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        title="Result Verified"
        message="The result has been successfully verified."
      />

      {/* Error Modal */}
      <ErrorModal
        show={showErrorModal}
        onHide={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
      />
    </div>
  );
};

export default ResultView;
