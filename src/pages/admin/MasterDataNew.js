import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Form, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDatabase, faSearch, faPlus, faFileExcel, faFileImport, faDownload,
  faArrowLeft, faGrid3x3, faList
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import MasterDataCard from '../../components/admin/MasterDataCard';
import MasterDataDetailView from '../../components/admin/MasterDataDetailView';
import {
  DeleteConfirmationModal,
  SuccessModal,
  ErrorModal,
  FormModal
} from '../../components/common';
import ExcelImportExport from '../../components/admin/ExcelImportExport';
import BulkDataImport from '../../components/admin/BulkDataImport';
import '../../styles/MasterData.css';

const MasterDataNew = () => {
  // State management
  const [masterData, setMasterData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'detail'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);
  const [formData, setFormData] = useState({});

  // Master data categories configuration
  const masterDataCategories = [
    { key: 'testCategories', title: 'Test Categories', description: 'Manage laboratory test categories' },
    { key: 'testParameters', title: 'Test Parameters', description: 'Configure test parameters and units' },
    { key: 'sampleTypes', title: 'Sample Types', description: 'Define sample collection types' },
    { key: 'departments', title: 'Departments', description: 'Laboratory departments and profiles' },
    { key: 'paymentMethods', title: 'Payment Methods', description: 'Configure payment options' },
    { key: 'containers', title: 'Containers', description: 'Sample collection containers' },
    { key: 'instruments', title: 'Instruments', description: 'Laboratory equipment management' },
    { key: 'reagents', title: 'Reagents', description: 'Chemical reagents and supplies' },
    { key: 'suppliers', title: 'Suppliers', description: 'Vendor and supplier information' },
    { key: 'units', title: 'Units', description: 'Measurement units configuration' },
    { key: 'testMethods', title: 'Test Methods', description: 'Laboratory testing methodologies' },
    { key: 'patients', title: 'Patients', description: 'Patient master data' },
    { key: 'profileMaster', title: 'Profile Master', description: 'Test profile configurations' },
    { key: 'methodMaster', title: 'Method Master', description: 'Testing method definitions' },
    { key: 'antibioticMaster', title: 'Antibiotic Master', description: 'Antibiotic database' },
    { key: 'organismMaster', title: 'Organism Master', description: 'Microbiology organisms' },
    { key: 'unitOfMeasurement', title: 'Unit of Measurement', description: 'Measurement unit standards' },
    { key: 'specimenMaster', title: 'Specimen Master', description: 'Specimen type definitions' },
    { key: 'organismVsAntibiotic', title: 'Organism vs Antibiotic', description: 'Antibiotic sensitivity mapping' },
    { key: 'containerMaster', title: 'Container Master', description: 'Container specifications' },
    { key: 'mainDepartmentMaster', title: 'Main Department Master', description: 'Primary department structure' },
    { key: 'departmentSettings', title: 'Department Settings', description: 'Department configuration' },
    { key: 'authorizationSettings', title: 'Authorization Settings', description: 'Access control settings' },
    { key: 'printOrder', title: 'Print Order', description: 'Report printing configuration' },
    { key: 'testMaster', title: 'Test Master', description: 'Comprehensive test definitions' },
    { key: 'subTestMaster', title: 'Sub Test Master', description: 'Sub-test configurations' },
    { key: 'departmentMaster', title: 'Department Master', description: 'Complete department management' }
  ];

  // Fetch master data
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminAPI.getMasterData();
        console.log('Master Data Response:', response.data);
        setMasterData(response.data || {});
      } catch (err) {
        console.error('Error fetching master data:', err);
        setError('Failed to load master data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMasterData();
  }, []);

  // Filter categories based on search
  const filteredCategories = masterDataCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle view details
  const handleViewDetails = (categoryKey) => {
    setSelectedCategory(categoryKey);
    setViewMode('detail');
  };

  // Handle back to cards view
  const handleBackToCards = () => {
    setViewMode('cards');
    setSelectedCategory(null);
  };

  // Handle add new
  const handleAddNew = (categoryKey) => {
    setSelectedCategory(categoryKey);
    setFormData({});
    setShowAddModal(true);
  };

  // Handle edit
  const handleEdit = (item) => {
    setFormData(item);
    setShowAddModal(true);
  };

  // Handle delete
  const handleDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  // Get column configuration for a category
  const getColumnConfig = (categoryKey) => {
    const configs = {
      testCategories: [
        { key: 'name', label: 'Name', minWidth: '150px' },
        { key: 'description', label: 'Description', minWidth: '200px' },
        { key: 'is_active', label: 'Status', type: 'boolean', minWidth: '100px' }
      ],
      departments: [
        { key: 'code', label: 'Code', type: 'code', minWidth: '100px' },
        { key: 'department', label: 'Department Name', minWidth: '150px' },
        { key: 'test_profile', label: 'Test Profile', minWidth: '150px' },
        { key: 'test_price', label: 'Test Price', type: 'currency', minWidth: '120px' },
        { key: 'is_active', label: 'Status', type: 'boolean', minWidth: '100px' }
      ],
      paymentMethods: [
        { key: 'name', label: 'Name', minWidth: '150px' },
        { key: 'description', label: 'Description', minWidth: '200px' },
        { key: 'is_online', label: 'Type', type: 'boolean', minWidth: '100px' },
        { key: 'is_active', label: 'Status', type: 'boolean', minWidth: '100px' }
      ]
      // Add more configurations as needed
    };

    return configs[categoryKey] || [
      { key: 'name', label: 'Name', minWidth: '150px' },
      { key: 'description', label: 'Description', minWidth: '200px' },
      { key: 'is_active', label: 'Status', type: 'boolean', minWidth: '100px' }
    ];
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading master data...</p>
      </div>
    );
  }

  return (
    <div className="master-data-container">
      {/* Header */}
      <Card className="mb-3">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
            <div className="d-flex align-items-center flex-grow-1">
              {viewMode === 'detail' && (
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={handleBackToCards}
                  className="me-2 me-md-3"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                </Button>
              )}
              <div className="flex-grow-1">
                <h4 className="mb-1 fs-5 fs-md-4">
                  <FontAwesomeIcon icon={faDatabase} className="me-2" />
                  <span className="d-none d-sm-inline">Master Data Management</span>
                  <span className="d-inline d-sm-none">Master Data</span>
                </h4>
                <small className="opacity-75 d-block">
                  {viewMode === 'cards'
                    ? `${filteredCategories.length} categories available`
                    : `Viewing ${masterDataCategories.find(c => c.key === selectedCategory)?.title || 'Category'}`
                  }
                </small>
              </div>
            </div>
            <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
              <Button
                variant="outline-light"
                size="sm"
                onClick={() => setShowBulkImportModal(true)}
                className="d-flex align-items-center justify-content-center"
              >
                <FontAwesomeIcon icon={faFileImport} className="me-1" />
                <span className="d-none d-sm-inline">Bulk Import</span>
                <span className="d-inline d-sm-none">Import</span>
              </Button>
              <Button
                variant="outline-light"
                size="sm"
                onClick={() => setShowExcelModal(true)}
                className="d-flex align-items-center justify-content-center"
              >
                <FontAwesomeIcon icon={faFileExcel} className="me-1" />
                <span className="d-none d-sm-inline">Excel Tools</span>
                <span className="d-inline d-sm-none">Excel</span>
              </Button>
            </div>
          </div>
        </Card.Header>

        {viewMode === 'cards' && (
          <Card.Body className="py-2 py-md-3">
            <Row className="mb-2 mb-md-3">
              <Col xs={12} md={6}>
                <InputGroup>
                  <InputGroup.Text>
                    <FontAwesomeIcon icon={faSearch} />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-control-sm form-control-md-normal"
                  />
                </InputGroup>
              </Col>
            </Row>
          </Card.Body>
        )}
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Content */}
      {viewMode === 'cards' ? (
        <div className="master-data-categories-grid">
          {filteredCategories.map(category => (
            <MasterDataCard
              key={category.key}
              category={category.key}
              title={category.title}
              description={category.description}
              data={masterData[category.key] || []}
              onViewDetails={handleViewDetails}
              onAddNew={handleAddNew}
            />
          ))}
        </div>
      ) : (
        <MasterDataDetailView
          category={selectedCategory}
          title={masterDataCategories.find(c => c.key === selectedCategory)?.title || 'Category'}
          data={masterData[selectedCategory] || []}
          columns={getColumnConfig(selectedCategory)}
          onBack={handleBackToCards}
          onAdd={handleAddNew}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          error={error}
        />
      )}

      {/* Modals */}
      <ExcelImportExport
        show={showExcelModal}
        onHide={() => setShowExcelModal(false)}
        activeTab={selectedCategory || 'testCategories'}
        onImportSuccess={() => {
          // Refresh data
          setShowExcelModal(false);
        }}
      />

      <BulkDataImport
        show={showBulkImportModal}
        onHide={() => setShowBulkImportModal(false)}
        onImportSuccess={() => {
          // Refresh data
          setShowBulkImportModal(false);
        }}
      />
    </div>
  );
};

export default MasterDataNew;
