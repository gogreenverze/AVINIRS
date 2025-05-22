import React, { useState, useEffect } from 'react';
import { Card, Button, Form, InputGroup, Table, Badge, Tabs, Tab, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDatabase, faPlus, faEdit, faTrash, faSearch,
  faFlask, faVial, faFileInvoiceDollar, faUserMd
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import {
  TextInput,
  NumberInput,
  DeleteConfirmationModal,
  SuccessModal,
  ErrorModal,
  FormModal
} from '../../components/common';
import '../../styles/MasterData.css';

const MasterData = () => {
  // State for master data
  const [masterData, setMasterData] = useState({
    testCategories: [],
    testParameters: [],
    sampleTypes: [],
    departments: [],
    paymentMethods: []
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('testCategories');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToEdit, setItemToEdit] = useState(null);

  // Form state
  const [formData, setFormData] = useState({});

  // Fetch master data
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await adminAPI.getMasterData();
        setMasterData(response.data);
      } catch (err) {
        console.error('Error fetching master data:', err);
        setError('Failed to load master data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMasterData();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await adminAPI.deleteMasterDataItem(activeTab, itemToDelete.id);

      setMasterData(prevData => ({
        ...prevData,
        [activeTab]: (prevData[activeTab] || []).filter(item => item.id !== itemToDelete.id)
      }));

      setShowDeleteModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error deleting item:', err);
      setErrorMessage('Failed to delete item. Please try again.');
      setShowDeleteModal(false);
      setShowErrorModal(true);
    }
  };

  // Handle add button click
  const handleAddClick = () => {
    // Initialize form data based on active tab
    switch (activeTab) {
      case 'testCategories':
        setFormData({
          name: '',
          description: '',
          is_active: true
        });
        break;
      case 'testParameters':
        setFormData({
          name: '',
          unit: '',
          reference_range: '',
          category_id: '',
          is_active: true
        });
        break;
      case 'sampleTypes':
        setFormData({
          name: '',
          description: '',
          storage_instructions: '',
          validity_days: 7,
          is_active: true
        });
        break;
      case 'departments':
        setFormData({
          name: '',
          description: '',
          is_active: true
        });
        break;
      case 'paymentMethods':
        setFormData({
          name: '',
          description: '',
          is_online: false,
          is_active: true
        });
        break;
      default:
        setFormData({});
    }

    setShowAddModal(true);
  };

  // Handle edit button click
  const handleEditClick = (item) => {
    setItemToEdit(item);
    setFormData(item);
    setShowEditModal(true);
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle add form submission
  const handleAddSubmit = async () => {
    try {
      const response = await adminAPI.addMasterDataItem(activeTab, formData);

      setMasterData(prevData => ({
        ...prevData,
        [activeTab]: [...(prevData[activeTab] || []), response.data]
      }));

      setShowAddModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error adding item:', err);
      setErrorMessage('Failed to add item. Please try again.');
      setShowErrorModal(true);
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async () => {
    try {
      const response = await adminAPI.updateMasterDataItem(activeTab, itemToEdit.id, formData);

      setMasterData(prevData => ({
        ...prevData,
        [activeTab]: (prevData[activeTab] || []).map(item =>
          item.id === itemToEdit.id ? response.data : item
        )
      }));

      setShowEditModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error updating item:', err);
      setErrorMessage('Failed to update item. Please try again.');
      setShowErrorModal(true);
    }
  };

  // Filter data based on search query
  const getFilteredData = () => {
    const data = masterData[activeTab] || [];

    if (!searchQuery) {
      return data;
    }

    return data.filter(item =>
      (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };



  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading master data...</p>
      </div>
    );
  }

  return (
    <div className="master-data-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faDatabase} className="me-2" />
          Master Data Management
        </h1>
        <Button variant="primary" onClick={handleAddClick}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Add New
        </Button>
      </div>

      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <Tabs
            activeKey={activeTab}
            onSelect={handleTabChange}
            className="mb-0"
          >
            <Tab
              eventKey="testCategories"
              title={<><FontAwesomeIcon icon={faFlask} className="me-2" />Test Categories</>}
            />
            <Tab
              eventKey="testParameters"
              title={<><FontAwesomeIcon icon={faVial} className="me-2" />Test Parameters</>}
            />
            <Tab
              eventKey="sampleTypes"
              title={<><FontAwesomeIcon icon={faVial} className="me-2" />Sample Types</>}
            />
            <Tab
              eventKey="departments"
              title={<><FontAwesomeIcon icon={faUserMd} className="me-2" />Departments</>}
            />
            <Tab
              eventKey="paymentMethods"
              title={<><FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />Payment Methods</>}
            />
          </Tabs>
        </Card.Header>
        <div className="card-header-search py-2 px-3 border-bottom">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearch}
            />
            <Button variant="outline-secondary">
              <FontAwesomeIcon icon={faSearch} />
            </Button>
          </InputGroup>
        </div>
        <Card.Body>
          {error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <div className="table-responsive">
              {activeTab === 'testCategories' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(category => (
                      <tr key={category.id}>
                        <td>{category.name}</td>
                        <td>{category.description}</td>
                        <td>
                          <Badge bg={category.is_active ? 'success' : 'danger'}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(category)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(category)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'testParameters' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Unit</th>
                      <th>Reference Range</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(parameter => (
                      <tr key={parameter.id}>
                        <td>{parameter.name}</td>
                        <td>{parameter.unit}</td>
                        <td>{parameter.reference_range}</td>
                        <td>
                          {(masterData.testCategories || []).find(c => c.id === parameter.category_id)?.name || 'N/A'}
                        </td>
                        <td>
                          <Badge bg={parameter.is_active ? 'success' : 'danger'}>
                            {parameter.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(parameter)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(parameter)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'sampleTypes' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Validity (Days)</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(sampleType => (
                      <tr key={sampleType.id}>
                        <td>{sampleType.name}</td>
                        <td>{sampleType.description}</td>
                        <td>{sampleType.validity_days}</td>
                        <td>
                          <Badge bg={sampleType.is_active ? 'success' : 'danger'}>
                            {sampleType.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(sampleType)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(sampleType)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'departments' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(department => (
                      <tr key={department.id}>
                        <td>{department.name}</td>
                        <td>{department.description}</td>
                        <td>
                          <Badge bg={department.is_active ? 'success' : 'danger'}>
                            {department.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(department)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(department)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {activeTab === 'paymentMethods' && (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(method => (
                      <tr key={method.id}>
                        <td>{method.name}</td>
                        <td>{method.description}</td>
                        <td>
                          <Badge bg={method.is_online ? 'info' : 'secondary'}>
                            {method.is_online ? 'Online' : 'Offline'}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={method.is_active ? 'success' : 'danger'}>
                            {method.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(method)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(method)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {getFilteredData().length === 0 && (
                <Alert variant="info">No items found.</Alert>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
      />

      {/* Add Modal */}
      <FormModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSubmit={handleAddSubmit}
        title={`Add New ${activeTab === 'testCategories' ? 'Test Category' :
                activeTab === 'testParameters' ? 'Test Parameter' :
                activeTab === 'sampleTypes' ? 'Sample Type' :
                activeTab === 'departments' ? 'Department' :
                'Payment Method'}`}
        submitText="Add"
      >
        {activeTab === 'testCategories' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={3}
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'testParameters' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="unit"
              label="Unit"
              value={formData.unit}
              onChange={handleChange}
            />
            <TextInput
              name="reference_range"
              label="Reference Range"
              value={formData.reference_range}
              onChange={handleChange}
              placeholder="e.g., 70-100 mg/dL"
            />
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {(masterData.testCategories || []).map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'sampleTypes' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <TextInput
              name="storage_instructions"
              label="Storage Instructions"
              value={formData.storage_instructions}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <NumberInput
              name="validity_days"
              label="Validity (Days)"
              value={formData.validity_days}
              onChange={handleChange}
              min={1}
              required
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'departments' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={3}
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'paymentMethods' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={3}
            />
            <Form.Check
              type="switch"
              id="is_online"
              name="is_online"
              label="Online Payment Method"
              checked={formData.is_online}
              onChange={handleChange}
            />
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        title={`Edit ${activeTab === 'testCategories' ? 'Test Category' :
                activeTab === 'testParameters' ? 'Test Parameter' :
                activeTab === 'sampleTypes' ? 'Sample Type' :
                activeTab === 'departments' ? 'Department' :
                'Payment Method'}`}
        submitText="Save Changes"
      >
        {activeTab === 'testCategories' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={3}
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'testParameters' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="unit"
              label="Unit"
              value={formData.unit}
              onChange={handleChange}
            />
            <TextInput
              name="reference_range"
              label="Reference Range"
              value={formData.reference_range}
              onChange={handleChange}
              placeholder="e.g., 70-100 mg/dL"
            />
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {(masterData.testCategories || []).map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'sampleTypes' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <TextInput
              name="storage_instructions"
              label="Storage Instructions"
              value={formData.storage_instructions}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <NumberInput
              name="validity_days"
              label="Validity (Days)"
              value={formData.validity_days}
              onChange={handleChange}
              min={1}
              required
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'departments' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={3}
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}

        {activeTab === 'paymentMethods' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={3}
            />
            <Form.Check
              type="switch"
              id="is_online_edit"
              name="is_online"
              label="Online Payment Method"
              checked={formData.is_online}
              onChange={handleChange}
            />
            <Form.Check
              type="switch"
              id="is_active_edit"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </>
        )}
      </FormModal>

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        title="Success"
        message="Operation completed successfully."
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

export default MasterData;
