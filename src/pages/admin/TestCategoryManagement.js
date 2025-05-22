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

const TestCategoryManagement = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true
  });

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await adminAPI.getTestCategories();
        setCategories(response.data.data || []);
      } catch (err) {
        console.error('Error fetching test categories:', err);
        setError('Failed to load test categories. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Filter categories based on search query
  const filteredCategories = categories.filter(category => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      category.name?.toLowerCase().includes(query) ||
      category.code?.toLowerCase().includes(query) ||
      category.description?.toLowerCase().includes(query)
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
  const handleShowModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        code: category.code || '',
        description: category.description || '',
        is_active: category.is_active !== false
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        is_active: true
      });
    }
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await adminAPI.updateTestCategory(editingCategory.id, formData);
        setCategories(categories.map(cat => 
          cat.id === editingCategory.id ? { ...cat, ...formData } : cat
        ));
      } else {
        const response = await adminAPI.createTestCategory(formData);
        setCategories([...categories, response.data]);
      }
      
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', code: '', description: '', is_active: true });
    } catch (err) {
      console.error('Error saving test category:', err);
      setError(err.response?.data?.message || 'Failed to save test category. Please try again.');
    }
  };

  // Handle delete category
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this test category?')) {
      try {
        await adminAPI.deleteTestCategory(id);
        setCategories(categories.filter(category => category.id !== id));
      } catch (err) {
        console.error('Error deleting test category:', err);
        setError('Failed to delete test category. Please try again.');
      }
    }
  };

  return (
    <div className="test-category-management-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faFlask} className="me-2" />
          Test Categories
        </h1>
        {(user?.role === 'admin' || user?.role === 'hub_admin') && (
          <Button variant="primary" onClick={() => handleShowModal()}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add Category
          </Button>
        )}
      </div>

      {/* Search Card */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Search Categories</h6>
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
          <p className="mt-2">Loading test categories...</p>
        </div>
      )}

      {/* Categories Table */}
      {!loading && !error && (
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              Test Categories
              <span className="badge bg-primary float-end">
                {filteredCategories.length} Records
              </span>
            </h6>
          </Card.Header>
          <Card.Body>
            {filteredCategories.length === 0 ? (
              <div className="text-center py-4">
                <FontAwesomeIcon icon={faFlask} size="3x" className="text-gray-300 mb-3" />
                <p className="text-gray-500">No test categories found.</p>
                {(user?.role === 'admin' || user?.role === 'hub_admin') && (
                  <Button variant="primary" onClick={() => handleShowModal()}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Add First Category
                  </Button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="table-hover" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map(category => (
                      <tr key={category.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-sm me-3">
                              <div className="avatar-initial bg-primary rounded-circle">
                                <FontAwesomeIcon icon={faFlask} className="text-white" />
                              </div>
                            </div>
                            <div className="fw-bold">{category.name}</div>
                          </div>
                        </td>
                        <td>
                          <code className="bg-light px-2 py-1 rounded">
                            {category.code}
                          </code>
                        </td>
                        <td>{category.description || 'N/A'}</td>
                        <td>
                          <Badge bg={category.is_active !== false ? 'success' : 'secondary'}>
                            {category.is_active !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          {(user?.role === 'admin' || user?.role === 'hub_admin') && (
                            <>
                              <Button 
                                variant="warning" 
                                size="sm" 
                                className="me-1"
                                onClick={() => handleShowModal(category)}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => handleDelete(category.id)}
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
            {editingCategory ? 'Edit Test Category' : 'Add Test Category'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Category Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Category Code <span className="text-danger">*</span></Form.Label>
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
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
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
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default TestCategoryManagement;
