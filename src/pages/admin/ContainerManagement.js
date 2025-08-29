import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, InputGroup, Badge, Row, Col, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faPlus, faEdit, faTrash, faVial,
  faSave, faTimes, faFileExcel, faFileImport
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ResponsiveDataTable from '../../components/admin/ResponsiveDataTable';
import MobilePageHeader from '../../components/common/MobilePageHeader';
import {
  DeleteConfirmationModal,
  SuccessModal,
  ErrorModal
} from '../../components/common';

const ContainerManagement = () => {
  const { currentUser } = useAuth();
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

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [containerToDelete, setContainerToDelete] = useState(null);

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

  // Handle delete confirmation
  const handleDeleteConfirm = (container) => {
    setContainerToDelete(container);
    setShowDeleteModal(true);
  };

  // Handle delete container
  const handleDelete = async () => {
    try {
      await adminAPI.deleteContainer(containerToDelete.id);
      setContainers(containers.filter(container => container.id !== containerToDelete.id));
      setShowDeleteModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error deleting container:', err);
      setErrorMessage('Failed to delete container. Please try again.');
      setShowDeleteModal(false);
      setShowErrorModal(true);
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

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      label: 'Container',
      render: (value, row) => (
        <div className="d-flex align-items-center">
          <div className="avatar avatar-sm me-3">
            <div className="avatar-initial bg-primary rounded-circle">
              <FontAwesomeIcon icon={faVial} className="text-white" />
            </div>
          </div>
          <div>
            <div className="fw-bold">{row.name}</div>
            <div className="text-muted small">
              {row.description || 'No description'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'code',
      label: 'Code',
      render: (value, row) => (
        <code className="bg-light px-2 py-1 rounded text-primary">
          {row.code}
        </code>
      )
    },
    {
      key: 'volume',
      label: 'Volume',
      render: (value, row) => row.volume || 'N/A'
    },
    {
      key: 'color',
      label: 'Color',
      render: (value, row) => (
        <Badge style={getColorBadgeStyle(row.color)}>
          {row.color || 'Unknown'}
        </Badge>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value, row) => (
        <Badge bg={row.is_active !== false ? 'success' : 'secondary'}>
          {row.is_active !== false ? 'Active' : 'Inactive'}
        </Badge>
      )
    }
  ];

  // Mobile card configuration
  const mobileCardConfig = {
    title: (container) => container.name,
    subtitle: (container) => `${container.code} • ${container.color || 'Unknown'}`,
    primaryField: 'volume',
    secondaryField: 'description',
    statusField: 'is_active'
  };

  // Handle container actions
  const handleViewContainer = (container) => {
    handleShowModal(container);
  };

  const handleEditContainer = (container) => {
    handleShowModal(container);
  };

  return (
    <div className="container-management-container">
      <MobilePageHeader
        title="Container Management"
        subtitle="Manage sample containers and collection tubes"
        icon={faVial}
        primaryAction={(currentUser?.role === 'admin' || currentUser?.role === 'hub_admin') ? {
          label: "Add New Container",
          shortLabel: "Add Container",
          icon: faPlus,
          onClick: () => handleShowModal(),
          variant: "primary"
        } : null}
        secondaryActions={[
          {
            label: "Export Containers",
            shortLabel: "Export",
            icon: faFileExcel,
            onClick: () => console.log("Export containers"),
            variant: "outline-success"
          },
          {
            label: "Import Containers",
            shortLabel: "Import",
            icon: faFileImport,
            onClick: () => console.log("Import containers"),
            variant: "outline-info"
          }
        ]}
        breadcrumbs={[
          { label: "Admin", shortLabel: "Admin", link: "/admin" },
          { label: "Container Management", shortLabel: "Containers" }
        ]}
      />

      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
            <h6 className="m-0 font-weight-bold text-primary">
              <FontAwesomeIcon icon={faVial} className="me-2 d-lg-none" />
              Sample Containers ({filteredContainers.length})
            </h6>
            <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-lg-auto">
              <InputGroup style={{ minWidth: '200px' }}>
                <Form.Control
                  type="text"
                  placeholder="Search containers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button variant="outline-secondary">
                  <FontAwesomeIcon icon={faSearch} />
                </Button>
              </InputGroup>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {error ? (
            <div className="alert alert-danger m-3" role="alert">
              {error}
            </div>
          ) : (
            <ResponsiveDataTable
              data={filteredContainers}
              columns={columns}
              onEdit={(currentUser?.role === 'admin' || currentUser?.role === 'hub_admin') ? handleEditContainer : null}
              onDelete={(currentUser?.role === 'admin' || currentUser?.role === 'hub_admin') ? handleDeleteConfirm : null}
              onViewDetails={handleViewContainer}
              loading={loading}
              emptyMessage="No containers found. Click 'Add Container' to create a new container."
              mobileCardConfig={mobileCardConfig}
            />
          )}
        </Card.Body>
      </Card>

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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Container"
        message={`Are you sure you want to delete the container "${containerToDelete?.name}"? This action cannot be undone.`}
      />

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        title="Success"
        message="Container has been deleted successfully."
      />

      {/* Error Modal */}
      <ErrorModal
        show={showErrorModal}
        onHide={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
      />
    </div>
  );
};

export default ContainerManagement;
