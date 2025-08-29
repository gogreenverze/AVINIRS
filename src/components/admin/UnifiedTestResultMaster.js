import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Alert, Badge, Table, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faEdit, faTrash, faSearch, faSync,
  faFlask, faVial, faDatabase, faDownload
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import {
  TextInput,
  NumberInput,
  DeleteConfirmationModal,
  SuccessModal,
  ErrorModal,
  FormModal
} from '../common';

const UnifiedTestResultMaster = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [sortField, setSortField] = useState('test_code');
  const [sortDirection, setSortDirection] = useState('asc');

  // Data states
  const [testMasterData, setTestMasterData] = useState([]);
  const [resultMasterData, setResultMasterData] = useState([]);
  const [excelData, setExcelData] = useState([]);

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // Auto-population states
  const [autoPopulating, setAutoPopulating] = useState(false);
  const [autoPopulationStatus, setAutoPopulationStatus] = useState({});

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);

  // Initial form data structure - COMPLETE VERSION with ALL fields
  const getInitialFormData = () => ({
    // Basic Information
    department: '',
    testName: '',
    test_code: '',
    hmsCode: '',

    // Test Master - Basic Information
    emrClassification: '',
    shortName: '',
    displayName: '',
    internationalCode: '',
    reportName: '',

    // Test Master - Test Configuration
    method: '',
    methodCode: '',
    primarySpecimen: '',
    primarySpecimenCode: '',
    specimen: [],
    specimenCode: '',
    container: '',
    containerCode: '',
    serviceTime: '24 Hours',

    // Test Master - Reference & Results
    reference_range: '',
    result_unit: '',
    decimals: 0,
    critical_low: null,
    critical_high: null,
    test_price: 0,

    // Test Master - Instructions & Notes
    instructions: '',
    interpretation: '',
    specialReport: '',

    // Test Master - Settings
    unacceptableConditions: [],
    minSampleQty: '',
    cutoffTime: '',
    testSuffix: '',
    suffixDesc: '',
    minProcessTime: 0,
    minProcessPeriod: '',
    emergencyProcessTime: 0,
    emergencyProcessPeriod: '',
    expiryTime: 0,
    expiryPeriod: '',
    applicableTo: 'both',
    reportingDays: 0,
    testDoneOn: [],

    // Test Master - Alert & Notification
    alertSMS: false,
    alertPeriod: '',
    alertMessage: '',

    // Test Master - Sub-tests
    subTests: [],

    // Test Master - Options (all checkboxes)
    options: {
      noSale: false,
      inactive: false,
      noBarCode: false,
      allowDiscount: false,
      hideOnlineReport: false,
      noDiscount: false,
      allowModifySpecimen: false,
      editComment: false,
      accreditedTest: false,
      preferDoctor: false,
      appointment: false,
      allowNegative: false,
      onlineRegistration: false,
      automatedService: false,
      allowIncreaseAmount: false,
      noHouseVisit: false,
      editBill: false,
      noResult: false,
      allowComma: false,
      autoAuthorise: false,
      isCovid: false,
      noLoyalty: false,
      outsourced: false,
      editQuantity: false,
      attachServiceDoctor: false,
      noSMS: false,
      noMembershipDiscount: false,
      noAppDiscount: false,
      printInsideBox: false
    },

    // Result Master - Basic Information
    sub_test: '',
    result_name: '',
    parameter_name: '',

    // Result Master - Result Type Configuration
    result_type: 'numeric',
    unit: '',
    decimal_places: 0,

    // Result Master - Critical Values
    // critical_low: '', // Already defined above
    // critical_high: '', // Already defined above

    // Result Master - Reference Range
    // reference_range: '', // Already defined above
    normal_range: '',

    // Result Master - Notes
    notes: '',
    description: '',

    // Result Master - Formula Structure
    calculation_formula: '',
    validation_rules: '',

    // Result Master - Additional fields
    display_order: 1,
    is_calculated: false,
    is_mandatory: true,
    allow_manual_entry: true,
    quality_control: false,
    specimen_type: '',
    reporting_unit: '',
    conversion_factor: 1.0,
    interpretation_rules: '',
    panic_values: '',
    delta_check_rules: '',
    age_specific_ranges: '',
    gender_specific_ranges: '',

    // Excel Integration Fields
    excel_source: false,
    source_sheet: '',

    // Common Fields
    is_active: true,
    created_at: '',
    updated_at: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [testMasterResponse, resultMasterResponse, excelResponse] = await Promise.all([
        adminAPI.get('/admin/test-master-enhanced'),
        adminAPI.get('/admin/result-master-enhanced'),
        adminAPI.get('/admin/excel-data')
      ]);

      setTestMasterData(testMasterResponse.data.data || []);
      setResultMasterData(resultMasterResponse.data.data || []);
      setExcelData(excelResponse.data.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-population functionality
  const handleTestCodeChange = async (e) => {
    const testCode = e.target.value;
    setFormData(prev => ({ ...prev, test_code: testCode }));

    if (testCode && testCode.length >= 3) {
      await performAutoPopulation('code', testCode);
    }
  };

  const handleTestNameChange = async (e) => {
    const testName = e.target.value;
    setFormData(prev => ({ ...prev, testName: testName }));

    if (testName && testName.length >= 3) {
      await performAutoPopulation('name', testName);
    }
  };

  const performAutoPopulation = async (searchType, searchValue) => {
    setAutoPopulating(true);
    setAutoPopulationStatus({});

    try {
      let response;
      if (searchType === 'code') {
        response = await adminAPI.get(`/admin/excel-data/lookup/${searchValue}`);
      } else {
        response = await adminAPI.get(`/admin/excel-data/lookup-by-name/${encodeURIComponent(searchValue)}`);
      }

      if (response.data.found && response.data.data) {
        const excelItem = response.data.data;

        // Auto-populate form fields - COMPREHENSIVE VERSION
        const autoPopulatedData = {
          ...formData,
          // Basic Information
          department: excelItem.department || formData.department,
          testName: excelItem.test_name || formData.testName,
          test_code: excelItem.test_code || formData.test_code,
          hmsCode: excelItem.test_code || formData.hmsCode,

          // Test Master - Basic Information
          shortName: excelItem.short_name || formData.shortName,
          displayName: excelItem.test_name || formData.displayName,
          reportName: excelItem.test_name || formData.reportName,

          // Test Master - Test Configuration
          method: excelItem.method || formData.method,
          methodCode: excelItem.method_code || formData.methodCode,
          primarySpecimen: excelItem.specimen || formData.primarySpecimen,
          primarySpecimenCode: excelItem.specimen_code || formData.primarySpecimenCode,
          specimen: excelItem.specimen ? [excelItem.specimen] : formData.specimen,
          specimenCode: excelItem.specimen_code || formData.specimenCode,
          container: excelItem.container || formData.container,
          containerCode: excelItem.container_code || formData.containerCode,

          // Test Master - Reference & Results
          reference_range: excelItem.reference_range || formData.reference_range,
          result_unit: excelItem.result_unit || formData.result_unit,
          decimals: excelItem.decimals || formData.decimals,
          critical_low: excelItem.critical_low || formData.critical_low,
          critical_high: excelItem.critical_high || formData.critical_high,
          test_price: excelItem.price || formData.test_price,

          // Test Master - Instructions & Notes
          instructions: excelItem.instructions || formData.instructions,
          notes: excelItem.notes || formData.notes,  // Added notes auto-population

          // Test Master - Settings
          minSampleQty: excelItem.min_sample_qty || formData.minSampleQty,
          reportingDays: excelItem.reporting_days || formData.reportingDays,
          testDoneOn: excelItem.test_done_on ? [excelItem.test_done_on] : formData.testDoneOn,
          applicableTo: excelItem.applicable_to || formData.applicableTo,

          // Result Master Fields
          result_name: excelItem.test_name || formData.result_name,
          parameter_name: excelItem.test_name || formData.parameter_name,
          unit: excelItem.result_unit || formData.unit,
          result_type: excelItem.result_type || formData.result_type,
          decimal_places: excelItem.decimals || formData.decimal_places,
          specimen_type: excelItem.specimen || formData.specimen_type,

          // Mark as auto-populated from Excel
          excel_source: true,
          source_sheet: excelItem.source_sheet || ''
        };

        setFormData(autoPopulatedData);

        // Set auto-population status
        const populatedFields = {};
        Object.keys(autoPopulatedData).forEach(key => {
          if (excelItem[key] || (key === 'testName' && excelItem.test_name)) {
            populatedFields[key] = { populated: true, source: 'Excel' };
          }
        });

        setAutoPopulationStatus(populatedFields);

        console.log('✅ Auto-population successful:', {
          searchType,
          searchValue,
          fieldsPopulated: Object.keys(populatedFields).length
        });
      } else {
        setAutoPopulationStatus({ notFound: true });
        console.log('⚠️ No Excel data found for:', searchType, searchValue);
      }
    } catch (err) {
      console.error('Auto-population error:', err);
      setAutoPopulationStatus({ error: true });
    } finally {
      setAutoPopulating(false);
    }
  };

  // Form handling - ENHANCED to handle nested objects
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle nested options object
    if (name.startsWith('options.')) {
      const optionName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        options: {
          ...prev.options,
          [optionName]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleAddClick = () => {
    setFormData(getInitialFormData());
    setAutoPopulationStatus({});
    setShowAddModal(true);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData(item);
    setAutoPopulationStatus({});
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      // Add to both test master and result master
      await Promise.all([
        adminAPI.post('/admin/test-master-enhanced', formData),
        adminAPI.post('/admin/result-master-enhanced', formData)
      ]);

      setShowAddModal(false);
      setShowSuccessModal(true);
      fetchAllData();
    } catch (err) {
      console.error('Error adding item:', err);
      setErrorMessage('Failed to add item. Please try again.');
      setShowErrorModal(true);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // Update both test master and result master
      await Promise.all([
        adminAPI.put(`/admin/test-master-enhanced/${editingItem.id}`, formData),
        adminAPI.put(`/admin/result-master-enhanced/${editingItem.id}`, formData)
      ]);

      setShowEditModal(false);
      setShowSuccessModal(true);
      fetchAllData();
    } catch (err) {
      console.error('Error updating item:', err);
      setErrorMessage('Failed to update item. Please try again.');
      setShowErrorModal(true);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      // Delete from both test master and result master
      await Promise.all([
        adminAPI.delete(`/admin/test-master-enhanced/${itemToDelete.id}`),
        adminAPI.delete(`/admin/result-master-enhanced/${itemToDelete.id}`)
      ]);

      setShowDeleteModal(false);
      setShowSuccessModal(true);
      fetchAllData();
    } catch (err) {
      console.error('Error deleting item:', err);
      setErrorMessage('Failed to delete item. Please try again.');
      setShowErrorModal(true);
    }
  };

  // Get unique departments for filtering
  const getDepartments = () => {
    const departments = [...new Set(testMasterData.map(item => item.department).filter(Boolean))];
    return departments.sort();
  };

  // Enhanced filtering and sorting
  const getFilteredAndSortedData = () => {
    let filteredData = testMasterData;

    // Filter by department
    if (selectedDepartment) {
      filteredData = filteredData.filter(item => item.department === selectedDepartment);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.testName?.toLowerCase().includes(query) ||
        item.test_code?.toLowerCase().includes(query) ||
        item.department?.toLowerCase().includes(query) ||
        item.method?.toLowerCase().includes(query) ||
        item.specimen?.some(s => s?.toLowerCase().includes(query)) ||
        item.container?.toLowerCase().includes(query) ||
        item.notes?.toLowerCase().includes(query)
      );
    }

    // Sort data
    filteredData.sort((a, b) => {
      let aValue = a[sortField] || '';
      let bValue = b[sortField] || '';

      // Handle numeric fields
      if (sortField === 'test_price' || sortField === 'decimals') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else {
        // Handle string fields
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filteredData;
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get department statistics
  const getDepartmentStats = () => {
    const stats = {};
    testMasterData.forEach(item => {
      const dept = item.department || 'Unknown';
      if (!stats[dept]) {
        stats[dept] = {
          total: 0,
          active: 0,
          excelSource: 0,
          avgPrice: 0,
          totalPrice: 0
        };
      }
      stats[dept].total++;
      if (item.is_active) stats[dept].active++;
      if (item.excel_source) stats[dept].excelSource++;
      stats[dept].totalPrice += parseFloat(item.test_price || 0);
    });

    // Calculate average prices
    Object.keys(stats).forEach(dept => {
      stats[dept].avgPrice = stats[dept].total > 0 ? stats[dept].totalPrice / stats[dept].total : 0;
    });

    return stats;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading unified test and result master data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="unified-test-result-master">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 text-black">
              <FontAwesomeIcon icon={faDatabase} className="me-2 text-black" />
              Unified Test & Result Master
            </h5>
            <small className="text-muted">
              Combined Test Master and Result Master with Excel auto-population
            </small>
          </div>
          <div className="d-flex gap-2">
            <Button variant="success" onClick={handleAddClick}>
              <FontAwesomeIcon icon={faPlus} className="me-1" />
              Add New
            </Button>
            <Button variant="outline-primary" onClick={fetchAllData}>
              <FontAwesomeIcon icon={faSync} className="me-1" />
              Refresh
            </Button>
          </div>
        </Card.Header>

        <div className="card-header-search py-3 px-3 border-bottom">
          <Row className="mb-3">
            <Col md={4}>
              <Form.Control
                type="text"
                placeholder="Search by test name, code, method, specimen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Col>
            <Col md={3}>
              <Form.Select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="">All Departments</option>
                {getDepartments().map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={5} className="text-end">
              <Badge bg="info" className="me-2">
                Total: {testMasterData.length}
              </Badge>
              <Badge bg="success" className="me-2">
                Filtered: {getFilteredAndSortedData().length}
              </Badge>
              <Badge bg="warning" className="me-2">
                Excel Source: {testMasterData.filter(item => item.excel_source).length}
              </Badge>
              <Badge bg="primary">
                Departments: {getDepartments().length}
              </Badge>
            </Col>
          </Row>

          {/* Department Statistics */}
          {selectedDepartment && (
            <Row>
              <Col md={12}>
                <Alert variant="info" className="mb-0 py-2">
                  <strong>{selectedDepartment} Department:</strong> {' '}
                  {(() => {
                    const stats = getDepartmentStats()[selectedDepartment];
                    return stats ? (
                      <>
                        {stats.total} tests | {stats.active} active | {stats.excelSource} from Excel |
                        Avg Price: ₹{stats.avgPrice.toFixed(2)}
                      </>
                    ) : 'No data';
                  })()}
                </Alert>
              </Col>
            </Row>
          )}
        </div>

        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          {/* Department Summary Cards */}
          {!selectedDepartment && testMasterData.length > 0 && (
            <div className="mb-4">
              <h6 className="text-primary mb-3">Department Overview</h6>
              <Row>
                {Object.entries(getDepartmentStats()).map(([dept, stats]) => (
                  <Col md={3} key={dept} className="mb-3">
                    <Card className="h-100 border-0 text-white shadow-sm">
                      <Card.Body className="p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="card-title mb-0 text-truncate" title={dept}>
                            {dept}
                          </h6>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => setSelectedDepartment(dept)}
                            title={`Filter by ${dept}`}
                          >
                            <FontAwesomeIcon icon={faSearch} />
                          </Button>
                        </div>
                        <div className="small text-muted">
                          <div className="d-flex justify-content-between">
                            <span>Total Tests:</span>
                            <strong>{stats.total}</strong>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span>Active:</span>
                            <strong className="text-success">{stats.active}</strong>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span>Excel Source:</span>
                            <strong className="text-info">{stats.excelSource}</strong>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span>Avg Price:</span>
                            <strong className="text-primary">₹{stats.avgPrice.toFixed(0)}</strong>
                          </div>
                        </div>
                        <div className="progress mt-2" style={{height: '4px'}}>
                          <div
                            className="progress-bar bg-success"
                            style={{width: `${(stats.active / stats.total) * 100}%`}}
                            title={`${((stats.active / stats.total) * 100).toFixed(1)}% Active`}
                          ></div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          <div className="table-responsive">
            <Table className="table-hover table-sm">
              <thead className="table-white">
                <tr>
                  <th
                    style={{cursor: 'pointer'}}
                    onClick={() => handleSort('test_code')}
                    className="position-relative"
                  >
                    Test Code
                    {sortField === 'test_code' && (
                      <FontAwesomeIcon
                        icon={sortDirection === 'asc' ? faSync : faSync}
                        className={`ms-1 ${sortDirection === 'desc' ? 'fa-rotate-180' : ''}`}
                        style={{fontSize: '0.8em'}}
                      />
                    )}
                  </th>
                  <th
                    style={{cursor: 'pointer'}}
                    onClick={() => handleSort('testName')}
                    className="position-relative"
                  >
                    Test Name
                    {sortField === 'testName' && (
                      <FontAwesomeIcon
                        icon={sortDirection === 'asc' ? faSync : faSync}
                        className={`ms-1 ${sortDirection === 'desc' ? 'fa-rotate-180' : ''}`}
                        style={{fontSize: '0.8em'}}
                      />
                    )}
                  </th>
                  <th
                    style={{cursor: 'pointer'}}
                    onClick={() => handleSort('department')}
                    className="position-relative"
                  >
                    Department
                    {sortField === 'department' && (
                      <FontAwesomeIcon
                        icon={sortDirection === 'asc' ? faSync : faSync}
                        className={`ms-1 ${sortDirection === 'desc' ? 'fa-rotate-180' : ''}`}
                        style={{fontSize: '0.8em'}}
                      />
                    )}
                  </th>
                  <th>Method</th>
                  <th>Specimen</th>
                  <th
                    style={{cursor: 'pointer'}}
                    onClick={() => handleSort('test_price')}
                    className="position-relative"
                  >
                    Price
                    {sortField === 'test_price' && (
                      <FontAwesomeIcon
                        icon={sortDirection === 'asc' ? faSync : faSync}
                        className={`ms-1 ${sortDirection === 'desc' ? 'fa-rotate-180' : ''}`}
                        style={{fontSize: '0.8em'}}
                      />
                    )}
                  </th>
                  <th>Unit</th>
                  <th>Reference Range</th>
                  <th>Notes</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredAndSortedData().map(item => (
                  <tr key={item.id}>
                    <td>
                      <code className="text-primary">{item.test_code || item.hmsCode}</code>
                    </td>
                    <td>
                      <div className="fw-bold">{item.testName}</div>
                      {item.shortName && (
                        <small className="text-muted">({item.shortName})</small>
                      )}
                    </td>
                    <td>
                      <Badge
                        bg="secondary"
                        className="text-wrap"
                        style={{fontSize: '0.75em'}}
                      >
                        {item.department}
                      </Badge>
                    </td>
                    <td>
                      <div className="text-truncate" style={{maxWidth: '120px'}}>
                        {item.method || 'N/A'}
                      </div>
                      {item.methodCode && (
                        <small className="text-muted d-block">Code: {item.methodCode}</small>
                      )}
                    </td>
                    <td>
                      <div className="text-truncate" style={{maxWidth: '100px'}}>
                        {Array.isArray(item.specimen) ? item.specimen.join(', ') : (item.specimen || 'N/A')}
                      </div>
                      {item.container && (
                        <small className="text-muted d-block">{item.container}</small>
                      )}
                    </td>
                    <td className="text-end">
                      <span className="fw-bold">₹{(item.test_price || 0).toLocaleString()}</span>
                    </td>
                    <td>
                      <span className="badge bg-info text-dark">
                        {item.result_unit || item.unit || 'N/A'}
                      </span>
                      {item.decimals > 0 && (
                        <small className="text-muted d-block">{item.decimals} decimals</small>
                      )}
                    </td>
                    <td>
                      <div className="text-truncate" style={{maxWidth: '150px'}} title={item.reference_range}>
                        {item.reference_range || 'N/A'}
                      </div>
                      {(item.critical_low || item.critical_high) && (
                        <small className="text-danger d-block">
                          Critical: {item.critical_low || 'N/A'} - {item.critical_high || 'N/A'}
                        </small>
                      )}
                    </td>
                    <td>
                      {item.notes ? (
                        <div
                          className="text-truncate"
                          style={{maxWidth: '120px'}}
                          title={item.notes}
                        >
                          <FontAwesomeIcon icon={faEdit} className="text-info me-1" />
                          {item.notes.substring(0, 30)}...
                        </div>
                      ) : (
                        <span className="text-muted">No notes</span>
                      )}
                    </td>
                    <td>
                      <Badge bg={item.excel_source ? 'success' : 'primary'}>
                        {item.excel_source ? 'Excel' : 'Manual'}
                      </Badge>
                      {item.source_sheet && (
                        <small className="text-muted d-block">{item.source_sheet}</small>
                      )}
                    </td>
                    <td>
                      <Badge bg={item.is_active ? 'success' : 'danger'}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEditClick(item)}
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteClick(item)}
                          title="Delete"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {getFilteredAndSortedData().length === 0 && (
              <div className="text-center py-5">
                <FontAwesomeIcon icon={faSearch} size="3x" className="text-muted mb-3" />
                <h5 className="text-muted">No data found</h5>
                <p className="text-muted">
                  {searchQuery || selectedDepartment
                    ? 'Try adjusting your search criteria or department filter.'
                    : 'No test data available. Import Excel data or add tests manually.'}
                </p>
                {(searchQuery || selectedDepartment) && (
                  <Button
                    variant="outline-primary"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedDepartment('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Add Modal */}
      <FormModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSubmit={handleAddSubmit}
        title="Add New Test & Result Master"
        size="xl"
      >
        {renderUnifiedForm()}
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        title="Edit Test & Result Master"
        submitText="Save Changes"
        size="xl"
      >
        {renderUnifiedForm()}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Test & Result Master"
        message={`Are you sure you want to delete "${itemToDelete?.testName}"? This will remove both test master and result master entries.`}
      />
    </div>
  );

  // Render unified form function
  function renderUnifiedForm() {
    return (
      <>
        {/* Auto-population Status */}
        {autoPopulating && (
          <Alert variant="info">
            <FontAwesomeIcon icon={faSync} className="fa-spin me-2" />
            Auto-populating fields from Excel data...
          </Alert>
        )}

        {autoPopulationStatus.notFound && (
          <Alert variant="warning">
            <FontAwesomeIcon icon={faSearch} className="me-2" />
            No Excel data found for auto-population. You can enter data manually.
          </Alert>
        )}

        {Object.keys(autoPopulationStatus).filter(key => autoPopulationStatus[key].populated).length > 0 && (
          <Alert variant="success">
            <FontAwesomeIcon icon={faDownload} className="me-2" />
            {Object.keys(autoPopulationStatus).filter(key => autoPopulationStatus[key].populated).length} fields auto-populated from Excel data.
          </Alert>
        )}

        {/* Basic Information Section - ENHANCED */}
        <div className="border rounded p-3 mb-3">
          <h6 className="text-primary mb-3">Basic Information</h6>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Department*</Form.Label>
                <Form.Select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="BIOCHEMISTRY">BIOCHEMISTRY</option>
                  <option value="HAEMATOLOGY">HAEMATOLOGY</option>
                  <option value="CLINICAL_PATHOLOGY">CLINICAL PATHOLOGY</option>
                  <option value="MOLECULAR_BIOLOGY">MOLECULAR BIOLOGY</option>
                  <option value="ENDOCRINOLOGY">ENDOCRINOLOGY</option>
                  <option value="HISTOPATHOLOGY">HISTOPATHOLOGY</option>
                  <option value="SEROLOGY">SEROLOGY</option>
                  <option value="IMMUNOHAEMATOLOGY">IMMUNOHAEMATOLOGY</option>
                  <option value="MICROBIOLOGY_SURVEILLANCE">MICROBIOLOGY SURVEILLANCE</option>
                </Form.Select>
                {autoPopulationStatus.department?.populated && (
                  <Form.Text className="text-success">
                    ✅ Auto-populated from Excel data
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <TextInput
                name="testName"
                label="Test Name*"
                value={formData.testName}
                onChange={handleTestNameChange}
                required
                placeholder="Enter test name or search for auto-population"
              />
              {autoPopulationStatus.testName?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <TextInput
                name="test_code"
                label="Test Code*"
                value={formData.test_code}
                onChange={handleTestCodeChange}
                required
                placeholder="Enter test code for auto-population"
              />
              {autoPopulationStatus.test_code?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
            <Col md={6}>
              <TextInput
                name="hmsCode"
                label="HMS Code*"
                value={formData.hmsCode}
                onChange={handleChange}
                required
                placeholder="Enter HMS code"
              />
              {autoPopulationStatus.hmsCode?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <TextInput
                name="shortName"
                label="Short Name"
                value={formData.shortName}
                onChange={handleChange}
                placeholder="Short name or abbreviation"
              />
              {autoPopulationStatus.shortName?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
            <Col md={6}>
              <TextInput
                name="displayName"
                label="Display Name"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Display name for reports"
              />
              {autoPopulationStatus.displayName?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <TextInput
                name="internationalCode"
                label="International Code"
                value={formData.internationalCode}
                onChange={handleChange}
                placeholder="International code (LOINC, etc.)"
              />
            </Col>
            <Col md={6}>
              <TextInput
                name="reportName"
                label="Report Name"
                value={formData.reportName}
                onChange={handleChange}
                placeholder="Name to display on reports"
              />
              {autoPopulationStatus.reportName?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <TextInput
                name="emrClassification"
                label="EMR Classification"
                value={formData.emrClassification}
                onChange={handleChange}
                placeholder="e.g., Laboratory, Radiology"
              />
            </Col>
          </Row>
        </div>

        {/* Test Configuration Section - ENHANCED */}
        <div className="border rounded p-3 mb-3">
          <h6 className="text-primary mb-3">
            <FontAwesomeIcon icon={faFlask} className="me-2" />
            Test Configuration
          </h6>
          <Row>
            <Col md={6}>
              <TextInput
                name="method"
                label="Method"
                value={formData.method}
                onChange={handleChange}
                placeholder="e.g., Automated, Manual"
              />
              {autoPopulationStatus.method?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
            <Col md={6}>
              <NumberInput
                name="methodCode"
                label="Method Code"
                value={formData.methodCode}
                onChange={handleChange}
                placeholder="Method code"
              />
              {autoPopulationStatus.methodCode?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <TextInput
                name="primarySpecimen"
                label="Primary Specimen"
                value={formData.primarySpecimen}
                onChange={handleChange}
                placeholder="e.g., Serum, Blood"
              />
              {autoPopulationStatus.primarySpecimen?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
            <Col md={6}>
              <NumberInput
                name="primarySpecimenCode"
                label="Primary Specimen Code"
                value={formData.primarySpecimenCode}
                onChange={handleChange}
                placeholder="Specimen code"
              />
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <TextInput
                name="container"
                label="Container"
                value={formData.container}
                onChange={handleChange}
                placeholder="e.g., Serum, Plasma"
              />
              {autoPopulationStatus.container?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
            <Col md={6}>
              <NumberInput
                name="containerCode"
                label="Container Code"
                value={formData.containerCode}
                onChange={handleChange}
                placeholder="Container code"
              />
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <TextInput
                name="serviceTime"
                label="Service Time"
                value={formData.serviceTime}
                onChange={handleChange}
                placeholder="e.g., 24 Hours, Same Day"
              />
            </Col>
            <Col md={6}>
              <NumberInput
                name="test_price"
                label="Test Price*"
                value={formData.test_price}
                onChange={handleChange}
                required
                min={0}
                step={0.01}
                placeholder="Enter test price"
              />
              {autoPopulationStatus.test_price?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
          </Row>
        </div>

        {/* Reference & Results Section - ENHANCED */}
        <div className="border rounded p-3 mb-3">
          <h6 className="text-primary mb-3">Reference & Results</h6>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Reference Range</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="reference_range"
                  value={formData.reference_range}
                  onChange={handleChange}
                  placeholder="Enter reference range"
                />
                {autoPopulationStatus.reference_range?.populated && (
                  <Form.Text className="text-success">
                    ✅ Auto-populated from Excel data
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <TextInput
                name="result_unit"
                label="Result Unit"
                value={formData.result_unit}
                onChange={handleChange}
                placeholder="e.g., mg/dL, pg/ml"
              />
              {autoPopulationStatus.result_unit?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
            <Col md={4}>
              <NumberInput
                name="decimals"
                label="Decimals"
                value={formData.decimals}
                onChange={handleChange}
                min={0}
                max={5}
                placeholder="Number of decimal places"
              />
              {autoPopulationStatus.decimals?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
            <Col md={4}>
              <NumberInput
                name="display_order"
                label="Display Order"
                value={formData.display_order}
                onChange={handleChange}
                min={1}
                placeholder="Display order"
              />
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <NumberInput
                name="critical_low"
                label="Critical Low"
                value={formData.critical_low}
                onChange={handleChange}
                step={0.01}
                placeholder="Critical low value"
              />
              {autoPopulationStatus.critical_low?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
            <Col md={6}>
              <NumberInput
                name="critical_high"
                label="Critical High"
                value={formData.critical_high}
                onChange={handleChange}
                step={0.01}
                placeholder="Critical high value"
              />
              {autoPopulationStatus.critical_high?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
          </Row>
        </div>

        {/* Instructions & Notes Section - NEW */}
        <div className="border rounded p-3 mb-3">
          <h6 className="text-primary mb-3">Instructions & Notes</h6>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Instructions</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  placeholder="Enter test instructions"
                />
                {autoPopulationStatus.instructions?.populated && (
                  <Form.Text className="text-success">
                    ✅ Auto-populated from Excel data
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Interpretation</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="interpretation"
                  value={formData.interpretation}
                  onChange={handleChange}
                  placeholder="Enter interpretation notes"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Special Report</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="specialReport"
                  value={formData.specialReport}
                  onChange={handleChange}
                  placeholder="Enter special report notes"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes"
                />
              </Form.Group>
            </Col>
          </Row>
        </div>

        {/* Settings Section - NEW */}
        <div className="border rounded p-3 mb-3">
          <h6 className="text-primary mb-3">Settings</h6>

          {/* Unacceptable Conditions */}
          <Form.Group className="mb-3">
            <Form.Label>Unacceptable Conditions</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="unacceptableConditions"
              value={Array.isArray(formData.unacceptableConditions) ? formData.unacceptableConditions.join(', ') : formData.unacceptableConditions || ''}
              onChange={(e) => {
                const value = e.target.value;
                const conditions = value.split(',').map(item => item.trim()).filter(item => item);
                handleChange({
                  target: {
                    name: 'unacceptableConditions',
                    value: conditions
                  }
                });
              }}
              placeholder="Enter unacceptable conditions separated by commas (e.g., Hemolyzed, Lipemic)"
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <TextInput
                name="minSampleQty"
                label="Min. Sample Qty"
                value={formData.minSampleQty}
                onChange={handleChange}
                placeholder="e.g., 2ml"
              />
              {autoPopulationStatus.minSampleQty?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
            <Col md={6}>
              <TextInput
                name="cutoffTime"
                label="Cut-off Time"
                value={formData.cutoffTime}
                onChange={handleChange}
                placeholder="e.g., 10:00 AM"
              />
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <TextInput
                name="testSuffix"
                label="Test Suffix"
                value={formData.testSuffix}
                onChange={handleChange}
                placeholder="Enter test suffix"
              />
            </Col>
            <Col md={6}>
              <TextInput
                name="suffixDesc"
                label="Suffix Desc."
                value={formData.suffixDesc}
                onChange={handleChange}
                placeholder="Enter suffix description"
              />
            </Col>
          </Row>

          {/* Process Times */}
          <Row>
            <Col md={4}>
              <NumberInput
                name="minProcessTime"
                label="Min. Process Time"
                value={formData.minProcessTime}
                onChange={handleChange}
                min={0}
                placeholder="0"
              />
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Min. Process Period</Form.Label>
                <Form.Select
                  name="minProcessPeriod"
                  value={formData.minProcessPeriod}
                  onChange={handleChange}
                >
                  <option value="">-- Select --</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <NumberInput
                name="reportingDays"
                label="Reporting Days"
                value={formData.reportingDays}
                onChange={handleChange}
                min={0}
                placeholder="0"
              />
              {autoPopulationStatus.reportingDays?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
          </Row>

          {/* Emergency Process Times */}
          <Row>
            <Col md={4}>
              <NumberInput
                name="emergencyProcessTime"
                label="Emergency. Process Time"
                value={formData.emergencyProcessTime}
                onChange={handleChange}
                min={0}
                placeholder="0"
              />
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Emergency. Process Period</Form.Label>
                <Form.Select
                  name="emergencyProcessPeriod"
                  value={formData.emergencyProcessPeriod}
                  onChange={handleChange}
                >
                  <option value="">-- Select --</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <NumberInput
                name="expiryTime"
                label="Expiry Time"
                value={formData.expiryTime}
                onChange={handleChange}
                min={0}
                placeholder="0"
              />
            </Col>
          </Row>

          {/* Expiry Period */}
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Expiry Period</Form.Label>
                <Form.Select
                  name="expiryPeriod"
                  value={formData.expiryPeriod}
                  onChange={handleChange}
                >
                  <option value="">-- Select --</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={8}>
              {/* Applicable To */}
              <Form.Group className="mb-3">
                <Form.Label>Applicable to</Form.Label>
                <div>
                  <Form.Check
                    inline
                    type="radio"
                    name="applicableTo"
                    id="male"
                    label="Male"
                    value="male"
                    checked={formData.applicableTo === 'male'}
                    onChange={handleChange}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    name="applicableTo"
                    id="female"
                    label="Female"
                    value="female"
                    checked={formData.applicableTo === 'female'}
                    onChange={handleChange}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    name="applicableTo"
                    id="both"
                    label="Both"
                    value="both"
                    checked={formData.applicableTo === 'both'}
                    onChange={handleChange}
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>

          {/* Test Done On */}
          <Form.Group className="mb-3">
            <Form.Label>Test Done On*</Form.Label>
            <div>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Form.Check
                  key={day}
                  inline
                  type="checkbox"
                  name={`testDoneOn_${day}`}
                  id={`testDoneOn_${day}`}
                  label={day}
                  checked={formData.testDoneOn?.includes(day) || false}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    const currentDays = Array.isArray(formData.testDoneOn) ? formData.testDoneOn : [];
                    let updatedDays;

                    if (isChecked) {
                      updatedDays = [...currentDays, day];
                    } else {
                      updatedDays = currentDays.filter(d => d !== day);
                    }

                    handleChange({
                      target: {
                        name: 'testDoneOn',
                        value: updatedDays
                      }
                    });
                  }}
                />
              ))}
            </div>
          </Form.Group>

          {/* Investigation Frequency */}
          <div className="border rounded p-3 mb-3">
            <h6 className="text-primary mb-3">Investigation Frequency</h6>
            <Row>
              <Col md={6}>
                <Form.Check
                  type="checkbox"
                  name="alertSMS"
                  id="alertSMS"
                  label="Alert SMS"
                  checked={formData.alertSMS || false}
                  onChange={handleChange}
                />
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Alert Period</Form.Label>
                  <Form.Select
                    name="alertPeriod"
                    value={formData.alertPeriod}
                    onChange={handleChange}
                  >
                    <option value="">-- Select --</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Alert Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="alertMessage"
                value={formData.alertMessage}
                onChange={handleChange}
                placeholder="Enter alert message"
              />
            </Form.Group>
          </div>
        </div>

        {/* Result Master Section - ENHANCED */}
        <div className="border rounded p-3 mb-3">
          <h6 className="text-primary mb-3">
            <FontAwesomeIcon icon={faVial} className="me-2" />
            Result Master Information
          </h6>

          {/* Basic Result Information */}
          <Row>
            <Col md={6}>
              <TextInput
                name="result_name"
                label="Result Name*"
                value={formData.result_name}
                onChange={handleChange}
                required
                placeholder="Enter result name"
              />
              {autoPopulationStatus.result_name?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
            <Col md={6}>
              <TextInput
                name="parameter_name"
                label="Parameter Name*"
                value={formData.parameter_name}
                onChange={handleChange}
                required
                placeholder="Enter parameter name"
              />
              {autoPopulationStatus.parameter_name?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <TextInput
                name="sub_test"
                label="Sub Test"
                value={formData.sub_test}
                onChange={handleChange}
                placeholder="Sub test name"
              />
            </Col>
            <Col md={6}>
              <TextInput
                name="specimen_type"
                label="Specimen Type"
                value={formData.specimen_type}
                onChange={handleChange}
                placeholder="Specimen type for this result"
              />
              {autoPopulationStatus.specimen_type?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
          </Row>

          {/* Result Type Configuration */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Result Type</Form.Label>
                <Form.Select
                  name="result_type"
                  value={formData.result_type}
                  onChange={handleChange}
                >
                  <option value="numeric">Numeric</option>
                  <option value="Pick List">Pick List</option>
                  <option value="Template">Template</option>
                  <option value="Text">Text</option>
                  <option value="calculated">Calculated</option>
                </Form.Select>
                {autoPopulationStatus.result_type?.populated && (
                  <Form.Text className="text-success">
                    ✅ Auto-populated from Excel data
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <TextInput
                name="unit"
                label="Result Unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="mg/dl, mmol/L, etc."
              />
              {autoPopulationStatus.unit?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <NumberInput
                name="decimal_places"
                label="Decimal Places"
                value={formData.decimal_places}
                onChange={handleChange}
                min={0}
                max={5}
                placeholder="0"
              />
              {autoPopulationStatus.decimal_places?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
            <Col md={6}>
              <TextInput
                name="reporting_unit"
                label="Reporting Unit"
                value={formData.reporting_unit}
                onChange={handleChange}
                placeholder="Unit for reporting"
              />
            </Col>
          </Row>

          {/* Reference Ranges */}
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Reference Range</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="reference_range"
                  value={formData.reference_range}
                  onChange={handleChange}
                  placeholder="Normal reference range for the test"
                />
                {autoPopulationStatus.reference_range?.populated && (
                  <Form.Text className="text-success">
                    ✅ Auto-populated from Excel data
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Normal Range</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="normal_range"
                  value={formData.normal_range}
                  onChange={handleChange}
                  placeholder="Normal range values"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Age Specific Ranges</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="age_specific_ranges"
                  value={formData.age_specific_ranges}
                  onChange={handleChange}
                  placeholder="Age-specific reference ranges"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Gender Specific Ranges</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="gender_specific_ranges"
                  value={formData.gender_specific_ranges}
                  onChange={handleChange}
                  placeholder="Gender-specific reference ranges"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Critical Values */}
          <Row>
            <Col md={6}>
              <NumberInput
                name="critical_low"
                label="Critical Low"
                value={formData.critical_low}
                onChange={handleChange}
                placeholder="Critical low value"
              />
              {autoPopulationStatus.critical_low?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
            <Col md={6}>
              <NumberInput
                name="critical_high"
                label="Critical High"
                value={formData.critical_high}
                onChange={handleChange}
                placeholder="Critical high value"
              />
              {autoPopulationStatus.critical_high?.populated && (
                <Form.Text className="text-success">
                  ✅ Auto-populated from Excel data
                </Form.Text>
              )}
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Panic Values</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="panic_values"
                  value={formData.panic_values}
                  onChange={handleChange}
                  placeholder="Panic value ranges"
                />
              </Form.Group>
            </Col>
          </Row>
        </div>

        {/* Formula & Calculation Section - NEW */}
        <div className="border rounded p-3 mb-3">
          <h6 className="text-primary mb-3">Formula & Calculation</h6>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Calculation Formula</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="calculation_formula"
                  value={formData.calculation_formula}
                  onChange={handleChange}
                  placeholder="Enter calculation formula if applicable"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Validation Rules</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="validation_rules"
                  value={formData.validation_rules}
                  onChange={handleChange}
                  placeholder="Enter validation rules"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Interpretation Rules</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="interpretation_rules"
                  value={formData.interpretation_rules}
                  onChange={handleChange}
                  placeholder="Rules for result interpretation"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Delta Check Rules</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="delta_check_rules"
                  value={formData.delta_check_rules}
                  onChange={handleChange}
                  placeholder="Delta check validation rules"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <NumberInput
                name="conversion_factor"
                label="Conversion Factor"
                value={formData.conversion_factor}
                onChange={handleChange}
                step={0.001}
                placeholder="1.0"
              />
            </Col>
            <Col md={6}>
              <div className="mb-3">
                <Form.Check
                  type="checkbox"
                  name="is_calculated"
                  id="is_calculated"
                  label="Is Calculated Result"
                  checked={formData.is_calculated || false}
                  onChange={handleChange}
                />
                <Form.Check
                  type="checkbox"
                  name="is_mandatory"
                  id="is_mandatory"
                  label="Is Mandatory"
                  checked={formData.is_mandatory || false}
                  onChange={handleChange}
                />
                <Form.Check
                  type="checkbox"
                  name="allow_manual_entry"
                  id="allow_manual_entry"
                  label="Allow Manual Entry"
                  checked={formData.allow_manual_entry || false}
                  onChange={handleChange}
                />
                <Form.Check
                  type="checkbox"
                  name="quality_control"
                  id="quality_control"
                  label="Quality Control"
                  checked={formData.quality_control || false}
                  onChange={handleChange}
                />
              </div>
            </Col>
          </Row>
        </div>

        {/* Test Options Section - NEW */}
        <div className="border rounded p-3 mb-3">
          <h6 className="text-primary mb-3">Test Options</h6>
          <Row>
            <Col md={4}>
              <Form.Check
                type="checkbox"
                name="options.noSale"
                label="No Sale"
                checked={formData.options?.noSale || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.noSale',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.inactive"
                label="Inactive"
                checked={formData.options?.inactive || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.inactive',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.noBarCode"
                label="No BarCode"
                checked={formData.options?.noBarCode || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.noBarCode',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.allowDiscount"
                label="Allow Discount"
                checked={formData.options?.allowDiscount || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.allowDiscount',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.hideOnlineReport"
                label="Hide Online Report/Auto Report"
                checked={formData.options?.hideOnlineReport || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.hideOnlineReport',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.noDiscount"
                label="No Discount"
                checked={formData.options?.noDiscount || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.noDiscount',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.allowModifySpecimen"
                label="Allow Modify Specimen and Container"
                checked={formData.options?.allowModifySpecimen || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.allowModifySpecimen',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.editComment"
                label="EMR Comment"
                checked={formData.options?.editComment || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.editComment',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
            </Col>
            <Col md={4}>
              <Form.Check
                type="checkbox"
                name="options.accreditedTest"
                label="Accredited Test"
                checked={formData.options?.accreditedTest || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.accreditedTest',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.preferDoctor"
                label="Prefer Doctor"
                checked={formData.options?.preferDoctor || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.preferDoctor',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.appointment"
                label="Appointment"
                checked={formData.options?.appointment || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.appointment',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.allowNegative"
                label="Allow Negative"
                checked={formData.options?.allowNegative || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.allowNegative',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.onlineRegistration"
                label="Online registration"
                checked={formData.options?.onlineRegistration || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.onlineRegistration',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.automatedService"
                label="Automated Service"
                checked={formData.options?.automatedService || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.automatedService',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.allowIncreaseAmount"
                label="Allow Increase Amount"
                checked={formData.options?.allowIncreaseAmount || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.allowIncreaseAmount',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
            </Col>
            <Col md={4}>
              <Form.Check
                type="checkbox"
                name="options.noHouseVisit"
                label="No House Visit"
                checked={formData.options?.noHouseVisit || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.noHouseVisit',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.editBill"
                label="Edit Bill"
                checked={formData.options?.editBill || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.editBill',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.noResult"
                label="No Result"
                checked={formData.options?.noResult || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.noResult',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.allowComma"
                label="Allow Comma"
                checked={formData.options?.allowComma || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.allowComma',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.autoAuthorise"
                label="Auto Authorise"
                checked={formData.options?.autoAuthorise || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.autoAuthorise',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.isCovid"
                label="Is Covid"
                checked={formData.options?.isCovid || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.isCovid',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.noLoyalty"
                label="No Loyalty"
                checked={formData.options?.noLoyalty || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.noLoyalty',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.outsourced"
                label="Outsourced"
                checked={formData.options?.outsourced || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.outsourced',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.editQuantity"
                label="Edit Quantity"
                checked={formData.options?.editQuantity || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.editQuantity',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.attachServiceDoctor"
                label="Attach Service Doctor"
                checked={formData.options?.attachServiceDoctor || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.attachServiceDoctor',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.noSMS"
                label="No SMS"
                checked={formData.options?.noSMS || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.noSMS',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.noMembershipDiscount"
                label="No Membership Discount"
                checked={formData.options?.noMembershipDiscount || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.noMembershipDiscount',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.noAppDiscount"
                label="No App Discount"
                checked={formData.options?.noAppDiscount || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.noAppDiscount',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
              <Form.Check
                type="checkbox"
                name="options.printInsideBox"
                label="Print Inside Box"
                checked={formData.options?.printInsideBox || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'options.printInsideBox',
                    type: 'checkbox',
                    checked: e.target.checked
                  }
                })}
              />
            </Col>
          </Row>
        </div>

        {/* Additional Settings - ENHANCED */}
        <div className="border rounded p-3 mb-3">
          <h6 className="text-primary mb-3">Additional Settings</h6>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Additional description"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Check
                type="switch"
                id="is_active"
                name="is_active"
                label="Active"
                checked={formData.is_active}
                onChange={handleChange}
              />
            </Col>
            <Col md={6}>
              <Form.Check
                type="switch"
                id="excel_source"
                name="excel_source"
                label="Excel Source"
                checked={formData.excel_source}
                onChange={handleChange}
                disabled
              />
            </Col>
          </Row>
          {formData.excel_source && formData.source_sheet && (
            <Row>
              <Col md={12}>
                <Alert variant="info" className="mt-2">
                  <small>
                    📊 This data was imported from Excel sheet: <strong>{formData.source_sheet}</strong>
                  </small>
                </Alert>
              </Col>
            </Row>
          )}
        </div>
      </>
    );
  }
};

export default UnifiedTestResultMaster;