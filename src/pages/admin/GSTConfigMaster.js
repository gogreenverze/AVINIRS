import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Table, Badge, Alert, Row, Col, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalculator, faPlus, faEdit, faTrash, faCheck, faTimes, faPercent
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import {
  TextInput,
  NumberInput,
  DateInput,
  DeleteConfirmationModal,
  SuccessModal,
  ErrorModal
} from '../../components/common';
import MobilePageHeader from '../../components/common/MobilePageHeader';

const GSTConfigMaster = () => {
  const { currentUser } = useAuth();
  const { tenantData } = useTenant();
  
  // State management
  const [gstConfigs, setGstConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rate: '',
    applicable_from: new Date().toISOString().split('T')[0],
    applicable_to: '',
    is_default: false,
    is_active: true
  });

  // Fetch GST configurations
  useEffect(() => {
    fetchGSTConfigs();
  }, []);

  const fetchGSTConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAPI.getGSTConfig();
      setGstConfigs(response.data || []);
    } catch (err) {
      console.error('Error fetching GST configurations:', err);
      setError('Failed to load GST configurations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Validate form
      if (!formData.name || !formData.rate || !formData.applicable_from) {
        setError('Please fill in all required fields');
        return;
      }

      if (parseFloat(formData.rate) < 0 || parseFloat(formData.rate) > 100) {
        setError('GST rate must be between 0 and 100');
        return;
      }

      const submitData = {
        ...formData,
        rate: parseFloat(formData.rate)
      };

      if (editingConfig) {
        await adminAPI.updateGSTConfig(editingConfig.id, submitData);
      } else {
        await adminAPI.createGSTConfig(submitData);
      }

      setSuccess(true);
      setShowModal(false);
      resetForm();
      fetchGSTConfigs();
    } catch (err) {
      console.error('Error saving GST configuration:', err);
      setError(err.response?.data?.message || 'Failed to save GST configuration');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rate: '',
      applicable_from: new Date().toISOString().split('T')[0],
      applicable_to: '',
      is_default: false,
      is_active: true
    });
    setEditingConfig(null);
  };

  // Handle edit
  const handleEdit = (config) => {
    setFormData({
      name: config.name,
      description: config.description || '',
      rate: config.rate.toString(),
      applicable_from: config.applicable_from,
      applicable_to: config.applicable_to || '',
      is_default: config.is_default,
      is_active: config.is_active
    });
    setEditingConfig(config);
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!configToDelete) return;

    try {
      setLoading(true);
      await adminAPI.deleteGSTConfig(configToDelete.id);
      setSuccess(true);
      setShowDeleteModal(false);
      setConfigToDelete(null);
      fetchGSTConfigs();
    } catch (err) {
      console.error('Error deleting GST configuration:', err);
      setError(err.response?.data?.message || 'Failed to delete GST configuration');
    } finally {
      setLoading(false);
    }
  };

  // Handle add new
  const handleAddNew = () => {
    resetForm();
    setShowModal(true);
  };

  return (
    <div className="gst-config-master-container">
      <MobilePageHeader
        title="GST Configuration Master"
        subtitle="Manage GST rates and calculation rules"
        icon={faCalculator}
        primaryAction={{
          label: "Add GST Config",
          shortLabel: "Add",
          icon: faPlus,
          onClick: handleAddNew,
          variant: "primary"
        }}
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* GST Configurations Table */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
          <h6 className="m-0 font-weight-bold text-primary">
            <FontAwesomeIcon icon={faCalculator} className="me-2" />
            GST Configuration List
          </h6>
          <Button variant="primary" size="sm" onClick={handleAddNew}>
            <FontAwesomeIcon icon={faPlus} className="me-1" />
            Add New
          </Button>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <Table className="table-hover" width="100%" cellSpacing="0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Rate (%)</th>
                    <th>Applicable From</th>
                    <th>Default</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {gstConfigs.map(config => (
                    <tr key={config.id}>
                      <td>
                        <div>
                          <strong>{config.name}</strong>
                          {config.description && (
                            <div className="text-muted small">{config.description}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <Badge bg="info" className="d-flex align-items-center">
                          <FontAwesomeIcon icon={faPercent} className="me-1" />
                          {config.rate}%
                        </Badge>
                      </td>
                      <td>{new Date(config.applicable_from).toLocaleDateString()}</td>
                      <td>
                        {config.is_default ? (
                          <Badge bg="success">
                            <FontAwesomeIcon icon={faCheck} className="me-1" />
                            Default
                          </Badge>
                        ) : (
                          <Badge bg="secondary">-</Badge>
                        )}
                      </td>
                      <td>
                        <Badge bg={config.is_active ? 'success' : 'danger'}>
                          {config.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEdit(config)}
                            title="Edit"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              setConfigToDelete(config);
                              setShowDeleteModal(true);
                            }}
                            title="Delete"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {gstConfigs.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        No GST configurations found. Click "Add New" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faCalculator} className="me-2" />
            {editingConfig ? 'Edit GST Configuration' : 'Add GST Configuration'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <TextInput
                  label="Configuration Name"
                  value={formData.name}
                  onChange={(value) => handleInputChange('name', value)}
                  required
                  placeholder="e.g., Standard GST Rate"
                />
              </Col>
              <Col md={6}>
                <NumberInput
                  label="GST Rate (%)"
                  value={formData.rate}
                  onChange={(value) => handleInputChange('rate', value)}
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="18.00"
                />
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <TextInput
                  label="Description"
                  value={formData.description}
                  onChange={(value) => handleInputChange('description', value)}
                  placeholder="Optional description for this GST configuration"
                />
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <DateInput
                  label="Applicable From"
                  value={formData.applicable_from}
                  onChange={(value) => handleInputChange('applicable_from', value)}
                  required
                />
              </Col>
              <Col md={6}>
                <DateInput
                  label="Applicable To (Optional)"
                  value={formData.applicable_to}
                  onChange={(value) => handleInputChange('applicable_to', value)}
                />
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Check
                  type="checkbox"
                  label="Set as Default GST Rate"
                  checked={formData.is_default}
                  onChange={(e) => handleInputChange('is_default', e.target.checked)}
                />
              </Col>
              <Col md={6}>
                <Form.Check
                  type="checkbox"
                  label="Active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : (editingConfig ? 'Update' : 'Create')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete GST Configuration"
        message={`Are you sure you want to delete the GST configuration "${configToDelete?.name}"? This action cannot be undone.`}
        loading={loading}
      />

      {/* Success Modal */}
      <SuccessModal
        show={success}
        onHide={() => setSuccess(false)}
        title="Success"
        message="GST configuration saved successfully!"
      />

      {/* Error Modal */}
      <ErrorModal
        show={!!error}
        onHide={() => setError(null)}
        title="Error"
        message={error}
      />
    </div>
  );
};

export default GSTConfigMaster;
