import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, Table, Button, Form, InputGroup, Pagination, Row, Col, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faPlus, faEye, faMoneyBillWave, faPrint, 
  faUser, faCalendarAlt, faRupeeSign, faFileInvoiceDollar
} from '@fortawesome/free-solid-svg-icons';
import { billingAPI } from '../../services/api';
import '../../styles/BillingList.css';

const BillingList = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const patientIdParam = queryParams.get('patient_id');

  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientId, setPatientId] = useState(patientIdParam || '');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch billings data
  useEffect(() => {
    const fetchBillings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let params = { page: currentPage };
        
        if (patientId) {
          params.patient_id = patientId;
        }
        
        if (searchQuery) {
          params.search = searchQuery;
        }
        
        if (filterStatus) {
          params.status = filterStatus;
        }
        
        if (dateRange.startDate) {
          params.start_date = dateRange.startDate;
        }
        
        if (dateRange.endDate) {
          params.end_date = dateRange.endDate;
        }
        
        const response = await billingAPI.getAllBillings(params);
        setBillings(response.data.items);
        setTotalPages(response.data.total_pages);
      } catch (err) {
        console.error('Error fetching billings:', err);
        setError('Failed to load billing records. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBillings();
  }, [currentPage, searchQuery, patientId, filterStatus, dateRange]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  // Handle date range change
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle pagination
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    
    // Previous button
    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      />
    );
    
    // First page
    items.push(
      <Pagination.Item 
        key={1} 
        active={currentPage === 1}
        onClick={() => handlePageChange(1)}
      >
        1
      </Pagination.Item>
    );
    
    // Ellipsis if needed
    if (currentPage > 3) {
      items.push(<Pagination.Ellipsis key="ellipsis1" disabled />);
    }
    
    // Pages around current page
    for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page++) {
      items.push(
        <Pagination.Item 
          key={page} 
          active={currentPage === page}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }
    
    // Ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
    }
    
    // Last page if not first page
    if (totalPages > 1) {
      items.push(
        <Pagination.Item 
          key={totalPages} 
          active={currentPage === totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    // Next button
    items.push(
      <Pagination.Next 
        key="next" 
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      />
    );
    
    return items;
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Paid':
        return 'success';
      case 'Partial':
        return 'info';
      case 'Cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="billing-list-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Billing</h1>
        <div>
          <Link to="/billing/create" className="btn btn-primary">
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Search Card */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Search Invoices</h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={6}>
                <InputGroup className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="Search by invoice #, patient name, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button variant="primary" type="submit">
                    <FontAwesomeIcon icon={faSearch} />
                  </Button>
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Cancelled">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Button 
                  variant="secondary" 
                  className="w-100"
                  onClick={() => {
                    setSearchQuery('');
                    setPatientId('');
                    setFilterStatus('');
                    setDateRange({ startDate: '', endDate: '' });
                  }}
                >
                  Clear Filters
                </Button>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={dateRange.startDate}
                    onChange={handleDateChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={dateRange.endDate}
                    onChange={handleDateChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Loading Message */}
      {loading && (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading billing records...</p>
        </div>
      )}

      {/* Desktop View */}
      {!loading && !error && !isMobile && (
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              Invoice List
              <span className="badge bg-primary float-end">
                {billings.length} Records
              </span>
            </h6>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table className="table-hover" width="100%" cellSpacing="0">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {billings.map(billing => (
                    <tr key={billing.id}>
                      <td>{billing.invoice_number}</td>
                      <td>
                        {billing.patient ? (
                          <Link to={`/patients/${billing.patient.id}`}>
                            {billing.patient.first_name} {billing.patient.last_name}
                          </Link>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td>{new Date(billing.invoice_date).toLocaleDateString()}</td>
                      <td>
                        <FontAwesomeIcon icon={faRupeeSign} className="me-1" />
                        {billing.total_amount.toFixed(2)}
                      </td>
                      <td>
                        <Badge bg={getStatusBadgeVariant(billing.status)}>
                          {billing.status}
                        </Badge>
                      </td>
                      <td>
                        <Link to={`/billing/${billing.id}`} className="btn btn-info btn-sm me-1">
                          <FontAwesomeIcon icon={faEye} />
                        </Link>
                        {billing.status !== 'Paid' && billing.status !== 'Cancelled' && (
                          <Link to={`/billing/${billing.id}/collect`} className="btn btn-success btn-sm me-1">
                            <FontAwesomeIcon icon={faMoneyBillWave} />
                          </Link>
                        )}
                        <Link to={`/billing/${billing.id}/print`} className="btn btn-primary btn-sm">
                          <FontAwesomeIcon icon={faPrint} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Mobile View */}
      {!loading && !error && isMobile && (
        <div className="mobile-billing-list">
          <div className="record-count mb-3">
            <span className="badge bg-primary">
              {billings.length} Records
            </span>
          </div>

          {billings.map(billing => (
            <Card key={billing.id} className="mb-3 mobile-card">
              <Card.Header className="py-2">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="card-title mb-0">Invoice #{billing.invoice_number}</h6>
                  <Badge bg={getStatusBadgeVariant(billing.status)}>
                    {billing.status}
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="billing-info mb-3">
                  {billing.patient && (
                    <div className="d-flex align-items-center mb-1">
                      <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                      <strong>Patient:</strong>
                      <span className="ms-2">
                        <Link to={`/patients/${billing.patient.id}`}>
                          {billing.patient.first_name} {billing.patient.last_name}
                        </Link>
                      </span>
                    </div>
                  )}
                  <div className="d-flex align-items-center mb-1">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                    <strong>Date:</strong>
                    <span className="ms-2">{new Date(billing.invoice_date).toLocaleDateString()}</span>
                  </div>
                  <div className="d-flex align-items-center mb-1">
                    <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2 text-primary" />
                    <strong>Amount:</strong>
                    <span className="ms-2">
                      <FontAwesomeIcon icon={faRupeeSign} className="me-1" />
                      {billing.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mobile-btn-group">
                  <Link to={`/billing/${billing.id}`} className="btn btn-info">
                    <FontAwesomeIcon icon={faEye} className="me-1" /> View
                  </Link>
                  {billing.status !== 'Paid' && billing.status !== 'Cancelled' && (
                    <Link to={`/billing/${billing.id}/collect`} className="btn btn-success">
                      <FontAwesomeIcon icon={faMoneyBillWave} className="me-1" /> Collect
                    </Link>
                  )}
                  <Link to={`/billing/${billing.id}/print`} className="btn btn-primary">
                    <FontAwesomeIcon icon={faPrint} className="me-1" /> Print
                  </Link>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>{renderPaginationItems()}</Pagination>
        </div>
      )}
    </div>
  );
};

export default BillingList;
