import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, InputGroup, Badge, Row, Col, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faPlus, faEdit, faTrash, faUserTag,
  faSave, faTimes, faShield
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const RoleManagement = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    permission_ids: [],
    is_active: true
  });

  // Fetch roles and permissions on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [rolesResponse, permissionsResponse] = await Promise.all([
          adminAPI.getRoles(),
          adminAPI.getPermissions()
        ]);
        
        setRoles(rolesResponse.data.data || []);
        setPermissions(permissionsResponse.data.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load roles. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter roles based on search query
  const filteredRoles = roles.filter(role => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      role.name?.toLowerCase().includes(query) ||
      role.code?.toLowerCase().includes(query) ||
      role.description?.toLowerCase().includes(query)
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

  // Handle permission selection
  const handlePermissionSelection = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permissionId)
        ? prev.permission_ids.filter(id => id !== permissionId)
        : [...prev.permission_ids, permissionId]
    }));
  };

  // Handle create/edit modal
  const handleShowModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name || '',
        code: role.code || '',
        description: role.description || '',
        permission_ids: role.permission_ids || [],
        is_active: role.is_active !== false
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        permission_ids: [],
        is_active: true
      });
    }
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingRole) {
        await adminAPI.updateRole(editingRole.id, formData);
        setRoles(roles.map(role => 
          role.id === editingRole.id ? { ...role, ...formData } : role
        ));
      } else {
        const response = await adminAPI.createRole(formData);
        setRoles([...roles, response.data]);
      }
      
      setShowModal(false);
      setEditingRole(null);
      setFormData({ name: '', code: '', description: '', permission_ids: [], is_active: true });
    } catch (err) {
      console.error('Error saving role:', err);
      setError(err.response?.data?.message || 'Failed to save role. Please try again.');
    }
  };

  // Handle delete role
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await adminAPI.deleteRole(id);
        setRoles(roles.filter(role => role.id !== id));
      } catch (err) {
        console.error('Error deleting role:', err);
        setError('Failed to delete role. Please try again.');
      }
    }
  };

  // Get role permissions
  const getRolePermissions = (role) => {
    if (!role.permission_ids || !Array.isArray(role.permission_ids)) return [];
    return permissions.filter(permission => role.permission_ids.includes(permission.id));
  };

  return (
    <div className="role-management-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faUserTag} className="me-2" />
          Role Management
        </h1>
        {user?.role === 'admin' && (
          <Button variant="primary" onClick={() => handleShowModal()}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add Role
          </Button>
        )}
      </div>

      {/* Search Card */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Search Roles</h6>
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
          <p className="mt-2">Loading roles...</p>
        </div>
      )}

      {/* Roles Table */}
      {!loading && !error && (
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              System Roles
              <span className="badge bg-primary float-end">
                {filteredRoles.length} Records
              </span>
            </h6>
          </Card.Header>
          <Card.Body>
            {filteredRoles.length === 0 ? (
              <div className="text-center py-4">
                <FontAwesomeIcon icon={faUserTag} size="3x" className="text-gray-300 mb-3" />
                <p className="text-gray-500">No roles found.</p>
                {user?.role === 'admin' && (
                  <Button variant="primary" onClick={() => handleShowModal()}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Add First Role
                  </Button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="table-hover" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Code</th>
                      <th>Permissions</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoles.map(role => (
                      <tr key={role.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-sm me-3">
                              <div className="avatar-initial bg-primary rounded-circle">
                                <FontAwesomeIcon icon={faUserTag} className="text-white" />
                              </div>
                            </div>
                            <div>
                              <div className="fw-bold">{role.name}</div>
                              <div className="text-muted small">
                                {role.description || 'No description'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <code className="bg-light px-2 py-1 rounded">
                            {role.code}
                          </code>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {getRolePermissions(role).slice(0, 3).map(permission => (
                              <Badge key={permission.id} bg="info" className="small">
                                {permission.name}
                              </Badge>
                            ))}
                            {getRolePermissions(role).length > 3 && (
                              <Badge bg="secondary" className="small">
                                +{getRolePermissions(role).length - 3} more
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge bg={role.is_active !== false ? 'success' : 'secondary'}>
                            {role.is_active !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          {user?.role === 'admin' && (
                            <>
                              <Button 
                                variant="warning" 
                                size="sm" 
                                className="me-1"
                                onClick={() => handleShowModal(role)}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => handleDelete(role.id)}
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
            {editingRole ? 'Edit Role' : 'Add Role'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role Name <span className="text-danger">*</span></Form.Label>
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
                  <Form.Label>Role Code <span className="text-danger">*</span></Form.Label>
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
              <Form.Label>Permissions</Form.Label>
              <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {permissions.map(permission => (
                  <Form.Check
                    key={permission.id}
                    type="checkbox"
                    id={`permission-${permission.id}`}
                    label={`${permission.name} - ${permission.description || 'No description'}`}
                    checked={formData.permission_ids.includes(permission.id)}
                    onChange={() => handlePermissionSelection(permission.id)}
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
              {editingRole ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleManagement;
