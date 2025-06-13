import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, useParams } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import { sampleAPI, patientAPI } from '../../services/api';
import '../../styles/SampleCreate.css';

const SampleEdit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const patientId = queryParams.get('patient_id');
  const { id } = useParams();
 const [sample, setSample] = useState(null);

  const [formData, setFormData] = useState({
    patient_id: sample?.patient_id || '',
    sample_type_id: '',
    container_id: '',
    collection_date: sample?.collection_date,
    collection_time: sample?.collection_time,
    notes: ''
  });

  const [patient, setPatient] = useState(null);
  const [sampleTypes, setSampleTypes] = useState([]);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);
 
 useEffect(() => {
  const fetchSample = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sampleAPI.getSampleById(id);
      const fetchedSample = response.data;
      setSample(fetchedSample);
      setFormData({
        patient_id: fetchedSample.patient_id || '',
        sample_type_id: fetchedSample.sample_type_id?.toString() || '',
        container_id: fetchedSample.container_id?.toString() || '',
        collection_date: fetchedSample.collection_date || '',
        collection_time: fetchedSample.collection_time || '',
        notes: fetchedSample.notes || ''
      });
    } catch (err) {
      console.error('Error fetching sample:', err);
      setError('Failed to load sample details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  fetchSample();
}, [id]);


 

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch sample types
        const typesResponse = await sampleAPI.getSampleTypes();
        setSampleTypes(typesResponse.data);

        // Fetch containers
        const containersResponse = await sampleAPI.getContainers();
        setContainers(containersResponse.data);

        // If patient ID is provided, fetch patient details
        if (patientId) {
          const patientResponse = await patientAPI.getPatientById(patientId);
          setPatient(patientResponse.data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId]);


  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handle sample type change to filter containers
  const handleSampleTypeChange = (e) => {
    const sampleTypeId = e.target.value;
    setFormData(prevData => ({
      ...prevData,
      sample_type_id: sampleTypeId,
      container_id: '' // Reset container when sample type changes
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await sampleAPI.updateSample(id,formData);

      // Navigate to the newly created sample
      navigate(`/samples/${response.data.id}`);
    } catch (err) {
      console.error('Error creating sample:', err);
      setError(err.response?.data?.message || 'Failed to create sample. Please try again.');
      setSubmitting(false);
    }
  };

  // Filter containers based on selected sample type
  const filteredContainers = formData.sample_type_id
    ? containers.filter(container => container.sample_type_id === parseInt(formData.sample_type_id))
    : containers;

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading form data...</p>
      </div>
    );
  }





 
  return (
    <div className="sample-create-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">Edit Sample</h1>
        <div>
          <Link to="/samples" className="btn btn-secondary">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to List
          </Link>
        </div>
      </div>

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

              {patient && (
                <Alert variant="info" className="mb-4">
                  <strong>Patient:</strong> {patient.first_name} {patient.last_name} (ID: {patient.patient_id})
                  <input type="hidden" name="patient_id" value={patient.id} />
                </Alert>
              )}

              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                {!patient && (
                  <Form.Group className="mb-3" controlId="patient_id">
                    <Form.Label>Patient ID</Form.Label>
                    <Form.Control
                      type="text"
                      name="patient_id"
                      value={formData.patient_id}
                      onChange={handleChange}
                      placeholder="Enter patient ID"
                    />
                    <Form.Text className="text-muted">
                      Leave blank if sample is not associated with a patient.
                    </Form.Text>
                  </Form.Group>
                )}

                <Form.Group className="mb-3" controlId="sample_type_id">
                  <Form.Label>Sample Type <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="sample_type_id"
                    value={formData.sample_type_id}
                    onChange={handleSampleTypeChange}
                    required
                  >
                    <option value="">Select Sample Type</option>
                    {sampleTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.type_name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    Please select a sample type.
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3" controlId="container_id">
                  <Form.Label>Container <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="container_id"
                    value={formData.container_id}
                    onChange={handleChange}
                    required
                    disabled={!formData.sample_type_id}
                  >
                    <option value="">Select Container</option>
                    {filteredContainers.map(container => (
                      <option key={container.id} value={container.id}>
                        {container.container_name} ({container.color_code})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    Please select a container.
                  </Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="collection_date">
                      <Form.Label>Collection Date <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="date"
                        name="collection_date"
                        value={formData.collection_date}
                        onChange={handleChange}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide a collection date.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="collection_time">
                      <Form.Label>Collection Time <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="time"
                        name="collection_time"
                        value={formData.collection_time}
                        onChange={handleChange}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide a collection time.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3" controlId="notes">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Enter any additional notes about the sample"
                  />
                </Form.Group>

                <div className="d-flex justify-content-end">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={submitting}
                  >
                    <FontAwesomeIcon icon={faSave} className="me-2" />
                    {submitting ? 'Saving...' : 'Save Sample'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold">Instructions</h6>
            </Card.Header>
            <Card.Body>
              <p>Fields marked with <span className="text-danger">*</span> are required.</p>
              <p>After creating a sample, you can add tests to it.</p>
              <p>The status will be set to "Collected" by default if not specified.</p>

              {formData.sample_type_id && (
                <div className="mt-4">
                  <h6 className="font-weight-bold">Selected Sample Type Information:</h6>
                  {sampleTypes.filter(type => type.id === parseInt(formData.sample_type_id)).map(type => (
                    <div key={type.id} className="sample-type-info">
                      <p><strong>Type:</strong> {type.type_name}</p>
                      <p><strong>Code:</strong> {type.type_code}</p>
                      {type.description && (
                        <p><strong>Description:</strong> {type.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {formData.container_id && (
                <div className="mt-4">
                  <h6 className="font-weight-bold">Selected Container Information:</h6>
                  {containers.filter(container => container.id === parseInt(formData.container_id)).map(container => (
                    <div key={container.id} className="container-info">
                      <p><strong>Container:</strong> {container.container_name}</p>
                      <p><strong>Color Code:</strong> {container.color_code}</p>
                      {container.volume_required && (
                        <p><strong>Volume Required:</strong> {container.volume_required}</p>
                      )}
                      {container.additive && (
                        <p><strong>Additive:</strong> {container.additive}</p>
                      )}
                      {container.storage_temp && (
                        <p><strong>Storage Temperature:</strong> {container.storage_temp}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SampleEdit;
