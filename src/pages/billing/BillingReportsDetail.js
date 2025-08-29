import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Card, Button, Row, Col, Badge, Alert, Spinner, Form, Table, InputGroup, Modal, Dropdown
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faEdit, faDownload, faFileInvoiceDollar,
  faUser, faVial, faSpinner, faSave, faTimes, faExclamationTriangle,
  faCheckCircle, faInfoCircle, faFlask, faCheck, faPencilAlt, faUndo,
  faLayerGroup, faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import billingReportsAPI from '../../services/billingReportsAPI';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
// import image from "../../../backend/public/signature.jpeg";

import '../../styles/BillingReports.css';
import '../../styles/TestDetailsCard.css';

// PDF generation imports
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import SampleStatusCell from './SampleStatusCell';
import axios from 'axios';
import ArialNormal, { arialnormal } from '../../assets/ArialNormal';
import { fontBold } from '../../assets/ArialBold';
import boldfont from "../../assets/ArialBold";
import { verdana } from '../../assets/verdana';



// Try to import autoTable plugin, fallback if not available
let autoTableAvailable = false;
try {
  require('jspdf-autotable');
  autoTableAvailable = true;
} catch (e) {
  console.warn('jspdf-autotable not available, using fallback table generation');
}

// Add inline styles for locked and editable sections and table styling
const sectionStyles = `
  .locked-section {
    background-color: black;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    color:white;
    padding: 1rem;
    margin-bottom: 1rem;
    position: relative;
    opacity: 0.8;
  }

  .editable-section {
    background-color: #f0fff4;
    border: 2px solid #28a745;
    border-radius: 0.375rem;
    padding: 1rem;
    margin-bottom: 1rem;
    position: relative;
  }

  .locked-section .form-control,
  .locked-section .form-select {
    background-color: black;
    color:white;
    cursor: not-allowed;
  }

  .editable-section .form-control,
  .editable-section .form-select {
    border-color: #28a745;
  }

  .editable-section .form-control:focus,
  .editable-section .form-select:focus {
    border-color: #28a745;
    box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
  }

  /* Professional table styling for test results */
  .test-results-table {
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  }

  .test-results-table .table-dark th {
    background-color: #495057;
    border-color: #495057;
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .test-results-table tbody tr:hover {
    background-color: rgba(0, 123, 255, 0.05);
  }

  .test-results-table td {
    vertical-align: middle;
    padding: 0.75rem;
    border-color: #dee2e6;
  }

  .test-results-table .badge {
    font-size: 0.75rem;
    font-weight: 500;
  }

  /* Responsive table improvements */
  @media (max-width: 768px) {
    .test-results-table {
      font-size: 0.875rem;
    }

    .test-results-table td {
      padding: 0.5rem;
    }
  }
`;

/**
 * Dedicated billing reports detail page with view and edit modes
 * Supports navigation from samples page and regular billing reports page
 */
const BillingReportsDetail = () => {
  const { sid } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { currentTenantContext } = useTenant();

  // State management
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [includeHeader, setIncludeHeader] = useState(true);



  // Authorization workflow state
  const [authorizationMode, setAuthorizationMode] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [authorizationData, setAuthorizationData] = useState({
    approverName: '',
    approvalComments: ''
  });

  // LOGO INTEGRATION: State for logo base64 data
  const [logoBase64, setLogoBase64] = useState(null);

  // Navigation state
  const [referrer, setReferrer] = useState('billing-reports');

  // Form state for edit mode
  const [editData, setEditData] = useState({});

  // Test results state for editable functionality (commented out as not currently used)
  // const [testResults, setTestResults] = useState({});

  // Inline editing states for test items
  const [editingTestId, setEditingTestId] = useState(null);
  const [testEditData, setTestEditData] = useState({});
  const [savingChanges, setSavingChanges] = useState(false);
  const [masterData, setMasterData] = useState({
    specimens: [],
    containers: [],
    methods: [],
    resultTypes: ['Numeric', 'Text', 'Pick List']
  });
  const [excelTestData, setExcelTestData] = useState([]);

  // Sample-specific state for new editable sections
  const [sampleData, setSampleData] = useState({
    sample_info: {
      sample_id: '',
      sample_type: '',
      collection_date: '',
      collection_time: '',
      status: '',
      container_type: '',
      volume: '',
      priority: '',
      collection_notes: ''
    },
    processing_info: {
      received_date: '',
      processing_started: '',
      expected_completion: '',
      technician: '',
      lab_section: '',
      quality_check: '',
      processing_notes: ''
    }
  });

  // Determine referrer from URL parameters or location state
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const fromParam = urlParams.get('from');
    const editParam = urlParams.get('edit');

    // Check URL parameter first, then location state
    if (fromParam === 'samples') {
      setReferrer('samples');
    } else if (location.state?.from === 'samples') {
      setReferrer('samples');
    } else if (location.state?.from === 'billing-reports') {
      setReferrer('billing-reports');
    } else {
      // Default to billing-reports if no referrer is specified
      setReferrer('billing-reports');
    }

    if (editParam === 'true') {
      setEditMode(true);
    }
  }, [location]);

  // Load master data for dropdowns
  const loadMasterData = async () => {
    try {
      // Load specimen master data
      const specimenResponse = await adminAPI.getMasterData('specimenMaster');
      const containerResponse = await adminAPI.getMasterData('containerMaster');
      const methodResponse = await adminAPI.getMasterData('methodMaster');

      setMasterData(prev => ({
        ...prev,
        specimens: specimenResponse.data?.data || [],
        containers: containerResponse.data?.data || [],
        methods: methodResponse.data?.data || []
      }));
    } catch (err) {
      console.error('Error loading master data:', err);
    }
  };

  // Load Excel test data for default field population
  const loadExcelTestData = async () => {
    try {
      const response = await adminAPI.getExcelData();
      if (response.data?.data) {
        setExcelTestData(response.data.data);
      }
    } catch (err) {
      console.error('Error loading Excel test data:', err);
    }
  };



  // Fetch report details and load logo
  useEffect(() => {
    const fetchReport = async () => {
      if (!sid) return;

      try {
        setLoading(true);

        // Load master data and Excel data in parallel
        await Promise.all([
          loadMasterData(),
          loadExcelTestData()
        ]);
        setError(null);

        const response = await billingReportsAPI.getReportBySID(sid);

        if (response.success && response.data) {
          const reportData = response.data.data?.data || response.data.data || response.data;

          if (reportData && typeof reportData === 'object') {
            setReport(reportData);
            setEditData(reportData);

            // Initialize sample data if it exists in the report
            if (reportData.sample_info || reportData.processing_info) {
              setSampleData({
                sample_info: reportData.sample_info || sampleData.sample_info,
                processing_info: reportData.processing_info || sampleData.processing_info
              });
            }
          } else {
            setError('Invalid report data structure received');
          }
        } else {
          setError(response.error || 'Failed to load report details');
        }
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load report details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();

    // VERIFY PNG FILE ACCESS: Test if PNG logo file is accessible
    const testLogoAccess = async () => {
      try {
        console.log('=== TESTING PNG LOGO FILE ACCESS ===');
        const response = await fetch('/logoavini.png');
        console.log('PNG logo file fetch response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: response.url,
          type: response.type,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (response.ok) {
          const blob = await response.blob();
          console.log('PNG logo file blob:', {
            size: blob.size,
            type: blob.type
          });
          console.log('=== PNG LOGO FILE ACCESS SUCCESSFUL ===');
        } else {
          console.error('PNG logo file not accessible:', response.status, response.statusText);
        }
      } catch (fetchErr) {
        console.error('=== PNG LOGO FILE ACCESS FAILED ===');
        console.error('Fetch error:', fetchErr);
      }
    };

    // Test PNG logo file access first
    testLogoAccess();

    // PNG LOGO LOADING: Direct PNG loading and conversion
    console.log('=== PNG LOGO INITIALIZATION ===');
    convertLogoToBase64().then(base64 => {
      if (base64) {
        setLogoBase64(base64);
        console.log('PNG logo converted to base64 successfully');
        console.log('Logo state updated - base64 length:', base64.length);
        console.log('Logo data starts with:', base64.substring(0, 30));
        console.log('=== PNG LOGO READY FOR PDF GENERATION ===');
      } else {
        console.error('PNG logo conversion failed - base64 is null');
        console.error('Check if logoavini.png exists in public directory');
      }
      console.log('=== END PNG LOGO INITIALIZATION ===');
    }).catch(err => {
      console.error('PNG logo conversion promise rejected:', err);
    });
  }, [sid]);

  // Inline editing functions
  const startEditingTest = (testIndex, test) => {
    setEditingTestId(testIndex);

    // Get default values from Excel data if available
    const excelTest = excelTestData.find(et =>
      et.test_name === test.test_name ||
      et.id === test.test_master_id ||
      et.test_code === test.hms_code
    );

    setTestEditData({
      specimen: test.specimen || test.primary_specimen || excelTest?.specimen || '',
      container: test.container || excelTest?.container || '',
      method: test.method || excelTest?.method || '',
      reference_range: test.reference_range || excelTest?.reference_range || '',
      result_unit: test.result_unit || excelTest?.result_unit || '',
      result: test.result || '',
      result_type: test.result_type || excelTest?.result_type || 'Numeric'
    });
  };

  const cancelEditingTest = () => {
    setEditingTestId(null);
    setTestEditData({});
  };

  const saveTestChanges = async (testIndex) => {
    try {
      setSavingChanges(true);

      // Prepare updated test data
      const updatedTestData = {
        ...testEditData,
        updated_at: new Date().toISOString()
      };

      // Call API to save changes
      const response = await billingReportsAPI.updateTestItem(sid, testIndex, updatedTestData);

      if (response.success) {
        // Update local state with the saved data
        const updatedReport = { ...report };
        updatedReport.test_items[testIndex] = {
          ...updatedReport.test_items[testIndex],
          ...updatedTestData
        };
        setReport(updatedReport);

        // Reset editing state
        setEditingTestId(null);
        setTestEditData({});

        console.log('Test changes saved successfully:', updatedTestData);
      } else {
        throw new Error(response.error || 'Failed to save test changes');
      }
    } catch (err) {
      console.error('Error saving test changes:', err);
      setError(`Failed to save test changes: ${err.message}`);
    } finally {
      setSavingChanges(false);
    }
  };

  const handleTestFieldChange = (field, value) => {
    setTestEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle back navigation
  const handleBack = () => {
    if (referrer === 'samples') {
      navigate('/samples');
    } else {
      navigate('/billing/reports');
    }
  };

  // Generate auto Sample ID based on site code and SID number
  const generateSampleId = () => {
    if (!report) return '';

    const siteCode = report.clinic_info?.site_code || 'XX';
    const sidNumber = report.sid_number || '';

    // Format: {SITE_CODE}-{SID_NUMBER} (e.g., "MYD-MYD001")
    return `${siteCode}-${sidNumber}`;
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (editMode) {
      // Cancel edit - reset form data
      setEditData(report);
      // Reset sample data to initial state
      setSampleData({
        sample_info: {
          sample_id: '',
          sample_type: '',
          collection_date: '',
          collection_time: '',
          status: '',
          container_type: '',
          volume: '',
          priority: '',
          collection_notes: ''
        },
        processing_info: {
          received_date: '',
          processing_started: '',
          expected_completion: '',
          technician: '',
          lab_section: '',
          quality_check: '',
          processing_notes: ''
        }
      });
      setEditMode(false);
    } else {
      // Enter edit mode and auto-generate Sample ID
      const autoGeneratedSampleId = generateSampleId();
      setSampleData(prev => ({
        ...prev,
        sample_info: {
          ...prev.sample_info,
          sample_id: autoGeneratedSampleId
        }
      }));
      setEditMode(true);
    }
  };

  // Handle form input changes for existing data (locked fields)
  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle sample data changes for new editable sections
  const handleSampleDataChange = (section, field, value) => {
    setSampleData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Handle save changes
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate sample data
      const validationErrors = validateSampleData();
      if (validationErrors.length > 0) {
        setError(`Validation errors: ${validationErrors.join(', ')}`);
        setSaving(false);
        return;
      }

      // Prepare data for saving - combine existing report data with new sample data
      const updatedReportData = {
        ...editData,
        sample_info: sampleData.sample_info,
        processing_info: sampleData.processing_info,
        last_updated: new Date().toISOString(),
        updated_by: 'current_user' // You would get this from auth context
      };

      // Here you would implement the actual save functionality
      // For now, we'll just simulate a save operation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the report with new data
      setReport(updatedReportData);
      setEditMode(false);

      // Show success message (you could add a toast notification here)
      console.log('Report updated successfully with sample data:', updatedReportData);
    } catch (err) {
      console.error('Error saving report:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Validate sample data
  const validateSampleData = () => {
    const errors = [];

    // Sample info validation
    if (sampleData.sample_info.sample_id && !sampleData.sample_info.sample_type) {
      errors.push('Sample type is required when sample ID is provided');
    }

    if (sampleData.sample_info.collection_date && !sampleData.sample_info.collection_time) {
      errors.push('Collection time is required when collection date is provided');
    }

    // Processing info validation
    if (sampleData.processing_info.processing_started && !sampleData.processing_info.technician) {
      errors.push('Technician name is required when processing is started');
    }

    return errors;
  };


  // Handle authorization workflow
  const handleAuthorize = async () => {
    if (!report) return;

    try {
      setAuthorizing(true);
      setError(null);

      // Validate authorization data
      if (!authorizationData.approverName.trim()) {
        setError('Approver name is required');
        setAuthorizing(false);
        return;
      }

      // Call authorization API
      const response = await billingReportsAPI.authorizeReport(report.id, {
        approverName: authorizationData.approverName,
        approvalComments: authorizationData.approvalComments,
        approvalTimestamp: new Date().toISOString()
      });

      if (response.success) {
        // Update the report with authorization status
        setReport(prev => ({
          ...prev,
          authorized: true,
          authorization: {
            approverName: authorizationData.approverName,
            approvalComments: authorizationData.approvalComments,
            approvalTimestamp: new Date().toISOString()
          }
        }));

        setAuthorizationMode(false);
        setAuthorizationData({
          approverName: '',
          approvalComments: ''
        });
        setError(null);
      } else {
        setError(response.error || 'Failed to authorize report');
      }
    } catch (err) {
      console.error('Error authorizing report:', err);
      setError('Failed to authorize report. Please try again.');
    } finally {
      setAuthorizing(false);
    }
  };

  // Initialize authorization data when entering authorization mode
  const handleEnterAuthorizationMode = () => {
    setAuthorizationData({
      approverName: `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim(),
      approvalComments: ''
    });
    setAuthorizationMode(true);
  };

  // Handle sending report for authorization (navigate to new authorization screen)
  const handleSendForAuthorization = () => {
    if (!report?.sid_number) {
      setError('Report SID not found');
      return;
    }

    // Navigate to the new authorization screen
    navigate(`/billing/reports/${report.sid_number}/authorize`, {
      state: {
        from: referrer,
        reportData: report
      }
    });
  };

  // SIMPLIFIED PNG LOGO LOADER: Direct PNG loading without AVIF conversion
  const convertLogoToBase64 = async () => {
    console.log('=== PNG LOGO LOADING START ===');

    try {
      // Create canvas for PNG to base64 conversion
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      // Enable CORS for cross-origin images
      img.crossOrigin = 'anonymous';

      return new Promise((resolve) => {
        img.onload = () => {
          try {
            console.log('=== PNG LOGO LOADED SUCCESSFULLY ===');
            console.log('Logo image properties:', {
              src: img.src,
              width: img.width,
              height: img.height,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              complete: img.complete
            });

            // Validate image dimensions
            if (img.width === 0 || img.height === 0) {
              console.error('Invalid PNG logo dimensions:', img.width, 'x', img.height);
              resolve(null);
              return;
            }

            // Set canvas size to maintain aspect ratio
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            console.log('Canvas dimensions set to:', canvas.width, 'x', canvas.height);

            // Clear canvas and draw PNG image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            console.log('PNG image drawn to canvas successfully');

            // Convert to base64 PNG (no format conversion needed)
            const base64 = canvas.toDataURL('image/png');
            console.log('=== PNG BASE64 CONVERSION SUCCESSFUL ===');
            console.log('Base64 data properties:', {
              length: base64.length,
              startsWithDataUrl: base64.startsWith('data:image/png;base64,'),
              preview: base64.substring(0, 50) + '...',
              isValid: base64.length > 100 && base64.includes('data:image/png;base64,')
            });

            // Validate base64 data
            if (!base64 || base64.length < 100 || !base64.startsWith('data:image/png;base64,')) {
              console.error('Invalid PNG base64 data generated');
              resolve(null);
              return;
            }

            console.log('=== PNG LOGO CONVERSION COMPLETED SUCCESSFULLY ===');
            resolve(base64);

          } catch (conversionErr) {
            console.error('=== ERROR DURING PNG LOGO CONVERSION ===');
            console.error('PNG conversion error:', conversionErr);
            console.error('Canvas state:', {
              width: canvas.width,
              height: canvas.height,
              context: !!ctx
            });
            resolve(null);
          }
        };

        img.onerror = (err) => {
          console.error('=== PNG LOGO LOAD FAILED ===');
          console.error('PNG load error:', err);
          console.error('Error details:', {
            src: img.src,
            currentSrc: img.currentSrc,
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          });
          resolve(null);
        };

        // LOGO FILE CONFIGURATION: Load PNG logo from public directory
        const logoPath = '/logoavini.png';
        console.log('=== ATTEMPTING TO LOAD PNG LOGO ===');
        console.log('PNG logo path:', logoPath);
        console.log('Full URL:', window.location.origin + logoPath);
        console.log('Current location:', window.location.href);

        img.src = logoPath;

        // Add timeout to detect hanging loads
        setTimeout(() => {
          if (!img.complete) {
            console.warn('PNG logo loading timeout - image not loaded after 5 seconds');
            console.log('PNG image state:', {
              src: img.src,
              complete: img.complete,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight
            });
          }
        }, 5000);
      });

    } catch (err) {
      console.error('=== PNG LOGO FUNCTION ERROR ===');
      console.error('Function error:', err);
      console.log('=== PNG LOGO LOADING END ===');
      return null;
    }
  };

  // Generate QR Code as base64 image
  const generateQRCodeBase64 = async (text) => {
    try {
      return await QRCode.toDataURL(text, {
        width: 100,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (err) {
      console.error('QR Code generation error:', err);
      return null;
    }
  };

  // Generate barcode as base64 image
  const generateBarcodeBase64 = (text) => {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, text, {
        format: "CODE128",
        displayValue: true,
        width: 2,
        height: 50,
        margin: 5,
        fontSize: 12,
        textMargin: 2
      });
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.error('Barcode generation error:', err);
      return null;
    }
  };

  // Transform actual report data into PDF format - FIXED FOR BILLING REPORT STRUCTURE
  const transformReportDataForPDF = (reportData) => {
    try {
      console.log('Transforming billing report data for PDF:', reportData);

      // Check for the correct data structure - billing reports use 'test_items' not 'billing_items'
      const testItems = reportData.test_items || reportData.billing_items || [];

      if (!reportData || !testItems || testItems.length === 0) {
        console.warn('No test items found in report data, using fallback data');
        console.log('Available report keys:', Object.keys(reportData || {}));
        return getFallbackTestData();
      }

      console.log('Found test items:', testItems);
      const categories = {};

      // Group tests by category/department from actual billing report structure
      testItems.forEach(item => {
        console.log('Processing test item:', item);

        // PROFILE TEST ENHANCEMENT: Use parent profile name for profile tests, department for individual tests
        let categoryName;

        // Check if this is a profile test (sub-test of a profile)
        if (item.parent_profile_name ||
          item.is_profile_subtest ||
          item.test_master_data?.type === 'profile') {
          // For profile tests: Use the parent profile name as the category
          categoryName = item.parent_profile_name ||
            item.test_master_data?.test_profile ||
            item.test_master_data?.testName ||
            'PROFILE TESTS';
          console.log(`Profile test detected: Using parent profile name "${categoryName}" instead of department`);
        } else {
          // For individual tests: Use department name as before
          categoryName = item.department ||
            item.test_master_data?.department ||
            item.category ||
            'GENERAL TESTS';
          console.log(`Individual test detected: Using department name "${categoryName}"`);
        }

        if (!categories[categoryName]) {
          categories[categoryName] = {
            category: categoryName,
            tests: []
          };
        }
        console.log("iteemmmmmmmmmmmmmmmmmmmmmmm", item.test_master_data.notes)
        console.log("iteemmmmmmmmmmmmmmmmmmmmmmm", item)

        // Create test entry with actual billing report data
        const testEntry = {
          name: item.test_name || item.name || 'Unknown Test',
          method: item.method || item.test_master_data?.method || '',
          specimen: item.primary_specimen || item.test_master_data?.specimen || '',
          notes: item.test_master_data?.notes || item.instructions ||
            item.test_master_data?.instructions ||
            item.interpretation ||
            item.test_master_data?.interpretation ||
            '',
          subTests: []
        };

        // Handle sub-tests from billing report structure
        if (item.sub_tests && Array.isArray(item.sub_tests)) {
          item.sub_tests.forEach(subTest => {
            testEntry.subTests.push({
              name: subTest.name || subTest.test_name || subTest.parameter || 'Sub Test',
              result: subTest.result || subTest.value || subTest.test_result || 'Pending',
              unit: subTest.unit || subTest.units || subTest.measurement_unit || '',
              reference: subTest.reference_range || subTest.normal_range || subTest.reference || 'N/A'
            });
          });
        } else {
          // Single test result from billing report - use actual test data
          testEntry.subTests.push({
            name: item.test_name || item.name || 'Test Result',
            result: item.result || item.value || item.test_result || 'Pending', // Billing reports don't have results yet, they're for ordering
            unit: item.result_unit || item.test_master_data?.result_unit || '',
            reference: item.reference_range || item.test_master_data?.reference_range || item.referenceRange || 'N/A'
          });
        }

        categories[categoryName].tests.push(testEntry);
        console.log('Added test to category:', categoryName, testEntry);
      });

      // Convert categories object to array
      const transformedData = Object.values(categories);

      console.log('Final transformed data for PDF:', transformedData);
      return transformedData.length > 0 ? transformedData : getFallbackTestData();

    } catch (error) {
      console.error('Error transforming billing report data:', error);
      console.error('Report data structure:', reportData);
      return getFallbackTestData();
    }
  };

  // Fallback test data for when no real data is available
  const getFallbackTestData = () => {
    console.warn('Using fallback test data - no actual test results found in report');
    return [
      {
        category: 'GENERAL TESTS',
        tests: [
          {
            name: 'No Test Data Available',
            notes: 'This PDF was generated but no test results were found in the billing report. Please check the report data structure or contact support.',
            subTests: [
              { name: 'Status', result: 'No Data', unit: '', reference: 'Check Report' }
            ]
          }
        ]
      }
    ];
  };

  // Convert logo image to base64 for PDF embedding
  const getLogoBase64 = () => {
    // AVINI LABS logo in base64 format
    // This is a placeholder - replace with actual logo base64 data
    const logoBase64 = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;

    return logoBase64;
  };

  // Function to convert image file to base64 (for future logo updates)
  const convertImageToBase64 = (imageFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });
  };

  // Handle PDF download with professional medical report design - USER-SPECIFIC
  const handleDownloadPDF = async () => {
    if (!report) return;

    try {
      setDownloadingPDF(true);
      setError(null);



      // Create new jsPDF instance
      const doc = new jsPDF('p', 'mm', 'A4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Generate QR code with direct PDF download URL
      const qrCodeData = `${window.location.origin}/api/billing-reports/sid/${report.sid_number}/pdf`;
      const qrCodeImg = await generateQRCodeBase64(qrCodeData);

      // Generate barcode for SID
      const barcodeImg = generateBarcodeBase64(report.sid_number || 'N/A');

      // FIRST PAGE HEADER: Add complete header section on first page
      let yPosition = 20;

      // Add logo if available and header is enabled
      if (logoBase64 && includeHeader) {
        try {
          // LOGO SIZE ENHANCEMENT: Increased logo size while maintaining positioning
          const logoHeight = 30; // UPDATED: Increased from 15pt to 25pt height
          const logoWidth = logoHeight * 2.5; // Calculate width maintaining 1.5:1 aspect ratio (37.5pt width)
          const logoX = 15; // 15pt from left margin in content area (unchanged)
          const logoY = 10; // 25pt from top (below the 8pt pink header bar) in white content area (unchanged)

          doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
        } catch (logoErr) {
          console.error('Failed to add logo to PDF content area:', logoErr);
        }
      }

      // Add patient report section with barcode on first page
      const patientSectionStartY = includeHeader ? 55 : 50;
      console.log('Patient section starting at yPosition:', patientSectionStartY);
      yPosition = generatePatientReportSection(doc, report, patientSectionStartY, pageWidth, barcodeImg);

      // Test Results Section with clean list-based format
      const testResultsOutput = generateTestResultsTable(doc, report, yPosition, pageWidth, includeHeader);
      const finalYPosition = testResultsOutput.yPosition || testResultsOutput;
      const totalPages = testResultsOutput.pageCount || 1;

      // QR Code and Signatures Section (Final Page Only)
      try {
        await generateQRCodeAndSignatureSection(doc, qrCodeImg, pageWidth, pageHeight, finalYPosition, totalPages);
      } catch (qrError) {
        console.error('Error in QR code section:', qrError);
        // Add basic fallback QR section
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('QR CODE AND SIGNATURES SECTION', pageWidth / 2, finalYPosition + 20, { align: 'center' });
        doc.text('Dr. Jothi Lakshmi - Verified By', 50, finalYPosition + 40);
        doc.text('Dr. S.Asokkumar - Authorized By', pageWidth - 50, finalYPosition + 40, { align: 'right' });
      }

      // Add user verification footer before saving
      const currentPage = doc.internal.getNumberOfPages();
      doc.setPage(currentPage);

      // Add user-specific generation info at bottom of last page
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      const generationInfo = `Generated by: ${currentUser?.first_name || ''} ${currentUser?.last_name || ''} (${currentUser?.role || 'User'}) | ${currentTenantContext?.name || 'AVINI LABS'} | ${new Date().toLocaleString()}`;
      doc.text(generationInfo, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.setTextColor(0, 0, 0); // Reset color

      // Save the PDF with patient-specific filename
      const patientInfo = report.patient_info || {};
      const patientName = (patientInfo.full_name ||
        `${patientInfo.first_name || ''} ${patientInfo.last_name || ''}`.trim() ||
        'Patient').replace(/[^a-zA-Z0-9]/g, '_'); // Clean filename

      const sidNumber = report.sid_number || report.sample_id || 'Report';
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${patientName}_${sidNumber}_${timestamp}.pdf`;
      doc.save(filename);

    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(`Failed to generate PDF: ${err.message || 'Unknown error'}. Please try again or contact support.`);
    } finally {
      setDownloadingPDF(false);
    }
  };



  // Generate Patient and Report Information Section
  const generatePatientReportSection = (doc, report, yPos, pageWidth, barcodeImg) => {
    let yPosition = yPos;

    try {
      // CONSISTENT BARCODE POSITIONING: Always position barcode at the same location regardless of header state
      // This ensures consistent spacing between barcode and SID No. text in both modes
      if (barcodeImg) {
        // Position barcode at consistent Y position to maintain same spacing as when logo is present
        // When logo is present: logo is at Y=10-40, barcode should be at Y=45 (yPosition=55, so 55-10=45)
        // When logo is absent: barcode should still be at Y=45 to maintain consistent spacing
        const barcodeY = includeHeader ? 35 : 40; // Fixed position for consistent spacing in both header modes
        doc.addImage(barcodeImg, 'PNG', pageWidth - 55, barcodeY, 45, 15);
        console.log('Barcode positioned at consistent Y=45 for uniform spacing in both header modes');
      }

      // Patient Information (Left Column) - improved readability
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10); // Increased font size for better readability
      doc.setFont('helvetica', 'normal');

      // Professional column positioning with adequate spacing
      const labelX = 15;
      const colonX = 50; // More space for labels
      const valueX = 55; // Clear separation from colon

      // Left-aligned labels with proper spacing
      doc.setFont("helvetica", "bold");
      doc.text('Patient', labelX, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text('Age / Sex', labelX, yPosition + 6);
      doc.text('Patient ID', labelX, yPosition + 12);
      doc.text('Branch', labelX, yPosition + 18);

      // Properly aligned colons
      doc.text(':', colonX, yPosition);
      doc.text(':', colonX, yPosition + 6);
      doc.text(':', colonX, yPosition + 12);
      doc.text(':', colonX, yPosition + 18);

      // Handle the actual billing report structure
      const patientInfo = report.patient_info || {};
      const patientName = (patientInfo.full_name ||
        patientInfo.name ||
        `${patientInfo.first_name || ''} ${patientInfo.last_name || ''}`.trim() ||
        'N/A').toUpperCase();

      const patientAge = patientInfo.age ||
        (patientInfo.date_of_birth ?
          Math.floor((new Date() - new Date(patientInfo.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) :
          'N/A');

      const patientGender = patientInfo.gender || 'N/A';
      const patientId = patientInfo.patient_id || patientInfo.id || 'N/A';

      // Extract clinic/branch information from billing report
      const clinicInfo = report.clinic_info || {};
      const branchName = clinicInfo.name ||
        clinicInfo.branch_name ||
        currentTenantContext?.name ||
        currentUser?.first_name ||
        'AVINI LABS';

      console.log('Extracted patient data for PDF:', {
        name: patientName,
        age: patientAge,
        gender: patientGender,
        id: patientId,
        branch: branchName
      });

      // Consistently positioned values with ACTUAL USER DATA
      doc.setFont("helvetica", "bold");
      doc.text(patientName, valueX, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(`${patientAge} / ${patientGender}`, valueX, yPosition + 6);
      doc.text(patientId.toString(), valueX, yPosition + 12);
      doc.text(branchName, valueX, yPosition + 18);

      // Report Information (Right Column) - properly aligned to avoid barcode overlap
      const rightLabelX = 120;
      const rightColonX = 155; // Consistent colon alignment
      const rightValueX = 160; // Clear positioning after colon

      // Left-aligned labels - clean vertical stack
      doc.setFont("helvetica", "bold");
      doc.text('SID No.', rightLabelX, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text('Reg Date & Time', rightLabelX, yPosition + 6);
      doc.text('Coll Date & Time', rightLabelX, yPosition + 12);
      doc.text('Report Date & Time', rightLabelX, yPosition + 18);

      // Properly aligned colons - consistent positioning
      doc.text(':', rightColonX, yPosition);
      doc.text(':', rightColonX, yPosition + 6);
      doc.text(':', rightColonX, yPosition + 12);
      doc.text(':', rightColonX, yPosition + 18);





      // Extract actual dates from billing report - FIXED STRUCTURE
      const sampleId = report.sid_number || report.sample_id || report.id || 'N/A';

      // Use billing report specific date fields
      const regDate = report.registration_date ||
        report.billing_date ||
        report.invoice_date ||
        report.created_at ||
        new Date().toISOString();

      const testItems = report.test_items || [];


      function parseCustomDate(dateStr) {
        if (!dateStr) return null;

        // Split into [date, time+ampm]
        const [datePart, timePart] = dateStr.split(", ");

        // Handle DD/MM/YYYY
        const [day, month, year] = datePart.split("/").map(Number);

        // Handle "3:46:02 pm"
        let [time, modifier] = timePart.split(" ");
        let [hours, minutes, seconds] = time.split(":").map(Number);

        if (modifier.toLowerCase() === "pm" && hours < 12) hours += 12;
        if (modifier.toLowerCase() === "am" && hours === 12) hours = 0;

        return new Date(year, month - 1, day, hours, minutes, seconds);
      }

      const latestSampleStatusTime = testItems
        .map(item => parseCustomDate(item.sample_received_timestamp))
        .filter(Boolean) // remove null/invalid
        .sort((a, b) => b - a)[0]; // latest

      // You can use this in the UI
      const collDate = latestSampleStatusTime;


      const reportDate = new Date().toISOString();

      console.log('Extracted dates for PDF:', {
        sampleId,
        regDate,
        collDate,
        reportDate
      });

      // Format dates properly for display
      const formatDate = (dateStr) => {
        try {
          const date = new Date(dateStr);
          return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }).replace(',', '');
        } catch {
          return 'N/A';
        }
      };

      // Consistently positioned values with ACTUAL USER DATA
      doc.setFont("helvetica", "bold");
      doc.text(sampleId.toString(), rightValueX, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(formatDate(regDate), rightValueX, yPosition + 6);
      doc.text(formatDate(collDate), rightValueX, yPosition + 12);
      doc.text(formatDate(reportDate), rightValueX, yPosition + 18);


    } catch (err) {
      console.error('Error in generatePatientReportSection:', err);
    }

    return yPosition + 25; // Proper spacing without excessive gaps
  };

  // ENHANCED FOOTER: Branch information above 8pt pink footer bar
  const addPersistentFooter = (doc, currentPageWidth, currentPageHeight, currentPage = 1, totalPages = 1) => {
    // FOOTER CONTENT ENHANCEMENT: Branch locations text above pink footer bar
    const branchTextY = currentPageHeight - 16; // Position for branch text in white area

    // HEAD OFFICE POSITIONING: Above branches on left side
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(236, 72, 153); // Black text in white area
    doc.text('Head Office', 15, branchTextY - 5);

    // BRANCH TEXT CONTENT: Display branch locations list
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // Black text in white area
    const branchText = 'Mayiladuthurai | Chidambaram | Sirkazhi | Sankanankovil | Kumbakonam | Pandanallur | Thirupanandal | Eravanchery | Nannilam | Thanjavur | Needamangalam | Thiruthuraipoondi | Tiruvarur | Avadi | Ambakkam';

    // BRANCH TEXT STYLING: Centered alignment with proper wrapping
    const wrappedBranchLines = doc.splitTextToSize(branchText, currentPageWidth - 30);
    wrappedBranchLines.forEach((line, index) => {
      doc.text(line, currentPageWidth / 2, branchTextY + (index * 4), { align: 'center' });
    });

    // SPACING: 5-10pt gap between branch text and pink footer bar
    const pinkFooterY = currentPageHeight - 8;
    doc.setFillColor(236, 72, 153); // Same pink color as header for consistency
    doc.rect(0, pinkFooterY, currentPageWidth, 8, 'F'); // 8pt height footer bar

    // FOOTER TEXT ENHANCEMENT: Head Office text on left side of pink bar
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // White text on pink background
    // doc.text('Head Office', 15, pinkFooterY + 5); // Positioned for 8pt footer height

    // FOOTER CONTENT: Contact information in center (adjusted for 8pt height)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // White text on pink background
    const contactInfo = 'Customer Care No: 1800 572 4455';
    doc.text(contactInfo, currentPageWidth / 2, pinkFooterY + 5, { align: 'center' });

    // FOOTER PAGINATION: Page numbering on right side (adjusted for 8pt height)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255); // White text on pink background
    doc.text(`Page ${currentPage} of ${totalPages}`, currentPageWidth - 15, pinkFooterY + 5, { align: 'right' });

    console.log('Enhanced footer with branches added:', {
      footerHeight: '8pt',
      branchTextPosition: branchTextY,
      pinkFooterPosition: pinkFooterY,
      branchTextLines: wrappedBranchLines.length,
      colorConsistency: 'Matches header pink (236, 72, 153)'
    });
  };

  // Generate Test Results Section - Clean List-Based Format
  //   const generateTestResultsTable = (doc, reportData, yPos, pageWidth, includeHeader = true) => {
  //     let yPosition = yPos;
  //     let actualPageCount = 1;
  //     let pageHeight;

  //     try {
  //       const pageHeight = doc.internal.pageSize.getHeight();
  //       const bottomMargin = 35;
  //       const maxContentHeight = pageHeight - bottomMargin;

  //       const addColumnHeaders = (currentY) => {
  //         doc.addFileToVFS("Arial-Bold.ttf", fontBold);
  //         doc.addFont("Arial-Bold.ttf", "Arial", "bold");


  //         doc.setFont("Arial", "bold");
  //         doc.setFontSize(10);
  //         doc.setTextColor(0, 0, 0);

  //         doc.text('INVESTIGATION / METHOD', 15, currentY);
  //         doc.text('RESULT', 105, currentY);
  //         doc.text('UNITS', 135, currentY);
  //         doc.text('REFERENCE INTERVAL', 160, currentY);

  //         doc.setDrawColor(0, 0, 0);
  //         doc.setLineWidth(0.3);
  //         doc.line(10, currentY + 2, pageWidth - 10, currentY + 2);
  //         return currentY + 10;
  //       };

  //       const checkPageBreak = (currentY, requiredSpace = 20) => {
  //         if (currentY + requiredSpace > maxContentHeight) {
  //           doc.addPage();
  //           let newY = 20;
  //           if (shouldDisplayHeaders) newY = addColumnHeaders(newY) + 2;
  //           return newY;
  //         }
  //         return currentY;
  //       };

  //       const isComplexReferenceRange = (text) => {
  //         if (!text || text.trim() === '') return false;
  //         const clean = text.trim();
  //         return (clean.includes(':') && clean.length > 30) ||
  //           /\b(month|year|adult|child|male|female|born)\b/i.test(clean) ||
  //           clean.length > 40;
  //       };

  //       // const formatReferenceRange = (text, maxWidth = 120) => {
  //       //   if (!text || text.trim() === '') return ['N/A'];
  //       //   const clean = text.replace(/\n+/g, ' ').trim();
  //       //   const segments = clean.includes('month') || clean.includes('year')
  //       //     ? clean.split(/(?=\d+\s*(?:month|year)|Adult|Child|Male|Female|New Born|Cord Blood)/i)
  //       //     : clean.split(/\s*[:|;]\s*(?=[A-Z]|\d)/);
  //       //   return segments.flatMap(seg => doc.splitTextToSize(seg.trim(), maxWidth)).filter(Boolean);
  //       // };

  //   const formatReferenceRange = (text, maxWidth = 120) => {
  //   if (!text || text.trim() === '') return ['N/A'];

  //   // Split by existing newlines first
  //   const lines = text
  //     .split('\n')
  //     .map(line => line.trim())
  //     .filter(Boolean);

  //   // Wrap each line to fit maxWidth using jsPDF
  //   return lines.flatMap(line => doc.splitTextToSize(line, maxWidth));
  // };



  //       const calculateTestHeight = (test) => {
  //         let height = 5;
  //         test.subTests.forEach(sub => {
  //           height += 4;
  //           if (isComplexReferenceRange(sub.reference)) {
  //             height += 2 + formatReferenceRange(sub.reference).length * 2.5 + 2;
  //           }
  //         });
  //         if (test.notes?.trim()) {
  //           height += 2 + doc.splitTextToSize(`Notes: ${test.notes}`, pageWidth - 50).length * 2.5 + 2;
  //         } else {
  //           height += 2;
  //         }
  //         return height;
  //       };

  //       const actualTestData = transformReportDataForPDF(reportData);
  //       const shouldDisplayHeaders = reportData?.test_items?.length && actualTestData?.some(cat => cat.tests?.length);

  //       if (shouldDisplayHeaders) {
  //         yPosition += 1;
  //         doc.setDrawColor(0, 0, 0).setLineWidth(0.3);
  //         doc.line(10, yPosition, pageWidth - 10, yPosition);
  //         yPosition += 6;
  //         doc.addFileToVFS("Arial-Bold.ttf", fontBold);
  //         doc.addFont("Arial-Bold.ttf", "Arial", "bold");

  //         doc.setFont('Arial', 'bold').setFontSize(10);

  //         doc.text('Final Test Report', pageWidth / 2, yPosition, { align: 'center' });
  //         yPosition += 4;
  //         doc.line(10, yPosition, pageWidth - 10, yPosition);
  //         yPosition += 6;
  //         yPosition = addColumnHeaders(yPosition);
  //       } else {
  //         yPosition += 5;
  //       }

  //       actualTestData?.forEach((category, idx) => {
  //         yPosition = checkPageBreak(yPosition, 15);

  //         doc.addFileToVFS("Arial.ttf", arialnormal);
  //         doc.addFont("Arial.ttf", "Arial", "normal");
  //         doc.setFont('Arial', 'bold').setFontSize(10);
  //         doc.text(category.category.toUpperCase(), 15, yPosition)
  //         yPosition += 5;



  //         category.tests.forEach(test => {
  //           const estHeight = calculateTestHeight(test);
  //           yPosition = checkPageBreak(yPosition, estHeight);

  //           doc.addFileToVFS("Arial.ttf", arialnormal);
  //           doc.addFont("Arial.ttf", "Arial", "normal");
  //           doc.setFont('Arial', 'normal').setFontSize(10);
  //           doc.text(test.name, 16, yPosition);
  //           yPosition += 4;
  //           doc.addFileToVFS("Arial-Bold.ttf", fontBold);
  //           doc.addFont("Arial-Bold.ttf", "Arial", "bold");
  //           doc.setFont('Arial', 'normal').setFontSize(8);
  //           if (test.method) {
  //             doc.text(`( Method: ${test.method} )`, 16, yPosition);
  //             yPosition += 4;
  //           }
  //           if (test.specimen) {
  //             doc.text(`( Specimen: ${test.specimen} )`, 16, yPosition);
  //             yPosition += 4;
  //           }
  //           doc.addFileToVFS("Arial.ttf", arialnormal);
  //           doc.addFont("Arial.ttf", "Arial", "normal");
  //           doc.setFont('Arial', 'normal').setFontSize(9);


  //           test.subTests.forEach(sub => {
  //     // yPosition = checkPageBreak(yPosition, 4);

  //     const refColumnWidth = 50;
  //     const refLines = formatReferenceRange(sub.reference, refColumnWidth);

  //     // Starting y for this row
  //     const rowStartY = yPosition - 8;

  //     // Draw result and unit
  //     doc.text(sub.result, 105, rowStartY);
  //     doc.text(sub.unit, 135, rowStartY);

  //      const lineHeight = 4; // or 3.5, whatever fits your design

  // // Draw reference lines
  // refLines.forEach((line, i) => {
  //    doc.addFileToVFS("Arial.ttf", arialnormal);
  //     doc.addFont("Arial.ttf", "Arial", "normal");
  //     doc.setFont('Arial', 'normal').setFontSize(8);    
  //     doc.text(line, 160, rowStartY + i * lineHeight);
  // });

  // // Move yPosition down by total height of wrapped lines
  // yPosition += refLines.length * lineHeight + 2; // add so
  // });


  //           // test.subTests.forEach(sub => {
  //           //   if (isComplexReferenceRange(sub.reference)) {
  //           //     yPosition += 3;
  //           //     doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(0, 0, 0);
  //           //     doc.text(`Reference Range (${sub.name}):`, 25, yPosition);
  //           //     yPosition += 4;

  //           //     doc.addFileToVFS("Arial.ttf", arialnormal);
  //           //     doc.addFont("Arial.ttf", "Arial", "normal");
  //           //     doc.setFont('Arial', 'normal').setTextColor(0, 0, 0);
  //           //     doc.setFont('Arial', 'normal').setFontSize(8);
  //           //     // formatReferenceRange(sub.reference).forEach(line => {
  //           //     //   yPosition = checkPageBreak(yPosition, 3);
  //           //     //   doc.text(line, 30, yPosition);
  //           //     //   yPosition += 4;
  //           //     // });
  //           //     doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(0, 0, 0);
  //           //     yPosition += 1;
  //           //   }
  //           // });




  //           if (test.notes?.trim()) {
  //             yPosition += 1;

  //             const leftMargin = 15;
  //             const rightMargin = 15;
  //             const paragraphWidth = pageWidth - leftMargin - rightMargin;

  //             // Clean notes: remove manual line breaks
  //             const cleanedNotes = test.notes.replace(/\s*\n\s*/g, " ");

  //             // Merge "Notes:" inline
  //             const fullNotes = `Notes: ${cleanedNotes}`;

  //             doc.addFileToVFS("Arial.ttf", arialnormal);
  //             doc.addFont("Arial.ttf", "Arial", "normal");

  //             doc.setFontSize(8).setFont("Arial", "normal");

  //             // Wrap nicely into full paragraph
  //             const noteParagraph = doc.splitTextToSize(fullNotes, paragraphWidth);

  //             // Page break check
  //             yPosition = checkPageBreak(yPosition, noteParagraph.length * 3);

  //             // Print the paragraph
  //             doc.text(noteParagraph, leftMargin, yPosition);

  //             // Move cursor after block
  //             yPosition += noteParagraph.length * 3 + 5;

  //             doc.setFontSize(11);
  //           } else {
  //             yPosition += 2;
  //           }




  //         });

  //         if (idx !== actualTestData.length - 1) {
  //           yPosition += 3;
  //           yPosition = checkPageBreak(yPosition, 5);
  //           // doc.setDrawColor(0, 0, 0).setLineWidth(0.6);
  //           // doc.line(10, yPosition, pageWidth - 10, yPosition);
  //           yPosition += 4;
  //         } else {
  //           yPosition += 3;
  //         }
  //       });

  //       yPosition += 6;
  //       if (yPosition + 52 > maxContentHeight) {
  //         doc.addPage();
  //         yPosition = 20;
  //       }
  //       doc.setFontSize(10).setFont('helvetica', 'bold');
  //       doc.text('END OF REPORT', pageWidth / 2, yPosition + 24, { align: 'center' });
  //       yPosition += 9;

  //       actualPageCount = doc.internal.getNumberOfPages();
  //       if (includeHeader) {
  //         for (let i = 1; i <= actualPageCount; i++) {
  //           doc.setPage(i);
  //           addPersistentFooter(doc, pageWidth, pageHeight, i, actualPageCount);
  //         }
  //       }
  //     } catch (err) {
  //       console.error('Error in generateTestResultsTable:', err);
  //       doc.setFontSize(10).setFont('helvetica', 'normal').text('PDF Generation Error - Fallback Mode', 20, yPosition);
  //       yPosition += 15;
  //       actualPageCount = doc.internal.getNumberOfPages();
  //       if (includeHeader) {
  //         for (let i = 1; i <= actualPageCount; i++) {
  //           doc.setPage(i);
  //           addPersistentFooter(doc, pageWidth, pageHeight, i, actualPageCount);
  //         }
  //       }
  //     }

  //     return { yPosition, pageCount: actualPageCount };
  //   };
  // Replace the existing generateTestResultsTable function with this block


  // Replace the existing generateTestResultsTable function with this block
  const generateTestResultsTable = (doc, reportData, yPos, pageWidth, includeHeader = true) => {
    let yPosition = yPos;
    let actualPageCount = 1;
    const pageHeight = doc.internal.pageSize.getHeight();

    // Generate barcode for SID (needed for headers on all pages)
    const barcodeImg = generateBarcodeBase64(reportData.sid_number || 'N/A');

    try {
      const bottomMargin = 35;
      const maxContentHeight = pageHeight - bottomMargin;

      // Prepare the test data and header flag early so helper functions can use them.
      const actualTestData = transformReportDataForPDF(reportData) || [];
      const shouldDisplayHeaders = reportData?.test_items?.length && actualTestData?.some(cat => cat.tests?.length);

      // Function to add complete header section (logo, barcode, patient details) on any page
      const addCompleteHeaderSection = (currentY = 20) => {
        let headerY = currentY;

        // Add logo if available and header is enabled
        if (logoBase64 && includeHeader) {
          try {
            const logoHeight = 30;
            const logoWidth = logoHeight * 2.5;
            const logoX = 15;
            const logoY = 10;
            doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
          } catch (logoErr) {
            console.error('Failed to add logo to PDF on page:', logoErr);
          }
        }

        // Add patient report section with barcode
        const patientSectionStartY = includeHeader ? 55 : 50;
        headerY = generatePatientReportSection(doc, reportData, patientSectionStartY, pageWidth, barcodeImg);

        return headerY;
      };

      const addColumnHeaders = (currentY) => {
        // ensure fonts are available in VFS if you use them; keep as-is if already added elsewhere
        try { doc.addFileToVFS("Arial-Bold.ttf", fontBold); doc.addFont("Arial-Bold.ttf", "Arial", "bold"); } catch (e) { }
        try { doc.addFileToVFS("Arial.ttf", arialnormal); doc.addFont("Arial.ttf", "Arial", "normal"); } catch (e) { }
        doc.setFont("Arial", "bold").setFontSize(10).setTextColor(0, 0, 0);
        doc.text('INVESTIGATION / METHOD', 15, currentY);
        doc.text('RESULT', 85, currentY);
        doc.text('UNITS', 110, currentY);
        doc.text('BIOLOGICAL REFERENCE INTERVAL', 135, currentY);

        doc.setDrawColor(0, 0, 0).setLineWidth(0.3);
        doc.line(10, currentY + 2, pageWidth - 10, currentY + 2);
        return currentY + 10;
      };

      // FIXED: Smart page break that only adds headers when there's actual content to follow
      const checkPageBreak = (currentY, requiredSpace = 20, hasContentToFollow = true) => {
        if (currentY + requiredSpace > maxContentHeight) {
          doc.addPage();

          // Only add headers if there's actual content to follow
          if (hasContentToFollow) {
            // Add complete header section on new page
            let newY = addCompleteHeaderSection();
            newY += 10; // Add spacing after header

            // Add column headers if needed
            if (shouldDisplayHeaders) {
              newY += 5;
              doc.setDrawColor(0, 0, 0).setLineWidth(0.3);
              doc.line(10, newY, pageWidth - 10, newY);
              newY += 6;
              try { doc.addFileToVFS("verdana.ttf", verdana); doc.addFont("verdana.ttf", "verdana", "normal"); } catch (e) { }
              doc.setFont('verdana', 'bold').setFontSize(10);
              doc.text('Final Test Report', pageWidth / 2, newY, { align: 'center' });
              newY += 4;
              doc.line(10, newY, pageWidth - 10, newY);
              newY += 6;
              newY = addColumnHeaders(newY);
            }

            return newY;
          } else {
            // No headers needed, just return basic position
            return 20;
          }
        }
        return currentY;
      };

      const formatReferenceRange = (text, maxWidth = 120) => {
        if (!text || text.trim() === '') return [];

        // Clean up the text by removing extra spaces and normalizing formatting
        let cleanedText = text
          .replace(/\s+:/g, ':')           // Remove spaces before colons
          .replace(/:\s+/g, ': ')          // Normalize spaces after colons to single space
          .replace(/\s+/g, ' ')            // Replace multiple spaces with single space
          .trim();

        // Split by newlines and clean each line
        const lines = cleanedText.split('\n').map(line => line.trim()).filter(Boolean);

        // COMPACT FORMATTING: Process lines more efficiently to reduce vertical space
        const formattedLines = [];

        for (const line of lines) {
          if (line.includes(':')) {
            // OPTIMIZATION: Try to keep related ranges on the same line when possible
            // Split by major section headers but keep sub-ranges together
            const sections = line.split(/(?=\b(?:ADULT|CHILDREN|CHILD|MALE|FEMALE|NEW BORN|CORD BLOOD)\b)/i);

            for (const section of sections) {
              if (section.trim()) {
                // Clean up spacing around colons
                const cleanedSection = section
                  .replace(/\s*:\s*/g, ': ')     // Normalize colon spacing
                  .replace(/\s+/g, ' ')          // Single spaces
                  .trim();

                if (cleanedSection) {
                  // SPACE OPTIMIZATION: Try to fit multiple short ranges on one line
                  if (cleanedSection.length <= maxWidth * 0.8) {
                    formattedLines.push(cleanedSection);
                  } else {
                    // Split longer sections more intelligently
                    const parts = cleanedSection.split(/\s+(?=[A-Z][a-z]*\s*:)/);
                    for (const part of parts) {
                      if (part.trim()) {
                        formattedLines.push(part.trim());
                      }
                    }
                  }
                }
              }
            }
          } else {
            // Line without colons, just clean it up
            const cleanedLine = line.replace(/\s+/g, ' ').trim();
            if (cleanedLine) {
              formattedLines.push(cleanedLine);
            }
          }
        }

        // COMPACT WRAPPING: Use more aggressive wrapping to reduce line count
        const wrappedLines = [];
        for (const line of formattedLines) {
          // Use slightly wider wrapping to fit more text per line
          const wrapped = doc.splitTextToSize(line, maxWidth * 1.1);
          wrappedLines.push(...wrapped);
        }

        return wrappedLines;
      };


      // Header (Final Test Report + column headers)
      if (shouldDisplayHeaders) {
        yPosition += 1;
        doc.setDrawColor(0, 0, 0).setLineWidth(0.3);
        doc.line(10, yPosition, pageWidth - 10, yPosition);
        yPosition += 6;
        try { doc.addFileToVFS("verdana.ttf", verdana); doc.addFont("verdana.ttf", "verdana", "normal"); } catch (e) { }
        doc.setFont('verdana', 'bold').setFontSize(10);
        doc.text('Final Test Report', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 4;
        doc.line(10, yPosition, pageWidth - 10, yPosition);
        yPosition += 6;
        yPosition = addColumnHeaders(yPosition);
      } else {
        yPosition += 5;
      }

      // Layout constants
      const nameX = 16;
      const resultX = 85;
      const unitsX = 110;
      const refX = 135;
      // ensure right margin so ref column doesn't flow off the A4 page
      const rightMargin = 15;
      const refColumnWidth = pageWidth - refX - rightMargin;
      const lineHeight = 3.5; // OPTIMIZED: Reduced from 5 to 3.5 for more compact spacing

      // UPDATED: Helper to compute accurate block height for multi-line method/specimen format
      const estimateBlockHeight = (sub, test) => {
        const refLines = formatReferenceRange(sub.reference || test.reference || '', Math.max(30, refColumnWidth));

        // REVERTED: Calculate height for separate method and specimen lines
        const methodLines = ((sub.method || test.method) ? 1 : 0);
        const specimenLines = ((sub.specimen || test.specimen) ? 1 : 0);
        const totalMetaLines = methodLines + specimenLines;

        // COMPACT CALCULATION: More accurate height estimation
        const baselineHeight = 4; // Reduced from 6 to 4
        const refHeight = Math.max(0, refLines.length * lineHeight);
        const leftMetaHeight = totalMetaLines * 3; // 3 points per line for method and specimen

        // SPACE OPTIMIZATION: Reduced gap and more efficient calculation
        return baselineHeight + Math.max(refHeight, leftMetaHeight + 2) + 3; // Reduced gap from 6 to 3
      };

      // Iterate categories and tests
      actualTestData.forEach((category, cIdx) => {
        yPosition = checkPageBreak(yPosition, 15);

        // FIXED: Ensure all department headers are consistently bold
        try { doc.addFileToVFS("Arial-Bold.ttf", fontBold); doc.addFont("Arial-Bold.ttf", "Arial", "bold"); } catch (e) { }
        doc.setFont("Arial", "bold").setFontSize(10).setTextColor(0, 0, 0);
        doc.text(category.category, nameX, yPosition);
        yPosition += 6;

        (category.tests || []).forEach(test => {
          const subTests = Array.isArray(test.subTests) && test.subTests.length > 0 ? test.subTests : [test];

          subTests.forEach((sub) => {
            // Ensure enough space before starting block
            const estHeight = estimateBlockHeight(sub, test);
            yPosition = checkPageBreak(yPosition, estHeight);

            // ---------- baseline row: Test name (left) and Result/Unit/Reference (right) ----------
            const baselineY = yPosition;

            // Test / Parameter name at left (baseline)
            doc.setFont('verdana', 'normal').setFontSize(9);
            const displayName = sub.name || test.name || 'Test';
            doc.text(displayName, nameX, baselineY);

            // Result (bold) at same baseline
            doc.setFont('Arial', 'normal').setFontSize(9);
            const resultText = (sub.result !== undefined && sub.result !== null) ? String(sub.result) : (test.result !== undefined && test.result !== null ? String(test.result) : '-');
            doc.text(resultText, resultX, baselineY);

            // Unit (bold) same baseline
            if (sub.unit || test.unit) {
              doc.setFont('Arial', 'normal').setFontSize(9);
              doc.text(sub.unit || test.unit || '', unitsX, baselineY);
            }

            // OPTIMIZED: Reference interval with compact formatting
            const rawReference = sub.reference || test.reference || '';
            const refLines = formatReferenceRange(rawReference, Math.max(65, refColumnWidth)); // Slightly wider for better text fitting

            try {

            } catch (e) { }

            // COMPACT FONT: Reduced font size from 8 to 7 for more compact display
            doc.setFont('verdana', 'normal').setFontSize(8.5);

            for (let i = 0; i < refLines.length; i++) {
              const lineY = baselineY + (i * lineHeight);

              // FIXED: Smart page break - only add headers if there are more reference lines to follow
              if (lineY + 3 > maxContentHeight) {
                const hasMoreContent = (i < refLines.length - 1); // Check if there are more reference lines

                doc.addPage();

                // Only add headers if there's more content to follow
                if (hasMoreContent) {
                  // Add complete header section on new page
                  let newPageY = addCompleteHeaderSection();
                  newPageY += 10; // Add spacing after header

                  // Add column headers if needed
                  if (shouldDisplayHeaders) {
                    newPageY += 5;
                    doc.setDrawColor(0, 0, 0).setLineWidth(0.3);
                    doc.line(10, newPageY, pageWidth - 10, newPageY);
                    newPageY += 6;
                    try { doc.addFileToVFS("verdana.ttf", verdana); doc.addFont("verdana.ttf", "verdana", "normal"); } catch (e) { }
                    doc.setFont('verdana', 'bold').setFontSize(10);
                    doc.text('Final Test Report', pageWidth / 2, newPageY, { align: 'center' });
                    newPageY += 4;
                    doc.line(10, newPageY, pageWidth - 10, newPageY);
                    newPageY += 6;
                    newPageY = addColumnHeaders(newPageY);
                  }

                  // Reset baseline for continued content
                  baselineY = newPageY;
                } else {
                  // No more content, just use basic position
                  baselineY = 20;
                }
              }

              // Print formatted reference range line by line with compact spacing
              doc.text(refLines[i], refX, baselineY + (i * lineHeight), { align: "left" });
            }


            // REVERTED: Method & Specimen on separate lines below test name
            const leftMetaStartY = baselineY + lineHeight + 1;
            let leftMetaCurrentY = leftMetaStartY;
            doc.setFont('verdana', 'normal').setFontSize(7);

            // Display method on its own line - aligned with test name
            if (sub.method || test.method) {
              doc.text(`( Method: ${sub.method || test.method} )`, nameX, leftMetaCurrentY);
              leftMetaCurrentY += 3; // 3-4 points spacing between lines
            }

            // Display specimen on its own line - aligned with test name
            if (sub.specimen || test.specimen) {
              doc.text(`( Specimen: ${sub.specimen || test.specimen} )`, nameX, leftMetaCurrentY);
              leftMetaCurrentY += 3; // 3-4 points spacing between lines
            }

            // OPTIMIZED: More compact block height calculation
            const refBlockHeight = Math.max(0, refLines.length * lineHeight);
            const leftMetaBlockHeight = Math.max(0, leftMetaCurrentY - leftMetaStartY);
            const blockHeight = Math.max(refBlockHeight, leftMetaBlockHeight + lineHeight);
            // COMPACT SPACING: Reduced advancement for tighter layout
            yPosition = baselineY + Math.max(4, blockHeight) + 2; // Reduced from 6 and 4 to 4 and 2

            // OPTIMIZED: Notes with compact spacing
            const notesText = (sub.notes && sub.notes.trim()) ? sub.notes.trim() : ((test.notes && test.notes.trim()) ? test.notes.trim() : '');
            if (notesText) {
              const noteLeftMargin = nameX;
              const noteWidth = pageWidth - noteLeftMargin - rightMargin;
              const noteLines = doc.splitTextToSize(`Notes : ${notesText}`, noteWidth);
              yPosition = checkPageBreak(yPosition, noteLines.length * 2.5 + 3); // Reduced spacing
              doc.setFont('verdana', 'normal').setFontSize(7); // Reduced from 8 to 7
              doc.text(noteLines, noteLeftMargin, yPosition);
              yPosition += noteLines.length * 2.5 + 3; // Reduced from 3 and 6 to 2.5 and 3
            }

            // COMPACT: Reduced gap between parameters
            yPosition += 1; // Reduced from 2 to 1
          }); // end subTests loop

        }); // end test loop

        // OPTIMIZED: Reduced gap between categories
        if (cIdx !== actualTestData.length - 1) {
          yPosition = checkPageBreak(yPosition, 5); // Reduced from 8 to 5
          yPosition += 3; // Reduced from 6 to 3
        }
      }); // end categories loop

      // OPTIMIZED: Reduced end marker spacing
      yPosition += 3; // Reduced from 6 to 3
      if (yPosition + 52 > maxContentHeight) {
        doc.addPage();

        // FIXED: Don't add headers for "End of Report" - it's just a marker
        yPosition = 20; // Simple position without headers
      }
      doc.setFontSize(10).setFont('helvetica', 'bold');
      doc.text('End of the Report', pageWidth / 2, yPosition + 24, { align: 'center' });
      yPosition += 9;

      actualPageCount = doc.internal.getNumberOfPages();

      // Add persistent footer to all pages
      for (let i = 1; i <= actualPageCount; i++) {
        doc.setPage(i);
        addPersistentFooter(doc, pageWidth, pageHeight, i, actualPageCount);
      }

    } catch (err) {
      console.error('Error in generateTestResultsTable:', err);
      doc.setFontSize(10).setFont('helvetica', 'normal').text('PDF Generation Error - Fallback Mode', 20, yPosition);
      yPosition += 15;
      actualPageCount = doc.internal.getNumberOfPages();

      // Add persistent footer to all pages even in error case
      for (let i = 1; i <= actualPageCount; i++) {
        doc.setPage(i);
        addPersistentFooter(doc, pageWidth, pageHeight, i, actualPageCount);
      }
    }

    return { yPosition, pageCount: actualPageCount };
  };


  // Load signature image function with background removal
  const loadSignatureImage = () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Optional but helpful
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (e) => {
        console.warn('❌ Signature image failed to load:', e);
        resolve(null);
      };
      img.src = `http://localhost:5001/signature.jpeg`;
    });
  };


  // Generate QR Code and Signature Section (Final Page Only)
  const generateQRCodeAndSignatureSection = async (doc, qrCodeImg, pageWidth, pageHeight, contentEndY = 0, totalPages = 1) => {
    try {
      // Load signature image
      const signatureImg = await loadSignatureImage();



      // OPTIMIZED positioning - use available space efficiently
      const minBottomMargin = 50; // Reduced from 100 for better space utilization
      const availableSpace = pageHeight - contentEndY - minBottomMargin;
      const signatureSectionHeight = 45; // Actual height needed for signatures

      // Position signatures optimally - either right after content or at bottom if space is tight
      const signatureY = availableSpace >= signatureSectionHeight
        ? contentEndY + 10  // Place right after content if space allows
        : pageHeight - minBottomMargin - signatureSectionHeight; // Otherwise position at bottom


      // Signatures section with improved readability
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);

      // DYNAMIC Left signature - "Verified By" section with user-specific information
      console.log('🔖 Adding dynamic left signature...');
      doc.setTextColor(0, 0, 0);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(15, signatureY + 5, 75, signatureY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Verified By', 45, signatureY + 15, { align: 'center' });

      // Use dynamic user information for verification signature
      const verifierName = currentUser?.role === 'lab_technician' || currentUser?.role === 'technician'
        ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim()
        : currentUser?.first_name && currentUser?.last_name
          ? `${currentUser.first_name} ${currentUser.last_name}`
          : 'Lab Technician';

      const verifierRole = currentUser?.role === 'lab_technician' ? 'Lab Technician'
        : currentUser?.role === 'technician' ? 'Medical Technician'
          : currentUser?.role === 'doctor' ? 'Medical Officer'
            : 'Lab Technician';

      doc.text(verifierName, 45, signatureY + 22, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(verifierRole, 45, signatureY + 28, { align: 'center' });
      console.log('🔖 Dynamic left signature added:', verifierName, verifierRole);

      // QR Code positioned in center with enhanced visibility
      console.log('🔖 Adding QR code...', qrCodeImg ? 'QR code available' : 'No QR code');
      if (qrCodeImg) {
        const qrSize = 20; // Increased size for better visibility
        const qrX = (pageWidth / 2) - (qrSize / 2);
        const qrY = signatureY + 10; // Better positioning

        // Add white background for QR code
        doc.setFillColor(255, 255, 255);
        doc.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 'F');

        doc.addImage(qrCodeImg, 'PNG', qrX, qrY, qrSize, qrSize);
        console.log('🔖 QR code added at position:', qrX, qrY, 'size:', qrSize);
      } else {
        // Add more visible placeholder if QR code is not available
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('QR CODE', pageWidth / 2, signatureY + 5, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('(Report Verification)', pageWidth / 2, signatureY + 12, { align: 'center' });
        console.log('🔖 QR code placeholder added with enhanced visibility');
      }

      // Right signature area with enhanced professional formatting - signature above line
      console.log('🔖 Adding right signature...');
      const rightSigX = pageWidth - 15; // Better margin

      // DYNAMIC authorization signature based on user context and tenant
      const authorizerName = currentUser?.role === 'admin' || currentUser?.role === 'manager'
        ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim()
        : currentTenantContext?.manager_name || 'Dr. S.Asokkumar, PhD.';

      const authorizerTitle = currentUser?.role === 'admin' ? 'Laboratory Administrator'
        : currentUser?.role === 'manager' ? 'Laboratory Manager'
          : currentUser?.role === 'doctor' ? 'Medical Director'
            : currentTenantContext?.manager_title || 'Clinical Microbiologist & QM';

      // DOCTOR NAME: First display the doctor name at the top
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(authorizerName, rightSigX, signatureY + 22, { align: 'right' });


      console.log("singature img", signatureImg);
      // SIGNATURE: Position signature above the line
      if (signatureImg) {
        // Add actual signature image above the line
        const sigWidth = 40;
        const sigHeight = 10;
        const sigX = rightSigX - 20 - (sigWidth / 2);
        doc.addImage(signatureImg, 'PNG', sigX, signatureY + 8, sigWidth, sigHeight);
      } else {
        // Fallback to text-based signature above the line
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        // doc.text('_________________', rightSigX - 35, signatureY, { align: 'center' });
      }

      // LINE: Position line below signature
      doc.setDrawColor(0, 0, 0); // Darker line for better visibility
      doc.setLineWidth(0.3);
      doc.line(rightSigX - 70, signatureY + 5, rightSigX, signatureY + 5);

      // "AUTHORIZED BY" TEXT: Position below the line
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      // doc.text('Authorized By', rightSigX, signatureY + 16, { align: 'right' });

      console.log('Professional signature positioning:', {
        doctorName: authorizerName,
        doctorNameY: signatureY - 10,
        signatureY: signatureY,
        referenceLineY: signatureY + 5,
        positioning: 'signature above reference line, above Authorized By'
      });

      // TITLE: Below "Authorized By" text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(authorizerTitle, rightSigX, signatureY + 28, { align: 'right' });
      console.log('🔖 Dynamic right signature added:', authorizerName, authorizerTitle);

      // Note: Footer will be added at the end with correct page numbering
      console.log('🔖 QR code and signature section completed successfully');
      console.log('🔖 Final signature Y position:', signatureY);
      console.log('🔖 All elements should now be visible in PDF');

    } catch (err) {
      console.error('❌ Error in generateQRCodeAndSignatureSection:', err);
      console.error('❌ Error stack:', err.stack);
      console.error('❌ This may cause QR code and signatures to not appear');
    }
  };





  const handleSampleStatusChange = async (index, newStatus) => {
    try {
      const testItem = report.test_items?.[index];
      const sid = report?.sid_number;

      if (!sid || !testItem || !testItem.id) {
        console.error('Missing sid or test_id', { sid, testItem });
        return; // Stop if required data is missing
      }

      const sample_received = newStatus === 'Received';
      const sample_received_timestamp = sample_received
        ? new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        : null;


      const payload = {
        sample_status: newStatus,
        sample_received,
        sample_received_timestamp,
      };

      const response = await billingReportsAPI.updateSampleStatus(
        sid,
        testItem.id,
        payload
      );

      if (response.success) {
        const updatedReport = { ...report };
        const updatedTestItems = [...updatedReport.test_items];

        updatedTestItems[index] = {
          ...updatedTestItems[index],
          ...payload,
        };

        updatedReport.test_items = updatedTestItems;
        setReport(updatedReport);
      } else {
        console.error('API Error:', response.error);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };


  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="billing-reports-detail-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0 text-gray-800">
            <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
            Billing Report Details
          </h1>
          <Button variant="secondary" onClick={handleBack}>
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back
          </Button>
        </div>
        <Alert variant="danger">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          {error}
        </Alert>
      </div>
    );
  }

  // No report found
  if (!report) {
    return (
      <div className="billing-reports-detail-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0 text-gray-800">
            <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
            Billing Report Details
          </h1>
          <Button variant="secondary" onClick={handleBack}>
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back
          </Button>
        </div>
        <Alert variant="warning">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          Report not found for SID: {sid}

        </Alert>
      </div>
    );
  }

  return (
    <div className="billing-reports-detail-container">
      {/* Inject custom styles */}
      <style>{sectionStyles}</style>
      <style>{`
        .table-warning {
          background-color: #fff3cd !important;
        }
        .inline-edit-field {
          border: 1px solid #007bff;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 0.875rem;
        }
        .inline-edit-field:focus {
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
          border-color: #80bdff;
        }
        .test-result-cell {
          min-width: 100px;
        }
        .edit-actions {
          white-space: nowrap;
        }
        .test-details-table .table td {
          vertical-align: middle;
          padding: 0.5rem 0.25rem;
        }
        .test-details-table .table th {
          padding: 0.75rem 0.25rem;
          font-size: 0.875rem;
        }
      `}</style>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
          Billing Report Details
          <Badge bg="primary" className="ms-2">{report.sid_number}</Badge>
        </h1>
        <div>
          <Button variant="secondary" onClick={handleBack} className="me-2">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back
          </Button>
          {editMode ? (
            <>
              <Button
                variant="success"
                onClick={handleSave}
                disabled={saving}
                className="me-2"
              >
                {saving ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="me-1" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="me-1" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button variant="outline-secondary" onClick={handleEditToggle}>
                <FontAwesomeIcon icon={faTimes} className="me-1" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline-primary" onClick={handleEditToggle} className="me-2">
                <FontAwesomeIcon icon={faEdit} className="me-1" />
                Edit Report
              </Button>
              {/* Send for Authorization Button - Show only if report has edits and is not authorized */}
              {/* report && !report.authorized && editMode && */}
              {(
                <Button
                  variant="outline-success"
                  onClick={handleSendForAuthorization}
                  className="me-2"
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                  Send for Authorization
                </Button>
              )}
              {/* Direct Authorization Button - Show only if report is completed but not authorized and not in edit mode */}
              {report && report.status === 'completed' && !report.authorized && !editMode && (
                <Button
                  variant="outline-warning"
                  onClick={handleSendForAuthorization}
                  className="me-2"
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                  Authorize Report
                </Button>
              )}
              {/* Show authorization status if already authorized */}
              {report && report.authorized && (
                <Badge bg="success" className="me-2 p-2">
                  <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                  Authorized
                </Badge>
              )}
              <Button
                variant="success"
                onClick={handleDownloadPDF}
                disabled={downloadingPDF || !report.authorized}
                className={` gap-2 px-4 py-2 rounded shadow-sm fw-semibold ${downloadingPDF || !report.authorized ? 'opacity-75' : ''
                  }`}
              >
                {downloadingPDF ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Downloading...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faDownload} />
                    Download PDF
                  </>
                )}
              </Button>

            </>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          {error}
        </Alert>
      )}

      {/* PDF Options - Only show when not in edit mode */}
      {!editMode && (
        <Card className="mb-4">
          <Card.Body>
            <h6 className="text-primary mb-3">
              <FontAwesomeIcon icon={faDownload} className="me-2" />
              PDF Download Options
            </h6>
            <Row>
              <Col md={6}>
                <Form.Check
                  type="checkbox"
                  id="include-header-checkbox"
                  label="Include Header in PDF"
                  checked={includeHeader}
                  onChange={(e) => setIncludeHeader(e.target.checked)}
                  className="mb-2 text-white"
                />
                <small className="text-white">
                  When checked, the PDF will include the AVINI LABS header with logo and company information.
                  When unchecked, the PDF will start directly with patient and test information.
                </small>
              </Col>
              <Col md={6}>
                <div className="d-flex align-items-center mb-3">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-info me-2" />
                  <small className="text-white">
                    The PDF includes a QR code that links directly to this report for easy access and verification.
                  </small>
                </div>
                <Button
                  variant="outline-info"
                  size="sm"
                  onClick={() => {
                    console.log('=== BILLING REPORT PDF DEBUG INFO ===');
                    console.log('Current User:', currentUser);
                    console.log('Current Tenant:', currentTenantContext);
                    console.log('Full Report Data:', report);
                    console.log('Report Keys:', Object.keys(report || {}));
                    console.log('Patient Info:', report?.patient_info);
                    console.log('Test Items:', report?.test_items);
                    console.log('Billing Items:', report?.billing_items);
                    console.log('Clinic Info:', report?.clinic_info);
                    console.log('Financial Summary:', report?.financial_summary);
                    console.log('SID Number:', report?.sid_number);
                    console.log('PDF Libraries Status:');
                    console.log('- jsPDF available:', typeof jsPDF !== 'undefined');
                    console.log('- QRCode available:', typeof QRCode !== 'undefined');
                    console.log('- JsBarcode available:', typeof JsBarcode !== 'undefined');
                    console.log('- autoTable available:', autoTableAvailable);
                    console.log('User Access Level:', currentUser?.role);
                    console.log('User Tenant ID:', currentUser?.tenant_id);
                    console.log('Report Tenant ID:', report?.tenant_id);
                    console.log('Data Filtering Status:', currentUser?.tenant_id === report?.tenant_id ? 'MATCH - User can access this report' : 'MISMATCH - Check access permissions');

                    // Test data transformation
                    const transformedData = transformReportDataForPDF(report);
                    console.log('Transformed Test Data:', transformedData);

                    console.log('=== END BILLING REPORT DEBUG INFO ===');
                    alert('Check browser console for detailed billing report PDF debug information');
                  }}
                  className="me-2"
                >
                  Debug Report Data
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    console.log('Testing PDF libraries...');
                    console.log('jsPDF available:', typeof jsPDF !== 'undefined');
                    console.log('QRCode available:', typeof QRCode !== 'undefined');
                    console.log('JsBarcode available:', typeof JsBarcode !== 'undefined');
                    console.log('autoTable available:', autoTableAvailable);
                    alert('Check browser console for PDF library status');
                  }}
                >
                  Test Libraries
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Edit Mode Information */}
      {editMode && (
        <Alert variant="info" className="mb-4">
          <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
          <strong>Edit Mode:</strong>
          <span className="ms-2">
            <Badge bg="secondary" className="me-2">
              <i className="fas fa-lock me-1"></i>Locked sections
            </Badge>
            contain existing data that cannot be modified.
          </span>
          <span className="ms-2">
            <Badge bg="success" className="me-2">
              <i className="fas fa-edit me-1"></i>Editable sections
            </Badge>
            allow you to add new sample and processing information.
          </span>
        </Alert>
      )}

      {/* Report Content - Exact replica of modal content */}
      <div>
        {/* Report Header */}
        <Row className="mb-4">
          <Col md={6}>
            <Card className={`border-left-primary h-100 ${editMode ? 'locked-section' : ''}`}>
              <Card.Body>
                <h6 className="text-primary mb-2">
                  Report Information
                  {editMode && (
                    <Badge bg="" className="ms-2 small">
                      <i className="fas fa-lock me-1"></i>Locked
                    </Badge>
                  )}
                </h6>
                {/* Always show as read-only in edit mode - this data is locked */}
                <p className="mb-1 text-white"><strong>SID Number:</strong> {report.sid_number}</p>
                <p className="mb-1 text-white"><strong>Billing Date:</strong> {billingReportsAPI.formatDate(report.billing_date)}</p>
                <p className="mb-1 text-white"><strong>Generated:</strong> {billingReportsAPI.formatDateTime(report.generation_timestamp)}</p>
                <p className="mb-0 text-white"><strong>Status:</strong> <Badge bg={billingReportsAPI.getStatusVariant(report.metadata?.status)}>{report.metadata?.status}</Badge></p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className={`border-left-info h-100 ${editMode ? 'locked-section' : ''}`}>
              <Card.Body>
                <h6 className="text-info mb-2">
                  Clinic Information
                  {editMode && (
                    <Badge bg="secondary" className="ms-2 small">
                      <i className="fas fa-lock me-1"></i>Locked
                    </Badge>
                  )}
                </h6>
                {/* Always show as read-only in edit mode - this data is locked */}
                <p className="mb-1 text-white"><strong>Clinic:</strong> {report.clinic_info?.name}</p>
                <p className="mb-1 text-white"><strong>Site Code:</strong> {report.clinic_info?.site_code}</p>
                <p className="mb-1 text-white"><strong>Contact:</strong> {report.clinic_info?.contact_phone}</p>
                <p className="mb-0 text-white"><strong>Email:</strong> {report.clinic_info?.email}</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Patient Information - Locked in Edit Mode */}
        <div className={editMode ? 'locked-section' : ''}>
          <h6 className="text-primary mb-3">
            <FontAwesomeIcon icon={faUser} className="me-2" />
            Patient Information
            {editMode && (
              <Badge bg="secondary" className="ms-2 small">
                <i className="fas fa-lock me-1"></i>Locked
              </Badge>
            )}
          </h6>
          <Row className="mb-3">
            <Col md={6}>
              <p className="mb-1"><strong>Name:</strong> {report.patient_info?.full_name}</p>
              <p className="mb-1"><strong>Patient ID:</strong> {report.patient_info?.patient_id}</p>
              <p className="mb-1"><strong>Date of Birth:</strong> {billingReportsAPI.formatDate(report.patient_info?.date_of_birth)}</p>
            </Col>
            <Col md={6}>
              <p className="mb-1"><strong>Age/Gender:</strong> {report.patient_info?.age} / {report.patient_info?.gender}</p>
              <p className="mb-1"><strong>Blood Group:</strong> {report.patient_info?.blood_group || 'N/A'}</p>
              <p className="mb-1"><strong>Mobile:</strong> {report.patient_info?.mobile}</p>
            </Col>
          </Row>
          {report.patient_info?.email && (
            <Row className="mb-3">
              <Col md={12}>
                <p className="mb-1"><strong>Email:</strong> {report.patient_info?.email}</p>
              </Col>
            </Row>
          )}
        </div>

        <div className="mb-4">
          <h6 className="text-primary mb-3">
            <FontAwesomeIcon icon={faVial} className="me-2" />
            Test Details ({(report.test_items || []).length} tests)
          </h6>

          {report.test_items && report.test_items.length > 0 ? (
            <Card className="test-results-table test-details-table">
              <Card.Body className="p-0">
                <Table responsive striped hover className="mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th style={{ width: '3%' }}>#</th>
                      <th style={{ width: '20%' }}>Test Name</th>
                      <th style={{ width: '8%' }}>billing_date</th>
                      <th style={{ width: '10%' }}>Patient Name</th>
                      <th style={{ width: '12%' }}>Method</th>
                      <th style={{ width: '12%' }}>Specimen</th>
                      <th style={{ width: '12%' }}>Container</th>

                      <th style={{ width: '12%' }}>Sample Status</th>


                    </tr>
                  </thead>
                  <tbody>
                    {report.test_items.map((test, index) => {
                      const isEditing = editingTestId === index;
                      const isProfileSubtest = test.is_profile_subtest;
                      const isFirstSubtest = isProfileSubtest && test.subtest_index === 1;
                      const parentProfileName = test.parent_profile_name;

                      return (
                        <React.Fragment key={index}>
                          {/* Profile Header Row - only show for first sub-test of a profile */}
                          {isFirstSubtest && (
                            <tr className="table-info">
                              <td colSpan="8" className="text-center py-2">
                                <div className="d-flex align-items-center justify-content-center">
                                  <FontAwesomeIcon icon={faLayerGroup} className="me-2 text-primary" />
                                  <strong>Profile: {parentProfileName}</strong>
                                  <Badge bg="primary" className="ms-2">
                                    {test.total_subtests} tests
                                  </Badge>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Individual Test Row */}
                          <tr className={`${isEditing ? 'table-warning' : ''} ${isProfileSubtest ? 'table-light' : ''}`}>
                            <td className="text-center">
                              <Badge bg={isProfileSubtest ? "info" : "secondary"} className="rounded-pill">
                                {isProfileSubtest ? `${test.subtest_index}` : index + 1}
                              </Badge>
                            </td>
                            <td>
                              <div className="fw-bold text-dark">
                                {isProfileSubtest && (
                                  <FontAwesomeIcon icon={faArrowRight} className="me-2 text-muted" />
                                )}
                                {test.test_name || test.name || 'Unknown Test'}
                              </div>
                              {isProfileSubtest && (
                                <div>
                                  <small className="text-info">
                                    <FontAwesomeIcon icon={faLayerGroup} className="me-1" />
                                    Part of {parentProfileName}
                                  </small>
                                </div>
                              )}
                            </td>
                            <td>

                              <span className="text-primary fw-bold">
                                {report.billing_date || '-'}
                              </span>

                            </td>
                            <td>

                              <span className="text-primary fw-bold">
                                {report?.patient_info?.full_name || '-'}
                              </span>

                            </td>

                            <td>
                              {
                                <span className="text-muted">
                                  {test.method || test.test_master_data?.method || 'Standard'}
                                </span>
                              }
                            </td>
                            <td>
                              {
                                <span className="text-muted">
                                  {test.specimen || test.test_master_data?.specimen || 'Blood'}
                                </span>
                              }
                            </td>
                            <td>
                              {(
                                <span className="text-muted">
                                  {test.container || test.test_master_data?.container || 'Standard'}
                                </span>
                              )}
                            </td>


                            <td>
                              <Form.Select
                                size="sm"
                                value={report.test_items[index].sample_status || ''}
                                onChange={(e) => handleSampleStatusChange(index, e.target.value)}
                              >
                                <option value="">Select</option>
                                <option value="Received">Received</option>
                                <option value="Not Received">Not Received</option>
                              </Form.Select>

                              <div style={{ marginTop: '4px', fontSize: '0.875rem', color: '#555' }}>
                                Status: <strong>{report.test_items[index].sample_status || 'Not selected'}</strong>
                              </div>
                            </td>


                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          ) : (
            <Alert variant="info" className="text-center">
              <FontAwesomeIcon icon={faVial} className="me-2" />
              No test items found in this report.
            </Alert>
          )}
        </div>

        {/* Test Items - Clean Table Layout */}
        <div className="mb-4">
          <h6 className="text-primary mb-3">
            <FontAwesomeIcon icon={faVial} className="me-2" />
            Test Details ({(report.test_items || []).length} tests)
          </h6>

          {report.test_items && report.test_items.length > 0 ? (
            <Card className="test-results-table test-details-table">
              <Card.Body className="p-0">
                <Table responsive striped hover className="mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th style={{ width: '3%' }}>#</th>
                      <th style={{ width: '20%' }}>Test Name</th>
                      <th style={{ width: '8%' }}>Result</th>
                      <th style={{ width: '10%' }}>Department</th>

                      <th style={{ width: '12%' }}>Method</th>
                      <th style={{ width: '12%' }}>Specimen</th>
                      <th style={{ width: '12%' }}>Container</th>
                      {/* <th style={{ width: '10%' }}>Status</th> */}
                      <th style={{ width: '10%' }}>Result_unit</th>
                      <th style={{ width: '10%' }}>Reference Range</th>
                      {/* <th style={{ width: '5%' }}>Actions</th> */}

                    </tr>
                  </thead>
                  <tbody>
                    {report.test_items.map((test, index) => {
                      const isEditing = editingTestId === index;
                      const isProfileSubtest = test.is_profile_subtest;
                      const isFirstSubtest = isProfileSubtest && test.subtest_index === 1;
                      const parentProfileName = test.parent_profile_name;

                      return (
                        <React.Fragment key={index}>
                          {/* Profile Header Row - only show for first sub-test of a profile */}
                          {isFirstSubtest && (
                            <tr className="table-info">
                              <td colSpan="10" className="text-center py-2">
                                <div className="d-flex align-items-center justify-content-center">
                                  <FontAwesomeIcon icon={faLayerGroup} className="me-2 text-primary" />
                                  <strong>Profile: {parentProfileName}</strong>
                                  <Badge bg="primary" className="ms-2">
                                    {test.total_subtests} tests
                                  </Badge>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Individual Test Row */}
                          <tr className={`${isEditing ? 'table-warning' : ''} ${isProfileSubtest ? 'table-light' : ''}`}>
                            <td className="text-center">
                              <Badge bg={isProfileSubtest ? "info" : "secondary"} className="rounded-pill">
                                {isProfileSubtest ? `${test.subtest_index}` : index + 1}
                              </Badge>
                            </td>
                            <td>
                              <div className="fw-bold text-dark">
                                {isProfileSubtest && (
                                  <FontAwesomeIcon icon={faArrowRight} className="me-2 text-muted" />
                                )}
                                {test.test_name || test.name || 'Unknown Test'}
                              </div>
                              {test.test_code && (
                                <small className="text-muted">
                                  Code: {test.test_code}
                                </small>
                              )}
                              {isProfileSubtest && (
                                <div>
                                  <small className="text-info">
                                    <FontAwesomeIcon icon={faLayerGroup} className="me-1" />
                                    Part of {parentProfileName}
                                  </small>
                                </div>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <Form.Control
                                  type="text"
                                  size="sm"
                                  value={testEditData.result || ''}
                                  onChange={(e) => handleTestFieldChange('result', e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault(); // prevent form submission or newline
                                      saveTestChanges(index);
                                    }
                                  }}
                                  placeholder="Enter result"
                                />
                              ) : (
                                <span className="text-primary fw-bold"
                                  style={{ cursor: "pointer" }} // make it look clickable
                                  onClick={() => startEditingTest(index, test)}>
                                  {test.result || '-'}
                                </span>
                              )}
                            </td>
                            <td>
                              <Badge bg="info" className="text-white">
                                {test.department || test.test_master_data?.department || 'General'}
                              </Badge>
                            </td>

                            <td>
                              {isEditing ? (
                                <Form.Control
                                  type="text"
                                  size="sm"
                                  value={testEditData.method || ''}
                                  onChange={(e) => handleTestFieldChange('method', e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault(); // prevent form submission or newline
                                      saveTestChanges(index);
                                    }
                                  }}
                                >
                                  {/* <option value="">Select Method</option>
                                {masterData.methods.map(method => (
                                  <option key={method.id} value={method.method || method.name}>
                                    {method.method || method.name}
                                  </option>
                                ))} */}
                                </Form.Control>
                              ) : (
                                <span className="text-muted"
                                  style={{ cursor: "pointer" }} // make it look clickable
                                  onClick={() => startEditingTest(index, test)}
                                >
                                  {test.method || test.test_master_data?.method || 'Standard'}
                                </span>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <Form.Control
                                  type="text"
                                  size="sm"
                                  value={testEditData.specimen || ''}
                                  onChange={(e) => handleTestFieldChange('specimen', e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault(); // prevent form submission or newline
                                      saveTestChanges(index);
                                    }
                                  }}
                                >
                                  {/* <option value="">Select Specimen</option>
                                {masterData.specimens.map(specimen => (
                                  <option key={specimen.id} value={specimen.specimen || specimen.name}>
                                    {specimen.specimen || specimen.name}
                                  </option>
                                ))} */}
                                </Form.Control>
                              ) : (
                                <span className="text-muted"
                                  style={{ cursor: "pointer" }} // make it look clickable
                                  onClick={() => startEditingTest(index, test)}>
                                  {test.specimen || test.test_master_data?.specimen || 'Blood'}
                                </span>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <Form.Control
                                  type="text"
                                  size="sm"
                                  value={testEditData.container || ''}
                                  onChange={(e) => handleTestFieldChange('container', e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault(); // prevent form submission or newline
                                      saveTestChanges(index);
                                    }
                                  }}
                                >
                                  {/* <option value="">Select Container</option>
                                {masterData.containers.map(container => (
                                  <option key={container.id} value={container.container || container.name}>
                                    {container.container || container.name}
                                  </option>
                                ))} */}
                                </Form.Control>
                              ) : (
                                <span className="text-muted"
                                  style={{ cursor: "pointer" }} // make it look clickable
                                  onClick={() => startEditingTest(index, test)}
                                >
                                  {test.container || test.test_master_data?.container || 'Standard'}
                                </span>
                              )}
                            </td>


                            <td>
                              {/* {isEditing ? (
 
    
      <Form.Control
        type="text"
        size="sm"
        className="mb-1"
        value={testEditData.result_unit || ''}
        onChange={(e) => handleTestFieldChange('result_unit', e.target.value)}
        placeholder="Unit (e.g., mg/dL)"
      />) */}
                              {/* :(     */}
                              {/* <p className="text-muted" style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}> */}
                              {test.resultUnit || test.test_master_data?.resultUnit || 'N/A'}
                              {/* </p> */}
                              {/*  */}
                              {/* )} */}
                            </td>
                            <td className="text-muted" style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                              {/* {isEditing ? (  <Form.Control
  style={{ width: '12%' }}
        type="text"
        size="sm"
        value={testEditData.reference_range || ''}
        onChange={(e) => handleTestFieldChange('reference_range', e.target.value)}
        placeholder="Reference Range"
      />
  ) : ( */}
                              {/* <p className="text-muted" style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}> */}
                              {test.reference_range || test.referenceRange || 'N/A'}
                              {/* </p> */}

                              {/* )} */}
                            </td>
                            {/* <td>
                              {isEditing ? (
                                <div className="d-flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="success"
                                    onClick={() => saveTestChanges(index)}
                                    disabled={savingChanges}
                                    title="Save changes"
                                  >
                                    <FontAwesomeIcon icon={savingChanges ? faSpinner : faCheck} spin={savingChanges} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={cancelEditingTest}
                                    disabled={savingChanges}
                                    title="Cancel editing"
                                  >
                                    <FontAwesomeIcon icon={faTimes} />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => startEditingTest(index, test)}
                                  title="Edit test details"
                                >
                                  <FontAwesomeIcon icon={faPencilAlt} />
                                </Button>
                              )}
                            </td> */}
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          ) : (
            <Alert variant="info" className="text-center">
              <FontAwesomeIcon icon={faVial} className="me-2" />
              No test items found in this report.
            </Alert>
          )}
        </div>

        {/* Unmatched Tests Warning */}
        {report.unmatched_tests && report.unmatched_tests.length > 0 && (
          <Alert variant="warning" className="mb-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            <strong>Unmatched Tests ({report.unmatched_tests.length}):</strong>
            <ul className="mb-0 mt-2">
              {report.unmatched_tests.map((test, index) => (
                <li key={index}>{test}</li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Financial Summary - Locked in Edit Mode */}
        {/* {report.financial_summary && (
          <div className={editMode ? 'locked-section' : ''}>
            <h6 className="text-primary mb-3">
              <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
              Financial Summary
              {editMode && (
                <Badge bg="secondary" className="ms-2 small">
                  <i className="fas fa-lock me-1"></i>Locked
                </Badge>
              )}
            </h6>
            <Row>
              <Col md={6}>
                <p className="mb-1"><strong>Bill Amount:</strong> {billingReportsAPI.formatCurrency(report.financial_summary.bill_amount)}</p>
                <p className="mb-1"><strong>Other Charges:</strong> {billingReportsAPI.formatCurrency(report.financial_summary.other_charges)}</p>
                <p className="mb-1"><strong>Discount ({report.financial_summary.discount_percent}%):</strong> {billingReportsAPI.formatCurrency(report.financial_summary.discount_amount)}</p>
                <p className="mb-1"><strong>Subtotal:</strong> {billingReportsAPI.formatCurrency(report.financial_summary.subtotal)}</p>
              </Col>
              <Col md={6}>
                <p className="mb-1"><strong>GST ({report.financial_summary.gst_rate}%):</strong> {billingReportsAPI.formatCurrency(report.financial_summary.gst_amount)}</p>
                <p className="mb-1"><strong>Total Amount:</strong> <span className="text-success fw-bold">{billingReportsAPI.formatCurrency(report.financial_summary.total_amount)}</span></p>
                <p className="mb-1"><strong>Paid Amount:</strong> {billingReportsAPI.formatCurrency(report.financial_summary.paid_amount)}</p>
                <p className="mb-0"><strong>Balance:</strong> <span className={report.financial_summary.balance > 0 ? 'text-danger fw-bold' : 'text-success'}>{billingReportsAPI.formatCurrency(report.financial_summary.balance)}</span></p>
              </Col>
            </Row>
          </div>
        )} */}

        {/* Report Metadata */}
        {/* {report.metadata && (
          <>
            <h6 className="text-primary mb-3 mt-4">Report Metadata</h6>
            <Row>
              <Col md={6}>
                <p className="mb-1"><strong>Test Match Rate:</strong>
                  <span className={billingReportsAPI.getMatchRateColor(report.metadata.test_match_success_rate)}>
                    {' '}{Math.round(report.metadata.test_match_success_rate * 100)}%
                  </span>
                </p>
                <p className="mb-1"><strong>Total Tests:</strong> {report.metadata.total_tests}</p>
              </Col>
              <Col md={6}>
                <p className="mb-1"><strong>Matched Tests:</strong> {report.metadata.matched_tests_count}</p>
                <p className="mb-1"><strong>Unmatched Tests:</strong> {report.metadata.unmatched_tests_count}</p>
              </Col>
            </Row>
          </>
        )} */}
      </div>

      {/* Authorization Modal */}
      {authorizationMode && (
        <div className="authorization-overlay">
          <Card className="authorization-modal shadow-lg">
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                Authorize Report
              </h5>
            </Card.Header>
            <Card.Body>
              <p className="mb-3">
                You are about to authorize report <strong>{report?.sid_number}</strong>.
                This action will mark the report as authorized and ready for final distribution.
              </p>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Authorizer Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={authorizationData.approverName}
                    onChange={(e) => setAuthorizationData(prev => ({
                      ...prev,
                      approverName: e.target.value
                    }))}
                    placeholder="Enter authorizer name"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Authorization Comments</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={authorizationData.approvalComments}
                    onChange={(e) => setAuthorizationData(prev => ({
                      ...prev,
                      approvalComments: e.target.value
                    }))}
                    placeholder="Enter any additional comments (optional)"
                  />
                </Form.Group>
              </Form>
            </Card.Body>
            <Card.Footer className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setAuthorizationMode(false)}
                disabled={authorizing}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={handleAuthorize}
                disabled={!authorizationData.approverName.trim() || authorizing}
              >
                <FontAwesomeIcon
                  icon={authorizing ? faSpinner : faCheckCircle}
                  spin={authorizing}
                  className="me-2"
                />
                {authorizing ? 'Authorizing...' : 'Authorize Report'}
              </Button>
            </Card.Footer>
          </Card>
        </div>
      )}


    </div>
  );
};

export default BillingReportsDetail;
