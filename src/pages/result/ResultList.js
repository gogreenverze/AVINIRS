import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, Table, Button, Form, InputGroup, Pagination, Row, Col, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faEye, faEdit, faCheck, faTimes,
  faUser, faVial, faCalendarAlt, faClipboardCheck, faFileAlt
} from '@fortawesome/free-solid-svg-icons';
import { resultAPI } from '../../services/api';
import '../../styles/ResultList.css';

const ResultList = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const patientIdParam = queryParams.get('patient_id');
  const sampleIdParam = queryParams.get('sample_id');

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientId, setPatientId] = useState(patientIdParam || '');
  const [sampleId, setSampleId] = useState(sampleIdParam || '');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [filterStatus, setFilterStatus] = useState('');

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch results data
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;
        if (patientId) {
          response = await resultAPI.getResultsByPatient(patientId);
        } else if (sampleId) {
          response = await resultAPI.getResultsBySample(sampleId);
        } else if (searchQuery) {
          response = await resultAPI.searchResults(searchQuery);
        } else {
          response = await resultAPI.getAllResults(currentPage);
        }

        setResults(response.data.items);
        setTotalPages(response.data.total_pages);
      } catch (err) {
        console.error('Error fetching results:', err);
        setError('Failed to load results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [currentPage, searchQuery, patientId, sampleId]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
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
      case 'Completed':
        return 'success';
      case 'Verified':
        return 'primary';
      case 'Rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Filter results by status
  const filteredResults = filterStatus
    ? results.filter(result => result.status === filterStatus)
    : results;

  return (
    <div className="result-list-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Results</h1>
        <div>
          <Link to="/results/create" className="btn btn-success me-2">
            <FontAwesomeIcon icon={faClipboardCheck} className="me-2" />
            Create Result
          </Link>
          <Link to="/results/reports" className="btn btn-primary">
            <FontAwesomeIcon icon={faFileAlt} className="me-2" />
            View Reports
          </Link>
        </div>
      </div>

      {/* Search Card */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Search Results</h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={6}>
                <InputGroup className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="Search by patient name, ID, or sample ID..."
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
                    <option value="Completed">Completed</option>
                    <option value="Verified">Verified</option>
                    <option value="Rejected">Rejected</option>
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
                    setSampleId('');
                    setFilterStatus('');
                  }}
                >
                  Clear Filters
                </Button>
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
          <p className="mt-2">Loading results...</p>
        </div>
      )}

      {/* Desktop View */}
      {!loading && !error && !isMobile && (
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              Result List
              <span className="badge bg-primary float-end">
                {filteredResults.length} Records
              </span>
            </h6>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table className="table-hover" width="100%" cellSpacing="0">
                <thead>
                  <tr>
                    <th>Result ID</th>
                    <th>Patient</th>
                    <th>Sample</th>
                    <th>Test</th>
                    <th>Result Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map(result => (
                    <tr key={result.id}>
                      <td>{result.result_id}</td>
                      <td>
                        {result.patient ? (
                          <Link to={`/patients/${result.patient.id}`}>
                            {result.patient.first_name} {result.patient.last_name}
                          </Link>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td>
                        {result.sample ? (
                          <Link to={`/samples/${result.sample.id}`}>
                            {result.sample.sample_id}
                          </Link>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td>{result.test?.test_name || 'N/A'}</td>
                      <td>{result.result_date ? new Date(result.result_date).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <Badge bg={getStatusBadgeVariant(result.status)}>
                          {result.status}
                        </Badge>
                      </td>
                      <td>
                        <Link to={`/results/${result.id}`} className="btn btn-info btn-sm me-1">
                          <FontAwesomeIcon icon={faEye} />
                        </Link>
                        {result.status === 'Pending' && (
                          <Link to={`/results/${result.id}/edit`} className="btn btn-primary btn-sm me-1">
                            <FontAwesomeIcon icon={faEdit} />
                          </Link>
                        )}
                        {result.status === 'Completed' && (
                          <Link to={`/results/${result.id}`} className="btn btn-success btn-sm me-1">
                            <FontAwesomeIcon icon={faCheck} />
                          </Link>
                        )}
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
        <div className="mobile-result-list">
          <div className="record-count mb-3">
            <span className="badge bg-primary">
              {filteredResults.length} Records
            </span>
          </div>

          {filteredResults.map(result => (
            <Card key={result.id} className="mb-3 mobile-card">
              <Card.Header className="py-2">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="card-title mb-0">Result {result.result_id}</h6>
                  <Badge bg={getStatusBadgeVariant(result.status)}>
                    {result.status}
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="result-info mb-3">
                  {result.patient && (
                    <div className="d-flex align-items-center mb-1">
                      <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                      <strong>Patient:</strong>
                      <span className="ms-2">
                        <Link to={`/patients/${result.patient.id}`}>
                          {result.patient.first_name} {result.patient.last_name}
                        </Link>
                      </span>
                    </div>
                  )}
                  {result.sample && (
                    <div className="d-flex align-items-center mb-1">
                      <FontAwesomeIcon icon={faVial} className="me-2 text-primary" />
                      <strong>Sample:</strong>
                      <span className="ms-2">
                        <Link to={`/samples/${result.sample.id}`}>
                          {result.sample.sample_id}
                        </Link>
                      </span>
                    </div>
                  )}
                  <div className="d-flex align-items-center mb-1">
                    <FontAwesomeIcon icon={faClipboardCheck} className="me-2 text-primary" />
                    <strong>Test:</strong>
                    <span className="ms-2">{result.test?.test_name || 'N/A'}</span>
                  </div>
                  <div className="d-flex align-items-center mb-1">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                    <strong>Date:</strong>
                    <span className="ms-2">
                      {result.result_date ? new Date(result.result_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="mobile-btn-group">
                  <Link to={`/results/${result.id}`} className="btn btn-info">
                    <FontAwesomeIcon icon={faEye} className="me-1" /> View
                  </Link>
                  {result.status === 'Pending' && (
                    <Link to={`/results/${result.id}/edit`} className="btn btn-primary">
                      <FontAwesomeIcon icon={faEdit} className="me-1" /> Edit
                    </Link>
                  )}
                  {result.status === 'Completed' && (
                    <Link to={`/results/${result.id}`} className="btn btn-success">
                      <FontAwesomeIcon icon={faCheck} className="me-1" /> Verify
                    </Link>
                  )}
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

export default ResultList;
