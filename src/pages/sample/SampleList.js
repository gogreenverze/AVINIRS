import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, Table, Button, Form, InputGroup, Pagination, Row, Col, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faPlus, faEye, faEdit, faFlask, 
  faUser, faVial, faCalendarAlt, faExchangeAlt
} from '@fortawesome/free-solid-svg-icons';
import { sampleAPI } from '../../services/api';
import '../../styles/SampleList.css';

const SampleList = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const patientIdParam = queryParams.get('patient_id');

  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientId, setPatientId] = useState(patientIdParam || '');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [patientName, setPatientName] = useState('');

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch samples data
  useEffect(() => {
    const fetchSamples = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        if (patientId) {
          response = await sampleAPI.getSamplesByPatient(patientId);
          if (response.data.patient) {
            setPatientName(`${response.data.patient.first_name} ${response.data.patient.last_name}`);
          }
        } else if (searchQuery) {
          response = await sampleAPI.searchSamples(searchQuery);
        } else {
          response = await sampleAPI.getAllSamples(currentPage);
        }
        
        setSamples(response.data.items);
        setTotalPages(response.data.total_pages);
      } catch (err) {
        console.error('Error fetching samples:', err);
        setError('Failed to load samples. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSamples();
  }, [currentPage, searchQuery, patientId]);

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
      case 'Collected':
        return 'primary';
      case 'In Transit':
        return 'info';
      case 'Received':
        return 'success';
      case 'Rejected':
        return 'danger';
      case 'Processed':
        return 'warning';
      case 'Transferred':
        return 'secondary';
      default:
        return 'light';
    }
  };

  return (
    <div className="sample-list-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          {patientName ? `Samples for ${patientName}` : 'Samples'}
        </h1>
        <div>
          <Link to="/samples/create" className="btn btn-primary">
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            New Sample
          </Link>
        </div>
      </div>

      {/* Search Card */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Search Samples</h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={patientId ? 12 : 6}>
                <InputGroup className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="Search by sample ID or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button variant="primary" type="submit">
                    <FontAwesomeIcon icon={faSearch} />
                  </Button>
                </InputGroup>
              </Col>
              {!patientId && (
                <Col md={6}>
                  <InputGroup className="mb-3">
                    <Form.Control
                      type="text"
                      placeholder="Filter by patient ID..."
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                    />
                    <Button 
                      variant="secondary" 
                      onClick={() => setPatientId('')}
                      disabled={!patientId}
                    >
                      Clear
                    </Button>
                  </InputGroup>
                </Col>
              )}
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
          <p className="mt-2">Loading samples...</p>
        </div>
      )}

      {/* Desktop View */}
      {!loading && !error && !isMobile && (
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              Sample List
              <span className="badge bg-primary float-end">
                {samples.length} Records
              </span>
            </h6>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table className="table-hover" width="100%" cellSpacing="0">
                <thead>
                  <tr>
                    <th>Sample ID</th>
                    <th>Patient</th>
                    <th>Sample Type</th>
                    <th>Collection Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {samples.map(sample => (
                    <tr key={sample.id}>
                      <td>{sample.sample_id}</td>
                      <td>
                        {sample.patient ? (
                          <Link to={`/patients/${sample.patient.id}`}>
                            {sample.patient.first_name} {sample.patient.last_name}
                          </Link>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td>{sample.sample_type}</td>
                      <td>{new Date(sample.collection_date).toLocaleDateString()}</td>
                      <td>
                        <Badge bg={getStatusBadgeVariant(sample.status)}>
                          {sample.status}
                        </Badge>
                      </td>
                      <td>
                        <Link to={`/samples/${sample.id}`} className="btn btn-info btn-sm me-1">
                          <FontAwesomeIcon icon={faEye} />
                        </Link>
                        <Link to={`/samples/${sample.id}/edit`} className="btn btn-primary btn-sm me-1">
                          <FontAwesomeIcon icon={faEdit} />
                        </Link>
                        {sample.status === 'Collected' && (
                          <Link to={`/samples/routing/create?sample_id=${sample.id}`} className="btn btn-warning btn-sm">
                            <FontAwesomeIcon icon={faExchangeAlt} />
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
        <div className="mobile-sample-list">
          <div className="record-count mb-3">
            <span className="badge bg-primary">
              {samples.length} Records
            </span>
          </div>

          {samples.map(sample => (
            <Card key={sample.id} className="mb-3 mobile-card">
              <Card.Header className="py-2">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="card-title mb-0">Sample {sample.sample_id}</h6>
                  <Badge bg={getStatusBadgeVariant(sample.status)}>
                    {sample.status}
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="sample-info mb-3">
                  {sample.patient && (
                    <div className="d-flex align-items-center mb-1">
                      <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                      <strong>Patient:</strong>
                      <span className="ms-2">
                        <Link to={`/patients/${sample.patient.id}`}>
                          {sample.patient.first_name} {sample.patient.last_name}
                        </Link>
                      </span>
                    </div>
                  )}
                  <div className="d-flex align-items-center mb-1">
                    <FontAwesomeIcon icon={faVial} className="me-2 text-primary" />
                    <strong>Type:</strong>
                    <span className="ms-2">{sample.sample_type}</span>
                  </div>
                  <div className="d-flex align-items-center mb-1">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                    <strong>Collected:</strong>
                    <span className="ms-2">{new Date(sample.collection_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mobile-btn-group">
                  <Link to={`/samples/${sample.id}`} className="btn btn-info">
                    <FontAwesomeIcon icon={faEye} className="me-1" /> View
                  </Link>
                  <Link to={`/samples/${sample.id}/edit`} className="btn btn-primary">
                    <FontAwesomeIcon icon={faEdit} className="me-1" /> Edit
                  </Link>
                  {sample.status === 'Collected' && (
                    <Link to={`/samples/routing/create?sample_id=${sample.id}`} className="btn btn-warning">
                      <FontAwesomeIcon icon={faExchangeAlt} className="me-1" /> Transfer
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

export default SampleList;
