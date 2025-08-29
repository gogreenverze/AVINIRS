import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faEye, faPrint, faEnvelope, faDownload, faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { resultAPI } from '../../services/api';
import ResponsiveDataTable from '../../components/admin/ResponsiveDataTable';
import '../../styles/ResultReports.css';

const ResultReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Table columns configuration
  const columns = [
    {
      key: 'report_number',
      label: 'Report #',
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
      key: 'report_date',
      label: 'Report Date',
      type: 'date',
      minWidth: '120px'
    },
    {
      key: 'test_count',
      label: 'Tests',
      minWidth: '80px'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, report) => (
        <div className="d-flex gap-1 flex-wrap">
          <Link to={`/results/reports/${report.id}`} className="btn btn-info btn-sm" title="View">
            <FontAwesomeIcon icon={faEye} />
          </Link>
          <Link to={`/results/reports/${report.id}/print`} className="btn btn-primary btn-sm" title="Print">
            <FontAwesomeIcon icon={faPrint} />
          </Link>
          <Link to={`/results/reports/${report.id}/download`} className="btn btn-success btn-sm" title="Download">
            <FontAwesomeIcon icon={faDownload} />
          </Link>
          <Link to={`/results/reports/${report.id}/email`} className="btn btn-warning btn-sm" title="Email">
            <FontAwesomeIcon icon={faEnvelope} />
          </Link>
          <Link to={`/results/reports/${report.id}/whatsapp`} className="btn btn-success btn-sm" title="WhatsApp">
            <FontAwesomeIcon icon={faWhatsapp} />
          </Link>
        </div>
      ),
      minWidth: '200px'
    }
  ];

  // Mobile card configuration
  const mobileCardConfig = {
    title: (report) => `Report #${report.report_number}`,
    subtitle: (report) => report.patient ? `${report.patient.first_name} ${report.patient.last_name}` : 'N/A',
    primaryField: 'report_date',
    secondaryField: 'test_count'
  };

  // Handle report actions
  const handleViewReport = (report) => {
    window.location.href = `/results/reports/${report.id}`;
  };

  // Fetch reports data
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);

        let params = {};

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
        setReports(response.data.items || response.data);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [searchQuery, dateRange]);

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

      {/* Responsive Report Table */}
      {!loading && !error && (
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              Report List
              <span className="badge bg-primary float-end">
                {reports.length} Records
              </span>
            </h6>
          </Card.Header>
          <Card.Body className="p-0">
            <ResponsiveDataTable
              data={reports}
              columns={columns}
              onViewDetails={handleViewReport}
              loading={loading}
              emptyMessage="No reports found."
              mobileCardConfig={mobileCardConfig}
            />
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default ResultReports;
