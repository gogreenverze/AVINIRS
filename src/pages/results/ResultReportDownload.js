import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Form, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faDownload, faFilePdf, faFileWord,
  faFileExcel, faFileText, faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { resultAPI } from '../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Optional: for table formatting
import autoTable from 'jspdf-autotable';
import logos from "../../components/layouts/logo.png"
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';


const ResultReportDownload = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState('pdf');

  // Fetch report details on component mount
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await resultAPI.getResultById(id);
        setReport(response.data);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load report. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };



  const generateBarcodeBase64 = (text) => {
    // Create hidden canvas element
    const canvas = document.createElement('canvas');

    // Generate barcode on canvas
    JsBarcode(canvas, text, {
      format: "CODE128",
      displayValue: false,
      width: 2,
      height: 40,
      margin: 0,
    });

    // Get base64 image string from canvas
    return canvas.toDataURL('image/png');
  };

  // Generate report content
  const generateReportContent = async () => {
    return `
AVINI Labs Management System
Laboratory Test Report

========================================
REPORT INFORMATION
========================================
Report ID: ${report.id}
Test Date: ${formatDate(report.tested_at)}
Report Date: ${formatDate(new Date().toISOString())}
Status: ${report.status}

========================================
PATIENT INFORMATION
========================================
Name: ${report.patient?.first_name} ${report.patient?.last_name}
Age: ${report.patient?.age || 'N/A'}
Gender: ${report.patient?.gender || 'N/A'}
Phone: ${report.patient?.phone || 'N/A'}
Email: ${report.patient?.email || 'N/A'}

========================================
SAMPLE INFORMATION
========================================
Sample ID: ${report.sample?.sample_id || 'N/A'}
Collection Date: ${formatDate(report.sample?.collection_date)}
Sample Type: ${report.sample?.sample_type || 'N/A'}
Container: ${report.sample?.container || 'N/A'}

========================================
TEST RESULTS
========================================
Test Name: ${report.test.test_name}
Result: ${report.result_value} ${report.unit || ''}
Normal Range: ${report.normal_range || 'N/A'}
Method: ${report.method || 'N/A'}

========================================
VERIFICATION
========================================
Tested By: ${report.technician || 'N/A'}
Tested Date: ${formatDate(report.tested_at)}
Verified By: ${report.verified_by || 'Pending Verification'}
Verified Date: ${formatDate(report.verified_at)}

${report.notes ? `========================================
NOTES
========================================
${report.notes}` : ''}

========================================
This is a computer-generated report.
For any queries, please contact the laboratory.
Report generated on: ${formatDate(new Date().toISOString())}
========================================
    `.trim();
  };

  // Handle download
  const handleDownload = async () => {
    try {
      setDownloading(true);

      const content = await generateReportContent();


      let blob;
      let filename;

      switch (downloadFormat) {
        case 'pdf':
          // For PDF, we'll create a simple text file for now
          // In a real application, you'd use a PDF library like jsPDF
          // blob = new Blob([content], { type: 'text/plain' });
          // filename = `report_${report.id}.txt`;
          await handleDownloadpdf(); // make sure it's async if needed
          setTimeout(() => {
            navigate(`/results/reports/${id}`);
          }, 2000);


          break;

        case 'word':
          // For Word, create a simple text file
          // In a real application, you'd use a library like docx
          blob = new Blob([content], { type: 'text/plain' });
          filename = `report_${report.id}.txt`;
          break;

        case 'excel':
          // For Excel, create CSV format
          const csvContent = `Report Information\n` +
            `Report ID,${report.id}\n` +
            `Test Date,${formatDate(report.tested_at)}\n` +
            `Status,${report.status}\n\n` +
            `Patient Information\n` +
            `Name,${report.patient?.first_name} ${report.patient?.last_name}\n` +
            `Age,${report.patient?.age || 'N/A'}\n` +
            `Gender,${report.patient?.gender || 'N/A'}\n` +
            `Phone,${report.patient?.phone || 'N/A'}\n\n` +
            `Test Results\n` +
            `Test Name,Result,Unit,Normal Range,Method\n` +
            `${report.test_name},${report.result_value},${report.unit || ''},${report.normal_range || 'N/A'},${report.method || 'N/A'}\n`;

          blob = new Blob([csvContent], { type: 'text/csv' });
          filename = `report_${report.id}.csv`;
          break;

        case 'text':
        default:
          blob = new Blob([content], { type: 'text/plain' });
          filename = `report_${report.id}.txt`;
          break;
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Show success message and redirect after delay
      setTimeout(() => {
        navigate(`/results/reports/${id}`);
      }, 2000);

    } catch (err) {
      console.error('Error downloading report:', err);
      // setError('Failed to download report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };





  const generateQRCodeBase64 = async (text) => {
    try {
      return await QRCode.toDataURL(text, { width: 100 });
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleDownloadpdf = async () => {
    const doc = new jsPDF();
    const content = await generateReportContent(); // Your full report content string
    // const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    const lines = content.split('\n');
    const qrText = report.verified_by || 'N/A';
    const qrCodeImg = await generateQRCodeBase64(qrText);


      const pageHeight = doc.internal.pageSize.getHeight();
const pageWidth = doc.internal.pageSize.getWidth();


    const pageCount = doc.internal.getNumberOfPages();
for (let i = 1; i <= pageCount; i++) {
  doc.setPage(i);

 const contactY = pageHeight - 20;
doc.setFontSize(6);
doc.setFont('helvetica', 'bold');
doc.setTextColor(80, 80, 80); // Gray color

const branches = [
  { name: 'Mayiladuthurai', phone: '6384440505' },
  { name: 'Chidambaram', phone: '6384440502' },
  { name: 'Kumbakonam', phone: '6384440503' },
  { name: 'Thanjavur', phone: '6384440520' },
  { name: 'Needamangalam', phone: '6384440509' },
  { name: 'Kuthalam', phone: '9488776966' },
  { name: 'Aduthurai', phone: '6384440510' },
  { name: 'Thiruppanandal', phone: '6384440521' },
  { name: 'Sankaranpanthal', phone: '6384440507' },
  { name: 'Eravancherry', phone: '6384440508' },
  { name: 'Nachiyarkovil', phone: '6384440506' },
];

// Build name line and phone line with single pipe separator
const nameLine = branches.map(branch => branch.name).join(' | ');
const phoneLine = branches.map(branch => branch.phone).join(' | ');

// Centered on page
doc.text(nameLine, pageWidth / 2, contactY, { align: 'center' });
doc.text(phoneLine, pageWidth / 2, contactY + 4, { align: 'center' });


  // Footer colored bar
  doc.setFillColor('#bb016d');
  doc.rect(0, pageHeight - 10, pageWidth, 6, 'F');

  // Page number
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Page ${i} of ${pageCount}`, pageWidth - 10, contactY + 6, { align: 'right' });
}


    // Add barcode image small size (width 50, height 15 or so)

    const drawFooter = (doc, qrCodeImg) => {
      const footerY = doc.internal.pageSize.getHeight() - 60;
      const pageWidth = doc.internal.pageSize.getWidth();


      // Footer divider text
      doc.setFontSize(10);
      doc.text(
        '----------------------------End of the Report-----------------------------',
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );

      // Left footer text
      doc.setFontSize(9);
      doc.text('Verified By', 15, footerY + 10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${report.technician ? report.technician : "N/A"}`, 10, footerY + 16);
      doc.setFont('helvetica', 'bold');
      doc.text('Lab Technician', 10, footerY + 22);
      // QR code centered
      if (qrCodeImg) {
        const qrSize = 40;
        const qrX = pageWidth / 2 - qrSize / 2;
        const qrY = footerY - 5;
        doc.addImage(qrCodeImg, 'PNG', qrX, qrY, qrSize, qrSize);
      }

      // Right footer text
      const nameX = pageWidth - 50;
      const nameY = footerY + 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Dr. S.Asokkumar, PhD.', nameX, nameY);
      doc.setFont('helvetica', 'bold');
      doc.text('Clinical Biochemist & Q M', nameX, nameY + 6);



      // Page numbering
      // const pageCount = doc.internal.getNumberOfPages();
      // for (let i = 1; i <= pageCount; i++) {
      //   doc.setPage(i);
      //   doc.setFontSize(9);
      //   doc.setFont('helvetica', 'italic');
      //   doc.text(`Page ${i} of ${pageCount}`, pageWidth - 10, 290, { align: 'right' });
      // }

      
    };


 
    const logo = new Image();
    logo.src = logos; // logos = base64 or image path

    logo.onload = () => {
      drawFooter(doc, qrCodeImg);

      // 1. Header Logo
      doc.addImage(logo, 'PNG', 10, 10, 50, 20);


      // 2. Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Final Test Report', doc.internal.pageSize.getWidth() / 2, 74, { align: 'center' });

      // 3. Extract helper
      const getLine = (label) => {
        const line = lines.find(l => l.toLowerCase().startsWith(label.toLowerCase()));
        return line ? line.split(':')[1]?.trim() : 'N/A';
      };

      // 4. Extract values
      const patientName = getLine('Name');
      const age = getLine('Age');
      const gender = getLine('Gender');
      const referrer = getLine('Referrer');
      const branch = getLine('Branch');

      const sid = getLine('Report ID');
      const regDate = getLine('Test Date');
      const collDate = getLine('Collection Date');
      const reportDate = getLine('Report Date');

      // 5. Patient Info
      let y = 45;
      doc.setFontSize(10);
      doc.setFont('helvetica', '');
      const barcodeImg = generateBarcodeBase64(sid || 'N/A');

      const barcodeX = 130;
      const barcodeY = 45 - 26;  // a bit above SID No.

      doc.addImage(barcodeImg, 'PNG', barcodeX, barcodeY, 50, 15);



      doc.text(`Patient       : ${patientName}`, 10, y);
      doc.text(`Age / Sex     : ${age} / ${gender}`, 10, y + 6);
      doc.text(`Referrer      : ${referrer}`, 10, y + 12);
      doc.text(`Branch        : ${branch}`, 10, y + 18);

      doc.text(`SID No.              : ${sid}`, 130, y);
      doc.text(`Reg Date & Time      : ${regDate}`, 130, y + 6);
      doc.text(`Coll Date & Time     : ${collDate}`, 130, y + 12);
      doc.text(`Report Date & Time   : ${reportDate}`, 130, y + 18);

      // Divider
      doc.line(10, y + 25, 200, y + 25);

      // 6. Test Result Table
      const testName = getLine('Test Name') || 'Not Available';
      const result = getLine('Result') || '0';
      const unit = result.split(' ').pop() || '';
      const resultValue = result.replace(unit, '').trim();
      const method = getLine('Method') || 'N/A';
      const range = getLine('Normal Range') || 'N/A';

      // const tableY = y + 30;
      y += 30;
      doc.line(10, y, 200, y);
      y += 10;

      // Helper: create table from an object (keys = headers, values = row)
      function addInfoTable(title, dataObj, startY) {
        const headers = Object.keys(dataObj);
        const values = Object.values(dataObj);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 10, startY);

        autoTable(doc, {
          startY: startY + 5,
          head: [headers],
          body: [values],
          theme: 'plain',
          styles: { fontSize: 9, cellPadding: 3, lineWidth: 0, },
          headStyles: { fillColor: [230, 230, 230], textColor: 0, lineWidth: 0, fontStyle: 'bold', halign: 'center' },
          bodyStyles: { halign: 'center' },
          margin: { left: 10, right: 10 },
        });

        return doc.lastAutoTable.finalY + 20;
      }

      // Build each section's data object from your `report` data
      const reportInfo = {
        'Report ID': report.id || 'N/A',
        'Test Date': formatDate(report.tested_at),
        'Report Date': formatDate(new Date().toISOString()),
        'Status': report.status || 'N/A',
      };

      // const patientInfo = {
      //   'Name': `${report.patient?.first_name || ''} ${report.patient?.last_name || ''}`.trim() || 'N/A',
      //   'Age': report.patient?.age || 'N/A',
      //   'Gender': report.patient?.gender || 'N/A',
      //   'Phone': report.patient?.phone || 'N/A',
      //   'Email': report.patient?.email || 'N/A',
      // };

      const sampleInfo = {
        'Sample ID': report.sample?.sample_id || 'N/A',
        'Collection Date': formatDate(report.sample?.collection_date),
        'Sample Type': report.sample?.sample_type || 'N/A',
        'Container': report.sample?.container || 'N/A',
      };

      const verificationInfo = {
        'Tested By': report.technician || 'N/A',
        'Tested Date': formatDate(report.tested_at),
        'Verified By': report.verified_by || 'Pending Verification',
        'Verified Date': formatDate(report.verified_at),
      };

      // Add tables one by one
      y = addInfoTable('REPORT INFORMATION', reportInfo, y);
      // y = addInfoTable('PATIENT INFORMATION', patientInfo, y);
      y = addInfoTable('SAMPLE INFORMATION', sampleInfo, y);

      // Test Results Table (customized columns)
      const testResultsHeaders = ['Test Name', 'Result', 'Units', 'Normal Range', 'Method'];
      const testResultsBody = [[
        report.test_name || 'N/A',
        report.result_value || 'N/A',
        report.unit || 'N/A',
        report.normal_range || 'N/A',
        report.method || 'N/A',
      ]];

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TEST RESULTS', 10, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        head: [testResultsHeaders],
        body: testResultsBody,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 3, lineWidth: 0, },
        headStyles: { fillColor: [230, 230, 230], textColor: 0, lineWidth: 0, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { halign: 'center' },
        margin: { left: 10, right: 10 },
      });

      y = doc.lastAutoTable.finalY + 10;

      y = addInfoTable('VERIFICATION', verificationInfo, y);

      // Add Notes section if available as wrapped text lines
      if (report.notes) {
        const notesLines = doc.splitTextToSize(report.notes, 180);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('NOTES', 10, y);
        y += 5;

        autoTable(doc, {
          startY: y,
          head: [['Notes']],
          body: notesLines.map(line => [line]),
          theme: 'plain',
          styles: { fontSize: 9, cellPadding: 3, lineWidth: 0 },
          headStyles: { fillColor: [230, 230, 230], textColor: 0, lineWidth: 0, fontStyle: 'bold' },
          margin: { left: 10, right: 10 },
        });

        y = doc.lastAutoTable.finalY + 10;
      }

      // Footer



      const safeName = patientName.replace(/[^a-z0-9]/gi, '_'); // replace non-alphanum with underscore
      doc.save(`${safeName}.pdf`);
    };

  };


  // Get format icon
  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf':
        return faFilePdf;
      case 'word':
        return faFileWord;
      case 'excel':
        return faFileExcel;
      case 'text':
      default:
        return faFileText;
    }
  };





  if (loading) {
    return (
      <div className="text-center my-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <Alert variant="danger">
          {error}
        </Alert>
        <Button variant="secondary" onClick={() => navigate('/results/reports')}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to Reports
        </Button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container-fluid">
        <Alert variant="warning">
          Report not found.
        </Alert>
        <Button variant="secondary" onClick={() => navigate('/results/reports')}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to Reports
        </Button>
      </div>
    );
  }

  return (
    <div className="result-report-download-container">
      {/* Header */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          Download Report #{report.id}
        </h1>
        <Button
          variant="secondary"
          onClick={() => navigate(`/results/reports/${id}`)}
          className="btn-sm"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to Report
        </Button>
      </div>

      {/* Download Options */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Download Options</h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6>Report Information</h6>
              <p><strong>Report ID:</strong> {report.id}</p>
              <p><strong>Patient:</strong> {report.patient?.first_name} {report.patient?.last_name}</p>
              <p><strong>Test:</strong> {report.test_name}</p>
              <p><strong>Status:</strong> {report.status}</p>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label><strong>Select Download Format</strong></Form.Label>
                <Form.Select
                  value={downloadFormat}
                  onChange={(e) => setDownloadFormat(e.target.value)}
                >
                  <option value="text">Text File (.txt)</option>
                  <option value="pdf">PDF Document (.pdf) </option>
                  <option value="word">Word Document (.doc) - Coming Soon</option>
                  <option value="excel">Excel Spreadsheet (.csv)</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  Choose the format you prefer for downloading the report.
                </Form.Text>
              </Form.Group>

              <div className="d-grid">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => handleDownload()}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                      Preparing Download...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={getFormatIcon(downloadFormat)} className="me-2" />
                      Download Report
                    </>
                  )}
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Format Information */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Format Information</h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <div className="text-center p-3 border rounded">
                <FontAwesomeIcon icon={faFileText} size="2x" className="text-secondary mb-2" />
                <h6>Text File</h6>
                <p className="small text-muted">Simple text format, compatible with all devices</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center p-3 border rounded">
                <FontAwesomeIcon icon={faFilePdf} size="2x" className="text-danger mb-2" />
                <h6>PDF Document</h6>
                <p className="small text-muted">Professional format, preserves formatting</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center p-3 border rounded">
                <FontAwesomeIcon icon={faFileWord} size="2x" className="text-primary mb-2" />
                <h6>Word Document</h6>
                <p className="small text-muted">Editable document format (Coming Soon)</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center p-3 border rounded">
                <FontAwesomeIcon icon={faFileExcel} size="2x" className="text-success mb-2" />
                <h6>Excel/CSV</h6>
                <p className="small text-muted">Spreadsheet format for data analysis</p>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {downloading && (
        <Alert variant="info">
          <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
          Preparing your download... You will be redirected back to the report once the download starts.
        </Alert>
      )}
    </div>
  );
};

export default ResultReportDownload;
