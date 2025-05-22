import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Table, Badge, Alert, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardCheck, faArrowLeft, faSave, faCheck, faTimes,
  faExclamationTriangle, faFlask, faChartLine, faVial, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { resultAPI } from '../../services/api';
import {
  TextInput,
  SelectInput,
  DateInput,
  TextareaInput,
  LineChart,
  SuccessModal,
  ErrorModal
} from '../../components/common';
import '../../styles/QualityControl.css';

const QualityControl = () => {
  // State for QC logs
  const [qcLogs, setQcLogs] = useState([]);
  const [selectedQC, setSelectedQC] = useState(null);

  // State for pending results
  const [pendingResults, setPendingResults] = useState([]);

  // State for QC charts
  const [qcChartData, setQcChartData] = useState({});

  // UI state
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form state for new QC log
  const [formData, setFormData] = useState({
    test_name: '',
    control_level: 'Normal',
    expected_value: '',
    measured_value: '',
    status: 'Pass',
    performed_by: '',
    performed_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Options for QC form
  const controlLevelOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Normal', label: 'Normal' },
    { value: 'High', label: 'High' }
  ];

  const statusOptions = [
    { value: 'Pass', label: 'Pass' },
    { value: 'Fail', label: 'Fail' }
  ];

  const testOptions = [
    { value: 'Complete Blood Count', label: 'Complete Blood Count' },
    { value: 'Blood Glucose', label: 'Blood Glucose' },
    { value: 'Lipid Profile', label: 'Lipid Profile' },
    { value: 'Liver Function Test', label: 'Liver Function Test' },
    { value: 'Kidney Function Test', label: 'Kidney Function Test' },
    { value: 'Thyroid Function Test', label: 'Thyroid Function Test' },
    { value: 'HbA1c', label: 'HbA1c' },
    { value: 'Urine Analysis', label: 'Urine Analysis' }
  ];

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch pending results
        const resultsResponse = await resultAPI.getResultsByStatus('Pending');
        setPendingResults(resultsResponse.data);

        // Fetch QC logs (dummy data for now)
        setQcLogs([
          {
            id: 1,
            test_name: 'Blood Glucose',
            control_level: 'Normal',
            expected_value: '100 mg/dL',
            measured_value: '102 mg/dL',
            status: 'Pass',
            performed_by: 'John Doe',
            performed_date: '2023-06-15',
            notes: 'Within acceptable range'
          },
          {
            id: 2,
            test_name: 'Complete Blood Count',
            control_level: 'High',
            expected_value: '15.0 g/dL',
            measured_value: '14.8 g/dL',
            status: 'Pass',
            performed_by: 'Jane Smith',
            performed_date: '2023-06-14',
            notes: 'Within acceptable range'
          },
          {
            id: 3,
            test_name: 'Lipid Profile',
            control_level: 'Low',
            expected_value: '150 mg/dL',
            measured_value: '165 mg/dL',
            status: 'Fail',
            performed_by: 'John Doe',
            performed_date: '2023-06-13',
            notes: 'Outside acceptable range, recalibration required'
          }
        ]);

        // Generate QC chart data
        generateQCChartData();
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load quality control data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Generate QC chart data
  const generateQCChartData = () => {
    // Generate dummy data for QC charts
    const glucoseData = {
      labels: ['Jun 1', 'Jun 2', 'Jun 3', 'Jun 4', 'Jun 5', 'Jun 6', 'Jun 7', 'Jun 8', 'Jun 9', 'Jun 10', 'Jun 11', 'Jun 12', 'Jun 13', 'Jun 14', 'Jun 15'],
      datasets: [
        {
          label: 'Measured Value',
          data: [102, 98, 101, 103, 99, 100, 102, 101, 98, 97, 99, 100, 101, 102, 102],
          borderColor: 'rgba(78, 115, 223, 1)',
          backgroundColor: 'rgba(78, 115, 223, 0.1)',
          fill: false,
          tension: 0.1
        },
        {
          label: 'Upper Limit',
          data: Array(15).fill(105),
          borderColor: 'rgba(231, 74, 59, 0.5)',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Lower Limit',
          data: Array(15).fill(95),
          borderColor: 'rgba(231, 74, 59, 0.5)',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        }
      ]
    };

    const cbcData = {
      labels: ['Jun 1', 'Jun 2', 'Jun 3', 'Jun 4', 'Jun 5', 'Jun 6', 'Jun 7', 'Jun 8', 'Jun 9', 'Jun 10', 'Jun 11', 'Jun 12', 'Jun 13', 'Jun 14', 'Jun 15'],
      datasets: [
        {
          label: 'Measured Value',
          data: [14.9, 15.1, 15.0, 14.8, 14.9, 15.2, 15.0, 14.7, 14.8, 15.0, 15.1, 14.9, 15.0, 14.8, 14.8],
          borderColor: 'rgba(28, 200, 138, 1)',
          backgroundColor: 'rgba(28, 200, 138, 0.1)',
          fill: false,
          tension: 0.1
        },
        {
          label: 'Upper Limit',
          data: Array(15).fill(15.5),
          borderColor: 'rgba(231, 74, 59, 0.5)',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Lower Limit',
          data: Array(15).fill(14.5),
          borderColor: 'rgba(231, 74, 59, 0.5)',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        }
      ]
    };

    const lipidData = {
      labels: ['Jun 1', 'Jun 2', 'Jun 3', 'Jun 4', 'Jun 5', 'Jun 6', 'Jun 7', 'Jun 8', 'Jun 9', 'Jun 10', 'Jun 11', 'Jun 12', 'Jun 13', 'Jun 14', 'Jun 15'],
      datasets: [
        {
          label: 'Measured Value',
          data: [152, 148, 151, 153, 149, 150, 152, 151, 148, 147, 149, 150, 165, 155, 152],
          borderColor: 'rgba(246, 194, 62, 1)',
          backgroundColor: 'rgba(246, 194, 62, 0.1)',
          fill: false,
          tension: 0.1
        },
        {
          label: 'Upper Limit',
          data: Array(15).fill(160),
          borderColor: 'rgba(231, 74, 59, 0.5)',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Lower Limit',
          data: Array(15).fill(140),
          borderColor: 'rgba(231, 74, 59, 0.5)',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        }
      ]
    };

    setQcChartData({
      'Blood Glucose': glucoseData,
      'Complete Blood Count': cbcData,
      'Lipid Profile': lipidData
    });
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handle form submission for new QC log
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.test_name || !formData.expected_value || !formData.measured_value || !formData.performed_by) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // In a real app, this would be an API call to save the QC log
      // For now, we'll just add it to the state
      const newQcLog = {
        id: qcLogs.length + 1,
        ...formData
      };

      setQcLogs([newQcLog, ...qcLogs]);

      // Reset form
      setFormData({
        test_name: '',
        control_level: 'Normal',
        expected_value: '',
        measured_value: '',
        status: 'Pass',
        performed_by: '',
        performed_date: new Date().toISOString().split('T')[0],
        notes: ''
      });

      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error saving QC log:', err);
      setErrorMessage('Failed to save quality control log. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle result verification
  const handleVerifyResult = async (resultId, isApproved) => {
    try {
      setSubmitting(true);

      // In a real app, this would be an API call to update the result status
      // For now, we'll just update the state
      setPendingResults(prevResults =>
        prevResults.filter(result => result.id !== resultId)
      );

      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error verifying result:', err);
      setErrorMessage('Failed to verify result. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle QC log selection
  const handleQcLogSelect = (qcLog) => {
    setSelectedQC(qcLog);
  };

  // Result status badge variant
  const getResultStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Completed':
        return 'info';
      case 'Verified':
        return 'success';
      case 'Rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // QC status badge variant
  const getQcStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Pass':
        return 'success';
      case 'Fail':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading quality control data...</p>
      </div>
    );
  }

  return (
    <div className="quality-control-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faClipboardCheck} className="me-2" />
          Quality Control
        </h1>
        <Link to="/lab" className="btn btn-secondary">
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to Lab Dashboard
        </Link>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="pending" title="Pending Verification">
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Results Pending Verification</h6>
            </Card.Header>
            <Card.Body>
              {pendingResults.length > 0 ? (
                <div className="table-responsive">
                  <Table className="table-hover" width="100%" cellSpacing="0">
                    <thead>
                      <tr>
                        <th>Result ID</th>
                        <th>Patient</th>
                        <th>Test</th>
                        <th>Result</th>
                        <th>Reference Range</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingResults.map(result => (
                        <tr key={result.id}>
                          <td>{result.result_id}</td>
                          <td>
                            {result.patient ? (
                              <Link to={`/patients/${result.patient.id}`}>
                                {result.patient.first_name} {result.patient.last_name}
                              </Link>
                            ) : 'N/A'}
                          </td>
                          <td>{result.test_name}</td>
                          <td>{result.result_value}</td>
                          <td>{result.reference_range || 'N/A'}</td>
                          <td>
                            <Badge bg={getResultStatusBadgeVariant(result.status)}>
                              {result.status}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              variant="success"
                              size="sm"
                              className="me-1"
                              onClick={() => handleVerifyResult(result.id, true)}
                              disabled={submitting}
                            >
                              <FontAwesomeIcon icon={faCheck} />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleVerifyResult(result.id, false)}
                              disabled={submitting}
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="info">
                  <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                  No results pending verification.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="qc-logs" title="QC Logs">
          <Row>
            <Col lg={8}>
              <Card className="shadow mb-4">
                <Card.Header className="py-3">
                  <h6 className="m-0 font-weight-bold text-primary">Quality Control Logs</h6>
                </Card.Header>
                <Card.Body>
                  {qcLogs.length > 0 ? (
                    <div className="table-responsive">
                      <Table className="table-hover" width="100%" cellSpacing="0">
                        <thead>
                          <tr>
                            <th>Test</th>
                            <th>Control Level</th>
                            <th>Expected Value</th>
                            <th>Measured Value</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {qcLogs.map(qcLog => (
                            <tr key={qcLog.id}>
                              <td>{qcLog.test_name}</td>
                              <td>{qcLog.control_level}</td>
                              <td>{qcLog.expected_value}</td>
                              <td>{qcLog.measured_value}</td>
                              <td>
                                <Badge bg={getQcStatusBadgeVariant(qcLog.status)}>
                                  {qcLog.status}
                                </Badge>
                              </td>
                              <td>{new Date(qcLog.performed_date).toLocaleDateString()}</td>
                              <td>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleQcLogSelect(qcLog)}
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <Alert variant="info">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                      No quality control logs found.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="shadow mb-4">
                <Card.Header className="py-3">
                  <h6 className="m-0 font-weight-bold text-primary">Add QC Log</h6>
                </Card.Header>
                <Card.Body>
                  {error && (
                    <Alert variant="danger" className="mb-4">
                      {error}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    <SelectInput
                      name="test_name"
                      label="Test Name"
                      value={formData.test_name}
                      onChange={handleChange}
                      options={testOptions}
                      required
                    />

                    <SelectInput
                      name="control_level"
                      label="Control Level"
                      value={formData.control_level}
                      onChange={handleChange}
                      options={controlLevelOptions}
                      required
                    />

                    <Row>
                      <Col md={6}>
                        <TextInput
                          name="expected_value"
                          label="Expected Value"
                          value={formData.expected_value}
                          onChange={handleChange}
                          required
                          placeholder="e.g., 100 mg/dL"
                        />
                      </Col>
                      <Col md={6}>
                        <TextInput
                          name="measured_value"
                          label="Measured Value"
                          value={formData.measured_value}
                          onChange={handleChange}
                          required
                          placeholder="e.g., 102 mg/dL"
                        />
                      </Col>
                    </Row>

                    <SelectInput
                      name="status"
                      label="Status"
                      value={formData.status}
                      onChange={handleChange}
                      options={statusOptions}
                      required
                    />

                    <TextInput
                      name="performed_by"
                      label="Performed By"
                      value={formData.performed_by}
                      onChange={handleChange}
                      required
                    />

                    <DateInput
                      name="performed_date"
                      label="Date"
                      value={formData.performed_date}
                      onChange={handleChange}
                      required
                    />

                    <TextareaInput
                      name="notes"
                      label="Notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                    />

                    <div className="d-grid gap-2 mt-4">
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={submitting}
                      >
                        <FontAwesomeIcon icon={faSave} className="me-2" />
                        {submitting ? 'Saving...' : 'Save QC Log'}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>

              {selectedQC && (
                <Card className="shadow mb-4">
                  <Card.Header className="py-3">
                    <h6 className="m-0 font-weight-bold text-primary">QC Log Details</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="qc-log-details">
                      <div className="detail-item">
                        <span>Test:</span>
                        <span>{selectedQC.test_name}</span>
                      </div>
                      <div className="detail-item">
                        <span>Control Level:</span>
                        <span>{selectedQC.control_level}</span>
                      </div>
                      <div className="detail-item">
                        <span>Expected Value:</span>
                        <span>{selectedQC.expected_value}</span>
                      </div>
                      <div className="detail-item">
                        <span>Measured Value:</span>
                        <span>{selectedQC.measured_value}</span>
                      </div>
                      <div className="detail-item">
                        <span>Status:</span>
                        <span>
                          <Badge bg={getQcStatusBadgeVariant(selectedQC.status)}>
                            {selectedQC.status}
                          </Badge>
                        </span>
                      </div>
                      <div className="detail-item">
                        <span>Performed By:</span>
                        <span>{selectedQC.performed_by}</span>
                      </div>
                      <div className="detail-item">
                        <span>Date:</span>
                        <span>{new Date(selectedQC.performed_date).toLocaleDateString()}</span>
                      </div>
                      {selectedQC.notes && (
                        <div className="detail-item">
                          <span>Notes:</span>
                          <span>{selectedQC.notes}</span>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="qc-charts" title="QC Charts">
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Quality Control Charts</h6>
            </Card.Header>
            <Card.Body>
              <Tabs defaultActiveKey="glucose" className="mb-4">
                <Tab eventKey="glucose" title="Blood Glucose">
                  <div className="chart-container">
                    <LineChart
                      data={qcChartData['Blood Glucose']}
                      height={300}
                      options={{
                        scales: {
                          y: {
                            beginAtZero: false,
                            title: {
                              display: true,
                              text: 'mg/dL'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </Tab>
                <Tab eventKey="cbc" title="Complete Blood Count">
                  <div className="chart-container">
                    <LineChart
                      data={qcChartData['Complete Blood Count']}
                      height={300}
                      options={{
                        scales: {
                          y: {
                            beginAtZero: false,
                            title: {
                              display: true,
                              text: 'g/dL'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </Tab>
                <Tab eventKey="lipid" title="Lipid Profile">
                  <div className="chart-container">
                    <LineChart
                      data={qcChartData['Lipid Profile']}
                      height={300}
                      options={{
                        scales: {
                          y: {
                            beginAtZero: false,
                            title: {
                              display: true,
                              text: 'mg/dL'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </Tab>
              </Tabs>

              <div className="chart-legend mt-4">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: 'rgba(78, 115, 223, 1)' }}></div>
                  <span>Measured Value</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: 'rgba(231, 74, 59, 0.5)' }}></div>
                  <span>Control Limits</span>
                </div>
              </div>

              <Alert variant="info" className="mt-4">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                Quality control charts show the trend of control measurements over time. Points outside the control limits indicate potential issues with the testing process.
              </Alert>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        title="Success"
        message={activeTab === 'pending' ? "Result verification completed successfully." : "Quality control log saved successfully."}
      />

      {/* Error Modal */}
      <ErrorModal
        show={showErrorModal}
        onHide={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
      />
    </div>
  );
};

export default QualityControl;
