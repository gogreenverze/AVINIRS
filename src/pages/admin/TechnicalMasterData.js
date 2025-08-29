import React, { useState, useEffect } from 'react';
import { Card, Button, Form, InputGroup, Table, Badge, Tabs, Tab, Alert, Row, Col, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDatabase, faPlus, faEdit, faTrash, faSearch,
  faFlask, faVial, faFileInvoiceDollar, faUserMd,
  faBoxes, faMicroscope, faEyeDropper, faTruck,
  faRulerHorizontal, faCalculator, faCogs, faFileExcel, faFileImport,
  faUsers, faClipboardList, faBug, faShieldAlt, faCog,
  faPrint, faBuilding, faKey, faLayerGroup, faChartLine, faDownload, faUpload,
  faRefresh, faCheckCircle, faExclamationTriangle, faSync, faDollarSign
} from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import { adminAPI } from '../../services/api';
import laboratoryTestsData from '../../data/laboratoryTestsData.json';
import {
  TextInput,
  NumberInput,
  DeleteConfirmationModal,
  SuccessModal,
  ErrorModal,
  FormModal
} from '../../components/common';
import UnifiedTestResultMaster from '../../components/admin/UnifiedTestResultMaster';
import PriceSchemeMaster from '../../components/admin/PriceSchemeMaster';
import ReferralMasterManagement from '../../components/admin/ReferralMasterManagement';
import '../../styles/MasterData.css';

// Import SearchableDropdown from MasterData.js
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import Select from 'react-select';
import ProfileMaster from '../ProfileMaster';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';

// Enhanced Searchable Dropdown Component
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
  getOptionLabel = (option) => option.label || option.name || option.description || option.test_profile || option,
  getOptionValue = (option) => option.value || option.id || option,
  variant = "mui" // "mui" or "react-select"
}) => {
  if (variant === "mui") {
    // MUI Autocomplete implementation
    const formattedOptions = options.map(option => ({
      label: getOptionLabel(option),
      value: getOptionValue(option),
      ...option
    }));

    const selectedOption = formattedOptions.find(option => option.value === value) || null;

    return (
      <Autocomplete
        options={formattedOptions}
        value={selectedOption}
        onChange={(event, newValue) => {
          const syntheticEvent = {
            target: {
              name: name,
              value: newValue ? newValue.value : ''
            }
          };
          onChange(syntheticEvent);
        }}
        getOptionLabel={(option) => option.label || ''}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        disabled={isDisabled}
        loading={isLoading}
        clearOnEscape
        disableClearable={!isClearable}
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
    // React-Select implementation
    const formattedOptions = options.map(option => ({
      label: getOptionLabel(option),
      value: getOptionValue(option),
      ...option
    }));

    const selectedOption = formattedOptions.find(option => option.value === value) || null;

    const customStyles = {
      control: (provided, state) => ({
        ...provided,
        borderColor: state.isFocused ? '#80bdff' : '#ced4da',
        boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : 'none',
        '&:hover': {
          borderColor: '#80bdff',
        },
      }),
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

const TechnicalMasterData = () => {
  const { currentUser } = useAuth();
  const { hasModuleAccess } = usePermissions();

  // State for technical master data
  const [technicalMasterData, setTechnicalMasterData] = useState({
    resultMaster: [],
    referrerMaster: []
  });

  // State for master data (for test profiles)
  const [masterData, setMasterData] = useState({
    departments: []
  });

  // State for test code lookup timeout
  const [testCodeLookupTimeout, setTestCodeLookupTimeout] = useState(null);

  // State for test name selection debouncing and duplicate prevention
  const [testNameSelectionTimeout, setTestNameSelectionTimeout] = useState(null);
  const [lastProcessedTestName, setLastProcessedTestName] = useState('');

  // State for Excel reference data
  const [excelReferenceData, setExcelReferenceData] = useState({});

  // State for dynamic Excel file reading
  const [excelFileData, setExcelFileData] = useState(null);
  const [excelFileStatus, setExcelFileStatus] = useState({
    isLoading: false,
    isLoaded: false,
    error: null,
    lastUpdated: null,
    fileName: null,
    sheetsCount: 0,
    recordsCount: 0
  });
  const [excelFilePath, setExcelFilePath] = useState('dynamic data fetch.xlsx');

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
  const [tabSearchQuery, setTabSearchQuery] = useState('');

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



  // Fetch technical master data and master data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both technical master data and master data
        const [technicalResponse, masterResponse] = await Promise.all([
          adminAPI.getTechnicalMasterData(),
          adminAPI.getMasterData()
        ]);

        setTechnicalMasterData(technicalResponse.data);
        setMasterData(masterResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  // Helper function to format test code as 6-digit zero-padded number
  const formatTestCode = (code) => {
    if (!code) return '';

    // Remove any non-numeric characters and convert to string
    const numericCode = code.toString().replace(/\D/g, '');

    // If empty after cleaning, return empty string
    if (!numericCode) return '';

    // Pad with zeros to 6 digits
    return numericCode.padStart(6, '0');
  };

  // Enhanced helper function to extract value from row with multiple possible column names
  const getValueFromRow = (row, possibleKeys) => {
    for (const key of possibleKeys) {
      if (row[key] !== undefined && row[key] !== null) {
        const value = String(row[key]).trim();
        if (value !== '' && value !== 'undefined' && value !== 'null') {
          return value;
        }
      }
    }
    return '';
  };

  // Enhanced test name normalization function
  const normalizeTestName = (testName) => {
    if (!testName) return '';

    return testName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/[^\w\s-]/g, ' ')  // Replace special characters (except hyphens) with spaces
      .replace(/\s+/g, ' ')  // Clean up multiple spaces again
      .trim();
  };

  // REMOVED STATIC EMBEDDED DATA - NOW USING PURE DYNAMIC EXCEL INTEGRATION
  // All laboratory test data is now sourced from dynamic Excel files or Departments API

  // DYNAMIC EXCEL FILE READER SYSTEM WITH COMPREHENSIVE ERROR HANDLING
  const readExcelFile = async (filePath = excelFilePath) => {
    console.log('📂 DYNAMIC EXCEL FILE READER STARTING...');
    console.log('File path:', filePath);

    setExcelFileStatus(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      // Validate input parameters
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path provided');
      }

      // For browser-based file reading, we'll use a file input approach
      // Since we can't directly read files from the file system in browser
      console.log('⚠️ Browser-based Excel reading requires file input');

      // For now, we'll simulate the Excel data structure with validation
      // In a real implementation, this would read from an uploaded file
      const simulatedExcelData = await simulateExcelFileReading();

      // Validate the Excel data structure
      const validationResult = validateExcelData(simulatedExcelData);
      if (!validationResult.isValid) {
        throw new Error(`Excel data validation failed: ${validationResult.errors.join(', ')}`);
      }

      setExcelFileData(simulatedExcelData);
      setExcelFileStatus({
        isLoading: false,
        isLoaded: true,
        error: null,
        lastUpdated: new Date().toISOString(),
        fileName: filePath,
        sheetsCount: Object.keys(simulatedExcelData).length,
        recordsCount: Object.values(simulatedExcelData).reduce((total, sheet) => total + sheet.length, 0)
      });

      console.log('✅ Excel file data loaded and validated successfully:', simulatedExcelData);
      return simulatedExcelData;

    } catch (error) {
      console.error('❌ Error reading Excel file:', error);

      // Enhanced error handling with specific error types
      let errorMessage = 'Unknown error occurred';
      if (error.name === 'ValidationError') {
        errorMessage = `Data validation failed: ${error.message}`;
      } else if (error.name === 'FileNotFoundError') {
        errorMessage = `Excel file not found: ${filePath}`;
      } else if (error.name === 'PermissionError') {
        errorMessage = `Permission denied accessing file: ${filePath}`;
      } else {
        errorMessage = error.message || 'Failed to read Excel file';
      }

      setExcelFileStatus(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      // Don't throw error to maintain form functionality
      console.log('🔄 Falling back to embedded data due to Excel reading error');
      return null;
    }
  };

  // Validate Excel data structure
  const validateExcelData = (data) => {
    const errors = [];

    try {
      // Check if data is an object
      if (!data || typeof data !== 'object') {
        errors.push('Excel data must be an object');
        return { isValid: false, errors };
      }

      // Check if data has sheets
      const sheets = Object.keys(data);
      if (sheets.length === 0) {
        errors.push('Excel file must contain at least one sheet');
        return { isValid: false, errors };
      }

      // Validate each sheet
      sheets.forEach(sheetName => {
        const sheetData = data[sheetName];

        if (!Array.isArray(sheetData)) {
          errors.push(`Sheet "${sheetName}" must contain an array of records`);
          return;
        }

        if (sheetData.length === 0) {
          console.warn(`⚠️ Sheet "${sheetName}" is empty`);
          return;
        }

        // Validate required fields in each record
        sheetData.forEach((record, index) => {
          if (!record.testName) {
            errors.push(`Sheet "${sheetName}", record ${index + 1}: Missing testName`);
          }

          // Check for basic field types
          if (record.testCode && typeof record.testCode !== 'string' && typeof record.testCode !== 'number') {
            errors.push(`Sheet "${sheetName}", record ${index + 1}: testCode must be string or number`);
          }
        });
      });

      return {
        isValid: errors.length === 0,
        errors,
        sheetsCount: sheets.length,
        totalRecords: sheets.reduce((total, sheetName) => total + data[sheetName].length, 0)
      };

    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
      return { isValid: false, errors };
    }
  };

  // Dynamic laboratory test data loading from JSON file
  const simulateExcelFileReading = async () => {
    console.log('📂 Loading laboratory test data from JSON file...');

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Load data from imported JSON file
    console.log('✅ Laboratory test data loaded from JSON:', laboratoryTestsData);

    // Ensure the data structure matches what getCompleteTestData expects
    if (laboratoryTestsData && laboratoryTestsData['Laboratory Tests']) {
      console.log('📋 Processing laboratory tests data...');

      // Process each test to ensure proper field mapping
      const processedTests = laboratoryTestsData['Laboratory Tests'].map(test => ({
        testName: test.testName,
        testCode: formatTestCode(test.testCode),
        department: test.department,
        notes: test.notes,
        referenceRange: test.referenceRange,
        resultUnit: test.resultUnit,
        decimals: test.decimals,
        criticalLow: test.criticalLow,
        criticalHigh: test.criticalHigh
      }));

      console.log('✅ Processed tests:', processedTests.length);
      console.log('📊 Sample processed test:', processedTests[0]);

      // Return in the expected format
      return {
        'Laboratory Tests': processedTests
      };
    } else {
      console.error('❌ Invalid JSON data structure - missing "Laboratory Tests" array');
      return { 'Laboratory Tests': [] };
    }
  };

  // Manual refresh function for Excel data
  const refreshExcelData = async () => {
    console.log('🔄 Manual refresh of Excel data triggered...');
    try {
      await readExcelFile();
      console.log('✅ Excel data refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh Excel data:', error);
    }
  };

  // File upload handler for dynamic Excel file reading
  const handleExcelFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('📁 Excel file uploaded:', file.name);

    setExcelFileStatus(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      const excelData = {};
      let totalRecords = 0;

      // Enhanced sheet processing with better error handling and data validation
      workbook.SheetNames.forEach(sheetName => {
        console.log(`📋 Processing sheet: "${sheetName}"`);

        try {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) {
            console.warn(`⚠️ Sheet "${sheetName}" is empty or invalid`);
            return;
          }

          // Convert to JSON with better options for handling empty cells
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',           // Default value for empty cells
            blankrows: false,     // Skip blank rows
            raw: false           // Convert numbers to strings for consistency
          });

          if (jsonData.length > 1) { // Skip empty sheets
            const headers = jsonData[0];
            const rows = jsonData.slice(1);

            console.log(`📊 Sheet "${sheetName}" headers:`, headers);
            console.log(`📊 Sheet "${sheetName}" has ${rows.length} data rows`);

            const sheetData = rows.map((row, rowIndex) => {
              const record = {};
              let hasData = false;

              headers.forEach((header, index) => {
                if (header && header.toString().trim()) {
                  // Map field names with enhanced handling
                  const fieldName = mapExcelFieldName(header);
                  let cellValue = row[index];

                  // Enhanced cell value processing
                  if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
                    // Convert to string and trim
                    cellValue = cellValue.toString().trim();

                    // Handle specific field types
                    if (fieldName === 'testCode') {
                      // Ensure test code is properly formatted
                      cellValue = cellValue.replace(/[^0-9]/g, ''); // Remove non-numeric chars
                      if (cellValue) {
                        cellValue = formatTestCode(cellValue);
                      }
                    } else if (fieldName === 'decimals') {
                      // Ensure decimals is a valid number
                      const numValue = parseInt(cellValue);
                      cellValue = isNaN(numValue) ? '0' : numValue.toString();
                    }

                    record[fieldName] = cellValue;
                    hasData = true;
                  } else {
                    // Set empty string for missing values to maintain structure
                    record[fieldName] = '';
                  }
                }
              });

              // Only include records that have at least a test name
              if (hasData && record.testName && record.testName.trim()) {
                console.log(`📝 Row ${rowIndex + 1} processed:`, {
                  testName: record.testName,
                  testCode: record.testCode,
                  department: record.department,
                  hasReferenceRange: !!record.referenceRange,
                  hasNotes: !!record.notes
                });
                return record;
              }
              return null;
            }).filter(record => record !== null);

            if (sheetData.length > 0) {
              excelData[sheetName] = sheetData;
              totalRecords += sheetData.length;
              console.log(`✅ Sheet "${sheetName}" processed: ${sheetData.length} valid records`);
            } else {
              console.warn(`⚠️ Sheet "${sheetName}" has no valid data records`);
            }
          } else {
            console.warn(`⚠️ Sheet "${sheetName}" has no data rows`);
          }
        } catch (sheetError) {
          console.error(`❌ Error processing sheet "${sheetName}":`, sheetError);
        }
      });

      setExcelFileData(excelData);
      setExcelFileStatus({
        isLoading: false,
        isLoaded: true,
        error: null,
        lastUpdated: new Date().toISOString(),
        fileName: file.name,
        sheetsCount: Object.keys(excelData).length,
        recordsCount: totalRecords
      });

      console.log('✅ Excel file processed successfully:', excelData);

    } catch (error) {
      console.error('❌ Error processing Excel file:', error);
      setExcelFileStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  };

  // Enhanced Excel field mapping for specified column structure
  // Excel Format: A=Test Name, B=Test Code, C=Department, D=Notes, E=Reference Range,
  //               F=Result Unit, G=No of Decimals, H=Critical Low, I=Critical High
  const mapExcelFieldName = (excelHeader) => {
    // Trim and normalize header for better matching
    const normalizedHeader = excelHeader ? excelHeader.toString().trim() : '';

    const fieldMapping = {
      // Test Name variations (Column A)
      'Test Name': 'testName',
      'TestName': 'testName',
      'test_name': 'testName',
      'Test_Name': 'testName',

      // Test Code variations (Column B)
      'Test Code': 'testCode',
      'TestCode': 'testCode',
      'test_code': 'testCode',
      'Test_Code': 'testCode',
      'Code': 'testCode',

      // Department variations (Column C)
      'Department': 'department',
      'DEPARTMENT': 'department',
      'Dept': 'department',

      // Notes variations (Column D)
      'Notes': 'notes',
      'NOTES': 'notes',
      'Note': 'notes',
      'Comments': 'notes',
      'Description': 'notes',

      // Reference Range variations (Column E)
      'Reference Range': 'referenceRange',
      'ReferenceRange': 'referenceRange',
      'reference_range': 'referenceRange',
      'Reference_Range': 'referenceRange',
      'Normal Range': 'referenceRange',
      'Range': 'referenceRange',

      // Result Unit variations (Column F)
      'Result Unit': 'resultUnit',
      'ResultUnit': 'resultUnit',
      'result_unit': 'resultUnit',
      'Result_Unit': 'resultUnit',
      'Unit': 'resultUnit',
      'Units': 'resultUnit',

      // No of Decimals variations (Column G) - FIXED MISSING MAPPING
      'No of Decimals': 'decimals',
      'No_of_Decimals': 'decimals',
      'NoofDecimals': 'decimals',
      'Number of Decimals': 'decimals',
      'Decimals': 'decimals',
      'Decimal Places': 'decimals',
      'DecimalPlaces': 'decimals',
      'Precision': 'decimals',

      // Critical Low variations (Column H)
      'Critical Low': 'criticalLow',
      'CriticalLow': 'criticalLow',
      'critical_low': 'criticalLow',
      'Critical_Low': 'criticalLow',
      'Low Critical': 'criticalLow',
      'Min Critical': 'criticalLow',

      // Critical High variations (Column I)
      'Critical High': 'criticalHigh',
      'CriticalHigh': 'criticalHigh',
      'critical_high': 'criticalHigh',
      'Critical_High': 'criticalHigh',
      'High Critical': 'criticalHigh',
      'Max Critical': 'criticalHigh'
    };

    // Try exact match first
    if (fieldMapping[normalizedHeader]) {
      console.log(`📋 Excel field mapping: "${normalizedHeader}" → "${fieldMapping[normalizedHeader]}"`);
      return fieldMapping[normalizedHeader];
    }

    // Try case-insensitive match
    const lowerHeader = normalizedHeader.toLowerCase();
    for (const [key, value] of Object.entries(fieldMapping)) {
      if (key.toLowerCase() === lowerHeader) {
        console.log(`📋 Excel field mapping (case-insensitive): "${normalizedHeader}" → "${value}"`);
        return value;
      }
    }

    // Fallback to normalized header
    const fallback = normalizedHeader.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    console.log(`⚠️ Excel field mapping fallback: "${normalizedHeader}" → "${fallback}"`);
    return fallback;
  };

  // INITIALIZE PURE DYNAMIC EXCEL INTEGRATION ON COMPONENT MOUNT
  useEffect(() => {
    console.log('🚀 INITIALIZING PURE DYNAMIC EXCEL INTEGRATION...');

    const initializeDynamicExcelSystem = async () => {
      try {
        console.log('📂 Starting dynamic Excel file reading system...');

        // Initialize empty reference data (no static embedded data)
        setExcelReferenceData({});

        // Initialize dynamic Excel file reading as primary data source
        await readExcelFile();

        console.log('✅ PURE DYNAMIC EXCEL SYSTEM INITIALIZED SUCCESSFULLY!');
        console.log('📊 Data sources: Dynamic Excel File → Departments API → Empty fallback');

      } catch (error) {
        console.error('❌ Error initializing dynamic Excel system:', error);
        // Set empty data as fallback (no static data dependency)
        setExcelReferenceData({});
      }
    };

    // Initialize dynamic system immediately
    initializeDynamicExcelSystem();
  }, []);

  // Cleanup timeouts on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (testCodeLookupTimeout) {
        clearTimeout(testCodeLookupTimeout);
      }
      if (testNameSelectionTimeout) {
        clearTimeout(testNameSelectionTimeout);
      }
    };
  }, [testCodeLookupTimeout, testNameSelectionTimeout]);

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

  // Handle tab search
  const handleTabSearch = (e) => {
    setTabSearchQuery(e.target.value);
  };

  // Helper function to get test profile options from departments
  const getTestProfileOptions = () => {
    return (masterData.departments || [])
      .filter(dept => dept.test_profile && dept.is_active !== false)
      .map(dept => ({
        label: dept.test_profile,
        value: dept.test_profile,
        code: dept.code,
        department: dept.department,
        test_price: dept.test_price,
        id: dept.id,
        ...dept
      }));
  };

  // Helper function to lookup test name by code with error handling
  const lookupTestNameByCode = (code) => {
    try {
      if (!code || !masterData.departments || !Array.isArray(masterData.departments)) {
        return null;
      }

      const department = masterData.departments.find(dept =>
        dept && dept.code && dept.code.toString().toLowerCase() === code.toString().toLowerCase()
      );

      return department && department.test_profile ? department.test_profile : null;
    } catch (error) {
      console.error('Error in lookupTestNameByCode:', error);
      return null;
    }
  };

  // Enhanced lookup function that integrates dynamic Excel data with unified departments API
  const getCompleteTestData = (testName) => {
    try {
      if (!testName || typeof testName !== 'string') return null;

      console.log('🔍 Getting complete test data for:', testName);

      // Priority 1: Check dynamic Excel file data with enhanced matching
      let excelTestData = null;
      if (excelFileData && excelFileStatus.isLoaded) {
        console.log('📂 Checking dynamic Excel file data...');
        console.log('🔍 Searching for test name:', testName);
        console.log('📊 Available Excel file data structure:', Object.keys(excelFileData));
        console.log('📋 Excel file status:', excelFileStatus);

        // Enhanced test name normalization for better matching
        const normalizeForMatching = (name) => {
          if (!name || typeof name !== 'string') return '';
          return name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')           // Normalize multiple spaces to single space
            .replace(/[^\w\s.-]/g, '')      // Remove special chars except dots, hyphens, spaces
            .replace(/\s*-\s*/g, '-')       // Normalize hyphens (remove spaces around them)
            .replace(/\s*\.\s*/g, '.')      // Normalize dots (remove spaces around them)
            .replace(/\s*,\s*/g, ',');      // Normalize commas (remove spaces around them)
        };

        const normalizedSearchName = normalizeForMatching(testName);
        console.log('🔍 Normalized search name:', normalizedSearchName);

        // Search across all sheets in the Excel file with multiple matching strategies
        for (const [sheetName, sheetData] of Object.entries(excelFileData)) {
          console.log(`📋 Searching in sheet "${sheetName}" with ${sheetData.length} records`);

          // Debug: Show available test names in this sheet
          const availableTestNames = sheetData.map(test => test.testName).filter(name => name);
          console.log(`📝 Available test names in "${sheetName}":`, availableTestNames);

          // Strategy 1: Exact normalized match
          let foundTest = sheetData.find(test => {
            if (!test.testName) return false;
            const normalizedTestName = normalizeForMatching(test.testName);
            return normalizedTestName === normalizedSearchName;
          });

          // Strategy 2: Trimmed exact match (case insensitive)
          if (!foundTest) {
            foundTest = sheetData.find(test => {
              if (!test.testName) return false;
              return test.testName.toLowerCase().trim() === testName.toLowerCase().trim();
            });
          }

          // Strategy 3: Contains match (for partial matches)
          if (!foundTest) {
            foundTest = sheetData.find(test => {
              if (!test.testName) return false;
              const testLower = test.testName.toLowerCase();
              const searchLower = testName.toLowerCase();
              return testLower.includes(searchLower) || searchLower.includes(testLower);
            });
          }

          // Strategy 4: Fuzzy match (remove all non-alphanumeric)
          if (!foundTest) {
            const fuzzySearchName = testName.toLowerCase().replace(/[^a-z0-9]/g, '');
            foundTest = sheetData.find(test => {
              if (!test.testName) return false;
              const fuzzyTestName = test.testName.toLowerCase().replace(/[^a-z0-9]/g, '');
              return fuzzyTestName === fuzzySearchName;
            });
          }

          if (foundTest) {
            excelTestData = { ...foundTest, sheetName };
            console.log(`📊 Found in Excel sheet "${sheetName}":`, excelTestData);
            console.log(`🎯 Match strategy: ${foundTest === sheetData.find(test => normalizeForMatching(test.testName) === normalizedSearchName) ? 'Exact normalized' :
                                                foundTest === sheetData.find(test => test.testName.toLowerCase().trim() === testName.toLowerCase().trim()) ? 'Trimmed exact' :
                                                'Fuzzy/Contains'}`);
            break;
          }
        }

        if (!excelTestData) {
          console.log('❌ No match found in Excel data');
          // Debug: Show available test names for comparison
          const allTestNames = [];
          Object.entries(excelFileData).forEach(([sheetName, sheetData]) => {
            sheetData.forEach(test => {
              if (test.testName) {
                allTestNames.push(`${sheetName}: ${test.testName}`);
              }
            });
          });
          console.log('📋 Available test names in Excel:', allTestNames.slice(0, 10)); // Show first 10
        }
      }

      // Priority 2: Get data from departments API (unified source)
      let department = null;
      if (masterData.departments && Array.isArray(masterData.departments)) {
        department = masterData.departments.find(dept =>
          dept && dept.test_profile &&
          dept.test_profile.toLowerCase() === testName.toLowerCase()
        );
      }

      console.log('📊 Department data found:', !!department);
      console.log('📂 Excel data found:', !!excelTestData);

      // Enhanced data source priority logic with detailed logging
      if (excelTestData || department) {
        // Determine primary data source
        let primarySource = 'None';
        let secondarySource = 'None';

        if (excelTestData && department) {
          primarySource = 'Excel File';
          secondarySource = 'Departments API';
        } else if (excelTestData) {
          primarySource = 'Excel File';
        } else if (department) {
          primarySource = 'Departments API';
        }

        console.log(`🎯 Data source priority: Primary="${primarySource}", Secondary="${secondarySource}"`);

        const completeData = {
          testName: excelTestData?.testName || department?.test_profile || testName,
          testCode: formatTestCode(excelTestData?.testCode || department?.code || ''),
          department: excelTestData?.department || department?.department || '',
          referenceRange: excelTestData?.referenceRange || department?.referenceRange || '',
          resultUnit: excelTestData?.resultUnit || department?.resultUnit || '',
          decimals: excelTestData?.decimals || department?.decimals || '',
          notes: excelTestData?.notes || department?.notes || '',
          criticalLow: excelTestData?.criticalLow || department?.criticalLow || '',
          criticalHigh: excelTestData?.criticalHigh || department?.criticalHigh || '',
          sheetName: excelTestData?.sheetName || department?.sheetName || '',
          testPrice: department?.test_price || '',
          dataSource: primarySource,
          secondarySource: secondarySource,
          // Field source tracking for debugging
          fieldSources: {
            testName: excelTestData?.testName ? 'Excel' : (department?.test_profile ? 'API' : 'Input'),
            testCode: excelTestData?.testCode ? 'Excel' : (department?.code ? 'API' : 'None'),
            department: excelTestData?.department ? 'Excel' : (department?.department ? 'API' : 'None'),
            referenceRange: excelTestData?.referenceRange ? 'Excel' : (department?.referenceRange ? 'API' : 'None'),
            resultUnit: excelTestData?.resultUnit ? 'Excel' : (department?.resultUnit ? 'API' : 'None'),
            decimals: excelTestData?.decimals ? 'Excel' : (department?.decimals ? 'API' : 'None'),
            notes: excelTestData?.notes ? 'Excel' : (department?.notes ? 'API' : 'None'),
            criticalLow: excelTestData?.criticalLow ? 'Excel' : (department?.criticalLow ? 'API' : 'None'),
            criticalHigh: excelTestData?.criticalHigh ? 'Excel' : (department?.criticalHigh ? 'API' : 'None')
          }
        };

        console.log('✅ Complete data from integrated sources:', completeData);
        console.log('📋 Field sources:', completeData.fieldSources);

        // Validate data completeness
        const completenessScore = Object.values(completeData.fieldSources).filter(source => source !== 'None').length;
        console.log(`📊 Data completeness: ${completenessScore}/9 fields populated`);

        return completeData;
      }

      console.log('❌ No data found in Excel or Departments API');
      console.log('🔄 Pure dynamic system - no static fallback data available');

      // Return minimal data structure with only the test name
      // No static embedded data fallback in pure dynamic system
      return {
        testName: testName,
        testCode: '',
        department: '',
        referenceRange: '',
        resultUnit: '',
        decimals: '',
        notes: '',
        criticalLow: '',
        criticalHigh: '',
        testPrice: '',
        dataSource: 'None - Not found in dynamic sources'
      };
    } catch (error) {
      console.error('Error in getCompleteTestData:', error);
      // Return minimal data structure to prevent form crashes
      return {
        testName: testName || '',
        testCode: '',
        department: '',
        referenceRange: '',
        resultUnit: '',
        decimals: '',
        notes: '',
        criticalLow: '',
        criticalHigh: '',
        testPrice: ''
      };
    }
  };

  // Enhanced debounced function for test code lookup with comprehensive field population
  const handleTestCodeLookup = (code) => {
    // Clear existing timeout
    if (testCodeLookupTimeout) {
      clearTimeout(testCodeLookupTimeout);
    }

    // Set new timeout for debounced lookup
    const timeout = setTimeout(() => {
      console.log('🔍 Test code lookup initiated for:', code);

      const testName = lookupTestNameByCode(code);
      if (testName) {
        console.log('✅ Test name found for code:', code, '->', testName);

        // Get complete data for the found test name using the same comprehensive approach
        const completeData = getCompleteTestData(testName);
        if (completeData) {
          console.log('📝 Complete data found via test code lookup:', completeData);

          setFormData(prev => {
            const safePrev = prev && typeof prev === 'object' ? prev : {};

            const newFormData = {
              ...safePrev,
              test_name: testName,
              department: completeData.department || safePrev.department || '',
              // Comprehensive field mapping - same as test name selection
              reference_range: completeData.referenceRange || safePrev.reference_range || '',
              unit: completeData.resultUnit || safePrev.unit || '',
              decimal_places: completeData.decimals || safePrev.decimal_places || '',
              notes: completeData.notes || safePrev.notes || '',
              critical_low: completeData.criticalLow || safePrev.critical_low || '',
              critical_high: completeData.criticalHigh || safePrev.critical_high || '',
              // Additional fields
              normal_range: completeData.referenceRange || safePrev.normal_range || '',
              description: completeData.notes || safePrev.description || ''
            };

            // Validate and log field population
            const populationStatus = validateFieldPopulation(newFormData, completeData);

            console.log('✅ Test code lookup - Form data updated:', {
              triggeredBy: 'test_code: ' + code,
              test_name: newFormData.test_name,
              fieldsPopulated: Object.keys(populationStatus).filter(key =>
                populationStatus[key].populated && populationStatus[key].source !== 'Manual'
              ).length
            });

            return newFormData;
          });
        } else {
          // If no complete data found, just set the test name
          console.log('⚠️ Only test name found, no additional data available');
          setFormData(prev => ({
            ...prev,
            test_name: testName
          }));
        }
      } else {
        console.log('❌ No test name found for code:', code);
      }
    }, 500); // 500ms delay

    setTestCodeLookupTimeout(timeout);
  };

  // Comprehensive field validation and population tracking
  const validateFieldPopulation = (formData, completeData) => {
    const populationStatus = {
      test_code: {
        populated: !!formData.test_code,
        source: formData.test_code ? (completeData.testCode ? 'Excel/API' : 'Manual') : 'None',
        value: formData.test_code
      },
      department: {
        populated: !!formData.department,
        source: formData.department ? (completeData.department ? 'API' : 'Manual') : 'None',
        value: formData.department
      },
      reference_range: {
        populated: !!formData.reference_range,
        source: formData.reference_range ? (completeData.referenceRange ? 'Excel' : 'Manual') : 'None',
        value: formData.reference_range
      },
      unit: {
        populated: !!formData.unit,
        source: formData.unit ? (completeData.resultUnit ? 'Excel' : 'Manual') : 'None',
        value: formData.unit
      },
      decimal_places: {
        populated: !!formData.decimal_places,
        source: formData.decimal_places ? (completeData.decimals ? 'Excel' : 'Manual') : 'None',
        value: formData.decimal_places
      },
      notes: {
        populated: !!formData.notes,
        source: formData.notes ? (completeData.notes ? 'Excel' : 'Manual') : 'None',
        value: formData.notes
      },
      critical_low: {
        populated: !!formData.critical_low,
        source: formData.critical_low ? (completeData.criticalLow ? 'Excel' : 'Manual') : 'None',
        value: formData.critical_low
      },
      critical_high: {
        populated: !!formData.critical_high,
        source: formData.critical_high ? (completeData.criticalHigh ? 'Excel' : 'Manual') : 'None',
        value: formData.critical_high
      }
    };

    console.log('📊 Field Population Status:', populationStatus);
    return populationStatus;
  };

  // Debounced Test Name selection with duplicate prevention
  const handleTestNameSelectionDebounced = (testName) => {
    // Clear existing timeout
    if (testNameSelectionTimeout) {
      clearTimeout(testNameSelectionTimeout);
    }

    // Set new timeout for debounced processing
    const timeout = setTimeout(() => {
      // Prevent duplicate processing of the same test name
      if (testName === lastProcessedTestName) {
        console.log('🔄 Skipping duplicate test name selection for:', testName);
        return;
      }

      console.log('🎯 Processing debounced test name selection for:', testName);
      setLastProcessedTestName(testName);
      handleTestNameSelection(testName);
    }, 300); // 300ms delay to prevent rapid-fire calls

    setTestNameSelectionTimeout(timeout);
  };

  // Enhanced Test Name selection with comprehensive field population
  const handleTestNameSelection = (testName) => {
    try {
      if (!testName || typeof testName !== 'string') return;

      console.log('🎯 Starting comprehensive field population for:', testName);

      const completeData = getCompleteTestData(testName);
      if (completeData) {
        console.log('📝 Complete data retrieved:', completeData);

        setFormData(prev => {
          // Ensure prev is an object to prevent crashes
          const safePrev = prev && typeof prev === 'object' ? prev : {};

          const newFormData = {
            ...safePrev,
            test_name: testName,
            test_code: completeData.testCode || safePrev.test_code || '',
            department: completeData.department || safePrev.department || '',
            // Comprehensive field mapping with priority to Excel data
            reference_range: completeData.referenceRange || safePrev.reference_range || '',
            unit: completeData.resultUnit || safePrev.unit || '',
            decimal_places: completeData.decimals || safePrev.decimal_places || '',
            notes: completeData.notes || safePrev.notes || '',
            critical_low: completeData.criticalLow || safePrev.critical_low || '',
            critical_high: completeData.criticalHigh || safePrev.critical_high || '',
            // Additional fields that might be needed
            normal_range: completeData.referenceRange || safePrev.normal_range || '',
            description: completeData.notes || safePrev.description || ''
          };

          // Validate and log field population
          const populationStatus = validateFieldPopulation(newFormData, completeData);

          console.log('✅ Enhanced form data being set:', {
            test_name: newFormData.test_name,
            test_code: newFormData.test_code,
            department: newFormData.department,
            reference_range: newFormData.reference_range,
            unit: newFormData.unit,
            decimal_places: newFormData.decimal_places,
            notes: newFormData.notes,
            critical_low: newFormData.critical_low,
            critical_high: newFormData.critical_high,
            populationSummary: Object.keys(populationStatus).filter(key =>
              populationStatus[key].populated && populationStatus[key].source !== 'Manual'
            ).length + ' fields auto-populated'
          });

          return newFormData;
        });
      } else {
        console.log('❌ No complete data found for:', testName);
      }
    } catch (error) {
      console.error('Error in handleTestNameSelection:', error);
      // Don't crash the form, just log the error
    }
  };

  // Get filtered tabs based on search query
  const getFilteredTabs = () => {
    if (!tabSearchQuery) return dynamicTabs;

    return dynamicTabs.filter(tab =>
      tab.name.toLowerCase().includes(tabSearchQuery.toLowerCase()) ||
      tab.id.toLowerCase().includes(tabSearchQuery.toLowerCase())
    );
  };

  // Handle delete tab
  const handleDeleteTab = (tabId) => {
    if (window.confirm('Are you sure you want to delete this tab? This action cannot be undone.')) {
      // Remove tab from dynamicTabs
      setDynamicTabs(prev => prev.filter(tab => tab.id !== tabId));

      // Remove tab data from dynamicTabsData
      setDynamicTabsData(prev => {
        const newData = { ...prev };
        delete newData[tabId];
        return newData;
      });

      // If the deleted tab was active, switch to resultMaster
      if (activeTab === tabId) {
        setActiveTab('resultMaster');
      }

      setShowSuccessModal(true);
    }
  };

  // Clear all dynamic tabs
  const handleClearAllTabs = () => {
    if (window.confirm('Are you sure you want to delete ALL dynamic tabs? This action cannot be undone.')) {
      setDynamicTabs([]);
      setDynamicTabsData({});
      setActiveTab('resultMaster');
      setShowSuccessModal(true);
    }
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

  // Enhanced form input handler with comprehensive debugging and duplicate prevention
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Debug: Log all form changes
    console.log('🔄 Form change detected:', {
      name: name,
      value: value,
      type: type,
      checked: checked,
      isTestName: name === 'test_name',
      isTestCode: name === 'test_code'
    });

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
      let processedValue = type === 'checkbox' ? checked : value;

      // Apply test code formatting for test_code field
      if (name === 'test_code' && processedValue) {
        processedValue = formatTestCode(processedValue);
        console.log('🔢 Test code formatted:', value, '->', processedValue);
      }

      setFormData(prev => ({
        ...prev,
        [name]: processedValue
      }));

      // Trigger test code lookup when test_code changes
      if (name === 'test_code' && processedValue && processedValue.trim()) {
        console.log('🔍 Triggering test code lookup for:', processedValue.trim());
        handleTestCodeLookup(processedValue.trim());
      }

      // Trigger comprehensive field population when test_name changes (with debouncing)
      if (name === 'test_name' && processedValue && processedValue.trim()) {
        console.log('🎯 Triggering debounced test name selection for:', processedValue.trim());
        handleTestNameSelectionDebounced(processedValue.trim());
      }
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
    } else if (activeTab === 'referrerMaster') {
      setFormData({
        // Referrer Type Information
        referrer_type: '',
        referrer_name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',

        // Specific fields based on referrer type
        specialization: '', // For doctors
        hospital_affiliation: '', // For doctors
        company_name: '', // For corporate
        insurance_type: '', // For insurance
        department: '', // For staff
        location: '', // For outstation

        // Additional Information
        notes: '',
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

  // Render Unified Test & Result Master content
  const renderUnifiedMasterContent = () => {
    return (
      <div className="unified-master-container">
        <Alert variant="info" className="mb-3">
          <FontAwesomeIcon icon={faDatabase} className="me-2" />
          <strong className="text-black">Unified Test & Result Master:</strong> This interface combines both Test Master and Result Master functionality
          with auto-population from imported Excel data. Use this for comprehensive test and result management.
        </Alert>
        <UnifiedTestResultMaster />
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
      {/* Header */}
      <div className="technical-master-data-header">
        <h1>
          <FontAwesomeIcon icon={faChartLine} className="me-2" />
          Technical Master Data Management
        </h1>
        <div className="header-buttons-container">
          <Button
            variant="secondary"
            onClick={downloadSampleTemplate}
          >
            <FontAwesomeIcon icon={faDownload} className="me-2" />
            Download Template
          </Button>
          <Button
            variant="info"
            onClick={() => setShowExcelImportModal(true)}
          >
            <FontAwesomeIcon icon={faUpload} className="me-2" />
            Excel Import
          </Button>
          <Button
            variant="success"
            onClick={() => setShowExcelModal(true)}
          >
            <FontAwesomeIcon icon={faFileExcel} className="me-2" />
            Export Data
          </Button>
          {dynamicTabs.length > 0 && (
            <Button
              variant="warning"
              onClick={handleClearAllTabs}
              size="sm"
            >
              <FontAwesomeIcon icon={faTrash} className="me-2" />
              Clear All Tabs
            </Button>
          )}
          <Button variant="primary" onClick={handleAddClick}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add New
          </Button>
        </div>
      </div>

      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          {/* Tab Search */}
          {dynamicTabs.length > 0 && (
            <div className="mb-3">
              <InputGroup size="sm" style={{maxWidth: '300px'}}>
                <Form.Control
                  type="text"
                  placeholder="Search tabs..."
                  value={tabSearchQuery}
                  onChange={handleTabSearch}
                />
                <Button variant="outline-secondary">
                  <FontAwesomeIcon icon={faSearch} />
                </Button>
              </InputGroup>
            </div>
          )}

          <Tabs
            activeKey={activeTab}
            onSelect={setActiveTab}
            className="mb-0"
          >
            <Tab
              eventKey="resultMaster"
              title={<><FontAwesomeIcon icon={faChartLine} className="me-2" />Result Master</>}
            />
            <Tab
              eventKey="referrerMaster"
              title={<><FontAwesomeIcon icon={faUserMd} className="me-2" />Referrer Master</>}
            />
            <Tab
              eventKey="unifiedMaster"
              title={<><FontAwesomeIcon icon={faDatabase} className="me-2 " />Unified Test & Result Master</>}
            />
                <Tab
              eventKey="ProfileMaster"
              title={<><FontAwesomeIcon icon={faDatabase} className="me-2 " />ProfileMaster</>}
            />
            <Tab
              eventKey="priceSchemeMaster"
              title={<><FontAwesomeIcon icon={faDollarSign} className="me-2" />Price Scheme Master</>}
            />
            {(hasModuleAccess('REFERRAL_MASTER') || currentUser?.role === 'admin' || currentUser?.role === 'hub_admin') && (
              <Tab
                eventKey="referralMaster"
                title={<><FontAwesomeIcon icon={faUsers} className="me-2" />Referral Master</>}
              />
            )}
            
            {getFilteredTabs().map(tab => (
              <Tab
                key={tab.id}
                eventKey={tab.id}
                title={
                  <div className="d-flex align-items-center">
                    <FontAwesomeIcon icon={faDatabase} className="me-2" />
                    {tab.name}
                    <Button
                      variant="link"
                      size="sm"
                      className="ms-2 p-0 text-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTab(tab.id);
                      }}
                      title="Delete Tab"
                    >
                      <FontAwesomeIcon icon={faTrash} size="xs" />
                    </Button>
                  </div>
                }
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
              ) : activeTab === 'referrerMaster' ? (
                <Table className="table-hover">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Name</th>
                      <th>Contact Person</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Specialization/Details</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(technicalMasterData.referrerMaster || []).map(referrer => (
                      <tr key={referrer.id}>
                        <td>
                          <Badge bg="info">
                            {referrer.referrer_type || 'N/A'}
                          </Badge>
                        </td>
                        <td>{referrer.referrer_name || 'N/A'}</td>
                        <td>{referrer.contact_person || 'N/A'}</td>
                        <td>{referrer.phone || 'N/A'}</td>
                        <td>{referrer.email || 'N/A'}</td>
                        <td>
                          {referrer.specialization || referrer.company_name || referrer.department || referrer.location || 'N/A'}
                        </td>
                        <td>
                          <Badge bg={referrer.is_active ? 'success' : 'danger'}>
                            {referrer.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(referrer)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteConfirm(referrer)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : activeTab === 'unifiedMaster' ? (
                // Unified Test & Result Master Component
                renderUnifiedMasterContent()
              ) : (
                // Dynamic table for imported tabs
                renderDynamicTable()
              )}
            </div>
          )}

           {
        activeTab == "ProfileMaster" && <ProfileMaster />
      }

      {
        activeTab == "priceSchemeMaster" && <PriceSchemeMaster />
      }

      {
        activeTab == "referralMaster" && (hasModuleAccess('REFERRAL_MASTER') || currentUser?.role === 'admin' || currentUser?.role === 'hub_admin') && <ReferralMasterManagement />
      }
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
                <Form.Group className="mb-3">
                  <Form.Label>Test Name*</Form.Label>
                  <SearchableDropdown
                    name="test_name"
                    label="Test Name"
                    value={formData.test_name}
                    onChange={handleChange}
                    options={getTestProfileOptions()}
                    placeholder="Search and select test name..."
                    isRequired={true}
                    isClearable={false}
                    variant="mui"
                  />
                  <Form.Text className="text-muted">
                    🔍 Select a test name to auto-populate fields. Check browser console for debugging info.
                  </Form.Text>
                  <div className="mt-2 p-2 bg-light rounded">
                    <small className="text-info">
                      📊 Pure Dynamic Excel System: {excelFileStatus.isLoaded ? `${excelFileStatus.recordsCount} records loaded from dynamic source` : 'Dynamic Excel loading...'}
                      {!excelFileStatus.isLoaded && excelFileStatus.error && (
                        <span className="text-danger"> - ⚠️ Dynamic Excel loading failed! Check console for errors.</span>
                      )}
                    </small>
                  </div>

                  {/* Dynamic Excel File Status */}
                  <div className="mt-2 p-3 border rounded">
                    <div className="d-flex align-items-center justify-content-between">
                      <h6 className="mb-2 text-primary">
                        <FontAwesomeIcon icon={faFileExcel} className="me-2" />
                        Dynamic Excel File Status
                      </h6>
                      {excelFileStatus.isLoaded && (
                        <Badge bg="success">
                          <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                          Loaded
                        </Badge>
                      )}
                      {excelFileStatus.error && (
                        <Badge bg="danger">
                          <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                          Error
                        </Badge>
                      )}
                      {excelFileStatus.isLoading && (
                        <Badge bg="info">
                          <FontAwesomeIcon icon={faSync} className="fa-spin me-1" />
                          Loading
                        </Badge>
                      )}
                    </div>

                    <Row className="mt-2">
                      <Col md={6}>
                        <small className="text-muted">
                          <strong>File:</strong> {excelFileStatus.fileName || 'None'}
                        </small>
                      </Col>
                      <Col md={6}>
                        <small className="text-muted">
                          <strong>Sheets:</strong> {excelFileStatus.sheetsCount}
                        </small>
                      </Col>
                      <Col md={6}>
                        <small className="text-muted">
                          <strong>Records:</strong> {excelFileStatus.recordsCount}
                        </small>
                      </Col>
                      <Col md={6}>
                        <small className="text-muted">
                          <strong>Last Updated:</strong> {
                            excelFileStatus.lastUpdated
                              ? new Date(excelFileStatus.lastUpdated).toLocaleString()
                              : 'Never'
                          }
                        </small>
                      </Col>
                    </Row>

                    {excelFileStatus.error && (
                      <Alert variant="danger" className="mt-2 mb-0">
                        <small>
                          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                          {excelFileStatus.error}
                        </small>
                      </Alert>
                    )}

                    {excelFileStatus.isLoaded && excelFileData && (
                      <div className="mt-2">
                        <small className="text-success">
                          <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                          Excel file data is available for auto-population
                        </small>
                        <div className="mt-1">
                          <small className="text-muted">
                            Available sheets: {Object.keys(excelFileData).join(', ')}
                          </small>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="ms-2"
                      onClick={refreshExcelData}
                      disabled={excelFileStatus.isLoading}
                    >
                      <FontAwesomeIcon icon={faRefresh} className={excelFileStatus.isLoading ? 'fa-spin' : ''} />
                      {excelFileStatus.isLoading ? ' Refreshing...' : ' Refresh Excel Data'}
                    </Button>

                  </div>
                </Form.Group>
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
                  <Form.Label>Result Unit
                    <small className="text-muted"> (Auto-populated from Excel)</small>
                  </Form.Label>
                  <Form.Select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    style={{
                      backgroundColor: formData.unit ? '#f8f9fa' : 'white',
                      borderColor: formData.unit ? '#28a745' : '#ced4da'
                    }}
                  >
                    <option value="">Auto-populated from Excel...</option>
                    <option value="mg/dl">mg/dl</option>
                    <option value="mmol/L">mmol/L</option>
                    <option value="g/dL">g/dL</option>
                    <option value="IU/L">IU/L</option>
                    <option value="U/L">U/L</option>
                    <option value="ng/ml">ng/ml</option>
                    <option value="pg/ml">pg/ml</option>
                    <option value="U/ml">U/ml</option>
                    <option value="%">%</option>
                    <option value="μg/dl">μg/dl</option>
                    <option value="μIU/ml">μIU/ml</option>
                    <option value="mIU/L">mIU/L</option>
                    <option value="ng/dl">ng/dl</option>
                    <option value="AU/ml">AU/ml</option>
                    <option value="RU/ml">RU/ml</option>
                    <option value="copies/ml">copies/ml</option>
                    <option value="Positive/Negative">Positive/Negative</option>
                    <option value="Reactive/Non-reactive">Reactive/Non-reactive</option>
                  </Form.Select>
                  {formData.unit && (
                    <Form.Text className="text-success">
                      ✅ Auto-populated from Excel data
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <div>
                  <NumberInput
                    name="decimal_places"
                    label="No of Decimals (Auto-populated from Excel)"
                    value={formData.decimal_places}
                    onChange={handleChange}
                    min={0}
                    max={5}
                    placeholder="Auto-populated from Excel..."
                    style={{
                      backgroundColor: formData.decimal_places ? '#f8f9fa' : 'white',
                      borderColor: formData.decimal_places ? '#28a745' : '#ced4da'
                    }}
                  />
                  {formData.decimal_places && (
                    <Form.Text className="text-success">
                      ✅ Auto-populated from Excel data
                    </Form.Text>
                  )}
                </div>
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
                  <Form.Label>Reference Range
                    <small className="text-muted"> (Auto-populated from Excel)</small>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={10}
                    name="reference_range"
                    value={formData.reference_range}
                    onChange={handleChange}
                    placeholder="Will be auto-populated when you select a test name..."
                    style={{
                      backgroundColor: formData.reference_range ? '#f8f9fa' : 'white',
                      borderColor: formData.reference_range ? '#28a745' : '#ced4da',
                      resize: 'vertical',
                      minHeight: '200px',
                      maxHeight: '300px',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                      overflow: 'auto',
                      fontSize: '14px',
                      lineHeight: '1.4'
                    }}
                  />
                  {formData.reference_range && (
                    <Form.Text className="text-success">
                      ✅ Auto-populated from Excel data
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Notes Section */}
          <div className="border rounded p-3 mb-3">
            <h6 className="text-primary mb-3">Notes
              <small className="text-muted"> (Auto-populated from Excel)</small>
            </h6>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Control
                    as="textarea"
                    rows={20}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Will be auto-populated when you select a test name..."
                    style={{
                      backgroundColor: formData.notes ? '#f8f9fa' : 'white',
                      borderColor: formData.notes ? '#28a745' : '#ced4da',
                      resize: 'vertical',
                      minHeight: '400px',
                      maxHeight: '600px',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                      overflow: 'auto',
                      fontSize: '14px',
                      lineHeight: '1.4'
                    }}
                  />
                  {formData.notes && (
                    <Form.Text className="text-success">
                      ✅ Auto-populated from Excel data
                    </Form.Text>
                  )}
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
            {/* <Row>
              <Col md={12} className="text-end">
                <Button variant="success" className="me-2">
                  <FontAwesomeIcon icon={faPlus} className="me-1" />
                  Add
                </Button>
              </Col>
            </Row> */}
          </div>
        </>
        ) : activeTab === 'referrerMaster' ? (
          /* Referrer Master Form */
          <>
          {/* Basic Information Section */}
          <div className="border rounded p-3 mb-3">
            <h6 className="text-primary mb-3">Referrer Information</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Referrer Type*</Form.Label>
                  <Form.Select
                    name="referrer_type"
                    value={formData.referrer_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Referrer Type</option>
                    <option value="doctor">Doctor</option>
                    <option value="hospital">Hospital</option>
                    <option value="lab">Lab</option>
                    <option value="corporate">Corporate</option>
                    <option value="insurance">Insurance</option>
                    <option value="staff">Staff</option>
                    <option value="consultant">Consultant</option>
                    <option value="outstation">Outstation</option>
                    <option value="self">Self</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Referrer Name*</Form.Label>
                  <Form.Control
                    type="text"
                    name="referrer_name"
                    value={formData.referrer_name}
                    onChange={handleChange}
                    placeholder="Enter referrer name"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Person</Form.Label>
                  <Form.Control
                    type="text"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleChange}
                    placeholder="Enter contact person name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Type-Specific Information */}
          <div className="border rounded p-3 mb-3">
            <h6 className="text-primary mb-3">Additional Details</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {formData.referrer_type === 'doctor' ? 'Specialization' :
                     formData.referrer_type === 'corporate' ? 'Company Name' :
                     formData.referrer_type === 'insurance' ? 'Insurance Type' :
                     formData.referrer_type === 'staff' ? 'Department' :
                     formData.referrer_type === 'outstation' ? 'Location' :
                     'Specialization/Details'}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder={
                      formData.referrer_type === 'doctor' ? 'Enter specialization' :
                      formData.referrer_type === 'corporate' ? 'Enter company name' :
                      formData.referrer_type === 'insurance' ? 'Enter insurance type' :
                      formData.referrer_type === 'staff' ? 'Enter department' :
                      formData.referrer_type === 'outstation' ? 'Enter location' :
                      'Enter relevant details'
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hospital/Institution Affiliation</Form.Label>
                  <Form.Control
                    type="text"
                    name="hospital_affiliation"
                    value={formData.hospital_affiliation}
                    onChange={handleChange}
                    placeholder="Enter hospital or institution name"
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
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Enter additional notes or comments"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Check
                  type="switch"
                  id="is_active_referrer"
                  name="is_active"
                  label="Active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
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
              <Form.Group className="mb-3">
                <Form.Label>Test Name*</Form.Label>
                <SearchableDropdown
                  name="test_name"
                  label="Test Name"
                  value={formData.test_name}
                  onChange={handleChange}
                  options={getTestProfileOptions()}
                  placeholder="Search and select test name..."
                  isRequired={true}
                  isClearable={false}
                  variant="mui"
                />
              </Form.Group>
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

        {/* Critical Values Section */}
        <div className="border rounded p-3 mb-3">
          <h6 className="text-primary mb-3">Critical Values</h6>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Critical Low
                  <small className="text-muted"> (Auto-populated)</small>
                </Form.Label>
                <Form.Control
                  type="number"
                  name="critical_low"
                  value={formData.critical_low}
                  onChange={handleChange}
                  placeholder="Auto-populated from Excel..."
                  style={{
                    backgroundColor: formData.critical_low ? '#f8f9fa' : 'white',
                    borderColor: formData.critical_low ? '#28a745' : '#ced4da'
                  }}
                />
                {formData.critical_low && (
                  <Form.Text className="text-success">✅ Auto-populated</Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Critical High
                  <small className="text-muted"> (Auto-populated)</small>
                </Form.Label>
                <Form.Control
                  type="number"
                  name="critical_high"
                  value={formData.critical_high}
                  onChange={handleChange}
                  placeholder="Auto-populated from Excel..."
                  style={{
                    backgroundColor: formData.critical_high ? '#f8f9fa' : 'white',
                    borderColor: formData.critical_high ? '#28a745' : '#ced4da'
                  }}
                />
                {formData.critical_high && (
                  <Form.Text className="text-success">✅ Auto-populated</Form.Text>
                )}
              </Form.Group>
            </Col>
          </Row>
        </div>

        {/* Reference Range Section */}
        <div className="border rounded p-3 mb-3">
          <h6 className="text-primary mb-3">Reference Range</h6>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Reference Range
                  <small className="text-muted"> (Auto-populated from Excel)</small>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={10}
                  name="reference_range"
                  value={formData.reference_range}
                  onChange={handleChange}
                  placeholder="Will be auto-populated when you select a test name..."
                  style={{
                    backgroundColor: formData.reference_range ? '#f8f9fa' : 'white',
                    borderColor: formData.reference_range ? '#28a745' : '#ced4da',
                    resize: 'vertical',
                    minHeight: '200px',
                    maxHeight: '300px',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflow: 'auto',
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}
                />
                {formData.reference_range && (
                  <Form.Text className="text-success">
                    ✅ Auto-populated from Excel data
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
          </Row>
        </div>

        {/* Notes Section */}
        <div className="border rounded p-3 mb-3">
          <h6 className="text-primary mb-3">Notes
            <small className="text-muted"> (Auto-populated from Excel)</small>
          </h6>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Control
                  as="textarea"
                  rows={20}
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Will be auto-populated when you select a test name..."
                  style={{
                    backgroundColor: formData.notes ? '#f8f9fa' : 'white',
                    borderColor: formData.notes ? '#28a745' : '#ced4da',
                    resize: 'vertical',
                    minHeight: '400px',
                    maxHeight: '600px',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflow: 'auto',
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}
                />
                {formData.notes && (
                  <Form.Text className="text-success">
                    ✅ Auto-populated from Excel data
                  </Form.Text>
                )}
              </Form.Group>
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
        ) : activeTab === 'referrerMaster' ? (
          /* Referrer Master Edit Form - Same as Add Form */
          <>
          {/* Basic Information Section */}
          <div className="border rounded p-3 mb-3">
            <h6 className="text-primary mb-3">Referrer Information</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Referrer Type*</Form.Label>
                  <Form.Select
                    name="referrer_type"
                    value={formData.referrer_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Referrer Type</option>
                    <option value="doctor">Doctor</option>
                    <option value="hospital">Hospital</option>
                    <option value="lab">Lab</option>
                    <option value="corporate">Corporate</option>
                    <option value="insurance">Insurance</option>
                    <option value="staff">Staff</option>
                    <option value="consultant">Consultant</option>
                    <option value="outstation">Outstation</option>
                    <option value="self">Self</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Referrer Name*</Form.Label>
                  <Form.Control
                    type="text"
                    name="referrer_name"
                    value={formData.referrer_name}
                    onChange={handleChange}
                    placeholder="Enter referrer name"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Person</Form.Label>
                  <Form.Control
                    type="text"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleChange}
                    placeholder="Enter contact person name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Type-Specific Information */}
          <div className="border rounded p-3 mb-3">
            <h6 className="text-primary mb-3">Additional Details</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {formData.referrer_type === 'doctor' ? 'Specialization' :
                     formData.referrer_type === 'corporate' ? 'Company Name' :
                     formData.referrer_type === 'insurance' ? 'Insurance Type' :
                     formData.referrer_type === 'staff' ? 'Department' :
                     formData.referrer_type === 'outstation' ? 'Location' :
                     'Specialization/Details'}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder={
                      formData.referrer_type === 'doctor' ? 'Enter specialization' :
                      formData.referrer_type === 'corporate' ? 'Enter company name' :
                      formData.referrer_type === 'insurance' ? 'Enter insurance type' :
                      formData.referrer_type === 'staff' ? 'Enter department' :
                      formData.referrer_type === 'outstation' ? 'Enter location' :
                      'Enter relevant details'
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hospital/Institution Affiliation</Form.Label>
                  <Form.Control
                    type="text"
                    name="hospital_affiliation"
                    value={formData.hospital_affiliation}
                    onChange={handleChange}
                    placeholder="Enter hospital or institution name"
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
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Enter additional notes or comments"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Check
                  type="switch"
                  id="is_active_referrer_edit"
                  name="is_active"
                  label="Active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
              </Col>
            </Row>
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
