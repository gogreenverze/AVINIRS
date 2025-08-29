import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Button, Form, InputGroup, Badge, Row, Col, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faPlus, faEye, faEdit, faTrash, faFlask,
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

const TestCategoryManagement = () => {
  const { currentUser } = useAuth();
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

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState(null);

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

  // Handle delete confirmation
  const handleDeleteConfirm = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  // Handle delete category
  const handleDelete = async () => {
    try {
      await adminAPI.deleteTestCategory(categoryToDelete.id);
      setCategories(categories.filter(category => category.id !== categoryToDelete.id));
      setShowDeleteModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error deleting test category:', err);
      setErrorMessage('Failed to delete test category. Please try again.');
      setShowDeleteModal(false);
      setShowErrorModal(true);
    }
  };

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value, row) => (
        <div className="d-flex align-items-center">
          <div className="avatar avatar-sm me-3">
            <div className="avatar-initial bg-primary rounded-circle">
              <FontAwesomeIcon icon={faFlask} className="text-white" />
            </div>
          </div>
          <div className="fw-bold">{row.name}</div>
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
      key: 'description',
      label: 'Description',
      render: (value, row) => row.description || 'N/A'
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
    title: (category) => category.name,
    subtitle: (category) => category.code,
    primaryField: 'description',
    statusField: 'is_active'
  };

  // Handle category actions
  const handleViewCategory = (category) => {
    handleShowModal(category);
  };

  const handleEditCategory = (category) => {
    handleShowModal(category);
  };

  return (
    <div className="test-category-management-container">
      <MobilePageHeader
        title="Test Categories"
        subtitle="Manage test categories and classifications"
        icon={faFlask}
        primaryAction={(currentUser?.role === 'admin' || currentUser?.role === 'hub_admin') ? {
          label: "Add New Category",
          shortLabel: "Add Category",
          icon: faPlus,
          onClick: () => handleShowModal(),
          variant: "primary"
        } : null}
        secondaryActions={[
          {
            label: "Export Categories",
            shortLabel: "Export",
            icon: faFileExcel,
            onClick: () => console.log("Export categories"),
            variant: "outline-success"
          },
          {
            label: "Import Categories",
            shortLabel: "Import",
            icon: faFileImport,
            onClick: () => console.log("Import categories"),
            variant: "outline-info"
          }
        ]}
        breadcrumbs={[
          { label: "Admin", shortLabel: "Admin", link: "/admin" },
          { label: "Test Categories", shortLabel: "Categories" }
        ]}
      />

      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
            <h6 className="m-0 font-weight-bold text-primary">
              <FontAwesomeIcon icon={faFlask} className="me-2 d-lg-none" />
              Test Categories ({filteredCategories.length})
            </h6>
            <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-lg-auto">
              <InputGroup style={{ minWidth: '200px' }}>
                <Form.Control
                  type="text"
                  placeholder="Search categories..."
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
              data={filteredCategories}
              columns={columns}
              onEdit={(currentUser?.role === 'admin' || currentUser?.role === 'hub_admin') ? handleEditCategory : null}
              onDelete={(currentUser?.role === 'admin' || currentUser?.role === 'hub_admin') ? handleDeleteConfirm : null}
              onViewDetails={handleViewCategory}
              loading={loading}
              emptyMessage="No test categories found. Click 'Add Category' to create a new category."
              mobileCardConfig={mobileCardConfig}
            />
          )}
        </Card.Body>
      </Card>

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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Test Category"
        message={`Are you sure you want to delete the category "${categoryToDelete?.name}"? This action cannot be undone.`}
      />

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        title="Success"
        message="Test category has been deleted successfully."
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

export default TestCategoryManagement;
