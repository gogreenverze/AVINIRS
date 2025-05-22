import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Form, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faDownload, faFilePdf, faFileWord, 
  faFileExcel, faFileText, faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { resultAPI } from '../../services/api';

const ResultReportDownload = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState('pdf');

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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Generate report content
  const generateReportContent = () => {
    return `
RSAVINI Lab Management System
Laboratory Test Report

========================================
REPORT INFORMATION
========================================
Report ID: ${report.id}
Test Date: ${formatDate(report.tested_at)}
Report Date: ${formatDate(new Date().toISOString())}
Status: ${report.status}

========================================
PATIENT INFORMATION
========================================
Name: ${report.patient?.first_name} ${report.patient?.last_name}
Age: ${report.patient?.age || 'N/A'}
Gender: ${report.patient?.gender || 'N/A'}
Phone: ${report.patient?.phone || 'N/A'}
Email: ${report.patient?.email || 'N/A'}

========================================
SAMPLE INFORMATION
========================================
Sample ID: ${report.sample?.sample_id || 'N/A'}
Collection Date: ${formatDate(report.sample?.collection_date)}
Sample Type: ${report.sample?.sample_type || 'N/A'}
Container: ${report.sample?.container || 'N/A'}

========================================
TEST RESULTS
========================================
Test Name: ${report.test_name}
Result: ${report.result_value} ${report.unit || ''}
Normal Range: ${report.normal_range || 'N/A'}
Method: ${report.method || 'N/A'}

========================================
VERIFICATION
========================================
Tested By: ${report.technician || 'N/A'}
Tested Date: ${formatDate(report.tested_at)}
Verified By: ${report.verified_by || 'Pending Verification'}
Verified Date: ${formatDate(report.verified_at)}

${report.notes ? `========================================
NOTES
========================================
${report.notes}` : ''}

========================================
This is a computer-generated report.
For any queries, please contact the laboratory.
Report generated on: ${formatDate(new Date().toISOString())}
========================================
    `.trim();
  };

  // Handle download
  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      const content = generateReportContent();
      let blob;
      let filename;
      
      switch (downloadFormat) {
        case 'pdf':
          // For PDF, we'll create a simple text file for now
          // In a real application, you'd use a PDF library like jsPDF
          blob = new Blob([content], { type: 'text/plain' });
          filename = `report_${report.id}.txt`;
          break;
          
        case 'word':
          // For Word, create a simple text file
          // In a real application, you'd use a library like docx
          blob = new Blob([content], { type: 'text/plain' });
          filename = `report_${report.id}.txt`;
          break;
          
        case 'excel':
          // For Excel, create CSV format
          const csvContent = `Report Information\n` +
            `Report ID,${report.id}\n` +
            `Test Date,${formatDate(report.tested_at)}\n` +
            `Status,${report.status}\n\n` +
            `Patient Information\n` +
            `Name,${report.patient?.first_name} ${report.patient?.last_name}\n` +
            `Age,${report.patient?.age || 'N/A'}\n` +
            `Gender,${report.patient?.gender || 'N/A'}\n` +
            `Phone,${report.patient?.phone || 'N/A'}\n\n` +
            `Test Results\n` +
            `Test Name,Result,Unit,Normal Range,Method\n` +
            `${report.test_name},${report.result_value},${report.unit || ''},${report.normal_range || 'N/A'},${report.method || 'N/A'}\n`;
          
          blob = new Blob([csvContent], { type: 'text/csv' });
          filename = `report_${report.id}.csv`;
          break;
          
        case 'text':
        default:
          blob = new Blob([content], { type: 'text/plain' });
          filename = `report_${report.id}.txt`;
          break;
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      // Show success message and redirect after delay
      setTimeout(() => {
        navigate(`/results/reports/${id}`);
      }, 2000);
      
    } catch (err) {
      console.error('Error downloading report:', err);
      setError('Failed to download report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Get format icon
  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf':
        return faFilePdf;
      case 'word':
        return faFileWord;
      case 'excel':
        return faFileExcel;
      case 'text':
      default:
        return faFileText;
    }
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
    <div className="result-report-download-container">
      {/* Header */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          Download Report #{report.id}
        </h1>
        <Button 
          variant="secondary" 
          onClick={() => navigate(`/results/reports/${id}`)}
          className="btn-sm"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to Report
        </Button>
      </div>

      {/* Download Options */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Download Options</h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6>Report Information</h6>
              <p><strong>Report ID:</strong> {report.id}</p>
              <p><strong>Patient:</strong> {report.patient?.first_name} {report.patient?.last_name}</p>
              <p><strong>Test:</strong> {report.test_name}</p>
              <p><strong>Status:</strong> {report.status}</p>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label><strong>Select Download Format</strong></Form.Label>
                <Form.Select
                  value={downloadFormat}
                  onChange={(e) => setDownloadFormat(e.target.value)}
                >
                  <option value="text">Text File (.txt)</option>
                  <option value="pdf">PDF Document (.pdf) - Coming Soon</option>
                  <option value="word">Word Document (.doc) - Coming Soon</option>
                  <option value="excel">Excel Spreadsheet (.csv)</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  Choose the format you prefer for downloading the report.
                </Form.Text>
              </Form.Group>

              <div className="d-grid">
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                      Preparing Download...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={getFormatIcon(downloadFormat)} className="me-2" />
                      Download Report
                    </>
                  )}
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Format Information */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Format Information</h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <div className="text-center p-3 border rounded">
                <FontAwesomeIcon icon={faFileText} size="2x" className="text-secondary mb-2" />
                <h6>Text File</h6>
                <p className="small text-muted">Simple text format, compatible with all devices</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center p-3 border rounded">
                <FontAwesomeIcon icon={faFilePdf} size="2x" className="text-danger mb-2" />
                <h6>PDF Document</h6>
                <p className="small text-muted">Professional format, preserves formatting (Coming Soon)</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center p-3 border rounded">
                <FontAwesomeIcon icon={faFileWord} size="2x" className="text-primary mb-2" />
                <h6>Word Document</h6>
                <p className="small text-muted">Editable document format (Coming Soon)</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center p-3 border rounded">
                <FontAwesomeIcon icon={faFileExcel} size="2x" className="text-success mb-2" />
                <h6>Excel/CSV</h6>
                <p className="small text-muted">Spreadsheet format for data analysis</p>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {downloading && (
        <Alert variant="info">
          <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
          Preparing your download... You will be redirected back to the report once the download starts.
        </Alert>
      )}
    </div>
  );
};

export default ResultReportDownload;
