import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, Button, Form, InputGroup, Row, Col, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faEye, faEdit, faCheck, faClipboardCheck, faFileAlt
} from '@fortawesome/free-solid-svg-icons';
import { resultAPI } from '../../services/api';
import ResponsiveDataTable from '../../components/admin/ResponsiveDataTable';
import '../../styles/ResultList.css';

const ResultList = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const patientIdParam = queryParams.get('patient_id');
  const sampleIdParam = queryParams.get('sample_id');

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientId, setPatientId] = useState(patientIdParam || '');
  const [sampleId, setSampleId] = useState(sampleIdParam || '');
  const [filterStatus, setFilterStatus] = useState('');

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

  // Handle result actions
  const handleViewResult = (result) => {
    window.location.href = `/results/${result.id}`;
  };

  // Table columns configuration
  const columns = [
    {
      key: 'result_id',
      label: 'Result ID',
      minWidth: '120px'
    },
    {
      key: 'patient',
      label: 'Patient',
      render: (value, row) => row.patient ? (
        <Link to={`/patients/${row.patient.id}`}>
          {row.patient.first_name} {row.patient.last_name}
        </Link>
      ) : 'N/A',
      minWidth: '150px'
    },
    {
      key: 'sample',
      label: 'Sample',
      render: (value, row) => row.sample ? (
        <Link to={`/samples/${row.sample.id}`}>
          {row.sample.sample_id}
        </Link>
      ) : 'N/A',
      minWidth: '120px'
    },
    {
      key: 'test',
      label: 'Test',
      render: (value, row) => row.test?.test_name || 'N/A',
      minWidth: '150px'
    },
    {
      key: 'result_date',
      label: 'Result Date',
      type: 'date',
      minWidth: '120px'
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => (
        <Badge bg={getStatusBadgeVariant(row.status)}>
          {row.status}
        </Badge>
      ),
      minWidth: '100px'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, result) => (
        <div className="d-flex gap-1">
          <Link to={`/results/${result.id}`} className="btn btn-info btn-sm" title="View">
            <FontAwesomeIcon icon={faEye} />
          </Link>
          {result.status === 'Pending' && (
            <Link to={`/results/${result.id}/edit`} className="btn btn-primary btn-sm" title="Edit">
              <FontAwesomeIcon icon={faEdit} />
            </Link>
          )}
          {result.status === 'Completed' && (
            <Link to={`/results/${result.id}`} className="btn btn-success btn-sm" title="Verify">
              <FontAwesomeIcon icon={faCheck} />
            </Link>
          )}
        </div>
      ),
      minWidth: '150px'
    }
  ];

  // Mobile card configuration
  const mobileCardConfig = {
    title: (result) => `Result ${result.result_id}`,
    subtitle: (result) => result.patient ? `${result.patient.first_name} ${result.patient.last_name}` : 'N/A',
    primaryField: 'test',
    secondaryField: 'status',
    statusField: 'status'
  };

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
          response = await resultAPI.getAllResults();
        }

        setResults(response.data.items || response.data);
      } catch (err) {
        console.error('Error fetching results:', err);
        setError('Failed to load results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchQuery, patientId, sampleId]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
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

      {/* Responsive Result Table */}
      {!loading && !error && (
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              Result List
              <span className="badge bg-primary float-end">
                {filteredResults.length} Records
              </span>
            </h6>
          </Card.Header>
          <Card.Body className="p-0">
            <ResponsiveDataTable
              data={filteredResults}
              columns={columns}
              onViewDetails={handleViewResult}
              loading={loading}
              emptyMessage="No results found."
              mobileCardConfig={mobileCardConfig}
            />
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default ResultList;
