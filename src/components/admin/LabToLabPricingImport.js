import React, { useState, useRef } from 'react';
import { Card, Form, Button, Row, Col, Table, Badge, Alert, Modal, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUpload, faDownload, faFileExcel, faCheckCircle, faExclamationTriangle,
  faInfoCircle, faTimes, faSpinner, faFileImport, faTable
} from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';

const LabToLabPricingImport = ({ onImportComplete, onClose }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [previewData, setPreviewData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importResults, setImportResults] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  // Expected Excel columns for lab-to-lab pricing
  const expectedColumns = [
    'dept_code',
    'dept_name', 
    'scheme_code',
    'scheme_name',
    'test_type',
    'test_code',
    'test_name',
    'default_price',
    'scheme_price',
    'price_percentage',
    'is_active'
  ];

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        alert('Please select a valid Excel file (.xlsx or .xls)');
        return;
      }
      setFile(selectedFile);
      setPreviewData([]);
      setValidationErrors([]);
      setImportResults(null);
      setShowPreview(false);
    }
  };

  const previewExcelData = async () => {
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        setValidationErrors(['Excel file is empty or has no valid data']);
        return;
      }

      // Validate columns
      const fileColumns = Object.keys(jsonData[0]);
      const missingColumns = expectedColumns.filter(col => !fileColumns.includes(col));
      const extraColumns = fileColumns.filter(col => !expectedColumns.includes(col));

      const errors = [];
      if (missingColumns.length > 0) {
        errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
      }
      if (extraColumns.length > 0) {
        errors.push(`Unexpected columns found: ${extraColumns.join(', ')}`);
      }

      // Validate data types and required fields
      jsonData.forEach((row, index) => {
        if (!row.test_code || !row.test_name) {
          errors.push(`Row ${index + 2}: Missing test_code or test_name`);
        }
        if (!row.default_price || isNaN(parseFloat(row.default_price))) {
          errors.push(`Row ${index + 2}: Invalid default_price`);
        }
        if (!row.scheme_price || isNaN(parseFloat(row.scheme_price))) {
          errors.push(`Row ${index + 2}: Invalid scheme_price`);
        }
      });

      setValidationErrors(errors);
      setPreviewData(jsonData.slice(0, 10)); // Show first 10 rows for preview
      setShowPreview(true);

    } catch (error) {
      console.error('Error reading Excel file:', error);
      setValidationErrors(['Error reading Excel file. Please check the file format.']);
    }
  };

  const importPricingData = async () => {
    if (!file || validationErrors.length > 0) return;

    try {
      setImporting(true);
      setImportProgress(0);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Process data in batches
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < jsonData.length; i += batchSize) {
        batches.push(jsonData.slice(i, i + batchSize));
      }

      let processedCount = 0;
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        try {
          // Transform data to match backend format
          const transformedBatch = batch.map(row => ({
            dept_code: row.dept_code,
            dept_name: row.dept_name,
            scheme_code: row.scheme_code,
            scheme_name: row.scheme_name,
            test_type: row.test_type || 'T',
            test_code: row.test_code,
            test_name: row.test_name,
            default_price: parseFloat(row.default_price),
            scheme_price: parseFloat(row.scheme_price),
            price_percentage: parseFloat(row.price_percentage) || 
              Math.round((parseFloat(row.scheme_price) / parseFloat(row.default_price)) * 100 * 100) / 100,
            is_active: row.is_active !== false && row.is_active !== 'false',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 1 // Should be current user ID
          }));

          // Send batch to backend
          const response = await fetch('/api/admin/price-scheme-master/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ data: transformedBatch })
          });

          if (response.ok) {
            successCount += batch.length;
          } else {
            const errorData = await response.json();
            errors.push(`Batch ${batchIndex + 1}: ${errorData.message}`);
            errorCount += batch.length;
          }

        } catch (error) {
          console.error(`Error processing batch ${batchIndex + 1}:`, error);
          errors.push(`Batch ${batchIndex + 1}: ${error.message}`);
          errorCount += batch.length;
        }

        processedCount += batch.length;
        setImportProgress(Math.round((processedCount / jsonData.length) * 100));
      }

      setImportResults({
        total: jsonData.length,
        success: successCount,
        errors: errorCount,
        errorMessages: errors
      });

      if (successCount > 0 && onImportComplete) {
        onImportComplete();
      }

    } catch (error) {
      console.error('Import error:', error);
      setImportResults({
        total: 0,
        success: 0,
        errors: 1,
        errorMessages: [error.message]
      });
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const downloadTemplate = () => {
    const templateData = [{
      dept_code: '@BC',
      dept_name: 'LAB',
      scheme_code: '@000002',
      scheme_name: 'L2L',
      test_type: 'T',
      test_code: '@000003',
      test_name: 'Sample Test Name',
      default_price: 1000,
      scheme_price: 800,
      price_percentage: 80,
      is_active: true
    }];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lab-to-Lab Pricing');
    XLSX.writeFile(wb, 'lab_to_lab_pricing_template.xlsx');
  };

  return (
    <Modal show={true} onHide={onClose} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faFileImport} className="me-2" />
          Lab-to-Lab Pricing Import
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={12}>
            <Alert variant="info">
              <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
              Import lab-to-lab pricing data from Excel. Download the template to see the required format.
            </Alert>

            {/* File Selection */}
            <Card className="mb-3">
              <Card.Header>
                <FontAwesomeIcon icon={faFileExcel} className="me-2" />
                Select Excel File
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={8}>
                    <Form.Group>
                      <Form.Control
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileSelect}
                        ref={fileInputRef}
                      />
                      <Form.Text className="text-muted">
                        Select an Excel file (.xlsx or .xls) with lab-to-lab pricing data
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Button
                      variant="outline-primary"
                      onClick={downloadTemplate}
                      className="me-2"
                    >
                      <FontAwesomeIcon icon={faDownload} className="me-1" />
                      Download Template
                    </Button>
                    <Button
                      variant="primary"
                      onClick={previewExcelData}
                      disabled={!file}
                    >
                      <FontAwesomeIcon icon={faTable} className="me-1" />
                      Preview
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="danger">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                <strong>Validation Errors:</strong>
                <ul className="mb-0 mt-2">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </Alert>
            )}

            {/* Preview Data */}
            {showPreview && previewData.length > 0 && (
              <Card className="mb-3">
                <Card.Header>
                  <FontAwesomeIcon icon={faTable} className="me-2" />
                  Data Preview (First 10 rows)
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table striped bordered hover size="sm">
                      <thead>
                        <tr>
                          {expectedColumns.map(col => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, index) => (
                          <tr key={index}>
                            {expectedColumns.map(col => (
                              <td key={col}>{row[col]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Import Progress */}
            {importing && (
              <Card className="mb-3">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                    <span>Importing data...</span>
                  </div>
                  <ProgressBar now={importProgress} label={`${importProgress}%`} className="mt-2" />
                </Card.Body>
              </Card>
            )}

            {/* Import Results */}
            {importResults && (
              <Alert variant={importResults.errors > 0 ? 'warning' : 'success'}>
                <FontAwesomeIcon 
                  icon={importResults.errors > 0 ? faExclamationTriangle : faCheckCircle} 
                  className="me-2" 
                />
                <strong>Import Complete:</strong>
                <ul className="mb-0 mt-2">
                  <li>Total records: {importResults.total}</li>
                  <li>Successfully imported: {importResults.success}</li>
                  <li>Errors: {importResults.errors}</li>
                </ul>
                {importResults.errorMessages.length > 0 && (
                  <div className="mt-2">
                    <strong>Error Details:</strong>
                    <ul className="mb-0">
                      {importResults.errorMessages.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Alert>
            )}
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} className="me-2" />
          Close
        </Button>
        <Button
          variant="success"
          onClick={importPricingData}
          disabled={!file || validationErrors.length > 0 || importing}
        >
          <FontAwesomeIcon icon={importing ? faSpinner : faUpload} spin={importing} className="me-2" />
          {importing ? 'Importing...' : 'Import Data'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LabToLabPricingImport;
