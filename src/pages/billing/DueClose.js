import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Badge, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle, faSearch, faFilter, faDownload, faEye } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const DueClose = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: ''
  });

  useEffect(() => {
    fetchDueInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [searchTerm, filters, invoices]);

  const fetchDueInvoices = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockInvoices = [
        {
          id: 'INV-001',
          patient_name: 'John Doe',
          invoice_date: '2024-01-15',
          due_date: '2024-02-15',
          total_amount: 1500.00,
          paid_amount: 500.00,
          due_amount: 1000.00,
          status: 'Overdue',
          days_overdue: 15
        },
        {
          id: 'INV-002',
          patient_name: 'Jane Smith',
          invoice_date: '2024-01-20',
          due_date: '2024-02-20',
          total_amount: 2500.00,
          paid_amount: 1000.00,
          due_amount: 1500.00,
          status: 'Due',
          days_overdue: 5
        }
      ];
      setInvoices(mockInvoices);
      setFilteredInvoices(mockInvoices);
    } catch (err) {
      setError('Failed to fetch due invoices');
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices.filter(invoice => {
      const matchesSearch = 
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDateFrom = !filters.dateFrom || invoice.invoice_date >= filters.dateFrom;
      const matchesDateTo = !filters.dateTo || invoice.invoice_date <= filters.dateTo;
      const matchesMinAmount = !filters.minAmount || invoice.due_amount >= parseFloat(filters.minAmount);
      const matchesMaxAmount = !filters.maxAmount || invoice.due_amount <= parseFloat(filters.maxAmount);

      return matchesSearch && matchesDateFrom && matchesDateTo && matchesMinAmount && matchesMaxAmount;
    });

    setFilteredInvoices(filtered);
  };

  const handleSelectInvoice = (invoiceId) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map(inv => inv.id));
    }
  };

  const handleCloseDues = async () => {
    if (selectedInvoices.length === 0) {
      alert('Please select invoices to close');
      return;
    }

    if (window.confirm(`Are you sure you want to close ${selectedInvoices.length} due invoice(s)?`)) {
      try {
        // API call to close dues
        console.log('Closing dues for invoices:', selectedInvoices);
        alert('Selected dues have been closed successfully');
        setSelectedInvoices([]);
        fetchDueInvoices();
      } catch (err) {
        setError('Failed to close dues');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusBadge = (status, daysOverdue) => {
    if (status === 'Overdue') {
      return <Badge bg="danger">Overdue ({daysOverdue} days)</Badge>;
    }
    return <Badge bg="warning">Due ({daysOverdue} days)</Badge>;
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
                <FontAwesomeIcon icon={faTimesCircle} className="me-2 text-warning" />
                Due Close Management
              </h2>
              <p className="text-muted mb-0">Manage and close overdue invoices</p>
            </div>
            <div>
              <Button 
                variant="warning" 
                onClick={handleCloseDues}
                disabled={selectedInvoices.length === 0}
              >
                <FontAwesomeIcon icon={faTimesCircle} className="me-2" />
                Close Selected Dues ({selectedInvoices.length})
              </Button>
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
            <Col md={3}>
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
                <Form.Label>Min Amount</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Min due amount"
                  value={filters.minAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>Max Amount</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Max due amount"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={1}>
              <Form.Group className="mb-3">
                <Form.Label>&nbsp;</Form.Label>
                <div className="d-grid">
                  <Button 
                    variant="outline-secondary"
                    onClick={() => {
                      setSearchTerm('');
                      setFilters({ dateFrom: '', dateTo: '', minAmount: '', maxAmount: '' });
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

      {/* Due Invoices Table */}
      <Card className="shadow">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Due Invoices ({filteredInvoices.length})</h6>
          <div>
            <Button variant="outline-primary" size="sm" className="me-2">
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
                  <th>
                    <Form.Check
                      type="checkbox"
                      checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Invoice ID</th>
                  <th>Patient Name</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Due Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={() => handleSelectInvoice(invoice.id)}
                        />
                      </td>
                      <td>
                        <strong>{invoice.id}</strong>
                      </td>
                      <td>{invoice.patient_name}</td>
                      <td>{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                      <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                      <td>{formatCurrency(invoice.total_amount)}</td>
                      <td>{formatCurrency(invoice.paid_amount)}</td>
                      <td>
                        <strong className="text-danger">
                          {formatCurrency(invoice.due_amount)}
                        </strong>
                      </td>
                      <td>
                        {getStatusBadge(invoice.status, invoice.days_overdue)}
                      </td>
                      <td>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => navigate(`/billing/${invoice.id}`)}
                          title="View Invoice"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center py-4">
                      <div className="text-muted">
                        <FontAwesomeIcon icon={faTimesCircle} size="3x" className="mb-3" />
                        <p>No due invoices found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DueClose;
