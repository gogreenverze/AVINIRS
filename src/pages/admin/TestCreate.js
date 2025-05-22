import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faFlask } from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';

const TestCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    test_name: '',
    test_code: '',
    category_id: '',
    price: '',
    normal_range: '',
    unit: '',
    method: '',
    sample_type: '',
    turnaround_time: '',
    is_active: true
  });

  // Fetch test categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await adminAPI.getTestCategories();
        setCategories(response.data.data || []);
      } catch (err) {
        console.error('Error fetching test categories:', err);
        setError('Failed to load test categories. Please try again.');
      }
    };

    fetchCategories();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.test_name || !formData.test_code || !formData.category_id) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await adminAPI.createTest(formData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/master-data');
      }, 2000);
      
    } catch (err) {
      console.error('Error creating test:', err);
      setError(err.response?.data?.message || 'Failed to create test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-create-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faFlask} className="me-2" />
          Add New Test
        </h1>
        <Button 
          variant="secondary" 
          onClick={() => navigate('/admin/master-data')}
          className="btn-sm"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to Master Data
        </Button>
      </div>

      {/* Success Message */}
      {success && (
        <Alert variant="success">
          Test created successfully! Redirecting to master data...
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      {/* Create Form */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Test Information</h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <h6 className="text-primary mb-3">Basic Information</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Test Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="test_name"
                    value={formData.test_name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Test Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="test_code"
                    value={formData.test_code}
                    onChange={handleInputChange}
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select category...</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Technical Information */}
            <h6 className="text-primary mb-3 mt-4">Technical Information</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Normal Range</Form.Label>
                  <Form.Control
                    type="text"
                    name="normal_range"
                    value={formData.normal_range}
                    onChange={handleInputChange}
                    placeholder="e.g., 70-100 mg/dL"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit</Form.Label>
                  <Form.Control
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    placeholder="e.g., mg/dL, g/dL, %"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Method</Form.Label>
                  <Form.Control
                    type="text"
                    name="method"
                    value={formData.method}
                    onChange={handleInputChange}
                    placeholder="e.g., Enzymatic, ELISA, PCR"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sample Type</Form.Label>
                  <Form.Select
                    name="sample_type"
                    value={formData.sample_type}
                    onChange={handleInputChange}
                  >
                    <option value="">Select sample type...</option>
                    <option value="Blood">Blood</option>
                    <option value="Serum">Serum</option>
                    <option value="Plasma">Plasma</option>
                    <option value="Urine">Urine</option>
                    <option value="Stool">Stool</option>
                    <option value="Swab">Swab</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Turnaround Time</Form.Label>
                  <Form.Control
                    type="text"
                    name="turnaround_time"
                    value={formData.turnaround_time}
                    onChange={handleInputChange}
                    placeholder="e.g., 2-4 hours, 24 hours"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Check
                    type="checkbox"
                    name="is_active"
                    label="Active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={() => navigate('/admin/master-data')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="me-2" />
                    Create Test
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TestCreate;
