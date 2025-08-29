import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Form, Button, Row, Col, Table, InputGroup, Alert,
  Badge, Spinner, Modal, OverlayTrigger, Tooltip
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faCheck, faTimes, faEye, faFileInvoiceDollar,
  faCalendarAlt, faUser, faPhone, faBuilding, faSpinner,
  faExclamationTriangle, faCheckCircle, faInfoCircle, faClipboardCheck,
  faArrowLeft, faFilter, faClock
} from '@fortawesome/free-solid-svg-icons';
import billingReportsAPI from '../../services/billingReportsAPI';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import '../../styles/ReportAuthorization.css';

/**
 * Report Authorization Screen
 * Centralized queue for authorizing completed reports
 */
const ReportAuthorization = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentTenantContext } = useTenant();

  // State management
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending_authorization');
  const [selectedReports, setSelectedReports] = useState([]);
  const [authorizingReports, setAuthorizingReports] = useState([]);
  
  // Authorization modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authorizationData, setAuthorizationData] = useState({
    approverName: '',
    approvalComments: '',
    reportIds: []
  });

  // Load reports on component mount
  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const loadReports = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await billingReportsAPI.getAllReports();
      
      if (response.success && response.data?.data?.data) {
        let allReports = response.data.data.data;
        
        // Filter reports based on status
        const filteredReports = allReports.filter(report => {
          if (statusFilter === 'pending_authorization') {
            return report.status === 'completed' && !report.authorized;
          } else if (statusFilter === 'authorized') {
            return report.authorized === true;
          } else if (statusFilter === 'all') {
            return true;
          }
          return report.status === statusFilter;
        });

        setReports(filteredReports);
      } else {
        setError('Failed to load reports for authorization');
      }
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter reports based on search term
  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      report.sid_number?.toLowerCase().includes(searchLower) ||
      report.patient_info?.full_name?.toLowerCase().includes(searchLower) ||
      report.clinic_name?.toLowerCase().includes(searchLower)
    );
  });

  // Handle report selection
  const handleReportSelection = (reportId, isSelected) => {
    if (isSelected) {
      setSelectedReports(prev => [...prev, reportId]);
    } else {
      setSelectedReports(prev => prev.filter(id => id !== reportId));
    }
  };

  // Handle select all
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedReports(filteredReports.map(report => report.id));
    } else {
      setSelectedReports([]);
    }
  };

  // Open authorization modal
  const handleAuthorizeSelected = () => {
    if (selectedReports.length === 0) {
      setError('Please select at least one report to authorize');
      return;
    }

    setAuthorizationData({
      approverName: `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim(),
      approvalComments: '',
      reportIds: selectedReports
    });
    setShowAuthModal(true);
  };

  // Handle authorization submission
  const handleAuthorizationSubmit = async () => {
    if (!authorizationData.approverName.trim()) {
      setError('Approver name is required');
      return;
    }

    setAuthorizingReports(authorizationData.reportIds);

    try {
      // Call authorization API for each selected report
      const authorizationPromises = authorizationData.reportIds.map(reportId => 
        billingReportsAPI.authorizeReport(reportId, {
          approverName: authorizationData.approverName,
          approvalComments: authorizationData.approvalComments,
          approvalTimestamp: new Date().toISOString()
        })
      );

      await Promise.all(authorizationPromises);

      // Reload reports and reset state
      await loadReports();
      setSelectedReports([]);
      setShowAuthModal(false);
      setAuthorizationData({
        approverName: '',
        approvalComments: '',
        reportIds: []
      });

      // Show success message
      setError('');
      // You could add a success state here if needed

    } catch (err) {
      console.error('Error authorizing reports:', err);
      setError('Failed to authorize reports. Please try again.');
    } finally {
      setAuthorizingReports([]);
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (report) => {
    if (report.authorized) return 'success';
    if (report.status === 'completed') return 'warning';
    if (report.status === 'pending') return 'secondary';
    return 'primary';
  };

  // Get status display text
  const getStatusText = (report) => {
    if (report.authorized) return 'Authorized';
    if (report.status === 'completed') return 'Pending Authorization';
    return report.status || 'Unknown';
  };

  return (
    <div className="report-authorization">
      {/* Header */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className="header-title-section">
              <h1 className="h4 mb-1 text-primary fw-bold">
                <FontAwesomeIcon icon={faClipboardCheck} className="me-2" />
                Report Authorization Queue
              </h1>
              <p className="text-muted mb-0 small">Review and authorize completed reports</p>
            </div>
            <div className="header-actions d-flex gap-2">
              <Button variant="outline-secondary" onClick={() => navigate('/billing/reports')}>
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                Back to Reports
              </Button>
              {selectedReports.length > 0 && (
                <Button variant="success" onClick={handleAuthorizeSelected}>
                  <FontAwesomeIcon icon={faCheck} className="me-2" />
                  Authorize Selected ({selectedReports.length})
                </Button>
              )}
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

      {/* Filters and Search */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FontAwesomeIcon icon={faSearch} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by SID, Patient Name, or Clinic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="pending_authorization">Pending Authorization</option>
                <option value="authorized">Authorized</option>
                <option value="all">All Reports</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button variant="outline-primary" onClick={loadReports} disabled={loading}>
                <FontAwesomeIcon icon={loading ? faSpinner : faFilter} spin={loading} className="me-1" />
                Refresh
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Reports Table */}
      <Card className="shadow-sm border-0">
        <Card.Header className="py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-semibold">
              Authorization Queue
              <Badge bg="primary" className="ms-2">
                {filteredReports.length} Reports
              </Badge>
            </h6>
            {filteredReports.length > 0 && statusFilter === 'pending_authorization' && (
              <Form.Check
                type="checkbox"
                label="Select All"
                checked={selectedReports.length === filteredReports.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            )}
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <div className="mt-2">Loading reports...</div>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-5">
              <FontAwesomeIcon icon={faInfoCircle} size="3x" className="text-muted mb-3" />
              <h5 className="text-muted">No reports found</h5>
              <p className="text-muted">
                {statusFilter === 'pending_authorization' 
                  ? 'No reports are currently pending authorization'
                  : 'No reports match your current filter criteria'
                }
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table className="table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    {statusFilter === 'pending_authorization' && <th width="50">Select</th>}
                    <th>SID #</th>
                    <th>Patient</th>
                    <th>Clinic</th>
                    <th>Date</th>
                    <th>Tests</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map(report => (
                    <tr key={report.id}>
                      {statusFilter === 'pending_authorization' && (
                        <td>
                          <Form.Check
                            type="checkbox"
                            checked={selectedReports.includes(report.id)}
                            onChange={(e) => handleReportSelection(report.id, e.target.checked)}
                            disabled={authorizingReports.includes(report.id)}
                          />
                        </td>
                      )}
                      <td>
                        <span className="fw-bold text-primary">{report.sid_number}</span>
                      </td>
                      <td>
                        <div>
                          <FontAwesomeIcon icon={faUser} className="me-1 text-muted" />
                          {report.patient_info?.full_name || 'N/A'}
                        </div>
                        {report.patient_info?.phone && (
                          <small className="text-muted">
                            <FontAwesomeIcon icon={faPhone} className="me-1" />
                            {report.patient_info.phone}
                          </small>
                        )}
                      </td>
                      <td>
                        <FontAwesomeIcon icon={faBuilding} className="me-1 text-muted" />
                        {report.clinic_name}
                      </td>
                      <td>
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-1 text-muted" />
                        {billingReportsAPI.formatDate(report.billing_date)}
                      </td>
                      <td>
                        <Badge bg="info">{report.test_count} tests</Badge>
                      </td>
                      <td>
                        <strong>{billingReportsAPI.formatCurrency(report.total_amount)}</strong>
                      </td>
                      <td>
                        <Badge bg={getStatusBadgeVariant(report)}>
                          {getStatusText(report)}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>View Report Details</Tooltip>}
                          >
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => navigate(`/billing/reports/${report.sid_number}`)}
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </Button>
                          </OverlayTrigger>
                          {!report.authorized && report.status === 'completed' && (
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Authorize Report</Tooltip>}
                            >
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => {
                                  setSelectedReports([report.id]);
                                  handleAuthorizeSelected();
                                }}
                                disabled={authorizingReports.includes(report.id)}
                              >
                                {authorizingReports.includes(report.id) ? (
                                  <FontAwesomeIcon icon={faSpinner} spin />
                                ) : (
                                  <FontAwesomeIcon icon={faCheck} />
                                )}
                              </Button>
                            </OverlayTrigger>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Authorization Modal */}
      <Modal show={showAuthModal} onHide={() => setShowAuthModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faClipboardCheck} className="me-2" />
            Authorize Reports
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            You are about to authorize <strong>{authorizationData.reportIds.length}</strong> report(s).
            This action will mark the reports as authorized and ready for final distribution.
          </p>
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Authorizer Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={authorizationData.approverName}
                onChange={(e) => setAuthorizationData(prev => ({
                  ...prev,
                  approverName: e.target.value
                }))}
                placeholder="Enter authorizer name"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Authorization Comments</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={authorizationData.approvalComments}
                onChange={(e) => setAuthorizationData(prev => ({
                  ...prev,
                  approvalComments: e.target.value
                }))}
                placeholder="Enter any additional comments (optional)"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAuthModal(false)}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleAuthorizationSubmit}
            disabled={!authorizationData.approverName.trim() || authorizingReports.length > 0}
          >
            <FontAwesomeIcon icon={authorizingReports.length > 0 ? faSpinner : faCheck} 
                           spin={authorizingReports.length > 0} className="me-2" />
            {authorizingReports.length > 0 ? 'Authorizing...' : 'Authorize Reports'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ReportAuthorization;
