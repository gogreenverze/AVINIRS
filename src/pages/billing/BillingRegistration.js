import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Table, InputGroup, Alert, Modal, ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faSave, faPlus, faTrash, faSearch, faUser, faPhone,
  faExclamationTriangle, faCheckCircle, faTimes, faIdCard, faEnvelope,
  faCalendarAlt, faCreditCard, faFlask, faCalculator, faSpinner,
  faFileInvoiceDollar, faPrint, faEdit, faCheck, faUserPlus,
  faInfoCircle, faUsers
} from '@fortawesome/free-solid-svg-icons';
import { patientAPI, adminAPI } from '../../services/api';
import billingService from '../../services/billingAPI';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import dynamicPricingService from '../../services/dynamicPricingService';
import referrerMasterData from '../../data/referrerMasterData.json';
import '../../styles/BillingRegistration.css';
import { Tab, Tabs } from "react-bootstrap";

// Compact Patient Search Component (NEW - from BillingRegistration.js)
const PatientSearch = ({ onPatientSelect, searchTerm, setSearchTerm, searchResults, searching }) => {
  const [showResults, setShowResults] = useState(false);


  return (
    <div className="patient-search-compact">
      <InputGroup size="sm">
        <InputGroup.Text>
          <FontAwesomeIcon icon={faSearch} />
        </InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Search existing patient (name/phone)..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowResults(e.target.value.length > 0);
          }}
          onFocus={() => setShowResults(searchTerm.length > 0)}
        />
        {searchTerm && (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setShowResults(false);
            }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        )}
      </InputGroup>

      {showResults && searchResults.length > 0 && (
        <div className="search-results-dropdown">
          {searchResults.slice(0, 5).map((patient) => (
            <div
              key={patient.id}
              className="search-result-item"
              onClick={() => {
                onPatientSelect(patient);
                setShowResults(false);
              }}
            >
              <div className="patient-info">
                <strong>{patient.first_name} {patient.last_name}</strong>
                <small className="text-muted d-block">{patient.phone}</small>
              </div>
            </div>
          ))}
        </div>
      )}

      {searching && (
        <div className="text-center p-2">
          <FontAwesomeIcon icon={faSpinner} spin /> Searching...
        </div>
      )}
    </div>
  );
};

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
  getOptionLabel = (option) => option.testName || option.test_profile || option.label || option.name || option.description || option,
  getOptionValue = (option) => option.id || option.value || option,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');



  // Debounce search term for better performance with large datasets
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150); // 150ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];

  // Performance optimization: limit search results for large datasets
  const filteredOptions = safeOptions.filter(option => {
    if (!option) return false;
    const label = getOptionLabel(option);
    if (!debouncedSearchTerm) return true; // Show all options when no search term
    return label && typeof label === 'string' &&
           label.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
  }).slice(0, 50); // Limit to 50 results for performance

  const selectedOption = safeOptions.find(option => getOptionValue(option) === value);

  return (
    <div className="searchable-dropdown">
      <Form.Group className="mb-3">
        {label && (
          <Form.Label>
            {label} {isRequired && <span className="text-danger">*</span>}
          </Form.Label>
        )}
        <div className="position-relative">
          {/* Hidden input for form validation */}
          <input
            type="hidden"
            name={name}
            value={value || ''}
            required={isRequired}
          />
          <Form.Control
            type="text"
            value={selectedOption ? getOptionLabel(selectedOption) : searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
              // Clear selection if user is typing
              if (!selectedOption || e.target.value !== getOptionLabel(selectedOption)) {
                const event = {
                  target: {
                    name: name,
                    value: ''
                  }
                };
                onChange(event);
              }
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            placeholder={placeholder}
            disabled={isDisabled}
            className={isRequired && !value ? 'is-invalid' : ''}
          />
          {isOpen && filteredOptions.length > 0 && (
            <div className="dropdown-menu show position-absolute w-100" style={{ zIndex: 1050, maxHeight: '200px', overflowY: 'auto' }}>
              {filteredOptions.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    const event = {
                      target: {
                        name: name,
                        value: getOptionValue(option)
                      }
                    };
                    onChange(event);
                    setSearchTerm('');
                    setIsOpen(false);
                  }}
                >
                  {getOptionLabel(option)}
                </button>
              ))}
            </div>
          )}
          {/* Clear button */}
          {isClearable && value && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary position-absolute"
              style={{ right: '5px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
              onClick={() => {
                const event = {
                  target: {
                    name: name,
                    value: ''
                  }
                };
                onChange(event);
                setSearchTerm('');
              }}
            >
              ×
            </button>
          )}
        </div>
        {isRequired && !value && (
          <div className="invalid-feedback d-block">
            Please select a {label?.toLowerCase() || 'value'}.
          </div>
        )}
      </Form.Group>
    </div>
  );
};

const BillingRegistration = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { tenantData, accessibleTenants, currentTenantContext } = useTenant();

  // Add enhanced styling for modern UI
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .patient-search-compact {
        position: relative;
      }
      .patient-search-compact .search-results-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #ddd;
        border-radius: 0.375rem;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        z-index: 1000;
        max-height: 300px;
        overflow-y: auto;
      }
      .search-result-item {
        padding: 0.75rem;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .search-result-item:hover {
        background-color: #f8f9fa;
      }
      .billing-summary {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 0.375rem;
        margin-bottom: 1rem;
      }
      .form-label {
        font-weight: 600;
        color: #495057;
      }
      .card-header h6 {
        font-weight: 600;
        letter-spacing: 0.5px;
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Core states (Enhanced)
  const [loading, setLoading] = useState(false);
  const [sidGenerating, setSidGenerating] = useState(false); // NEW STATE
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Validation states (NEW)
  const [fieldErrors, setFieldErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});
  const [validationSummary, setValidationSummary] = useState({
    isValid: false,
    completedFields: 0,
    totalRequiredFields: 0,
    missingFields: []
  });

  // UI states for progressive disclosure (NEW)
  const [collapsedSections, setCollapsedSections] = useState({
    patientInfo: false,
    testSelection: false,
    billingDetails: false,
    paymentInfo: true // Start collapsed
  });

  // Patient search states (Enhanced)
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Enhanced form data state with all fields from both versions
  const [formData, setFormData] = useState({
    // Section 1: Branch & Registration Details (Enhanced)
    branch: currentUser?.tenant_id || '',
    date: new Date().toISOString().split('T')[0],
    no: '', // Manual entry number
    sidDate: new Date().toISOString().split('T')[0], // NEW FIELD
    sidNo: '', // Auto-generated SID (renamed from 'no')
    category: 'Normal',

    // Section 2: Patient Information (Enhanced)
    patient: '', // Keep for backward compatibility
    patientCode: '', // NEW FIELD
    title: 'Mr.', // NEW FIELD
    patientName: '', // NEW FIELD
    firstName: '', // NEW FIELD
    lastName: '', // NEW FIELD
    dob: '',
    age: '', // Keep for backward compatibility
    ageYears: '', // NEW FIELD
    ageMonths: '', // NEW FIELD
    ageInput: '', // NEW FIELD - Manual age entry
    ageMode: 'dob', // NEW FIELD - 'dob' or 'manual'
    years: '', // Keep for backward compatibility
    months: '', // Keep for backward compatibility
    sex: 'Male',
    mobile: '',
    email: '',
    referrer: 'Doctor',
    source: '',
    collectionBoy: '', // NEW FIELD
    motherName: '', // NEW FIELD - For baby patients

    // Section 3: Test Selection (Enhanced)
    tests: [], // NEW FIELD - Modern test structure

    // Section 4: Billing Details (Enhanced)
    sampleCollectDateTime: new Date().toISOString().slice(0, 16), // NEW FIELD
    billAmount: 0.00,
    otherCharges: 0.00,
    otherChargesDescription: '', // NEW FIELD
    discountType: 'percentage', // NEW FIELD - 'percentage' or 'amount'
    discountPercent: 0.00,
    discountAmount: 0, // NEW FIELD
    discountRemarks: '', // NEW FIELD
    gstRate: 18.00, // Default GST rate
    gstAmount: 0.00,
    totalAmount: 0.00,
    amountPaid: 0.00,
    balanceToBePaid: 0.00,
    finalReportDate: '', // NEW FIELD

    // Section 5: Payment Details (Enhanced)
    paymentMethod: 'Cash', // NEW FIELD (renamed from 'cash')
    cash: '', // Keep for backward compatibility
    bankName: '',
    referenceNumber: '',
    paymentDate: new Date().toISOString().split('T')[0], // NEW FIELD
    paymentAmount: 0, // NEW FIELD
    amount: '', // Keep for backward compatibility

    // Section 6: Clinical & Remarks (Enhanced)
    clinicalRemarks: '',
    generalRemarks: '', // NEW FIELD
    remarks: '', // Keep for backward compatibility
    emergency: false,
    deliveryMode: 'Lab Pickup', // Enhanced with default value

    // Section 7: Study/Research Details (Enhanced)
    studyNo: '',
    subPeriod: '',
    subjectPeriod: '', // NEW FIELD
    subNo: '',
    
    // Test Items
    testItems: []
  });

  // Master data
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [testProfiles, setTestProfiles] = useState([]);
  const [referrers, setReferrers] = useState([]);

  // Excel data integration states
  const [excelDataLoading, setExcelDataLoading] = useState(false);
  const [excelDataError, setExcelDataError] = useState(null);
  const [excelDataCache, setExcelDataCache] = useState(null);
  const [excelDataLastFetch, setExcelDataLastFetch] = useState(null);

  // Excel data fetching function with caching
  // const fetchExcelData = async (forceRefresh = false) => {
  //   // Check cache validity (cache for 5 minutes)
  //   const cacheValidityMs = 5 * 60 * 1000; // 5 minutes
  //   const now = new Date().getTime();

  //   if (!forceRefresh && excelDataCache && excelDataLastFetch &&
  //       (now - excelDataLastFetch) < cacheValidityMs) {
  //     console.log('Using cached Excel data');
  //     return excelDataCache;
  //   }

  //   try {
  //     setExcelDataLoading(true);
  //     setExcelDataError(null);

  //     console.log('Fetching Excel data from API...');
  //     const response = await fetch('/api/admin/excel-data', {
  //       headers: {
  //         'Authorization': `Bearer ${localStorage.getItem('token')}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     if (!response.ok) {
  //       throw new Error(`Failed to fetch Excel data: ${response.status} ${response.statusText}`);
  //     }

  //     const data = await response.json();

  //     if (!data.data || !Array.isArray(data.data)) {
  //       throw new Error('Invalid Excel data format received from API');
  //     }

  //     // Transform Excel data to match expected test profile structure
  //     const transformedData = data.data.map(test => ({
  //       id: test.id,
  //       testName: test.test_name,
  //       test_profile: test.test_name,
  //       test_price: test.price || 0,
  //       department: test.department || 'General',
  //       hmsCode: test.test_code || '',
  //       specimen: test.specimen || '',
  //       container: test.container || '',
  //       serviceTime: test.service_time || '',
  //       reportingDays: test.reporting_days || '',
  //       cutoffTime: test.cutoff_time || '',
  //       referenceRange: test.reference_range || '',
  //       resultUnit: test.result_unit || '',
  //       decimals: test.decimals || 0,
  //       criticalLow: test.critical_low,
  //       criticalHigh: test.critical_high,
  //       method: test.method || '',
  //       instructions: test.instructions || '',
  //       notes: test.notes || '',
  //       minSampleQty: test.min_sample_qty || '',
  //       testDoneOn: test.test_done_on || '',
  //       applicableTo: test.applicable_to || 'Both',
  //       isActive: test.is_active !== false,
  //       // Keep original Excel data for comprehensive mapping
  //       ...test
  //     }));

  //     // Cache the data
  //     setExcelDataCache(transformedData);
  //     setExcelDataLastFetch(now);

  //     console.log(`Successfully loaded ${transformedData.length} tests from Excel data API`);
  //     return transformedData;

  //   } catch (err) {
  //     console.error('Error fetching Excel data:', err);
  //     setExcelDataError(err.message);

  //     // Return cached data if available, otherwise empty array
  //     if (excelDataCache) {
  //       console.log('Using cached Excel data due to fetch error');
  //       return excelDataCache;
  //     }

  //     throw err;
  //   } finally {
  //     setExcelDataLoading(false);
  //   }
  // };

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

    const [excelResponse, manualResponse,profilesResponse] = await Promise.all([
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
      }),
       fetch('/api/profile-master', {
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
    const profilesData = await profilesResponse.json();

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


      const formatProfile = profile => ({
      id: profile.id,
      testName: profile.test_profile,   // so search works same way
      test_profile: profile.test_profile,
      test_price: profile.test_price || 0,
      testItems: profile.testItems || [],
      category: profile.category || 'Standard',
      code: profile.code,
      description: profile.description || '',
      isActive: profile.is_active !== false,
      type: "profile", // 👈 added type to distinguish
      ...profile
    });

    const transformedProfiles = Array.isArray(profilesData) ? profilesData.map(formatProfile) : [];

    const allTests = [...transformedExcelData, ...transformedManualData,...transformedProfiles];

    setExcelDataCache(allTests);
    setExcelDataLastFetch(now);

    console.log(`Loaded ${allTests.length} tests (Excel + Manual)`);
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

  // Helper functions (NEW - from BillingRegistration.js)
  const ensureNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const calculateAgeFromDOB = (dob) => {
    if (!dob) return { years: 0, months: 0 };

    const birthDate = new Date(dob);
    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months };
  };

  const formatAge = (years, months) => {
    if (years > 0) {
      return months > 0 ? `${years}Y ${months}M` : `${years}Y`;
    }
    return `${months}M`;
  };

  // Test item form with referral source
  const [newTestItem, setNewTestItem] = useState({
    testName: '',
    test_id: null,
    amount: 0.00,
    referralType: 'Patient', // New: First select referral type
    referralSource: '', // Then select specific referral source
    pricingScheme: '', // Optional explicit scheme
    priceCalculationDetails: null // Store pricing calculation details
  });

  // Referral sources state - enhanced for cascading dropdowns
  const [allReferralSources, setAllReferralSources] = useState([]);
  const [filteredReferralSources, setFilteredReferralSources] = useState([]);
  const [loadingReferrals, setLoadingReferrals] = useState(true);

  // Referral types configuration
  const referralTypes = ['Doctor', 'Hospital', 'Lab', 'Corporate', 'Insurance', 'Patient'];

  // GST configurations
  const [gstConfigs, setGstConfigs] = useState([]);
  const [defaultGstRate, setDefaultGstRate] = useState(18.00);

  // Patient search functionality
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPatientData, setSelectedPatientData] = useState(null);

  // Patient add functionality
  const [showPatientAdd, setShowPatientAdd] = useState(false);
  const [patientAddData, setPatientAddData] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    date_of_birth: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: 'Tamil Nadu',
    postal_code: '',
    emergency_contact: '',
    emergency_phone: '',
    blood_group: '',
    insurance_provider: '',
    insurance_id: '',
    tenant_id: null // Will be set based on user role
  });
  const [patientAddLoading, setPatientAddLoading] = useState(false);
  const [patientAddValidated, setPatientAddValidated] = useState(false);
  const [activeTab, setActiveTab] = useState("patient");

  // Patient search functionality with debouncing for live search
  const handlePatientSearch = async (query = patientSearchQuery) => {
    // Ensure query is a string and handle edge cases
    const searchQuery = typeof query === 'string' ? query : (patientSearchQuery || '');

    if (!searchQuery.trim()) {
      setPatientSearchResults([]);
      return;
    }

    // Check if a branch is selected - if not, use current user's tenant
    let branchId = formData.branch;
    if (!branchId && currentUser?.tenant_id) {
      branchId = currentUser.tenant_id;
    }

    // Use default tenant if still no branch
    if (!branchId) {
      branchId = currentUser?.tenant_id || 2;
    }

    try {
      setSearchLoading(true);
      const response = await patientAPI.searchPatients(searchQuery, branchId);

      // Handle different response formats
      let patients = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          patients = response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          patients = response.data.items;
        } else if (typeof response.data === 'object') {
          patients = Object.values(response.data).filter(item => item && typeof item === 'object');
        }
      }

      setPatientSearchResults(patients);
    } catch (err) {
      console.error('Error searching patients:', err);
      setError('Failed to search patients. Please try again.');
      setPatientSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search effect for live search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const searchQuery = typeof patientSearchQuery === 'string' ? patientSearchQuery : '';
      if (searchQuery.trim().length >= 2) {
        handlePatientSearch();
      } else if (searchQuery.trim().length === 0) {
        setPatientSearchResults([]);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [patientSearchQuery, formData.branch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Enhanced patient selection handler (Updated with new fields)
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient); // NEW: Use selectedPatient state
    setSelectedPatientData(patient); // Keep for backward compatibility

    const { years, months } = calculateAgeFromDOB(patient.date_of_birth);

    setFormData(prev => ({
      ...prev,
      // Original fields (keep for backward compatibility)
      patient: patient.id,
      dob: patient.date_of_birth || '',
      mobile: patient.phone || '',
      email: patient.email || '',
      sex: patient.gender || 'Male',
      years: years.toString(),

      // NEW FIELDS from BillingRegistration.js
      patientCode: patient.id || '',
      title: patient.title || 'Mr.',
      patientName: `${patient.first_name || ''} ${patient.last_name || ''}`.trim().toUpperCase(),
      firstName: patient.first_name || '',
      lastName: patient.last_name || '',
      ageYears: years,
      ageMonths: months,
      ageInput: years > 0 ? `${years} years` : `${months} months`,
      ageMode: 'dob',
      motherName: patient.mother_name || ''
    }));

    // Clear search states
    setPatientSearchTerm(''); // NEW: Use new search term state
    setShowPatientSearch(false);
    setPatientSearchQuery(''); // Keep for backward compatibility
    setPatientSearchResults([]);
  };

  // Handle patient add form changes
  const handlePatientAddChange = (e) => {
    const { name, value } = e.target;
    setPatientAddData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle patient add form submission
  const handlePatientAddSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setPatientAddValidated(true);
      return;
    }

    setPatientAddValidated(true);
    setPatientAddLoading(true);
    setError(null);

    try {
      // Determine tenant_id based on user role
      let targetTenantId = null;

      if (currentUser?.role === 'admin' || currentUser?.role === 'hub_admin') {
        // For admin/hub_admin, use selected tenant from form or current context
        targetTenantId = patientAddData.tenant_id || currentTenantContext?.id || tenantData?.id;
      } else {
        // For other roles, use their own tenant
        targetTenantId = currentUser?.tenant_id;
      }

      const patientDataToSubmit = {
        ...patientAddData,
        tenant_id: targetTenantId
      };

      console.log('Creating patient with data:', patientDataToSubmit);
      const response = await patientAPI.createPatient(patientDataToSubmit);
      console.log('Patient created successfully:', response.data);

      // Select the newly created patient
      const newPatient = response.data;
      handlePatientSelect(newPatient);

      // Reset form and close modal
      setPatientAddData({
        first_name: '',
        last_name: '',
        gender: '',
        date_of_birth: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: 'Tamil Nadu',
        postal_code: '',
        emergency_contact: '',
        emergency_phone: '',
        blood_group: '',
        insurance_provider: '',
        insurance_id: '',
        tenant_id: null
      });
      setPatientAddValidated(false);
      setShowPatientAdd(false);

      // Clear any previous errors
      setError(null);

    } catch (err) {
      console.error('Error creating patient:', err);
      setError(err.response?.data?.message || 'Failed to create patient. Please try again.');
    } finally {
      setPatientAddLoading(false);
    }
  };

  // Handle patient add button click (for form submission)
  const handlePatientAddButtonClick = (e) => {
    e.preventDefault();
    const form = document.querySelector('#patientAddForm');
    if (form) {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
    }
  };

  // Initialize patient add form when modal opens
  const handlePatientAddOpen = () => {
    // Set default tenant_id for admin/hub_admin roles
    if (currentUser?.role === 'admin' || currentUser?.role === 'hub_admin') {
      setPatientAddData(prev => ({
        ...prev,
        tenant_id: formData.branch || currentTenantContext?.id || tenantData?.id
      }));
    }
    setShowPatientAdd(true);
  };

  // Generate SID number based on franchise
  const generateSIDNumber = async (branchId = null) => {
    try {
      // Use the provided branchId or fall back to current context
      let targetTenantId = branchId || currentTenantContext?.id || tenantData?.id;

      // Ensure targetTenantId is an integer
      if (typeof targetTenantId === 'string') {
        targetTenantId = parseInt(targetTenantId, 10);
      }

      if (!targetTenantId || isNaN(targetTenantId)) {
        throw new Error('Invalid tenant ID for SID generation');
      }

      console.log('Generating SID for tenant ID:', targetTenantId);

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/billing/generate-sid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tenant_id: targetTenantId,
          user_role: currentUser?.role
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('SID generation successful:', data);
        return data.sid_number;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('SID generation failed:', response.status, errorData);
        throw new Error(errorData.message || `Failed to generate SID (HTTP ${response.status})`);
      }
    } catch (err) {
      console.error('Error generating SID:', err);

      // If it's a network error or API error, provide more specific information
      if (err.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server for SID generation. Please check your connection.');
      }

      // If it's our custom error, re-throw it
      if (err.message.includes('Invalid tenant ID') || err.message.includes('HTTP')) {
        throw err;
      }

      // For other errors, provide context
      const selectedBranch = branches.find(b => b.id.toString() === (branchId || formData.branch));
      const siteCode = selectedBranch?.site_code || currentTenantContext?.site_code || tenantData?.site_code;
      const franchiseName = selectedBranch?.name || currentTenantContext?.name || tenantData?.name;

      if (!siteCode) {
        throw new Error('Unable to determine franchise site code for SID generation. Please contact system administrator.');
      }

      throw new Error(`Failed to generate SID for franchise ${franchiseName} (${siteCode}). Error: ${err.message}. Please try again or contact system administrator.`);
    }
  };

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
      if (accessibleTenants && accessibleTenants.length > 0) {
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

        // Set branches based on user access control
        const userBranches = getBranchesForUser();
        setBranches(userBranches);

        // Auto-select branch for non-admin users who have only one franchise
        if ((currentUser?.role === 'franchise_admin' ||
             (currentUser?.role !== 'admin' && currentUser?.role !== 'hub_admin')) &&
            userBranches.length === 1 && !formData.branch) {
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
          console.log(`Loaded ${excelTestProfiles.length} tests from Excel data API`);
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

  // Load referral sources - enhanced for cascading dropdowns
  useEffect(() => {
    const loadReferralSources = async () => {
      try {
        setLoadingReferrals(true);
        const sources = await dynamicPricingService.getAvailableReferralSourcesAsync();
        setAllReferralSources(sources);

        // Initially filter for Patient type (default)
        filterReferralSourcesByType('Patient', sources);
      } catch (error) {
        console.error('Error loading referral sources:', error);
        // Fallback to static data
        const fallbackSources = dynamicPricingService.getAvailableReferralSources();
        setAllReferralSources(fallbackSources);
        filterReferralSourcesByType('Patient', fallbackSources);
      } finally {
        setLoadingReferrals(false);
      }
    };

    loadReferralSources();
  }, []);

  // Filter referral sources by type
  const filterReferralSourcesByType = (type, sources = allReferralSources) => {
    const filtered = sources.filter(source => source.referralType === type);
    setFilteredReferralSources(filtered);

    // Reset referral source selection when type changes
    setNewTestItem(prev => ({
      ...prev,
      referralSource: filtered.length > 0 ? filtered[0].id : ''
    }));
  };

  // Handle referral type change
  const handleReferralTypeChange = (type) => {
    setNewTestItem(prev => ({
      ...prev,
      referralType: type,
      referralSource: '' // Reset source selection
    }));
    filterReferralSourcesByType(type);
  };

  // Generate SID number when component loads or branch changes
  useEffect(() => {
    const initializeSID = async () => {
      try {
        if (formData.branch) {
          console.log('Initializing SID for branch:', formData.branch);
          // Clear existing SID when branch changes and generate new one
          const sidNumber = await generateSIDNumber(formData.branch);
          console.log('Generated SID:', sidNumber);
          setFormData(prev => ({
            ...prev,
            no: ""
          }));
        } else {
          // Clear SID if no branch is selected
          setFormData(prev => ({
            ...prev,
            no: ''
          }));
        }
      } catch (error) {
        console.error('Error in initializeSID:', error);
        setError(error.message);
      }
    };

    initializeSID();
  }, [formData.branch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Enhanced form field change handler with new field support
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };

    // Handle special field logic for new fields
    if (name === 'firstName' || name === 'lastName') {
      // Auto-generate full patient name
      const firstName = name === 'firstName' ? value : formData.firstName;
      const lastName = name === 'lastName' ? value : formData.lastName;
      newFormData.patientName = `${firstName} ${lastName}`.trim().toUpperCase();
    }

    // Auto-gender selection based on title
    if (name === 'title') {
      if (value === 'Mr.' || value === 'Master') {
        newFormData.sex = 'Male';
      } else if (value === 'Mrs.' || value === 'Ms.') {
        newFormData.sex = 'Female';
      }
      // For 'Dr.', 'Baby', 'B/Q (Baby/Queen)' - keep current selection or default
    }

    if (name === 'title' && (value === 'Baby' || value === 'B/Q (Baby/Queen)')) {
      // Clear mother's name when title changes away from baby
      if (formData.title !== 'Baby' && formData.title !== 'B/Q (Baby/Queen)') {
        newFormData.motherName = '';
      }
    }

    if (name === 'discountType') {
      // Reset discount values when type changes
      if (value === 'percentage') {
        newFormData.discountAmount = 0;
      } else {
        newFormData.discountPercent = 0;
      }
    }

    if (name === 'paymentMethod') {
      // Update old cash field for backward compatibility
      newFormData.cash = value;
    }

    // Handle age calculations for manual entry
    if (name === 'ageYears' || name === 'ageMonths') {
      const years = name === 'ageYears' ? parseInt(value) || 0 : formData.ageYears;
      const months = name === 'ageMonths' ? parseInt(value) || 0 : formData.ageMonths;
      newFormData.ageInput = formatAge(years, months);
      newFormData.years = years.toString(); // Keep for backward compatibility
      newFormData.months = months.toString(); // Keep for backward compatibility
    }

    setFormData(newFormData);
  };

  // Handle test item changes with dynamic pricing
  const handleTestItemChange = (e) => {
    const { name, value } = e.target;

    // If referral type changes, handle it separately to avoid state conflicts
    if (name === 'referralType') {
      handleReferralTypeChange(value);
      return;
    }

    setNewTestItem(prev => {
      // Ensure prev is not null/undefined
      if (!prev) {
        console.warn('newTestItem is undefined, using default state');
        prev = {
          testName: '',
          test_id: null,
          amount: 0.00,
          referralType: 'Patient',
          referralSource: '',
          pricingScheme: '',
          priceCalculationDetails: null
        };
      }

      const updated = { ...prev, [name]: value };

      // If test name is selected, auto-fill all available fields from Excel data
      if (name === 'testName') {
        const selectedProfile = testProfiles.find(profile => profile.id === value);
        if (selectedProfile) {
          console.log("Selected profile:", selectedProfile);
          updated.test_id = selectedProfile.id;
          updated.selectedTestData = selectedProfile;

          // Calculate dynamic price based on test and referral source with enhanced options
          const pricingOptions = {
            volume: 1, // Default volume
            loyaltyTier: null // Could be set based on patient history
          };

          const priceResult = dynamicPricingService.getTestPrice(
            selectedProfile.id,
            prev.referralSource,
            prev.pricingScheme,
            parseFloat(selectedProfile.test_price) || 0,
            pricingOptions
          );

          updated.amount = priceResult.price;
          updated.priceCalculationDetails = priceResult;

          console.log("Enhanced dynamic pricing result:", priceResult);
        }
      }

      // If referral source or pricing scheme changes, recalculate price
      if ((name === 'referralSource' || name === 'pricingScheme') && prev.test_id) {
        const selectedProfile = testProfiles.find(profile => profile.id === prev.test_id);
        if (selectedProfile) {
          const pricingOptions = {
            volume: 1,
            loyaltyTier: null
          };

          const priceResult = dynamicPricingService.getTestPrice(
            selectedProfile.id,
            name === 'referralSource' ? value : prev.referralSource,
            name === 'pricingScheme' ? value : prev.pricingScheme,
            parseFloat(selectedProfile.test_price) || 0,
            pricingOptions
          );

          updated.amount = priceResult.price;
          updated.priceCalculationDetails = priceResult;

          console.log("Recalculated enhanced price:", priceResult);
        }
      }

      return updated;
    });
  };

  // Add test item
  const addTestItem = () => {
    // Clear any previous errors
    setError(null);

    // Validate test selection
    if (!newTestItem?.testName || !newTestItem?.test_id) {
      setError('Please select a test name');
      return;
    }

    // Allow amount to be 0 or greater (users can enter amounts manually)
    if (newTestItem?.amount === '' || newTestItem?.amount === null || newTestItem?.amount === undefined) {
      setError('Please enter an amount (0 or greater)');
      return;
    }

    const amount = parseFloat(newTestItem?.amount || 0);
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid amount (0 or greater)');
      return;
    }

    // Check if test is already added (check by test_id for accuracy)
    const selectedTestProfile = testProfiles.find(profile => profile.id === newTestItem?.testName);
    const existingTest = formData.testItems.find(item => item.test_id === newTestItem?.test_id);

    if (existingTest) {
      setError('This test has already been added');
      return;
    }

    // Get the selected test profile details
    const selectedProfile = selectedTestProfile;

    // Create comprehensive test item structure matching billing reports API
    const testItemToAdd = {
      // Basic identification
      id: Date.now(),
      test_id: newTestItem?.test_id,
      test_master_id: newTestItem?.test_id,
      testName: selectedProfile ? (selectedProfile.testName || selectedProfile.test_profile) : newTestItem?.testName,
      test_name: selectedProfile ? (selectedProfile.testName || selectedProfile.test_profile) : newTestItem?.testName,

      // Financial data
      amount: parseFloat(newTestItem?.amount) || 0,
      price: parseFloat(newTestItem?.amount) || 0,
      test_price: parseFloat(newTestItem?.amount) || 0,
      quantity: 1,

      // Dynamic pricing information
      referralSource: newTestItem?.referralSource,
      pricingScheme: newTestItem?.pricingScheme,
      priceCalculationDetails: newTestItem?.priceCalculationDetails,

      // Test details from Excel data
      department: selectedProfile?.department || 'General',
      hms_code: selectedProfile?.hmsCode || selectedProfile?.test_code || '',
      display_name: selectedProfile?.testName || selectedProfile?.test_profile || '',
      short_name: selectedProfile?.short_name || '',
      international_code: selectedProfile?.international_code || '',

      // Clinical information
      method: selectedProfile?.method || '',
      primary_specimen: selectedProfile?.specimen || '',
      specimen: selectedProfile?.specimen || '',
      container: selectedProfile?.container || '',
      reference_range: selectedProfile?.referenceRange || selectedProfile?.reference_range || '',
      result_unit: selectedProfile?.resultUnit || selectedProfile?.result_unit || '',
      decimals: selectedProfile?.decimals || 0,
      critical_low: selectedProfile?.criticalLow || selectedProfile?.critical_low,
      critical_high: selectedProfile?.criticalHigh || selectedProfile?.critical_high,

      // Process information
      service_time: selectedProfile?.serviceTime || selectedProfile?.service_time || '',
      reporting_days: selectedProfile?.reportingDays || selectedProfile?.reporting_days || 0,
      cutoff_time: selectedProfile?.cutoffTime || selectedProfile?.cutoff_time || '',
      min_sample_qty: selectedProfile?.minSampleQty || selectedProfile?.min_sample_qty || '',
      test_done_on: selectedProfile?.testDoneOn || selectedProfile?.test_done_on || '',
      applicable_to: selectedProfile?.applicableTo || selectedProfile?.applicable_to || 'Both',

      // Additional information
      instructions: selectedProfile?.instructions || '',
      interpretation: selectedProfile?.interpretation || '',
      unacceptable_conditions: selectedProfile?.unacceptableConditions || selectedProfile?.unacceptable_conditions || '',
      test_suffix: selectedProfile?.test_suffix || '',
      suffix_desc: selectedProfile?.suffix_desc || '',

      // Store complete test master data for comprehensive reporting
      test_master_data: selectedProfile || {}
    };

    setFormData(prev => ({
      ...prev,
      testItems: [...prev.testItems, testItemToAdd]
    }));

    // Reset test item form
    setNewTestItem({
      testName: '',
      test_id: null,
      amount: 0.00,
      referralType: 'Patient',
      referralSource: filteredReferralSources.length > 0 ? filteredReferralSources[0].id : '',
      pricingScheme: '',
      priceCalculationDetails: null
    });
  };

  // Remove test item
  const removeTestItem = (id) => {
    setFormData(prev => ({
      ...prev,
      testItems: prev.testItems.filter(item => item.id !== id)
    }));
  };

  // Calculate totals
  const calculateTotals = () => {
    setFormData(prev => {
      const billAmount = prev.testItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const otherCharges = parseFloat(prev.otherCharges) || 0;
      const discountAmount = (billAmount * parseFloat(prev.discountPercent || 0)) / 100;

      // Calculate subtotal after discount
      const subtotal = billAmount + otherCharges - discountAmount;

      // Calculate GST
      const gstRate = parseFloat(prev.gstRate) || 0;
      const gstAmount = (subtotal * gstRate) / 100;

      // Calculate total amount including GST
      const totalAmount = subtotal ;

      const amountPaid = parseFloat(prev.amountPaid) || 0;
      const balanceToBePaid = totalAmount - amountPaid;

      return {
        ...prev,
        billAmount: billAmount.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        balanceToBePaid: balanceToBePaid.toFixed(2)
      };
    });
  };

  // Recalculate totals when test items, other charges, discount, GST rate, or amount paid changes
  useEffect(() => {
    calculateTotals();
  }, [formData.testItems, formData.otherCharges, formData.discountPercent, formData.gstRate, formData.amountPaid]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setError(null);

    // Validate required fields
    if (!formData.branch) {
      setError('Please select a branch');
      return;
    }

    // Check if patient is selected OR if manual patient data is provided
    const hasSelectedPatient = formData.patient && selectedPatientData;
    const hasManualPatientData = formData.firstName && formData.mobile  && formData.sex;

    if (!hasSelectedPatient && !hasManualPatientData) {
      setError('Please select a patient or enter patient details (First Name, Mobile, Date of Birth, and Gender are required)');
      return;
    }

    // If manual patient data is provided but no patient is selected, validate required fields
    if (!hasSelectedPatient && hasManualPatientData) {
      if (!formData.firstName.trim()) {
        setError('Please enter patient first name');
        return;
      }
      if (!formData.mobile.trim()) {
        setError('Please enter patient mobile number');
        return;
      }
     if (!formData.dob && !formData.ageYears) {
  setError('Please enter either Date of Birth or Age');
  return;
}

      if (!formData.sex) {
        setError('Please select patient gender');
        return;
      }
    }

    if (formData.testItems.length === 0) {
      setError('Please add at least one test');
      return;
    }

    // Validate that all test items have valid data and comprehensive structure
    const invalidTestItems = formData.testItems.filter(item => {
      if (!item.testName || !item.test_id) return true; // Test name and ID are required
      const amount = parseFloat(item.amount);
      if (isNaN(amount) || amount < 0) return true; // Amount must be 0 or greater

      // Ensure comprehensive structure for billing reports compatibility
      if (!item.test_master_data || !item.department) {
        console.warn(`Test item ${item.testName} missing comprehensive data structure`);
      }

      return false; // Item is valid
    });

    if (invalidTestItems.length > 0) {
      setError('All test items must have a valid test name and amount (0 or greater)');
      return;
    }

    // Log test items structure for debugging
    console.log('Submitting test items with comprehensive structure:', formData.testItems);

    try {
      setLoading(true);

      // Prepare billing data with patient information
      const billingData = {
        ...formData,
        // Handle both selected patient and manual patient data
        patient_id: formData.patient || null,
        patient_data: hasSelectedPatient ? null : {
          first_name: formData.firstName,
          last_name: formData.lastName || '',
          gender: formData.sex,
          date_of_birth: formData.dob ? formData.dob :formData.ageYears,
          phone: formData.mobile,
          email: formData.email || '',
          tenant_id: formData.branch
        },
        items: formData.testItems,
        total_amount: parseFloat(formData.totalAmount),
        paid_amount: parseFloat(formData.amountPaid),
        balance: parseFloat(formData.balanceToBePaid),
        bill_amount: parseFloat(formData.billAmount),
        other_charges: parseFloat(formData.otherCharges),
        discount_percent: parseFloat(formData.discountPercent),
        gst_rate: parseFloat(formData.gstRate),
        gst_amount: parseFloat(formData.gstAmount)
      };

      console.log('Submitting billing data:', billingData);

      const response = await billingService.createBilling(billingData);

      if (response.success) {
        setSuccess(true);

        // Enhanced success message with SID information
        const sidNumber = response.data.sid_number || response.data.no || 'N/A';
        console.log(`Billing created successfully with SID: ${sidNumber}`);
                   
        setTimeout(() => {
          // Navigate to billing reports with SID for seamless integration
          if (sidNumber && sidNumber !== 'N/A') {
            navigate(`/billing/reports/${sidNumber}?from=samples`);
          } else {
            navigate(`/billing/${response.data.id}`);
          }
        }, 2000);
      } else {
        setError(response.error || 'Failed to create billing record. Please try again.');
      }

    } catch (err) {
      console.error('Error creating billing:', err);
      setError(err.response?.data?.message || 'Failed to create billing record. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="billing-registration single-screen-layout">
      <div className="main-content">
        {/* Compact Header */}
        <div className="d-flex justify-content-between align-items-center compact-header">
          <div>
            <h1 className="h4 mb-0 text-primary">
              <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
              REGISTRATION / BILLING - ADD
            </h1>
          </div>
          <div>
            <Link to="/billing" className="btn btn-secondary btn-sm me-2">
              <FontAwesomeIcon icon={faArrowLeft} className="me-1" />
              Back
            </Link>
         
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Alert variant="success" className="mb-2 py-2">
            <FontAwesomeIcon icon={faCheck} className="me-1" />
            <small>Billing record created successfully! Redirecting...</small>
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="mb-2 py-2">
            <small>{error}</small>
          </Alert>
        )}

        

        <Form onSubmit={handleSubmit} className="ultra-compact-form">
           <Tabs
      activeKey={activeTab}
        onSelect={(k) => {
    console.log('Selected tab:', k);
    setActiveTab(k);
  }}
     
      className="mb-4"
    >
      <Tab eventKey="patient" title="Patient">
         {/* Left Column - Patient & Test Information */}
            <Col lg={12}>
              {/* Patient Information */}
              <Card className="shadow mb-2 p-4">
                <Card.Header className="bg-primary text-white py-2">
                  <h6 className="mb-0">Patient Information</h6>
                </Card.Header>
                <Card.Body className="py-2">
                  <Row>
                    <Col md={3} className="gy-3">
                      <Form.Group className="mb-2">
                        <Form.Label>Branch</Form.Label>
                        <Form.Select
                          name="branch" 
                          value={formData.branch}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Branch</option>
                          {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>
                              {branch.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3} className="gy-3">
                      <Form.Group className="mb-2">
                        <Form.Label>Date</Form.Label>
                        <Form.Control
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3} className="gy-3">
                      <Form.Group className="mb-2">
                        <Form.Label>SID No.</Form.Label>
                        <Form.Control
                          type="text"
                          name="no"
                          value={formData.no}
                          onChange={handleChange}
                          placeholder="Auto-generated"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3} className="gy-3">
                      <Form.Group className="mb-2">
                        <Form.Label>Category</Form.Label>
                        <Form.Select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                        >
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Enhanced Patient Search Section */}
                  <Row>
                    <Col md={12} className="gy-3">
                      <Form.Group className="mb-2">
                        <Form.Label>Patient Search & Selection</Form.Label>
                        <div className="d-flex gap-1">
                          <InputGroup>
                            <InputGroup.Text>
                              <FontAwesomeIcon icon={faSearch} />
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              placeholder="Search by ID, Name, or Mobile..."
                              value={patientSearchQuery}
                              onChange={(e) => setPatientSearchQuery(e.target.value)}
                            />
                            {searchLoading && (
                              <InputGroup.Text>
                                <div className="spinner-border spinner-border-sm" role="status">
                                  <span className="visually-hidden">Searching...</span>
                                </div>
                              </InputGroup.Text>
                            )}
                          </InputGroup>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => setShowPatientSearch(true)}
                            title="Advanced Search"
                          >
                            <FontAwesomeIcon icon={faUser} />
                          </Button>
                          {/* <Button
                            variant="primary"
                            size="sm"
                            onClick={handlePatientAddOpen}
                            title="Add New Patient"
                          >
                            <FontAwesomeIcon icon={faUserPlus} />
                          </Button> */}
                        </div>

                        {/* Selected Patient Display */}
                        {selectedPatientData && (
                          <div className="mt-1 p-1 border rounded ">
                            <small className="text-muted">Selected:</small>
                            <div className="fw-bold small">
                              {selectedPatientData.first_name} {selectedPatientData.last_name}
                              <span className="text-muted ms-1">
                                (ID: {selectedPatientData.patient_id || selectedPatientData.id})
                              </span>
                              <span className="text-muted ms-1">
                                Mobile: {selectedPatientData.phone}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Quick Search Results */}
                        {(patientSearchResults && patientSearchResults.length > 0) && (
                          <div className="mt-1 border rounded patient-search-results">
                            <div className="p-1 border-bottom ">
                              <small className="text-muted">Found {patientSearchResults.length} patients</small>
                            </div>
                            {patientSearchResults.map((patient) => (
                              <div
                                key={patient.id}
                                className="p-1 border-bottom cursor-pointer"
                                onClick={() => handlePatientSelect(patient)}
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                              >
                                <div className="fw-bold small">
                                  {patient.first_name} {patient.last_name}
                                </div>
                                <small className="text-muted">
                                  ID: {patient.patient_id || patient.id} | Mobile: {patient.phone}
                                </small>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* No Results Fallback for Quick Search */}
                        {patientSearchQuery && patientSearchQuery.trim().length >= 2 &&
                         patientSearchResults && patientSearchResults.length === 0 && !searchLoading && (
                          <div className="mt-1 p-2 border rounded text-center">
                            <div className="text-muted mb-1">
                              <small>No patients found for "{patientSearchQuery}"</small>
                            </div>
                            {/* <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => {
                                // Pre-fill patient add form with search query
                                const searchTerms = patientSearchQuery.trim().split(' ');
                                if (searchTerms.length >= 2) {
                                  setPatientAddData(prev => ({
                                    ...prev,
                                    first_name: searchTerms[0],
                                    last_name: searchTerms.slice(1).join(' ')
                                  }));
                                } else if (searchTerms.length === 1) {
                                  // Check if it's a phone number (all digits)
                                  if (/^\d+$/.test(searchTerms[0])) {
                                    setPatientAddData(prev => ({
                                      ...prev,
                                      phone: searchTerms[0]
                                    }));
                                  } else {
                                    setPatientAddData(prev => ({
                                      ...prev,
                                      first_name: searchTerms[0]
                                    }));
                                  }
                                }
                                handlePatientAddOpen();
                              }}
                            >
                              <FontAwesomeIcon icon={faUserPlus} className="me-1" />
                              Add New
                            </Button> */}
                          </div>
                        )}


                    </Form.Group>
                  </Col>
                </Row>

                  {/* Enhanced Patient Information Section */}
                  <Row>
                    <Col md={2} className="gy-3">
                      <Form.Group className="mb-2">
                        <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          name="title"
                          value={formData.title}
                          onChange={handleChange}
                          required
                        >
                          <option value="Mr.">Mr.</option>
                          <option value="Mrs.">Mrs.</option>
                          <option value="Ms.">Ms.</option>
                          <option value="Dr.">Dr.</option>
                          <option value="Master">Master</option>
                          <option value="Baby">Baby</option>
                          <option value="B/Q (Baby/Queen)">B/Q</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3} className="gy-3">
                      <Form.Group className="mb-2">
                        <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="First name"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3} className="gy-3">
                      <Form.Group className="mb-2">
                        <Form.Label>Last Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Last name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4} className="gy-3">
                      <Form.Group className="mb-2">
                        <Form.Label>Full Name (Auto)</Form.Label>
                        <Form.Control
                          type="text"
                          name="patientName"
                          value={formData.patientName || (selectedPatientData ? `${selectedPatientData.first_name} ${selectedPatientData.last_name}` : `${formData.firstName} ${formData.lastName}`.trim().toUpperCase())}
                          placeholder="Auto-generated"
                          readOnly
                          className=""
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Conditional Mother's Name Field */}
                  {(formData.title === 'Baby' || formData.title === 'B/Q (Baby/Queen)') && (
                    <Row>
                      <Col md={6} className="gy-3">
                        <Form.Group className="mb-2">
                          <Form.Label>Mother's Name <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="motherName"
                            value={formData.motherName}
                            onChange={handleChange}
                            placeholder="Mother's name"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  {/* Enhanced Age Section with Dual Entry */}
                  <Row>
                    <Col md={3} className="gy-3">
                      <Form.Group className="mb-2">
                        <Form.Label>Date of Birth <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="date"
                          name="dob"
                          value={formData.dob}
                          onChange={(e) => {
                            const newDob = e.target.value;
                            const { years, months } = calculateAgeFromDOB(newDob);
                            setFormData(prev => ({
                              ...prev,
                              dob: newDob,
                              ageYears: years,
                              ageMonths: months,
                              ageInput: formatAge(years, months),
                              ageMode: 'dob',
                              years: years.toString(),
                              months: months.toString()
                            }));
                          }}
                          
                        />
                      </Form.Group>
                    </Col>
                    <Col md={2} className="gy-3">
                      <Form.Group className="mb-2">
                        <Form.Label>Age Mode</Form.Label>
                        <Form.Select
                          name="ageMode"
                          value={formData.ageMode}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              ageMode: e.target.value
                            }));
                          }}
                        >
                          <option value="dob">DOB</option>
                          <option value="manual">Manual</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={2} className="gy-3">
                      <Form.Group className="mb-2">
                        <Form.Label>Years</Form.Label>
                        <Form.Control
                          type="number"
                          name="ageYears"
                          value={formData.ageYears}
                          onChange={(e) => {
                            const years = parseInt(e.target.value) || 0;
                            setFormData(prev => ({
                              ...prev,
                              ageYears: years,
                              ageInput: formatAge(years, prev.ageMonths || 0),
                              years: years.toString()
                            }));
                          }}
                          disabled={formData.ageMode === 'dob'}
                          min="0"
                          max="150"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={2} className="gy-3">
                      <Form.Group className="mb-2">
                        <Form.Label>Months</Form.Label>
                        <Form.Control
                          type="number"
                          name="ageMonths"
                          value={formData.ageMonths}
                          onChange={(e) => {
                            const months = parseInt(e.target.value) || 0;
                            setFormData(prev => ({
                              ...prev,
                              ageMonths: months,
                              ageInput: formatAge(prev.ageYears || 0, months),
                              months: months.toString()
                            }));
                          }}
                          disabled={formData.ageMode === 'dob'}
                          min="0"
                          max="11"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3} className="gy-3">
                      <Form.Group className="mb-2">
                        <Form.Label>Formatted Age</Form.Label>
                        <Form.Control
                          type="text"
                          name="ageInput"
                          value={formData.ageInput}
                          placeholder="Auto-calculated"
                          readOnly
                          className=""
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Contact and Additional Information */}
                  <Row>
                    <Col md={3} className="gy-3">
                      <Form.Group className="mb-2">
                        <Form.Label>Gender <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          name="sex"
                          value={formData.sex}
                          onChange={handleChange}
                          required
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3} className="gy-3">
                      <Form.Group className="mb-2">
                        <Form.Label>Mobile <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleChange}
                          placeholder="Mobile number"
                          required
                          pattern="[0-9]{10}"
                          maxLength="10"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3} className="gy-3">
                      <Form.Group className="mb-2">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Email address"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3} className="gy-3">
                      <Form.Group className="mb-2">
                        <Form.Label>Collection Boy</Form.Label>
                        <Form.Control
                          type="text"
                          name="collectionBoy"
                          value={formData.collectionBoy}
                          onChange={handleChange}
                          placeholder="Collection boy"
                        />
                      </Form.Group>
                    </Col>
                  </Row>


              </Card.Body>
            </Card>

            
            </Col>
      </Tab>

       <Tab eventKey="Test" title="Test" >
        <Col lg={12} className='h-screen'>
             <div style={{  overflowY: 'auto', paddingRight: '8px' }}>
               {/* Test Selection */}
              <Card className="shadow mb-2 ">
                <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center py-2">
                  <h6 className="mb-0">Select Test / Profile</h6>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-warning"
                      size="sm"
                      onClick={() => navigate('/admin/technical-master-data')}
                      title="Manage referral sources and pricing"
                    >
                      <FontAwesomeIcon icon={faUsers} className="me-1" />
                      Referral Master
                    </Button>
                    <Button
                      variant="outline-light"
                      size="sm"
                      onClick={() => fetchExcelData(true)}
                      disabled={excelDataLoading}
                      title="Refresh test data"
                    >
                      <FontAwesomeIcon icon={excelDataLoading ? faSpinner : faFlask} spin={excelDataLoading} />
                      {excelDataLoading ? ' Loading...' : ' Refresh'}
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body className="py-2 ">
                  <Row>
                    <Col md={6} style={{ overflowY: 'auto', height: '40vh', paddingRight: '8px' }}>
                      <SearchableDropdown
                        name="testName"
                        label="Test Name"
                        value={(newTestItem && newTestItem.testName) || ''}
                        onChange={handleTestItemChange}
                        options={testProfiles}
                        placeholder={excelDataLoading ? "Loading..." : "Search test..."}
                        getOptionLabel={(option) => option.testName || option.test_profile || option.name || 'Unknown Test'}
                        getOptionValue={(option) => option.id}
                        isRequired={true}
                        isDisabled={excelDataLoading}
                      />
                      {excelDataError && (
                        <div className="text-warning small mt-1">
                          <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                          {excelDataError}
                        </div>
                      )}
                      {testProfiles.length > 0 && (
                        <div className="text-muted small mt-1">
                          <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
                          {testProfiles.length} tests available
                        </div>
                      )}
                    </Col>
                    <Col md={3}>
                      {/* Referral Type Selection */}
                      <Form.Group className="mb-2">
                        <Form.Label>Referral Type</Form.Label>
                        <Form.Select
                          name="referralType"
                          value={(newTestItem && newTestItem.referralType) || 'Patient'}
                          onChange={handleTestItemChange}
                          disabled={loadingReferrals}
                        >
                          {referralTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Select referral type first
                        </Form.Text>
                      </Form.Group>

                      {/* Referral Source Selection - Filtered by Type */}
                      <Form.Group className="mb-2">
                        <Form.Label>Referral Source</Form.Label>
                        <Form.Select
                          name="referralSource"
                          value={(newTestItem && newTestItem.referralSource) || ''}
                          onChange={handleTestItemChange}
                          disabled={loadingReferrals || filteredReferralSources.length === 0}
                        >
                          {loadingReferrals ? (
                            <option>Loading referral sources...</option>
                          ) : filteredReferralSources.length === 0 ? (
                            <option>No {(newTestItem && newTestItem.referralType) || 'Patient'} sources available</option>
                          ) : (
                            filteredReferralSources.map((source) => (
                              <option key={source.id} value={source.id}>
                                {source.name}
                                {source.discountPercentage > 0 && (
                                  ` (${source.discountPercentage}% discount)`
                                )}
                              </option>
                            ))
                          )}
                        </Form.Select>
                        <Form.Text className="text-muted">
                          {(() => {
                            if (loadingReferrals) return 'Loading...';
                            if (filteredReferralSources.length === 0) return `No ${(newTestItem && newTestItem.referralType) || 'Patient'} sources found`;
                            const selectedReferral = filteredReferralSources
                              .find(ref => ref.id === (newTestItem && newTestItem.referralSource));
                            return selectedReferral ? selectedReferral.description : '';
                          })()}
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-2">
                        <Form.Label>Pricing Scheme (Optional)</Form.Label>
                        <Form.Select
                          name="pricingScheme"
                          value={(newTestItem && newTestItem.pricingScheme) || ''}
                          onChange={handleTestItemChange}
                        >
                          <option value="">Auto (Based on Referral)</option>
                          {dynamicPricingService.getAvailableSchemes().map((scheme) => (
                            <option key={scheme.id} value={scheme.id}>
                              {scheme.name} - {scheme.description}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group className="mb-2">
                        <Form.Label>Amount</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>₹</InputGroup.Text>
                          <Form.Control
                            type="number"
                            name="amount"
                            value={(newTestItem && newTestItem.amount) || ''}
                            onChange={handleTestItemChange}
                            step="0.01"
                            min="0"
                          />
                        </InputGroup>
                        {(newTestItem && newTestItem.priceCalculationDetails) && (
                          <div className="text-muted small mt-1">
                            <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
                            {newTestItem.priceCalculationDetails.reason}
                            {newTestItem.priceCalculationDetails.metadata?.savings > 0 && (
                              <div className="text-success">
                                <small>
                                  💰 You save: ₹{newTestItem.priceCalculationDetails.metadata.savings}
                                  {newTestItem.priceCalculationDetails.metadata.totalDiscountPercentage > 0 && (
                                    ` (${newTestItem.priceCalculationDetails.metadata.totalDiscountPercentage?.toFixed(1)}% total discount)`
                                  )}
                                </small>
                              </div>
                            )}
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={1} className="d-flex align-items-end">
                      <Button
                        variant="primary"
                        onClick={addTestItem}
                        disabled={!(newTestItem && newTestItem.testName)}
                        className="mb-2"
                      >
                       Add
                      </Button>
                    </Col>
                  </Row>

                {/* Selected Tests Table */}
                {formData.testItems.length > 0 && (
                  <div className="table-responsive h-100" >
                    <Table striped bordered hover>
                      <thead className="table-dark">
                        <tr>
                          <th>Test ID</th>
                          <th>Test Name</th>
                          <th>Referral Source</th>
                          <th>Pricing</th>
                          <th>Amount</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.testItems.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <span className="badge bg-primary">
                                {item.test_id || 'N/A'}
                              </span>
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
                            <td>
                              <span className="badge bg-info">
                                {item.referralSource || 'self'}
                              </span>
                            </td>
                            <td>
                              {item.priceCalculationDetails && (
                                <div>
                                  <small className="text-muted">
                                    {item.priceCalculationDetails.source === 'scheme_referral' && (
                                      <span className="badge bg-success">Dynamic</span>
                                    )}
                                    {item.priceCalculationDetails.source === 'fallback' && (
                                      <span className="badge bg-warning">Fallback</span>
                                    )}
                                    {item.priceCalculationDetails.source === 'test_default' && (
                                      <span className="badge bg-secondary">Default</span>
                                    )}
                                  </small>
                                </div>
                              )}
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
                          <th colSpan="2">Total Test(s): {formData.testItems.length}</th>
                          <th>Total Amount: ₹{formData.billAmount}</th>
                          <th></th>
                        </tr>
                      </tfoot>
                    </Table>
                  </div>
                )}
                </Card.Body>
              </Card>
              </div>
            </Col>

      </Tab>

      
 <Tab eventKey="Additional Options" title="Additional Options">
   <Card.Header className="bg-secondary text-white py-2">
                  <h6 className="mb-0">Additional Options</h6>
                </Card.Header>
        <div className="py-2 p-4">
                  
                  <Row>
                  
                      <Form.Group className="mb-2">
                        <Form.Label>Remarks</Form.Label>
                        <Form.Select
                          name="remarks"
                          value={formData.remarks}
                          onChange={handleChange}
                        >
                          <option value="">Select Remarks</option>
                          <option value="Emergency">Emergency</option>
                          <option value="Routine">Routine</option>
                          <option value="Urgent">Urgent</option>
                        </Form.Select>
                      </Form.Group>
                 
                   
                      <Form.Group className="mb-2">
                        <Form.Label>Delivery Mode</Form.Label>
                        <Form.Select
                          name="deliveryMode"
                          value={formData.deliveryMode}
                          onChange={handleChange}
                        >
                          <option value="">Select Mode</option>
                          <option value="Email">Email</option>
                          <option value="SMS">SMS</option>
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="Print">Print</option>
                        </Form.Select>
                      </Form.Group>
                   
                  </Row>

                  {/* NEW FIELD: Clinical Remarks */}
                  <Form.Group className="mb-2">
                    <Form.Label>Clinical Remarks</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="clinicalRemarks"
                      value={formData.clinicalRemarks}
                      onChange={handleChange}
                      placeholder="Clinical remarks, symptoms..."
                    />
                  </Form.Group>

                  {/* NEW FIELD: Final Report Date */}
                  <Form.Group className="mb-2">
                    <Form.Label>Final Report Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="finalReportDate"
                      value={formData.finalReportDate}
                      onChange={handleChange}
                    />
                  </Form.Group>

                  {/* Emergency and Special Options */}
                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-2">
                        <Form.Label>Study No</Form.Label>
                        <Form.Control
                          type="text"
                          name="studyNo"
                          value={formData.studyNo}
                          onChange={handleChange}
                          placeholder="Study No"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-2">
                        <Form.Label>Sub Period</Form.Label>
                        <Form.Control
                          type="text"
                          name="subPeriod"
                          value={formData.subPeriod}
                          onChange={handleChange}
                          placeholder="Sub Period"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-2">
                        <Form.Label>Sub No</Form.Label>
                        <Form.Control
                          type="text"
                          name="subNo"
                          value={formData.subNo}
                          onChange={handleChange}
                          placeholder="Sub No"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <div className="d-flex flex-column mt-3">
                        <Form.Check
                          type="checkbox"
                          name="emergency"
                          label="Emergency"
                          checked={formData.emergency}
                          onChange={handleChange}
                          className="mb-1"
                        />
                        <Form.Check
                          type="checkbox"
                          name="printBill"
                          label="Print Bill"
                          checked={formData.printBill}
                          onChange={handleChange}
                        />
                      </div>
                    </Col>
                  </Row>
                </div>
      </Tab>

      <Tab eventKey="Billing" title="Billing">
        <Col lg={12}>
              {/* Billing Details */}
              <Card className="shadow mb-2 p-2">
              
                <Card.Body className="py-2 d-flex flex-column">
                  <div className=" d-flex gap-5 w-100">

                    <div className='w-50'>
                      <Card.Header className="bg-success text-white py-2">
                  <h6 className="mb-0">Billing Details</h6>
                </Card.Header>
                    <div className="d-flex justify-content-between mb-1">
                      <small>Bill Amount:</small>
                      <small className="fw-bold">₹{formData.billAmount}</small>
                    </div>

                    <Form.Group className="mb-2">
                      <Form.Label>Other Charges</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>₹</InputGroup.Text>
                        <Form.Control
                          type="number"
                          name="otherCharges"
                          value={formData.otherCharges}
                          onChange={handleChange}
                          step="0.01"
                          min="0"
                        />
                      </InputGroup>
                    </Form.Group>

                    {/* NEW FIELD: Other Charges Description */}
                    {formData.otherCharges > 0 && (
                      <Form.Group className="mb-2">
                        <Form.Label>Other Charges Description</Form.Label>
                        <Form.Control
                          type="text"
                          name="otherChargesDescription"
                          value={formData.otherChargesDescription}
                          onChange={handleChange}
                          placeholder="Describe charges"
                        />
                      </Form.Group>
                    )}

                    {/* Enhanced Discount Section */}
                    <Form.Group className="mb-2">
                      <Form.Label>Discount Type</Form.Label>
                      <Form.Select
                        name="discountType"
                        value={formData.discountType}
                        onChange={handleChange}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="amount">Fixed Amount (₹)</option>
                      </Form.Select>
                    </Form.Group>

                    {formData.discountType === 'percentage' ? (
                      <Form.Group className="mb-2">
                        <Form.Label>Discount %</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type="number"
                            name="discountPercent"
                            value={formData.discountPercent}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            max="100"
                          />
                          <InputGroup.Text>%</InputGroup.Text>
                        </InputGroup>
                      </Form.Group>
                    ) : (
                      <Form.Group className="mb-2">
                        <Form.Label>Discount Amount</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>₹</InputGroup.Text>
                          <Form.Control
                            type="number"
                            name="discountAmount"
                            value={formData.discountAmount}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                          />
                        </InputGroup>
                      </Form.Group>
                    )}

                    {/* NEW FIELD: Discount Remarks */}
                    {(formData.discountPercent > 0 || formData.discountAmount > 0) && (
                      <Form.Group className="mb-2">
                        <Form.Label>Discount Remarks <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          name="discountRemarks"
                          value={formData.discountRemarks}
                          onChange={handleChange}
                          placeholder="Mandatory remarks"
                          required
                        />
                      </Form.Group>
                    )}

                    <Form.Group className="mb-2">
                      <Form.Label>Amount Paid</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>₹</InputGroup.Text>
                        <Form.Control
                          type="number"
                          name="amountPaid"
                          value={formData.amountPaid}
                          onChange={handleChange}
                          step="0.01"
                          min="0"
                        />
                      </InputGroup>
                    </Form.Group>

                    <div className="d-flex justify-content-between mb-2 border-top pt-1">
                      <small className="fw-bold">Balance:</small>
                      <small className="fw-bold text-danger">₹{formData.balanceToBePaid}</small>
                    </div>

</div>
              
                 <div className='w-50'>
                   <Card.Header className="bg-warning text-dark py-2">
                  <h6 className="mb-0">Payment Details</h6>
                </Card.Header>
                  {/* Enhanced Payment Method */}
                  <Form.Group className="mb-2">
                    <Form.Label>Payment Method <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Mode</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Credit">Credit</option>
                    </Form.Select>
                  </Form.Group>

                  {/* Keep old field for backward compatibility */}
                  <input type="hidden" name="cash" value={formData.paymentMethod} />

                  {/* NEW FIELD: Payment Date */}
                  <Form.Group className="mb-2">
                    <Form.Label>Payment Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="paymentDate"
                      value={formData.paymentDate}
                      onChange={handleChange}
                    />
                  </Form.Group>

                  {/* NEW FIELD: Payment Amount */}
                  <Form.Group className="mb-2">
                    <Form.Label>Payment Amount</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>₹</InputGroup.Text>
                      <Form.Control
                        type="number"
                        name="paymentAmount"
                        value={formData.paymentAmount}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        placeholder="Payment amount"
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>Bank Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      placeholder="Bank name"
                    />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>Reference Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="referenceNumber"
                      value={formData.referenceNumber}
                      onChange={handleChange}
                      placeholder="Reference"
                    />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>Amount</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>₹</InputGroup.Text>
                      <Form.Control
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                      />
                    </InputGroup>
                  </Form.Group>
                </div>
  </div>

                
               
              </Card.Body>
            </Card>

              <Row>
            <Col lg={12}>
              <div className="d-flex justify-content-end gap-1 mt-2">
                <Button variant="secondary"  onClick={() => navigate('/billing')}>
                  <FontAwesomeIcon icon={faArrowLeft} className="me-1" />
                  Cancel
                </Button>
                {/* <Button variant="info" size="sm" type="button">
                  <FontAwesomeIcon icon={faPrint} className="me-1" />
                  Print
                </Button> */}
                {/* <Button variant="warning" size="sm" type="button">
                  <FontAwesomeIcon icon={faEdit} className="me-1" />
                  Edit
                </Button> */}
                <Button variant="success"  type="submit" disabled={loading}>
                  <FontAwesomeIcon icon={faSave} className="me-1" />
                  {loading ? 'Saving...' : 'Save & Continue'}
                </Button>
              </div>
            </Col>
          </Row>
            </Col>
      </Tab>

     
    </Tabs>
         
          {/* Action Buttons */}
         
        </Form>

      {/* Advanced Patient Search Modal */}
      <Modal show={showPatientSearch} onHide={() => setShowPatientSearch(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faSearch} className="me-2" />
            Advanced Patient Search
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Search Patients</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Enter Patient ID, Name, or Mobile Number..."
                value={patientSearchQuery}
                onChange={(e) => setPatientSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePatientSearch()}
              />
              <Button
                variant="primary"
                onClick={handlePatientSearch}
                disabled={searchLoading}
              >
                <FontAwesomeIcon icon={faSearch} className="me-1" />
                {searchLoading ? 'Searching...' : 'Search'}
              </Button>
            </InputGroup>
          </Form.Group>

          {/* Search Results */}
          {patientSearchResults.length > 0 && (
            <div>
              <h6>Search Results ({patientSearchResults.length} found)</h6>
              <ListGroup style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {patientSearchResults.map((patient) => (
                  <ListGroup.Item
                    key={patient.id}
                    action
                    onClick={() => handlePatientSelect(patient)}
                    className="d-flex justify-content-between align-items-start"
                  >
                    <div>
                      <div className="fw-bold">
                        {patient.first_name} {patient.last_name}
                      </div>
                      <div className="text-muted">
                        <small>
                          Patient ID: {patient.patient_id || patient.id} |
                          Mobile: {patient.phone} |
                          DOB: {patient.date_of_birth || 'N/A'}
                        </small>
                      </div>
                      {patient.email && (
                        <div className="text-muted">
                          <small>Email: {patient.email}</small>
                        </div>
                      )}
                    </div>
                    <Button variant="outline-primary" size="sm">
                      Select
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}

          {patientSearchQuery && patientSearchResults.length === 0 && !searchLoading && (
            <Alert variant="info" className="d-flex justify-content-between align-items-center">
              <span>No patients found matching your search criteria.</span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  // Pre-fill patient add form with search query if it looks like a name
                  const searchTerms = patientSearchQuery.trim().split(' ');
                  if (searchTerms.length >= 2) {
                    setPatientAddData(prev => ({
                      ...prev,
                      first_name: searchTerms[0],
                      last_name: searchTerms.slice(1).join(' ')
                    }));
                  } else if (searchTerms.length === 1) {
                    // If single term, put it in first name
                    setPatientAddData(prev => ({
                      ...prev,
                      first_name: searchTerms[0]
                    }));
                  }
                  setShowPatientSearch(false);
                  handlePatientAddOpen();
                }}
              >
                <FontAwesomeIcon icon={faUserPlus} className="me-1" />
                Add New Patient
              </Button>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPatientSearch(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Patient Add Modal */}
      <Modal show={showPatientAdd} onHide={() => setShowPatientAdd(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faUserPlus} className="me-2" />
            Add New Patient
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          <Form id="patientAddForm" noValidate validated={patientAddValidated} onSubmit={handlePatientAddSubmit}>
            {/* Site Code Selection for Admin/Hub Admin */}
            {(currentUser?.role === 'admin' || currentUser?.role === 'hub_admin') && (
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Group controlId="tenant_id">
                    <Form.Label>Franchise/Site Code <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="tenant_id"
                      value={patientAddData.tenant_id || ''}
                      onChange={handlePatientAddChange}
                      required
                    >
                      <option value="">Select Franchise</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name} ({branch.site_code})
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      Please select a franchise.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="first_name">
                  <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={patientAddData.first_name}
                    onChange={handlePatientAddChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter first name.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="last_name">
                  <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={patientAddData.last_name}
                    onChange={handlePatientAddChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter last name.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="gender">
                  <Form.Label>Gender <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="gender"
                    value={patientAddData.gender}
                    onChange={handlePatientAddChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    Please select gender.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="date_of_birth">
                  <Form.Label>Date of Birth <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="date_of_birth"
                    value={patientAddData.date_of_birth}
                    onChange={handlePatientAddChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter date of birth.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="phone">
                  <Form.Label>Phone <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={patientAddData.phone}
                    onChange={handlePatientAddChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter phone number.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={patientAddData.email}
                    onChange={handlePatientAddChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="address">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={patientAddData.address}
                onChange={handlePatientAddChange}
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="city">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={patientAddData.city}
                    onChange={handlePatientAddChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="state">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    name="state"
                    value={patientAddData.state}
                    onChange={handlePatientAddChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="postal_code">
                  <Form.Label>Postal Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="postal_code"
                    value={patientAddData.postal_code}
                    onChange={handlePatientAddChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mt-4 mb-3 font-weight-bold">Additional Information</h6>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="emergency_contact">
                  <Form.Label>Emergency Contact</Form.Label>
                  <Form.Control
                    type="text"
                    name="emergency_contact"
                    value={patientAddData.emergency_contact}
                    onChange={handlePatientAddChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="emergency_phone">
                  <Form.Label>Emergency Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="emergency_phone"
                    value={patientAddData.emergency_phone}
                    onChange={handlePatientAddChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="blood_group">
                  <Form.Label>Blood Group</Form.Label>
                  <Form.Select
                    name="blood_group"
                    value={patientAddData.blood_group}
                    onChange={handlePatientAddChange}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="insurance_provider">
                  <Form.Label>Insurance Provider</Form.Label>
                  <Form.Control
                    type="text"
                    name="insurance_provider"
                    value={patientAddData.insurance_provider}
                    onChange={handlePatientAddChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="insurance_id">
                  <Form.Label>Insurance ID</Form.Label>
                  <Form.Control
                    type="text"
                    name="insurance_id"
                    value={patientAddData.insurance_id}
                    onChange={handlePatientAddChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPatientAdd(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="patientAddForm"
            disabled={patientAddLoading}
          >
            <FontAwesomeIcon icon={faSave} className="me-2" />
            {patientAddLoading ? 'Saving...' : 'Save Patient'}
          </Button>
        </Modal.Footer>
      </Modal>
      </div>
    </div>
  );
};

export default BillingRegistration;
