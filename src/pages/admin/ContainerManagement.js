import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, InputGroup, Badge, Row, Col, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faPlus, faEdit, faTrash, faVial,
  faSave, faTimes
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ContainerManagement = () => {
  const { user } = useAuth();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    volume: '',
    color: '',
    is_active: true
  });

  // Fetch containers on component mount
  useEffect(() => {
    const fetchContainers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await adminAPI.getContainers();
        setContainers(response.data.data || []);
      } catch (err) {
        console.error('Error fetching containers:', err);
        setError('Failed to load containers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchContainers();
  }, []);

  // Filter containers based on search query
  const filteredContainers = containers.filter(container => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      container.name?.toLowerCase().includes(query) ||
      container.code?.toLowerCase().includes(query) ||
      container.description?.toLowerCase().includes(query) ||
      container.color?.toLowerCase().includes(query)
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
  const handleShowModal = (container = null) => {
    if (container) {
      setEditingContainer(container);
      setFormData({
        name: container.name || '',
        code: container.code || '',
        description: container.description || '',
        volume: container.volume || '',
        color: container.color || '',
        is_active: container.is_active !== false
      });
    } else {
      setEditingContainer(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        volume: '',
        color: '',
        is_active: true
      });
    }
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingContainer) {
        await adminAPI.updateContainer(editingContainer.id, formData);
        setContainers(containers.map(container => 
          container.id === editingContainer.id ? { ...container, ...formData } : container
        ));
      } else {
        const response = await adminAPI.createContainer(formData);
        setContainers([...containers, response.data]);
      }
      
      setShowModal(false);
      setEditingContainer(null);
      setFormData({ name: '', code: '', description: '', volume: '', color: '', is_active: true });
    } catch (err) {
      console.error('Error saving container:', err);
      setError(err.response?.data?.message || 'Failed to save container. Please try again.');
    }
  };

  // Handle delete container
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this container?')) {
      try {
        await adminAPI.deleteContainer(id);
        setContainers(containers.filter(container => container.id !== id));
      } catch (err) {
        console.error('Error deleting container:', err);
        setError('Failed to delete container. Please try again.');
      }
    }
  };

  // Get color badge style
  const getColorBadgeStyle = (color) => {
    const colorMap = {
      'Red': '#dc3545',
      'Purple': '#6f42c1',
      'Green': '#198754',
      'Blue': '#0d6efd',
      'Yellow': '#ffc107',
      'Clear': '#6c757d',
      'Orange': '#fd7e14',
      'Pink': '#d63384'
    };
    
    return {
      backgroundColor: colorMap[color] || '#6c757d',
      color: 'white',
      border: 'none'
    };
  };

  return (
    <div className="container-management-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faVial} className="me-2" />
          Container Management
        </h1>
        {(user?.role === 'admin' || user?.role === 'hub_admin') && (
          <Button variant="primary" onClick={() => handleShowModal()}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add Container
          </Button>
        )}
      </div>

      {/* Search Card */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Search Containers</h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search by name, code, description, or color..."
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
          <p className="mt-2">Loading containers...</p>
        </div>
      )}

      {/* Containers Table */}
      {!loading && !error && (
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              Sample Containers
              <span className="badge bg-primary float-end">
                {filteredContainers.length} Records
              </span>
            </h6>
          </Card.Header>
          <Card.Body>
            {filteredContainers.length === 0 ? (
              <div className="text-center py-4">
                <FontAwesomeIcon icon={faVial} size="3x" className="text-gray-300 mb-3" />
                <p className="text-gray-500">No containers found.</p>
                {(user?.role === 'admin' || user?.role === 'hub_admin') && (
                  <Button variant="primary" onClick={() => handleShowModal()}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Add First Container
                  </Button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="table-hover" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>Container</th>
                      <th>Code</th>
                      <th>Volume</th>
                      <th>Color</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContainers.map(container => (
                      <tr key={container.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-sm me-3">
                              <div className="avatar-initial bg-primary rounded-circle">
                                <FontAwesomeIcon icon={faVial} className="text-white" />
                              </div>
                            </div>
                            <div>
                              <div className="fw-bold">{container.name}</div>
                              <div className="text-muted small">
                                {container.description || 'No description'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <code className="bg-light px-2 py-1 rounded">
                            {container.code}
                          </code>
                        </td>
                        <td>{container.volume || 'N/A'}</td>
                        <td>
                          <Badge style={getColorBadgeStyle(container.color)}>
                            {container.color || 'Unknown'}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={container.is_active !== false ? 'success' : 'secondary'}>
                            {container.is_active !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          {(user?.role === 'admin' || user?.role === 'hub_admin') && (
                            <>
                              <Button 
                                variant="warning" 
                                size="sm" 
                                className="me-1"
                                onClick={() => handleShowModal(container)}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => handleDelete(container.id)}
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
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingContainer ? 'Edit Container' : 'Add Container'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Container Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Container Code <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                style={{ textTransform: 'uppercase' }}
              />
            </Form.Group>
            
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
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Volume</Form.Label>
                  <Form.Control
                    type="text"
                    name="volume"
                    value={formData.volume}
                    onChange={handleInputChange}
                    placeholder="e.g., 5ml, 10ml"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Color</Form.Label>
                  <Form.Select
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                  >
                    <option value="">Select color...</option>
                    <option value="Red">Red</option>
                    <option value="Purple">Purple</option>
                    <option value="Green">Green</option>
                    <option value="Blue">Blue</option>
                    <option value="Yellow">Yellow</option>
                    <option value="Clear">Clear</option>
                    <option value="Orange">Orange</option>
                    <option value="Pink">Pink</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
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
              {editingContainer ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ContainerManagement;
