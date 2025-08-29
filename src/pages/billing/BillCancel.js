import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Badge, Alert, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faSearch, faFilter, faDownload, faEye, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const BillCancel = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [cancelForm, setCancelForm] = useState({
    reason: '',
    notes: '',
    refund_required: false
  });
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [searchTerm, filters, invoices]);

  const fetchInvoices = async () => {
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
          status: 'Paid',
          payment_method: 'Card',
          can_cancel: true
        },
        {
          id: 'INV-002',
          patient_name: 'Jane Smith',
          invoice_date: '2024-01-20',
          total_amount: 2500.00,
          paid_amount: 0.00,
          status: 'Pending',
          payment_method: null,
          can_cancel: true
        },
        {
          id: 'INV-003',
          patient_name: 'Bob Johnson',
          invoice_date: '2024-01-10',
          total_amount: 3000.00,
          paid_amount: 3000.00,
          status: 'Cancelled',
          payment_method: 'Cash',
          can_cancel: false
        }
      ];
      setInvoices(mockInvoices);
      setFilteredInvoices(mockInvoices);
    } catch (err) {
      setError('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices.filter(invoice => {
      const matchesSearch = 
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !filters.status || invoice.status === filters.status;
      const matchesDateFrom = !filters.dateFrom || invoice.invoice_date >= filters.dateFrom;
      const matchesDateTo = !filters.dateTo || invoice.invoice_date <= filters.dateTo;

      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });

    setFilteredInvoices(filtered);
  };

  const handleCancelClick = (invoice) => {
    setSelectedInvoice(invoice);
    setCancelForm({
      reason: '',
      notes: '',
      refund_required: invoice.paid_amount > 0
    });
    setShowCancelModal(true);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    
    if (!cancelForm.reason) {
      alert('Please select a reason for cancellation');
      return;
    }

    if (window.confirm(`Are you sure you want to cancel invoice ${selectedInvoice.id}?`)) {
      try {
        // API call to cancel invoice
        console.log('Cancelling invoice:', {
          invoice_id: selectedInvoice.id,
          ...cancelForm
        });
        
        alert('Invoice cancelled successfully');
        setShowCancelModal(false);
        fetchInvoices();
      } catch (err) {
        setError('Failed to cancel invoice');
      }
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
      'Pending': 'warning',
      'Paid': 'success',
      'Partial': 'info',
      'Cancelled': 'danger',
      'Overdue': 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
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
                <FontAwesomeIcon icon={faBan} className="me-2 text-dark" />
                Bill Cancellation
              </h2>
              <p className="text-muted mb-0">Cancel invoices and manage cancellations</p>
            </div>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card className="shadow mb-4">
        <Card.Header>
          <h6 className="mb-0">
            <FontAwesomeIcon icon={faFilter} className="me-2" />
            Filters
          </h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
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
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Overdue">Overdue</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>Date From</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>Date To</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>&nbsp;</Form.Label>
                <div className="d-grid">
                  <Button 
                    variant="outline-secondary"
                    onClick={() => {
                      setSearchTerm('');
                      setFilters({ status: '', dateFrom: '', dateTo: '' });
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Invoices Table */}
      <Card className="shadow">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Invoices ({filteredInvoices.length})</h6>
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
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <strong>{invoice.id}</strong>
                      </td>
                      <td>{invoice.patient_name}</td>
                      <td>{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                      <td>{formatCurrency(invoice.total_amount)}</td>
                      <td>
                        {invoice.paid_amount > 0 ? (
                          <span className="text-success">
                            {formatCurrency(invoice.paid_amount)}
                          </span>
                        ) : (
                          <span className="text-muted">₹0.00</span>
                        )}
                      </td>
                      <td>
                        {invoice.payment_method ? (
                          <Badge bg="info">{invoice.payment_method}</Badge>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
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
                          {invoice.can_cancel && invoice.status !== 'Cancelled' && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleCancelClick(invoice)}
                              title="Cancel Invoice"
                            >
                              <FontAwesomeIcon icon={faBan} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <div className="text-muted">
                        <FontAwesomeIcon icon={faBan} size="3x" className="mb-3" />
                        <p>No invoices found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Cancel Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faBan} className="me-2 text-danger" />
            Cancel Invoice - {selectedInvoice?.id}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCancelSubmit}>
          <Modal.Body>
            {selectedInvoice && (
              <>
                <Alert variant="warning">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                  <strong>Warning:</strong> This action cannot be undone. The invoice will be permanently cancelled.
                  {selectedInvoice.paid_amount > 0 && (
                    <div className="mt-2">
                      <strong>Note:</strong> This invoice has payments totaling {formatCurrency(selectedInvoice.paid_amount)}. 
                      A refund may be required.
                    </div>
                  )}
                </Alert>

                <div className="mb-4 p-3 bg-light rounded">
                  <Row>
                    <Col md={6}>
                      <strong>Patient:</strong> {selectedInvoice.patient_name}
                    </Col>
                    <Col md={6}>
                      <strong>Invoice Date:</strong> {new Date(selectedInvoice.invoice_date).toLocaleDateString()}
                    </Col>
                    <Col md={6}>
                      <strong>Total Amount:</strong> {formatCurrency(selectedInvoice.total_amount)}
                    </Col>
                    <Col md={6}>
                      <strong>Paid Amount:</strong> {formatCurrency(selectedInvoice.paid_amount)}
                    </Col>
                  </Row>
                </div>
              </>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Reason for Cancellation <span className="text-danger">*</span></Form.Label>
              <Form.Select
                value={cancelForm.reason}
                onChange={(e) => setCancelForm(prev => ({ ...prev, reason: e.target.value }))}
                required
              >
                <option value="">Select reason...</option>
                <option value="patient_request">Patient Request</option>
                <option value="billing_error">Billing Error</option>
                <option value="duplicate_invoice">Duplicate Invoice</option>
                <option value="test_not_performed">Test Not Performed</option>
                <option value="administrative_error">Administrative Error</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Additional Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={cancelForm.notes}
                onChange={(e) => setCancelForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter any additional notes about the cancellation..."
              />
            </Form.Group>

            {selectedInvoice?.paid_amount > 0 && (
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="refund_required"
                  label="Refund required for paid amount"
                  checked={cancelForm.refund_required}
                  onChange={(e) => setCancelForm(prev => ({ ...prev, refund_required: e.target.checked }))}
                />
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit">
              <FontAwesomeIcon icon={faBan} className="me-2" />
              Cancel Invoice
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default BillCancel;
