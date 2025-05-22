import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, InputGroup, Badge, Row, Col, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faPlus, faEdit, faTrash, faVial,
  faSave, faTimes
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SampleTypeManagement = () => {
  const { user } = useAuth();
  const [sampleTypes, setSampleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSampleType, setEditingSampleType] = useState(null);
  const [formData, setFormData] = useState({
    type_name: '',
    type_code: '',
    description: '',
    is_active: true
  });

  // Fetch sample types on component mount
  useEffect(() => {
    const fetchSampleTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await adminAPI.getSampleTypes();
        setSampleTypes(response.data.data || []);
      } catch (err) {
        console.error('Error fetching sample types:', err);
        setError('Failed to load sample types. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSampleTypes();
  }, []);

  // Filter sample types based on search query
  const filteredSampleTypes = sampleTypes.filter(sampleType => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      sampleType.type_name?.toLowerCase().includes(query) ||
      sampleType.type_code?.toLowerCase().includes(query) ||
      sampleType.description?.toLowerCase().includes(query)
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
  const handleShowModal = (sampleType = null) => {
    if (sampleType) {
      setEditingSampleType(sampleType);
      setFormData({
        type_name: sampleType.type_name || '',
        type_code: sampleType.type_code || '',
        description: sampleType.description || '',
        is_active: sampleType.is_active !== false
      });
    } else {
      setEditingSampleType(null);
      setFormData({
        type_name: '',
        type_code: '',
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
      if (editingSampleType) {
        await adminAPI.updateSampleType(editingSampleType.id, formData);
        setSampleTypes(sampleTypes.map(sampleType => 
          sampleType.id === editingSampleType.id ? { ...sampleType, ...formData } : sampleType
        ));
      } else {
        const response = await adminAPI.createSampleType(formData);
        setSampleTypes([...sampleTypes, response.data]);
      }
      
      setShowModal(false);
      setEditingSampleType(null);
      setFormData({ type_name: '', type_code: '', description: '', is_active: true });
    } catch (err) {
      console.error('Error saving sample type:', err);
      setError(err.response?.data?.message || 'Failed to save sample type. Please try again.');
    }
  };

  // Handle delete sample type
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sample type?')) {
      try {
        await adminAPI.deleteSampleType(id);
        setSampleTypes(sampleTypes.filter(sampleType => sampleType.id !== id));
      } catch (err) {
        console.error('Error deleting sample type:', err);
        setError('Failed to delete sample type. Please try again.');
      }
    }
  };

  return (
    <div className="sample-type-management-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faVial} className="me-2" />
          Sample Type Management
        </h1>
        {(user?.role === 'admin' || user?.role === 'hub_admin') && (
          <Button variant="primary" onClick={() => handleShowModal()}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add Sample Type
          </Button>
        )}
      </div>

      {/* Search Card */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Search Sample Types</h6>
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
          <p className="mt-2">Loading sample types...</p>
        </div>
      )}

      {/* Sample Types Table */}
      {!loading && !error && (
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              Sample Types
              <span className="badge bg-primary float-end">
                {filteredSampleTypes.length} Records
              </span>
            </h6>
          </Card.Header>
          <Card.Body>
            {filteredSampleTypes.length === 0 ? (
              <div className="text-center py-4">
                <FontAwesomeIcon icon={faVial} size="3x" className="text-gray-300 mb-3" />
                <p className="text-gray-500">No sample types found.</p>
                {(user?.role === 'admin' || user?.role === 'hub_admin') && (
                  <Button variant="primary" onClick={() => handleShowModal()}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Add First Sample Type
                  </Button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="table-hover" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>Sample Type</th>
                      <th>Code</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSampleTypes.map(sampleType => (
                      <tr key={sampleType.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-sm me-3">
                              <div className="avatar-initial bg-primary rounded-circle">
                                <FontAwesomeIcon icon={faVial} className="text-white" />
                              </div>
                            </div>
                            <div>
                              <div className="fw-bold">{sampleType.type_name}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <code className="bg-light px-2 py-1 rounded">
                            {sampleType.type_code}
                          </code>
                        </td>
                        <td>
                          <div className="text-muted">
                            {sampleType.description || 'No description'}
                          </div>
                        </td>
                        <td>
                          <Badge bg={sampleType.is_active !== false ? 'success' : 'secondary'}>
                            {sampleType.is_active !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          {(user?.role === 'admin' || user?.role === 'hub_admin') && (
                            <>
                              <Button 
                                variant="warning" 
                                size="sm" 
                                className="me-1"
                                onClick={() => handleShowModal(sampleType)}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => handleDelete(sampleType.id)}
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
            {editingSampleType ? 'Edit Sample Type' : 'Add Sample Type'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Sample Type Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="type_name"
                value={formData.type_name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Type Code <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="type_code"
                value={formData.type_code}
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
              {editingSampleType ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default SampleTypeManagement;
