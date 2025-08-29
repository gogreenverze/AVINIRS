
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Form, Button, Row, Col, Table, InputGroup, Alert,
  Badge, Spinner, Modal, OverlayTrigger, Tooltip, Dropdown,
  Pagination
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faDownload, faEye, faFileInvoiceDollar,
  faCalendarAlt, faUser, faPhone, faBuilding, faSpinner,
  faExclamationTriangle, faCheckCircle, faInfoCircle, faFilter,
  faLock
} from '@fortawesome/free-solid-svg-icons';
import billingReportsAPI from '../../services/billingReportsAPI';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import ArialNormal, { arialnormal } from '../../assets/ArialNormal';
import { fontBold } from '../../assets/ArialBold';
import { verdana } from '../../assets/verdana';

let autoTableAvailable = false; // as fallback for jsPDF autotable
try {
  require('jspdf-autotable');
  autoTableAvailable = true;
} catch (e) {
  console.warn('jspdf-autotable not available');
}

const BillingReports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { accessibleTenants, currentTenantContext } = useTenant();
 const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  const [selectedFranchiseId, setSelectedFranchiseId] = useState(null);
  const [allReports, setAllReports] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [searchParams, setSearchParams] = useState({
    sid: '',
    patient_name: '',
    mobile: '',
    date_from: '',
    date_to: ''
  });

  const [sidSuggestions, setSidSuggestions] = useState([]);
  const [showSidSuggestions, setShowSidSuggestions] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportModalLoading, setReportModalLoading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const [includeHeader, setIncludeHeader] = useState(true);
  const [logoBase64, setLogoBase64] = useState(null);

  // Check user franchise access (simplified)
  const canAccessAllFranchises = () => {
    if (user?.role === 'admin') return true;
    if (currentTenantContext?.is_hub && currentTenantContext?.site_code === 'MYD') return true;
    return false;
  };

  const getAvailableFranchises = () => canAccessAllFranchises() ? accessibleTenants || [] : [];

  const filterReportsByFranchise = (reportsData) => {
    if (!canAccessAllFranchises() || !selectedFranchiseId) return reportsData;
    return reportsData.filter(report => report.tenant_id === selectedFranchiseId);
  };

 

  // Load logo and initial data
  useEffect(() => {
    loadReports();
    loadStats();

    convertLogoToBase64().then(base64 => {
      if (base64) setLogoBase64(base64);
    });
  }, []);

  useEffect(() => {
    if (canAccessAllFranchises()) {
      loadReports();
      loadStats();
    }
  }, [selectedFranchiseId]);

  const loadReports = async () => {
    setLoading(true); setError('');
    try {
      const response = await billingReportsAPI.getAllReports(selectedFranchiseId);
      if (response.success) {
        let reportsData = response.data?.data?.data || response.data?.data || [];
        if (Array.isArray(reportsData)) {
          setAllReports(reportsData);
          setReports(filterReportsByFranchise(reportsData));
          setCurrentPage(1);
        } else {
          setReports([]); setAllReports([]);
        }
      } else {
        setError(response.error || 'Failed to load reports');
      }
    } catch (err) {
      setError('Failed to load billing reports: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await billingReportsAPI.getReportsStats(selectedFranchiseId);
      if (response.success) {
        const statsData = response.data?.data?.data || response.data?.data || response.data || {};
        setStats(statsData);
      }
    } catch {}
  };

  const handleSearch = async () => {
    setSearchLoading(true); setError('');
    try {
      const response = await billingReportsAPI.searchReports(searchParams, selectedFranchiseId);
      if (response.success) {
        let reportsData = response.data?.data?.data || response.data?.data || [];
        if (Array.isArray(reportsData)) {
          setAllReports(reportsData);
          setReports(filterReportsByFranchise(reportsData));
          setCurrentPage(1);
        } else {
          setReports([]); setAllReports([]);
        }
      } else {
        setError(response.error);
      }
    } catch {
      setError('Failed to search billing reports');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSIDChange = async (value) => {
    setSearchParams(prev => ({ ...prev, sid: value }));
    if (value.length >= 2) {
      try {
        const response = await billingReportsAPI.getSIDAutocomplete(value);
        if (response.success) {
          const suggestionsData = response.data?.data || response.data || [];
          setSidSuggestions(Array.isArray(suggestionsData) ? suggestionsData : []);
          setShowSidSuggestions(true);
        }
      } catch {}
    } else {
      setSidSuggestions([]);
      setShowSidSuggestions(false);
    }
  };

  const handleSIDSelect = sid => {
    setSearchParams(prev => ({ ...prev, sid }));
    setShowSidSuggestions(false);
    setSidSuggestions([]);
  };

  const handleViewReport = async (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
    setReportModalLoading(true);
    try {
      const response = await billingReportsAPI.getReportBySID(report.sid_number);
      if (response.success && response.data) {
        const reportData = response.data.data?.data || response.data.data || response.data;
        setSelectedReport({ ...reportData });
      } else setError(response.error || 'Failed to load report details');
    } catch {
      setError('Failed to load report details');
    } finally {
      setReportModalLoading(false);
    }
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
  
          // Extract category from the billing report structure - use department field
          const categoryName = item.department ||
                              item.test_master_data?.department ||
                              item.category ||
                              'GENERAL TESTS';
  
          if (!categories[categoryName]) {
            categories[categoryName] = {
              category: categoryName,
              tests: []
            };
          }
  
        
          // Create test entry with actual billing report data
          const testEntry = {
            name: item.test_name || item.name || 'Unknown Test',
            method: item.method || item.test_master_data?.method || '',
            specimen: item.primary_specimen || item.test_master_data?.specimen || '',
            notes: item.test_master_data?.notes ||
                  item.instructions ||
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
              reference: item.reference_range || item.test_master_data?.reference_range || 'N/A'
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
      const handleDownloadPDF = async (report) => {
        if (!report) return;
    
        try {
          setDownloadingPDF(true);
          setError(null);
    
    
    
          // Create new jsPDF instance
          const doc = new jsPDF('p', 'mm', 'A4');
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
    
          // FIXED POSITIONING: Always use exact same alignment as "Include header" checked mode
          let yPosition = includeHeader ? 20 : 50;
    
          // Generate QR code with direct PDF download URL
          const qrCodeData = `${window.location.origin}/api/billing-reports/sid/${report.sid_number}/pdf`;
          const qrCodeImg = await generateQRCodeBase64(qrCodeData);
    
          // Generate barcode for SID
          const barcodeImg = generateBarcodeBase64(report.sid_number || 'N/A');
    
          // CONSISTENT POSITIONING: Always use the same yPosition for patient section regardless of header state
          // This ensures identical alignment whether "Include header" is checked or unchecked
          const patientSectionStartY = 55; // Same position as when header is checked (logoY + logoHeight + 5 = 10 + 30 + 5 = 55)
    
          // LOGO INTEGRATION: Add logo only when header is enabled
          const isFirstPage = doc.internal.getCurrentPageInfo().pageNumber === 1;
          if (logoBase64 && isFirstPage && includeHeader) { // Show logo only when header is enabled
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
    
          // CONSISTENT PATIENT SECTION POSITIONING: Always start at the same yPosition regardless of header state
          // This ensures patient details and SID sections maintain identical positioning for preprinted paper compatibility
          console.log('Patient section starting at consistent yPosition:', patientSectionStartY, '(same for both header checked/unchecked)');
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
    
    //       const formatReferenceRange = (text, maxWidth = 120) => {
    //         if (!text || text.trim() === '') return ['N/A'];
    
    //         // Split by newline first to preserve each logical row
    //         const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    //         // Then wrap each line individually
    //         return lines.flatMap(line => doc.splitTextToSize(line, maxWidth));
    //       };
    
    
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
    //    doc.addFileToVFS("Arial-Bold.ttf", fontBold);
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
           
    //    doc.addFileToVFS("Arial.ttf", arialnormal);
    //         doc.addFont("Arial.ttf", "Arial", "normal");
    //         doc.setFont('Arial', 'bold').setFontSize(10);
    //         doc.text(category.category.toUpperCase(), 15, yPosition)
    //         yPosition += 5;
    
    
    
    //         category.tests.forEach(test => {
    //           const estHeight = calculateTestHeight(test);
    //           yPosition = checkPageBreak(yPosition, estHeight);
           
    //    doc.addFileToVFS("Arial.ttf", arialnormal);
    //         doc.addFont("Arial.ttf", "Arial", "normal");
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
    
    //           test.subTests.forEach(sub => {
    //             yPosition = checkPageBreak(yPosition, 4);
              
    //    doc.addFileToVFS("Arial.ttf", arialnormal);
    //         doc.addFont("Arial.ttf", "Arial", "normal");
    //             doc.setFont('Arial', 'normal').setFontSize(9);
    //             // doc.text(sub.name, 25, yPosition);
    //             doc.text(sub.result, 105, yPosition - 8);
    //             doc.text(sub.unit, 135, yPosition - 8);
    //             doc.text(isComplexReferenceRange(sub.reference) ? 'See below' : sub.reference || 'N/A', 160, yPosition - 8);
    //             yPosition += 4;
    //           });
    
    //           test.subTests.forEach(sub => {
    //             if (isComplexReferenceRange(sub.reference)) {
    //               yPosition += 3;
    //               doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(0, 0, 0);
    //               doc.text(`Reference Range (${sub.name}):`, 25, yPosition);
    //               yPosition += 4;
                  
    //    doc.addFileToVFS("Arial.ttf", arialnormal);
    //         doc.addFont("Arial.ttf", "Arial", "normal");
    //               doc.setFont('Arial', 'normal').setTextColor(0, 0, 0);
    //               doc.setFont('Arial', 'normal').setFontSize(8);
    //               formatReferenceRange(sub.reference).forEach(line => {
    //                 yPosition = checkPageBreak(yPosition, 3);
    //                 doc.text(line, 30, yPosition);
    //                 yPosition += 4;
    //               });
    //               doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(0, 0, 0);
    //               yPosition += 1;
    //             }
    //           });
    
    
      
            
    // if (test.notes?.trim()) {
    //   yPosition += 1;
    
    //   const leftMargin = 15;
    //   const rightMargin = 15;
    //   const paragraphWidth = pageWidth - leftMargin - rightMargin;
    
    //   // Clean notes: remove manual line breaks
    //   const cleanedNotes = test.notes.replace(/\s*\n\s*/g, " ");
    
    //   // Merge "Notes:" inline
    //   const fullNotes = `Notes: ${cleanedNotes}`;
    
    //    doc.addFileToVFS("Arial.ttf", arialnormal);
    //         doc.addFont("Arial.ttf", "Arial", "normal");
    
    //   doc.setFontSize(8).setFont("Arial", "normal");
    
    //   // Wrap nicely into full paragraph
    //   const noteParagraph = doc.splitTextToSize(fullNotes, paragraphWidth);
    
    //   // Page break check
    //   yPosition = checkPageBreak(yPosition, noteParagraph.length * 3);
    
    //   // Print the paragraph
    //   doc.text(noteParagraph, leftMargin, yPosition);
    
    //   // Move cursor after block
    //   yPosition += noteParagraph.length * 3 + 5;
    
    //   doc.setFontSize(11);
    // } else {
    //   yPosition += 2;
    // }
    
    
    
    
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

    const generateTestResultsTable = (doc, reportData, yPos, pageWidth, includeHeader = true) => {
  let yPosition = yPos;
  let actualPageCount = 1;
  const pageHeight = doc.internal.pageSize.getHeight();
  try {
    const bottomMargin = 35;
    const maxContentHeight = pageHeight - bottomMargin;

    const addColumnHeaders = (currentY) => {
      doc.addFileToVFS("Arial-Bold.ttf", fontBold);
      doc.addFont("Arial-Bold.ttf", "Arial", "bold");
      doc.addFileToVFS("Arial.ttf", arialnormal);
      doc.addFont("Arial.ttf", "Arial", "normal");
      doc.setFont("Arial", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      doc.text('INVESTIGATION / METHOD', 15, currentY);
      doc.text('RESULT', 105, currentY);
      doc.text('UNITS', 135, currentY);
      doc.text('REFERENCE INTERVAL', 160, currentY);

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(10, currentY + 2, pageWidth - 10, currentY + 2);
      return currentY + 10;
    };

    const checkPageBreak = (currentY, requiredSpace = 20) => {
      if (currentY + requiredSpace > maxContentHeight) {
        doc.addPage();
        let newY = 20;
        if (shouldDisplayHeaders) newY = addColumnHeaders(newY) + 2;
        return newY;
      }
      return currentY;
    };

    const formatReferenceRange = (text, maxWidth = 120) => {
      if (!text || text.trim() === '') return ['N/A'];
      const lines = text
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
      return lines.flatMap(line => doc.splitTextToSize(line, maxWidth));
    };

    const calculateTestHeight = (test) => {
      let height = 6;
      test.subTests?.forEach(sub => {
        const refLines = formatReferenceRange(sub.reference || '', 50);
        height += Math.max(6, refLines.length * 3.5);
        if (sub.method) height += 4;
        if (sub.specimen) height += 4;
      });
      if (test.notes?.trim()) {
        height += (doc.splitTextToSize(`Notes: ${test.notes}`, pageWidth - 50).length * 3) + 4;
      }
      return height;
    };

    const actualTestData = transformReportDataForPDF(reportData);
    const shouldDisplayHeaders = reportData?.test_items?.length && actualTestData?.some(cat => cat.tests?.length);

    if (shouldDisplayHeaders) {
      yPosition += 1;
      doc.setDrawColor(0, 0, 0).setLineWidth(0.3);
      doc.line(10, yPosition, pageWidth - 10, yPosition);
      yPosition += 6;
      doc.addFileToVFS("verdana.ttf", verdana);
      doc.addFont("verdana.ttf", "verdana", "normal");
      doc.setFont('verdana', 'bold');
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
    const resultX = 105;
    const unitsX = 135;
    const refX = 160;
    const refColumnWidth = pageWidth - refX - 15;
    const lineHeight = 4;

    actualTestData?.forEach((category, idx) => {
      yPosition = checkPageBreak(yPosition, 15);

      // Category header
      doc.addFileToVFS("verdana.ttf", verdana);
      doc.addFont("verdana.ttf", "verdana", "normal");
      doc.setFont('verdana', 'bold').setFontSize(10);
      doc.text(category.category.toUpperCase(), 15, yPosition);
      yPosition += 6;

      category.tests.forEach(test => {
        const estHeight = calculateTestHeight(test);
        yPosition = checkPageBreak(yPosition, estHeight);

        // Multi-parameter profile
        if (Array.isArray(test.subTests) && test.subTests.length > 1) {
          test.subTests.forEach((sub) => {
            let rowY = yPosition;

            // Parameter name
            doc.setFont('verdana', 'normal').setFontSize(9);
            const paramName = sub.name || test.name || 'Parameter';
            doc.text(paramName, nameX, rowY);
            rowY += 4;

            // ✅ Method & Specimen right under parameter
            if (sub.method) {
              doc.setFont('verdana', 'normal').setFontSize(8);
              doc.text(`( Method: ${sub.method} )`, nameX + 5, rowY);
              rowY += 4;
            }
            if (sub.specimen) {
              doc.setFont('verdana', 'normal').setFontSize(8);
              doc.text(`( Specimen: ${sub.specimen} )`, nameX + 5, rowY);
              rowY += 4;
            }

            // ✅ Result bold
            doc.setFont('verdana', 'bold').setFontSize(9);
            const resultText = (sub.result !== undefined && sub.result !== null) ? String(sub.result) : '-';
            doc.text(resultText, resultX, rowY);

            // ✅ Unit bold
            if (sub.unit) {
              doc.setFont('verdana', 'bold').setFontSize(9);
              doc.text(sub.unit, unitsX, rowY);
            }

            // ✅ Reference aligned
            const refLines = formatReferenceRange(sub.reference || '', Math.max(40, refColumnWidth));
            doc.setFont('Arial', 'normal').setFontSize(8);
            if (refLines.length > 0) {
              doc.text(refLines[0], refX, rowY);
              for (let r = 1; r < refLines.length; r++) {
                const nextLineY = rowY + (r * lineHeight);
                if (nextLineY + 4 > maxContentHeight) {
                  doc.addPage();
                  rowY = 20;
                }
                doc.text(refLines[r], refX, nextLineY);
              }
              yPosition += Math.max(5, (refLines.length * lineHeight));
            } else {
              yPosition += 6;
            }

            yPosition += 2;
          });
        } else {
          // Single-result test
          const sub = (test.subTests && test.subTests[0]) || {};
          let rowY = yPosition;

          // Test name
          doc.setFont('verdana', 'normal').setFontSize(9);
          const displayName = test.name || sub.name || 'Test';
          doc.text(displayName, nameX, rowY);
          rowY += 4;

          // ✅ Method & Specimen right under test name
          if (test.method) {
            doc.setFont('verdana', 'italic').setFontSize(8);
            doc.text(`( Method: ${test.method} )`, nameX + 5, rowY);
            rowY += 4;
          }
          if (test.specimen) {
            doc.setFont('verdana', 'italic').setFontSize(8);
            doc.text(`( Specimen: ${test.specimen} )`, nameX + 5, rowY);
            rowY += 4;
          }

          // ✅ Result bold
          doc.setFont('verdana', 'bold').setFontSize(9);
          const resText = (sub.result !== undefined && sub.result !== null) ? String(sub.result) : (test.result || '-');
          doc.text(resText, resultX, rowY);

          // ✅ Unit bold
          if (sub.unit || test.unit) {
            doc.setFont('verdana', 'bold').setFontSize(9);
            doc.text(sub.unit || test.unit || '', unitsX, rowY);
          }

          // ✅ Reference aligned
          const refLines = formatReferenceRange(sub.reference || test.reference || '', Math.max(40, refColumnWidth));
          doc.setFont('Arial', 'normal').setFontSize(8);
          if (refLines.length > 0) {
            doc.text(refLines[0], refX, rowY);
            for (let r = 1; r < refLines.length; r++) {
              const nextLineY = rowY + (r * lineHeight);
              if (nextLineY + 4 > maxContentHeight) {
                doc.addPage();
                rowY = 20;
              }
              doc.text(refLines[r], refX, nextLineY);
            }
            yPosition += Math.max(6, (refLines.length * lineHeight));
          } else {
            yPosition += 6;
          }

          yPosition += 2;
        }

        // Notes
        if (test.notes?.trim()) {
          const leftMargin = 15;
          const paragraphWidth = pageWidth - leftMargin - 15;
          const cleanedNotes = test.notes.replace(/\s*\n\s*/g, " ");
          const fullNotes = `Notes: ${cleanedNotes}`;
          doc.setFont('verdana', 'normal').setFontSize(9);
          const noteParagraph = doc.splitTextToSize(fullNotes, paragraphWidth);
          yPosition = checkPageBreak(yPosition, noteParagraph.length * 3);
          doc.text(noteParagraph, leftMargin, yPosition);
          yPosition += noteParagraph.length * 3 + 4;
        }

        yPosition += 4; // gap between tests
      });

      if (idx !== actualTestData.length - 1) {
        yPosition = checkPageBreak(yPosition, 8);
        yPosition += 4;
      }
    });

    // End marker
    yPosition += 6;
    if (yPosition + 52 > maxContentHeight) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(10).setFont('helvetica', 'bold');
    doc.text('END OF REPORT', pageWidth / 2, yPosition + 24, { align: 'center' });
    yPosition += 9;

    actualPageCount = doc.internal.getNumberOfPages();
    if (includeHeader) {
      for (let i = 1; i <= actualPageCount; i++) {
        doc.setPage(i);
        addPersistentFooter(doc, pageWidth, pageHeight, i, actualPageCount);
      }
    }
  } catch (err) {
    console.error('Error in generateTestResultsTable:', err);
    doc.setFontSize(10).setFont('helvetica', 'normal').text('PDF Generation Error - Fallback Mode', 20, yPosition);
    yPosition += 15;
    actualPageCount = doc.internal.getNumberOfPages();
    if (includeHeader) {
      for (let i = 1; i <= actualPageCount; i++) {
        doc.setPage(i);
        addPersistentFooter(doc, pageWidth, pageHeight, i, actualPageCount);
      }
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
    
    
    

  const clearSearch = () => {
    setSearchParams({
      sid: '',
      patient_name: '',
      mobile: '',
      date_from: '',
      date_to: ''
    });
    loadReports();
  };

  // Pagination calculations
  const totalItems = reports.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReports = reports.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of table on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };




   



 
  return (
    <div className="billing-reports-container">
      {/* Header */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
          Billing Reports
        </h1>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary" 
            onClick={loadReports}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faSpinner} spin={loading} className="me-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <Row className="mb-4">
          {/* Debug: Log stats object */}
          {console.log('[BillingReports] Rendering stats:', stats)}
          <Col md={3}>
            <Card className="border-left-primary shadow h-100 py-2">
              <Card.Body>
                <Row className="no-gutters align-items-center">
                  <Col className="mr-2">
                    <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                      Total Reports
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                      {stats.total_reports || 0}
                    </div>
                  </Col>
                  <Col xs="auto">
                    <FontAwesomeIcon icon={faFileInvoiceDollar} className="fa-2x text-gray-300" />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-left-success shadow h-100 py-2">
              <Card.Body>
                <Row className="no-gutters align-items-center">
                  <Col className="mr-2">
                    <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                      Total Amount
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                      {billingReportsAPI.formatCurrency(stats.total_amount || 0)}
                    </div>
                  </Col>
                  <Col xs="auto">
                    <FontAwesomeIcon icon={faCheckCircle} className="fa-2x text-gray-300" />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-left-info shadow h-100 py-2">
              <Card.Body>
                <Row className="no-gutters align-items-center">
                  <Col className="mr-2">
                    <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                      Recent Reports (7 days)
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                      {stats.recent_reports_count || 0}
                    </div>
                  </Col>
                  <Col xs="auto">
                    <FontAwesomeIcon icon={faCalendarAlt} className="fa-2x text-gray-300" />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-left-warning shadow h-100 py-2">
              <Card.Body>
                <Row className="no-gutters align-items-center">
                  <Col className="mr-2">
                    <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                      Access Level
                    </div>
                    <div className="h6 mb-0 font-weight-bold text-gray-800">
                      {stats.user_access_level === 'all_franchises' ? 'All Franchises' : 'Own Franchise'}
                    </div>
                  </Col>
                  <Col xs="auto">
                    <FontAwesomeIcon icon={faBuilding} className="fa-2x text-gray-300" />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Search Section */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="m-0 font-weight-bold text-primary">Search Billing Reports</h6>
            {canAccessAllFranchises() && (
              <Dropdown>
                <Dropdown.Toggle variant="outline-primary" size="sm">
                  <FontAwesomeIcon icon={faFilter} className="me-2" />
                  {selectedFranchiseId
                    ? getAvailableFranchises().find(f => f.id === selectedFranchiseId)?.name || 'Select Franchise'
                    : 'All Franchises'
                  }
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item
                    onClick={() => setSelectedFranchiseId(null)}
                    className={!selectedFranchiseId ? 'active' : ''}
                  >
                    <FontAwesomeIcon icon={faBuilding} className="me-2" />
                    All Franchises
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  {getAvailableFranchises().map((franchise) => (
                    <Dropdown.Item
                      key={franchise.id}
                      onClick={() => setSelectedFranchiseId(franchise.id)}
                      className={selectedFranchiseId === franchise.id ? 'active' : ''}
                    >
                      <FontAwesomeIcon icon={faBuilding} className="me-2" />
                      {franchise.name}
                      <small className="text-muted d-block">{franchise.site_code}</small>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3 position-relative">
                <Form.Label>SID Number</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Enter SID number (e.g., MYD001, SKZ001, TNJ001)"
                    value={searchParams.sid}
                    onChange={(e) => handleSIDChange(e.target.value)}
                    onFocus={() => setShowSidSuggestions(sidSuggestions.length > 0)}
                  />
                  <Button variant="outline-secondary" onClick={handleSearch} disabled={searchLoading}>
                    <FontAwesomeIcon icon={faSearch} />
                  </Button>
                </InputGroup>
                
                {/* SID Autocomplete Dropdown */}
                {showSidSuggestions && sidSuggestions.length > 0 && (
                  <div className="sid-suggestions-dropdown">
                    {sidSuggestions.map((sid, index) => (
                      <div
                        key={index}
                        className="sid-suggestion-item"
                        onClick={() => handleSIDSelect(sid)}
                      >
                        {sid}
                      </div>
                    ))}
                  </div>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Patient Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter patient name"
                  value={searchParams.patient_name}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, patient_name: e.target.value }))}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Mobile Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter mobile number"
                  value={searchParams.mobile}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, mobile: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={searchParams.date_from}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, date_from: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={searchParams.date_to}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, date_to: e.target.value }))}
                />
              </Form.Group>
            </Col>
          </Row>
          
          {/* HEADER TOGGLE OPTION: PDF Generation Settings */}
          <Row className="mb-3">
            <Col md={12}>
              <Card className="border-info">
                <Card.Body className="py-2">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <FontAwesomeIcon icon={faDownload} className="text-info me-2" />
                      <span className="fw-bold text-info">PDF Generation Options:</span>
                    </div>
                    <Form.Check
                      type="switch"
                      id="include-header-switch"
                      label="Include Header in PDF"
                      checked={includeHeader}
                      onChange={(e) => setIncludeHeader(e.target.checked)}
                      className="mb-0"
                    />
                  </div>
                  <small className="text-muted">
                    {includeHeader
                      ? "PDF will include pink header bar with logo on all pages"
                      : "PDF will be generated without header bar for cleaner layout"
                    }
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <div className="d-flex gap-2">
            <Button
              variant="primary"
              onClick={handleSearch}
              disabled={searchLoading}
            >
              <FontAwesomeIcon icon={searchLoading ? faSpinner : faSearch} spin={searchLoading} className="me-2" />
              Search Reports
            </Button>
            <Button variant="outline-secondary" onClick={clearSearch}>
              Clear
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Enhanced PDF Debug Section */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-success">Enhanced PDF Generation Status</h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={8}>
              <div className="d-flex align-items-center mb-2">
                <FontAwesomeIcon
                  icon={jsPDF ? faCheckCircle : faExclamationTriangle}
                  className={`me-2 ${jsPDF ? 'text-success' : 'text-danger'}`}
                />
                <span className={jsPDF ? 'text-success' : 'text-danger'}>
                  jsPDF Library: {jsPDF ? 'Available' : 'Not Available'}
                </span>
              </div>
              <div className="d-flex align-items-center mb-2">
                <FontAwesomeIcon
                  icon={QRCode ? faCheckCircle : faExclamationTriangle}
                  className={`me-2 ${QRCode ? 'text-success' : 'text-warning'}`}
                />
                <span className={QRCode ? 'text-success' : 'text-warning'}>
                  QRCode Library: {QRCode ? 'Available' : 'Not Available (QR codes disabled)'}
                </span>
              </div>
              <div className="d-flex align-items-center mb-2">
                <FontAwesomeIcon
                  icon={JsBarcode ? faCheckCircle : faExclamationTriangle}
                  className={`me-2 ${JsBarcode ? 'text-success' : 'text-warning'}`}
                />
                <span className={JsBarcode ? 'text-success' : 'text-warning'}>
                  JsBarcode Library: {JsBarcode ? 'Available' : 'Not Available (Barcodes disabled)'}
                </span>
              </div>
              <small className="text-muted">
                Enhanced PDF features: Compact spacing, dynamic signatures, separate reference ranges, accurate page numbering
              </small>
            </Col>
            <Col md={4}>
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => {
                  console.log('=== ENHANCED PDF LIBRARIES TEST ===');
                  console.log('jsPDF:', !!jsPDF, typeof jsPDF);
                  console.log('QRCode:', !!QRCode, typeof QRCode);
                  console.log('JsBarcode:', !!JsBarcode, typeof JsBarcode);
                  console.log('autoTable:', autoTableAvailable);
                  console.log('Current User:', user);
                  console.log('Current Tenant:', currentTenantContext);
                  console.log('=== END TEST ===');
                  alert('Enhanced PDF libraries test completed. Check console for details.');
                }}
                className="w-100"
              >
                Test Enhanced PDF Libraries
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          {error}
        </Alert>
      )}

      {/* Reports Table */}
      <Card className="shadow">
        <Card.Header className="py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="m-0 font-weight-bold text-primary">
              Billing Reports ({reports.length})
            </h6>
            {reports.length > 0 && (
              <small className="text-muted">
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} reports
              </small>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading billing reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-4">
              <FontAwesomeIcon icon={faInfoCircle} size="3x" className="text-muted mb-3" />
              <h5 className="text-muted">No billing reports found</h5>
              <p className="text-muted">Try adjusting your search criteria or create a new billing record.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>SID Number</th>
                      <th>Patient</th>
                      <th>Clinic</th>
                      <th>Billing Date</th>
                      <th>Tests</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Authorization</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(paginatedReports) ? paginatedReports.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <strong className="text-primary">{report.sid_number}</strong>
                      </td>
                      <td>
                        <div>
                          <FontAwesomeIcon icon={faUser} className="me-1 text-muted" />
                          {report.patient_name}
                        </div>
                        {report.patient_mobile && (
                          <small className="text-muted">
                            <FontAwesomeIcon icon={faPhone} className="me-1" />
                            {report.patient_mobile}
                          </small>
                        )}
                      </td>
                      <td>
                        <FontAwesomeIcon icon={faBuilding} className="me-1 text-muted" />
                        {report.clinic_name}
                      </td>
                      <td>
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-1 text-muted" />
                        {billingReportsAPI.formatDate(report.billing_date)}
                      </td>
                      <td>
                        <Badge bg="info">{report.test_count} tests</Badge>
                      </td>
                      <td>
                        <strong>{billingReportsAPI.formatCurrency(report.total_amount)}</strong>
                      </td>
                      <td>
                        <Badge bg={billingReportsAPI.getStatusVariant(report.status)}>
                          {report.status}
                        </Badge>
                      </td>
                      <td>
                        {report.authorized ? (
                          <Badge bg="success" className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                            Authorized
                          </Badge>
                        ) : report.authorization_status === 'rejected' ? (
                          <Badge bg="danger" className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                            Rejected
                          </Badge>
                        ) : (
                          <Badge bg="warning" className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faSpinner} className="me-1" />
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>View Report Details</Tooltip>}
                          >
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleViewReport(report)}
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </Button>
                          </OverlayTrigger>
{/* {
                report.authorized && (
                  <>
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>Download PDF Report</Tooltip>}
                          >
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleDownloadPDF(report)}
                              className="ms-1"
                              disabled={downloadingPDF}
                            >
                              {downloadingPDF ? (
                                <FontAwesomeIcon icon={faSpinner} spin />
                              ) : (
                                <FontAwesomeIcon icon={faDownload} />
                              )}
                            </Button>
                          </OverlayTrigger>

                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>Download PDF</Tooltip>}
                          >
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleDownloadPDF(report)}
                            >
                              <FontAwesomeIcon icon={faDownload} />
                            </Button>
                          </OverlayTrigger>
</>)
                            } */}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="8" className="text-center text-danger">
                        Error: Reports data is not an array (type: {typeof paginatedReports})
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  showInfo={false}
                  size="sm"
                />
              </div>
            )}
          </>
          )}
        </Card.Body>
      </Card>

      {/* Report Details Modal */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} size="xl" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
            Billing Report Details
            {selectedReport && (
              <Badge bg="primary" className="ms-2">{selectedReport.sid_number}</Badge>
            )}
          </Modal.Title>
          { (
            <Button
              variant="success"
              size="sm"
              onClick={() => handleDownloadPDF(selectedReport)}
              className="ms-auto"
              disabled={!selectedReport?.authorized}
            >
              {downloadingPDF ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin className="me-1" />
                  Downloading...
                </>
              ) : (
                <>
               {
               
  selectedReport?.authorized ? (
    <>
    
      <FontAwesomeIcon icon={faDownload} className="me-1" />
      Download PDF
    </>
  ) : (
  <div
  className="d-flex align-items-center text-gray-400 cursor-not-allowed pointer-events-none"
  title="Access Denied: Unauthorized"
>
  <FontAwesomeIcon icon={faLock} className="me-1" />
  Download PDF
</div>

  )
}

                 
                </>
              )}
            </Button>
          )}
        </Modal.Header>
        <Modal.Body>
          {reportModalLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading report details...</p>
            </div>
          ) : selectedReport ? (
            <div>
              {/* Enhanced PDF Options Section */}
              <Card className="mb-4 bg-white">
                <Card.Body>
                  <h6 className="text-primary mb-3">
                    <FontAwesomeIcon icon={faDownload} className="me-2" />
                    Enhanced PDF Download Options
                  </h6>
                  <Row>
                    <Col md={6}>
                      <Form.Check
                        type="checkbox"
                        id="include-header-checkbox-modal"
                        label="Include Header in PDF"
                        checked={includeHeader}
                        onChange={(e) => setIncludeHeader(e.target.checked)}
                        className="mb-2"
                      />
                      <small className="text-muted">
                        Enhanced PDF with optimized spacing, dynamic signatures, and professional formatting.
                      </small>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex align-items-center mb-3">
                        <FontAwesomeIcon icon={faInfoCircle} className="text-info me-2" />
                        <small className="text-muted">
                          Enhanced PDF includes QR codes, dynamic user signatures, and optimized medical report layout.
                        </small>
                      </div>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => {
                          console.log('=== ENHANCED PDF DEBUG INFO - BILLING REPORTS ===');
                          console.log('Current User:', user);
                          console.log('Current Tenant:', currentTenantContext);
                          console.log('Selected Report:', selectedReport);
                          console.log('Report Keys:', Object.keys(selectedReport || {}));
                          console.log('Patient Info:', selectedReport?.patient_info);
                          console.log('Test Items:', selectedReport?.test_items);
                          console.log('Clinic Info:', selectedReport?.clinic_info);
                          console.log('Financial Summary:', selectedReport?.financial_summary);
                          console.log('Enhanced PDF Libraries Status:');
                          console.log('- jsPDF available:', !!jsPDF);
                          console.log('- QRCode available:', !!QRCode);
                          console.log('- JsBarcode available:', !!JsBarcode);
                          console.log('- autoTable available:', autoTableAvailable);
                          console.log('User Access Level:', user?.role);
                          console.log('User Tenant ID:', user?.tenant_id);
                          console.log('Report Tenant ID:', selectedReport?.tenant_id);
                          console.log('Enhanced Features Status:');
                          console.log('- Compact spacing: ENABLED');
                          console.log('- Separate reference ranges: ENABLED');
                          console.log('- Dynamic signatures: ENABLED');
                          console.log('- Fixed page numbering: ENABLED');

                          // Test data transformation
                          if (selectedReport) {
                            const transformedData = transformReportDataForPDF(selectedReport);
                            console.log('Transformed Test Data:', transformedData);
                          }

                          console.log('=== END ENHANCED PDF DEBUG INFO ===');
                          alert('Check browser console for detailed enhanced PDF debug information');
                        }}
                        className="me-2"
                      >
                        Debug Enhanced PDF
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          console.log('Testing Enhanced PDF libraries...');
                          console.log('jsPDF available:', !!jsPDF);
                          console.log('QRCode available:', !!QRCode);
                          console.log('JsBarcode available:', !!JsBarcode);
                          console.log('autoTable available:', autoTableAvailable);
                          console.log('PDF Libraries Import Status:');
                          console.log('- jsPDF type:', typeof jsPDF);
                          console.log('- QRCode type:', typeof QRCode);
                          console.log('- JsBarcode type:', typeof JsBarcode);
                          alert('Check browser console for enhanced PDF library status');
                        }}
                      >
                        Test Libraries
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
              {/* Report Header */}
              <Row className="mb-4 bg-white">
                <Col md={6}>
                  <Card className="border-left-primary bg-white h-100">
                    <Card.Body>
                      <h6 className="text-primary mb-2">Report Information</h6>
                      <p className="mb-1"><strong>SID Number:</strong> {selectedReport.sid_number}</p>
                      <p className="mb-1"><strong>Billing Date:</strong> {billingReportsAPI.formatDate(selectedReport.billing_date)}</p>
                      <p className="mb-1"><strong>Generated:</strong> {billingReportsAPI.formatDateTime(selectedReport.generation_timestamp)}</p>
                      <p className="mb-0"><strong>Status:</strong> <Badge bg={billingReportsAPI.getStatusVariant(selectedReport.metadata?.status)}>{selectedReport.metadata?.status}</Badge></p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border-left-info bg-white h-100">
                    <Card.Body>
                      <h6 className="text-info mb-2">Clinic Information</h6>
                      <p className="mb-1"><strong>Clinic:</strong> {selectedReport.clinic_info?.name}</p>
                      <p className="mb-1"><strong>Site Code:</strong> {selectedReport.clinic_info?.site_code}</p>
                      <p className="mb-1"><strong>Contact:</strong> {selectedReport.clinic_info?.contact_phone}</p>
                      <p className="mb-0"><strong>Email:</strong> {selectedReport.clinic_info?.email}</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Patient Information */}
              <h6 className="text-primary mb-3">
                <FontAwesomeIcon icon={faUser} className="me-2" />
                Patient Information
              </h6>
              <Row className="mb-3">
                <Col md={6}>
                  <p className="mb-1"><strong>Name:</strong> {selectedReport.patient_info?.full_name}</p>
                  <p className="mb-1"><strong>Patient ID:</strong> {selectedReport.patient_info?.patient_id}</p>
                  <p className="mb-1"><strong>Date of Birth:</strong> {billingReportsAPI.formatDate(selectedReport.patient_info?.date_of_birth)}</p>
                </Col>
                <Col md={6}>
                  <p className="mb-1"><strong>Age/Gender:</strong> {selectedReport.patient_info?.age} / {selectedReport.patient_info?.gender}</p>
                  <p className="mb-1"><strong>Blood Group:</strong> {selectedReport.patient_info?.blood_group || 'N/A'}</p>
                  <p className="mb-1"><strong>Mobile:</strong> {selectedReport.patient_info?.mobile}</p>
                </Col>
              </Row>
              {selectedReport.patient_info?.email && (
                <Row className="mb-3">
                  <Col md={12}>
                    <p className="mb-1"><strong>Email:</strong> {selectedReport.patient_info?.email}</p>
                  </Col>
                </Row>
              )}

              {/* Billing Header */}
              {selectedReport.billing_header && (
                <>
                  <h6 className="text-primary mb-3">
                    <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
                    Billing Information
                  </h6>
                  <Row className="mb-3">
                    <Col md={6}>
                      <p className="mb-1"><strong>Invoice Number:</strong> {selectedReport.billing_header.invoice_number}</p>
                      <p className="mb-1"><strong>Referring Doctor:</strong> {selectedReport.billing_header.referring_doctor}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1"><strong>Payment Status:</strong> {selectedReport.billing_header.payment_status}</p>
                      <p className="mb-1"><strong>Payment Method:</strong> {selectedReport.billing_header.payment_method}</p>
                    </Col>
                  </Row>
                </>
              )}

              {/* Test Items - Enhanced Card Layout */}
              {/* <PaginatedTestCards
                testItems={selectedReport.test_items || []}
                title="Test Details"
                itemsPerPage={5}
              /> */}

              {/* Unmatched Tests Warning */}
              {selectedReport.unmatched_tests && selectedReport.unmatched_tests.length > 0 && (
                <Alert variant="warning" className="mb-3">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                  <strong>Unmatched Tests ({selectedReport.unmatched_tests.length}):</strong>
                  <ul className="mb-0 mt-2">
                    {selectedReport.unmatched_tests.map((test, index) => (
                      <li key={index}>{test}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              {/* Financial Summary */}
              <h6 className="text-primary mb-3">
                <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                Financial Summary
              </h6>
              {selectedReport.financial_summary && (
                <Row>
                  <Col md={6}>
                    <p className="mb-1"><strong>Bill Amount:</strong> {billingReportsAPI.formatCurrency(selectedReport.financial_summary.bill_amount)}</p>
                    <p className="mb-1"><strong>Other Charges:</strong> {billingReportsAPI.formatCurrency(selectedReport.financial_summary.other_charges)}</p>
                    <p className="mb-1"><strong>Discount ({selectedReport.financial_summary.discount_percent}%):</strong> {billingReportsAPI.formatCurrency(selectedReport.financial_summary.discount_amount)}</p>
                    <p className="mb-1"><strong>Subtotal:</strong> {billingReportsAPI.formatCurrency(selectedReport.financial_summary.subtotal)}</p>
                  </Col>
                  <Col md={6}>
                    <p className="mb-1"><strong>GST ({selectedReport.financial_summary.gst_rate}%):</strong> {billingReportsAPI.formatCurrency(selectedReport.financial_summary.gst_amount)}</p>
                    <p className="mb-1"><strong>Total Amount:</strong> <span className="text-success fw-bold">{billingReportsAPI.formatCurrency(selectedReport.financial_summary.total_amount)}</span></p>
                    <p className="mb-1"><strong>Paid Amount:</strong> {billingReportsAPI.formatCurrency(selectedReport.financial_summary.paid_amount)}</p>
                    <p className="mb-0"><strong>Balance:</strong> <span className={selectedReport.financial_summary.balance > 0 ? 'text-danger fw-bold' : 'text-success'}>{billingReportsAPI.formatCurrency(selectedReport.financial_summary.balance)}</span></p>
                  </Col>
                </Row>
              )}

              {/* Report Metadata */}
              {selectedReport.metadata && (
                <>
                  <h6 className="text-primary mb-3 mt-4">Report Metadata</h6>
                  <Row>
                    <Col md={6}>
                      <p className="mb-1"><strong>Test Match Rate:</strong>
                        <span className={billingReportsAPI.getMatchRateColor(selectedReport.metadata.test_match_success_rate)}>
                          {' '}{Math.round(selectedReport.metadata.test_match_success_rate * 100)}%
                        </span>
                      </p>
                      <p className="mb-1"><strong>Total Tests:</strong> {selectedReport.metadata.total_tests}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1"><strong>Matched Tests:</strong> {selectedReport.metadata.matched_tests_count}</p>
                      <p className="mb-1"><strong>Unmatched Tests:</strong> {selectedReport.metadata.unmatched_tests_count}</p>
                    </Col>
                  </Row>
                </>
              )}
            </div>
          ) : (
            <Alert variant="warning">No report details available</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReportModal(false)}>
            Close
          </Button>
          { (
            <Button
              variant="primary"
              onClick={() => handleDownloadPDF(selectedReport)}
              disabled={!selectedReport?.authorized}
            >
              <FontAwesomeIcon icon={faDownload} className="me-2" />
              Download PDF
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BillingReports;
