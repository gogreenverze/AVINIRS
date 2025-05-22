import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col, Table, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPrint } from '@fortawesome/free-solid-svg-icons';
import { resultAPI } from '../../services/api';

const ResultReportPrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch report details on component mount
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await resultAPI.getResultById(id);
        setReport(response.data);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load report. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  // Auto-print when component loads
  useEffect(() => {
    if (report && !loading && !error) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [report, loading, error]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'verified':
        return 'success';
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="text-center my-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading report for printing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <Alert variant="danger">
          {error}
        </Alert>
        <Button variant="secondary" onClick={() => navigate('/results/reports')}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to Reports
        </Button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container-fluid">
        <Alert variant="warning">
          Report not found.
        </Alert>
        <Button variant="secondary" onClick={() => navigate('/results/reports')}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to Reports
        </Button>
      </div>
    );
  }

  return (
    <div className="result-report-print-container">
      {/* Print Header - Only visible on screen */}
      <div className="d-print-none mb-4">
        <div className="d-sm-flex align-items-center justify-content-between">
          <h1 className="h3 mb-0 text-gray-800">
            Print Report #{report.id}
          </h1>
          <div className="d-flex gap-2">
            <Button 
              variant="secondary" 
              onClick={() => navigate(`/results/reports/${id}`)}
              className="btn-sm"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
              Back to Report
            </Button>
            <Button 
              variant="primary" 
              onClick={() => window.print()}
              className="btn-sm"
            >
              <FontAwesomeIcon icon={faPrint} className="me-2" />
              Print Again
            </Button>
          </div>
        </div>
      </div>

      {/* Printable Content */}
      <div className="print-content">
        {/* Lab Header */}
        <div className="text-center mb-4">
          <h2 className="mb-1">RSAVINI Lab Management System</h2>
          <p className="text-muted mb-0">Laboratory Test Report</p>
          <hr />
        </div>

        {/* Report Information */}
        <Row className="mb-4">
          <Col md={6}>
            <h5>Report Information</h5>
            <Table borderless size="sm">
              <tbody>
                <tr>
                  <td className="fw-bold">Report ID:</td>
                  <td>{report.id}</td>
                </tr>
                <tr>
                  <td className="fw-bold">Test Date:</td>
                  <td>{formatDate(report.tested_at)}</td>
                </tr>
                <tr>
                  <td className="fw-bold">Report Date:</td>
                  <td>{formatDate(new Date().toISOString())}</td>
                </tr>
                <tr>
                  <td className="fw-bold">Status:</td>
                  <td>{report.status}</td>
                </tr>
              </tbody>
            </Table>
          </Col>
          <Col md={6}>
            <h5>Patient Information</h5>
            <Table borderless size="sm">
              <tbody>
                <tr>
                  <td className="fw-bold">Name:</td>
                  <td>{report.patient?.first_name} {report.patient?.last_name}</td>
                </tr>
                <tr>
                  <td className="fw-bold">Age:</td>
                  <td>{report.patient?.age || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="fw-bold">Gender:</td>
                  <td>{report.patient?.gender || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="fw-bold">Phone:</td>
                  <td>{report.patient?.phone || 'N/A'}</td>
                </tr>
              </tbody>
            </Table>
          </Col>
        </Row>

        {/* Sample Information */}
        <Row className="mb-4">
          <Col md={12}>
            <h5>Sample Information</h5>
            <Table borderless size="sm">
              <tbody>
                <tr>
                  <td className="fw-bold" style={{ width: '150px' }}>Sample ID:</td>
                  <td>{report.sample?.sample_id || 'N/A'}</td>
                  <td className="fw-bold" style={{ width: '150px' }}>Collection Date:</td>
                  <td>{formatDate(report.sample?.collection_date)}</td>
                </tr>
                <tr>
                  <td className="fw-bold">Sample Type:</td>
                  <td>{report.sample?.sample_type || 'N/A'}</td>
                  <td className="fw-bold">Container:</td>
                  <td>{report.sample?.container || 'N/A'}</td>
                </tr>
              </tbody>
            </Table>
          </Col>
        </Row>

        {/* Test Results */}
        <div className="mb-4">
          <h5>Test Results</h5>
          <Table bordered>
            <thead className="table-light">
              <tr>
                <th>Test Name</th>
                <th>Result</th>
                <th>Unit</th>
                <th>Normal Range</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{report.test_name}</td>
                <td className="fw-bold">{report.result_value}</td>
                <td>{report.unit || '-'}</td>
                <td>{report.normal_range || 'N/A'}</td>
                <td>{report.method || 'N/A'}</td>
              </tr>
            </tbody>
          </Table>
        </div>

        {/* Notes */}
        {report.notes && (
          <div className="mb-4">
            <h5>Notes</h5>
            <p className="border p-3 bg-light">{report.notes}</p>
          </div>
        )}

        {/* Verification Information */}
        <Row className="mb-4">
          <Col md={6}>
            <h6>Tested By</h6>
            <p>{report.technician || 'N/A'}</p>
            <p className="small text-muted">Date: {formatDate(report.tested_at)}</p>
          </Col>
          <Col md={6}>
            <h6>Verified By</h6>
            <p>{report.verified_by || 'Pending Verification'}</p>
            <p className="small text-muted">Date: {formatDate(report.verified_at)}</p>
          </Col>
        </Row>

        {/* Footer */}
        <div className="text-center mt-5 pt-4 border-top">
          <p className="small text-muted mb-1">
            <strong>RSAVINI Lab Management System</strong>
          </p>
          <p className="small text-muted mb-1">
            This is a computer-generated report. For any queries, please contact the laboratory.
          </p>
          <p className="small text-muted mb-0">
            Report generated on: {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .d-print-none {
            display: none !important;
          }
          
          .print-content {
            font-size: 12px;
          }
          
          .print-content h2 {
            font-size: 18px;
          }
          
          .print-content h5 {
            font-size: 14px;
            margin-bottom: 10px;
          }
          
          .print-content h6 {
            font-size: 12px;
            margin-bottom: 5px;
          }
          
          .print-content table {
            font-size: 11px;
          }
          
          .print-content .table td,
          .print-content .table th {
            padding: 4px 8px;
          }
          
          body {
            margin: 0;
            padding: 15px;
          }
          
          .container-fluid {
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ResultReportPrint;
