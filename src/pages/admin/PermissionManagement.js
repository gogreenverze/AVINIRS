import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, InputGroup, Badge, Row, Col, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faPlus, faEdit, faTrash, faShield,
  faSave, faTimes
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PermissionManagement = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    module: '',
    is_active: true
  });

  // Fetch permissions on component mount
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await adminAPI.getPermissions();
        setPermissions(response.data.data || []);
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError('Failed to load permissions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  // Filter permissions based on search query
  const filteredPermissions = permissions.filter(permission => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      permission.name?.toLowerCase().includes(query) ||
      permission.code?.toLowerCase().includes(query) ||
      permission.description?.toLowerCase().includes(query) ||
      permission.module?.toLowerCase().includes(query)
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
  const handleShowModal = (permission = null) => {
    if (permission) {
      setEditingPermission(permission);
      setFormData({
        name: permission.name || '',
        code: permission.code || '',
        description: permission.description || '',
        module: permission.module || '',
        is_active: permission.is_active !== false
      });
    } else {
      setEditingPermission(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        module: '',
        is_active: true
      });
    }
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPermission) {
        await adminAPI.updatePermission(editingPermission.id, formData);
        setPermissions(permissions.map(permission => 
          permission.id === editingPermission.id ? { ...permission, ...formData } : permission
        ));
      } else {
        const response = await adminAPI.createPermission(formData);
        setPermissions([...permissions, response.data]);
      }
      
      setShowModal(false);
      setEditingPermission(null);
      setFormData({ name: '', code: '', description: '', module: '', is_active: true });
    } catch (err) {
      console.error('Error saving permission:', err);
      setError(err.response?.data?.message || 'Failed to save permission. Please try again.');
    }
  };

  // Handle delete permission
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this permission?')) {
      try {
        await adminAPI.deletePermission(id);
        setPermissions(permissions.filter(permission => permission.id !== id));
      } catch (err) {
        console.error('Error deleting permission:', err);
        setError('Failed to delete permission. Please try again.');
      }
    }
  };

  // Get module badge color
  const getModuleBadgeColor = (module) => {
    const colorMap = {
      'patients': 'primary',
      'samples': 'info',
      'results': 'success',
      'billing': 'warning',
      'inventory': 'secondary',
      'admin': 'danger',
      'reports': 'dark'
    };
    
    return colorMap[module?.toLowerCase()] || 'light';
  };

  return (
    <div className="permission-management-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faShield} className="me-2" />
          Permission Management
        </h1>
        {user?.role === 'admin' && (
          <Button variant="primary" onClick={() => handleShowModal()}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add Permission
          </Button>
        )}
      </div>

      {/* Search Card */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Search Permissions</h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search by name, code, description, or module..."
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
          <p className="mt-2">Loading permissions...</p>
        </div>
      )}

      {/* Permissions Table */}
      {!loading && !error && (
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              System Permissions
              <span className="badge bg-primary float-end">
                {filteredPermissions.length} Records
              </span>
            </h6>
          </Card.Header>
          <Card.Body>
            {filteredPermissions.length === 0 ? (
              <div className="text-center py-4">
                <FontAwesomeIcon icon={faShield} size="3x" className="text-gray-300 mb-3" />
                <p className="text-gray-500">No permissions found.</p>
                {user?.role === 'admin' && (
                  <Button variant="primary" onClick={() => handleShowModal()}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Add First Permission
                  </Button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="table-hover" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>Permission</th>
                      <th>Code</th>
                      <th>Module</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPermissions.map(permission => (
                      <tr key={permission.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-sm me-3">
                              <div className="avatar-initial bg-primary rounded-circle">
                                <FontAwesomeIcon icon={faShield} className="text-white" />
                              </div>
                            </div>
                            <div>
                              <div className="fw-bold">{permission.name}</div>
                              <div className="text-muted small">
                                {permission.description || 'No description'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <code className="bg-light px-2 py-1 rounded">
                            {permission.code}
                          </code>
                        </td>
                        <td>
                          <Badge bg={getModuleBadgeColor(permission.module)}>
                            {permission.module || 'General'}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={permission.is_active !== false ? 'success' : 'secondary'}>
                            {permission.is_active !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          {user?.role === 'admin' && (
                            <>
                              <Button 
                                variant="warning" 
                                size="sm" 
                                className="me-1"
                                onClick={() => handleShowModal(permission)}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => handleDelete(permission.id)}
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
            {editingPermission ? 'Edit Permission' : 'Add Permission'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Permission Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Permission Code <span className="text-danger">*</span></Form.Label>
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
            
            <Form.Group className="mb-3">
              <Form.Label>Module</Form.Label>
              <Form.Select
                name="module"
                value={formData.module}
                onChange={handleInputChange}
              >
                <option value="">Select module...</option>
                <option value="patients">Patients</option>
                <option value="samples">Samples</option>
                <option value="results">Results</option>
                <option value="billing">Billing</option>
                <option value="inventory">Inventory</option>
                <option value="admin">Admin</option>
                <option value="reports">Reports</option>
              </Form.Select>
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
              {editingPermission ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default PermissionManagement;
