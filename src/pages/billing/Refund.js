import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Badge, Alert, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUndo, faSearch, faFilter, faDownload, faEye, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const Refund = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [refundForm, setRefundForm] = useState({
    amount: '',
    reason: '',
    refund_method: 'cash',
    notes: ''
  });

  useEffect(() => {
    fetchPaidInvoices();
    fetchRefunds();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [searchTerm, invoices]);

  const fetchPaidInvoices = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockInvoices = [
        {
          id: 'INV-001',
          patient_name: 'John Doe',
          invoice_date: '2024-01-15',
          total_amount: 1500.00,
          paid_amount: 1500.00,
          refunded_amount: 0.00,
          status: 'Paid',
          payment_method: 'Card'
        },
        {
          id: 'INV-002',
          patient_name: 'Jane Smith',
          invoice_date: '2024-01-20',
          total_amount: 2500.00,
          paid_amount: 2500.00,
          refunded_amount: 500.00,
          status: 'Partially Refunded',
          payment_method: 'Cash'
        }
      ];
      setInvoices(mockInvoices);
      setFilteredInvoices(mockInvoices);
    } catch (err) {
      setError('Failed to fetch paid invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchRefunds = async () => {
    try {
      // Mock refund data
      const mockRefunds = [
        {
          id: 'REF-001',
          invoice_id: 'INV-002',
          amount: 500.00,
          reason: 'Test cancelled',
          refund_date: '2024-01-25',
          status: 'Completed'
        }
      ];
      setRefunds(mockRefunds);
    } catch (err) {
      console.error('Failed to fetch refunds');
    }
  };

  const filterInvoices = () => {
    let filtered = invoices.filter(invoice => {
      const matchesSearch = 
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });

    setFilteredInvoices(filtered);
  };

  const handleRefundClick = (invoice) => {
    setSelectedInvoice(invoice);
    setRefundForm({
      amount: (invoice.paid_amount - invoice.refunded_amount).toString(),
      reason: '',
      refund_method: 'cash',
      notes: ''
    });
    setShowRefundModal(true);
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    
    if (!refundForm.amount || !refundForm.reason) {
      alert('Please fill in all required fields');
      return;
    }

    const refundAmount = parseFloat(refundForm.amount);
    const maxRefundable = selectedInvoice.paid_amount - selectedInvoice.refunded_amount;

    if (refundAmount > maxRefundable) {
      alert(`Refund amount cannot exceed ${formatCurrency(maxRefundable)}`);
      return;
    }

    try {
      // API call to process refund
      console.log('Processing refund:', {
        invoice_id: selectedInvoice.id,
        ...refundForm
      });
      
      alert('Refund processed successfully');
      setShowRefundModal(false);
      fetchPaidInvoices();
      fetchRefunds();
    } catch (err) {
      setError('Failed to process refund');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Paid': 'success',
      'Partially Refunded': 'warning',
      'Fully Refunded': 'secondary'
    };
    return <Badge bg={variants[status] || 'primary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">
                <FontAwesomeIcon icon={faUndo} className="me-2 text-danger" />
                Refund Management
              </h2>
              <p className="text-muted mb-0">Process refunds for paid invoices</p>
            </div>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Card className="shadow mb-4">
        <Card.Header>
          <h6 className="mb-0">
            <FontAwesomeIcon icon={faSearch} className="me-2" />
            Search Invoices
          </h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by invoice ID or patient name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Paid Invoices Table */}
      <Card className="shadow mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Paid Invoices ({filteredInvoices.length})</h6>
          <div>
            <Button variant="outline-primary" size="sm">
              <FontAwesomeIcon icon={faDownload} className="me-1" />
              Export
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table striped hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Invoice ID</th>
                  <th>Patient Name</th>
                  <th>Invoice Date</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Refunded Amount</th>
                  <th>Refundable Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => {
                    const refundableAmount = invoice.paid_amount - invoice.refunded_amount;
                    return (
                      <tr key={invoice.id}>
                        <td>
                          <strong>{invoice.id}</strong>
                        </td>
                        <td>{invoice.patient_name}</td>
                        <td>{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                        <td>{formatCurrency(invoice.total_amount)}</td>
                        <td>{formatCurrency(invoice.paid_amount)}</td>
                        <td>
                          {invoice.refunded_amount > 0 ? (
                            <span className="text-warning">
                              {formatCurrency(invoice.refunded_amount)}
                            </span>
                          ) : (
                            <span className="text-muted">₹0.00</span>
                          )}
                        </td>
                        <td>
                          <strong className="text-success">
                            {formatCurrency(refundableAmount)}
                          </strong>
                        </td>
                        <td>
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => navigate(`/billing/${invoice.id}`)}
                              title="View Invoice"
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </Button>
                            {refundableAmount > 0 && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleRefundClick(invoice)}
                                title="Process Refund"
                              >
                                <FontAwesomeIcon icon={faUndo} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      <div className="text-muted">
                        <FontAwesomeIcon icon={faUndo} size="3x" className="mb-3" />
                        <p>No paid invoices found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Recent Refunds */}
      <Card className="shadow">
        <Card.Header>
          <h6 className="mb-0">Recent Refunds</h6>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table striped hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Refund ID</th>
                  <th>Invoice ID</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {refunds.length > 0 ? (
                  refunds.map((refund) => (
                    <tr key={refund.id}>
                      <td><strong>{refund.id}</strong></td>
                      <td>{refund.invoice_id}</td>
                      <td>{formatCurrency(refund.amount)}</td>
                      <td>{refund.reason}</td>
                      <td>{new Date(refund.refund_date).toLocaleDateString()}</td>
                      <td>
                        <Badge bg="success">{refund.status}</Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <div className="text-muted">
                        <p>No refunds processed yet</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Refund Modal */}
      <Modal show={showRefundModal} onHide={() => setShowRefundModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faUndo} className="me-2" />
            Process Refund - {selectedInvoice?.id}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRefundSubmit}>
          <Modal.Body>
            {selectedInvoice && (
              <div className="mb-4 p-3 bg-light rounded">
                <Row>
                  <Col md={6}>
                    <strong>Patient:</strong> {selectedInvoice.patient_name}
                  </Col>
                  <Col md={6}>
                    <strong>Total Paid:</strong> {formatCurrency(selectedInvoice.paid_amount)}
                  </Col>
                  <Col md={6}>
                    <strong>Already Refunded:</strong> {formatCurrency(selectedInvoice.refunded_amount)}
                  </Col>
                  <Col md={6}>
                    <strong>Max Refundable:</strong> {formatCurrency(selectedInvoice.paid_amount - selectedInvoice.refunded_amount)}
                  </Col>
                </Row>
              </div>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Refund Amount <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={refundForm.amount}
                    onChange={(e) => setRefundForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Refund Method</Form.Label>
                  <Form.Select
                    value={refundForm.refund_method}
                    onChange={(e) => setRefundForm(prev => ({ ...prev, refund_method: e.target.value }))}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Reason for Refund <span className="text-danger">*</span></Form.Label>
              <Form.Select
                value={refundForm.reason}
                onChange={(e) => setRefundForm(prev => ({ ...prev, reason: e.target.value }))}
                required
              >
                <option value="">Select reason...</option>
                <option value="test_cancelled">Test Cancelled</option>
                <option value="duplicate_payment">Duplicate Payment</option>
                <option value="billing_error">Billing Error</option>
                <option value="patient_request">Patient Request</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Additional Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={refundForm.notes}
                onChange={(e) => setRefundForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter any additional notes..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowRefundModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit">
              <FontAwesomeIcon icon={faUndo} className="me-2" />
              Process Refund
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Refund;
