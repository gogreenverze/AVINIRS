import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faSave, faTimes, faVial, faFlask, faClipboardCheck,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { resultAPI } from '../../services/api';
import {
  TextInput,
  TextareaInput,
  SelectInput,
  FormRow,
  FormSection,
  SuccessModal,
  ErrorModal,
  ConfirmationModal
} from '../../components/common';
import '../../styles/ResultEdit.css';

const ResultEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Form state
  const [formData, setFormData] = useState({
    value: '',
    unit: '',
    reference_range: '',
    notes: ''
  });
  
  // Original result data
  const [originalResult, setOriginalResult] = useState(null);
  
  // Validation state
  const [errors, setErrors] = useState({});
  
  // Data loading state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch result data
  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        
        const response = await resultAPI.getResultById(id);
        const resultData = response.data;
        
        setOriginalResult(resultData);
        
        // Set form data
        setFormData({
          value: resultData.value || '',
          unit: resultData.unit || '',
          reference_range: resultData.reference_range || '',
          notes: resultData.notes || ''
        });
      } catch (err) {
        console.error('Error fetching result:', err);
        setErrorMessage('Failed to load result data. Please try again later.');
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id]);

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
      
      const response = await resultAPI.updateResult(id, formData);
      
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error updating result:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to update result. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate(`/results/${id}`);
  };

  // Handle cancel
  const handleCancel = () => {
    // Check if form has been modified
    const isModified = 
      formData.value !== originalResult.value ||
      formData.unit !== originalResult.unit ||
      formData.reference_range !== originalResult.reference_range ||
      formData.notes !== originalResult.notes;
    
    if (isModified) {
      setShowCancelModal(true);
    } else {
      navigate(`/results/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading result data...</p>
      </div>
    );
  }

  if (!originalResult) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        Result not found or you don't have permission to edit it.
      </div>
    );
  }

  // Check if result is editable
  const isEditable = originalResult.status === 'Pending';

  return (
    <div className="result-edit-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faClipboardCheck} className="me-2" />
          Edit Result
        </h1>
        <Link to={`/results/${id}`} className="btn btn-secondary">
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to Result
        </Link>
      </div>

      {!isEditable && (
        <Alert variant="warning" className="mb-4">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          This result cannot be edited because it has already been {originalResult.status.toLowerCase()}.
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Result Information</h6>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <FormSection title="Sample & Test Information">
                  <FormRow>
                    <div className="mb-3">
                      <label className="form-label">Sample</label>
                      <div className="form-control-plaintext">
                        {originalResult.sample?.sample_id || 'N/A'}
                        {originalResult.sample?.patient && (
                          <span className="ms-2 text-muted">
                            (Patient: {originalResult.sample.patient.first_name} {originalResult.sample.patient.last_name})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Test</label>
                      <div className="form-control-plaintext">
                        {originalResult.test?.test_name || 'N/A'}
                      </div>
                    </div>
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
                      disabled={!isEditable}
                      error={errors.value}
                    />
                    <TextInput
                      name="unit"
                      label="Unit"
                      value={formData.unit}
                      onChange={handleChange}
                      placeholder="e.g., mg/dL"
                      required
                      disabled={!isEditable}
                      error={errors.unit}
                    />
                  </FormRow>
                  <TextInput
                    name="reference_range"
                    label="Reference Range"
                    value={formData.reference_range}
                    onChange={handleChange}
                    placeholder="e.g., 70-100 mg/dL"
                    disabled={!isEditable}
                    error={errors.reference_range}
                  />
                  <TextareaInput
                    name="notes"
                    label="Notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Enter any additional notes about the result"
                    rows={4}
                    disabled={!isEditable}
                    error={errors.notes}
                  />
                </FormSection>

                <div className="d-flex justify-content-end mt-4">
                  <Button 
                    variant="secondary" 
                    className="me-2"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    <FontAwesomeIcon icon={faTimes} className="me-2" />
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={submitting || !isEditable}
                  >
                    <FontAwesomeIcon icon={faSave} className="me-2" />
                    {submitting ? 'Saving...' : 'Save Changes'}
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
              {originalResult.test ? (
                <div>
                  <div className="test-info-item">
                    <FontAwesomeIcon icon={faFlask} className="me-2 text-primary" />
                    <strong>Test Name:</strong>
                    <span>{originalResult.test.test_name}</span>
                  </div>
                  <div className="test-info-item">
                    <strong>Sample Type:</strong>
                    <span>{originalResult.test.sample_type}</span>
                  </div>
                  <div className="test-info-item">
                    <strong>Turnaround Time:</strong>
                    <span>{originalResult.test.turnaround_time}</span>
                  </div>
                  <div className="test-info-item">
                    <strong>Default Unit:</strong>
                    <span>{originalResult.test.default_unit}</span>
                  </div>
                  <div className="test-info-item">
                    <strong>Reference Range:</strong>
                    <span>{originalResult.test.reference_range}</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted">No test information available.</p>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold">Sample Information</h6>
            </Card.Header>
            <Card.Body>
              {originalResult.sample ? (
                <div>
                  <div className="test-info-item">
                    <FontAwesomeIcon icon={faVial} className="me-2 text-primary" />
                    <strong>Sample ID:</strong>
                    <span>{originalResult.sample.sample_id}</span>
                  </div>
                  <div className="test-info-item">
                    <strong>Sample Type:</strong>
                    <span>{originalResult.sample.sample_type}</span>
                  </div>
                  <div className="test-info-item">
                    <strong>Collection Date:</strong>
                    <span>
                      {originalResult.sample.collection_date ? 
                        new Date(originalResult.sample.collection_date).toLocaleDateString() : 
                        'N/A'}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Link to={`/samples/${originalResult.sample.id}`} className="btn btn-primary btn-block w-100">
                      <FontAwesomeIcon icon={faVial} className="me-2" /> View Sample Details
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-muted">No sample information available.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={handleSuccessModalClose}
        title="Result Updated"
        message="The result has been successfully updated."
      />

      {/* Error Modal */}
      <ErrorModal
        show={showErrorModal}
        onHide={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        onConfirm={() => navigate(`/results/${id}`)}
        title="Discard Changes"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmText="Discard"
        cancelText="Continue Editing"
      />
    </div>
  );
};

export default ResultEdit;
