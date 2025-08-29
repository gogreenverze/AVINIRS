import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Card, Button, Row, Col, Badge, Alert, Spinner, Form, Table, Modal
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faCheck, faTimes, faFileInvoiceDollar,
  faUser, faVial, faSpinner, faExclamationTriangle,
  faCheckCircle, faInfoCircle, faClipboardCheck, faEdit
} from '@fortawesome/free-solid-svg-icons';
import billingReportsAPI from '../../services/billingReportsAPI';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

import '../../styles/BillingReports.css';

/**
 * Individual Report Authorization Screen
 * Dedicated authorization interface for specific reports with change tracking
 */
const BillingReportsAuthorize = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { currentTenantContext } = useTenant();

  // State management
  const [report, setReport] = useState(null);
  const [originalReport, setOriginalReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authorizing, setAuthorizing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState('approve'); // 'approve' or 'reject'

  // Authorization form data
  const [authorizationData, setAuthorizationData] = useState({
    authorizerName: '',
    comments: '',
    action: 'approve'
  });

  // Navigation state
  const [referrer, setReferrer] = useState('billing-reports');

  // Determine referrer from URL parameters or location state
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const fromParam = urlParams.get('from');

    if (fromParam === 'samples') {
      setReferrer('samples');
    } else if (fromParam === 'reports') {
      setReferrer('billing-reports');
    } else if (location.state?.from) {
      setReferrer(location.state.from);
    } else {
      setReferrer('billing-reports');
    }
  }, [location]);

  // Fetch report details
  useEffect(() => {
    const fetchReport = async () => {
      if (!reportId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await billingReportsAPI.getReportBySID(reportId);

        if (response.success && response.data) {
          const reportData = response.data.data?.data || response.data.data || response.data;

          if (reportData && typeof reportData === 'object') {
            setReport(reportData);
            setOriginalReport(JSON.parse(JSON.stringify(reportData))); // Deep copy for comparison

            // Initialize authorizer name with current user
            setAuthorizationData(prev => ({
              ...prev,
              authorizerName: `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim()
            }));
          } else {
            setError('Invalid report data structure received');
          }
        } else {
          setError(response.error || 'Failed to load report details');
        }
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load report details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId, currentUser]);

  // Handle back navigation
  const handleBack = () => {
    if (referrer === 'samples') {
      navigate('/samples');
    } else {
      navigate('/billing/reports');
    }
  };

  // Handle authorization action
  const handleAuthorizationAction = (action) => {
    setActionType(action);
    setAuthorizationData(prev => ({ ...prev, action }));
    setShowConfirmModal(true);
  };

  // Submit authorization
  const handleAuthorizationSubmit = async () => {
    try {
      setAuthorizing(true);
      setError(null);

      // Validate required fields
      if (!authorizationData.authorizerName.trim()) {
        setError('Authorizer name is required');
        setAuthorizing(false);
        return;
      }

      if (actionType === 'reject' && !authorizationData.comments.trim()) {
        setError('Comments are required when rejecting a report');
        setAuthorizing(false);
        return;
      }

      // Prepare authorization data
      const authData = {
        authorizerName: authorizationData.authorizerName,
        comments: authorizationData.comments,
        action: actionType,
        authorizationTimestamp: new Date().toISOString(),
        userId: currentUser?.id,
        userRole: currentUser?.role
      };

      // Call authorization API
      const response = await billingReportsAPI.authorizeReport(report.id, authData);

         setShowConfirmModal(false);

      if (response) {
        // Update local report state
        setReport(prev => ({
          ...prev,
          authorized: actionType === 'approve',
          authorization_status: actionType === 'approve' ? 'approved' : 'rejected',
          authorization: {
            authorizerName: authorizationData.authorizerName,
            comments: authorizationData.comments,
            action: actionType,
            timestamp: new Date().toISOString(),
            userId: currentUser?.id,
            userRole: currentUser?.role
          }
        }));

     
        
        // Navigate back after successful authorization
        setTimeout(() => {
          handleBack();
        }, 2000);
      } else {
        setError(response.error || `Failed to ${actionType} report`);
      }
    } catch (err) {
      console.error('Error during authorization:', err);
      setError(`Failed to ${actionType} report. Please try again.`);
    } finally {
      setAuthorizing(false);
    }
  };

  // Check if field has been modified
  const isFieldModified = (fieldPath) => {
    if (!originalReport || !report) return false;
    
    const getNestedValue = (obj, path) => {
      return path.split('.').reduce((current, key) => current?.[key], obj);
    };

    const originalValue = getNestedValue(originalReport, fieldPath);
    const currentValue = getNestedValue(report, fieldPath);
    
    return JSON.stringify(originalValue) !== JSON.stringify(currentValue);
  };

  // Get modified test items
  const getModifiedTests = () => {
    if (!originalReport?.test_items || !report?.test_items) return [];
    
    return report.test_items.filter((test, index) => {
      const originalTest = originalReport.test_items[index];
      return originalTest && JSON.stringify(test) !== JSON.stringify(originalTest);
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <div className="mt-2">Loading report for authorization...</div>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <Alert variant="danger" className="m-4">
        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
        {error}
      </Alert>
    );
  }

  const modifiedTests = getModifiedTests();
  const hasModifications = modifiedTests.length > 0;

  return (
    <div className="billing-reports-authorize">
      {/* Header */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className="header-title-section">
              <h1 className="h4 mb-1 text-primary fw-bold">
                <FontAwesomeIcon icon={faClipboardCheck} className="me-2" />
                Report Authorization
              </h1>
              <p className="text-muted mb-0 small">
                Review and authorize report: {report?.sid_number}
              </p>
            </div>
            <div className="header-actions d-flex gap-2">
              <Button variant="outline-secondary" onClick={handleBack}>
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                Back
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          {error}
        </Alert>
      )}

      {/* Authorization Status */}
      {report?.authorized && (
        <Alert variant="success" className="mb-4">
          <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
          This report has already been authorized by {report.authorization?.authorizerName} 
          on {new Date(report.authorization?.timestamp).toLocaleString()}
        </Alert>
      )}

      {/* Patient Information */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="py-3 ">
          <h6 className="mb-0 fw-semibold">
            <FontAwesomeIcon icon={faUser} className="me-2" />
            Patient Information
          </h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <div className="mb-2 text-white">
                <strong>Patient Name:</strong> {report?.patient_info?.full_name || 'N/A'}
              </div>
              <div className="mb-2 text-white">
                <strong>Age/Gender:</strong> {report?.patient_info?.age || 'N/A'} / {report?.patient_info?.gender || 'N/A'}
              </div>
              <div className="mb-2 text-white">
                <strong>Patient ID:</strong> {report?.patient_info?.patient_id || 'N/A'}
              </div>
            </Col>
            <Col md={6}>
              <div className="mb-2 text-white">
                <strong>SID Number:</strong> {report?.sid_number || 'N/A'}
              </div>
              <div className="mb-2 text-white">
                <strong>Registration Date:</strong> {billingReportsAPI.formatDate(report?.registration_date)}
              </div>
              <div className="mb-2 text-white">
                <strong>Branch:</strong> {report?.clinic_info?.name || currentTenantContext?.name || 'N/A'}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Test Results Review */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-semibold">
              <FontAwesomeIcon icon={faVial} className="me-2" />
              Test Results Review
            </h6>
            {hasModifications && (
              <Badge bg="warning" className="ms-2">
                <FontAwesomeIcon icon={faEdit} className="me-1" />
                {modifiedTests.length} Modified
              </Badge>
            )}
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {report?.test_items && report.test_items.length > 0 ? (
            <div className="table-responsive">
              <Table className="table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Test Name</th>
                    <th>Result</th>
                    <th>Reference Range</th>
                    <th>Unit</th>
                    <th>Method</th>
                    <th>Specimen</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.test_items.map((test, index) => {
                    const isModified = modifiedTests.some(modTest =>
                      modTest.test_name === test.test_name
                    );

                    return (
                      <tr key={index} className={isModified ? 'table-warning' : ''}>
                        <td>
                          <div className="fw-bold">{test.test_name || 'N/A'}</div>
                          {test.hms_code && (
                            <small className="text-muted">Code: {test.hms_code}</small>
                          )}
                        </td>
                        <td>
                          <span className={`fw-bold ${test.result ? 'text-success' : 'text-muted'}`}>
                            {test.result || 'Pending'}
                          </span>
                          {isModified && (
                            <Badge bg="warning" size="sm" className="ms-2">Modified</Badge>
                          )}
                        </td>
                        <td>
                          <small className="text-muted">
                            {test.reference_range || 'N/A'}
                          </small>
                        </td>
                        <td>
                          <small>{test.result_unit || 'N/A'}</small>
                        </td>
                        <td>
                          <small className="text-muted">
                            {test.method || 'N/A'}
                          </small>
                        </td>
                        <td>
                          <small className="text-muted">
                            {test.specimen || test.primary_specimen || 'N/A'}
                          </small>
                        </td>
                        <td>
                          <Badge bg={test.result ? 'success' : 'secondary'}>
                            {test.result ? 'Completed' : 'Pending'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4">
              <FontAwesomeIcon icon={faInfoCircle} size="2x" className="text-muted mb-2" />
              <div className="text-muted">No test items found</div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Authorization Form */}
      {!report?.authorized && (
        <Card className="shadow-sm border-0 mb-4">
          <Card.Header className="py-3">
            <h6 className="mb-0 fw-semibold">
              <FontAwesomeIcon icon={faClipboardCheck} className="me-2" />
              Authorization Details
            </h6>
          </Card.Header>
          <Card.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3 text-white">
                    <Form.Label className="text-white">Authorizer Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      value={authorizationData.authorizerName}
                      onChange={(e) => setAuthorizationData(prev => ({
                        ...prev,
                        authorizerName: e.target.value
                      }))}
                      placeholder="Enter authorizer name"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Authorization Date & Time</Form.Label>
                    <Form.Control
                      type="text"
                      value={new Date().toLocaleString()}
                      disabled
                      className=""
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-4">
                <Form.Label className="text-white">Comments/Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={authorizationData.comments}
                  onChange={(e) => setAuthorizationData(prev => ({
                    ...prev,
                    comments: e.target.value
                  }))}
                  placeholder="Enter any comments or notes regarding this authorization"
                />
              </Form.Group>

              <div className="d-flex gap-3 justify-content-end">
                <Button
                  variant="outline-danger"
                  onClick={() => handleAuthorizationAction('reject')}
                  disabled={authorizing}
                >
                  <FontAwesomeIcon icon={faTimes} className="me-2" />
                  Reject Report
                </Button>
                <Button
                  variant="success"
                  onClick={() => handleAuthorizationAction('approve')}
                  disabled={authorizing || !authorizationData.authorizerName.trim()}
                >
                  <FontAwesomeIcon icon={faCheck} className="me-2" />
                  Approve & Authorize
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon
              icon={actionType === 'approve' ? faCheck : faTimes}
              className={`me-2 ${actionType === 'approve' ? 'text-success' : 'text-danger'}`}
            />
            {actionType === 'approve' ? 'Approve Report' : 'Reject Report'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            Are you sure you want to <strong>{actionType}</strong> this report?
          </p>

          <div className=" p-3 rounded mb-3">
            <div><strong>Report:</strong> {report?.sid_number}</div>
            <div><strong>Patient:</strong> {report?.patient_info?.full_name}</div>
            <div><strong>Authorizer:</strong> {authorizationData.authorizerName}</div>
            {authorizationData.comments && (
              <div><strong>Comments:</strong> {authorizationData.comments}</div>
            )}
          </div>

          {actionType === 'approve' && hasModifications && (
            <Alert variant="warning" className="mb-3">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              This report contains {modifiedTests.length} modified test result(s).
              Please ensure all changes have been reviewed.
            </Alert>
          )}

          <p className="text-muted small mb-0">
            This action cannot be undone. The report will be marked as {actionType}d
            and the authorization details will be permanently recorded.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button
            variant={actionType === 'approve' ? 'success' : 'danger'}
            onClick={handleAuthorizationSubmit}
            disabled={authorizing}
          >
            <FontAwesomeIcon
              icon={authorizing ? faSpinner : (actionType === 'approve' ? faCheck : faTimes)}
              spin={authorizing}
              className="me-2"
            />
            {authorizing ? 'Processing...' : `${actionType === 'approve' ? 'Approve' : 'Reject'} Report`}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BillingReportsAuthorize;
