import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Form, InputGroup, Row, Col, Badge, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faArrowLeft, faEye, faMoneyBillWave, faPrint, 
  faUser, faCalendarAlt, faRupeeSign, faFileInvoiceDollar
} from '@fortawesome/free-solid-svg-icons';
import { billingAPI } from '../../services/api';
import ResponsiveBillingTable from '../../components/billing/ResponsiveBillingTable';

const BillingSearch = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Perform search on component mount if query exists
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  // Perform search
  const performSearch = async (query) => {
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const response = await billingAPI.searchBillings(query);
      setSearchResults(response.data.items || []);
    } catch (err) {
      console.error('Error searching billings:', err);
      setError('Failed to search invoices. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Paid': return 'success';
      case 'Partial': return 'info';
      case 'Cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <div className="billing-search-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-gray-800">
            <FontAwesomeIcon icon={faSearch} className="me-2" />
            Search Invoices
          </h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/billing">Billing Dashboard</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Search</li>
            </ol>
          </nav>
        </div>
        <div>
          <Link to="/billing" className="btn btn-secondary">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Search Form */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Search Invoices</h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={8}>
                <InputGroup className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="Search by SID number, invoice number, or patient name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <Button variant="primary" type="submit" disabled={loading}>
                    <FontAwesomeIcon icon={faSearch} className="me-2" />
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                </InputGroup>
              </Col>
              <Col md={4}>
                <div className="d-grid">
                  <Button 
                    variant="outline-secondary"
                    onClick={() => navigate('/billing/list')}
                  >
                    <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
                    View All Invoices
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Searching...</span>
          </div>
          <p className="mt-2">Searching invoices...</p>
        </div>
      )}

      {/* Search Results */}
      {hasSearched && !loading && (
        <Card className="shadow">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              Search Results
              {searchResults.length > 0 && (
                <span className="badge bg-primary float-end">
                  {searchResults.length} Found
                </span>
              )}
            </h6>
          </Card.Header>
          <Card.Body>
            {searchResults.length > 0 ? (
              <ResponsiveBillingTable
                billings={searchResults}
                title="Search Results"
                loading={false}
                itemsPerPage={20}
              />
            ) : (
              <div className="text-center py-4">
                <div className="text-muted">
                  <FontAwesomeIcon icon={faSearch} size="3x" className="mb-3" />
                  <h5>No invoices found</h5>
                  <p>Try searching with different keywords or check the spelling.</p>
                  <div className="mt-3">
                    <Link to="/billing/list" className="btn btn-outline-primary me-2">
                      View All Invoices
                    </Link>
                    {/* <Link to="/billing/create" className="btn btn-primary">
                      Create New Invoice
                    </Link> */}
                  </div>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Initial State */}
      {!hasSearched && !loading && (
        <Card className="shadow">
          <Card.Body className="text-center py-5">
            <div className="text-muted">
              <FontAwesomeIcon icon={faSearch} size="4x" className="mb-4" />
              <h4>Search for Invoices</h4>
              <p className="mb-4">Enter an invoice number, patient name, or patient ID to search for invoices.</p>
              <div>
                <Link to="/billing/list" className="btn btn-outline-primary me-2">
                  <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
                  Browse All Invoices
                </Link>
                {/* <Link to="/billing/create" className="btn btn-primary">
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  Create New Invoice
                </Link> */}
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default BillingSearch;
