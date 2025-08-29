import React, { useState } from 'react';
import { Modal, Button, Form, Alert, ProgressBar, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel, faUpload, faDownload, faCheck, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const ExcelImportExport = ({ show, onHide, activeTab = 'testCategories', onImportSuccess }) => {
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.type === 'application/vnd.ms-excel')) {
      setImportFile(file);
      setImportResults(null);
      setValidationErrors([]);
    } else {
      alert('Please select a valid Excel file (.xlsx or .xls)');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      alert('Please select a file to import');
      return;
    }

    setImporting(true);
    setValidationErrors([]);

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('category', activeTab);

      const response = await fetch('/api/admin/master-data/import', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        setImportResults(result);
        if (result.errors && result.errors.length > 0) {
          setValidationErrors(result.errors);
        }
        if (result.success_count > 0) {
          onImportSuccess();
        }
      } else {
        throw new Error(result.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);

    try {
      const response = await fetch(`/api/admin/master-data/export?category=${activeTab}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTab}_master_data.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const result = await response.json();
        throw new Error(result.message || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch(`/api/admin/master-data/template?category=${activeTab}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTab}_template.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const result = await response.json();
        throw new Error(result.message || 'Template download failed');
      }
    } catch (error) {
      console.error('Template download error:', error);
      alert(`Template download failed: ${error.message}`);
    }
  };

  const getCategoryDisplayName = () => {
    const names = {
      testCategories: 'Test Categories',
      testParameters: 'Test Parameters',
      sampleTypes: 'Sample Types',
      departments: 'Departments',
      paymentMethods: 'Payment Methods',
      containers: 'Containers',
      instruments: 'Instruments',
      reagents: 'Reagents',
      suppliers: 'Suppliers',
      units: 'Units',
      testMethods: 'Test Methods',
      patients: 'Patients',
      profileMaster: 'Profile Master',
      methodMaster: 'Method Master',
      antibioticMaster: 'Antibiotic Master',
      organismMaster: 'Organism Master',
      unitOfMeasurement: 'Unit of Measurement',
      specimenMaster: 'Specimen Master',
      organismVsAntibiotic: 'Organism vs Antibiotic',
      containerMaster: 'Container Master',
      mainDepartmentMaster: 'Main Department Master',
      departmentSettings: 'Department Settings',
      authorizationSettings: 'Authorization Settings',
      printOrder: 'Print Order',
      testMaster: 'Test Master',
      subTestMaster: 'Sub Test Master',
      departmentMaster: 'Department Master'
    };
    return names[activeTab] || activeTab || 'Master Data';
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faFileExcel} className="me-2 text-success" />
          Excel Import/Export - {getCategoryDisplayName()}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row">
          {/* Export Section */}
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faDownload} className="me-2" />
                  Export Data
                </h5>
              </div>
              <div className="card-body">
                <p className="text-muted">
                  Export current {getCategoryDisplayName()?.toLowerCase() || 'master data'} data to Excel format.
                </p>
                <div className="d-grid gap-2">
                  <Button 
                    variant="success" 
                    onClick={handleExport}
                    disabled={exporting}
                  >
                    {exporting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faDownload} className="me-2" />
                        Export to Excel
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    onClick={downloadTemplate}
                  >
                    <FontAwesomeIcon icon={faFileExcel} className="me-2" />
                    Download Template
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Import Section */}
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faUpload} className="me-2" />
                  Import Data
                </h5>
              </div>
              <div className="card-body">
                <p className="text-muted">
                  Import {getCategoryDisplayName()?.toLowerCase() || 'master data'} data from Excel file.
                </p>
                <Form.Group className="mb-3">
                  <Form.Label>Select Excel File</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                  />
                  <Form.Text className="text-muted">
                    Supported formats: .xlsx, .xls
                  </Form.Text>
                </Form.Group>
                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    onClick={handleImport}
                    disabled={!importFile || importing}
                  >
                    {importing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faUpload} className="me-2" />
                        Import from Excel
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Import Results */}
        {importResults && (
          <div className="mt-4">
            <h5>Import Results</h5>
            <div className="row">
              <div className="col-md-4">
                <div className="card text-center">
                  <div className="card-body">
                    <FontAwesomeIcon icon={faCheck} className="text-success fa-2x mb-2" />
                    <h4 className="text-success">{importResults.success_count}</h4>
                    <p className="mb-0">Successfully Imported</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card text-center">
                  <div className="card-body">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning fa-2x mb-2" />
                    <h4 className="text-warning">{importResults.error_count}</h4>
                    <p className="mb-0">Errors</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card text-center">
                  <div className="card-body">
                    <FontAwesomeIcon icon={faFileExcel} className="text-info fa-2x mb-2" />
                    <h4 className="text-info">{importResults.total_rows}</h4>
                    <p className="mb-0">Total Rows</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4">
            <Alert variant="warning">
              <Alert.Heading>Validation Errors</Alert.Heading>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Field</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {validationErrors.map((error, index) => (
                    <tr key={index}>
                      <td>{error.row}</td>
                      <td>{error.field}</td>
                      <td>{error.message}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Alert>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ExcelImportExport;
