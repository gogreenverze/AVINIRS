import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Badge, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHandHoldingUsd, faSearch, faFilter, faDownload, faEye, 
  faCalendarAlt, faRupeeSign, faChartLine, faFileInvoiceDollar 
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const Collection = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [filteredCollections, setFilteredCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState({
    totalCollected: 0,
    totalInvoices: 0,
    cashCollections: 0,
    cardCollections: 0,
    onlineCollections: 0
  });
  const [filters, setFilters] = useState({
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    collectedBy: ''
  });

  useEffect(() => {
    fetchCollections();
  }, [filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    filterCollections();
    calculateSummary();
  }, [searchTerm, filters.paymentMethod, filters.collectedBy, collections]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockCollections = [
        {
          id: 'COL-001',
          invoice_id: 'INV-001',
          patient_name: 'John Doe',
          collection_date: '2024-01-25',
          collection_time: '10:30 AM',
          amount: 1500.00,
          payment_method: 'Cash',
          collected_by: 'Admin User',
          receipt_number: 'RCP-001',
          status: 'Completed'
        },
        {
          id: 'COL-002',
          invoice_id: 'INV-002',
          patient_name: 'Jane Smith',
          collection_date: '2024-01-25',
          collection_time: '11:15 AM',
          amount: 2500.00,
          payment_method: 'Card',
          collected_by: 'Admin User',
          receipt_number: 'RCP-002',
          status: 'Completed'
        },
        {
          id: 'COL-003',
          invoice_id: 'INV-003',
          patient_name: 'Bob Johnson',
          collection_date: '2024-01-25',
          collection_time: '02:45 PM',
          amount: 750.00,
          payment_method: 'Online',
          collected_by: 'System',
          receipt_number: 'RCP-003',
          status: 'Completed'
        }
      ];
      setCollections(mockCollections);
      setFilteredCollections(mockCollections);
    } catch (err) {
      setError('Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  };

  const filterCollections = () => {
    let filtered = collections.filter(collection => {
      const matchesSearch = 
        collection.invoice_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.receipt_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPaymentMethod = !filters.paymentMethod || collection.payment_method === filters.paymentMethod;
      const matchesCollectedBy = !filters.collectedBy || collection.collected_by.toLowerCase().includes(filters.collectedBy.toLowerCase());

      return matchesSearch && matchesPaymentMethod && matchesCollectedBy;
    });

    setFilteredCollections(filtered);
  };

  const calculateSummary = () => {
    const totalCollected = filteredCollections.reduce((sum, col) => sum + col.amount, 0);
    const totalInvoices = filteredCollections.length;
    const cashCollections = filteredCollections
      .filter(col => col.payment_method === 'Cash')
      .reduce((sum, col) => sum + col.amount, 0);
    const cardCollections = filteredCollections
      .filter(col => col.payment_method === 'Card')
      .reduce((sum, col) => sum + col.amount, 0);
    const onlineCollections = filteredCollections
      .filter(col => col.payment_method === 'Online')
      .reduce((sum, col) => sum + col.amount, 0);

    setSummary({
      totalCollected,
      totalInvoices,
      cashCollections,
      cardCollections,
      onlineCollections
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getPaymentMethodBadge = (method) => {
    const variants = {
      'Cash': 'success',
      'Card': 'primary',
      'Online': 'info',
      'Cheque': 'warning'
    };
    return <Badge bg={variants[method] || 'secondary'}>{method}</Badge>;
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
                <FontAwesomeIcon icon={faHandHoldingUsd} className="me-2 text-success" />
                Collection Management
              </h2>
              <p className="text-muted mb-0">Track and manage payment collections</p>
            </div>
            <div>
              <Button 
                variant="success" 
                onClick={() => navigate('/billing/list?status=Pending')}
              >
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
                Collect Payments
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

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-3">
          <Card className="border-left-primary shadow h-100 py-2">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col className="mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Collections
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {formatCurrency(summary.totalCollected)}
                  </div>
                </Col>
                <Col className="col-auto">
                  <FontAwesomeIcon icon={faRupeeSign} className="fa-2x text-gray-300" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card className="border-left-success shadow h-100 py-2">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col className="mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Total Invoices
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {summary.totalInvoices}
                  </div>
                </Col>
                <Col className="col-auto">
                  <FontAwesomeIcon icon={faFileInvoiceDollar} className="fa-2x text-gray-300" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card className="border-left-info shadow h-100 py-2">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col className="mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Cash Collections
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {formatCurrency(summary.cashCollections)}
                  </div>
                </Col>
                <Col className="col-auto">
                  <FontAwesomeIcon icon={faHandHoldingUsd} className="fa-2x text-gray-300" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card className="border-left-warning shadow h-100 py-2">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col className="mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Card/Online
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {formatCurrency(summary.cardCollections + summary.onlineCollections)}
                  </div>
                </Col>
                <Col className="col-auto">
                  <FontAwesomeIcon icon={faChartLine} className="fa-2x text-gray-300" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
                  placeholder="Search by invoice, patient, or receipt..."
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
                <Form.Label>Payment Method</Form.Label>
                <Form.Select
                  value={filters.paymentMethod}
                  onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <option value="">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Online">Online</option>
                  <option value="Cheque">Cheque</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>Collected By</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter name..."
                  value={filters.collectedBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, collectedBy: e.target.value }))}
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
                      setFilters(prev => ({ 
                        ...prev, 
                        paymentMethod: '', 
                        collectedBy: '' 
                      }));
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

      {/* Collections Table */}
      <Card className="shadow">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Collections ({filteredCollections.length})</h6>
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
                  <th>Collection ID</th>
                  <th>Invoice ID</th>
                  <th>Patient Name</th>
                  <th>Date & Time</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Collected By</th>
                  <th>Receipt No.</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCollections.length > 0 ? (
                  filteredCollections.map((collection) => (
                    <tr key={collection.id}>
                      <td>
                        <strong>{collection.id}</strong>
                      </td>
                      <td>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => navigate(`/billing/${collection.invoice_id}`)}
                          className="p-0"
                        >
                          {collection.invoice_id}
                        </Button>
                      </td>
                      <td>{collection.patient_name}</td>
                      <td>
                        <div>
                          <div>{new Date(collection.collection_date).toLocaleDateString()}</div>
                          <small className="text-muted">{collection.collection_time}</small>
                        </div>
                      </td>
                      <td>
                        <strong className="text-success">
                          {formatCurrency(collection.amount)}
                        </strong>
                      </td>
                      <td>
                        {getPaymentMethodBadge(collection.payment_method)}
                      </td>
                      <td>{collection.collected_by}</td>
                      <td>
                        <code>{collection.receipt_number}</code>
                      </td>
                      <td>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => navigate(`/billing/${collection.invoice_id}`)}
                          title="View Invoice"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      <div className="text-muted">
                        <FontAwesomeIcon icon={faHandHoldingUsd} size="3x" className="mb-3" />
                        <p>No collections found for the selected criteria</p>
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

export default Collection;
