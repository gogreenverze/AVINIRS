import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Form, Row, Col, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faPaperPlane, faSpinner,
  faPhone, faUser, faFileText, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { resultAPI, whatsappAPI } from '../../services/api';

const ResultReportWhatsApp = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [whatsappData, setWhatsappData] = useState({
    phone: '',
    patient_name: '',
    message: '',
    include_report_link: true
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

        // Pre-fill WhatsApp data
        const patientName = `${reportData.patient?.first_name || ''} ${reportData.patient?.last_name || ''}`.trim();
        setWhatsappData(prev => ({
          ...prev,
          phone: reportData.patient?.phone || '',
          patient_name: patientName,
          message: `Hello ${reportData.patient?.first_name || 'Patient'},

Your lab test report is ready! 📋

*Report Details:*
• Report ID: ${reportData.id}
• Test: ${reportData.test_name}
• Test Date: ${new Date(reportData.tested_at).toLocaleDateString()}
• Status: ${reportData.status}

${reportData.result_value ? `• Result: ${reportData.result_value} ${reportData.unit || ''}` : ''}

Thank you for choosing AVINI Labs Management System. 🏥

If you have any questions, please feel free to contact us.

Best regards,
AVINI Labs Team`
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
    setWhatsappData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Format phone number
  const formatPhoneNumber = (phone) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Add country code if not present
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    } else if (cleaned.length === 13 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }

    return phone;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!whatsappData.phone || !whatsappData.message) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSending(true);
      setError(null);

      // Send WhatsApp message via API
      await whatsappAPI.sendReport({
        report_id: report.id,
        phone: formatPhoneNumber(whatsappData.phone),
        patient_name: whatsappData.patient_name,
        message: whatsappData.message,
        include_report_link: whatsappData.include_report_link
      });

      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        navigate(`/results/reports/${id}`);
      }, 3000);

    } catch (err) {
      console.error('Error sending WhatsApp message:', err);
      setError(err.response?.data?.message || 'Failed to send WhatsApp message. Please try again.');
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
    <div className="result-report-whatsapp-container">
      {/* Header */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faWhatsapp} className="me-2 text-success" />
          Send Report via WhatsApp #{report.id}
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
          <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
          WhatsApp message sent successfully! The report has been delivered to {formatPhoneNumber(whatsappData.phone)}.
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
              <p><strong>Status:</strong> <Badge bg="success">{report.status}</Badge></p>
              <p><strong>Test Date:</strong> {new Date(report.tested_at).toLocaleDateString()}</p>
              <p><strong>Patient Phone:</strong> {report.patient?.phone || 'Not available'}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* WhatsApp Form */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-success">
            <FontAwesomeIcon icon={faWhatsapp} className="me-2" />
            WhatsApp Message Details
          </h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faPhone} className="me-2" />
                    Phone Number <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={whatsappData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+91 9876543210"
                  />
                  <Form.Text className="text-muted">
                    Include country code (e.g., +91 for India)
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    Patient Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="patient_name"
                    value={whatsappData.patient_name}
                    onChange={handleInputChange}
                    placeholder="Patient Name"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>
                <FontAwesomeIcon icon={faFileText} className="me-2" />
                Message <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={10}
                name="message"
                value={whatsappData.message}
                onChange={handleInputChange}
                required
                placeholder="Enter your WhatsApp message here..."
              />
              <Form.Text className="text-muted">
                This message will be sent via WhatsApp. You can use emojis and formatting.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Check
                type="checkbox"
                name="include_report_link"
                label="Include link to view report online"
                checked={whatsappData.include_report_link}
                onChange={handleInputChange}
              />
              <Form.Text className="text-muted">
                A secure link to view the report will be included in the message.
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
                variant="success"
                type="submit"
                disabled={sending || success}
              >
                {sending ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                    Sending Message...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faWhatsapp} className="me-2" />
                    Send WhatsApp
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Message Preview */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Message Preview</h6>
        </Card.Header>
        <Card.Body>
          <div className="border rounded p-3 bg-light position-relative">
            <div className="d-flex align-items-center mb-2">
              <FontAwesomeIcon icon={faWhatsapp} className="text-success me-2" />
              <strong>To:</strong> {whatsappData.patient_name} ({formatPhoneNumber(whatsappData.phone)})
            </div>
            <hr />
            <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {whatsappData.message}
            </div>
            {whatsappData.include_report_link && (
              <div className="mt-3 pt-3 border-top">
                <p className="small text-muted">
                  <FontAwesomeIcon icon={faFileText} className="me-2" />
                  🔗 View Report: https://rsavini.com/reports/{report.id}
                </p>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* WhatsApp Info */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-info">
            <FontAwesomeIcon icon={faWhatsapp} className="me-2" />
            WhatsApp Integration Info
          </h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6>Features</h6>
              <ul className="list-unstyled">
                <li>✅ Instant message delivery</li>
                <li>✅ Rich text formatting support</li>
                <li>✅ Emoji support</li>
                <li>✅ Secure report links</li>
                <li>✅ Delivery confirmation</li>
              </ul>
            </Col>
            <Col md={6}>
              <h6>Message Guidelines</h6>
              <ul className="list-unstyled">
                <li>• Keep messages professional</li>
                <li>• Include essential report information</li>
                <li>• Use clear and simple language</li>
                <li>• Verify phone number before sending</li>
                <li>• Respect patient privacy</li>
              </ul>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ResultReportWhatsApp;
