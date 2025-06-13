import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col, Badge, Table, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faDownload, faPrint, faShare, 
  faFileAlt, faUser, faVial, faCalendar
} from '@fortawesome/free-solid-svg-icons';
import { resultAPI, whatsappAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ResultReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

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

  // Handle print report
  const handlePrint = () => {
    window.print();
  };

  // Handle download report
  const handleDownload = () => {
    // Create a simple PDF-like content for download
    const content = `
      AVINI Labs Management System
      Test Report
      
      Report ID: ${report.id}
      Patient: ${report.patient?.first_name} ${report.patient?.last_name}
      Sample ID: ${report.sample?.sample_id}
      Test: ${report.test_name}
      
      Result: ${report.result_value} ${report.unit || ''}
      Normal Range: ${report.normal_range || 'N/A'}
      Status: ${report.status}
      
      Tested Date: ${new Date(report.tested_at).toLocaleDateString()}
      Verified Date: ${report.verified_at ? new Date(report.verified_at).toLocaleDateString() : 'Not verified'}
      
      Notes: ${report.notes || 'No notes'}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${report.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Handle send via WhatsApp
  const handleSendWhatsApp = async () => {
    try {
      setSending(true);
      
      await whatsappAPI.sendReport({
        result_id: report.id,
        phone: report.patient?.phone,
        patient_name: `${report.patient?.first_name} ${report.patient?.last_name}`
      });
      
      alert('Report sent successfully via WhatsApp!');
    } catch (err) {
      console.error('Error sending report:', err);
      alert('Failed to send report via WhatsApp. Please try again.');
    } finally {
      setSending(false);
    }
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="text-center my-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading report...</p>
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
    <div className="result-report-detail-container">
      {/* Header */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faFileAlt} className="me-2" />
          Test Report #{report.id}
        </h1>
        <div className="d-flex gap-2">
          <Button 
            variant="secondary" 
            onClick={() => navigate('/results/reports')}
            className="btn-sm"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Reports
          </Button>
          <Button 
            variant="info" 
            onClick={handlePrint}
            className="btn-sm"
          >
            <FontAwesomeIcon icon={faPrint} className="me-2" />
            Print
          </Button>
          <Button 
            variant="success" 
            onClick={handleDownload}
            className="btn-sm"
          >
            <FontAwesomeIcon icon={faDownload} className="me-2" />
            Download
          </Button>
          {report.patient?.phone && (
            <Button 
              variant="primary" 
              onClick={handleSendWhatsApp}
              disabled={sending}
              className="btn-sm"
            >
              {sending ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Sending...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faShare} className="me-2" />
                  Send WhatsApp
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Report Content */}
      <Row>
        {/* Patient Information */}
        <Col lg={6}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">
                <FontAwesomeIcon icon={faUser} className="me-2" />
                Patient Information
              </h6>
            </Card.Header>
            <Card.Body>
              <Table borderless className="mb-0">
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
                  <tr>
                    <td className="fw-bold">Email:</td>
                    <td>{report.patient?.email || 'N/A'}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Sample Information */}
        <Col lg={6}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">
                <FontAwesomeIcon icon={faVial} className="me-2" />
                Sample Information
              </h6>
            </Card.Header>
            <Card.Body>
              <Table borderless className="mb-0">
                <tbody>
                  <tr>
                    <td className="fw-bold">Sample ID:</td>
                    <td>{report.sample?.sample_id || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Collection Date:</td>
                    <td>{formatDate(report.sample?.collection_date)}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Sample Type:</td>
                    <td>{report.sample?.sample_type || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Container:</td>
                    <td>{report.sample?.container || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Status:</td>
                    <td>
                      <Badge bg={getStatusBadgeColor(report.sample?.status)}>
                        {report.sample?.status || 'Unknown'}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Test Results */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">
            <FontAwesomeIcon icon={faFileAlt} className="me-2" />
            Test Results
          </h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Table borderless>
                <tbody>
                  <tr>
                    <td className="fw-bold">Test Name:</td>
                    <td>{report.test_name}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Result:</td>
                    <td className="fs-5 fw-bold text-primary">
                      {report.result_value} {report.unit || ''}
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Normal Range:</td>
                    <td>{report.normal_range || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Status:</td>
                    <td>
                      <Badge bg={getStatusBadgeColor(report.status)} className="fs-6">
                        {report.status}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
            <Col md={6}>
              <Table borderless>
                <tbody>
                  <tr>
                    <td className="fw-bold">Tested Date:</td>
                    <td>{formatDate(report.tested_at)}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Verified Date:</td>
                    <td>{formatDate(report.verified_at)}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Technician:</td>
                    <td>{report.technician || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Verified By:</td>
                    <td>{report.verified_by || 'N/A'}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
          
          {report.notes && (
            <div className="mt-3">
              <h6 className="fw-bold">Notes:</h6>
              <p className="text-muted">{report.notes}</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Report Footer */}
      <Card className="shadow mb-4">
        <Card.Body className="text-center">
          <p className="mb-1"><strong>AVINI Labs Management System</strong></p>
          <p className="text-muted small mb-0">
            This is a computer-generated report. For any queries, please contact the laboratory.
          </p>
          <p className="text-muted small mb-0">
            Report generated on: {formatDate(new Date().toISOString())}
          </p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ResultReportDetail;
