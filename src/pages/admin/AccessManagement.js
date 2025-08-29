import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Form, Table, Badge, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldAlt, faUsers, faCog, faEdit, faSave, faTimes, faCheck,
  faBuilding, faKey, faLock, faUnlock
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';

const AccessManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [franchises, setFranchises] = useState([]);
  const [modules, setModules] = useState([]);
  const [editingFranchise, setEditingFranchise] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Bulk operations state
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [selectedFranchises, setSelectedFranchises] = useState([]);
  const [bulkPermissions, setBulkPermissions] = useState([]);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load modules and franchises with permissions
      const [modulesResponse, franchisesResponse] = await Promise.all([
        adminAPI.getModules(),
        adminAPI.getFranchisesWithPermissions()
      ]);

      setModules(modulesResponse.data.data);
      setFranchises(franchisesResponse.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load access management data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPermissions = (franchise) => {
    setEditingFranchise(franchise.franchise.id);
    setSelectedPermissions(franchise.permissions?.module_permissions || []);
  };

  const handleCancelEdit = () => {
    setEditingFranchise(null);
    setSelectedPermissions([]);
  };

  const handlePermissionChange = (moduleId, checked) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, moduleId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== moduleId));
    }
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      setError(null);

      await adminAPI.updateFranchisePermissions(editingFranchise, {
        module_permissions: selectedPermissions
      });

      setSuccess('Franchise permissions updated successfully');
      setEditingFranchise(null);
      setSelectedPermissions([]);
      
      // Reload data to reflect changes
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const getModulesByCategory = () => {
    const categories = {};
    modules.forEach(module => {
      if (!categories[module.category]) {
        categories[module.category] = [];
      }
      categories[module.category].push(module);
    });
    return categories;
  };

  const getCategoryDisplayName = (category) => {
    const categoryNames = {
      'main': 'Main',
      'pre_analytical': 'Pre-Analytical',
      'analytical': 'Analytical',
      'post_analytical': 'Post-Analytical',
      'management': 'Management',
      'administration': 'Administration'
    };
    return categoryNames[category] || category;
  };

  // Bulk operations functions
  const handleFranchiseSelection = (franchiseId, checked) => {
    if (checked) {
      setSelectedFranchises(prev => [...prev, franchiseId]);
    } else {
      setSelectedFranchises(prev => prev.filter(id => id !== franchiseId));
    }
  };

  const handleSelectAllFranchises = (checked) => {
    if (checked) {
      setSelectedFranchises(franchises.map(f => f.franchise.id));
    } else {
      setSelectedFranchises([]);
    }
  };

  const handleBulkPermissionChange = (moduleId, checked) => {
    if (checked) {
      setBulkPermissions(prev => [...prev, moduleId]);
    } else {
      setBulkPermissions(prev => prev.filter(id => id !== moduleId));
    }
  };

  const handleBulkSave = async () => {
    if (selectedFranchises.length === 0) {
      setError('Please select at least one franchise');
      return;
    }

    try {
      setBulkSaving(true);
      setError(null);

      // Apply permissions to all selected franchises
      const promises = selectedFranchises.map(franchiseId =>
        adminAPI.updateFranchisePermissions(franchiseId, {
          module_permissions: bulkPermissions
        })
      );

      await Promise.all(promises);

      setSuccess(`Permissions updated for ${selectedFranchises.length} franchise(s)`);
      setShowBulkOperations(false);
      setSelectedFranchises([]);
      setBulkPermissions([]);

      // Reload data to reflect changes
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update bulk permissions');
    } finally {
      setBulkSaving(false);
    }
  };

  const handleCancelBulkOperations = () => {
    setShowBulkOperations(false);
    setSelectedFranchises([]);
    setBulkPermissions([]);
  };

  if (loading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading access management...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center mb-3">
            <FontAwesomeIcon icon={faShieldAlt} className="me-2 text-primary" size="lg" />
            <h2 className="mb-0">Access Management</h2>
          </div>
          <p className="text-muted">
            Manage module access permissions for franchises. Only Hub Admin can modify these settings.
          </p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <FontAwesomeIcon icon={faTimes} className="me-2" />
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          <FontAwesomeIcon icon={faCheck} className="me-2" />
          {success}
        </Alert>
      )}

      {/* Bulk Operations */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-secondary text-white d-flex justify-content-between align-items-center">
              <span>
                <FontAwesomeIcon icon={faUsers} className="me-2" />
                Bulk Operations
              </span>
              <Button
                variant="outline-light"
                size="sm"
                onClick={() => setShowBulkOperations(!showBulkOperations)}
              >
                {showBulkOperations ? 'Hide' : 'Show'} Bulk Operations
              </Button>
            </Card.Header>
            {showBulkOperations && (
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <h6>Select Franchises</h6>
                    <Form.Check
                      type="checkbox"
                      label="Select All"
                      checked={selectedFranchises.length === franchises.length && franchises.length > 0}
                      onChange={(e) => handleSelectAllFranchises(e.target.checked)}
                      className="mb-2"
                    />
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {franchises.map((franchise) => (
                        <Form.Check
                          key={franchise.franchise.id}
                          type="checkbox"
                          label={`${franchise.franchise.name} (${franchise.franchise.site_code})`}
                          checked={selectedFranchises.includes(franchise.franchise.id)}
                          onChange={(e) => handleFranchiseSelection(franchise.franchise.id, e.target.checked)}
                          className="mb-1"
                        />
                      ))}
                    </div>
                  </Col>
                  <Col md={8}>
                    <h6>Select Permissions to Apply</h6>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {Object.entries(getModulesByCategory()).map(([category, categoryModules]) => (
                        <div key={category} className="mb-3">
                          <h6 className="text-primary mb-2">
                            {getCategoryDisplayName(category)}
                          </h6>
                          <Row>
                            {categoryModules.map((module) => (
                              <Col md={6} key={module.id} className="mb-2">
                                <Form.Check
                                  type="checkbox"
                                  id={`bulk-module-${module.id}`}
                                  label={module.name}
                                  checked={bulkPermissions.includes(module.id)}
                                  onChange={(e) => handleBulkPermissionChange(module.id, e.target.checked)}
                                />
                              </Col>
                            ))}
                          </Row>
                        </div>
                      ))}
                    </div>
                  </Col>
                </Row>
                <hr />
                <div className="d-flex justify-content-end">
                  <Button
                    variant="secondary"
                    className="me-2"
                    onClick={handleCancelBulkOperations}
                    disabled={bulkSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleBulkSave}
                    disabled={bulkSaving || selectedFranchises.length === 0}
                  >
                    {bulkSaving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Applying...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} className="me-1" />
                        Apply to {selectedFranchises.length} Franchise(s)
                      </>
                    )}
                  </Button>
                </div>
              </Card.Body>
            )}
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <FontAwesomeIcon icon={faBuilding} className="me-2" />
              Franchise Access Permissions
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Franchise</th>
                      <th>Site Code</th>
                      <th>Assigned Modules</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {franchises.map((franchise) => (
                      <tr key={franchise.franchise.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <FontAwesomeIcon 
                              icon={franchise.franchise.is_hub ? faKey : faBuilding} 
                              className={`me-2 ${franchise.franchise.is_hub ? 'text-warning' : 'text-info'}`} 
                            />
                            <div>
                              <strong>{franchise.franchise.name}</strong>
                              {franchise.franchise.is_hub && (
                                <Badge bg="warning" className="ms-2">Hub</Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge bg="secondary">{franchise.franchise.site_code}</Badge>
                        </td>
                        <td>
                          {editingFranchise === franchise.franchise.id ? (
                            <div>
                              {Object.entries(getModulesByCategory()).map(([category, categoryModules]) => (
                                <div key={category} className="mb-3">
                                  <h6 className="text-primary mb-2">
                                    {getCategoryDisplayName(category)}
                                  </h6>
                                  <Row>
                                    {categoryModules.map((module) => (
                                      <Col md={6} key={module.id} className="mb-2">
                                        <Form.Check
                                          type="checkbox"
                                          id={`module-${module.id}`}
                                          label={module.name}
                                          checked={selectedPermissions.includes(module.id)}
                                          onChange={(e) => handlePermissionChange(module.id, e.target.checked)}
                                        />
                                      </Col>
                                    ))}
                                  </Row>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div>
                              {franchise.assigned_modules.length > 0 ? (
                                franchise.assigned_modules.map((module) => (
                                  <Badge key={module.id} bg="info" className="me-1 mb-1">
                                    {module.name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted">No modules assigned</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          {editingFranchise === franchise.franchise.id ? (
                            <div>
                              <Button
                                variant="success"
                                size="sm"
                                className="me-2"
                                onClick={handleSavePermissions}
                                disabled={saving}
                              >
                                <FontAwesomeIcon icon={faSave} className="me-1" />
                                {saving ? 'Saving...' : 'Save'}
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleCancelEdit}
                                disabled={saving}
                              >
                                <FontAwesomeIcon icon={faTimes} className="me-1" />
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleEditPermissions(franchise)}
                              disabled={editingFranchise !== null}
                            >
                              <FontAwesomeIcon icon={faEdit} className="me-1" />
                              Edit Permissions
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AccessManagement;
