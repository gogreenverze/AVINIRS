import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faSave, faTimes, faVial, faFlask, faClipboardCheck
} from '@fortawesome/free-solid-svg-icons';
import { resultAPI, sampleAPI } from '../../services/api';
import {
  TextInput,
  TextareaInput,
  SelectInput,
  FormRow,
  FormSection,
  SuccessModal,
  ErrorModal
} from '../../components/common';
import '../../styles/ResultCreate.css';

const ResultCreate = () => {
  const navigate = useNavigate();
  const { sampleId } = useParams(); // Optional sample ID from URL
  
  // Form state
  const [formData, setFormData] = useState({
    sample_id: sampleId || '',
    test_id: '',
    value: '',
    unit: '',
    reference_range: '',
    notes: ''
  });
  
  // Validation state
  const [errors, setErrors] = useState({});
  
  // Data loading state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [samples, setSamples] = useState([]);
  const [tests, setTests] = useState([]);
  const [sampleDetails, setSampleDetails] = useState(null);
  
  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch samples and tests
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch samples
        const samplesResponse = await sampleAPI.getAllSamples();
        setSamples(samplesResponse.data.items || []);
        
        // Fetch tests
        const testsResponse = await resultAPI.getTests();
        setTests(testsResponse.data || []);
        
        // If sample ID is provided, fetch sample details
        if (sampleId) {
          const sampleResponse = await sampleAPI.getSampleById(sampleId);
          setSampleDetails(sampleResponse.data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sampleId]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for the field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.sample_id) {
      newErrors.sample_id = 'Sample is required';
    }
    
    if (!formData.test_id) {
      newErrors.test_id = 'Test is required';
    }
    
    if (!formData.value) {
      newErrors.value = 'Result value is required';
    }
    
    if (!formData.unit) {
      newErrors.unit = 'Unit is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await resultAPI.createResult(formData);
      
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error creating result:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to create result. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/results');
  };

  // Get sample options for select input
  const getSampleOptions = () => {
    return samples.map(sample => ({
      value: sample.id,
      label: `${sample.sample_id} - ${sample.patient?.first_name} ${sample.patient?.last_name}`
    }));
  };

  // Get test options for select input
  const getTestOptions = () => {
    return tests.map(test => ({
      value: test.id,
      label: test.test_name
    }));
  };

  // Get selected test details
  const getSelectedTest = () => {
    return tests.find(test => test.id === parseInt(formData.test_id));
  };

  return (
    <div className="result-create-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faClipboardCheck} className="me-2" />
          Create New Result
        </h1>
        <Link to="/results" className="btn btn-secondary">
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to List
        </Link>
      </div>

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading data...</p>
        </div>
      ) : (
        <Row>
          <Col lg={8}>
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Result Information</h6>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  {sampleDetails && (
                    <Alert variant="info" className="mb-4">
                      <div className="d-flex align-items-center">
                        <FontAwesomeIcon icon={faVial} className="me-2" />
                        <div>
                          <strong>Selected Sample:</strong> {sampleDetails.sample_id}
                          {sampleDetails.patient && (
                            <span> - Patient: {sampleDetails.patient.first_name} {sampleDetails.patient.last_name}</span>
                          )}
                        </div>
                      </div>
                    </Alert>
                  )}

                  <FormSection title="Sample & Test Information">
                    <FormRow>
                      <SelectInput
                        name="sample_id"
                        label="Sample"
                        value={formData.sample_id}
                        onChange={handleChange}
                        options={getSampleOptions()}
                        required
                        disabled={!!sampleId}
                        error={errors.sample_id}
                      />
                      <SelectInput
                        name="test_id"
                        label="Test"
                        value={formData.test_id}
                        onChange={handleChange}
                        options={getTestOptions()}
                        required
                        error={errors.test_id}
                      />
                    </FormRow>
                  </FormSection>

                  <FormSection title="Result Details">
                    <FormRow>
                      <TextInput
                        name="value"
                        label="Result Value"
                        value={formData.value}
                        onChange={handleChange}
                        placeholder="Enter result value"
                        required
                        error={errors.value}
                      />
                      <TextInput
                        name="unit"
                        label="Unit"
                        value={formData.unit}
                        onChange={handleChange}
                        placeholder="e.g., mg/dL"
                        required
                        error={errors.unit}
                      />
                    </FormRow>
                    <TextInput
                      name="reference_range"
                      label="Reference Range"
                      value={formData.reference_range}
                      onChange={handleChange}
                      placeholder="e.g., 70-100 mg/dL"
                      error={errors.reference_range}
                    />
                    <TextareaInput
                      name="notes"
                      label="Notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Enter any additional notes about the result"
                      rows={4}
                      error={errors.notes}
                    />
                  </FormSection>

                  <div className="d-flex justify-content-end mt-4">
                    <Button 
                      variant="secondary" 
                      className="me-2"
                      onClick={() => navigate('/results')}
                      disabled={submitting}
                    >
                      <FontAwesomeIcon icon={faTimes} className="me-2" />
                      Cancel
                    </Button>
                    <Button 
                      variant="primary" 
                      type="submit"
                      disabled={submitting}
                    >
                      <FontAwesomeIcon icon={faSave} className="me-2" />
                      {submitting ? 'Saving...' : 'Save Result'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold">Test Information</h6>
              </Card.Header>
              <Card.Body>
                {formData.test_id ? (
                  <div>
                    {getSelectedTest() ? (
                      <>
                        <div className="test-info-item">
                          <FontAwesomeIcon icon={faFlask} className="me-2 text-primary" />
                          <strong>Test Name:</strong>
                          <span>{getSelectedTest().test_name}</span>
                        </div>
                        <div className="test-info-item">
                          <strong>Sample Type:</strong>
                          <span>{getSelectedTest().sample_type}</span>
                        </div>
                        <div className="test-info-item">
                          <strong>Turnaround Time:</strong>
                          <span>{getSelectedTest().turnaround_time}</span>
                        </div>
                        <div className="test-info-item">
                          <strong>Default Unit:</strong>
                          <span>{getSelectedTest().default_unit}</span>
                        </div>
                        <div className="test-info-item">
                          <strong>Reference Range:</strong>
                          <span>{getSelectedTest().reference_range}</span>
                        </div>
                      </>
                    ) : (
                      <p>Loading test information...</p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted">Select a test to view its information.</p>
                )}
              </Card.Body>
            </Card>

            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold">Help</h6>
              </Card.Header>
              <Card.Body>
                <p>
                  <strong>Result Value:</strong> Enter the measured value of the test result.
                </p>
                <p>
                  <strong>Unit:</strong> Specify the unit of measurement for the result value.
                </p>
                <p>
                  <strong>Reference Range:</strong> Enter the normal range for this test result.
                </p>
                <p>
                  <strong>Notes:</strong> Add any additional information or observations about the result.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={handleSuccessModalClose}
        title="Result Created"
        message="The result has been successfully created."
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

export default ResultCreate;
