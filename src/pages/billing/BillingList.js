import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Form, InputGroup, Row, Col, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faPlus, faFileInvoiceDollar, faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { billingAPI } from '../../services/api';
import ResponsiveBillingTable from '../../components/billing/ResponsiveBillingTable';
import '../../styles/BillingList.css';

const BillingList = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const patientIdParam = queryParams.get('patient_id');

  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientId, setPatientId] = useState(patientIdParam || '');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });



  // Fetch billings data
  useEffect(() => {
    const fetchBillings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let params = {};

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
        setBillings(response.data.items || response.data);
      } catch (err) {
        console.error('Error fetching billings:', err);
        setError('Failed to load billing records. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBillings();
  }, [searchQuery, patientId, filterStatus, dateRange]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
  };

  // Handle date range change
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };



  return (
    <div className="billing-list-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 mb-0 text-gray-800">All Invoices</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/billing">Billing Dashboard</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">All Invoices</li>
            </ol>
          </nav>
        </div>
        <div>
          <Link to="/billing" className="btn btn-secondary me-2">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Dashboard
          </Link>
          {/* <Link to="/billing/create" className="btn btn-primary">
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            New Invoice
          </Link> */}
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
                    placeholder="Search by SID #, invoice #, patient name..."
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

      {/* Responsive Billing Table */}
      {!loading && !error && (
        <ResponsiveBillingTable
          billings={billings}
          title="Invoice List"
          loading={loading}
          itemsPerPage={20}
        />
      )}
    </div>
  );
};

export default BillingList;
