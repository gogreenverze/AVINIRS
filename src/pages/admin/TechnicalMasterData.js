import React, { useState, useEffect } from 'react';
import { Card, Button, Form, InputGroup, Table, Badge, Tabs, Tab, Alert, Row, Col, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDatabase, faPlus, faEdit, faTrash, faSearch,
  faFlask, faVial, faFileInvoiceDollar, faUserMd,
  faBoxes, faMicroscope, faEyeDropper, faTruck,
  faRulerHorizontal, faCalculator, faCogs, faFileExcel, faFileImport,
  faUsers, faClipboardList, faBug, faShieldAlt, faCog,
  faPrint, faBuilding, faKey, faLayerGroup, faChartLine, faDownload, faUpload
} from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import { adminAPI } from '../../services/api';
import {
  TextInput,
  NumberInput,
  DeleteConfirmationModal,
  SuccessModal,
  ErrorModal,
  FormModal
} from '../../components/common';

const TechnicalMasterData = () => {
  // State for technical master data
  const [technicalMasterData, setTechnicalMasterData] = useState({
    resultMaster: []
  });

  // Dynamic tabs state with localStorage persistence
  const [dynamicTabs, setDynamicTabs] = useState(() => {
    try {
      const saved = localStorage.getItem('technicalMasterDynamicTabs');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading dynamic tabs from localStorage:', error);
      return [];
    }
  });

  const [dynamicTabsData, setDynamicTabsData] = useState(() => {
    try {
      const saved = localStorage.getItem('technicalMasterDynamicTabsData');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading dynamic tabs data from localStorage:', error);
      return {};
    }
  });

  // UI State - Only Result Master
  const [activeTab, setActiveTab] = useState('resultMaster');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  // Excel import states
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [excelColumns, setExcelColumns] = useState([]);
  const [tabName, setTabName] = useState('');

  // Form data
  const [formData, setFormData] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');



  // Fetch technical master data
  useEffect(() => {
    const fetchTechnicalMasterData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await adminAPI.getTechnicalMasterData();
        setTechnicalMasterData(response.data);
      } catch (err) {
        console.error('Error fetching technical master data:', err);
        setError('Failed to load technical master data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicalMasterData();
  }, []);

  // Save dynamic tabs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('technicalMasterDynamicTabs', JSON.stringify(dynamicTabs));
    } catch (error) {
      console.error('Error saving dynamic tabs to localStorage:', error);
    }
  }, [dynamicTabs]);

  // Save dynamic tabs data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('technicalMasterDynamicTabsData', JSON.stringify(dynamicTabsData));
    } catch (error) {
      console.error('Error saving dynamic tabs data to localStorage:', error);
    }
  }, [dynamicTabsData]);

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  // Get filtered data based on search query
  const getFilteredData = () => {
    const data = technicalMasterData[activeTab] || [];
    if (!searchQuery) return data;

    return data.filter(item => {
      const searchFields = ['name', 'code', 'description', 'parameter_name', 'test_name', 'result_name'];
      return searchFields.some(field => 
        item[field]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle add button click
  const handleAddClick = () => {
    if (activeTab === 'resultMaster') {
      setFormData({
        // Basic Information - using backend expected field names
        department: '',
        sub_test: '',
        test_code: '',
        test_name: '',
        result_name: '',
        parameter_name: '',

        // Result Type Configuration
        result_type: 'numeric',
        unit: '',
        decimal_places: 0,

        // Critical Values
        critical_low: '',
        critical_high: '',

        // Reference Range
        reference_range: '',
        normal_range: '',

        // Notes
        notes: '',
        description: '',

        // Formula Structure
        calculation_formula: '',
        validation_rules: '',

        // Additional fields for compatibility
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

        is_active: true
      });
    } else {
      // For dynamic tabs, initialize form with empty values based on tab structure
      const currentTab = dynamicTabs.find(tab => tab.id === activeTab);
      if (currentTab) {
        const emptyFormData = {};
        currentTab.formFields.forEach(field => {
          emptyFormData[field.name] = field.type === 'checkbox' ? false : '';
        });
        setFormData(emptyFormData);
      }
    }
    setShowAddModal(true);
  };

  // Handle edit button click
  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowEditModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (item) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  // Handle add form submission
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'resultMaster') {
        await adminAPI.addTechnicalMasterDataItem(activeTab, formData);
        // Refresh data
        const response = await adminAPI.getTechnicalMasterData();
        setTechnicalMasterData(response.data);
      } else {
        // Handle dynamic tab data submission
        const newId = Date.now(); // Simple ID generation
        const newItem = {
          id: newId,
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Update dynamic tab data
        setDynamicTabsData(prev => ({
          ...prev,
          [activeTab]: [...(prev[activeTab] || []), newItem]
        }));
      }

      setShowAddModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error adding item:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to add item');
      setShowErrorModal(true);
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'resultMaster') {
        await adminAPI.updateTechnicalMasterDataItem(activeTab, editingItem.id, formData);
        // Refresh data
        const response = await adminAPI.getTechnicalMasterData();
        setTechnicalMasterData(response.data);
      } else {
        // Handle dynamic tab data update
        const updatedItem = {
          ...editingItem,
          ...formData,
          updated_at: new Date().toISOString()
        };

        // Update dynamic tab data
        const updatedData = [...(dynamicTabsData[activeTab] || [])];
        const itemIndex = updatedData.findIndex(item => item.id === editingItem.id);
        if (itemIndex !== -1) {
          updatedData[itemIndex] = updatedItem;
          setDynamicTabsData(prev => ({
            ...prev,
            [activeTab]: updatedData
          }));
        }
      }

      setShowEditModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error updating item:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to update item');
      setShowErrorModal(true);
    }
  };

  // Handle delete confirmation
  const handleDeleteSubmit = async () => {
    try {
      if (activeTab === 'resultMaster') {
        await adminAPI.deleteTechnicalMasterDataItem(activeTab, deletingItem.id);
        // Refresh data
        const response = await adminAPI.getTechnicalMasterData();
        setTechnicalMasterData(response.data);
      } else {
        // Handle dynamic tab data deletion
        const updatedData = (dynamicTabsData[activeTab] || []).filter(
          item => item.id !== deletingItem.id
        );
        setDynamicTabsData(prev => ({
          ...prev,
          [activeTab]: updatedData
        }));
      }

      setShowDeleteModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error deleting item:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to delete item');
      setShowErrorModal(true);
    }
  };

  // Handle import success
  const handleImportSuccess = () => {
    // Refresh data after import
    const fetchData = async () => {
      try {
        const response = await adminAPI.getTechnicalMasterData();
        setTechnicalMasterData(response.data);
      } catch (err) {
        console.error('Error refreshing data:', err);
      }
    };
    fetchData();
  };

  // Excel Import Functions
  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        'Patient Name (text)': 'John Doe',
        'Age (integer)': 35,
        'Email (email)': 'john.doe@email.com',
        'Phone (phone)': '+1-555-0123',
        'Department (dropdown)': 'BIOCHEMISTRY',
        'Test Date (date)': '2024-01-15',
        'Test Time (time)': '09:30',
        'Test Code (text)': 'GLU001',
        'Test Result (decimal)': 95.5,
        'Priority Level (range)': 75,
        'Notes (textarea)': 'Patient fasted for 12 hours before test. Blood drawn from left arm.',
        'Critical Alert (checkbox)': false,
        'Status (dropdown)': 'Completed',
        'Report URL (url)': 'https://lab.example.com/report/123',
        'Sample Color (color)': '#FF5733'
      },
      {
        'Patient Name (text)': 'Jane Smith',
        'Age (integer)': 28,
        'Email (email)': 'jane.smith@email.com',
        'Phone (phone)': '+1-555-0456',
        'Department (dropdown)': 'HEMATOLOGY',
        'Test Date (date)': '2024-01-16',
        'Test Time (time)': '14:15',
        'Test Code (text)': 'HEM002',
        'Test Result (decimal)': 12.8,
        'Priority Level (range)': 50,
        'Notes (textarea)': 'Normal hemoglobin levels. Patient reported feeling well.',
        'Critical Alert (checkbox)': false,
        'Status (dropdown)': 'Pending',
        'Report URL (url)': 'https://lab.example.com/report/124',
        'Sample Color (color)': '#33FF57'
      },
      {
        'Patient Name (text)': 'Bob Johnson',
        'Age (integer)': 45,
        'Email (email)': 'bob.johnson@email.com',
        'Phone (phone)': '+1-555-0789',
        'Department (dropdown)': 'MICROBIOLOGY',
        'Test Date (date)': '2024-01-17',
        'Test Time (time)': '11:00',
        'Test Code (text)': 'MIC003',
        'Test Result (decimal)': 0,
        'Priority Level (range)': 90,
        'Notes (textarea)': 'Culture shows no growth after 48 hours. Negative for bacterial infection.',
        'Critical Alert (checkbox)': true,
        'Status (dropdown)': 'Completed',
        'Report URL (url)': 'https://lab.example.com/report/125',
        'Sample Color (color)': '#3357FF'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dynamic Lab Results');
    XLSX.writeFile(wb, 'dynamic_form_template.xlsx');
  };

  const handleExcelFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setExcelFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length > 0) {
          setExcelData(jsonData);
          setExcelColumns(Object.keys(jsonData[0]));
          // Auto-set tab name from sheet name
          setTabName(sheetName);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const processExcelImport = () => {
    if (!excelData || !tabName) {
      setErrorMessage('Please provide tab name and upload valid Excel file');
      setShowErrorModal(true);
      return;
    }

    // Generate form fields from Excel columns
    const formFields = generateFormFields(excelData[0]);

    // Transform Excel data to use generated field names
    const transformedData = excelData.map((row, index) => {
      const transformedRow = { id: index + 1 };
      formFields.forEach(field => {
        transformedRow[field.name] = row[field.originalColumn];
      });
      transformedRow.created_at = new Date().toISOString();
      transformedRow.updated_at = new Date().toISOString();
      return transformedRow;
    });

    // Create dynamic tab structure
    const newTab = {
      id: tabName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      name: tabName,
      columns: formFields.map(field => field.name), // Use generated field names
      originalColumns: excelColumns, // Keep original for reference
      originalData: excelData, // Store original Excel data for dropdown options
      data: transformedData,
      formFields: formFields
    };

    // Add to dynamic tabs
    setDynamicTabs(prev => [...prev, newTab]);
    setDynamicTabsData(prev => ({
      ...prev,
      [newTab.id]: transformedData
    }));

    // Set active tab to the new one
    setActiveTab(newTab.id);

    // Close modal and show success
    setShowExcelImportModal(false);
    setShowSuccessModal(true);

    // Reset form
    setExcelFile(null);
    setExcelData(null);
    setExcelColumns([]);
    setTabName('');
  };

  const generateFormFields = (sampleRow) => {
    return Object.keys(sampleRow).map(key => {
      // Parse field type from column header: "Field Label (field_type)"
      const fieldTypeMatch = key.match(/\(([^)]+)\)$/);
      let fieldType = 'text'; // default
      let fieldLabel = key;

      if (fieldTypeMatch) {
        fieldType = fieldTypeMatch[1].toLowerCase().trim();
        fieldLabel = key.replace(/\s*\([^)]+\)$/, ''); // Remove (field_type) from label
      }

      // Don't validate field types - accept any field type dynamically
      // The renderFormField function will handle unknown types

      // Generate field name (snake_case from label)
      const fieldName = fieldLabel.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/_{2,}/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

      return {
        name: fieldName,
        originalColumn: key, // Keep original column name for data mapping
        label: fieldLabel,
        type: fieldType, // Keep the original field type as specified
        required: fieldLabel.toLowerCase().includes('name') ||
                 fieldLabel.toLowerCase().includes('id') ||
                 fieldLabel.toLowerCase().includes('code')
      };
    });
  };

  // Render dynamic table for imported tabs
  const renderDynamicTable = () => {
    const currentTab = dynamicTabs.find(tab => tab.id === activeTab);
    if (!currentTab) return <div>No data available</div>;

    const data = dynamicTabsData[activeTab] || [];

    return (
      <Table className="table-hover">
        <thead>
          <tr>
            {currentTab.formFields.map(field => (
              <th key={field.name}>{field.label}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.id || index}>
              {currentTab.formFields.map(field => (
                <td key={field.name}>
                  {renderTableCell(row[field.name], field.type)}
                </td>
              ))}
              <td>
                <Button
                  variant="primary"
                  size="sm"
                  className="me-1"
                  onClick={() => handleEditDynamicRow(row, index)}
                >
                  <FontAwesomeIcon icon={faEdit} />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteConfirm(row)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  // Render table cell based on field type - DYNAMIC DISPLAY
  const renderTableCell = (value, fieldType) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted">N/A</span>;
    }

    const type = fieldType.toLowerCase();

    // Boolean/Checkbox types
    if (type.includes('checkbox') || type.includes('boolean') || type.includes('toggle') || type.includes('switch')) {
      const isTrue = value === true || value === 'true' || value === 1 || value === 'yes';
      return (
        <Badge bg={isTrue ? 'success' : 'secondary'}>
          {isTrue ? 'Yes' : 'No'}
        </Badge>
      );
    }

    // Number types
    if (type.includes('number') || type.includes('numeric') || type.includes('integer') || type.includes('decimal') || type.includes('float')) {
      return <span className="text-end d-block">{Number(value).toLocaleString()}</span>;
    }

    // Long text types
    if (type.includes('textarea') || type.includes('longtext') || type.includes('multiline')) {
      return (
        <div className="text-truncate" style={{maxWidth: '200px'}} title={value}>
          {value}
        </div>
      );
    }

    // URL/Link types
    if (type.includes('url') || type.includes('link')) {
      return (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
          {value.length > 30 ? `${value.substring(0, 30)}...` : value}
        </a>
      );
    }

    // Email types
    if (type.includes('email')) {
      return (
        <a href={`mailto:${value}`} className="text-decoration-none">
          {value}
        </a>
      );
    }

    // Phone types
    if (type.includes('phone') || type.includes('tel')) {
      return (
        <a href={`tel:${value}`} className="text-decoration-none">
          {value}
        </a>
      );
    }

    // Color types
    if (type.includes('color')) {
      return (
        <div className="d-flex align-items-center">
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: value,
              border: '1px solid #ccc',
              marginRight: '8px'
            }}
          ></div>
          <span>{value}</span>
        </div>
      );
    }

    // Date types
    if (type.includes('date') || type.includes('time')) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          if (type.includes('date') && !type.includes('time')) {
            return date.toLocaleDateString();
          } else if (type.includes('time') && !type.includes('date')) {
            return date.toLocaleTimeString();
          } else {
            return date.toLocaleString();
          }
        }
      } catch (e) {
        // If date parsing fails, show as text
      }
    }

    // Range/Slider types
    if (type.includes('range') || type.includes('slider')) {
      return (
        <div className="d-flex align-items-center">
          <div className="progress" style={{width: '100px', marginRight: '8px'}}>
            <div
              className="progress-bar"
              style={{width: `${value}%`}}
            ></div>
          </div>
          <span>{value}</span>
        </div>
      );
    }

    // Default text display
    return value;
  };

  // Handle dynamic row operations
  const handleEditDynamicRow = (row, index) => {
    // Set form data for editing dynamic row
    setFormData(row);
    setEditingItem({ ...row, index });
    setShowEditModal(true);
  };

  const handleDeleteDynamicRow = (index) => {
    const updatedData = [...(dynamicTabsData[activeTab] || [])];
    updatedData.splice(index, 1);
    setDynamicTabsData(prev => ({
      ...prev,
      [activeTab]: updatedData
    }));
  };

  // Clear all dynamic tabs (for testing/management)
  const clearAllDynamicTabs = () => {
    setDynamicTabs([]);
    setDynamicTabsData({});
    setActiveTab('resultMaster');
    localStorage.removeItem('technicalMasterDynamicTabs');
    localStorage.removeItem('technicalMasterDynamicTabsData');
  };

  // Render dynamic form for imported tabs
  const renderDynamicForm = () => {
    const currentTab = dynamicTabs.find(tab => tab.id === activeTab);
    if (!currentTab) return <div>No form structure available</div>;

    return (
      <div className="border rounded p-3 mb-3">
        <h6 className="text-primary mb-3">{currentTab.name} Form</h6>
        <Row>
          {currentTab.formFields.map((field, index) => (
            <Col md={6} key={field.name} className="mb-3">
              <Form.Group>
                <Form.Label>
                  {field.label}
                  {field.required && <span className="text-danger">*</span>}
                </Form.Label>
                {renderFormField(field)}
              </Form.Group>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  // Render individual form field based on type - DYNAMIC FIELD TYPE HANDLER
  const renderFormField = (field) => {
    const value = formData[field.name] || '';
    const fieldType = field.type.toLowerCase();

    // Get unique values for dropdown/select fields from stored tab data
    const getDropdownOptions = () => {
      const currentTab = dynamicTabs.find(tab => tab.id === activeTab);
      if (!currentTab) return [];

      // First try to get options from original Excel data (for consistency)
      if (currentTab.originalData && field.originalColumn) {
        return [...new Set(
          currentTab.originalData
            .map(row => row[field.originalColumn])
            .filter(val => val !== null && val !== undefined && val !== '')
        )];
      }

      // Fallback: get data from the stored dynamic tab data
      const tabData = dynamicTabsData[activeTab] || [];
      return [...new Set(
        tabData
          .map(row => row[field.name])
          .filter(val => val !== null && val !== undefined && val !== '')
      )];
    };

    // Dynamic field type rendering based on field type name
    if (fieldType.includes('text') || fieldType === 'string') {
      return (
        <Form.Control
          type="text"
          name={field.name}
          value={value}
          onChange={handleChange}
          required={field.required}
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      );
    }

    if (fieldType.includes('textarea') || fieldType.includes('longtext') || fieldType.includes('multiline')) {
      return (
        <Form.Control
          as="textarea"
          rows={3}
          name={field.name}
          value={value}
          onChange={handleChange}
          required={field.required}
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      );
    }

    if (fieldType.includes('number') || fieldType.includes('numeric') || fieldType.includes('integer') || fieldType.includes('decimal') || fieldType.includes('float')) {
      return (
        <Form.Control
          type="number"
          name={field.name}
          value={value}
          onChange={handleChange}
          required={field.required}
          placeholder={`Enter ${field.label.toLowerCase()}`}
          step={fieldType.includes('decimal') || fieldType.includes('float') ? "0.01" : "1"}
        />
      );
    }

    if (fieldType.includes('checkbox') || fieldType.includes('boolean') || fieldType.includes('toggle') || fieldType.includes('switch')) {
      return (
        <div className="mt-2">
          <Form.Check
            type="checkbox"
            name={field.name}
            checked={value === true || value === 'true' || value === 1 || value === 'yes'}
            onChange={handleChange}
            label={`Enable ${field.label}`}
          />
        </div>
      );
    }

    if (fieldType.includes('dropdown') || fieldType.includes('select') || fieldType.includes('choice') || fieldType.includes('option')) {
      const options = getDropdownOptions();
      return (
        <Form.Select
          name={field.name}
          value={value}
          onChange={handleChange}
          required={field.required}
        >
          <option value="">Select {field.label}</option>
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </Form.Select>
      );
    }

    if (fieldType.includes('date')) {
      return (
        <Form.Control
          type="date"
          name={field.name}
          value={value}
          onChange={handleChange}
          required={field.required}
        />
      );
    }

    if (fieldType.includes('time')) {
      return (
        <Form.Control
          type="time"
          name={field.name}
          value={value}
          onChange={handleChange}
          required={field.required}
        />
      );
    }

    if (fieldType.includes('datetime') || fieldType.includes('timestamp')) {
      return (
        <Form.Control
          type="datetime-local"
          name={field.name}
          value={value}
          onChange={handleChange}
          required={field.required}
        />
      );
    }

    if (fieldType.includes('email')) {
      return (
        <Form.Control
          type="email"
          name={field.name}
          value={value}
          onChange={handleChange}
          required={field.required}
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      );
    }

    if (fieldType.includes('password')) {
      return (
        <Form.Control
          type="password"
          name={field.name}
          value={value}
          onChange={handleChange}
          required={field.required}
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      );
    }

    if (fieldType.includes('url') || fieldType.includes('link')) {
      return (
        <Form.Control
          type="url"
          name={field.name}
          value={value}
          onChange={handleChange}
          required={field.required}
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      );
    }

    if (fieldType.includes('phone') || fieldType.includes('tel')) {
      return (
        <Form.Control
          type="tel"
          name={field.name}
          value={value}
          onChange={handleChange}
          required={field.required}
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      );
    }

    if (fieldType.includes('color')) {
      return (
        <Form.Control
          type="color"
          name={field.name}
          value={value}
          onChange={handleChange}
          required={field.required}
        />
      );
    }

    if (fieldType.includes('range') || fieldType.includes('slider')) {
      return (
        <Form.Range
          name={field.name}
          value={value}
          onChange={handleChange}
          min="0"
          max="100"
        />
      );
    }

    // Default fallback for any unrecognized field type
    return (
      <div>
        <Form.Control
          type="text"
          name={field.name}
          value={value}
          onChange={handleChange}
          required={field.required}
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
        <Form.Text className="text-muted">
          Field type: <code>{field.type}</code> (rendered as text input)
        </Form.Text>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="technical-master-data-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faChartLine} className="me-2" />
          Technical Master Data Management
        </h1>
        <div>
          <Button
            variant="secondary"
            className="me-2"
            onClick={downloadSampleTemplate}
          >
            <FontAwesomeIcon icon={faDownload} className="me-2" />
            Download Template
          </Button>
          <Button
            variant="info"
            className="me-2"
            onClick={() => setShowExcelImportModal(true)}
          >
            <FontAwesomeIcon icon={faUpload} className="me-2" />
            Excel Import
          </Button>
          <Button
            variant="success"
            className="me-2"
            onClick={() => setShowExcelModal(true)}
          >
            <FontAwesomeIcon icon={faFileExcel} className="me-2" />
            Export Data
          </Button>
          {/* {dynamicTabs.length > 0 && (
            <Button
              variant="warning"
              className="me-2"
              onClick={clearAllDynamicTabs}
              size="sm"
            >
              <FontAwesomeIcon icon={faTrash} className="me-2" />
              Clear All Tabs
            </Button>
          )} */}
          <Button variant="primary" onClick={handleAddClick}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add New
          </Button>
        </div>
      </div>

      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <Tabs
            activeKey={activeTab}
            onSelect={setActiveTab}
            className="mb-0"
          >
            <Tab
              eventKey="resultMaster"
              title={<><FontAwesomeIcon icon={faChartLine} className="me-2" />Result Master</>}
            />
            {dynamicTabs.map(tab => (
              <Tab
                key={tab.id}
                eventKey={tab.id}
                title={<><FontAwesomeIcon icon={faDatabase} className="me-2" />{tab.name}</>}
              />
            ))}
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
              {activeTab === 'resultMaster' ? (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Test Code</th>
                      <th>Test Name</th>
                      <th>Result Type</th>
                      <th>Unit</th>
                      <th>Critical Range</th>
                      <th>Reference Range</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map(result => (
                      <tr key={result.id}>
                        <td>{result.department || 'N/A'}</td>
                        <td>{result.test_code || result.code}</td>
                        <td>{result.test_name || result.result_name || result.name}</td>
                        <td>
                          <Badge bg={result.result_type === 'numeric' ? 'primary' : 'info'}>
                            {result.result_type || 'numeric'}
                          </Badge>
                        </td>
                        <td>{result.unit || 'N/A'}</td>
                        <td>
                          <small>
                            L: {result.critical_low || 'N/A'} |
                            H: {result.critical_high || 'N/A'}
                          </small>
                        </td>
                        <td>
                          <div className="text-truncate" style={{maxWidth: '150px'}}>
                            {result.reference_range || result.normal_range || 'N/A'}
                          </div>
                        </td>
                        <td>
                          <Badge bg={result.is_active ? 'success' : 'danger'}>
                            {result.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(result)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(result)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                // Dynamic table for imported tabs
                renderDynamicTable()
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteSubmit}
        title="Confirm Delete"
        message={`Are you sure you want to delete "${deletingItem?.name || deletingItem?.result_name || deletingItem?.parameter_name}"?`}
      />

      {/* Add Modal */}
      <FormModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSubmit={handleAddSubmit}
        title={activeTab === 'resultMaster' ? 'Add New Result Master' : `Add New ${dynamicTabs.find(tab => tab.id === activeTab)?.name || 'Item'}`}
      >
        {activeTab === 'resultMaster' ? (
          /* Comprehensive Result Master Form */
          <>
          {/* Basic Information Section */}
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
                    <option value="HEMATOLOGY">HEMATOLOGY</option>
                    <option value="MICROBIOLOGY">MICROBIOLOGY</option>
                    <option value="IMMUNOLOGY">IMMUNOLOGY</option>
                    <option value="PATHOLOGY">PATHOLOGY</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sub Test</Form.Label>
                  <Form.Select
                    name="sub_test"
                    value={formData.sub_test}
                    onChange={handleChange}
                  >
                    <option value="">Select Sub Test</option>
                    <option value="GLUCOSE">GLUCOSE</option>
                    <option value="UREA">UREA</option>
                    <option value="CREATININE">CREATININE</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <TextInput
                  name="test_code"
                  label="Test Code*"
                  value={formData.test_code}
                  onChange={handleChange}
                  required
                  placeholder="000238"
                />
              </Col>
              <Col md={6}>
                <div className="d-flex align-items-center">
                  <TextInput
                    name="test_name"
                    label="Test Name*"
                    value={formData.test_name}
                    onChange={handleChange}
                    required
                    placeholder="Glucose, 120 min"
                  />
                  <Button variant="outline-secondary" className="ms-2 mt-4">
                    <FontAwesomeIcon icon={faSearch} />
                  </Button>
                </div>
              </Col>
            </Row>
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
              </Col>
            </Row>
          </div>

          {/* Result Type Configuration */}
          <div className="border rounded p-3 mb-3">
            <h6 className="text-primary mb-3">Result Type Configuration</h6>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Result Type*</Form.Label>
                  <div className="d-flex flex-wrap gap-3">
                    <Form.Check
                      type="radio"
                      name="result_type"
                      value="numeric"
                      label="Numeric"
                      checked={formData.result_type === 'numeric'}
                      onChange={handleChange}
                    />
                    <Form.Check
                      type="radio"
                      name="result_type"
                      value="calculated"
                      label="Calculated"
                      checked={formData.result_type === 'calculated'}
                      onChange={handleChange}
                    />
                    <Form.Check
                      type="radio"
                      name="result_type"
                      value="picklist"
                      label="Pick List"
                      checked={formData.result_type === 'picklist'}
                      onChange={handleChange}
                    />
                    <Form.Check
                      type="radio"
                      name="result_type"
                      value="noLimit"
                      label="No Limit / Ref. Value"
                      checked={formData.result_type === 'noLimit'}
                      onChange={handleChange}
                    />
                    <Form.Check
                      type="radio"
                      name="result_type"
                      value="culture"
                      label="Culture"
                      checked={formData.result_type === 'culture'}
                      onChange={handleChange}
                    />
                    <Form.Check
                      type="radio"
                      name="result_type"
                      value="template"
                      label="Template"
                      checked={formData.result_type === 'template'}
                      onChange={handleChange}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Result Unit</Form.Label>
                  <Form.Select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                  >
                    <option value="">Select Unit</option>
                    <option value="mg/dl">mg/dl</option>
                    <option value="mmol/L">mmol/L</option>
                    <option value="g/dL">g/dL</option>
                    <option value="IU/L">IU/L</option>
                    <option value="U/L">U/L</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <NumberInput
                  name="decimal_places"
                  label="No of Decimals"
                  value={formData.decimal_places}
                  onChange={handleChange}
                  min={0}
                  max={5}
                  placeholder="0"
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
                  placeholder="0.00"
                />
              </Col>
              <Col md={6}>
                <NumberInput
                  name="critical_high"
                  label="Critical High"
                  value={formData.critical_high}
                  onChange={handleChange}
                  step={0.01}
                  placeholder="0.00"
                />
              </Col>
            </Row>
          </div>

          {/* Options Section */}
          <div className="border rounded p-3 mb-3">
            <h6 className="text-primary mb-3">Options</h6>
            <Row>
              <Col md={4}>
                <Form.Check
                  type="checkbox"
                  name="noResult"
                  label="No Result"
                  checked={formData.noResult}
                  onChange={handleChange}
                />
                <Form.Check
                  type="checkbox"
                  name="attachImage"
                  label="Attach Image"
                  checked={formData.attachImage}
                  onChange={handleChange}
                />
                <Form.Check
                  type="checkbox"
                  name="editReferenceRange"
                  label="Edit Reference Range"
                  checked={formData.editReferenceRange}
                  onChange={handleChange}
                />
              </Col>
              <Col md={4}>
                <Form.Check
                  type="checkbox"
                  name="printBlankPage"
                  label="Print Blank Page"
                  checked={formData.printBlankPage}
                  onChange={handleChange}
                />
                <Form.Check
                  type="checkbox"
                  name="separatePage"
                  label="Separate Page"
                  checked={formData.separatePage}
                  onChange={handleChange}
                />
                <Form.Check
                  type="checkbox"
                  name="covidResult"
                  label="Covid Result"
                  checked={formData.covidResult}
                  onChange={handleChange}
                />
              </Col>
              <Col md={4}>
                <Form.Check
                  type="checkbox"
                  name="printGraph"
                  label="Print Graph"
                  checked={formData.printGraph}
                  onChange={handleChange}
                />
                <Form.Check
                  type="checkbox"
                  name="printPatientTrendGraph"
                  label="Print Patient Trend Graph"
                  checked={formData.printPatientTrendGraph}
                  onChange={handleChange}
                />
              </Col>
            </Row>
          </div>

          {/* Reference Range Section */}
          <div className="border rounded p-3 mb-3">
            <h6 className="text-primary mb-3">Reference Range</h6>
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
                    placeholder="Less than 150"
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Notes Section */}
          <div className="border rounded p-3 mb-3">
            <h6 className="text-primary mb-3">Notes</h6>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter notes here..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Formula Structure Section */}
          <div className="border rounded p-3 mb-3">
            <h6 className="text-primary mb-3">Formula Structure</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Formula Test</Form.Label>
                  <div className="d-flex">
                    <Form.Select
                      name="formulaTest"
                      value={formData.formulaTest}
                      onChange={handleChange}
                    >
                      <option value="">Select Formula Test</option>
                      <option value="test1">Test 1</option>
                      <option value="test2">Test 2</option>
                    </Form.Select>
                    <Button variant="outline-secondary" className="ms-2">
                      <FontAwesomeIcon icon={faPlus} />
                    </Button>
                  </div>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Age</Form.Label>
                  <Form.Control
                    type="text"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Age"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Operator</Form.Label>
                  <div className="d-flex">
                    <Form.Select
                      name="operator"
                      value={formData.operator}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      <option value="+">+</option>
                      <option value="-">-</option>
                      <option value="*">*</option>
                      <option value="/">/</option>
                    </Form.Select>
                    <Button variant="outline-secondary" className="ms-2">
                      <FontAwesomeIcon icon={faPlus} />
                    </Button>
                  </div>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Formula</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="calculation_formula"
                    value={formData.calculation_formula}
                    onChange={handleChange}
                    placeholder="Enter formula"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Validation Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="validation_rules"
                    value={formData.validation_rules}
                    onChange={handleChange}
                    placeholder="Enter validation message"
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Age/Gender-wise Reference Range Section */}
          <div className="border rounded p-3 mb-3">
            <h6 className="text-primary mb-3">Age/Gender-wise Reference Range</h6>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender</Form.Label>
                  <div className="d-flex gap-3">
                    <Form.Check
                      type="radio"
                      name="genderType"
                      value="male"
                      label="Male"
                      checked={formData.genderType === 'male'}
                      onChange={handleChange}
                    />
                    <Form.Check
                      type="radio"
                      name="genderType"
                      value="female"
                      label="Female"
                      checked={formData.genderType === 'female'}
                      onChange={handleChange}
                    />
                    <Form.Check
                      type="radio"
                      name="genderType"
                      value="both"
                      label="Both"
                      checked={formData.genderType === 'both'}
                      onChange={handleChange}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>From Age</Form.Label>
                  <div className="d-flex">
                    <Form.Control
                      type="number"
                      name="fromAge"
                      value={formData.fromAge}
                      onChange={handleChange}
                      placeholder="0"
                    />
                    <Form.Select
                      name="ageUnit"
                      value={formData.ageUnit}
                      onChange={handleChange}
                      className="ms-2"
                      style={{maxWidth: '100px'}}
                    >
                      <option value="years">Years</option>
                      <option value="months">Months</option>
                      <option value="days">Days</option>
                    </Form.Select>
                  </div>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>To Age</Form.Label>
                  <div className="d-flex">
                    <Form.Control
                      type="number"
                      name="toAge"
                      value={formData.toAge}
                      onChange={handleChange}
                      placeholder="100"
                    />
                    <Form.Select
                      name="ageUnit"
                      value={formData.ageUnit}
                      onChange={handleChange}
                      className="ms-2"
                      style={{maxWidth: '100px'}}
                    >
                      <option value="years">Years</option>
                      <option value="months">Months</option>
                      <option value="days">Days</option>
                    </Form.Select>
                  </div>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>From Value</Form.Label>
                  <Form.Control
                    type="number"
                    name="fromValue"
                    value={formData.fromValue}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>To Value</Form.Label>
                  <Form.Control
                    type="number"
                    name="toValue"
                    value={formData.toValue}
                    onChange={handleChange}
                    placeholder="100"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Display Ref Range</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="displayRefRange"
                    value={formData.displayRefRange}
                    onChange={handleChange}
                    placeholder="Enter display reference range"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Critical Low</Form.Label>
                  <Form.Control
                    type="number"
                    name="criticalLow"
                    value={formData.criticalLow}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Critical High</Form.Label>
                  <Form.Control
                    type="number"
                    name="criticalHigh"
                    value={formData.criticalHigh}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12} className="text-end">
                <Button variant="success" className="me-2">
                  <FontAwesomeIcon icon={faPlus} className="me-1" />
                  Add
                </Button>
              </Col>
            </Row>
          </div>
        </>
        ) : (
          /* Dynamic Form for imported tabs */
          renderDynamicForm()
        )}
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        title={activeTab === 'resultMaster' ? 'Edit Result Master' : `Edit ${dynamicTabs.find(tab => tab.id === activeTab)?.name || 'Item'}`}
        submitText="Save Changes"
      >
        {activeTab === 'resultMaster' ? (
          /* Same comprehensive form as Add Modal */
          <>
          {/* Basic Information Section */}
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
                  <option value="HEMATOLOGY">HEMATOLOGY</option>
                  <option value="MICROBIOLOGY">MICROBIOLOGY</option>
                  <option value="IMMUNOLOGY">IMMUNOLOGY</option>
                  <option value="PATHOLOGY">PATHOLOGY</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Sub Test</Form.Label>
                <Form.Select
                  name="sub_test"
                  value={formData.sub_test}
                  onChange={handleChange}
                >
                  <option value="">Select Sub Test</option>
                  <option value="GLUCOSE">GLUCOSE</option>
                  <option value="UREA">UREA</option>
                  <option value="CREATININE">CREATININE</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <TextInput
                name="test_code"
                label="Test Code*"
                value={formData.test_code}
                onChange={handleChange}
                required
                placeholder="000238"
              />
            </Col>
            <Col md={6}>
              <div className="d-flex align-items-center">
                <TextInput
                  name="test_name"
                  label="Test Name*"
                  value={formData.test_name}
                  onChange={handleChange}
                  required
                  placeholder="Glucose, 120 min"
                />
                <Button variant="outline-secondary" className="ms-2 mt-4">
                  <FontAwesomeIcon icon={faSearch} />
                </Button>
              </div>
            </Col>
          </Row>
        </div>

        {/* Result Type Configuration */}
        <div className="border rounded p-3 mb-3">
          <h6 className="text-primary mb-3">Result Type Configuration</h6>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Result Type*</Form.Label>
                <div className="d-flex flex-wrap gap-3">
                  <Form.Check
                    type="radio"
                    name="result_type"
                    value="numeric"
                    label="Numeric"
                    checked={formData.result_type === 'numeric'}
                    onChange={handleChange}
                  />
                  <Form.Check
                    type="radio"
                    name="result_type"
                    value="calculated"
                    label="Calculated"
                    checked={formData.result_type === 'calculated'}
                    onChange={handleChange}
                  />
                  <Form.Check
                    type="radio"
                    name="result_type"
                    value="picklist"
                    label="Pick List"
                    checked={formData.result_type === 'picklist'}
                    onChange={handleChange}
                  />
                  <Form.Check
                    type="radio"
                    name="result_type"
                    value="noLimit"
                    label="No Limit / Ref. Value"
                    checked={formData.result_type === 'noLimit'}
                    onChange={handleChange}
                  />
                  <Form.Check
                    type="radio"
                    name="result_type"
                    value="culture"
                    label="Culture"
                    checked={formData.result_type === 'culture'}
                    onChange={handleChange}
                  />
                  <Form.Check
                    type="radio"
                    name="result_type"
                    value="template"
                    label="Template"
                    checked={formData.result_type === 'template'}
                    onChange={handleChange}
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Result Unit</Form.Label>
                <Form.Select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                >
                  <option value="">Select Unit</option>
                  <option value="mg/dl">mg/dl</option>
                  <option value="mmol/L">mmol/L</option>
                  <option value="g/dL">g/dL</option>
                  <option value="IU/L">IU/L</option>
                  <option value="U/L">U/L</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <NumberInput
                name="decimal_places"
                label="No of Decimals"
                value={formData.decimal_places}
                onChange={handleChange}
                min={0}
                max={5}
                placeholder="0"
              />
            </Col>
          </Row>
        </div>

        {/* Active Status */}
        <div className="border rounded p-3 mb-3">
          <Form.Check
            type="switch"
            id="is_active_edit"
            name="is_active"
            label="Active"
            checked={formData.is_active}
            onChange={handleChange}
          />
        </div>
        </>
        ) : (
          /* Dynamic Form for imported tabs */
          renderDynamicForm()
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

      {/* Excel Import Modal */}
      <Modal show={showExcelImportModal} onHide={() => setShowExcelImportModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faUpload} className="me-2" />
            📁 Excel Import – Dynamic Form Generator
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="mb-4">
            <h6>🧠 Dynamic Field Naming Convention:</h6>
            <p className="mb-2">Column headers must be formatted as: <strong>"Field Label (field_type)"</strong></p>
            <p className="mb-2">🎯 Supported field types (examples):</p>
            <div className="row">
              <div className="col-md-6">
                <ul className="mb-0 small">
                  <li><code>text</code> → Single-line input</li>
                  <li><code>textarea</code> → Multi-line text</li>
                  <li><code>number/integer/decimal</code> → Numeric input</li>
                  <li><code>checkbox/boolean</code> → TRUE/FALSE toggle</li>
                  <li><code>dropdown/select</code> → Select options</li>
                  <li><code>date</code> → Date picker</li>
                </ul>
              </div>
              <div className="col-md-6">
                <ul className="mb-0 small">
                  <li><code>time</code> → Time picker</li>
                  <li><code>email</code> → Email input</li>
                  <li><code>phone/tel</code> → Phone input</li>
                  <li><code>url/link</code> → URL input</li>
                  <li><code>color</code> → Color picker</li>
                  <li><code>range/slider</code> → Range slider</li>
                </ul>
              </div>
            </div>
            <p className="mb-0 mt-2"><strong>✨ Any field type name will work!</strong> The system dynamically creates appropriate form fields.</p>
          </Alert>

          <Form>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Tab Name (Auto-detected from Sheet Name)</Form.Label>
                  <Form.Control
                    type="text"
                    value={tabName}
                    onChange={(e) => setTabName(e.target.value)}
                    placeholder="Will be auto-filled from Excel sheet name"
                  />
                  <Form.Text className="text-muted">
                    The tab name will be automatically set from your Excel sheet name. You can modify it if needed.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Upload Excel File*</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelFileChange}
                    required
                  />
                  <Form.Text className="text-muted">
                    Upload an Excel file (.xlsx or .xls). Column headers should follow the naming convention above.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            {excelData && (
              <Row>
                <Col md={12}>
                  <Alert variant="success">
                    <strong>✅ Preview:</strong> Found {excelData.length} rows. Tab will be created as: <strong>"{tabName}"</strong>
                  </Alert>

                  {/* Field Analysis */}
                  <div className="mb-3">
                    <h6>🎯 Detected Form Fields:</h6>
                    <div className="row">
                      {generateFormFields(excelData[0]).map(field => (
                        <div key={field.name} className="col-md-6 mb-2">
                          <Badge bg="primary" className="me-2">{field.type}</Badge>
                          <span>{field.label}</span>
                          {field.required && <Badge bg="danger" className="ms-1">Required</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Data Preview */}
                  <div className="table-responsive" style={{maxHeight: '300px', overflowY: 'auto'}}>
                    <Table striped bordered size="sm">
                      <thead>
                        <tr>
                          {generateFormFields(excelData[0]).map(field => (
                            <th key={field.name}>
                              {field.label}
                              <br />
                              <Badge bg="secondary" className="small">{field.type}</Badge>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {excelData.slice(0, 5).map((row, index) => (
                          <tr key={index}>
                            {generateFormFields(excelData[0]).map(field => (
                              <td key={field.name}>
                                {renderTableCell(row[field.originalColumn], field.type)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    {excelData.length > 5 && (
                      <small className="text-muted">Showing first 5 rows of {excelData.length} total rows</small>
                    )}
                  </div>
                </Col>
              </Row>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExcelImportModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={processExcelImport}
            disabled={!excelData || !tabName}
          >
            <FontAwesomeIcon icon={faUpload} className="me-2" />
            Create Tab & Import Data
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TechnicalMasterData;
