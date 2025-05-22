import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Button, Form, InputGroup, Badge, Row, Col, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faPlus, faEye, faEdit, faTrash, faFlask,
  faSave, faTimes
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TestManagement = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
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

  // Fetch tests and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [testsResponse, categoriesResponse] = await Promise.all([
          adminAPI.getTests(),
          adminAPI.getTestCategories()
        ]);
        
        setTests(testsResponse.data.data || []);
        setCategories(categoriesResponse.data.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load tests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter tests based on search query
  const filteredTests = tests.filter(test => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      test.test_name?.toLowerCase().includes(query) ||
      test.test_code?.toLowerCase().includes(query) ||
      test.method?.toLowerCase().includes(query) ||
      test.sample_type?.toLowerCase().includes(query)
    );
  });

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle create/edit modal
  const handleShowModal = (test = null) => {
    if (test) {
      setEditingTest(test);
      setFormData({
        test_name: test.test_name || '',
        test_code: test.test_code || '',
        category_id: test.category_id || '',
        price: test.price || '',
        normal_range: test.normal_range || '',
        unit: test.unit || '',
        method: test.method || '',
        sample_type: test.sample_type || '',
        turnaround_time: test.turnaround_time || '',
        is_active: test.is_active !== false
      });
    } else {
      setEditingTest(null);
      setFormData({
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
    }
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingTest) {
        await adminAPI.updateTest(editingTest.id, formData);
        setTests(tests.map(test => 
          test.id === editingTest.id ? { ...test, ...formData } : test
        ));
      } else {
        const response = await adminAPI.createTest(formData);
        setTests([...tests, response.data]);
      }
      
      setShowModal(false);
      setEditingTest(null);
      setFormData({ 
        test_name: '', test_code: '', category_id: '', price: '', 
        normal_range: '', unit: '', method: '', sample_type: '', 
        turnaround_time: '', is_active: true 
      });
    } catch (err) {
      console.error('Error saving test:', err);
      setError(err.response?.data?.message || 'Failed to save test. Please try again.');
    }
  };

  // Handle delete test
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      try {
        await adminAPI.deleteTest(id);
        setTests(tests.filter(test => test.id !== id));
      } catch (err) {
        console.error('Error deleting test:', err);
        setError('Failed to delete test. Please try again.');
      }
    }
  };

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  return (
    <div className="test-management-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faFlask} className="me-2" />
          Test Management
        </h1>
        {(user?.role === 'admin' || user?.role === 'hub_admin') && (
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={() => handleShowModal()}>
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Add Test
            </Button>
            <Link to="/admin/tests/create" className="btn btn-success">
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Create Test (Form)
            </Link>
          </div>
        )}
      </div>

      {/* Search Card */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Search Tests</h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search by name, code, method, or sample type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="primary" type="submit">
                <FontAwesomeIcon icon={faSearch} />
              </Button>
            </InputGroup>
          </Form>
        </Card.Body>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Loading Message */}
      {loading && (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading tests...</p>
        </div>
      )}

      {/* Tests Table */}
      {!loading && !error && (
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              Laboratory Tests
              <span className="badge bg-primary float-end">
                {filteredTests.length} Records
              </span>
            </h6>
          </Card.Header>
          <Card.Body>
            {filteredTests.length === 0 ? (
              <div className="text-center py-4">
                <FontAwesomeIcon icon={faFlask} size="3x" className="text-gray-300 mb-3" />
                <p className="text-gray-500">No tests found.</p>
                {(user?.role === 'admin' || user?.role === 'hub_admin') && (
                  <Button variant="primary" onClick={() => handleShowModal()}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Add First Test
                  </Button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="table-hover" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>Test Name</th>
                      <th>Code</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Sample Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTests.map(test => (
                      <tr key={test.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-sm me-3">
                              <div className="avatar-initial bg-primary rounded-circle">
                                <FontAwesomeIcon icon={faFlask} className="text-white" />
                              </div>
                            </div>
                            <div>
                              <div className="fw-bold">{test.test_name}</div>
                              <div className="text-muted small">
                                {test.method || 'No method specified'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <code className="bg-light px-2 py-1 rounded">
                            {test.test_code}
                          </code>
                        </td>
                        <td>
                          <Badge bg="info">
                            {getCategoryName(test.category_id)}
                          </Badge>
                        </td>
                        <td>₹{test.price || 0}</td>
                        <td>
                          <Badge bg="secondary">
                            {test.sample_type || 'N/A'}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={test.is_active !== false ? 'success' : 'secondary'}>
                            {test.is_active !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          {(user?.role === 'admin' || user?.role === 'hub_admin') && (
                            <>
                              <Button 
                                variant="warning" 
                                size="sm" 
                                className="me-1"
                                onClick={() => handleShowModal(test)}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => handleDelete(test.id)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingTest ? 'Edit Test' : 'Add Test'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
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

            <Row>
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
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              <FontAwesomeIcon icon={faTimes} className="me-2" />
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              <FontAwesomeIcon icon={faSave} className="me-2" />
              {editingTest ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default TestManagement;
