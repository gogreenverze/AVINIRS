import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Button, Form, InputGroup, Pagination, Row, Col, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faEye, faPrint, faEnvelope, faDownload,
  faUser, faCalendarAlt, faFileAlt, faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { resultAPI } from '../../services/api';
import '../../styles/ResultReports.css';

const ResultReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch reports data
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);

        let params = { page: currentPage };

        if (searchQuery) {
          params.search = searchQuery;
        }

        if (dateRange.startDate) {
          params.start_date = dateRange.startDate;
        }

        if (dateRange.endDate) {
          params.end_date = dateRange.endDate;
        }

        const response = await resultAPI.getReports(params);
        setReports(response.data.items);
        setTotalPages(response.data.total_pages);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [currentPage, searchQuery, dateRange]);

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

  return (
    <div className="result-reports-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Reports</h1>
        <div>
          <Link to="/results" className="btn btn-secondary">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Results
          </Link>
        </div>
      </div>

      {/* Search Card */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Search Reports</h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={6}>
                <InputGroup className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="Search by patient name, ID, or report number..."
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
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={dateRange.startDate}
                    onChange={handleDateChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
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
            <Row>
              <Col>
                <Button
                  variant="secondary"
                  className="float-end"
                  onClick={() => {
                    setSearchQuery('');
                    setDateRange({ startDate: '', endDate: '' });
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
          <p className="mt-2">Loading reports...</p>
        </div>
      )}

      {/* Desktop View */}
      {!loading && !error && !isMobile && (
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              Report List
              <span className="badge bg-primary float-end">
                {reports.length} Records
              </span>
            </h6>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table className="table-hover" width="100%" cellSpacing="0">
                <thead>
                  <tr>
                    <th>Report #</th>
                    <th>Patient</th>
                    <th>Report Date</th>
                    <th>Tests</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <tr key={report.id}>
                      <td>{report.report_number}</td>
                      <td>
                        {report.patient ? (
                          <Link to={`/patients/${report.patient.id}`}>
                            {report.patient.first_name} {report.patient.last_name}
                          </Link>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td>{new Date(report.report_date).toLocaleDateString()}</td>
                      <td>{report.test_count}</td>
                      <td>
                        <Link to={`/results/reports/${report.id}`} className="btn btn-info btn-sm me-1">
                          <FontAwesomeIcon icon={faEye} />
                        </Link>
                        <Link to={`/results/reports/${report.id}/print`} className="btn btn-primary btn-sm me-1">
                          <FontAwesomeIcon icon={faPrint} />
                        </Link>
                        <Link to={`/results/reports/${report.id}/download`} className="btn btn-success btn-sm me-1">
                          <FontAwesomeIcon icon={faDownload} />
                        </Link>
                        <Link to={`/results/reports/${report.id}/email`} className="btn btn-warning btn-sm me-1">
                          <FontAwesomeIcon icon={faEnvelope} />
                        </Link>
                        <Link to={`/results/reports/${report.id}/whatsapp`} className="btn btn-success btn-sm">
                          <FontAwesomeIcon icon={faWhatsapp} />
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
        <div className="mobile-report-list">
          <div className="record-count mb-3">
            <span className="badge bg-primary">
              {reports.length} Records
            </span>
          </div>

          {reports.map(report => (
            <Card key={report.id} className="mb-3 mobile-card">
              <Card.Header className="py-2">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="card-title mb-0">Report #{report.report_number}</h6>
                  <Badge bg="primary">
                    {report.test_count} Tests
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="report-info mb-3">
                  {report.patient && (
                    <div className="d-flex align-items-center mb-1">
                      <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                      <strong>Patient:</strong>
                      <span className="ms-2">
                        <Link to={`/patients/${report.patient.id}`}>
                          {report.patient.first_name} {report.patient.last_name}
                        </Link>
                      </span>
                    </div>
                  )}
                  <div className="d-flex align-items-center mb-1">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                    <strong>Date:</strong>
                    <span className="ms-2">{new Date(report.report_date).toLocaleDateString()}</span>
                  </div>
                  <div className="d-flex align-items-center mb-1">
                    <FontAwesomeIcon icon={faFileAlt} className="me-2 text-primary" />
                    <strong>Status:</strong>
                    <span className="ms-2">{report.status}</span>
                  </div>
                </div>

                <div className="mobile-btn-group">
                  <Link to={`/results/reports/${report.id}`} className="btn btn-info">
                    <FontAwesomeIcon icon={faEye} className="me-1" /> View
                  </Link>
                  <Link to={`/results/reports/${report.id}/print`} className="btn btn-primary">
                    <FontAwesomeIcon icon={faPrint} className="me-1" /> Print
                  </Link>
                  <Link to={`/results/reports/${report.id}/download`} className="btn btn-success">
                    <FontAwesomeIcon icon={faDownload} className="me-1" /> Download
                  </Link>
                </div>
                <div className="mobile-btn-group mt-2">
                  <Link to={`/results/reports/${report.id}/email`} className="btn btn-warning">
                    <FontAwesomeIcon icon={faEnvelope} className="me-1" /> Email
                  </Link>
                  <Link to={`/results/reports/${report.id}/whatsapp`} className="btn btn-success">
                    <FontAwesomeIcon icon={faWhatsapp} className="me-1" /> WhatsApp
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

export default ResultReports;
