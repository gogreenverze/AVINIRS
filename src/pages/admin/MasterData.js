import React, { useState, useEffect } from 'react';
import { Card, Button, Form, InputGroup, Table, Badge, Tabs, Tab, Alert, Row, Col, Collapse, Nav } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDatabase, faPlus, faEdit, faTrash, faSearch, faExclamationTriangle,
  faFlask, faVial, faFileInvoiceDollar, faUserMd,
  faBoxes, faMicroscope, faEyeDropper, faTruck,
  faRulerHorizontal, faCalculator, faCogs, faFileExcel, faFileImport,
  faUsers, faClipboardList, faBug, faShieldAlt, faCog,
  faPrint, faBuilding, faKey, faLayerGroup, faDownload,
  faChevronDown, faChevronUp, faBars
} from '@fortawesome/free-solid-svg-icons';
import Select from 'react-select';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { adminAPI } from '../../services/api';
import {
  TextInput,
  NumberInput,
  DeleteConfirmationModal,
  SuccessModal,
  ErrorModal,
  FormModal
} from '../../components/common';
import ExcelImportExport from '../../components/admin/ExcelImportExport';
import BulkDataImport from '../../components/admin/BulkDataImport';
import MobileDataCard from '../../components/admin/MobileDataCard';
import ResponsiveDataTable from '../../components/admin/ResponsiveDataTable';
import * as XLSX from 'xlsx';
import '../../styles/MasterData.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
// import '../../styles/MuiIntegration.css';


// Enhanced Searchable Dropdown Component with Add New Option functionality
const SearchableDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  name,
  label,
  isRequired = false,
  isDisabled = false,
  isClearable = true,
  isLoading = false,
  isMulti = false,
  allowAddNew = true,
  onAddNew = null,
  getOptionLabel = (option) => option.label || option.name || option.description || option.method || option.specimen || option.test_profile || option,
  getOptionValue = (option) => option.value || option.id || option,
  variant = "mui" // "mui" or "react-select"
}) => {
  if (variant === "mui") {
    // MUI Autocomplete implementation with Add New Option support
    const formattedOptions = options.map(option => ({
      label: getOptionLabel(option),
      value: getOptionValue(option),
      ...option
    }));

    // Handle multi-select values
    let selectedValue;
    if (isMulti) {
      selectedValue = Array.isArray(value)
        ? formattedOptions.filter(option => value.includes(option.value))
        : [];
    } else {
      selectedValue = formattedOptions?.find(option => option.value === value) || null;
    }

    return (
      <Autocomplete
        multiple={isMulti}
        options={formattedOptions}
        getOptionLabel={(option) => option.label || ''}
        value={selectedValue}
        onChange={(event, newValue) => {
          if (isMulti) {
            const values = Array.isArray(newValue) ? newValue.map(item => item.value) : [];
            const syntheticEvent = {
              target: {
                name: name,
                value: values
              }
            };
            onChange(syntheticEvent);
          } else {
            const syntheticEvent = {
              target: {
                name: name,
                value: newValue ? newValue.value : ''
              }
            };
            onChange(syntheticEvent);
          }
        }}
        loading={isLoading}
        disabled={isDisabled}
        clearOnEscape
        disableClearable={!isClearable}
        freeSolo={allowAddNew}
        selectOnFocus={allowAddNew}
        clearOnBlur={allowAddNew}
        handleHomeEndKeys={allowAddNew}
    filterOptions={(options, params) => {
  const filtered = options.filter(option => {
    const label = typeof option.label === "string" ? option.label : String(option.label || "");
    return label.toLowerCase().includes(params.inputValue.toLowerCase());
  });

  const { inputValue } = params;
  const isExisting = options.some(
    (option) => String(option.label || "").toLowerCase() === inputValue.toLowerCase()
  );

  if (inputValue !== '' && !isExisting && allowAddNew) {
    filtered.push({
      label: `Add "${inputValue}"`,
      value: `new_${inputValue}`,
      isNew: true,
      inputValue: inputValue
    });
  }

  return filtered;
}}

        renderOption={(props, option) => (
          <li {...props} style={{ fontStyle: option.isNew ? 'italic' : 'normal' }}>
            {option.label}
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            required={isRequired}
            variant="outlined"
            size="small"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.875rem',
                '& fieldset': {
                  borderColor: '#ced4da',
                },
                '&:hover fieldset': {
                  borderColor: '#80bdff',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#80bdff',
                  boxShadow: '0 0 0 0.2rem rgba(0, 123, 255, 0.25)',
                },
              },
            }}
          />
        )}
        noOptionsText="No options found"
        loadingText="Loading..."
      />
    );
  } else {
    // React-Select implementation (fallback)
    const formattedOptions = options.map(option => ({
      label: getOptionLabel(option),
      value: getOptionValue(option),
      ...option
    }));

    const selectedOption = formattedOptions?.find(option => option.value === value) || null;

    const customStyles = {
      control: (provided, state) => ({
        ...provided,
        borderColor: state.isFocused ? '#80bdff' : '#ced4da',
        boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : 'none',
        '&:hover': {
          borderColor: '#80bdff'
        }
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#007bff' : state.isFocused ? '#f8f9fa' : 'white',
        color: state.isSelected ? 'white' : '#212529'
      }),
      noOptionsMessage: (provided) => ({
        ...provided,
        color: '#6c757d',
        fontStyle: 'italic'
      })
    };

    return (
      <Select
        options={formattedOptions}
        value={selectedOption}
        onChange={(selectedOption) => {
          const event = {
            target: {
              name: name,
              value: selectedOption ? selectedOption.value : ''
            }
          };
          onChange(event);
        }}
        placeholder={placeholder}
        isSearchable={true}
        isClearable={isClearable}
        isDisabled={isDisabled}
        isLoading={isLoading}
        styles={customStyles}
        noOptionsMessage={() => "No options found"}
        loadingMessage={() => "Loading..."}
        className="react-select-container"
        classNamePrefix="react-select"
      />
    );
  }
};

// Legacy SearchableSelect for backward compatibility
const SearchableSelect = SearchableDropdown;

const MasterData = () => {
  // State for master data
  const [masterData, setMasterData] = useState({
    // Original categories
    testCategories: [],
    testParameters: [],
    sampleTypes: [],
    departments: [],
    paymentMethods: [],
    containers: [],
    instruments: [],
    reagents: [],
    suppliers: [],
    units: [],
    testMethods: [],
    // New categories from Excel
    patients: [],
    profileMaster: [],
    methodMaster: [],
    antibioticMaster: [],
    organismMaster: [],
    unitOfMeasurement: [],
    specimenMaster: [],
    organismVsAntibiotic: [],
    containerMaster: [],
    mainDepartmentMaster: [],
    departmentSettings: [],
    authorizationSettings: [],
    printOrder: [],
    // Test Master
    testMaster: [],
    // Sub Test Master
    subTestMaster: [],
    // Department Master (comprehensive)
    departmentMaster: []
  });
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { tenantData, accessibleTenants, currentTenantContext } = useTenant();
  const [referrers, setReferrers] = useState([]);
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('testCategories');
  const [searchQuery, setSearchQuery] = useState('');
  const [tabSearchQuery, setTabSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [actionsCollapsed, setActionsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [navigationView, setNavigationView] = useState('categories'); // 'categories' or 'list'
  const [openCategories, setOpenCategories] = useState(new Set(['test-management'])); // Default open category
  // Master data
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [testProfiles, setTestProfiles] = useState([]);
  const [newTestItem, setNewTestItem] = useState({
    testName: '',
    test_id: null,
    amount: 0.00
  });

  // Excel data integration states
  const [excelDataLoading, setExcelDataLoading] = useState(false);
  const [excelDataError, setExcelDataError] = useState(null);
  const [excelDataCache, setExcelDataCache] = useState(null);
  const [excelDataLastFetch, setExcelDataLastFetch] = useState(null);

  // Form state
  const [formData, setFormData] = useState({});




  // Test Master specific state
  const [subTests, setSubTests] = useState([]);
  const [availableSubTests, setAvailableSubTests] = useState([]);
  const [selectedSubTests, setSelectedSubTests] = useState([]);
  const [testMasterFormData, setTestMasterFormData] = useState({
    // Basic Information
    department: '',
    testName: '',
    emrClassification: '',
    shortName: '',
    displayName: '',
    hmsCode: '',
    internationalCode: '',
    method: '',
    methodCode: '',
    primarySpecimen: '',
    primarySpecimenCode: '',
    specimen: [],
    specimenCode: '',
    container: '',
    containerCode: '',
    interpretation: '',
    instructions: '',
    specialReport: '',
    reportName: '',
    // Reference & Results
    reference_range: '',
    result_unit: '',
    decimals: 0,
    critical_low: null,
    critical_high: null,
    test_price: 0,
    // Settings tab
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
    serviceTime: '',
    applicableTo: 'both',
    reportingDays: 0,
    testDoneOn: [],
    // Alert & Notification
    alertMessage: '',
    alertPeriod: '',
    alertSMS: false,
    // Sub-tests
    subTests: [],
    // Options tab
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
    is_active: true
  });

  // Profile Data specific state
  const [profileDataSubTab, setProfileDataSubTab] = useState('testSubProcess');
  const [showTestMasterForm, setShowTestMasterForm] = useState(false);
  // GST configurations
  const [gstConfigs, setGstConfigs] = useState([]);
  const [defaultGstRate, setDefaultGstRate] = useState(18.00);

  // Test Master sub-tabs state
  const [testMasterSubTab, setTestMasterSubTab] = useState('addTest');

  // Profile Master sub-tabs state
  const [profileMasterSubTab, setProfileMasterSubTab] = useState('basic');

  // Add test item
 const addTestItem = () => {
  setError(null);
  const { test_id, testName, amount } = formData.currentTest;

  if (!test_id || !testName) {
    setError('Please select a test');
    return;
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount < 0) {
    setError('Please enter a valid amount (0 or greater)');
    return;
  }

  // Duplicate check
  if (formData.testItems.some(item => item.test_id === test_id)) {
    setError('This test has already been added');
    return;
  }

  // Add to testItems
  setFormData(prev => ({
    ...prev,
    testItems: [...prev.testItems, { ...prev.currentTest, amount: parsedAmount }],
    currentTest: { test_id: null, testName: '', amount: 0.00 } // reset only current test
  }));
};

  // Remove test item
  const removeTestItem = (id) => {
    setFormData(prev => ({
      ...prev,
      testItems: prev.testItems.filter(item => item.id !== id)
    }));
  };



  const handleTestItemChange = (e) => {
    const { name, value } = e.target;
    setNewTestItem(prev => {
      const updated = { ...prev, [name]: value };

      // If test name is selected, auto-fill all available fields from Excel data
      if (name === 'testName') {
        const selectedProfile = testProfiles?.find(profile => profile.id === value);
        if (selectedProfile) {
          updated.amount = parseFloat(selectedProfile.test_price) || 0;
          updated.test_id = selectedProfile.id;

          // Store comprehensive test data for later use
          updated.selectedTestData = selectedProfile;
        }
      }

      return updated;
    });
  };

  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);


  // Get branches based on user role and franchise access
  const getBranchesForUser = () => {
    if (!currentUser || !tenantData) return [];

    // For Mayiladuthurai (Hub Admin) and Admin roles: show ALL available franchises/branches
    if (currentUser.role === 'admin' || currentUser.role === 'hub_admin') {
      // Check if user is from Mayiladuthurai hub (can see all franchises)
      if (tenantData.is_hub || currentUser.role === 'admin') {
        return accessibleTenants || [];
      }
    }

    // For all other franchise roles: show only their specific assigned franchise
    // This includes franchise_admin and any other non-admin roles
    if (currentUser.role === 'franchise_admin' || currentUser.role !== 'admin') {
      // Use accessibleTenants if available (should contain their own franchise)
      if (accessibleTenants && accessibleTenants?.length > 0) {
        return accessibleTenants;
      }
      // Fallback to tenantData (their own franchise only)
      return [tenantData];
    }

    // Default fallback for other roles
    return [tenantData];
  };


  // Fetch master data
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await adminAPI.getMasterData();

        // Ensure we have a valid data structure
        const data = response.data || {};

        // Initialize empty arrays for any missing categories
        const initializedData = {
          testCategories: data.testCategories || [],
          testParameters: data.testParameters || [],
          sampleTypes: data.sampleTypes || [],
          departments: data.departments || [],
          paymentMethods: data.paymentMethods || [],
          containers: data.containers || [],
          instruments: data.instruments || [],
          reagents: data.reagents || [],
          suppliers: data.suppliers || [],
          units: data.units || [],
          testMethods: data.testMethods || [],
          patients: data.patients || [],
          profileMaster: data.profileMaster || [],
          methodMaster: data.methodMaster || [],
          antibioticMaster: data.antibioticMaster || [],
          organismMaster: data.organismMaster || [],
          unitOfMeasurement: data.unitOfMeasurement || [],
          specimenMaster: data.specimenMaster || [],
          organismVsAntibiotic: data.organismVsAntibiotic || [],
          containerMaster: data.containerMaster || [],
          mainDepartmentMaster: data.mainDepartmentMaster || [],
          departmentSettings: data.departmentSettings || [],
          authorizationSettings: data.authorizationSettings || [],
          printOrder: data.printOrder || [],
          testMaster: data.testMaster || [],
          subTestMaster: data.subTestMaster || [],
          departmentMaster: data.departmentMaster || []
        };

        // Add some sample data for testing if arrays are empty
        if (initializedData.testCategories?.length === 0) {
          initializedData.testCategories = [
            { id: 1, name: 'Hematology', description: 'Blood tests and analysis', is_active: true },
            { id: 2, name: 'Biochemistry', description: 'Chemical analysis of body fluids', is_active: true },
            { id: 3, name: 'Microbiology', description: 'Bacterial and viral testing', is_active: true }
          ];
        }

        if (initializedData.departments?.length === 0) {
          initializedData.departments = [
            { id: 1, code: 'HEMA', department: 'Hematology', test_profile: 'Complete Blood Count', test_price: 250.00, is_active: true },
            { id: 2, code: 'BIOC', department: 'Biochemistry', test_profile: 'Liver Function Test', test_price: 450.00, is_active: true },
            { id: 3, code: 'MICR', department: 'Microbiology', test_profile: 'Culture & Sensitivity', test_price: 350.00, is_active: true }
          ];
        }

        if (initializedData.paymentMethods?.length === 0) {
          initializedData.paymentMethods = [
            { id: 1, name: 'Cash', description: 'Cash payment', is_online: false, is_active: true },
            { id: 2, name: 'Credit Card', description: 'Credit card payment', is_online: true, is_active: true },
            { id: 3, name: 'UPI', description: 'UPI payment', is_online: true, is_active: true }
          ];
        }

        setMasterData(initializedData);

        // Debug logging for master data
        console.log('Master Data Loaded:', {
          methodMaster: initializedData.methodMaster?.length || 0,
          specimenMaster: initializedData.specimenMaster?.length || 0,
          containerMaster: initializedData.containerMaster?.length || 0,
          testMaster: initializedData.testMaster?.length || 0
        });

        // Set available sub-tests for the dropdown
        setAvailableSubTests(initializedData.subTestMaster || []);
      } catch (err) {
        console.error('Error fetching master data:', err);
        setError('Failed to load master data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMasterData();
  }, []);

  // Helper function to get test profile options
  const getTestProfileOptions = () => {
    return (masterData.departments || []).map(dept => ({
      label: dept.test_profile || dept.name || dept.department,
      value: dept.test_profile || dept.name || dept.department,
      id: dept.id,
      ...dept
    }));
  };

  // Helper function to get department options
  const getDepartmentOptions = () => {
    return (masterData.departments || []).map(dept => ({
      label: dept.department || dept.name || dept.test_profile || `Department ${dept.id}`,
      value: dept.id,
      id: dept.id,
      code: dept.code,
      department: dept.department,
      test_profile: dept.test_profile,
      ...dept
    }));
  };

  // Enhanced function to get all departments for search
  const getAllDepartments = () => {
    // Combine departments from different sources
    const departments = masterData.departments || [];
    const mainDepartments = masterData.mainDepartmentMaster || [];

    // Create a unified list
    const allDepts = [
      ...departments.map(dept => ({
        ...dept,
        source: 'departments'
      })),
      ...mainDepartments.map(dept => ({
        ...dept,
        source: 'mainDepartmentMaster'
      }))
    ];

    // Remove duplicates based on name or id
    const uniqueDepts = allDepts.filter((dept, index, self) =>
      index === self?.findIndex(d =>
        (d.department === dept.department && d.department) ||
        (d.name === dept.name && d.name) ||
        d.id === dept.id
      )
    );

    return uniqueDepts.map(dept => ({
      label: dept.department || dept.name || dept.test_profile || `Department ${dept.id}`,
      value: dept.id,
      id: dept.id,
      code: dept.code,
      department: dept.department || dept.name,
      test_profile: dept.test_profile,
      source: dept.source,
      ...dept
    }));
  };

  // Helper function to get options for any master data type
  const getMasterDataOptions = (dataType, labelField = 'name', valueField = 'id') => {
    return (masterData[dataType] || []).map(item => ({
      label: item[labelField] || item.name || item.description,
      value: item[valueField] || item.id,
      id: item.id,
      ...item
    }));
  };

  // Function to add new option to master data
  const addNewOptionToMasterData = async (dataType, newValue, labelField = 'name') => {
    try {
      // Generate new ID
      const existingItems = masterData[dataType] || [];
      const newId = existingItems?.length > 0 ? Math.max(...existingItems.map(item => item.id)) + 1 : 1;

      // Create new item based on data type
      let newItem = {
        id: newId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'user_input'
      };

      // Set the appropriate field based on data type
      if (dataType === 'methodMaster') {
        newItem.code = newId.toString();
        newItem.method = newValue;
      } else if (dataType === 'specimenMaster') {
        newItem.code = newId.toString();
        newItem.specimen = newValue;
        newItem.container = 'Standard Container';
        newItem.disposable = 'Yes';
      } else if (dataType === 'containerMaster') {
        newItem.code = newId.toString();
        newItem.description = newValue;
        newItem.short_name = newValue.substring(0, 3).toUpperCase();
        newItem.color = '#FFFFFF';
      } else {
        newItem[labelField] = newValue;
      }

      // Update master data state
      setMasterData(prev => ({
        ...prev,
        [dataType]: [...(prev[dataType] || []), newItem]
      }));

      console.log(`Added new ${dataType} option:`, newItem);
      return newItem;
    } catch (error) {
      console.error(`Error adding new ${dataType} option:`, error);
      return null;
    }
  };

  // Helper function to get sub-test options for multi-select
  const getSubTestOptions = () => {
    return availableSubTests.map(subTest => ({
      label: subTest.sub_test_name || `Sub Test ${subTest.id}`,
      value: subTest.id,
      id: subTest.id,
      ...subTest
    }));
  };

  // Handle sub-test selection change
  const handleSubTestChange = (selectedOptions) => {
    const selectedSubTestIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setSelectedSubTests(selectedSubTestIds);

    // Update the testMasterFormData
    setTestMasterFormData(prevData => ({
      ...prevData,
      subTests: selectedSubTestIds
    }));
  };

  // Get column configurations for each tab
  const getColumnConfig = (tabKey) => {
    const configs = {
      testCategories: [
        { key: 'name', label: 'Name', minWidth: '150px' },
        { key: 'description', label: 'Description', minWidth: '200px' },
        { key: 'is_active', label: 'Status', type: 'boolean', minWidth: '100px' }
      ],
      testParameters: [
        { key: 'name', label: 'Name', minWidth: '150px' },
        { key: 'unit', label: 'Unit', minWidth: '100px' },
        { key: 'reference_range', label: 'Reference Range', minWidth: '150px' },
        {
          key: 'category_id',
          label: 'Category',
          minWidth: '120px',
          render: (value) => {
            const category = (masterData.testCategories || []).find(c => c.id === value);
            return category?.name || 'N/A';
          }
        },
        { key: 'is_active', label: 'Status', type: 'boolean', minWidth: '100px' }
      ],
      sampleTypes: [
        { key: 'name', label: 'Name', minWidth: '150px' },
        { key: 'description', label: 'Description', minWidth: '200px' },
        { key: 'validity_days', label: 'Validity (Days)', minWidth: '120px' },
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
        {
          key: 'is_online',
          label: 'Type',
          minWidth: '100px',
          render: (value) => (
            <Badge bg={value ? 'info' : 'secondary'}>
              {value ? 'Online' : 'Offline'}
            </Badge>
          )
        },
        { key: 'is_active', label: 'Status', type: 'boolean', minWidth: '100px' }
      ],
      containers: [
        { key: 'name', label: 'Name', minWidth: '150px' },
        { key: 'type', label: 'Type', minWidth: '100px' },
        {
          key: 'volume',
          label: 'Volume',
          minWidth: '100px',
          render: (value, item) => `${value} ${item.unit || ''}`
        },
        {
          key: 'color',
          label: 'Color',
          minWidth: '100px',
          render: (value) => (
            <span
              className="badge"
              style={{ backgroundColor: value || '#6c757d' }}
            >
              {value || 'N/A'}
            </span>
          )
        },
        { key: 'additive', label: 'Additive', minWidth: '120px' },
        { key: 'is_active', label: 'Status', type: 'boolean', minWidth: '100px' }
      ],
      instruments: [
        { key: 'name', label: 'Name', minWidth: '150px' },
        { key: 'manufacturer', label: 'Manufacturer', minWidth: '150px' },
        { key: 'model', label: 'Model', minWidth: '120px' },
        { key: 'serial_number', label: 'Serial Number', minWidth: '150px' },
        { key: 'calibration_due', label: 'Calibration Due', type: 'date', minWidth: '150px' },
        { key: 'is_active', label: 'Status', type: 'boolean', minWidth: '100px' }
      ],
      reagents: [
        { key: 'name', label: 'Name', minWidth: '150px' },
        { key: 'lot_number', label: 'Lot Number', minWidth: '120px' },
        { key: 'manufacturer', label: 'Manufacturer', minWidth: '150px' },
        { key: 'expiry_date', label: 'Expiry Date', type: 'date', minWidth: '120px' },
        { key: 'storage_temperature', label: 'Storage Temp', minWidth: '120px' },
        { key: 'is_active', label: 'Status', type: 'boolean', minWidth: '100px' }
      ],
      suppliers: [
        { key: 'name', label: 'Name', minWidth: '150px' },
        { key: 'contact_person', label: 'Contact Person', minWidth: '150px' },
        { key: 'email', label: 'Email', minWidth: '200px' },
        { key: 'phone', label: 'Phone', minWidth: '120px' },
        { key: 'is_active', label: 'Status', type: 'boolean', minWidth: '100px' }
      ],
      units: [
        { key: 'name', label: 'Name', minWidth: '150px' },
        { key: 'symbol', label: 'Symbol', minWidth: '100px' },
        { key: 'type', label: 'Type', minWidth: '120px' },
        { key: 'conversion_factor', label: 'Conversion Factor', minWidth: '150px' },
        { key: 'is_active', label: 'Status', type: 'boolean', minWidth: '100px' }
      ],
      testMethods: [
        { key: 'name', label: 'Name', minWidth: '150px' },
        { key: 'description', label: 'Description', minWidth: '200px' },
        { key: 'principle', label: 'Principle', minWidth: '150px' },
        { key: 'is_active', label: 'Status', type: 'boolean', minWidth: '100px' }
      ],
      testMaster: [
        { key: 'hmsCode', label: 'Test Code', type: 'code', minWidth: '100px' },
        { key: 'testName', label: 'Test Name', minWidth: '200px' },
        { key: 'department', label: 'Department', minWidth: '120px' },
        { key: 'test_price', label: 'Test Price', type: 'currency', minWidth: '120px' },
        { key: 'method', label: 'Method', minWidth: '120px' },
        { key: 'container', label: 'Container', minWidth: '100px' },
        { key: 'serviceTime', label: 'Service Time', minWidth: '120px' },
        { key: 'is_active', label: 'Status', type: 'boolean', minWidth: '100px' }
      ],
      subTestMaster: [
        { key: 'sub_test_name', label: 'Sub Test Name', minWidth: '200px' },
        { key: 'department_id', label: 'Department', minWidth: '150px' },
        { key: 'description', label: 'Description', minWidth: '200px' },
        { key: 'is_active', label: 'Status', type: 'boolean', minWidth: '100px' }
      ]
    };

    return configs[tabKey] || [
      { key: 'name', label: 'Name', minWidth: '150px' },
      { key: 'description', label: 'Description', minWidth: '200px' },
      { key: 'is_active', label: 'Status', type: 'boolean', minWidth: '100px' }
    ];
  };

  // Get mobile card configuration for each tab
  const getMobileCardConfig = (tabKey) => {
    const configs = {
      testCategories: {
        primaryField: 'name',
        secondaryField: 'description'
      },
      testParameters: {
        primaryField: 'name',
        secondaryField: 'unit'
      },
      departments: {
        primaryField: 'department',
        secondaryField: 'test_profile'
      },
      containers: {
        primaryField: 'name',
        secondaryField: 'type'
      },
      instruments: {
        primaryField: 'name',
        secondaryField: 'manufacturer'
      },
      testMaster: {
        primaryField: 'testName',
        secondaryField: 'department'
      },
      subTestMaster: {
        primaryField: 'sub_test_name',
        secondaryField: 'description'
      }
    };

    return configs[tabKey] || {
      primaryField: 'name',
      secondaryField: 'description'
    };
  };

  // Function to generate dynamic department code
  const generateDepartmentCode = (departmentName) => {
    if (!departmentName) return '';

    // Extract first 3 letters and convert to uppercase
    const prefix = departmentName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();

    // Get existing department codes to avoid duplicates
    const existingCodes = (masterData.departments || []).map(dept => dept.code || '');

    // Generate a unique code
    let counter = 1;
    let newCode = `${prefix}${counter.toString().padStart(3, '0')}`;

    while (existingCodes.includes(newCode)) {
      counter++;
      newCode = `${prefix}${counter.toString().padStart(3, '0')}`;
    }

    return newCode;
  };

  // Function to auto-generate code when department name changes
  const handleDepartmentNameChange = (e) => {
    const { name, value } = e.target;

    if (name === 'department') {
      const generatedCode = generateDepartmentCode(value);
      setFormData(prevData => ({
        ...prevData,
        [name]: value,
        code: generatedCode
      }));
    } else {
      handleChange(e);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle tab search
  const handleTabSearch = (e) => {
    setTabSearchQuery(e.target.value);
  };

  // Get categorized navigation structure
  const getNavigationCategories = () => {
    return [
      {
        id: 'test-management',
        title: 'Test Management',
        icon: faFlask,
        color: '#007bff',
        items: [
          { key: 'testCategories', title: 'Test Categories', icon: faFlask },
          { key: 'testParameters', title: 'Test Parameters', icon: faVial },
          { key: 'testMaster', title: 'Test Master', icon: faClipboardList },
          { key: 'subTestMaster', title: 'Sub Test Master', icon: faLayerGroup },
          { key: 'departments', title: 'Test Profiles', icon: faUserMd },
          { key: 'testMethods', title: 'Test Methods', icon: faCalculator },
          { key: 'profileMaster', title: 'Profile Master', icon: faClipboardList },
          { key: 'methodMaster', title: 'Method Master', icon: faCogs },
          { key: 'billingRegistration', title: 'Quick: Billing Registration', icon: faFileInvoiceDollar }
        ]
      },
      {
        id: 'sample-management',
        title: 'Sample & Specimen',
        icon: faVial,
        color: '#28a745',
        items: [
          { key: 'sampleTypes', title: 'Sample Types', icon: faVial },
          { key: 'specimenMaster', title: 'Specimen Master', icon: faVial },
          { key: 'containers', title: 'Containers', icon: faBoxes },
          { key: 'containerMaster', title: 'Container Master', icon: faBoxes }
        ]
      },
      {
        id: 'inventory-management',
        title: 'Inventory & Equipment',
        icon: faBoxes,
        color: '#ffc107',
        items: [
          { key: 'instruments', title: 'Instruments', icon: faMicroscope },
          { key: 'reagents', title: 'Reagents', icon: faEyeDropper },
          { key: 'suppliers', title: 'Suppliers', icon: faTruck },
          { key: 'units', title: 'Units', icon: faRulerHorizontal },
          { key: 'unitOfMeasurement', title: 'Unit Of Measurement', icon: faRulerHorizontal }
        ]
      },
      {
        id: 'microbiology',
        title: 'Microbiology',
        icon: faBug,
        color: '#dc3545',
        items: [
          { key: 'antibioticMaster', title: 'Antibiotic Master', icon: faShieldAlt },
          { key: 'organismMaster', title: 'Organism Master', icon: faBug },
          { key: 'organismVsAntibiotic', title: 'Organism vs Antibiotic', icon: faShieldAlt }
        ]
      },
      {
        id: 'department-management',
        title: 'Department Management',
        icon: faBuilding,
        color: '#6f42c1',
        items: [
          { key: 'mainDepartmentMaster', title: 'Main Department Master', icon: faBuilding },
          { key: 'departmentMaster', title: 'Department Master', icon: faBuilding },
          { key: 'departmentSettings', title: 'Department Settings', icon: faCog }
        ]
      },
      {
        id: 'system-settings',
        title: 'System Settings',
        icon: faCog,
        color: '#6c757d',
        items: [
          { key: 'authorizationSettings', title: 'Authorization Settings', icon: faKey },
          { key: 'printOrder', title: 'Print Order', icon: faPrint },
          { key: 'paymentMethods', title: 'Payment Methods', icon: faFileInvoiceDollar }
        ]
      },
      {
        id: 'patient-management',
        title: 'Patient Management',
        icon: faUsers,
        color: '#17a2b8',
        items: [
          { key: 'patients', title: 'Patients', icon: faUsers }
        ]
      }
    ];
  };

  // Get filtered categories and items based on search query
  const getFilteredNavigation = () => {
    const categories = getNavigationCategories();

    if (!tabSearchQuery) return categories;

    return categories.map(category => ({
      ...category,
      items: category.items.filter(item =>
        item.title.toLowerCase().includes(tabSearchQuery.toLowerCase()) ||
        item.key.toLowerCase().includes(tabSearchQuery.toLowerCase())
      )
    })).filter(category => category.items?.length > 0);
  };

  // Get all tabs for legacy compatibility
  const getAllTabs = () => {
    const categories = getNavigationCategories();
    return categories.flatMap(category => category.items);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    // Special handling for billing registration quick link
    if (tab === 'billingRegistration') {
      navigate('/billing/registration');
      return;
    }

    setActiveTab(tab);
    setSearchQuery('');
  };

  // Handle category toggle
  const handleCategoryToggle = (categoryId) => {
    setOpenCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Handle navigation view toggle
  const handleNavigationViewToggle = () => {
    setNavigationView(prev => prev === 'categories' ? 'list' : 'categories');
  };

  // Get current category for active tab
  const getCurrentCategory = () => {
    const categories = getNavigationCategories();
    return categories?.find(category =>
      category.items.some(item => item.key === activeTab)
    );
  };

  // Get current tab info
  const getCurrentTabInfo = () => {
    const allTabs = getAllTabs();
    return allTabs.find(tab => tab.key === activeTab);
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
          code: '',
          test_profile: '',
          department: '',
          test_price: '',
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
      case 'containers':
        setFormData({
          name: '',
          type: '',
          volume: '',
          unit: '',
          color: '',
          additive: '',
          is_active: true
        });
        break;
      case 'instruments':
        setFormData({
          name: '',
          model: '',
          manufacturer: '',
          serial_number: '',
          installation_date: '',
          calibration_due: '',
          is_active: true
        });
        break;
      case 'reagents':
        setFormData({
          name: '',
          lot_number: '',
          expiry_date: '',
          manufacturer: '',
          storage_temperature: '',
          is_active: true
        });
        break;
      case 'suppliers':
        setFormData({
          name: '',
          contact_person: '',
          email: '',
          phone: '',
          address: '',
          is_active: true
        });
        break;
      case 'units':
        setFormData({
          name: '',
          symbol: '',
          type: '',
          conversion_factor: 1,
          is_active: true
        });
        break;
      case 'testMethods':
        setFormData({
          name: '',
          description: '',
          principle: '',
          procedure: '',
          is_active: true
        });
        break;
      case 'patients':
        setFormData({
          his_no: '',
          patient_name: '',
          mobile: '',
          whatsapp_no: '',
          uid_no: '',
          is_active: true
        });
        break;
      case 'profileMaster':
        setFormData(
          {
            code: '',
            procedure_code: '',
            test_profile: '',
            test_price: 0,
            discount_price: 0,
            emergency_price: 0,
            home_visit_price: 0,
            discount: 0,
            category: '',
            test_count: 0,
            is_active: true,
            description: '',
            testItems: [],   // final added tests
            currentTest: {   // temporary test before pushing
              test_id: null,
              testName: '',
              amount: 0.00
            }

          });
        break;
      case 'methodMaster':
        setFormData({
          code: '',
          method: '',
          is_active: true
        });
        break;
      case 'antibioticMaster':
        setFormData({
          antibiotic_code: '',
          antibiotic_group: '',
          antibiotic_description: '',
          antibiotic_content: '',
          order: 0,
          is_active: true
        });
        break;
      case 'organismMaster':
        setFormData({
          code: '',
          description: '',
          no_growth: false,
          is_active: true
        });
        break;
      case 'unitOfMeasurement':
        setFormData({
          code: '',
          description: '',
          technical: '',
          inventory: '',
          is_active: true
        });
        break;
      case 'specimenMaster':
        setFormData({
          code: '',
          specimen: '',
          container: '',
          disposable: '',
          is_active: true
        });
        break;
      case 'organismVsAntibiotic':
        setFormData({
          organism: '',
          antibiotic_group: '',
          is_active: true
        });
        break;
      case 'containerMaster':
        setFormData({
          code: '',
          description: '',
          short_name: '',
          color: '',
          is_active: true
        });
        break;
      case 'mainDepartmentMaster':
        setFormData({
          major_department: '',
          code: '',
          department: '',
          order: 0,
          short_name: '',
          queue: '',
          is_active: true
        });
        break;
      case 'departmentSettings':
        setFormData({
          main: '',
          code: '',
          sub_name: '',
          service_time: 0,
          room: '',
          order: 0,
          dept_amt: 0,
          short: '',
          collect: '',
          process_receive: '',
          receive: '',
          no: '',
          pending: '',
          dept: '',
          barcode: '',
          appt: '',
          is_active: true
        });
        break;
      case 'authorizationSettings':
        setFormData({
          main: '',
          code: '',
          sub_name: '',
          service_time: 0,
          authorization: '',
          authorization_type: '',
          email_at: '',
          report_type: '',
          specimen: '',
          staging: '',
          hide_sign: false,
          is_active: true
        });
        break;
      case 'printOrder':
        setFormData({
          item: '',
          order: 0,
          is_active: true
        });
        break;
      case 'subTestMaster':
        setFormData({
          sub_test_name: '',
          department_id: '',
          description: '',
          is_active: true
        });
        break;
      case 'departmentMaster':
        setFormData({
          main_department: '',
          code: '',
          name: '',
          short_name: '',
          room_no: '',
          order: 0,
          min_test_amt: 0.00,
          service_time: 0,
          sample_collect: false,
          process_receive: false,
          sample_receive: false,
          sample_no: false,
          hide_pending: false,
          hide_dept: false,
          hide_barcode: false,
          appointment: false,
          authorization: '',
          authorization_type: '',
          email_at: '',
          report_type: '',
          specimen: false,
          staging: false,
          hide_sign: false,
          is_active: true
        });
        break;
      case 'profileData':
        setFormData({
          code: '',
          procedure_code: '',
          test_profile: '',
          test_price: 0,
          is_active: true
        });
        break;
      case 'testMaster':
        setFormData({
          department: '',
          testName: '',
          emrClassification: '',
          shortName: '',
          displayName: '',
          hmsCode: '',
          internationalCode: '',
          method: '',
          primarySpecimen: '',
          container: '',
          interpretation: '',
          instructions: '',
          specialReport: '',
          reportName: '',
          cutoffTime: '',
          minProcessTime: 0,
          minProcessPeriod: '',
          emergencyProcessTime: 0,
          emergencyProcessPeriod: '',
          reportingDays: 0,
          applicableTo: 'both',
          serviceTime: '',
          options: {
            noSale: false,
            allowDiscount: false,
            accreditedTest: false,
            outsourced: false,
            onlineRegistration: false,
            appointment: false,
            alertSMS: false,
            noHouseVisit: false,
            isCovid: false
          },
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

    // Special handling for testMaster to populate all fields correctly
    if (activeTab === 'testMaster') {
      setTestMasterFormData({
        // Basic Information
        department: item.department || '',
        testName: item.testName || '',
        emrClassification: item.emrClassification || '',
        shortName: item.shortName || '',
        displayName: item.displayName || '',
        hmsCode: item.hmsCode || '',
        internationalCode: item.internationalCode || '',
        method: item.method || '',
        methodCode: item.methodCode || '',
        primarySpecimen: item.primarySpecimen || '',
        primarySpecimenCode: item.primarySpecimenCode || '',
        specimen: Array.isArray(item.specimen) ? item.specimen : [],
        specimenCode: item.specimenCode || '',
        container: item.container || '',
        containerCode: item.containerCode || '',
        interpretation: item.interpretation || '',
        instructions: item.instructions || '',
        specialReport: item.specialReport || '',
        reportName: item.reportName || '',
        // Reference & Results
        reference_range: item.reference_range || '',
        result_unit: item.result_unit || '',
        decimals: item.decimals || 0,
        critical_low: item.critical_low,
        critical_high: item.critical_high,
        test_price: item.test_price || 0,
        // Settings
        unacceptableConditions: Array.isArray(item.unacceptableConditions) ? item.unacceptableConditions : [],
        minSampleQty: item.minSampleQty || '',
        cutoffTime: item.cutoffTime || '',
        testSuffix: item.testSuffix || '',
        suffixDesc: item.suffixDesc || '',
        minProcessTime: item.minProcessTime || 0,
        minProcessPeriod: item.minProcessPeriod || '',
        emergencyProcessTime: item.emergencyProcessTime || 0,
        emergencyProcessPeriod: item.emergencyProcessPeriod || '',
        expiryTime: item.expiryTime || 0,
        expiryPeriod: item.expiryPeriod || '',
        serviceTime: item.serviceTime || '',
        applicableTo: item.applicableTo || 'All',
        reportingDays: Array.isArray(item.reportingDays) ? item.reportingDays : [],
        testDoneOn: Array.isArray(item.testDoneOn) ? item.testDoneOn : [],
        // Alert & Notification
        alertMessage: item.alertMessage || '',
        alertPeriod: item.alertPeriod || '',
        alertSMS: item.alertSMS || false,
        // Sub-tests
        subTests: Array.isArray(item.subTests) ? item.subTests : [],
        // Options
        options: item.options || {},
        is_active: item.is_active !== false
      });

      // Set selected sub-tests for the multi-select component
      setSelectedSubTests(Array.isArray(item.subTests) ? item.subTests : []);
    } else {
      setFormData(item);
    }

    setShowEditModal(true);
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('options.')) {
      const option = name.split('.')[1];
      setFormData(prevData => ({
        ...prevData,
        options: {
          ...prevData.options,
          [option]: checked
        }
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };



  const fetchExcelData = async (forceRefresh = false) => {
    const cacheValidityMs = 5 * 60 * 1000;
    const now = new Date().getTime();

    if (!forceRefresh && excelDataCache && excelDataLastFetch &&
      (now - excelDataLastFetch) < cacheValidityMs) {
      console.log('Using cached test data');
      return excelDataCache;
    }

    try {
      setExcelDataLoading(true);
      setExcelDataError(null);

      console.log('Fetching Excel data and Manual test data from API...');

      const token = localStorage.getItem('token');

      const [excelResponse, manualResponse] = await Promise.all([
        fetch('/api/admin/excel-data', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/admin/test-master-enhanced', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!excelResponse.ok) {
        throw new Error(`Excel data fetch failed: ${excelResponse.statusText}`);
      }
      if (!manualResponse.ok) {
        throw new Error(`Manual test fetch failed: ${manualResponse.statusText}`);
      }

      const excelData = await excelResponse.json();
      const manualData = await manualResponse.json();

      const formatTest = test => ({
        id: test.id,
        testName: test.test_name,
        test_profile: test.test_name,
        test_price: test.price || 0,
        department: test.department || 'General',
        hmsCode: test.test_code || '',
        specimen: test.specimen || '',
        container: test.container || '',
        serviceTime: test.service_time || '',
        reportingDays: test.reporting_days || '',
        cutoffTime: test.cutoff_time || '',
        referenceRange: test.reference_range || '',
        resultUnit: test.result_unit || '',
        decimals: test.decimals || 0,
        criticalLow: test.critical_low,
        criticalHigh: test.critical_high,
        method: test.method || '',
        instructions: test.instructions || '',
        notes: test.notes || '',
        minSampleQty: test.min_sample_qty || '',
        testDoneOn: test.test_done_on || '',
        applicableTo: test.applicable_to || 'Both',
        isActive: test.is_active !== false,
        ...test
      });

      const transformedExcelData = Array.isArray(excelData.data) ? excelData.data.map(formatTest) : [];
      const transformedManualData = Array.isArray(manualData.data) ? manualData.data.map(formatTest) : [];

      const allTests = [...transformedExcelData, ...transformedManualData];

      setExcelDataCache(allTests);
      setExcelDataLastFetch(now);

      console.log(`Loaded ${allTests?.length} tests (Excel + Manual)`);
      return allTests;

    } catch (err) {
      console.error('Error fetching test data:', err);
      setExcelDataError(err.message);

      if (excelDataCache) {
        console.log('Using cached test data due to fetch error');
        return excelDataCache;
      }

      throw err;
    } finally {
      setExcelDataLoading(false);
    }
  };


  // Fetch master data
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Set branches based on user access control
        const userBranches = getBranchesForUser();
        setBranches(userBranches);

        // Auto-select branch for non-admin users who have only one franchise
        if ((currentUser?.role === 'franchise_admin' ||
          (currentUser?.role !== 'admin' && currentUser?.role !== 'hub_admin')) &&
          userBranches?.length === 1 && !formData.branch) {
          setFormData(prev => ({
            ...prev,
            branch: userBranches[0].id.toString()
          }));
        }

        setCategories([
          { id: 'Normal', name: 'Normal' },
          { id: 'Emergency', name: 'Emergency' },
          { id: 'VIP', name: 'VIP' }
        ]);

        setReferrers([
          { id: 'Doctor', name: 'Doctor' },
          { id: 'Self', name: 'Self' },
          { id: 'Hospital', name: 'Hospital' }
        ]);

        // Fetch Excel-based test profiles
        try {
          const excelTestProfiles = await fetchExcelData();
          setTestProfiles(excelTestProfiles);
          console.log(`Loaded ${excelTestProfiles?.length} tests from Excel data API`);
        } catch (apiErr) {
          console.error('Error fetching Excel test data:', apiErr);

          // Fallback to sample test profiles if Excel data fails
          console.log('Falling back to sample test profiles due to Excel data fetch error');
          const sampleTestProfiles = [
            { id: 1, test_profile: 'Complete Blood Count (CBC)', test_price: 250, department: 'Hematology' },
            { id: 2, test_profile: 'Lipid Profile', test_price: 400, department: 'Biochemistry' },
            { id: 3, test_profile: 'Liver Function Test (LFT)', test_price: 350, department: 'Biochemistry' },
            { id: 4, test_profile: 'Kidney Function Test (KFT)', test_price: 300, department: 'Biochemistry' },
            { id: 5, test_profile: 'Thyroid Profile (T3, T4, TSH)', test_price: 500, department: 'Endocrinology' },
            { id: 6, test_profile: 'Blood Sugar (Fasting)', test_price: 100, department: 'Biochemistry' },
            { id: 7, test_profile: 'Blood Sugar (Random)', test_price: 100, department: 'Biochemistry' },
            { id: 8, test_profile: 'HbA1c', test_price: 450, department: 'Biochemistry' },
            { id: 9, test_profile: 'Urine Routine', test_price: 150, department: 'Pathology' },
            { id: 10, test_profile: 'ECG', test_price: 200, department: 'Cardiology' }
          ];
          setTestProfiles(sampleTestProfiles);

          // Show warning but don't block the form
          setError(`Warning: Unable to load Excel test data (${apiErr.message}). Using fallback test profiles.`);
        }

        // Fetch GST configurations
        try {
          const gstResponse = await adminAPI.getGSTConfig();
          if (gstResponse.data && Array.isArray(gstResponse.data)) {
            setGstConfigs(gstResponse.data);

            // Find default GST rate
            const defaultConfig = gstResponse.data.find(config => config.is_default && config.is_active);
            if (defaultConfig) {
              setDefaultGstRate(defaultConfig.rate);
              setFormData(prev => ({
                ...prev,
                gstRate: defaultConfig.rate
              }));
            }
          }
        } catch (gstErr) {
          console.log('Using default GST rate - GST config API not available');
          // Use default GST rate from settings or fallback
          setDefaultGstRate(18.00);
        }

        // Patient data is now fetched through search functionality when needed

      } catch (err) {
        console.error('Error fetching master data:', err);
        setError('Failed to load master data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMasterData();
  }, [currentUser, tenantData, accessibleTenants]); // eslint-disable-line react-hooks/exhaustive-deps



  // Enhanced Test Master change handler with new option support
  const handleTestMasterChange = async (e) => {
    const { name, value, type, checked } = e.target;

    // Check if this is a new option being added
    if (typeof value === 'string' && value.startsWith('new_')) {
      const newValue = value.replace('new_', '');
      let dataType = '';
      let labelField = 'name';

      // Determine which master data type to add to
      if (name === 'method') {
        dataType = 'methodMaster';
        labelField = 'method';
      } else if (name === 'primarySpecimen' || name === 'specimen') {
        dataType = 'specimenMaster';
        labelField = 'specimen';
      } else if (name === 'container') {
        dataType = 'containerMaster';
        labelField = 'description';
      }

      if (dataType) {
        const newItem = await addNewOptionToMasterData(dataType, newValue, labelField);
        if (newItem) {
          // Update form with the new item's ID
          setTestMasterFormData(prevData => ({
            ...prevData,
            [name]: newItem.id
          }));
          return;
        }
      }
    }

    // Handle normal form changes
    if (name.startsWith('testDoneOn.')) {
      const day = name.split('.')[1];
      setTestMasterFormData(prevData => ({
        ...prevData,
        testDoneOn: {
          ...prevData.testDoneOn,
          [day]: checked
        }
      }));
    } else if (name.startsWith('options.')) {
      const option = name.split('.')[1];
      setTestMasterFormData(prevData => ({
        ...prevData,
        options: {
          ...prevData.options,
          [option]: checked
        }
      }));
    } else {
      setTestMasterFormData(prevData => ({
        ...prevData,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle Test Master form submission
  const handleTestMasterSubmit = async () => {
    try {
      const testMasterData = {
        ...testMasterFormData,
        subTests: subTests
      };

      const response = await adminAPI.addMasterDataItem('testMaster', testMasterData);

      setMasterData(prevData => ({
        ...prevData,
        testMaster: [...(prevData.testMaster || []), response.data]
      }));

      // Clear form
      handleTestMasterClear();
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error adding test master:', err);
      setErrorMessage('Failed to add test master. Please try again.');
      setShowErrorModal(true);
    }
  };

  // Handle Test Master form clear
  const handleTestMasterClear = () => {
    setTestMasterFormData({
      department: '',
      testName: '',
      emrClassification: '',
      shortName: '',
      displayName: '',
      hmsCode: '',
      internationalCode: '',
      method: '',
      methodCode: '',
      primarySpecimen: '',
      primarySpecimenCode: '',
      specimen: [],
      specimenCode: '',
      container: '',
      containerCode: '',
      interpretation: '',
      instructions: '',
      specialReport: '',
      reportName: '',
      unacceptableConditions: '',
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
      serviceTime: '',
      applicableTo: 'both',
      reportingDays: 0,
      testDoneOn: {
        sun: false,
        mon: false,
        tue: false,
        wed: false,
        thu: false,
        fri: false,
        sat: false
      },
      alertSMS: false,
      alertPeriod: '',
      alertMessage: '',
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
      is_active: true
    });
    setSubTests([]);
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
      // Use testMasterFormData for testMaster, otherwise use formData
      const dataToSubmit = activeTab === 'testMaster' ? testMasterFormData : formData;

      const response = await adminAPI.updateMasterDataItem(activeTab, itemToEdit.id, dataToSubmit);

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

  // Generate sample Excel data for all tabs
  const generateSampleExcelData = () => {
    const sampleDataTemplates = {
      testCategories: [
        { name: 'Biochemistry', description: 'Blood chemistry tests', is_active: true },
        { name: 'Hematology', description: 'Blood cell analysis', is_active: true },
        { name: 'Microbiology', description: 'Bacterial and viral tests', is_active: true }
      ],
      testParameters: [
        { name: 'Glucose', unit: 'mg/dL', reference_range: '70-100', category_id: 1, is_active: true },
        { name: 'Hemoglobin', unit: 'g/dL', reference_range: '12-16', category_id: 2, is_active: true },
        { name: 'WBC Count', unit: 'cells/μL', reference_range: '4000-11000', category_id: 2, is_active: true }
      ],
      departments: [
        { code: 'BIO001', department: 'Biochemistry', test_profile: 'Basic Metabolic Panel', test_price: 150.00, is_active: true },
        { code: 'HEM001', department: 'Hematology', test_profile: 'Complete Blood Count', test_price: 120.00, is_active: true },
        { code: 'MIC001', department: 'Microbiology', test_profile: 'Culture & Sensitivity', test_price: 200.00, is_active: true }
      ],
      sampleTypes: [
        { name: 'Blood', description: 'Whole blood sample', validity_days: 7, is_active: true },
        { name: 'Urine', description: 'Urine sample', validity_days: 2, is_active: true },
        { name: 'Stool', description: 'Stool sample', validity_days: 1, is_active: true }
      ],
      paymentMethods: [
        { name: 'Cash', description: 'Cash payment', is_online: false, is_active: true },
        { name: 'Credit Card', description: 'Credit card payment', is_online: true, is_active: true },
        { name: 'Insurance', description: 'Insurance coverage', is_online: false, is_active: true }
      ],
      containers: [
        { name: 'EDTA Tube', type: 'Vacuum', volume: 5, unit: 'mL', color: '#800080', additive: 'EDTA', is_active: true },
        { name: 'Plain Tube', type: 'Vacuum', volume: 10, unit: 'mL', color: '#FF0000', additive: 'None', is_active: true },
        { name: 'Fluoride Tube', type: 'Vacuum', volume: 3, unit: 'mL', color: '#808080', additive: 'Sodium Fluoride', is_active: true }
      ],
      instruments: [
        { name: 'Auto Analyzer', manufacturer: 'Beckman Coulter', model: 'AU480', serial_number: 'BC2024001', is_active: true },
        { name: 'Hematology Analyzer', manufacturer: 'Sysmex', model: 'XN-1000', serial_number: 'SX2024001', is_active: true },
        { name: 'Microscope', manufacturer: 'Olympus', model: 'CX23', serial_number: 'OL2024001', is_active: true }
      ],
      reagents: [
        { name: 'Glucose Reagent', manufacturer: 'Roche', lot_number: 'GLU2024001', expiry_date: '2024-12-31', is_active: true },
        { name: 'Hemoglobin Reagent', manufacturer: 'Sysmex', lot_number: 'HGB2024001', expiry_date: '2024-11-30', is_active: true },
        { name: 'Gram Stain Kit', manufacturer: 'BD', lot_number: 'GS2024001', expiry_date: '2025-01-31', is_active: true }
      ],
      suppliers: [
        { name: 'MedSupply Corp', contact_person: 'John Smith', phone: '+1-555-0123', email: 'john@medsupply.com', is_active: true },
        { name: 'LabTech Solutions', contact_person: 'Jane Doe', phone: '+1-555-0456', email: 'jane@labtech.com', is_active: true },
        { name: 'BioReagents Inc', contact_person: 'Bob Johnson', phone: '+1-555-0789', email: 'bob@bioreagents.com', is_active: true }
      ],
      units: [
        { name: 'mg/dL', description: 'Milligrams per deciliter', category: 'Concentration', is_active: true },
        { name: 'g/dL', description: 'Grams per deciliter', category: 'Concentration', is_active: true },
        { name: 'cells/μL', description: 'Cells per microliter', category: 'Count', is_active: true }
      ],
      testMethods: [
        { name: 'Enzymatic', description: 'Enzyme-based assay', principle: 'Colorimetric', is_active: true },
        { name: 'Immunoassay', description: 'Antibody-antigen reaction', principle: 'Chemiluminescence', is_active: true },
        { name: 'PCR', description: 'Polymerase chain reaction', principle: 'Molecular', is_active: true }
      ],
      patients: [
        { name: 'John Doe', age: 35, gender: 'Male', phone: '+1-555-1234', email: 'john.doe@email.com', is_active: true },
        { name: 'Jane Smith', age: 28, gender: 'Female', phone: '+1-555-5678', email: 'jane.smith@email.com', is_active: true },
        { name: 'Bob Johnson', age: 45, gender: 'Male', phone: '+1-555-9012', email: 'bob.johnson@email.com', is_active: true }
      ],
      departmentMaster: [
        { main_department: 'LAB', code: 'HA', name: 'HAEMATOLOGY', short_name: 'HA', room_no: '101', order: 1, min_test_amt: 0.00, service_time: 0, sample_collect: true, process_receive: true, sample_receive: false, sample_no: false, hide_pending: false, hide_dept: false, hide_barcode: false, appointment: false, authorization: '', authorization_type: '', email_at: '', report_type: '', specimen: false, staging: false, hide_sign: false, is_active: true },
        { main_department: 'LAB', code: 'BC', name: 'BIOCHEMISTRY', short_name: 'BC', room_no: '102', order: 2, min_test_amt: 0.00, service_time: 0, sample_collect: true, process_receive: true, sample_receive: false, sample_no: false, hide_pending: false, hide_dept: false, hide_barcode: false, appointment: false, authorization: '', authorization_type: '', email_at: '', report_type: '', specimen: false, staging: false, hide_sign: false, is_active: true },
        { main_department: 'LAB', code: 'IM', name: 'IMMUNOLOGY', short_name: 'IM', room_no: '103', order: 3, min_test_amt: 0.00, service_time: 0, sample_collect: true, process_receive: true, sample_receive: false, sample_no: false, hide_pending: false, hide_dept: false, hide_barcode: false, appointment: false, authorization: '', authorization_type: '', email_at: '', report_type: '', specimen: false, staging: false, hide_sign: false, is_active: true }
      ]
    };

    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new();

    Object.keys(sampleDataTemplates).forEach(tabName => {
      const data = sampleDataTemplates[tabName];
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, tabName);
    });

    // Download the file
    XLSX.writeFile(wb, 'master_data_sample_templates.xlsx');
  };

  // Filter data based on search query
  const getFilteredData = () => {
    const data = masterData[activeTab] || [];

    if (!searchQuery) {
      return data;
    }

    return data.filter(item => {
      const searchLower = searchQuery.toLowerCase();
      return (
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.testName && item.testName.toLowerCase().includes(searchLower)) ||
        (item.sub_test_name && item.sub_test_name.toLowerCase().includes(searchLower)) ||
        (item.code && item.code.toLowerCase().includes(searchLower)) ||
        (item.test_profile && item.test_profile.toLowerCase().includes(searchLower)) ||
        (item.procedure_code && item.procedure_code.toLowerCase().includes(searchLower)) ||
        (item.department && item.department.toLowerCase().includes(searchLower)) ||
        (item.test_price && item.test_price.toString().includes(searchLower))
      );
    });
  };

  // Handle Excel import success
  const handleImportSuccess = async () => {
    try {
      const response = await adminAPI.getMasterData();
      setMasterData(response.data);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error refreshing data after import:', err);
      setErrorMessage('Data imported but failed to refresh. Please reload the page.');
      setShowErrorModal(true);
    }
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
      {/* Mobile-First Header */}
      <div className="master-data-header">
        <h1>
          <FontAwesomeIcon icon={faDatabase} />
          Master Data Management
        </h1>

        {/* Desktop Action Buttons */}
        {!isMobile && (
          <div className="action-buttons-container">
            <div className="action-buttons-grid">
              <Button
                variant="secondary"
                className="action-btn"
                onClick={generateSampleExcelData}
                title="Download sample Excel templates for all tabs"
              >
                <FontAwesomeIcon icon={faDownload} />
                Sample Data
              </Button>
              <Button
                variant="info"
                className="action-btn"
                onClick={() => setShowBulkImportModal(true)}
              >
                <FontAwesomeIcon icon={faFileImport} />
                Bulk Import
              </Button>
              <Button
                variant="success"
                className="action-btn"
                onClick={() => setShowExcelModal(true)}
              >
                <FontAwesomeIcon icon={faFileExcel} />
                Excel Import/Export
              </Button>
              <Button
                variant="primary"
                className="action-btn"
                onClick={handleAddClick}
              >
                <FontAwesomeIcon icon={faPlus} />
                Add New
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Action Buttons Grid */}
        {isMobile && (
          <div className="action-buttons-container">
            <div className="action-buttons-grid">
              <Button
                variant="primary"
                className="action-btn"
                onClick={handleAddClick}
              >
                <FontAwesomeIcon icon={faPlus} />
                Add New
              </Button>
              <Button
                variant="success"
                className="action-btn"
                onClick={() => setShowExcelModal(true)}
              >
                <FontAwesomeIcon icon={faFileExcel} />
                Excel
              </Button>
              <Button
                variant="info"
                className="action-btn"
                onClick={() => setShowBulkImportModal(true)}
              >
                <FontAwesomeIcon icon={faFileImport} />
                Import
              </Button>
              <Button
                variant="secondary"
                className="action-btn"
                onClick={generateSampleExcelData}
              >
                <FontAwesomeIcon icon={faDownload} />
                Sample
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Actions for Mobile */}
      {isMobile && (
        <div className="collapsible-actions">
          <div
            className="collapsible-header"
            onClick={() => setActionsCollapsed(!actionsCollapsed)}
          >
            <span>Quick Actions</span>
            <FontAwesomeIcon
              icon={actionsCollapsed ? faChevronDown : faChevronUp}
            />
          </div>
          <Collapse in={!actionsCollapsed}>
            <div className="collapsible-content">
              <div className="d-grid gap-2">
                <Button
                  variant="outline-primary"
                  onClick={handleAddClick}
                >
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Add New {activeTab.replace(/([A-Z])/g, ' $1').trim()}
                </Button>
                <Button
                  variant="outline-success"
                  onClick={() => setShowExcelModal(true)}
                >
                  <FontAwesomeIcon icon={faFileExcel} className="me-2" />
                  Excel Import/Export
                </Button>
                <Button
                  variant="outline-info"
                  onClick={() => setShowBulkImportModal(true)}
                >
                  <FontAwesomeIcon icon={faFileImport} className="me-2" />
                  Bulk Data Import
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={generateSampleExcelData}
                >
                  <FontAwesomeIcon icon={faDownload} className="me-2" />
                  Download Sample Templates
                </Button>
              </div>
            </div>
          </Collapse>
        </div>
      )}

      {/* Main Content Card */}
      <Card className="master-data-card">
        <Card.Body>
          {/* Modern Navigation Container */}
          <div className="modern-navigation-container">
            {/* Navigation Header */}
            <div className="navigation-header">
              <div className="navigation-controls">
                <div className="navigation-search">
                  <FontAwesomeIcon icon={faSearch} className="search-icon" />
                  <input
                    type="text"
                    className="navigation-search-input"
                    placeholder="Search menu items..."
                    value={tabSearchQuery}
                    onChange={handleTabSearch}
                  />
                </div>
                <div className="navigation-view-toggle">
                  <Button
                    variant={navigationView === 'categories' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={handleNavigationViewToggle}
                    className="view-toggle-btn"
                  >
                    <FontAwesomeIcon icon={navigationView === 'categories' ? faBars : faLayerGroup} />
                    <span className="ms-1 d-none d-md-inline">
                      {navigationView === 'categories' ? 'List View' : 'Categories'}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Current Selection Breadcrumb */}
              <div className="current-selection">
                <div className="breadcrumb-container">
                  {getCurrentCategory() && (
                    <>
                      <span className="category-badge" style={{ backgroundColor: getCurrentCategory().color }}>
                        <FontAwesomeIcon icon={getCurrentCategory().icon} />
                        <span className="ms-1">{getCurrentCategory().title}</span>
                      </span>
                      <FontAwesomeIcon icon={faChevronDown} className="breadcrumb-separator" />
                    </>
                  )}
                  <span className="current-item">
                    <FontAwesomeIcon icon={getCurrentTabInfo()?.icon || faDatabase} />
                    <span className="ms-1">{getCurrentTabInfo()?.title || 'Select Item'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Content */}
            <div className="navigation-content">
              {navigationView === 'categories' ? (
                /* Categorized View */
                <div className="categories-navigation">
                  {getFilteredNavigation().map(category => (
                    <div key={category.id} className="navigation-category">
                      <div
                        className={`category-header ${openCategories.has(category.id) ? 'open' : ''}`}
                        onClick={() => handleCategoryToggle(category.id)}
                      >
                        <div className="category-info">
                          <div className="category-icon" style={{ backgroundColor: category.color }}>
                            <FontAwesomeIcon icon={category.icon} />
                          </div>
                          <span className="category-title">{category.title}</span>
                          <span className="category-count">({category.items?.length})</span>
                        </div>
                        <FontAwesomeIcon
                          icon={openCategories.has(category.id) ? faChevronUp : faChevronDown}
                          className="category-toggle"
                        />
                      </div>

                      <Collapse in={openCategories.has(category.id)}>
                        <div className="category-items">
                          {category.items.map(item => (
                            <div
                              key={item.key}
                              className={`navigation-item ${activeTab === item.key ? 'active' : ''}`}
                              onClick={() => handleTabChange(item.key)}
                            >
                              <FontAwesomeIcon icon={item.icon} className="item-icon" />
                              <span className="item-title">{item.title}</span>
                              {masterData[item.key] && (
                                <span className="item-count">
                                  {masterData[item.key].length}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </Collapse>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="list-navigation">
                  {getAllTabs().filter(tab =>
                    !tabSearchQuery ||
                    tab.title.toLowerCase().includes(tabSearchQuery.toLowerCase()) ||
                    tab.key.toLowerCase().includes(tabSearchQuery.toLowerCase())
                  ).map(tab => (
                    <div
                      key={tab.key}
                      className={`navigation-item ${activeTab === tab.key ? 'active' : ''}`}
                      onClick={() => handleTabChange(tab.key)}
                    >
                      <FontAwesomeIcon icon={tab.icon} className="item-icon" />
                      <span className="item-title">{tab.title}</span>
                      {masterData[tab.key] && (
                        <span className="item-count">
                          {masterData[tab.key].length}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Content Search */}
            <div className="content-search-container">
              <div className="search-input-group">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder={`Search ${getCurrentTabInfo()?.title || 'items'}...`}
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>
          </div>

          {/* Data Content */}
          {error ? (
            <Alert variant="danger" className="mx-3">{error}</Alert>
          ) : (
            <ResponsiveDataTable
              data={getFilteredData()}
              columns={getColumnConfig(activeTab)}
              onEdit={handleEditClick}
              onDelete={handleDeleteConfirm}
              loading={loading}
              emptyMessage={`No ${activeTab.replace(/([A-Z])/g, ' $1').trim()} found`}
              mobileCardConfig={getMobileCardConfig(activeTab)}
            />
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
        onSubmit={activeTab === 'testMaster' ? handleTestMasterSubmit : handleAddSubmit}
        title={`Add New ${activeTab === 'testCategories' ? 'Test Category' :
          activeTab === 'testParameters' ? 'Test Parameter' :
            activeTab === 'sampleTypes' ? 'Sample Type' :
              activeTab === 'departments' ? 'Department' :
                activeTab === 'paymentMethods' ? 'Payment Method' :
                  activeTab === 'containers' ? 'Container' :
                    activeTab === 'instruments' ? 'Instrument' :
                      activeTab === 'reagents' ? 'Reagent' :
                        activeTab === 'suppliers' ? 'Supplier' :
                          activeTab === 'units' ? 'Unit' :
                            activeTab === 'testMethods' ? 'Test Method' :
                              activeTab === 'patients' ? 'Patient' :
                                activeTab === 'profileMaster' ? 'Profile' :
                                  activeTab === 'methodMaster' ? 'Method' :
                                    activeTab === 'antibioticMaster' ? 'Antibiotic' :
                                      activeTab === 'organismMaster' ? 'Organism' :
                                        activeTab === 'unitOfMeasurement' ? 'Unit of Measurement' :
                                          activeTab === 'specimenMaster' ? 'Specimen' :
                                            activeTab === 'organismVsAntibiotic' ? 'Organism vs Antibiotic' :
                                              activeTab === 'containerMaster' ? 'Container Master' :
                                                activeTab === 'mainDepartmentMaster' ? 'Main Department' :
                                                  activeTab === 'departmentSettings' ? 'Department Setting' :
                                                    activeTab === 'authorizationSettings' ? 'Authorization Setting' :
                                                      activeTab === 'printOrder' ? 'Print Order' :
                                                        activeTab === 'testMaster' ? 'Test Master' :
                                                          activeTab === 'subTestMaster' ? 'Sub Test Master' :
                                                            activeTab === 'departmentMaster' ? 'Department Master' :
                                                              activeTab === 'testSubProcess' ? 'Test Sub Process' :
                                                                activeTab === 'specialPackage' ? 'Special Package' :
                                                                  'Item'}`}
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
              <Form.Label>Category*</Form.Label>
              <SearchableDropdown
                name="category_id"
                label="Category"
                value={formData.category_id}
                onChange={handleChange}
                options={getMasterDataOptions('testCategories', 'name', 'id')}
                placeholder="Select Category"
                isRequired={true}
                isClearable={false}
                variant="mui"
              />
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
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Department Information</h6>
              <Row>
                <Col md={6}>
                  <TextInput
                    name="code"
                    label="Department Code* (Auto-generated)"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    placeholder="Auto-generated from department name"
                    disabled
                  />
                </Col>
                <Col md={6}>
                  <TextInput
                    name="department"
                    label="Department Name*"
                    value={formData.department}
                    onChange={handleDepartmentNameChange}
                    required
                    placeholder="Enter department name"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <TextInput
                    name="test_profile"
                    label="Test Profile*"
                    value={formData.test_profile}
                    onChange={handleChange}
                    required
                    placeholder="Enter test profile name"
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
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <Form.Check
                    type="switch"
                    id="is_active"
                    name="is_active"
                    label="Active Department"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                </Col>
              </Row>
            </div>
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

        {activeTab === 'containers' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="type"
              label="Type"
              value={formData.type}
              onChange={handleChange}
              placeholder="e.g., Tube, Bottle, Vial"
            />
            <div className="row">
              <div className="col-md-6">
                <NumberInput
                  name="volume"
                  label="Volume"
                  value={formData.volume}
                  onChange={handleChange}
                  min={0}
                  step={0.1}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="unit"
                  label="Unit"
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="mL, L, etc."
                />
              </div>
            </div>
            <TextInput
              name="color"
              label="Color"
              value={formData.color}
              onChange={handleChange}
              type="color"
            />
            <TextInput
              name="additive"
              label="Additive"
              value={formData.additive}
              onChange={handleChange}
              placeholder="e.g., EDTA, Heparin, None"
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

        {activeTab === 'instruments' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="manufacturer"
                  label="Manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="model"
                  label="Model"
                  value={formData.model}
                  onChange={handleChange}
                />
              </div>
            </div>
            <TextInput
              name="serial_number"
              label="Serial Number"
              value={formData.serial_number}
              onChange={handleChange}
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="installation_date"
                  label="Installation Date"
                  value={formData.installation_date}
                  onChange={handleChange}
                  type="date"
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="calibration_due"
                  label="Calibration Due"
                  value={formData.calibration_due}
                  onChange={handleChange}
                  type="date"
                />
              </div>
            </div>
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

        {activeTab === 'reagents' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="lot_number"
                  label="Lot Number"
                  value={formData.lot_number}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="manufacturer"
                  label="Manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="expiry_date"
                  label="Expiry Date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                  type="date"
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="storage_temperature"
                  label="Storage Temperature"
                  value={formData.storage_temperature}
                  onChange={handleChange}
                  placeholder="e.g., 2-8°C, Room temp"
                />
              </div>
            </div>
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

        {activeTab === 'suppliers' && (
          <>
            <TextInput
              name="name"
              label="Company Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="contact_person"
              label="Contact Person"
              value={formData.contact_person}
              onChange={handleChange}
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="email"
                  label="Email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="phone"
                  label="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                  type="tel"
                />
              </div>
            </div>
            <TextInput
              name="address"
              label="Address"
              value={formData.address}
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

        {activeTab === 'units' && (
          <>
            <TextInput
              name="name"
              label="Unit Name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Milligrams per deciliter"
            />
            <TextInput
              name="symbol"
              label="Symbol"
              value={formData.symbol}
              onChange={handleChange}
              required
              placeholder="e.g., mg/dL"
            />
            <TextInput
              name="type"
              label="Type"
              value={formData.type}
              onChange={handleChange}
              placeholder="e.g., Concentration, Volume, Mass"
            />
            <NumberInput
              name="conversion_factor"
              label="Conversion Factor"
              value={formData.conversion_factor}
              onChange={handleChange}
              min={0}
              step={0.001}
              placeholder="Factor to convert to base unit"
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

        {activeTab === 'testMethods' && (
          <>
            <TextInput
              name="name"
              label="Method Name"
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
              name="principle"
              label="Principle"
              value={formData.principle}
              onChange={handleChange}
              as="textarea"
              rows={2}
              placeholder="Scientific principle behind the method"
            />
            <TextInput
              name="procedure"
              label="Procedure"
              value={formData.procedure}
              onChange={handleChange}
              as="textarea"
              rows={3}
              placeholder="Step-by-step procedure"
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

        {/* New Categories Forms */}
        {activeTab === 'patients' && (
          <>
            <TextInput
              name="his_no"
              label="HIS Number"
              value={formData.his_no}
              onChange={handleChange}
              required
            />
            <TextInput
              name="patient_name"
              label="Patient Name"
              value={formData.patient_name}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="mobile"
                  label="Mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  type="tel"
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="whatsapp_no"
                  label="WhatsApp Number"
                  value={formData.whatsapp_no}
                  onChange={handleChange}
                  type="tel"
                />
              </div>
            </div>
            <TextInput
              name="uid_no"
              label="UID Number"
              value={formData.uid_no}
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

        {activeTab === 'profileMaster' && (
          <>
            {/* Basic Information */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Basic Information</h6>
              <Row>
                <Col md={6}>
                  <TextInput
                    name="code"
                    label="Profile Code*"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    placeholder="Enter unique profile code"
                  />
                </Col>
                <Col md={6}>
                  <TextInput
                    name="procedure_code"
                    label="Procedure Code"
                    value={formData.procedure_code}
                    onChange={handleChange}
                    placeholder="Enter procedure code"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={8}>
                  <TextInput
                    name="test_profile"
                    label="Profile Name*"
                    value={formData.test_profile}
                    onChange={handleChange}
                    required
                    placeholder="Enter profile name"
                  />
                </Col>

              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter profile description"
                />
              </Form.Group>
            </div>

            {/* Pricing Information */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Pricing Information</h6>
              <Row>
                <Col md={3}>
                  <NumberInput
                    name="test_price"
                    label="Base Price*"
                    value={formData.test_price}
                    onChange={handleChange}
                    min={0}
                    step={0.01}
                    required
                    placeholder="0.00"
                  />
                </Col>
                <Col md={3}>
                  <NumberInput
                    name="discount_price"
                    label="Discount Price"
                    value={formData.discount_price}
                    onChange={handleChange}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                  />
                </Col>
                <Col md={3}>
                  <NumberInput
                    name="emergency_price"
                    label="Emergency Price"
                    value={formData.emergency_price}
                    onChange={handleChange}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                  />
                </Col>
                <Col md={3}>
                  <NumberInput
                    name="home_visit_price"
                    label="Home Visit Price"
                    value={formData.home_visit_price}
                    onChange={handleChange}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <NumberInput
                    name="discount"
                    label="Discount (%)"
                    value={formData.discount}
                    onChange={handleChange}
                    min={0}
                    max={100}
                    step={0.1}
                    placeholder="0.0"
                  />
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="">--- Select Category ---</option>
                      <option value="Standard">Standard</option>
                      <option value="Premium">Premium</option>
                      <option value="Basic">Basic</option>
                      <option value="Comprehensive">Comprehensive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Test Configuration */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Test Configuration</h6>
              <Row>
                <Col md={6}>
                  <NumberInput
                    name="test_count"
                    label="Number of Tests"
                    value={formData.test_count}
                    onChange={handleChange}
                    min={0}
                    placeholder="0"
                  />
                </Col>
                {/* Test Configuration */}
                <div className="border rounded p-3 mb-3">
                  <h6 className="text-primary mb-3">Test Configuration</h6>

                  <Row>
                   

                   
                   <SearchableDropdown
  name="currentTest.test_id"
  label="Test Name"
  value={formData.currentTest?.test_id}
  onChange={(value) =>
    setFormData(prev => ({
      ...prev,
      currentTest: {
        ...prev.currentTest,
        test_id: value?.id,
        testName: value?.testName || value?.test_profile
      }
    }))
  }
  options={testProfiles}
/>

<Form.Control
  type="number"
  name="currentTest.amount"
  value={formData.currentTest?.amount}
  onChange={(e) =>
    setFormData(prev => ({
      ...prev,
      currentTest: { ...prev.currentTest, amount: e.target.value }
    }))
  }
/>


                    <Col md={1} className="d-flex align-items-end">
                      <Button
                        variant="primary"
                        onClick={addTestItem}
                        disabled={!newTestItem.testName}
                        className="mb-2"
                      >
                        Add
                      </Button>
                    </Col>
                  </Row>

                  {/* Selected Tests Table */}
                  {formData.testItems?.length > 0 && (
                    <div className="table-responsive h-100 mt-3">
                      <Table striped bordered hover>
                        <thead className="table-dark">
                          <tr>
                            <th>Test ID</th>
                            <th>Test Name</th>
                            <th>Amount</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.testItems.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <span className="badge bg-primary">{item.test_id || 'N/A'}</span>
                              </td>
                              <td>
                                <div>
                                  <strong>{item.testName}</strong>
                                  {item.department && (
                                    <div>
                                      <small className="text-muted">{item.department}</small>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>₹{parseFloat(item.amount).toFixed(2)}</td>
                              <td>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => removeTestItem(item.id)}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="table-info">
                            <th colSpan="2">Total Test(s): {formData.testItems?.length}</th>
                            <th>Total Amount: ₹{formData.billAmount}</th>
                            <th></th>
                          </tr>
                        </tfoot>
                      </Table>
                    </div>
                  )}
                </div>

              </Row>
            </div>

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

        {activeTab === 'methodMaster' && (
          <>
            <TextInput
              name="code"
              label="Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="method"
              label="Method"
              value={formData.method}
              onChange={handleChange}
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

        {activeTab === 'antibioticMaster' && (
          <>
            <TextInput
              name="antibiotic_code"
              label="Antibiotic Code"
              value={formData.antibiotic_code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="antibiotic_group"
              label="Antibiotic Group"
              value={formData.antibiotic_group}
              onChange={handleChange}
            />
            <TextInput
              name="antibiotic_description"
              label="Description"
              value={formData.antibiotic_description}
              onChange={handleChange}
              required
            />
            <TextInput
              name="antibiotic_content"
              label="Content"
              value={formData.antibiotic_content}
              onChange={handleChange}
            />
            <NumberInput
              name="order"
              label="Order"
              value={formData.order}
              onChange={handleChange}
              min={0}
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

        {activeTab === 'organismMaster' && (
          <>
            <TextInput
              name="code"
              label="Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              required
            />
            <Form.Check
              type="switch"
              id="no_growth"
              name="no_growth"
              label="No Growth"
              checked={formData.no_growth}
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

        {activeTab === 'unitOfMeasurement' && (
          <>
            <TextInput
              name="code"
              label="Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="technical"
                  label="Technical"
                  value={formData.technical}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="inventory"
                  label="Inventory"
                  value={formData.inventory}
                  onChange={handleChange}
                />
              </div>
            </div>
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

        {activeTab === 'specimenMaster' && (
          <>
            <TextInput
              name="code"
              label="Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="specimen"
              label="Specimen"
              value={formData.specimen}
              onChange={handleChange}
              required
            />
            <TextInput
              name="container"
              label="Container"
              value={formData.container}
              onChange={handleChange}
            />
            <Form.Group className="mb-3">
              <Form.Label>Disposable</Form.Label>
              <Form.Select
                name="disposable"
                value={formData.disposable}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
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

        {activeTab === 'organismVsAntibiotic' && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Organism</Form.Label>
              <SearchableSelect
                name="organism"
                value={formData.organism}
                onChange={handleChange}
                options={masterData.organismMaster || []}
                placeholder="Select Organism"
                getOptionLabel={(option) => option.description || option.name}
                getOptionValue={(option) => option.description || option.id}
                isRequired={true}
                isClearable={false}
              />
            </Form.Group>
            <TextInput
              name="antibiotic_group"
              label="Antibiotic Group"
              value={formData.antibiotic_group}
              onChange={handleChange}
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

        {activeTab === 'containerMaster' && (
          <>
            <TextInput
              name="code"
              label="Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              required
            />
            <TextInput
              name="short_name"
              label="Short Name"
              value={formData.short_name}
              onChange={handleChange}
            />
            <TextInput
              name="color"
              label="Color"
              value={formData.color}
              onChange={handleChange}
              type="color"
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

        {activeTab === 'mainDepartmentMaster' && (
          <>
            <TextInput
              name="major_department"
              label="Major Department"
              value={formData.major_department}
              onChange={handleChange}
            />
            <TextInput
              name="code"
              label="Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="department"
              label="Department"
              value={formData.department}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-6">
                <NumberInput
                  name="order"
                  label="Order"
                  value={formData.order}
                  onChange={handleChange}
                  min={0}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="short_name"
                  label="Short Name"
                  value={formData.short_name}
                  onChange={handleChange}
                />
              </div>
            </div>
            <TextInput
              name="queue"
              label="Queue"
              value={formData.queue}
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

        {activeTab === 'departmentSettings' && (
          <>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="main"
                  label="Main"
                  value={formData.main}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="code"
                  label="Code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <TextInput
              name="sub_name"
              label="Sub Name"
              value={formData.sub_name}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-4">
                <NumberInput
                  name="service_time"
                  label="Service Time"
                  value={formData.service_time}
                  onChange={handleChange}
                  min={0}
                />
              </div>
              <div className="col-md-4">
                <TextInput
                  name="room"
                  label="Room"
                  value={formData.room}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <NumberInput
                  name="order"
                  label="Order"
                  value={formData.order}
                  onChange={handleChange}
                  min={0}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <NumberInput
                  name="dept_amt"
                  label="Department Amount"
                  value={formData.dept_amt}
                  onChange={handleChange}
                  min={0}
                  step={0.01}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="short"
                  label="Short"
                  value={formData.short}
                  onChange={handleChange}
                />
              </div>
            </div>
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

        {activeTab === 'authorizationSettings' && (
          <>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="main"
                  label="Main"
                  value={formData.main}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="code"
                  label="Code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <TextInput
              name="sub_name"
              label="Sub Name"
              value={formData.sub_name}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="authorization"
                  label="Authorization"
                  value={formData.authorization}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="authorization_type"
                  label="Authorization Type"
                  value={formData.authorization_type}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="email_at"
                  label="Email"
                  value={formData.email_at}
                  onChange={handleChange}
                  type="email"
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="report_type"
                  label="Report Type"
                  value={formData.report_type}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="specimen"
                  label="Specimen"
                  value={formData.specimen}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="staging"
                  label="Staging"
                  value={formData.staging}
                  onChange={handleChange}
                />
              </div>
            </div>
            <Form.Check
              type="switch"
              id="hide_sign"
              name="hide_sign"
              label="Hide Sign"
              checked={formData.hide_sign}
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

        {activeTab === 'printOrder' && (
          <>
            <TextInput
              name="item"
              label="Item"
              value={formData.item}
              onChange={handleChange}
              required
            />
            <NumberInput
              name="order"
              label="Order"
              value={formData.order}
              onChange={handleChange}
              min={0}
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

        {activeTab === 'testMaster' && (
          <>
            {/* Test Master Tabs */}
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link
                  active={testMasterSubTab === 'addTest'}
                  onClick={() => setTestMasterSubTab('addTest')}
                  style={{ cursor: 'pointer' }}
                >
                  ADD TEST
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={testMasterSubTab === 'subTest'}
                  onClick={() => setTestMasterSubTab('subTest')}
                  style={{ cursor: 'pointer' }}
                >
                  SUB TEST
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={testMasterSubTab === 'settings'}
                  onClick={() => setTestMasterSubTab('settings')}
                  style={{ cursor: 'pointer' }}
                >
                  SETTINGS
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={testMasterSubTab === 'options'}
                  onClick={() => setTestMasterSubTab('options')}
                  style={{ cursor: 'pointer' }}
                >
                  OPTIONS
                </Nav.Link>
              </Nav.Item>
            </Nav>

            {/* ADD TEST Tab Content */}
            {testMasterSubTab === 'addTest' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Department*</Form.Label>
                  <SearchableDropdown
                    name="department"
                    label="Department"
                    value={testMasterFormData.department}
                    onChange={handleTestMasterChange}
                    options={getAllDepartments()}
                    placeholder="--- Select Department ---"
                    isRequired={true}
                    isClearable={false}
                    variant="mui"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Test Name*</Form.Label>
                  <SearchableDropdown
                    name="testName"
                    label="Test Name"
                    value={testMasterFormData.testName}
                    onChange={handleTestMasterChange}
                    options={getTestProfileOptions()}
                    placeholder="Select test name from profiles"
                    isRequired={true}
                    isClearable={false}
                    variant="mui"
                  />
                </Form.Group>
                <TextInput
                  name="emrClassification"
                  label="EMR Classification"
                  value={testMasterFormData.emrClassification}
                  onChange={handleTestMasterChange}
                />
                <TextInput
                  name="shortName"
                  label="Short Name"
                  value={testMasterFormData.shortName}
                  onChange={handleTestMasterChange}
                />
                <TextInput
                  name="displayName"
                  label="Display Name"
                  value={testMasterFormData.displayName}
                  onChange={handleTestMasterChange}
                />
                <TextInput
                  name="hmsCode"
                  label="HMS Code"
                  value={testMasterFormData.hmsCode}
                  onChange={handleTestMasterChange}
                />
                <TextInput
                  name="internationalCode"
                  label="International Code"
                  value={testMasterFormData.internationalCode}
                  onChange={handleTestMasterChange}
                />

                {/* Method with Code */}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Method</Form.Label>
                      <SearchableDropdown
                        name="method"
                        label="Method"
                        value={testMasterFormData.method}
                        onChange={handleTestMasterChange}
                        options={getMasterDataOptions('methodMaster', 'method', 'id')}
                        placeholder="Select Method"
                        isClearable={true}
                        variant="mui"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <TextInput
                      name="methodCode"
                      label="Method Code"
                      value={testMasterFormData.methodCode}
                      onChange={handleTestMasterChange}
                      placeholder="Enter method code"
                    />
                  </Col>
                </Row>

                {/* Primary Specimen with Code */}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Primary Specimen</Form.Label>
                      <SearchableDropdown
                        name="primarySpecimen"
                        label="Primary Specimen"
                        value={testMasterFormData.primarySpecimen}
                        onChange={handleTestMasterChange}
                        options={getMasterDataOptions('specimenMaster', 'specimen', 'id')}
                        placeholder="Select Primary Specimen"
                        isClearable={true}
                        variant="mui"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <TextInput
                      name="primarySpecimenCode"
                      label="Primary Specimen Code"
                      value={testMasterFormData.primarySpecimenCode}
                      onChange={handleTestMasterChange}
                      placeholder="Enter primary specimen code"
                    />
                  </Col>
                </Row>

                {/* Specimen with Code */}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Specimen</Form.Label>
                      <SearchableDropdown
                        name="specimen"
                        label="Specimen"
                        value={testMasterFormData.specimen}
                        onChange={handleTestMasterChange}
                        options={getMasterDataOptions('specimenMaster', 'specimen', 'id')}
                        placeholder="Select Specimen"
                        isClearable={true}
                        variant="mui"
                        isMulti={true}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <TextInput
                      name="specimenCode"
                      label="Specimen Code"
                      value={testMasterFormData.specimenCode}
                      onChange={handleTestMasterChange}
                      placeholder="Enter specimen code"
                    />
                  </Col>
                </Row>

                {/* Container with Code */}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Container</Form.Label>
                      <SearchableDropdown
                        name="container"
                        label="Container"
                        value={testMasterFormData.container}
                        onChange={handleTestMasterChange}
                        options={getMasterDataOptions('containerMaster', 'description', 'id')}
                        placeholder="Select Container"
                        isClearable={true}
                        variant="mui"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <TextInput
                      name="containerCode"
                      label="Container Code"
                      value={testMasterFormData.containerCode}
                      onChange={handleTestMasterChange}
                      placeholder="Enter container code"
                    />
                  </Col>
                </Row>

                <TextInput
                  name="interpretation"
                  label="Interpretation"
                  value={testMasterFormData.interpretation}
                  onChange={handleTestMasterChange}
                  as="textarea"
                  rows={3}
                />
                <TextInput
                  name="instructions"
                  label="Instructions"
                  value={testMasterFormData.instructions}
                  onChange={handleTestMasterChange}
                  as="textarea"
                  rows={3}
                />
                <TextInput
                  name="specialReport"
                  label="Special Report"
                  value={testMasterFormData.specialReport}
                  onChange={handleTestMasterChange}
                />
                <TextInput
                  name="reportName"
                  label="Report Name"
                  value={testMasterFormData.reportName}
                  onChange={handleTestMasterChange}
                />
              </>
            )}

            {/* SUB TEST Tab Content */}
            {testMasterSubTab === 'subTest' && (
              <>
                <div className="border rounded p-3 mb-3">
                  <h6 className="text-primary mb-3">Associated Sub-Tests</h6>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Sub-Tests</Form.Label>
                    <Autocomplete
                      multiple
                      options={getSubTestOptions()}
                      value={getSubTestOptions().filter(option => selectedSubTests.includes(option.value))}
                      onChange={(event, newValue) => {
                        handleSubTestChange(newValue);
                      }}
                      getOptionLabel={(option) => option.label}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Search and select sub-tests"
                          variant="outlined"
                          size="small"
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Badge
                            key={option.value}
                            bg="primary"
                            className="me-1 mb-1"
                            {...getTagProps({ index })}
                          >
                            {option.label}
                          </Badge>
                        ))
                      }
                    />
                    <Form.Text className="text-muted">
                      Select multiple sub-tests that are part of this main test
                    </Form.Text>
                  </Form.Group>
                </div>
              </>
            )}

            {/* SETTINGS Tab Content */}
            {testMasterSubTab === 'settings' && (
              <>
                {/* Unacceptable Conditions */}
                <Form.Group className="mb-3">
                  <Form.Label>Unacceptable Conditions</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="unacceptableConditions"
                    value={Array.isArray(testMasterFormData.unacceptableConditions) ? testMasterFormData.unacceptableConditions.join(', ') : testMasterFormData.unacceptableConditions || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const conditions = value.split(',').map(item => item.trim()).filter(item => item);
                      handleTestMasterChange({
                        target: {
                          name: 'unacceptableConditions',
                          value: conditions
                        }
                      });
                    }}
                    placeholder="Enter unacceptable conditions separated by commas (e.g., Hemolyzed, Lipemic)"
                  />
                </Form.Group>

                {/* Min Sample Qty */}
                <TextInput
                  name="minSampleQty"
                  label="Min. Sample Qty"
                  value={testMasterFormData.minSampleQty}
                  onChange={handleTestMasterChange}
                  placeholder="e.g., 2ml"
                />

                {/* Cut-off Time */}
                <TextInput
                  name="cutoffTime"
                  label="Cut-off Time"
                  value={testMasterFormData.cutoffTime}
                  onChange={handleTestMasterChange}
                  placeholder="e.g., 10:00 AM"
                />

                {/* Test Suffix and Description */}
                <Row>
                  <Col md={6}>
                    <TextInput
                      name="testSuffix"
                      label="Test Suffix"
                      value={testMasterFormData.testSuffix}
                      onChange={handleTestMasterChange}
                      placeholder="Enter test suffix"
                    />
                  </Col>
                  <Col md={6}>
                    <TextInput
                      name="suffixDesc"
                      label="Suffix Desc."
                      value={testMasterFormData.suffixDesc}
                      onChange={handleTestMasterChange}
                      placeholder="Enter suffix description"
                    />
                  </Col>
                </Row>

                {/* Min Process Time and Period */}
                <Row>
                  <Col md={4}>
                    <NumberInput
                      name="minProcessTime"
                      label="Min. Process Time"
                      value={testMasterFormData.minProcessTime}
                      onChange={handleTestMasterChange}
                      min={0}
                      placeholder="0"
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Min. Process Period</Form.Label>
                      <Form.Select
                        name="minProcessPeriod"
                        value={testMasterFormData.minProcessPeriod}
                        onChange={handleTestMasterChange}
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
                      value={testMasterFormData.reportingDays}
                      onChange={handleTestMasterChange}
                      min={0}
                      placeholder="0"
                    />
                  </Col>
                </Row>

                {/* Emergency Process Time and Period */}
                <Row>
                  <Col md={4}>
                    <NumberInput
                      name="emergencyProcessTime"
                      label="Emergency. Process Time"
                      value={testMasterFormData.emergencyProcessTime}
                      onChange={handleTestMasterChange}
                      min={0}
                      placeholder="0"
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Emergency. Process Period</Form.Label>
                      <Form.Select
                        name="emergencyProcessPeriod"
                        value={testMasterFormData.emergencyProcessPeriod}
                        onChange={handleTestMasterChange}
                      >
                        <option value="">-- Select --</option>
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <TextInput
                      name="serviceTime"
                      label="Service Time"
                      value={testMasterFormData.serviceTime}
                      onChange={handleTestMasterChange}
                      placeholder="e.g., 24 hours"
                    />
                  </Col>
                </Row>

                {/* Expiry Time and Period */}
                <Row>
                  <Col md={4}>
                    <NumberInput
                      name="expiryTime"
                      label="Expiry Time"
                      value={testMasterFormData.expiryTime}
                      onChange={handleTestMasterChange}
                      min={0}
                      placeholder="0"
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Expiry Period</Form.Label>
                      <Form.Select
                        name="expiryPeriod"
                        value={testMasterFormData.expiryPeriod}
                        onChange={handleTestMasterChange}
                      >
                        <option value="">-- Select --</option>
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

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
                      checked={testMasterFormData.applicableTo === 'male'}
                      onChange={handleTestMasterChange}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      name="applicableTo"
                      id="female"
                      label="Female"
                      value="female"
                      checked={testMasterFormData.applicableTo === 'female'}
                      onChange={handleTestMasterChange}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      name="applicableTo"
                      id="both"
                      label="Both"
                      value="both"
                      checked={testMasterFormData.applicableTo === 'both'}
                      onChange={handleTestMasterChange}
                    />
                  </div>
                </Form.Group>

                {/* Test Done On */}
                <Form.Group className="mb-3">
                  <Form.Label>Test Done On*</Form.Label>
                  <div>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <Form.Check
                        key={day}
                        inline
                        type="checkbox"
                        name={`testDoneOn.${day.toLowerCase()}`}
                        id={`testDoneOn_${day}`}
                        label={day}
                        checked={testMasterFormData.testDoneOn?.includes(day) || false}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const currentDays = Array.isArray(testMasterFormData.testDoneOn) ? testMasterFormData.testDoneOn : [];
                          let updatedDays;

                          if (isChecked) {
                            updatedDays = [...currentDays, day];
                          } else {
                            updatedDays = currentDays.filter(d => d !== day);
                          }

                          handleTestMasterChange({
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
                        checked={testMasterFormData.alertSMS || false}
                        onChange={handleTestMasterChange}
                      />
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Alert Period</Form.Label>
                        <Form.Select
                          name="alertPeriod"
                          value={testMasterFormData.alertPeriod}
                          onChange={handleTestMasterChange}
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
                      value={testMasterFormData.alertMessage}
                      onChange={handleTestMasterChange}
                      placeholder="Enter alert message"
                    />
                  </Form.Group>
                </div>
              </>
            )}

            {/* OPTIONS Tab Content */}
            {testMasterSubTab === 'options' && (
              <>
                <div className="border rounded p-3 mb-3">
                  <h6 className="text-primary mb-3">Test Options</h6>
                  <Row>
                    <Col md={4}>
                      <Form.Check
                        type="checkbox"
                        name="options.noSale"
                        label="No Sale"
                        checked={testMasterFormData.options?.noSale || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.inactive"
                        label="Inactive"
                        checked={testMasterFormData.options?.inactive || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.noBarCode"
                        label="No BarCode"
                        checked={testMasterFormData.options?.noBarCode || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.allowDiscount"
                        label="Allow Discount"
                        checked={testMasterFormData.options?.allowDiscount || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.hideOnlineReport"
                        label="Hide Online Report/Auto Report"
                        checked={testMasterFormData.options?.hideOnlineReport || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.noDiscount"
                        label="No Discount"
                        checked={testMasterFormData.options?.noDiscount || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.allowModifySpecimen"
                        label="Allow Modify Specimen and Container"
                        checked={testMasterFormData.options?.allowModifySpecimen || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.editComment"
                        label="EMR Comment"
                        checked={testMasterFormData.options?.editComment || false}
                        onChange={handleTestMasterChange}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Check
                        type="checkbox"
                        name="options.accreditedTest"
                        label="Accredited Test"
                        checked={testMasterFormData.options?.accreditedTest || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.preferDoctor"
                        label="Prefer Doctor"
                        checked={testMasterFormData.options?.preferDoctor || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.appointment"
                        label="Appointment"
                        checked={testMasterFormData.options?.appointment || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.allowNegative"
                        label="Allow Negative"
                        checked={testMasterFormData.options?.allowNegative || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.onlineRegistration"
                        label="Online registration"
                        checked={testMasterFormData.options?.onlineRegistration || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.automatedService"
                        label="Automated Service"
                        checked={testMasterFormData.options?.automatedService || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.allowIncreaseAmount"
                        label="Allow Increase Amount"
                        checked={testMasterFormData.options?.allowIncreaseAmount || false}
                        onChange={handleTestMasterChange}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Check
                        type="checkbox"
                        name="options.noHouseVisit"
                        label="No House Visit"
                        checked={testMasterFormData.options?.noHouseVisit || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.editBill"
                        label="Edit Bill"
                        checked={testMasterFormData.options?.editBill || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.noResult"
                        label="No Result"
                        checked={testMasterFormData.options?.noResult || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.allowComma"
                        label="Allow Comma"
                        checked={testMasterFormData.options?.allowComma || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.autoAuthorise"
                        label="Auto Authorise"
                        checked={testMasterFormData.options?.autoAuthorise || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.isCovid"
                        label="Is Covid"
                        checked={testMasterFormData.options?.isCovid || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.noLoyalty"
                        label="No Loyalty"
                        checked={testMasterFormData.options?.noLoyalty || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.outsourced"
                        label="Outsourced"
                        checked={testMasterFormData.options?.outsourced || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.editQuantity"
                        label="Edit Quantity"
                        checked={testMasterFormData.options?.editQuantity || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.attachServiceDoctor"
                        label="Attach Service Doctor"
                        checked={testMasterFormData.options?.attachServiceDoctor || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.noSMS"
                        label="No SMS"
                        checked={testMasterFormData.options?.noSMS || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.noMembershipDiscount"
                        label="No Membership Discount"
                        checked={testMasterFormData.options?.noMembershipDiscount || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.noAppDiscount"
                        label="No App Discount"
                        checked={testMasterFormData.options?.noAppDiscount || false}
                        onChange={handleTestMasterChange}
                      />
                      <Form.Check
                        type="checkbox"
                        name="options.printInsideBox"
                        label="Print Inside Box"
                        checked={testMasterFormData.options?.printInsideBox || false}
                        onChange={handleTestMasterChange}
                      />
                    </Col>
                  </Row>
                </div>
              </>
            )}

            {/* Active Switch - Always visible */}
            <Form.Check
              type="switch"
              id="is_active"
              name="is_active"
              label="Active"
              checked={testMasterFormData.is_active}
              onChange={handleTestMasterChange}
            />
          </>
        )}

        {activeTab === 'subTestMaster' && (
          <>
            <TextInput
              name="sub_test_name"
              label="Sub Test Name"
              value={formData.sub_test_name}
              onChange={handleChange}
              required
              placeholder="Enter sub test name"
            />
            <Form.Group className="mb-3">
              <Form.Label>Department*</Form.Label>
              <SearchableDropdown
                name="department_id"
                label="Department"
                value={formData.department_id}
                onChange={handleChange}
                options={getAllDepartments()}
                placeholder="--- Select Department ---"
                isRequired={true}
                isClearable={false}
                variant="mui"
              />
            </Form.Group>
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={3}
              placeholder="Enter description (optional)"
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

        {activeTab === 'departmentMaster' && (
          <>
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Basic Information</h6>
              <Row>
                <Col md={6}>
                  <TextInput
                    name="main_department"
                    label="Main Department*"
                    value={formData.main_department}
                    onChange={handleChange}
                    required
                    placeholder="Enter main department"
                  />
                </Col>
                <Col md={6}>
                  <TextInput
                    name="code"
                    label="Code*"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    placeholder="Enter department code"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <TextInput
                    name="name"
                    label="Name*"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter department name"
                  />
                </Col>
                <Col md={6}>
                  <TextInput
                    name="short_name"
                    label="Short Name*"
                    value={formData.short_name}
                    onChange={handleChange}
                    required
                    placeholder="Enter short name"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <TextInput
                    name="room_no"
                    label="Room No"
                    value={formData.room_no}
                    onChange={handleChange}
                    placeholder="Enter room number"
                  />
                </Col>
                <Col md={4}>
                  <NumberInput
                    name="order"
                    label="Order*"
                    value={formData.order}
                    onChange={handleChange}
                    required
                    min={0}
                    placeholder="Display order"
                  />
                </Col>
                <Col md={4}>
                  <NumberInput
                    name="min_test_amt"
                    label="Min Test Amount"
                    value={formData.min_test_amt}
                    onChange={handleChange}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <NumberInput
                    name="service_time"
                    label="Service Time (minutes)"
                    value={formData.service_time}
                    onChange={handleChange}
                    min={0}
                    placeholder="Service time in minutes"
                  />
                </Col>
              </Row>
            </div>

            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Department Settings</h6>
              <Row>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="sample_collect"
                    name="sample_collect"
                    label="Sample Collect"
                    checked={formData.sample_collect}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="process_receive"
                    name="process_receive"
                    label="Process Receive"
                    checked={formData.process_receive}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="sample_receive"
                    name="sample_receive"
                    label="Sample Receive"
                    checked={formData.sample_receive}
                    onChange={handleChange}
                  />
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="sample_no"
                    name="sample_no"
                    label="Sample No"
                    checked={formData.sample_no}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="hide_pending"
                    name="hide_pending"
                    label="Hide Pending"
                    checked={formData.hide_pending}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="hide_dept"
                    name="hide_dept"
                    label="Hide Dept"
                    checked={formData.hide_dept}
                    onChange={handleChange}
                  />
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="hide_barcode"
                    name="hide_barcode"
                    label="Hide BarCode"
                    checked={formData.hide_barcode}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="appointment"
                    name="appointment"
                    label="Appointment"
                    checked={formData.appointment}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="specimen"
                    name="specimen"
                    label="Specimen"
                    checked={formData.specimen}
                    onChange={handleChange}
                  />
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="staging"
                    name="staging"
                    label="Staging"
                    checked={formData.staging}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="hide_sign"
                    name="hide_sign"
                    label="Hide Sign"
                    checked={formData.hide_sign}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="is_active"
                    name="is_active"
                    label="Active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                </Col>
              </Row>
            </div>

            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Authorization Settings</h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Authorization</Form.Label>
                    <Form.Select
                      name="authorization"
                      value={formData.authorization}
                      onChange={handleChange}
                    >
                      <option value="">--- No Auth ---</option>
                      <option value="required">Required</option>
                      <option value="optional">Optional</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Authorization Type</Form.Label>
                    <Form.Select
                      name="authorization_type"
                      value={formData.authorization_type}
                      onChange={handleChange}
                    >
                      <option value="">--- Select ---</option>
                      <option value="doctor">Doctor</option>
                      <option value="technician">Technician</option>
                      <option value="supervisor">Supervisor</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email At</Form.Label>
                    <Form.Select
                      name="email_at"
                      value={formData.email_at}
                      onChange={handleChange}
                    >
                      <option value="">--- Empty ---</option>
                      <option value="completion">At Completion</option>
                      <option value="approval">At Approval</option>
                      <option value="both">Both</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Report Type</Form.Label>
                    <Form.Select
                      name="report_type"
                      value={formData.report_type}
                      onChange={handleChange}
                    >
                      <option value="">--- Report Type ---</option>
                      <option value="standard">Standard</option>
                      <option value="detailed">Detailed</option>
                      <option value="summary">Summary</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </>
        )}

        {activeTab === 'profileData' && (
          <>
            <TextInput
              name="code"
              label="Code"
              value={formData.code}
              onChange={handleChange}
              required
              placeholder="Enter code"
            />
            <TextInput
              name="procedure_code"
              label="Procedure Code"
              value={formData.procedure_code}
              onChange={handleChange}
              placeholder="Enter procedure code (optional)"
            />
            <TextInput
              name="test_profile"
              label="Test/Profile"
              value={formData.test_profile}
              onChange={handleChange}
              required
              placeholder="Enter test or profile name"
            />
            <NumberInput
              name="test_price"
              label="Test Price"
              value={formData.test_price}
              onChange={handleChange}
              min={0}
              step={0.01}
              placeholder="0.00"
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
                activeTab === 'paymentMethods' ? 'Payment Method' :
                  activeTab === 'containers' ? 'Container' :
                    activeTab === 'instruments' ? 'Instrument' :
                      activeTab === 'reagents' ? 'Reagent' :
                        activeTab === 'suppliers' ? 'Supplier' :
                          activeTab === 'units' ? 'Unit' :
                            activeTab === 'testMethods' ? 'Test Method' :
                              activeTab === 'patients' ? 'Patient' :
                                activeTab === 'profileMaster' ? 'Profile' :
                                  activeTab === 'methodMaster' ? 'Method' :
                                    activeTab === 'antibioticMaster' ? 'Antibiotic' :
                                      activeTab === 'organismMaster' ? 'Organism' :
                                        activeTab === 'unitOfMeasurement' ? 'Unit of Measurement' :
                                          activeTab === 'specimenMaster' ? 'Specimen' :
                                            activeTab === 'organismVsAntibiotic' ? 'Organism vs Antibiotic' :
                                              activeTab === 'containerMaster' ? 'Container Master' :
                                                activeTab === 'mainDepartmentMaster' ? 'Main Department' :
                                                  activeTab === 'departmentSettings' ? 'Department Setting' :
                                                    activeTab === 'authorizationSettings' ? 'Authorization Setting' :
                                                      activeTab === 'printOrder' ? 'Print Order' :
                                                        activeTab === 'testMaster' ? 'Test Master' :
                                                          activeTab === 'subTestMaster' ? 'Sub Test Master' :
                                                            activeTab === 'departmentMaster' ? 'Department Master' :
                                                              activeTab === 'profileData' ? 'Profile Data' :
                                                                'Item'}`}
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
              <Form.Label>Category*</Form.Label>
              <SearchableDropdown
                name="category_id"
                label="Category"
                value={formData.category_id}
                onChange={handleChange}
                options={getMasterDataOptions('testCategories', 'name', 'id')}
                placeholder="Select Category"
                isRequired={true}
                isClearable={false}
                variant="mui"
              />
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
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Department Information</h6>
              <Row>
                <Col md={6}>
                  <TextInput
                    name="code"
                    label="Department Code*"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    placeholder="Department code"
                  />
                </Col>
                <Col md={6}>
                  <TextInput
                    name="department"
                    label="Department Name*"
                    value={formData.department}
                    onChange={handleDepartmentNameChange}
                    required
                    placeholder="Enter department name"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <TextInput
                    name="test_profile"
                    label="Test Profile*"
                    value={formData.test_profile}
                    onChange={handleChange}
                    required
                    placeholder="Enter test profile name"
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
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <Form.Check
                    type="switch"
                    id="is_active_edit"
                    name="is_active"
                    label="Active Department"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                </Col>
              </Row>
            </div>
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

        {activeTab === 'containers' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="type"
              label="Type"
              value={formData.type}
              onChange={handleChange}
              placeholder="e.g., Tube, Bottle, Vial"
            />
            <div className="row">
              <div className="col-md-6">
                <NumberInput
                  name="volume"
                  label="Volume"
                  value={formData.volume}
                  onChange={handleChange}
                  min={0}
                  step={0.1}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="unit"
                  label="Unit"
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="mL, L, etc."
                />
              </div>
            </div>
            <TextInput
              name="color"
              label="Color"
              value={formData.color}
              onChange={handleChange}
              type="color"
            />
            <TextInput
              name="additive"
              label="Additive"
              value={formData.additive}
              onChange={handleChange}
              placeholder="e.g., EDTA, Heparin, None"
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

        {activeTab === 'instruments' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="manufacturer"
                  label="Manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="model"
                  label="Model"
                  value={formData.model}
                  onChange={handleChange}
                />
              </div>
            </div>
            <TextInput
              name="serial_number"
              label="Serial Number"
              value={formData.serial_number}
              onChange={handleChange}
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="installation_date"
                  label="Installation Date"
                  value={formData.installation_date}
                  onChange={handleChange}
                  type="date"
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="calibration_due"
                  label="Calibration Due"
                  value={formData.calibration_due}
                  onChange={handleChange}
                  type="date"
                />
              </div>
            </div>
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

        {activeTab === 'reagents' && (
          <>
            <TextInput
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="lot_number"
                  label="Lot Number"
                  value={formData.lot_number}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="manufacturer"
                  label="Manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="expiry_date"
                  label="Expiry Date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                  type="date"
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="storage_temperature"
                  label="Storage Temperature"
                  value={formData.storage_temperature}
                  onChange={handleChange}
                  placeholder="e.g., 2-8°C, Room temp"
                />
              </div>
            </div>
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

        {activeTab === 'suppliers' && (
          <>
            <TextInput
              name="name"
              label="Company Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="contact_person"
              label="Contact Person"
              value={formData.contact_person}
              onChange={handleChange}
            />
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="email"
                  label="Email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="phone"
                  label="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                  type="tel"
                />
              </div>
            </div>
            <TextInput
              name="address"
              label="Address"
              value={formData.address}
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

        {activeTab === 'units' && (
          <>
            <TextInput
              name="name"
              label="Unit Name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Milligrams per deciliter"
            />
            <TextInput
              name="symbol"
              label="Symbol"
              value={formData.symbol}
              onChange={handleChange}
              required
              placeholder="e.g., mg/dL"
            />
            <TextInput
              name="type"
              label="Type"
              value={formData.type}
              onChange={handleChange}
              placeholder="e.g., Concentration, Volume, Mass"
            />
            <NumberInput
              name="conversion_factor"
              label="Conversion Factor"
              value={formData.conversion_factor}
              onChange={handleChange}
              min={0}
              step={0.001}
              placeholder="Factor to convert to base unit"
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

        {activeTab === 'testMethods' && (
          <>
            <TextInput
              name="name"
              label="Method Name"
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
              name="principle"
              label="Principle"
              value={formData.principle}
              onChange={handleChange}
              as="textarea"
              rows={2}
              placeholder="Scientific principle behind the method"
            />
            <TextInput
              name="procedure"
              label="Procedure"
              value={formData.procedure}
              onChange={handleChange}
              as="textarea"
              rows={3}
              placeholder="Step-by-step procedure"
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

        {activeTab === 'patients' && (
          <>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="first_name"
                  label="First Name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="last_name"
                  label="Last Name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="date_of_birth"
                  label="Date of Birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  type="date"
                  required
                />
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="phone"
                  label="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                  type="tel"
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="email"
                  label="Email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                />
              </div>
            </div>
            <TextInput
              name="address"
              label="Address"
              value={formData.address}
              onChange={handleChange}
              as="textarea"
              rows={2}
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

        {activeTab === 'profileMaster' && (
          <>
            {/* Basic Information */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Basic Information</h6>
              <Row>
                <Col md={6}>
                  <TextInput
                    name="code"
                    label="Profile Code*"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    placeholder="Enter unique profile code"
                  />
                </Col>
                <Col md={6}>
                  <TextInput
                    name="procedure_code"
                    label="Procedure Code"
                    value={formData.procedure_code}
                    onChange={handleChange}
                    placeholder="Enter procedure code"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={8}>
                  <TextInput
                    name="test_profile"
                    label="Profile Name*"
                    value={formData.test_profile}
                    onChange={handleChange}
                    required
                    placeholder="Enter profile name"
                  />
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Department</Form.Label>
                    <Form.Select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                    >
                      <option value="">--- Select Department ---</option>
                      {(masterData.mainDepartmentMaster || []).map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.department}
                        </option>
                      ))}
                    </Form.Select>
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
                  onChange={handleChange}
                  placeholder="Enter profile description"
                />
              </Form.Group>
            </div>

            {/* Pricing Information */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Pricing Information</h6>
              <Row>
                <Col md={3}>
                  <NumberInput
                    name="test_price"
                    label="Base Price*"
                    value={formData.test_price}
                    onChange={handleChange}
                    min={0}
                    step={0.01}
                    required
                    placeholder="0.00"
                  />
                </Col>
                <Col md={3}>
                  <NumberInput
                    name="discount_price"
                    label="Discount Price"
                    value={formData.discount_price}
                    onChange={handleChange}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                  />
                </Col>
                <Col md={3}>
                  <NumberInput
                    name="emergency_price"
                    label="Emergency Price"
                    value={formData.emergency_price}
                    onChange={handleChange}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                  />
                </Col>
                <Col md={3}>
                  <NumberInput
                    name="home_visit_price"
                    label="Home Visit Price"
                    value={formData.home_visit_price}
                    onChange={handleChange}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                  />
                </Col>
              </Row>
            </div>

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

        {activeTab === 'methodMaster' && (
          <>
            <TextInput
              name="name"
              label="Method Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="code"
              label="Method Code"
              value={formData.code}
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
              name="principle"
              label="Principle"
              value={formData.principle}
              onChange={handleChange}
              as="textarea"
              rows={2}
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

        {activeTab === 'antibioticMaster' && (
          <>
            <TextInput
              name="name"
              label="Antibiotic Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="code"
              label="Antibiotic Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="class"
              label="Antibiotic Class"
              value={formData.class}
              onChange={handleChange}
            />
            <TextInput
              name="mechanism"
              label="Mechanism of Action"
              value={formData.mechanism}
              onChange={handleChange}
              as="textarea"
              rows={2}
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

        {activeTab === 'organismMaster' && (
          <>
            <TextInput
              name="name"
              label="Organism Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="code"
              label="Organism Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="">Select Type</option>
                <option value="Bacteria">Bacteria</option>
                <option value="Virus">Virus</option>
                <option value="Fungus">Fungus</option>
                <option value="Parasite">Parasite</option>
              </Form.Select>
            </Form.Group>
            <TextInput
              name="gram_stain"
              label="Gram Stain"
              value={formData.gram_stain}
              onChange={handleChange}
              placeholder="Positive/Negative/N/A"
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

        {activeTab === 'unitOfMeasurement' && (
          <>
            <TextInput
              name="name"
              label="Unit Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="symbol"
              label="Symbol"
              value={formData.symbol}
              onChange={handleChange}
              required
            />
            <TextInput
              name="type"
              label="Measurement Type"
              value={formData.type}
              onChange={handleChange}
              placeholder="e.g., Volume, Mass, Concentration"
            />
            <NumberInput
              name="conversion_factor"
              label="Conversion Factor"
              value={formData.conversion_factor}
              onChange={handleChange}
              min={0}
              step={0.001}
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

        {activeTab === 'specimenMaster' && (
          <>
            <TextInput
              name="name"
              label="Specimen Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="code"
              label="Specimen Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="collection_method"
              label="Collection Method"
              value={formData.collection_method}
              onChange={handleChange}
              as="textarea"
              rows={2}
            />
            <TextInput
              name="storage_requirements"
              label="Storage Requirements"
              value={formData.storage_requirements}
              onChange={handleChange}
              as="textarea"
              rows={2}
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

        {activeTab === 'organismVsAntibiotic' && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Organism</Form.Label>
              <Form.Select
                name="organism_id"
                value={formData.organism_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Organism</option>
                {(masterData.organismMaster || []).map(organism => (
                  <option key={organism.id} value={organism.id}>
                    {organism.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Antibiotic</Form.Label>
              <Form.Select
                name="antibiotic_id"
                value={formData.antibiotic_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Antibiotic</option>
                {(masterData.antibioticMaster || []).map(antibiotic => (
                  <option key={antibiotic.id} value={antibiotic.id}>
                    {antibiotic.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Sensitivity</Form.Label>
              <Form.Select
                name="sensitivity"
                value={formData.sensitivity}
                onChange={handleChange}
                required
              >
                <option value="">Select Sensitivity</option>
                <option value="Sensitive">Sensitive</option>
                <option value="Resistant">Resistant</option>
                <option value="Intermediate">Intermediate</option>
              </Form.Select>
            </Form.Group>
            <NumberInput
              name="mic_value"
              label="MIC Value"
              value={formData.mic_value}
              onChange={handleChange}
              min={0}
              step={0.001}
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

        {activeTab === 'containerMaster' && (
          <>
            <TextInput
              name="name"
              label="Container Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="type"
              label="Container Type"
              value={formData.type}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-6">
                <NumberInput
                  name="volume"
                  label="Volume"
                  value={formData.volume}
                  onChange={handleChange}
                  min={0}
                  step={0.1}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="unit"
                  label="Unit"
                  value={formData.unit}
                  onChange={handleChange}
                />
              </div>
            </div>
            <TextInput
              name="color"
              label="Color"
              value={formData.color}
              onChange={handleChange}
            />
            <TextInput
              name="additive"
              label="Additive"
              value={formData.additive}
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

        {activeTab === 'mainDepartmentMaster' && (
          <>
            <TextInput
              name="major_department"
              label="Major Department"
              value={formData.major_department}
              onChange={handleChange}
            />
            <TextInput
              name="code"
              label="Code"
              value={formData.code}
              onChange={handleChange}
              required
            />
            <TextInput
              name="department"
              label="Department"
              value={formData.department}
              onChange={handleChange}
              required
            />
            <div className="row">
              <div className="col-md-6">
                <NumberInput
                  name="order"
                  label="Order"
                  value={formData.order}
                  onChange={handleChange}
                  min={0}
                />
              </div>
              <div className="col-md-6">
                <TextInput
                  name="short_name"
                  label="Short Name"
                  value={formData.short_name}
                  onChange={handleChange}
                />
              </div>
            </div>
            <TextInput
              name="queue"
              label="Queue"
              value={formData.queue}
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

        {activeTab === 'departmentSettings' && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Department</Form.Label>
              <Form.Select
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Department</option>
                {(masterData.departments || []).map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <TextInput
              name="setting_key"
              label="Setting Key"
              value={formData.setting_key}
              onChange={handleChange}
              required
            />
            <TextInput
              name="setting_value"
              label="Setting Value"
              value={formData.setting_value}
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

        {activeTab === 'authorizationSettings' && (
          <>
            <TextInput
              name="role_name"
              label="Role Name"
              value={formData.role_name}
              onChange={handleChange}
              required
            />
            <TextInput
              name="permission"
              label="Permission"
              value={formData.permission}
              onChange={handleChange}
              required
            />
            <TextInput
              name="resource"
              label="Resource"
              value={formData.resource}
              onChange={handleChange}
              required
            />
            <Form.Group className="mb-3">
              <Form.Label>Access Level</Form.Label>
              <Form.Select
                name="access_level"
                value={formData.access_level}
                onChange={handleChange}
                required
              >
                <option value="">Select Access Level</option>
                <option value="Read">Read</option>
                <option value="Write">Write</option>
                <option value="Delete">Delete</option>
                <option value="Admin">Admin</option>
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

        {activeTab === 'printOrder' && (
          <>
            <TextInput
              name="name"
              label="Print Order Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <NumberInput
              name="order_sequence"
              label="Order Sequence"
              value={formData.order_sequence}
              onChange={handleChange}
              min={1}
              required
            />
            <Form.Group className="mb-3">
              <Form.Label>Print Section</Form.Label>
              <Form.Select
                name="print_section"
                value={formData.print_section}
                onChange={handleChange}
                required
              >
                <option value="">Select Section</option>
                <option value="Header">Header</option>
                <option value="Patient Info">Patient Info</option>
                <option value="Test Results">Test Results</option>
                <option value="Footer">Footer</option>
              </Form.Select>
            </Form.Group>
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={2}
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

        {activeTab === 'testMaster' && (
          <>
            {/* Basic Information Section */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Basic Information</h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Department*</Form.Label>
                    <SearchableDropdown
                      name="department"
                      label="Department"
                      value={testMasterFormData.department}
                      onChange={handleTestMasterChange}
                      options={getAllDepartments()}
                      placeholder="--- Select Department ---"
                      isRequired={true}
                      isClearable={false}
                      variant="mui"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <TextInput
                    name="testName"
                    label="Test Name*"
                    value={testMasterFormData.testName}
                    onChange={handleTestMasterChange}
                    required
                    placeholder="Enter test name"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <TextInput
                    name="hmsCode"
                    label="HMS Code*"
                    value={testMasterFormData.hmsCode}
                    onChange={handleTestMasterChange}
                    required
                    placeholder="Enter HMS code"
                  />
                </Col>
                <Col md={6}>
                  <TextInput
                    name="internationalCode"
                    label="International Code"
                    value={testMasterFormData.internationalCode}
                    onChange={handleTestMasterChange}
                    placeholder="Enter international code"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <TextInput
                    name="shortName"
                    label="Short Name"
                    value={testMasterFormData.shortName}
                    onChange={handleTestMasterChange}
                    placeholder="Enter short name"
                  />
                </Col>
                <Col md={6}>
                  <TextInput
                    name="displayName"
                    label="Display Name"
                    value={testMasterFormData.displayName}
                    onChange={handleTestMasterChange}
                    placeholder="Enter display name"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <TextInput
                    name="reportName"
                    label="Report Name"
                    value={testMasterFormData.reportName}
                    onChange={handleTestMasterChange}
                    placeholder="Enter report name"
                  />
                </Col>
                <Col md={6}>
                  <TextInput
                    name="emrClassification"
                    label="EMR Classification"
                    value={testMasterFormData.emrClassification}
                    onChange={handleTestMasterChange}
                    placeholder="e.g., Laboratory"
                  />
                </Col>
              </Row>
            </div>

            {/* Test Configuration Section */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Test Configuration</h6>
              <Row>
                <Col md={6}>
                  <TextInput
                    name="method"
                    label="Method"
                    value={testMasterFormData.method}
                    onChange={handleTestMasterChange}
                    placeholder="e.g., Automated, Manual"
                  />
                </Col>
                <Col md={6}>
                  <TextInput
                    name="container"
                    label="Container"
                    value={testMasterFormData.container}
                    onChange={handleTestMasterChange}
                    placeholder="e.g., Serum, Plasma"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <TextInput
                    name="primarySpecimen"
                    label="Primary Specimen"
                    value={testMasterFormData.primarySpecimen}
                    onChange={handleTestMasterChange}
                    placeholder="e.g., Serum, Blood"
                  />
                </Col>
                <Col md={6}>
                  <TextInput
                    name="serviceTime"
                    label="Service Time"
                    value={testMasterFormData.serviceTime}
                    onChange={handleTestMasterChange}
                    placeholder="e.g., 24 Hours, Same Day"
                  />
                </Col>
              </Row>
            </div>

            {/* Reference & Results Section */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Reference & Results</h6>
              <Row>
                <Col md={12}>
                  <TextInput
                    name="reference_range"
                    label="Reference Range"
                    value={testMasterFormData.reference_range}
                    onChange={handleTestMasterChange}
                    as="textarea"
                    rows={3}
                    placeholder="Enter reference range"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <TextInput
                    name="result_unit"
                    label="Result Unit"
                    value={testMasterFormData.result_unit}
                    onChange={handleTestMasterChange}
                    placeholder="e.g., mg/dL, pg/ml"
                  />
                </Col>
                <Col md={4}>
                  <NumberInput
                    name="decimals"
                    label="Decimals"
                    value={testMasterFormData.decimals}
                    onChange={handleTestMasterChange}
                    min={0}
                    max={5}
                    placeholder="Number of decimal places"
                  />
                </Col>
                <Col md={4}>
                  <NumberInput
                    name="test_price"
                    label="Test Price*"
                    value={testMasterFormData.test_price}
                    onChange={handleTestMasterChange}
                    required
                    min={0}
                    step={0.01}
                    placeholder="Enter test price"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <NumberInput
                    name="critical_low"
                    label="Critical Low"
                    value={testMasterFormData.critical_low}
                    onChange={handleTestMasterChange}
                    step={0.01}
                    placeholder="Critical low value"
                  />
                </Col>
                <Col md={6}>
                  <NumberInput
                    name="critical_high"
                    label="Critical High"
                    value={testMasterFormData.critical_high}
                    onChange={handleTestMasterChange}
                    step={0.01}
                    placeholder="Critical high value"
                  />
                </Col>
              </Row>
            </div>

            {/* Sub-Tests Section */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Sub-Tests</h6>
              <Form.Group className="mb-3">
                <Form.Label>Associated Sub-Tests</Form.Label>
                <Autocomplete
                  multiple
                  options={getSubTestOptions()}
                  value={getSubTestOptions().filter(option => selectedSubTests.includes(option.value))}
                  onChange={(event, newValue) => {
                    handleSubTestChange(newValue);
                  }}
                  getOptionLabel={(option) => option.label}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search and select sub-tests"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Badge
                        key={option.value}
                        bg="primary"
                        className="me-1 mb-1"
                        {...getTagProps({ index })}
                      >
                        {option.label}
                      </Badge>
                    ))
                  }
                />
                <Form.Text className="text-muted">
                  Select multiple sub-tests that are part of this main test
                </Form.Text>
              </Form.Group>
            </div>

            {/* Instructions & Notes Section */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Instructions & Notes</h6>
              <Row>
                <Col md={12}>
                  <TextInput
                    name="instructions"
                    label="Instructions"
                    value={testMasterFormData.instructions}
                    onChange={handleTestMasterChange}
                    as="textarea"
                    rows={3}
                    placeholder="Enter test instructions"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <TextInput
                    name="interpretation"
                    label="Interpretation"
                    value={testMasterFormData.interpretation}
                    onChange={handleTestMasterChange}
                    as="textarea"
                    rows={3}
                    placeholder="Enter interpretation notes"
                  />
                </Col>
                <Col md={6}>
                  <TextInput
                    name="specialReport"
                    label="Special Report"
                    value={testMasterFormData.specialReport}
                    onChange={handleTestMasterChange}
                    as="textarea"
                    rows={3}
                    placeholder="Enter special report notes"
                  />
                </Col>
              </Row>
            </div>

            <Form.Check
              type="switch"
              id="is_active_edit_testmaster"
              name="is_active"
              label="Active Test"
              checked={testMasterFormData.is_active}
              onChange={handleTestMasterChange}
            />
          </>
        )}

        {activeTab === 'subTestMaster' && (
          <>
            <TextInput
              name="sub_test_name"
              label="Sub Test Name"
              value={formData.sub_test_name}
              onChange={handleChange}
              required
              placeholder="Enter sub test name"
            />
            <Form.Group className="mb-3">
              <Form.Label>Department*</Form.Label>
              <SearchableDropdown
                name="department"
                label="Department"
                value={formData.department}
                onChange={handleChange}
                options={getAllDepartments()}
                placeholder="--- Select Department ---"
                isRequired={true}
                isClearable={false}
                variant="mui"
              />
            </Form.Group>
            <TextInput
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              as="textarea"
              rows={3}
              placeholder="Enter description (optional)"
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

        {activeTab === 'departmentMaster' && (
          <>
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Basic Information</h6>
              <Row>
                <Col md={6}>
                  <TextInput
                    name="main_department"
                    label="Main Department*"
                    value={formData.main_department}
                    onChange={handleChange}
                    required
                    placeholder="Enter main department"
                  />
                </Col>
                <Col md={6}>
                  <TextInput
                    name="code"
                    label="Code*"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    placeholder="Enter department code"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <TextInput
                    name="name"
                    label="Name*"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter department name"
                  />
                </Col>
                <Col md={6}>
                  <TextInput
                    name="short_name"
                    label="Short Name*"
                    value={formData.short_name}
                    onChange={handleChange}
                    required
                    placeholder="Enter short name"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <TextInput
                    name="room_no"
                    label="Room No"
                    value={formData.room_no}
                    onChange={handleChange}
                    placeholder="Enter room number"
                  />
                </Col>
                <Col md={4}>
                  <NumberInput
                    name="order"
                    label="Order*"
                    value={formData.order}
                    onChange={handleChange}
                    required
                    min={0}
                    placeholder="Display order"
                  />
                </Col>
                <Col md={4}>
                  <NumberInput
                    name="min_test_amt"
                    label="Min Test Amount"
                    value={formData.min_test_amt}
                    onChange={handleChange}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <NumberInput
                    name="service_time"
                    label="Service Time (minutes)"
                    value={formData.service_time}
                    onChange={handleChange}
                    min={0}
                    placeholder="Service time in minutes"
                  />
                </Col>
              </Row>
            </div>

            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Department Settings</h6>
              <Row>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="sample_collect_edit"
                    name="sample_collect"
                    label="Sample Collect"
                    checked={formData.sample_collect}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="process_receive_edit"
                    name="process_receive"
                    label="Process Receive"
                    checked={formData.process_receive}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="sample_receive_edit"
                    name="sample_receive"
                    label="Sample Receive"
                    checked={formData.sample_receive}
                    onChange={handleChange}
                  />
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="sample_no_edit"
                    name="sample_no"
                    label="Sample No"
                    checked={formData.sample_no}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="hide_pending_edit"
                    name="hide_pending"
                    label="Hide Pending"
                    checked={formData.hide_pending}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="hide_dept_edit"
                    name="hide_dept"
                    label="Hide Dept"
                    checked={formData.hide_dept}
                    onChange={handleChange}
                  />
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="hide_barcode_edit"
                    name="hide_barcode"
                    label="Hide BarCode"
                    checked={formData.hide_barcode}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="appointment_edit"
                    name="appointment"
                    label="Appointment"
                    checked={formData.appointment}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="specimen_edit"
                    name="specimen"
                    label="Specimen"
                    checked={formData.specimen}
                    onChange={handleChange}
                  />
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="staging_edit"
                    name="staging"
                    label="Staging"
                    checked={formData.staging}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="hide_sign_edit"
                    name="hide_sign"
                    label="Hide Sign"
                    checked={formData.hide_sign}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="is_active_edit"
                    name="is_active"
                    label="Active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                </Col>
              </Row>
            </div>

            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">Authorization Settings</h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Authorization</Form.Label>
                    <Form.Select
                      name="authorization"
                      value={formData.authorization}
                      onChange={handleChange}
                    >
                      <option value="">--- No Auth ---</option>
                      <option value="required">Required</option>
                      <option value="optional">Optional</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Authorization Type</Form.Label>
                    <Form.Select
                      name="authorization_type"
                      value={formData.authorization_type}
                      onChange={handleChange}
                    >
                      <option value="">--- Select ---</option>
                      <option value="doctor">Doctor</option>
                      <option value="technician">Technician</option>
                      <option value="supervisor">Supervisor</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email At</Form.Label>
                    <Form.Select
                      name="email_at"
                      value={formData.email_at}
                      onChange={handleChange}
                    >
                      <option value="">--- Empty ---</option>
                      <option value="completion">At Completion</option>
                      <option value="approval">At Approval</option>
                      <option value="both">Both</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Report Type</Form.Label>
                    <Form.Select
                      name="report_type"
                      value={formData.report_type}
                      onChange={handleChange}
                    >
                      <option value="">--- Report Type ---</option>
                      <option value="standard">Standard</option>
                      <option value="detailed">Detailed</option>
                      <option value="summary">Summary</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </>
        )}

        {activeTab === 'profileData' && (
          <>
            <TextInput
              name="code"
              label="Code"
              value={formData.code}
              onChange={handleChange}
              required
              placeholder="Enter code"
            />
            <TextInput
              name="procedure_code"
              label="Procedure Code"
              value={formData.procedure_code}
              onChange={handleChange}
              placeholder="Enter procedure code (optional)"
            />
            <TextInput
              name="test_profile"
              label="Test/Profile"
              value={formData.test_profile}
              onChange={handleChange}
              required
              placeholder="Enter test or profile name"
            />
            <NumberInput
              name="test_price"
              label="Test Price"
              value={formData.test_price}
              onChange={handleChange}
              min={0}
              step={0.01}
              placeholder="0.00"
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

      {/* Excel Import/Export Modal */}
      <ExcelImportExport
        show={showExcelModal}
        onHide={() => setShowExcelModal(false)}
        activeTab={activeTab}
        onImportSuccess={handleImportSuccess}
      />

      {/* Bulk Data Import Modal */}
      <BulkDataImport
        show={showBulkImportModal}
        onHide={() => setShowBulkImportModal(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default MasterData;
