import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Table, Badge, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFlask, faArrowLeft, faSave, faSearch, faVial, 
  faCheckCircle, faTimesCircle, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { sampleAPI, resultAPI } from '../../services/api';
import { 
  TextInput, 
  SelectInput, 
  TextareaInput,
  DateInput,
  FormSection,
  SuccessModal,
  ErrorModal,
  ConfirmationModal
} from '../../components/common';
import '../../styles/LabProcess.css';

const LabProcess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const sampleIdParam = queryParams.get('sample_id');

  // Form state
  const [formData, setFormData] = useState({
    sample_id: '',
    processing_date: new Date().toISOString().split('T')[0],
    processor: '',
    status: 'In Process',
    notes: '',
    results: []
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSample, setSelectedSample] = useState(null);
  const [testCatalog, setTestCatalog] = useState([]);

  // Status options
  const statusOptions = [
    { value: 'In Process', label: 'In Process' },
    { value: 'Processed', label: 'Processed' },
    { value: 'Rejected', label: 'Rejected' }
  ];

  // Fetch sample if ID is provided
  useEffect(() => {
    if (sampleIdParam) {
      const fetchSample = async () => {
        try {
          setLoading(true);
          const response = await sampleAPI.getSampleById(sampleIdParam);
          setSelectedSample(response.data);
          setFormData(prev => ({
            ...prev,
            sample_id: response.data.id
          }));
        } catch (err) {
          console.error('Error fetching sample:', err);
          setError('Failed to load sample details. Please try again later.');
        } finally {
          setLoading(false);
        }
      };

      fetchSample();
    }
  }, [sampleIdParam]);

  // Fetch test catalog
  useEffect(() => {
    const fetchTestCatalog = async () => {
      try {
        // In a real app, this would be an API call to get the test catalog
        // For now, we'll use dummy data
        setTestCatalog([
          { id: 1, name: 'Complete Blood Count (CBC)', category: 'Hematology' },
          { id: 2, name: 'Blood Glucose', category: 'Chemistry' },
          { id: 3, name: 'Lipid Profile', category: 'Chemistry' },
          { id: 4, name: 'Liver Function Test', category: 'Chemistry' },
          { id: 5, name: 'Kidney Function Test', category: 'Chemistry' },
          { id: 6, name: 'Thyroid Function Test', category: 'Endocrinology' },
          { id: 7, name: 'HbA1c', category: 'Diabetes' },
          { id: 8, name: 'Urine Analysis', category: 'Urinalysis' }
        ]);
      } catch (err) {
        console.error('Error fetching test catalog:', err);
      }
    };

    fetchTestCatalog();
  }, []);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handle result field changes
  const handleResultChange = (index, e) => {
    const { name, value } = e.target;
    setFormData(prevData => {
      const updatedResults = [...prevData.results];
      updatedResults[index] = {
        ...updatedResults[index],
        [name]: value
      };
      return {
        ...prevData,
        results: updatedResults
      };
    });
  };

  // Add new test result
  const handleAddTest = (testId) => {
    const test = testCatalog.find(t => t.id === testId);
    if (!test) return;
    
    // Check if test is already added
    if (formData.results.some(r => r.test_id === testId)) {
      setError(`Test "${test.name}" is already added.`);
      return;
    }
    
    setFormData(prevData => ({
      ...prevData,
      results: [
        ...prevData.results,
        {
          test_id: testId,
          test_name: test.name,
          result_value: '',
          reference_range: '',
          status: 'Pending',
          notes: ''
        }
      ]
    }));
  };

  // Remove test result
  const handleRemoveTest = (index) => {
    setFormData(prevData => {
      const updatedResults = [...prevData.results];
      updatedResults.splice(index, 1);
      return {
        ...prevData,
        results: updatedResults
      };
    });
  };

  // Search for samples
  const handleSampleSearch = async () => {
    if (!searchQuery) return;
    
    try {
      setLoading(true);
      const response = await sampleAPI.searchSamples(searchQuery);
      setSearchResults(response.data);
    } catch (err) {
      console.error('Error searching samples:', err);
      setError('Failed to search samples. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Select a sample from search results
  const handleSelectSample = (sample) => {
    setSelectedSample(sample);
    setFormData(prev => ({
      ...prev,
      sample_id: sample.id
    }));
    setSearchResults([]);
    setSearchQuery('');
  };

  // Validate form before submission
  const validateForm = () => {
    if (!formData.sample_id) {
      setError('Please select a sample.');
      return false;
    }
    
    if (!formData.processing_date) {
      setError('Please enter a processing date.');
      return false;
    }
    
    if (!formData.processor) {
      setError('Please enter the name of the processor.');
      return false;
    }
    
    if (formData.status === 'Processed' && formData.results.length === 0) {
      setError('Please add at least one test result for processed samples.');
      return false;
    }
    
    // Validate each result
    if (formData.results.length > 0) {
      for (let i = 0; i < formData.results.length; i++) {
        const result = formData.results[i];
        if (!result.result_value) {
          setError(`Please enter a result value for "${result.test_name}".`);
          return false;
        }
      }
    }
    
    setValidated(true);
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Update sample status
      await sampleAPI.updateSample(formData.sample_id, {
        status: formData.status,
        processing_date: formData.processing_date,
        processor: formData.processor,
        notes: formData.notes
      });
      
      // Create results if sample is processed
      if (formData.status === 'Processed' && formData.results.length > 0) {
        for (const result of formData.results) {
          await resultAPI.createResult({
            sample_id: formData.sample_id,
            patient_id: selectedSample.patient_id,
            test_id: result.test_id,
            test_name: result.test_name,
            result_value: result.result_value,
            reference_range: result.reference_range,
            status: 'Pending',
            notes: result.notes
          });
        }
      }
      
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error processing sample:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to process sample. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/lab');
  };

  // Handle cancel
  const handleCancel = () => {
    setShowCancelModal(true);
  };

  // Sample status badge variant
  const getSampleStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Collected':
        return 'warning';
      case 'In Process':
        return 'info';
      case 'Processed':
        return 'success';
      case 'Rejected':
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
        <p className="mt-2">Loading sample details...</p>
      </div>
    );
  }

  return (
    <div className="lab-process-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faFlask} className="me-2" />
          Process Sample
        </h1>
        <div>
          <Button variant="secondary" className="me-2" onClick={handleCancel}>
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={submitting}
          >
            <FontAwesomeIcon icon={faSave} className="me-2" />
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <Form noValidate validated={validated}>
        <Row>
          <Col lg={8}>
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Sample Information</h6>
              </Card.Header>
              <Card.Body>
                {error && (
                  <Alert variant="danger" className="mb-4">
                    {error}
                  </Alert>
                )}

                {selectedSample ? (
                  <div className="selected-sample mb-4">
                    <div className="d-flex align-items-center">
                      <FontAwesomeIcon icon={faVial} className="me-2 text-primary" size="lg" />
                      <div>
                        <h5 className="mb-0">Sample ID: {selectedSample.sample_id}</h5>
                        <p className="text-muted mb-0">
                          Type: {selectedSample.sample_type} | 
                          Status: <Badge bg={getSampleStatusBadgeVariant(selectedSample.status)}>{selectedSample.status}</Badge>
                        </p>
                        {selectedSample.patient && (
                          <p className="text-muted mb-0">
                            Patient: {selectedSample.patient.first_name} {selectedSample.patient.last_name} | 
                            ID: {selectedSample.patient.patient_id}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="link" 
                        className="ms-auto"
                        onClick={() => {
                          setSelectedSample(null);
                          setFormData(prev => ({ ...prev, sample_id: '' }));
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="sample-search mb-4">
                    <FormSection title="Select Sample">
                      <div className="d-flex mb-3">
                        <Form.Control
                          type="text"
                          placeholder="Search by sample ID or patient name"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="me-2"
                        />
                        <Button 
                          variant="primary" 
                          onClick={handleSampleSearch}
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faSearch} />
                        </Button>
                      </div>
                      
                      {searchResults.length > 0 && (
                        <div className="search-results mb-3">
                          <Table hover size="sm">
                            <thead>
                              <tr>
                                <th>Sample ID</th>
                                <th>Patient</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {searchResults.map(sample => (
                                <tr key={sample.id}>
                                  <td>{sample.sample_id}</td>
                                  <td>
                                    {sample.patient ? `${sample.patient.first_name} ${sample.patient.last_name}` : 'N/A'}
                                  </td>
                                  <td>{sample.sample_type}</td>
                                  <td>
                                    <Badge bg={getSampleStatusBadgeVariant(sample.status)}>
                                      {sample.status}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm"
                                      onClick={() => handleSelectSample(sample)}
                                      disabled={sample.status !== 'Collected'}
                                    >
                                      Select
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </FormSection>
                  </div>
                )}

                <Row>
                  <Col md={6}>
                    <DateInput
                      name="processing_date"
                      label="Processing Date"
                      value={formData.processing_date}
                      onChange={handleChange}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <TextInput
                      name="processor"
                      label="Processed By"
                      value={formData.processor}
                      onChange={handleChange}
                      required
                      placeholder="Enter name of lab technician"
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

                <TextareaInput
                  name="notes"
                  label="Notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter any notes about the sample processing"
                />
              </Card.Body>
            </Card>

            {formData.status !== 'Rejected' && (
              <Card className="shadow mb-4">
                <Card.Header className="py-3 d-flex justify-content-between align-items-center">
                  <h6 className="m-0 font-weight-bold text-primary">Test Results</h6>
                  <Form.Select 
                    className="w-auto"
                    onChange={(e) => handleAddTest(parseInt(e.target.value))}
                    value=""
                  >
                    <option value="">Add Test...</option>
                    {testCatalog.map(test => (
                      <option key={test.id} value={test.id}>{test.name}</option>
                    ))}
                  </Form.Select>
                </Card.Header>
                <Card.Body>
                  {formData.results.length > 0 ? (
                    <div className="test-results">
                      {formData.results.map((result, index) => (
                        <div key={index} className="test-result-item">
                          <div className="test-result-header">
                            <h6>{result.test_name}</h6>
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => handleRemoveTest(index)}
                            >
                              <FontAwesomeIcon icon={faTimesCircle} />
                            </Button>
                          </div>
                          <Row>
                            <Col md={6}>
                              <TextInput
                                name="result_value"
                                label="Result Value"
                                value={result.result_value}
                                onChange={(e) => handleResultChange(index, e)}
                                required
                              />
                            </Col>
                            <Col md={6}>
                              <TextInput
                                name="reference_range"
                                label="Reference Range"
                                value={result.reference_range}
                                onChange={(e) => handleResultChange(index, e)}
                                placeholder="e.g., 70-100 mg/dL"
                              />
                            </Col>
                          </Row>
                          <TextareaInput
                            name="notes"
                            label="Notes"
                            value={result.notes}
                            onChange={(e) => handleResultChange(index, e)}
                            rows={2}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert variant="info">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                      No tests added yet. Use the dropdown above to add tests.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            )}
          </Col>

          <Col lg={4}>
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold">Processing Summary</h6>
              </Card.Header>
              <Card.Body>
                <div className="processing-summary">
                  {selectedSample ? (
                    <>
                      <div className="summary-item">
                        <span>Sample ID:</span>
                        <span>{selectedSample.sample_id}</span>
                      </div>
                      <div className="summary-item">
                        <span>Sample Type:</span>
                        <span>{selectedSample.sample_type}</span>
                      </div>
                      <div className="summary-item">
                        <span>Collection Date:</span>
                        <span>{new Date(selectedSample.collection_date).toLocaleDateString()}</span>
                      </div>
                      <div className="summary-item">
                        <span>Current Status:</span>
                        <span>
                          <Badge bg={getSampleStatusBadgeVariant(selectedSample.status)}>
                            {selectedSample.status}
                          </Badge>
                        </span>
                      </div>
                      <div className="summary-item">
                        <span>New Status:</span>
                        <span>
                          <Badge bg={getSampleStatusBadgeVariant(formData.status)}>
                            {formData.status}
                          </Badge>
                        </span>
                      </div>
                      <div className="summary-item">
                        <span>Tests Added:</span>
                        <span>{formData.results.length}</span>
                      </div>
                    </>
                  ) : (
                    <Alert variant="warning">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                      Please select a sample to process.
                    </Alert>
                  )}
                </div>

                <div className="d-grid gap-2 mt-4">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={submitting || !selectedSample}
                  >
                    <FontAwesomeIcon icon={faSave} className="me-2" />
                    {submitting ? 'Saving...' : 'Save Processing Results'}
                  </Button>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold">Help</h6>
              </Card.Header>
              <Card.Body>
                <p>
                  <strong>Processing Date:</strong> The date when the sample was processed.
                </p>
                <p>
                  <strong>Status:</strong> Update the sample status based on processing results.
                </p>
                <p>
                  <strong>Test Results:</strong> Add test results for the processed sample.
                </p>
                <p>
                  <strong>Reference Range:</strong> The normal range for the test result.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={handleSuccessModalClose}
        title="Sample Processed"
        message="The sample has been successfully processed."
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
        onConfirm={() => navigate('/lab')}
        title="Cancel Processing"
        message="Are you sure you want to cancel? All unsaved changes will be lost."
        confirmText="Yes, Cancel"
        cancelText="No, Continue"
      />
    </div>
  );
};

export default LabProcess;
