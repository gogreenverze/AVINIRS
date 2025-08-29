import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Table, InputGroup, Alert, Modal, ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faSave, faPlus, faTrash, faSearch, faUser, faPhone,
  faExclamationTriangle, faCheckCircle, faTimes, faIdCard, faEnvelope,
  faCalendarAlt, faCreditCard, faFlask, faCalculator, faSpinner,
  faFileInvoiceDollar, faPrint, faEdit, faCheck, faUserPlus,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { patientAPI, adminAPI } from '../../services/api';
import billingService from '../../services/billingAPI';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import '../../styles/BillingRegistration.css';

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
  getOptionLabel = (option) => option.label || option.name || option.description || option.test_profile || option,
  getOptionValue = (option) => option.value || option.id || option,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];

  const filteredOptions = safeOptions.filter(option => {
    if (!option) return false;
    const label = getOptionLabel(option);
    return label && typeof label === 'string' &&
           label.toLowerCase().includes(searchTerm.toLowerCase());
  });

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

  // Test item form
  const [newTestItem, setNewTestItem] = useState({
    testName: '',
    test_id: null,
    amount: 0.00
  });

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

      const response = await patientAPI.createPatient(patientDataToSubmit);

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

    } catch (err) {
      console.error('Error creating patient:', err);
      setError(err.response?.data?.message || 'Failed to create patient. Please try again.');
    } finally {
      setPatientAddLoading(false);
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
      const targetTenantId = branchId || currentTenantContext?.id || tenantData?.id;

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
        return data.sid_number;
      } else {
        throw new Error('Failed to generate SID');
      }
    } catch (err) {
      console.error('Error generating SID:', err);
      // Proper error handling - no fallback SID generation
      const selectedBranch = branches.find(b => b.id.toString() === (branchId || formData.branch));
      const siteCode = selectedBranch?.site_code || currentTenantContext?.site_code || tenantData?.site_code;

      if (!siteCode) {
        throw new Error('Unable to determine franchise site code for SID generation. Please contact system administrator.');
      }

      throw new Error(`Failed to generate SID for franchise ${siteCode}. Please try again or contact system administrator.`);
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

        // Set sample test profiles with proper structure
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

        // Sample patients are now handled through search functionality

        // Try to fetch test master data from billing API
        try {
          const testMasterResponse = await fetch('/api/billing/test-master', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });

          if (testMasterResponse.ok) {
            const testMasterData = await testMasterResponse.json();
            if (testMasterData.success && testMasterData.data) {
              const testProfilesFromAPI = testMasterData.data.map(test => ({
                id: test.id,
                testName: test.testName,
                test_profile: test.testName || test.displayName,
                test_price: test.testPrice || 0,
                department: test.department || 'General',
                hmsCode: test.hmsCode || '',
                specimen: test.specimen || '',
                container: test.container || '',
                serviceTime: test.serviceTime || '',
                reportingDays: test.reportingDays || '',
                cutoffTime: test.cutoffTime || '',
                ...test
              }));
              setTestProfiles(testProfilesFromAPI);
              console.log(`Loaded ${testProfilesFromAPI.length} tests from test_master API`);
            }
          } else {
            console.error('Failed to fetch test master data from billing API');
            setError('Unable to load test profiles. Please contact system administrator.');
            return;
          }
        } catch (apiErr) {
          console.error('Error fetching test master data:', apiErr);
          setError('Unable to load test profiles. Please contact system administrator.');
          return;
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

  // Generate SID number when component loads or branch changes
  useEffect(() => {
    const initializeSID = async () => {
      if (formData.branch) {
        // Clear existing SID when branch changes and generate new one
        const sidNumber = await generateSIDNumber(formData.branch);
        setFormData(prev => ({
          ...prev,
          no: sidNumber
        }));
      } else {
        // Clear SID if no branch is selected
        setFormData(prev => ({
          ...prev,
          no: ''
        }));
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

  // Handle test item changes
  const handleTestItemChange = (e) => {
    const { name, value } = e.target;
    setNewTestItem(prev => {
      const updated = { ...prev, [name]: value };

      // If test name is selected, auto-fill amount and test_id
      if (name === 'testName') {
        const selectedProfile = testProfiles.find(profile => profile.id === value);
        if (selectedProfile) {
          updated.amount = parseFloat(selectedProfile.test_price) || 0;
          updated.test_id = selectedProfile.id;
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
    if (!newTestItem.testName || !newTestItem.test_id) {
      setError('Please select a test name');
      return;
    }

    // Allow amount to be 0 or greater (users can enter amounts manually)
    if (newTestItem.amount === '' || newTestItem.amount === null || newTestItem.amount === undefined) {
      setError('Please enter an amount (0 or greater)');
      return;
    }

    const amount = parseFloat(newTestItem.amount);
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid amount (0 or greater)');
      return;
    }

    // Check if test is already added (check by test_id for accuracy)
    const selectedTestProfile = testProfiles.find(profile => profile.id === newTestItem.testName);
    const existingTest = formData.testItems.find(item => item.test_id === newTestItem.test_id);

    if (existingTest) {
      setError('This test has already been added');
      return;
    }

    // Get the selected test profile details
    const selectedProfile = selectedTestProfile;
    const testItemToAdd = {
      ...newTestItem,
      id: Date.now(),
      test_id: newTestItem.test_id,
      testName: selectedProfile ? (selectedProfile.testName || selectedProfile.test_profile) : newTestItem.testName,
      test_name: selectedProfile ? (selectedProfile.testName || selectedProfile.test_profile) : newTestItem.testName, // For backend compatibility
      department: selectedProfile ? selectedProfile.department : 'General',
      hmsCode: selectedProfile ? selectedProfile.hmsCode : '',
      amount: parseFloat(newTestItem.amount) || 0
    };

    setFormData(prev => ({
      ...prev,
      testItems: [...prev.testItems, testItemToAdd]
    }));

    // Reset test item form
    setNewTestItem({
      testName: '',
      test_id: null,
      amount: 0.00
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
      const totalAmount = subtotal + gstAmount;

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

    if (!formData.patient) {
      setError('Please select a patient');
      return;
    }

    if (formData.testItems.length === 0) {
      setError('Please add at least one test');
      return;
    }

    // Validate that all test items have valid data
    const invalidTestItems = formData.testItems.filter(item => {
      if (!item.testName || !item.test_id) return true; // Test name and ID are required
      const amount = parseFloat(item.amount);
      return isNaN(amount) || amount < 0; // Amount must be 0 or greater
    });
    if (invalidTestItems.length > 0) {
      setError('All test items must have a valid test name and amount (0 or greater)');
      return;
    }

    try {
      setLoading(true);

      const billingData = {
        ...formData,
        patient_id: formData.patient, // Map patient to patient_id
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

      const response = await billingService.createBilling(billingData);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/billing/${response.data.id}`);
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
    <div className="billing-registration">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-primary">
            <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
            REGISTRATION / BILLING - ADD
          </h1>
        </div>
        <div>
          <Link to="/billing" className="btn btn-secondary me-2">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Dashboard
          </Link>
          <Button variant="success" onClick={handleSubmit} disabled={loading}>
            <FontAwesomeIcon icon={faSave} className="me-2" />
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert variant="success" className="mb-4">
          <FontAwesomeIcon icon={faCheck} className="me-2" />
          Billing record created successfully! Redirecting...
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row>
          {/* Left Column */}
          <Col lg={8}>
            {/* Patient Information */}
            <Card className="shadow mb-4">
              <Card.Header className="bg-primary text-white">
                <h6 className="mb-0">Patient Information</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
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
                  <Col md={3}>
                    <Form.Group className="mb-3">
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
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>SID No.</Form.Label>
                      <Form.Control
                        type="text"
                        name="no"
                        value={formData.no}
                        onChange={handleChange}
                        placeholder="Auto-generated (e.g., MYD001)"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
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
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Patient Search & Selection</Form.Label>
                      <div className="d-flex gap-2">
                        <InputGroup>
                          <InputGroup.Text>
                            <FontAwesomeIcon icon={faSearch} />
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="Type to search patients by ID, Name, or Mobile Number..."
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
                          onClick={() => setShowPatientSearch(true)}
                          title="Advanced Patient Search"
                        >
                          <FontAwesomeIcon icon={faUser} />
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handlePatientAddOpen}
                          title="Add New Patient"
                        >
                          <FontAwesomeIcon icon={faUserPlus} />
                        </Button>
                      </div>

                      {/* Selected Patient Display */}
                      {selectedPatientData && (
                        <div className="mt-2 p-2 border rounded">
                          <small className="text-muted">Selected Patient:</small>
                          <div className="fw-bold">
                            {selectedPatientData.first_name} {selectedPatientData.last_name}
                            <span className="text-muted ms-2">
                              (ID: {selectedPatientData.patient_id || selectedPatientData.id})
                            </span>
                            <span className="text-muted ms-2">
                              Mobile: {selectedPatientData.phone}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Quick Search Results */}
                      {(patientSearchResults && patientSearchResults.length > 0) && (
                        <div className="mt-2 border rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          <div className="p-2  border-bottom">
                            <small className="text-muted">Found {patientSearchResults.length} patients</small>
                          </div>
                          {patientSearchResults.map((patient) => (
                            <div
                              key={patient.id}
                              className="p-2 border-bottom cursor-pointer hover-bg-light"
                              onClick={() => handlePatientSelect(patient)}
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                              <div className="fw-bold">
                                {patient.first_name} {patient.last_name}
                              </div>
                              <small className="text-muted">
                                ID: {patient.patient_id || patient.id} | Mobile: {patient.phone} | Tenant: {patient.tenant_id}
                              </small>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No Results Fallback for Quick Search */}
                      {patientSearchQuery && patientSearchQuery.trim().length >= 2 &&
                       patientSearchResults && patientSearchResults.length === 0 && !searchLoading && (
                        <div className="mt-2 p-3 border rounded bg-light text-center">
                          <div className="text-muted mb-2">
                            <small>No patients found for "{patientSearchQuery}"</small>
                          </div>
                          <Button
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
                            Add New Patient
                          </Button>
                        </div>
                      )}


                    </Form.Group>
                  </Col>
                </Row>

                {/* Enhanced Patient Information Section */}
                <Row>
                  <Col md={2}>
                    <Form.Group className="mb-3">
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
                        <option value="B/Q (Baby/Queen)">B/Q (Baby/Queen)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Enter first name"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Enter last name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name (Auto-generated)</Form.Label>
                      <Form.Control
                        type="text"
                        name="patientName"
                        value={formData.patientName || (selectedPatientData ? `${selectedPatientData.first_name} ${selectedPatientData.last_name}` : `${formData.firstName} ${formData.lastName}`.trim().toUpperCase())}
                        placeholder="Full name will appear here"
                        readOnly
                        className="bg-light"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Conditional Mother's Name Field */}
                {(formData.title === 'Baby' || formData.title === 'B/Q (Baby/Queen)') && (
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Mother's Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          name="motherName"
                          value={formData.motherName}
                          onChange={handleChange}
                          placeholder="Enter mother's name"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                )}

                {/* Enhanced Age Section with Dual Entry */}
                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
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
                            years: years.toString(), // Keep for backward compatibility
                            months: months.toString() // Keep for backward compatibility
                          }));
                        }}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
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
                        <option value="dob">From DOB</option>
                        <option value="manual">Manual Entry</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>Age (Years)</Form.Label>
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
                            years: years.toString() // Keep for backward compatibility
                          }));
                        }}
                        disabled={formData.ageMode === 'dob'}
                        min="0"
                        max="150"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>Age (Months)</Form.Label>
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
                            months: months.toString() // Keep for backward compatibility
                          }));
                        }}
                        disabled={formData.ageMode === 'dob'}
                        min="0"
                        max="11"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Formatted Age</Form.Label>
                      <Form.Control
                        type="text"
                        name="ageInput"
                        value={formData.ageInput}
                        placeholder="Age will be calculated"
                        readOnly
                        className="bg-light"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Contact and Additional Information */}
                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
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
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mobile Number <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="Enter mobile number"
                        required
                        pattern="[0-9]{10}"
                        maxLength="10"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
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
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Collection Boy</Form.Label>
                      <Form.Control
                        type="text"
                        name="collectionBoy"
                        value={formData.collectionBoy}
                        onChange={handleChange}
                        placeholder="Enter collection boy name"
                      />
                    </Form.Group>
                  </Col>
                </Row>


              </Card.Body>
            </Card>

            {/* Test Selection */}
            <Card className="shadow mb-4">
              <Card.Header className="bg-info text-white">
                <h6 className="mb-0">Select Test / Profile</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={8}>
                    <SearchableDropdown
                      name="testName"
                      label="Test Name"
                      value={newTestItem.testName}
                      onChange={handleTestItemChange}
                      options={testProfiles}
                      placeholder="Search and select test name..."
                      getOptionLabel={(option) => option.testName || option.test_profile || option.name || 'Unknown Test'}
                      getOptionValue={(option) => option.id}
                      isRequired={true}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Amount</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>₹</InputGroup.Text>
                        <Form.Control
                          type="number"
                          name="amount"
                          value={newTestItem.amount}
                          onChange={handleTestItemChange}
                          step="0.01"
                          min="0"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end mb-3">
                  <Button
                    variant="primary"
                    onClick={addTestItem}
                    disabled={!newTestItem.testName}
                  >
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Add Test
                  </Button>
                </div>

                {/* Selected Tests Table */}
                {formData.testItems.length > 0 && (
                  <div className="table-responsive">
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
          </Col>

          {/* Right Column - Billing Details */}
          <Col lg={4}>
            {/* Billing Details */}
            <Card className="shadow mb-4">
              <Card.Header className="bg-success text-white">
                <h6 className="mb-0">Billing Details</h6>
              </Card.Header>
              <Card.Body>
                <div className="billing-summary">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Bill Amount:</span>
                    <span className="fw-bold">₹{formData.billAmount}</span>
                  </div>

                  <Form.Group className="mb-3">
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
                    <Form.Group className="mb-3">
                      <Form.Label>Other Charges Description</Form.Label>
                      <Form.Control
                        type="text"
                        name="otherChargesDescription"
                        value={formData.otherChargesDescription}
                        onChange={handleChange}
                        placeholder="Describe other charges"
                      />
                    </Form.Group>
                  )}

                  {/* Enhanced Discount Section */}
                  <Form.Group className="mb-3">
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
                    <Form.Group className="mb-3">
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
                    <Form.Group className="mb-3">
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
                    <Form.Group className="mb-3">
                      <Form.Label>Discount Remarks <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="discountRemarks"
                        value={formData.discountRemarks}
                        onChange={handleChange}
                        placeholder="Mandatory remarks for discount"
                        required
                      />
                    </Form.Group>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Label>GST Rate %</Form.Label>
                    <InputGroup>
                      <Form.Select
                        name="gstRate"
                        value={formData.gstRate}
                        onChange={handleChange}
                      >
                        <option value="0">0% (Exempt)</option>
                        <option value="5">5% (Reduced Rate)</option>
                        <option value="12">12% (Standard Rate)</option>
                        <option value="18">18% (Standard Rate)</option>
                        <option value="28">28% (Higher Rate)</option>
                        {gstConfigs.map(config => (
                          <option key={config.id} value={config.rate}>
                            {config.rate}% ({config.name})
                          </option>
                        ))}
                      </Form.Select>
                      <InputGroup.Text>%</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>

                  <div className="d-flex justify-content-between mb-2">
                    <span>GST Amount:</span>
                    <span className="fw-bold text-info">₹{formData.gstAmount}</span>
                  </div>

                  <div className="d-flex justify-content-between mb-2 border-top pt-2">
                    <span className="fw-bold">Total Amount (Inc. GST):</span>
                    <span className="fw-bold text-primary">₹{formData.totalAmount}</span>
                  </div>

                  <Form.Group className="mb-3">
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

                  <div className="d-flex justify-content-between mb-3 border-top pt-2">
                    <span className="fw-bold">Balance to be paid:</span>
                    <span className="fw-bold text-danger">₹{formData.balanceToBePaid}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Payment Details */}
            <Card className="shadow mb-4">
              <Card.Header className="bg-warning text-dark">
                <h6 className="mb-0">Payment Details</h6>
              </Card.Header>
              <Card.Body>
                {/* Enhanced Payment Method */}
                <Form.Group className="mb-3">
                  <Form.Label>Payment Method <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Payment Mode</option>
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
                <Form.Group className="mb-3">
                  <Form.Label>Payment Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleChange}
                  />
                </Form.Group>

                {/* NEW FIELD: Payment Amount */}
                <Form.Group className="mb-3">
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
                      placeholder="Enter payment amount"
                    />
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Bank Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="Bank name"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Reference Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={handleChange}
                    placeholder="DD/MM/YYYY"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
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
              </Card.Body>
            </Card>

            {/* Additional Options */}
            <Card className="shadow mb-4">
              <Card.Header className="bg-secondary text-white">
                <h6 className="mb-0">Additional Options</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
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

                <Form.Group className="mb-3">
                  <Form.Label>Delivery Mode</Form.Label>
                  <Form.Select
                    name="deliveryMode"
                    value={formData.deliveryMode}
                    onChange={handleChange}
                  >
                    <option value="">Select Delivery Mode</option>
                    <option value="Email">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Print">Print</option>
                  </Form.Select>
                </Form.Group>

                {/* NEW FIELD: Clinical Remarks */}
                <Form.Group className="mb-3">
                  <Form.Label>Clinical Remarks</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="clinicalRemarks"
                    value={formData.clinicalRemarks}
                    onChange={handleChange}
                    placeholder="Enter clinical remarks, symptoms, or relevant medical information"
                  />
                </Form.Group>

                {/* NEW FIELD: General Remarks */}
                <Form.Group className="mb-3">
                  <Form.Label>General Remarks</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="generalRemarks"
                    value={formData.generalRemarks}
                    onChange={handleChange}
                    placeholder="Enter general remarks or notes"
                  />
                </Form.Group>

                {/* NEW FIELD: Final Report Date */}
                <Form.Group className="mb-3">
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
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        name="emergency"
                        label="Emergency Case"
                        checked={formData.emergency}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        name="urgent"
                        label="Urgent Processing"
                        checked={formData.urgent}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
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
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Sub Period</Form.Label>
                      <Form.Control
                        type="text"
                        name="subPeriod"
                        value={formData.subPeriod}
                        onChange={handleChange}
                        placeholder="Subject Period"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Sub No</Form.Label>
                      <Form.Control
                        type="text"
                        name="subNo"
                        value={formData.subNo}
                        onChange={handleChange}
                        placeholder="Subject No"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex align-items-center mt-4">
                      <Form.Check
                        type="checkbox"
                        name="emergency"
                        label="Emergency"
                        checked={formData.emergency}
                        onChange={handleChange}
                        className="me-3"
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
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Clinical Remarks */}
        <Row>
          <Col lg={12}>
            <Card className="shadow mb-4">
              <Card.Header className="bg-info text-white">
                <h6 className="mb-0">Clinical Remarks</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="clinicalRemarks"
                    value={formData.clinicalRemarks}
                    onChange={handleChange}
                    placeholder="Enter clinical remarks..."
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Action Buttons */}
        <Row>
          <Col lg={12}>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => navigate('/billing')}>
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                Cancel
              </Button>
              <Button variant="info" type="button">
                <FontAwesomeIcon icon={faPrint} className="me-2" />
                Print
              </Button>
              <Button variant="warning" type="button">
                <FontAwesomeIcon icon={faEdit} className="me-2" />
                Edit
              </Button>
              <Button variant="success" type="submit" disabled={loading}>
                <FontAwesomeIcon icon={faSave} className="me-2" />
                {loading ? 'Saving...' : 'Save & Continue'}
              </Button>
            </div>
          </Col>
        </Row>
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
                onKeyPress={(e) => e.key === 'Enter' && handlePatientSearch()}
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

          <Form noValidate validated={patientAddValidated} onSubmit={handlePatientAddSubmit}>
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
            onClick={handlePatientAddSubmit}
            disabled={patientAddLoading}
          >
            <FontAwesomeIcon icon={faSave} className="me-2" />
            {patientAddLoading ? 'Saving...' : 'Save Patient'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BillingRegistration;
