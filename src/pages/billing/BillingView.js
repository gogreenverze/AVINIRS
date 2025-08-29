import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, Button, Badge, Row, Col,Modal, Form, InputGroup, } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileInvoiceDollar, faArrowLeft, faPrint, faMoneyBillWave,
  faUser, faCalendarAlt, faRupeeSign, faPlus, faCheckCircle, faShare,faExclamationTriangle,faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI, billingAPI } from '../../services/api';
import { InfoModal, SuccessModal, ErrorModal } from '../../components/common';
import WhatsAppSend from '../../components/common/WhatsAppSend';
import ResponsiveInvoiceItemsTable from '../../components/billing/ResponsiveInvoiceItemsTable';
import '../../styles/BillingView.css';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import bwipjs from 'bwip-js';
import logo from '../../assets/logoavini.png'; // adjust the path as needed
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { addTestToBilling } from '../../services/billingAPI';
import dynamicPricingService from '../../services/dynamicPricingService';
import referrerMasterData from '../../data/referrerMasterData.json';



const BillingView = () => {
  const { id } = useParams();
  // const { billingId } = useParams();
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage] = useState('');
  const [testProfiles, setTestProfiles] = useState([]);
  // Test item form with dynamic pricing
  const [newTestItem, setNewTestItem] = useState({
    testName: '',
    test_id: null,
    amount: 0.00,
    referralSource: 'self',
    pricingScheme: '',
    priceCalculationDetails: null
  });
  const [excelDataLoading, setExcelDataLoading] = useState(false);
  const [excelDataError, setExcelDataError] = useState(null);
  const [excelDataCache, setExcelDataCache] = useState(null);
  const [excelDataLastFetch, setExcelDataLastFetch] = useState(null);
   const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);
  
    const [referrers, setReferrers] = useState([]);
  const { currentUser } = useAuth();
  const { tenantData, accessibleTenants, currentTenantContext } = useTenant();
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
  })




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
          // const sampleTestProfiles = [
          //   { id: 1, test_profile: 'Complete Blood Count (CBC)', test_price: 250, department: 'Hematology' },
          //   { id: 2, test_profile: 'Lipid Profile', test_price: 400, department: 'Biochemistry' },
          //   { id: 3, test_profile: 'Liver Function Test (LFT)', test_price: 350, department: 'Biochemistry' },
          //   { id: 4, test_profile: 'Kidney Function Test (KFT)', test_price: 300, department: 'Biochemistry' },
          //   { id: 5, test_profile: 'Thyroid Profile (T3, T4, TSH)', test_price: 500, department: 'Endocrinology' },
          //   { id: 6, test_profile: 'Blood Sugar (Fasting)', test_price: 100, department: 'Biochemistry' },
          //   { id: 7, test_profile: 'Blood Sugar (Random)', test_price: 100, department: 'Biochemistry' },
          //   { id: 8, test_profile: 'HbA1c', test_price: 450, department: 'Biochemistry' },
          //   { id: 9, test_profile: 'Urine Routine', test_price: 150, department: 'Pathology' },
          //   { id: 10, test_profile: 'ECG', test_price: 200, department: 'Cardiology' }
          // ];
          // setTestProfiles(sampleTestProfiles);

          // Show warning but don't block the form
          setError(`Warning: Unable to load Excel test data (${apiErr.message}). Using fallback test profiles.`);
        }

        // Fetch GST configurations
        try {
          const gstResponse = await adminAPI.getGSTConfig();
          if (gstResponse.data && Array.isArray(gstResponse.data)) {
           
            // Find default GST rate
            const defaultConfig = gstResponse.data.find(config => config.is_default && config.is_active);
            if (defaultConfig) {
            
              setFormData(prev => ({
                ...prev,
                gstRate: defaultConfig.rate
              }));
            }
          }
        } catch (gstErr) {
          console.log('Using default GST rate - GST config API not available');
          // Use default GST rate from settings or fallback
          // setDefaultGstRate(18.00);
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

   


const fetchLogoBytes = async () => {
  const response = await fetch(logo);
  const logoBytes = await response.arrayBuffer();
  return logoBytes;
};


// 🔧 Generate barcode image buffer in browser
const generateBarcodeBytes = async (text) => {
  const canvas = document.createElement('canvas');
  bwipjs.toCanvas(canvas, {
    bcid: 'code128',
    text,
    scale: 1,
    height: 7,
    includetext: false,
  });
  const dataUrl = canvas.toDataURL('image/png');
  const response = await fetch(dataUrl);
  return await response.arrayBuffer();
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





const generateInvoicePdf = async (billing, logoImageBytes) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();

  const drawText = (text, x, y, options = {}) => {
    page.drawText(text.toString(), {
      x,
      y,
      font: options.bold ? bold : helvetica,
      size: options.size || 10,
      color: rgb(0, 0, 0),
    });
  };

  let y = 770;

  // ▓▓ Logo (top-left)
  if (logoImageBytes) {
    const logoImage = await pdfDoc.embedPng(logoImageBytes);
    const scaled = logoImage.scale(0.2);
    page.drawImage(logoImage, {
      x: 30,
      y: y,
      width: scaled.width,
      height: scaled.height,
    });
  }

  // ▓▓ Center Header
  drawText('AVINI LABS', 250, y, { bold: true, size: 14 });
  y -= 15;
  drawText('No. 69, Mahadhana Street. Mayiladuthurai.', 170, y, { size: 10 });
  y -= 15;
  drawText(`${new Date().toLocaleString()}`, 230, y, { size: 10 }); // Use new Date().toLocaleString() for dynamic

  // ▓▓ Barcode in top-right (ABOVE SID)
  if (billing.sid_number) {
    try {
      const barcodeBytes = await generateBarcodeBytes(billing.sid_number.toString());
      const barcodeImage = await pdfDoc.embedPng(barcodeBytes);
      page.drawImage(barcodeImage, {
        x: 400,    // Top-right
        y: y + 10,
        width: 130,
        height: 40,
      });
    } catch (e) {
      console.error('Barcode error:', e);
    }
  }

  y -= 25;

  // ▓▓ Line under header
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0, 0, 0) });

  y -= 30;

  // ▓▓ Patient Info Block
 // ▓▓ Structured Patient Info (3 rows)
drawText(`PID No. : ${billing.patient?.patient_id ?? 'N/A'}`, 50, y, { bold: true });
drawText(`SID No. ${billing.sid_number ?? 'N/A'}`, 350, y, { bold: true });
y -= 15;
const patientName = (
  billing.patient?.full_name ??
  `${billing.patient?.first_name ?? ''} ${billing.patient?.last_name ?? ''}`
).toUpperCase();

const age = billing.patient?.age ?? 'N/A';
const gender = billing.patient?.gender?.[0]?.toUpperCase() ?? '-';
drawText(`patient :MS. ${patientName} (${age} Y / ${gender}).`, 50, y, { bold: true });

drawText(`SID Date ${new Date(billing.invoice_date).toLocaleString()}`, 350, y, { bold: true });
y -= 15;

drawText(`Referrer :${billing.doctor_name ?? 'N/A'}`, 50, y, { bold: true });
drawText(`Print Date:${new Date().toLocaleString()}`, 350, y, { bold: true });


  y -= 25;

  // ▓▓ Table Header
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0, 0, 0) });
  y -= 15;
  drawText('S.No', 50, y, { bold: true });
  drawText('Description', 120, y, { bold: true });
  drawText('Amount', 450, y, { bold: true });
  y -= 10;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0, 0, 0) });
  y -= 15;

  // ▓▓ Items
  billing.items?.forEach((item, i) => {
    drawText(`${i + 1}`, 50, y);
    drawText(item.name || item.test_name || 'N/A', 120, y);
    drawText(parseFloat(item.amount ?? 0).toFixed(2), 450, y);
    y -= 15;
  });

  y -= 5;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0, 0, 0) });

  // ▓▓ Totals
  const total = parseFloat(billing.total_amount ?? 0);
  const discount = parseFloat(billing.discount ?? 0);
  const paid = parseFloat(billing.paid_amount ?? 0);
  const due = total - paid;

  y -= 20;
  drawText('Bill Amount', 400, y, { bold: true });
  drawText(total.toFixed(2), 500, y);

  y -= 15;
  drawText('Discount', 400, y);
  drawText(discount.toFixed(2), 500, y);

  y -= 15;
  drawText('Total Amount', 400, y, { bold: true });
  drawText((total - discount).toFixed(2), 500, y);

  y -= 10;
  page.drawLine({ start: { x: 300, y }, end: { x: 545, y }, thickness: 1, color: rgb(0, 0, 0) });

  y -= 20;
  drawText('Due Amount', 400, y, { bold: true });
  drawText(due.toFixed(2), 500, y);

  y -= 10;
  page.drawLine({ start: { x: 300, y }, end: { x: 545, y }, thickness: 1, color: rgb(0, 0, 0) });

  // ▓▓ Signature Block
  y -= 40;
  drawText('For AVINI LABS', 400, y);
  y -= 15;
  drawText('Authorised Signatory', 400, y);

  // ▓▓ Footer Note
  y -= 40;
  drawText('Note:', 50, y, { bold: true });
  y -= 15;
  drawText('This is an Electronically generated Receipt & Does Not Require Signature.', 50, y, { size: 9 });
  y -= 15;
  drawText('Report will be sent via email or online only after full payment.', 50, y, { size: 9 });
  y -= 15;
  drawText(`Bill User: ${billing.bill_user ?? 'N/A'}`, 50, y, { size: 9 });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

const handlePrintPDF = async () => {
  const logoBytes = await fetchLogoBytes();
  const pdfBytes = await generateInvoicePdf(billing, logoBytes);
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url); // opens in new tab, user can click Print
};

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
const [excelDataLoading, setExcelDataLoading] = useState(false);
  const [excelDataError, setExcelDataError] = useState(null);
  const [excelDataCache, setExcelDataCache] = useState(null);
  const [excelDataLastFetch, setExcelDataLastFetch] = useState(null);


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

const handleDownloadPdf = async () => {
  const logoBytes = await fetchLogoBytes();
  const pdfBytes = await generateInvoicePdf(billing, logoBytes);
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice_${billing.sid_number}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};



  // Fetch billing data
  useEffect(() => {
    const fetchBilling = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await billingAPI.getBillingById(id);
        setBilling(response.data);
      } catch (err) {
        console.error('Error fetching billing:', err);
        setError('Failed to load billing details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, [id]);

  // Handle share invoice
  const handleShare = () => {
    // Implementation for sharing invoice (e.g., via email or WhatsApp)
    setShowShareModal(false);
    setShowSuccessModal(true);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Paid':
        return 'success';
      case 'Partial':
        return 'info';
      case 'Cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading billing details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="alert alert-warning" role="alert">
        Billing record not found.
      </div>
    );
  }


// Handles changes when selecting a test from dropdown with dynamic pricing
const handleTestItemChange = (e) => {
  const { name, value } = e.target;

  setNewTestItem((prev) => {
    const updated = { ...prev, [name]: value };

    // If test name is selected, auto-fill from testProfiles and calculate dynamic price
    if (name === 'testName') {
      const selectedProfile = testProfiles.find(
        (profile) => profile.id === value
      );

      if (selectedProfile) {
        updated.test_id = selectedProfile.id;
        updated.test_display_name = selectedProfile.test_name;
        updated.selectedTestData = selectedProfile;

        // Calculate dynamic price based on test and referral source
        const priceResult = dynamicPricingService.getTestPrice(
          selectedProfile.id,
          prev.referralSource,
          prev.pricingScheme,
          parseFloat(selectedProfile.test_price) || 0
        );

        updated.amount = priceResult.price;
        updated.priceCalculationDetails = priceResult;

        console.log("Dynamic pricing result:", priceResult);
      }
    }

    // If referral source or pricing scheme changes, recalculate price
    if ((name === 'referralSource' || name === 'pricingScheme') && prev.test_id) {
      const selectedProfile = testProfiles.find(profile => profile.id === prev.test_id);
      if (selectedProfile) {
        const priceResult = dynamicPricingService.getTestPrice(
          selectedProfile.id,
          name === 'referralSource' ? value : prev.referralSource,
          name === 'pricingScheme' ? value : prev.pricingScheme,
          parseFloat(selectedProfile.test_price) || 0
        );

        updated.amount = priceResult.price;
        updated.priceCalculationDetails = priceResult;

        console.log("Recalculated price:", priceResult);
      }
    }

    return updated;
  });
};

// Handles adding the selected test to the billing
const handleAddTestSubmit = async () => {
  console.log("newTestItem before submit:", newTestItem);

  if (!newTestItem.test_display_name) {
    alert("Please select a test before adding.");
    return;
  }

  try {
    // Build test object with full details from selectedTestData
    const testPayload = {
      name: newTestItem.test_display_name,
      amount: newTestItem.amount || 0,
      test_id: newTestItem.test_id,
      applicable_to: newTestItem.selectedTestData?.applicable_to || "Both",
      department: newTestItem.selectedTestData?.department || "",
      hms_code: newTestItem.selectedTestData?.hmsCode || "",
      method: newTestItem.selectedTestData?.method || "",
      specimen: newTestItem.selectedTestData?.specimen || "",
      reference_range: newTestItem.selectedTestData?.referenceRange || "",
      reporting_days: newTestItem.selectedTestData?.reporting_days || 0,
      short_name: newTestItem.selectedTestData?.short_name || "",
      test_done_on: newTestItem.selectedTestData?.test_done_on || "all",
      selectedTestData: newTestItem.selectedTestData || {}
    };

    const payload = { test_items: [testPayload] };

    const result = await addTestToBilling(id, payload);

      if (!result.success) {
      alert(result.error || "Failed to add test.");
      return;
    }

    // ✅ Show success message here
    alert(result.message || "Test added successfully!");

    console.log("Test added successfully:", result.data);
    setShowAddTestModal(false);
    if (!result.success) {
      alert(result.error || "Failed to add test.");
      return;
    }

    console.log("Test added successfully:", result.billing);
    setShowAddTestModal(false);
  } catch (error) {
    console.error("Error adding test:", error);
    alert("Failed to add test.");
  }
};





  return (
    <div className="billing-view-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
          Invoice Details
        </h1>
        <div>
          <Link to="/billing" className="btn btn-secondary me-2">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to List
          </Link>
          <Button variant="primary" className="me-2" onClick={() => handlePrintPDF()}>
            <FontAwesomeIcon icon={faPrint} className="me-2" />
            Print
          </Button>
          <Button variant="success" className="me-2" onClick={() => setShowAddTestModal(true)}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add Test
          </Button>
          <Button variant="outline-primary" className="me-2" onClick={handleDownloadPdf}>
  <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
  Download PDF
</Button>

          {(billing.status === 'Pending' || billing.status === 'Partial') && (
            <Link to={`/billing/${id}/collect`} className="btn btn-success me-2">
              <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
              Collect Payment
            </Link>
          )}
          <Button variant="info" onClick={() => setShowShareModal(true)}>
            <FontAwesomeIcon icon={faShare} className="me-2" />
            Share
          </Button>
        </div>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="m-0 font-weight-bold text-primary">
                    Invoice #{billing.invoice_number}
                  </h6>
                  {billing.sid_number && (
                    <small className="text-muted">
                      SID: {billing.sid_number}
                    </small>
                  )}
                </div>
                <div className="text-end">
                  <Badge
                    bg={getStatusBadgeVariant(billing.status)}
                    className="mb-1"
                  >
                    {billing.status}
                  </Badge>
                  {billing.clinic && (
                    <div>
                      <small className="text-muted d-block">
                        {billing.clinic.name}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="billing-detail-item">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                    <strong>Invoice Date:</strong>
                    <span>{new Date(billing.invoice_date).toLocaleDateString()}</span>
                  </div>
                  {billing.due_date && (
                    <div className="billing-detail-item">
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-warning" />
                      <strong>Due Date:</strong>
                      <span>{new Date(billing.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {billing.sid_number && (
                    <div className="billing-detail-item">
                      <strong>SID Number:</strong>
                      <span className="badge bg-info text-dark">{billing.sid_number}</span>
                    </div>
                  )}
                  {billing.invoice_info?.service_period && (
                    <div className="billing-detail-item">
                      <strong>Service Date:</strong>
                      <span>{new Date(billing.invoice_info.service_period).toLocaleDateString()}</span>
                    </div>
                  )}
                  {billing.invoice_info?.payment_terms && (
                    <div className="billing-detail-item">
                      <strong>Payment Terms:</strong>
                      <span>{billing.invoice_info.payment_terms}</span>
                    </div>
                  )}
                  <div className="billing-detail-item">
                    <FontAwesomeIcon icon={faRupeeSign} className="me-2 text-primary" />
                    <strong>Total Amount:</strong>
                    <span>{formatCurrency(billing.total_amount)}</span>
                  </div>
                  <div className="billing-detail-item">
                    <FontAwesomeIcon icon={faRupeeSign} className="me-2 text-primary" />
                    <strong>Paid Amount:</strong>
                    <span>{formatCurrency(billing.paid_amount)}</span>
                  </div>
                  <div className="billing-detail-item">
                    <FontAwesomeIcon icon={faRupeeSign} className="me-2 text-primary" />
                    <strong>Balance:</strong>
                    <span>{formatCurrency(billing.total_amount - billing.paid_amount)}</span>
                  </div>
                </Col>
                <Col md={6}>
                  {billing.patient && (
                    <>
                      <div className="billing-detail-item">
                        <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                        <strong>Patient:</strong>
                        <span>
                         <Link to={`/patients/${billing.patient.id}`}>
  {(billing.patient.full_name || `${billing.patient.first_name} ${billing.patient.last_name}`).toUpperCase()}
</Link>

                        </span>
                      </div>
                      <div className="billing-detail-item">
                        <strong>Patient ID:</strong>
                        <span>{billing.patient.patient_id}</span>
                      </div>
                      <div className="billing-detail-item">
                        <strong>Date of Birth:</strong>
                        <span>
                          {billing.patient.date_of_birth ?
                            new Date(billing.patient.date_of_birth).toLocaleDateString() : 'N/A'}
                          {billing.patient.age && ` (Age: ${billing.patient.age})`}
                        </span>
                      </div>
                      <div className="billing-detail-item">
                        <strong>Gender:</strong>
                        <span>{billing.patient.gender || 'N/A'}</span>
                      </div>
                      <div className="billing-detail-item">
                        <strong>Contact:</strong>
                        <span>{billing.patient.phone}</span>
                      </div>
                      <div className="billing-detail-item">
                        <strong>Email:</strong>
                        <span>{billing.patient.email || 'N/A'}</span>
                      </div>
                      {billing.patient.full_address && (
                        <div className="billing-detail-item">
                          <strong>Address:</strong>
                          <span>{billing.patient.full_address}</span>
                        </div>
                      )}
                      {billing.patient.blood_group && (
                        <div className="billing-detail-item">
                          <strong>Blood Group:</strong>
                          <span>{billing.patient.blood_group}</span>
                        </div>
                      )}
                    </>
                  )}
                </Col>
              </Row>

              <hr />

              <ResponsiveInvoiceItemsTable
                items={billing.items || []}
                subtotal={billing.subtotal || 0}
                discount={billing.discount || 0}
                tax={billing.tax || 0}
                taxRate={billing.tax_rate || 0}
                totalAmount={billing.total_amount || 0}
                title="Invoice Items"
              />
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Clinic Information Card */}
          {billing.clinic && (
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Clinic Information</h6>
              </Card.Header>
              <Card.Body>
                <div className="clinic-info">
                  <h6 className="text-primary">{billing.clinic.name}</h6>
                  {billing.clinic.address && (
                    <div className="mb-2">
                      <small className="text-muted">Address:</small>
                      <div>{billing.clinic.address}</div>
                    </div>
                  )}
                  {billing.clinic.phone && (
                    <div className="mb-2">
                      <small className="text-muted">Phone:</small>
                      <div>{billing.clinic.phone}</div>
                    </div>
                  )}
                  {billing.clinic.email && (
                    <div className="mb-2">
                      <small className="text-muted">Email:</small>
                      <div>{billing.clinic.email}</div>
                    </div>
                  )}
                  {billing.clinic.site_code && (
                    <div className="mb-2">
                      <small className="text-muted">Site Code:</small>
                      <span className="badge bg-secondary ms-2">{billing.clinic.site_code}</span>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Payment & Tax Information Card */}
          {/* <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Payment & Tax Details</h6>
            </Card.Header>
            <Card.Body>
              <div className="payment-tax-info">
                {billing.invoice_info?.payment_terms && (
                  <div className="mb-2">
                    <small className="text-muted">Payment Terms:</small>
                    <div>{billing.invoice_info.payment_terms}</div>
                  </div>
                )}

                {billing.payment_method && (
                  <div className="mb-2">
                    <small className="text-muted">Payment Method:</small>
                    <span className="badge bg-info ms-2">{billing.payment_method}</span>
                  </div>
                )}

                {(billing.gst_rate || billing.tax_rate || billing.invoice_info?.tax_rate) && (
                  <div className="mb-2">
                    <small className="text-muted">GST Rate:</small>
                    <div>{billing.gst_rate || billing.tax_rate || billing.invoice_info?.tax_rate}%</div>
                  </div>
                )}

                {billing.gst_amount && (
                  <div className="mb-2">
                    <small className="text-muted">GST Amount:</small>
                    <div>{formatCurrency(billing.gst_amount)}</div>
                  </div>
                )}

                {billing.discount_percent && (
                  <div className="mb-2">
                    <small className="text-muted">Discount Applied:</small>
                    <div>{billing.discount_percent}%</div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card> */}

          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Payment History</h6>
            </Card.Header>
            <Card.Body>
              {billing.payments && billing.payments.length > 0 ? (
                <div className="payment-history">
                  {billing.payments.map((payment, index) => (
                    <div key={index} className="payment-item">
                      <div className="payment-date">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </div>
                      <div className="payment-details">
                        <div className="payment-amount">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="payment-method">
                          {payment.payment_method}
                          {payment.status === 'Completed' && (
                            <FontAwesomeIcon icon={faCheckCircle} className="ms-2 text-success" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No payment records found.</p>
              )}

              {(billing.status === 'Pending' || billing.status === 'Partial') && (
                <div className="mt-3">
                  <Link to={`/billing/${id}/collect`} className="btn btn-success btn-block w-100">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                    Collect Payment
                  </Link>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* WhatsApp Send Component */}
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold">WhatsApp</h6>
            </Card.Header>
            <Card.Body>
              <WhatsAppSend
                type="invoice"
                patientName={billing.patient ? `${billing.patient.first_name} ${billing.patient.last_name}` : ''}
                billingId={billing.id}
                defaultPhone={billing.patient?.phone || ''}
                defaultMessage={`Your invoice is ready. Invoice #${billing.invoice_number}. Total amount: ${formatCurrency(billing.total_amount)}. Thank you for choosing AVINI LABS.`}
                onSuccess={(message) => {
                  // Show success notification
                  console.log('WhatsApp invoice sent:', message);
                }}
                onError={(error) => {
                  // Show error notification
                  console.error('WhatsApp error:', error);
                }}
              />
            </Card.Body>
          </Card>

          {/* Notes & Instructions Card */}
          {(billing.notes || billing.invoice_info?.notes) && (
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Notes & Instructions</h6>
              </Card.Header>
              <Card.Body>
                <div className="notes-section">
                  {billing.notes && (
                    <div className="mb-2">
                      <small className="text-muted">Billing Notes:</small>
                      <div>{billing.notes}</div>
                    </div>
                  )}
                  {billing.invoice_info?.notes && billing.invoice_info.notes !== billing.notes && (
                    <div className="mb-2">
                      <small className="text-muted">Additional Notes:</small>
                      <div>{billing.invoice_info.notes}</div>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Share Modal */}
      <InfoModal
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        title="Share Invoice"
        message={
          <div>
            <p>Share invoice #{billing.invoice_number} with the patient:</p>
            <div className="d-grid gap-2">
              <Button variant="success" onClick={handleShare}>
                <i className="fab fa-whatsapp me-2"></i>
                Share via WhatsApp
              </Button>
              <Button variant="primary" onClick={handleShare}>
                <i className="fas fa-envelope me-2"></i>
                Share via Email
              </Button>
            </div>
          </div>
        }
      />

 <Modal show={showAddTestModal} onHide={() => setShowAddTestModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Test</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Form for adding a new test with dynamic pricing */}
          <Row>
            <Col md={12}>
              <SearchableDropdown
                name="testName"
                label="Test Name"
                value={newTestItem.testName}
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
          </Row>

          <Row className="mt-3">
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>Referral Source</Form.Label>
                <Form.Select
                  name="referralSource"
                  value={newTestItem.referralSource}
                  onChange={handleTestItemChange}
                >
                  {referrerMasterData.referrerTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>Pricing Scheme (Optional)</Form.Label>
                <Form.Select
                  name="pricingScheme"
                  value={newTestItem.pricingScheme}
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
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-2">
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
                {newTestItem.priceCalculationDetails && (
                  <div className="text-muted small mt-1">
                    <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
                    {newTestItem.priceCalculationDetails.reason}
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddTestModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddTestSubmit}>
            Add Test
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        title="Success"
        message="Invoice has been shared successfully!"
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

export default BillingView;
