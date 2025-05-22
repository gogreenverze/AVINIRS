import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Button, Form, InputGroup, Badge, Row, Col, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faPlus, faEye, faEdit, faTrash, faLayerGroup,
  faSave, faTimes, faFlask
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TestPanelManagement = () => {
  const { user } = useAuth();
  const [panels, setPanels] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPanel, setEditingPanel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    price: '',
    test_ids: [],
    is_active: true
  });

  // Fetch panels and tests on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [panelsResponse, testsResponse] = await Promise.all([
          adminAPI.getTestPanels(),
          adminAPI.getTests()
        ]);
        
        setPanels(panelsResponse.data.data || []);
        setTests(testsResponse.data.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load test panels. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter panels based on search query
  const filteredPanels = panels.filter(panel => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      panel.name?.toLowerCase().includes(query) ||
      panel.code?.toLowerCase().includes(query) ||
      panel.description?.toLowerCase().includes(query)
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

  // Handle test selection
  const handleTestSelection = (testId) => {
    setFormData(prev => ({
      ...prev,
      test_ids: prev.test_ids.includes(testId)
        ? prev.test_ids.filter(id => id !== testId)
        : [...prev.test_ids, testId]
    }));
  };

  // Handle create/edit modal
  const handleShowModal = (panel = null) => {
    if (panel) {
      setEditingPanel(panel);
      setFormData({
        name: panel.name || '',
        code: panel.code || '',
        description: panel.description || '',
        price: panel.price || '',
        test_ids: panel.test_ids || [],
        is_active: panel.is_active !== false
      });
    } else {
      setEditingPanel(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        price: '',
        test_ids: [],
        is_active: true
      });
    }
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPanel) {
        await adminAPI.updateTestPanel(editingPanel.id, formData);
        setPanels(panels.map(panel => 
          panel.id === editingPanel.id ? { ...panel, ...formData } : panel
        ));
      } else {
        const response = await adminAPI.createTestPanel(formData);
        setPanels([...panels, response.data]);
      }
      
      setShowModal(false);
      setEditingPanel(null);
      setFormData({ name: '', code: '', description: '', price: '', test_ids: [], is_active: true });
    } catch (err) {
      console.error('Error saving test panel:', err);
      setError(err.response?.data?.message || 'Failed to save test panel. Please try again.');
    }
  };

  // Handle delete panel
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this test panel?')) {
      try {
        await adminAPI.deleteTestPanel(id);
        setPanels(panels.filter(panel => panel.id !== id));
      } catch (err) {
        console.error('Error deleting test panel:', err);
        setError('Failed to delete test panel. Please try again.');
      }
    }
  };

  // Get panel tests
  const getPanelTests = (panel) => {
    if (!panel.test_ids || !Array.isArray(panel.test_ids)) return [];
    return tests.filter(test => panel.test_ids.includes(test.id));
  };

  return (
    <div className="test-panel-management-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faLayerGroup} className="me-2" />
          Test Panel Management
        </h1>
        {(user?.role === 'admin' || user?.role === 'hub_admin') && (
          <Button variant="primary" onClick={() => handleShowModal()}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add Test Panel
          </Button>
        )}
      </div>

      {/* Search Card */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Search Test Panels</h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search by name, code, or description..."
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
          <p className="mt-2">Loading test panels...</p>
        </div>
      )}

      {/* Test Panels Table */}
      {!loading && !error && (
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              Test Panels
              <span className="badge bg-primary float-end">
                {filteredPanels.length} Records
              </span>
            </h6>
          </Card.Header>
          <Card.Body>
            {filteredPanels.length === 0 ? (
              <div className="text-center py-4">
                <FontAwesomeIcon icon={faLayerGroup} size="3x" className="text-gray-300 mb-3" />
                <p className="text-gray-500">No test panels found.</p>
                {(user?.role === 'admin' || user?.role === 'hub_admin') && (
                  <Button variant="primary" onClick={() => handleShowModal()}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Add First Test Panel
                  </Button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="table-hover" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>Panel Name</th>
                      <th>Code</th>
                      <th>Tests</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPanels.map(panel => (
                      <tr key={panel.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-sm me-3">
                              <div className="avatar-initial bg-primary rounded-circle">
                                <FontAwesomeIcon icon={faLayerGroup} className="text-white" />
                              </div>
                            </div>
                            <div>
                              <div className="fw-bold">{panel.name}</div>
                              <div className="text-muted small">
                                {panel.description || 'No description'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <code className="bg-light px-2 py-1 rounded">
                            {panel.code}
                          </code>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {getPanelTests(panel).slice(0, 3).map(test => (
                              <Badge key={test.id} bg="info" className="small">
                                {test.test_name}
                              </Badge>
                            ))}
                            {getPanelTests(panel).length > 3 && (
                              <Badge bg="secondary" className="small">
                                +{getPanelTests(panel).length - 3} more
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td>₹{panel.price || 0}</td>
                        <td>
                          <Badge bg={panel.is_active !== false ? 'success' : 'secondary'}>
                            {panel.is_active !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          {(user?.role === 'admin' || user?.role === 'hub_admin') && (
                            <>
                              <Button 
                                variant="warning" 
                                size="sm" 
                                className="me-1"
                                onClick={() => handleShowModal(panel)}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => handleDelete(panel.id)}
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
            {editingPanel ? 'Edit Test Panel' : 'Add Test Panel'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Panel Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Panel Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    style={{ textTransform: 'uppercase' }}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
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
            
            <Form.Group className="mb-3">
              <Form.Label>Select Tests</Form.Label>
              <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {tests.map(test => (
                  <Form.Check
                    key={test.id}
                    type="checkbox"
                    id={`test-${test.id}`}
                    label={`${test.test_name} (${test.test_code})`}
                    checked={formData.test_ids.includes(test.id)}
                    onChange={() => handleTestSelection(test.id)}
                    className="mb-2"
                  />
                ))}
              </div>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="is_active"
                label="Active"
                checked={formData.is_active}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              <FontAwesomeIcon icon={faTimes} className="me-2" />
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              <FontAwesomeIcon icon={faSave} className="me-2" />
              {editingPanel ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default TestPanelManagement;
