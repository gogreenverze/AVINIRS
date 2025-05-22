import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Form, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faEnvelope, faPaperPlane, faSpinner,
  faUser, faAt, faFileText
} from '@fortawesome/free-solid-svg-icons';
import { resultAPI, emailAPI } from '../../services/api';

const ResultReportEmail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [emailData, setEmailData] = useState({
    to_email: '',
    to_name: '',
    subject: '',
    message: '',
    include_attachment: true
  });

  // Fetch report details on component mount
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await resultAPI.getResultById(id);
        const reportData = response.data;
        setReport(reportData);
        
        // Pre-fill email data
        setEmailData(prev => ({
          ...prev,
          to_email: reportData.patient?.email || '',
          to_name: `${reportData.patient?.first_name || ''} ${reportData.patient?.last_name || ''}`.trim(),
          subject: `Lab Test Report - ${reportData.test_name} (Report #${reportData.id})`,
          message: `Dear ${reportData.patient?.first_name || 'Patient'},

We are pleased to share your lab test report with you.

Report Details:
- Report ID: ${reportData.id}
- Test: ${reportData.test_name}
- Test Date: ${new Date(reportData.tested_at).toLocaleDateString()}
- Status: ${reportData.status}

Please find your detailed test report attached to this email. If you have any questions about your results, please don't hesitate to contact us.

Thank you for choosing RSAVINI Lab Management System.

Best regards,
RSAVINI Lab Team`
        }));
        
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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!emailData.to_email || !emailData.subject) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSending(true);
      setError(null);
      
      // Send email via API
      await emailAPI.sendReport({
        report_id: report.id,
        to_email: emailData.to_email,
        to_name: emailData.to_name,
        subject: emailData.subject,
        message: emailData.message,
        include_attachment: emailData.include_attachment
      });
      
      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        navigate(`/results/reports/${id}`);
      }, 3000);
      
    } catch (err) {
      console.error('Error sending email:', err);
      setError(err.response?.data?.message || 'Failed to send email. Please try again.');
    } finally {
      setSending(false);
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

  if (error && !report) {
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
    <div className="result-report-email-container">
      {/* Header */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faEnvelope} className="me-2" />
          Email Report #{report.id}
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

      {/* Success Message */}
      {success && (
        <Alert variant="success">
          <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
          Email sent successfully! The report has been delivered to {emailData.to_email}. 
          You will be redirected back to the report shortly.
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      {/* Report Information */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Report Information</h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <p><strong>Report ID:</strong> {report.id}</p>
              <p><strong>Patient:</strong> {report.patient?.first_name} {report.patient?.last_name}</p>
              <p><strong>Test:</strong> {report.test_name}</p>
            </Col>
            <Col md={6}>
              <p><strong>Status:</strong> {report.status}</p>
              <p><strong>Test Date:</strong> {new Date(report.tested_at).toLocaleDateString()}</p>
              <p><strong>Patient Email:</strong> {report.patient?.email || 'Not available'}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Email Form */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">
            <FontAwesomeIcon icon={faEnvelope} className="me-2" />
            Email Details
          </h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faAt} className="me-2" />
                    Recipient Email <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="to_email"
                    value={emailData.to_email}
                    onChange={handleInputChange}
                    required
                    placeholder="patient@example.com"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    Recipient Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="to_name"
                    value={emailData.to_name}
                    onChange={handleInputChange}
                    placeholder="Patient Name"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>
                <FontAwesomeIcon icon={faFileText} className="me-2" />
                Subject <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="subject"
                value={emailData.subject}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                name="message"
                value={emailData.message}
                onChange={handleInputChange}
                placeholder="Enter your message here..."
              />
              <Form.Text className="text-muted">
                This message will be included in the email body along with the report attachment.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Check
                type="checkbox"
                name="include_attachment"
                label="Include report as attachment"
                checked={emailData.include_attachment}
                onChange={handleInputChange}
              />
              <Form.Text className="text-muted">
                The report will be attached as a PDF file to the email.
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={() => navigate(`/results/reports/${id}`)}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={sending || success}
              >
                {sending ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Email Preview */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Email Preview</h6>
        </Card.Header>
        <Card.Body>
          <div className="border rounded p-3 bg-light">
            <p><strong>To:</strong> {emailData.to_name} &lt;{emailData.to_email}&gt;</p>
            <p><strong>Subject:</strong> {emailData.subject}</p>
            <hr />
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {emailData.message}
            </div>
            {emailData.include_attachment && (
              <div className="mt-3 pt-3 border-top">
                <p className="small text-muted">
                  <FontAwesomeIcon icon={faFileText} className="me-2" />
                  Attachment: report_{report.id}.pdf
                </p>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ResultReportEmail;
