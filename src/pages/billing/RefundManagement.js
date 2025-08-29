import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Table, Card, Alert, Modal, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUndo, faSearch, faCheckCircle, faExclamationTriangle, 
  faSpinner, faUser, faPhone, faCalendarAlt, faCreditCard,
  faFileInvoice, faThumbsUp, faTimes
} from '@fortawesome/free-solid-svg-icons';

const RefundManagement = () => {
  // States
  const [loading, setLoading] = useState(false);
  const [refundRequests, setRefundRequests] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    status: '',
    patient_name: ''
  });
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundData, setRefundData] = useState({
    refund_amount: '',
    refund_reason: '',
    refund_type: 'full',
    refund_method: 'Original Payment Method',
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refundReasons = [
    'Test Cancelled',
    'Duplicate Payment',
    'Service Not Provided',
    'Patient Request',
    'Medical Emergency',
    'Technical Error',
    'Quality Issue',
    'Other'
  ];

  // Load refund requests
  const loadRefundRequests = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value.trim()) {
          queryParams.append(key, value.trim());
        }
      });

      const response = await fetch(`/api/billing/refunds?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRefundRequests(data.items || []);
      } else {
        setError('Failed to load refund requests');
      }
    } catch (error) {
      console.error('Error loading refund requests:', error);
      setError('Error loading refund requests');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    loadRefundRequests();
  };

  // Handle refund processing
  const handleRefund = async () => {
    if (!selectedBilling || !refundData.refund_amount || !refundData.refund_reason) {
      setError('Please fill all required fields');
      return;
    }

    const amount = parseFloat(refundData.refund_amount);
    if (amount <= 0) {
      setError('Refund amount must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/billing/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          billing_id: selectedBilling.billing_id,
          refund_amount: amount,
          refund_reason: refundData.refund_reason,
          refund_type: refundData.refund_type,
          refund_method: refundData.refund_method,
          notes: refundData.notes
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(result.message);
        setShowRefundModal(false);
        setRefundData({
          refund_amount: '',
          refund_reason: '',
          refund_type: 'full',
          refund_method: 'Original Payment Method',
          notes: ''
        });
        loadRefundRequests(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      setError('Error processing refund');
    } finally {
      setLoading(false);
    }
  };

  // Handle refund approval
  const handleApproval = async (billingId, refundId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/billing/refund/${billingId}/${refundId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(result.message);
        loadRefundRequests(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to approve refund');
      }
    } catch (error) {
      console.error('Error approving refund:', error);
      setError('Error approving refund');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadRefundRequests();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending Approval':
        return <Badge bg="warning">Pending Approval</Badge>;
      case 'Approved':
        return <Badge bg="success">Approved</Badge>;
      case 'Rejected':
        return <Badge bg="danger">Rejected</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="refund-management p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <FontAwesomeIcon icon={faUndo} className="me-2" />
          Refund Management
        </h4>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess('')} dismissible>
          <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
          {success}
        </Alert>
      )}

      {/* Search Filters */}
      <Card className="mb-4">
        <Card.Header>
          <FontAwesomeIcon icon={faSearch} className="me-2" />
          Search Refund Requests
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={searchFilters.status}
                    onChange={(e) => setSearchFilters(prev => ({
                      ...prev,
                      status: e.target.value
                    }))}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending Approval</option>
                    <option value="approved">Approved</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Patient Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter patient name"
                    value={searchFilters.patient_name}
                    onChange={(e) => setSearchFilters(prev => ({
                      ...prev,
                      patient_name: e.target.value
                    }))}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>&nbsp;</Form.Label>
                  <div>
                    <Button type="submit" variant="primary" disabled={loading} className="me-2">
                      {loading ? (
                        <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                      ) : (
                        <FontAwesomeIcon icon={faSearch} className="me-2" />
                      )}
                      Search
                    </Button>
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Refund Requests Table */}
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <span>Refund Requests ({refundRequests.length})</span>
            <Badge bg="info">
              Total Refunds: ₹{refundRequests.reduce((sum, req) => sum + req.amount, 0).toFixed(2)}
            </Badge>
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <FontAwesomeIcon icon={faSpinner} spin size="2x" />
              <div className="mt-2">Loading refund requests...</div>
            </div>
          ) : refundRequests.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <FontAwesomeIcon icon={faFileInvoice} size="3x" className="mb-3" />
              <div>No refund requests found</div>
            </div>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>SID</th>
                  <th>Patient</th>
                  <th>Contact</th>
                  <th>Refund Amount</th>
                  <th>Reason</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Requested Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refundRequests.map((request) => (
                  <tr key={`${request.billing_id}-${request.refund_id}`}>
                    <td>
                      <strong>{request.sid_number}</strong>
                    </td>
                    <td>
                      <FontAwesomeIcon icon={faUser} className="me-1 text-muted" />
                      {request.patient_name}
                    </td>
                    <td>
                      <FontAwesomeIcon icon={faPhone} className="me-1 text-muted" />
                      {request.patient_mobile}
                    </td>
                    <td>
                      <strong className="text-danger">
                        ₹{request.amount.toFixed(2)}
                      </strong>
                    </td>
                    <td>{request.reason}</td>
                    <td>
                      <Badge bg={request.type === 'full' ? 'primary' : 'secondary'}>
                        {request.type}
                      </Badge>
                    </td>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-1 text-muted" />
                      {new Date(request.requested_at).toLocaleDateString()}
                    </td>
                    <td>
                      {request.status === 'Pending Approval' && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleApproval(request.billing_id, request.refund_id)}
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faThumbsUp} className="me-1" />
                          Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Refund Modal */}
      <Modal show={showRefundModal} onHide={() => setShowRefundModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faUndo} className="me-2" />
            Process Refund
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBilling && (
            <>
              <div className="mb-3 p-3 bg-light rounded">
                <Row>
                  <Col md={6}>
                    <strong>Patient:</strong> {selectedBilling.patient_name}<br />
                    <strong>SID:</strong> {selectedBilling.sid_number}<br />
                    <strong>Mobile:</strong> {selectedBilling.patient_mobile}
                  </Col>
                  <Col md={6}>
                    <strong>Total Amount:</strong> ₹{selectedBilling.total_amount?.toFixed(2)}<br />
                    <strong>Paid Amount:</strong> ₹{selectedBilling.paid_amount?.toFixed(2)}
                  </Col>
                </Row>
              </div>

              <Form>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Refund Amount *</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        value={refundData.refund_amount}
                        onChange={(e) => setRefundData(prev => ({
                          ...prev,
                          refund_amount: e.target.value
                        }))}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Refund Reason *</Form.Label>
                      <Form.Select
                        value={refundData.refund_reason}
                        onChange={(e) => setRefundData(prev => ({
                          ...prev,
                          refund_reason: e.target.value
                        }))}
                        required
                      >
                        <option value="">Select reason</option>
                        {refundReasons.map(reason => (
                          <option key={reason} value={reason}>{reason}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3 mt-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Refund Type</Form.Label>
                      <Form.Select
                        value={refundData.refund_type}
                        onChange={(e) => setRefundData(prev => ({
                          ...prev,
                          refund_type: e.target.value
                        }))}
                      >
                        <option value="full">Full Refund</option>
                        <option value="partial">Partial Refund</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Refund Method</Form.Label>
                      <Form.Select
                        value={refundData.refund_method}
                        onChange={(e) => setRefundData(prev => ({
                          ...prev,
                          refund_method: e.target.value
                        }))}
                      >
                        <option value="Original Payment Method">Original Payment Method</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mt-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Additional notes about the refund"
                    value={refundData.notes}
                    onChange={(e) => setRefundData(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRefundModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRefund} disabled={loading}>
            {loading ? (
              <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
            ) : (
              <FontAwesomeIcon icon={faUndo} className="me-2" />
            )}
            Process Refund
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RefundManagement;
