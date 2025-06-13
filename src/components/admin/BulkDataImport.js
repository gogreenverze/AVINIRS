import React, { useState } from 'react';
import { Modal, Button, Form, Alert, ProgressBar, Table, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileImport, faUpload, faCheck, faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const BulkDataImport = ({ show, onHide, onImportSuccess }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedFiles, setSelectedFiles] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  const categories = [
    { key: 'testCategories', name: 'Test Categories', required: ['name'] },
    { key: 'testParameters', name: 'Test Parameters', required: ['name', 'unit'] },
    { key: 'sampleTypes', name: 'Sample Types', required: ['name'] },
    { key: 'departments', name: 'Departments', required: ['name'] },
    { key: 'paymentMethods', name: 'Payment Methods', required: ['name'] },
    { key: 'containers', name: 'Containers', required: ['name', 'type'] },
    { key: 'instruments', name: 'Instruments', required: ['name', 'manufacturer'] },
    { key: 'reagents', name: 'Reagents', required: ['name', 'manufacturer'] },
    { key: 'suppliers', name: 'Suppliers', required: ['name', 'contact_person'] },
    { key: 'units', name: 'Units', required: ['name', 'symbol'] },
    { key: 'testMethods', name: 'Test Methods', required: ['name'] }
  ];

  const handleFileSelect = (category, event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.type === 'application/vnd.ms-excel')) {
      setSelectedFiles(prev => ({
        ...prev,
        [category]: file
      }));
      // Clear previous results for this category
      setImportResults(prev => {
        const newResults = { ...prev };
        delete newResults[category];
        return newResults;
      });
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[category];
        return newErrors;
      });
    } else {
      alert('Please select a valid Excel file (.xlsx or .xls)');
    }
  };

  const handleImportCategory = async (category) => {
    const file = selectedFiles[category];
    if (!file) {
      alert('Please select a file to import');
      return;
    }

    setImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const response = await fetch('/api/admin/master-data/import', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        setImportResults(prev => ({
          ...prev,
          [category]: result
        }));
        
        if (result.errors && result.errors.length > 0) {
          setValidationErrors(prev => ({
            ...prev,
            [category]: result.errors
          }));
        }
        
        if (result.success_count > 0) {
          onImportSuccess();
        }
      } else {
        throw new Error(result.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResults(prev => ({
        ...prev,
        [category]: {
          success_count: 0,
          error_count: 1,
          total_rows: 0,
          errors: [{ row: 0, field: 'system', message: error.message }]
        }
      }));
    } finally {
      setImporting(false);
    }
  };

  const handleImportAll = async () => {
    setImporting(true);
    
    for (const category of Object.keys(selectedFiles)) {
      await handleImportCategory(category);
    }
    
    setImporting(false);
  };

  const downloadTemplate = async (category) => {
    try {
      const response = await fetch(`/api/admin/master-data/template?category=${category}`, {
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
        a.download = `${category}_template.xlsx`;
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

  const getTotalStats = () => {
    const results = Object.values(importResults);
    return {
      totalSuccess: results.reduce((sum, r) => sum + (r.success_count || 0), 0),
      totalErrors: results.reduce((sum, r) => sum + (r.error_count || 0), 0),
      totalRows: results.reduce((sum, r) => sum + (r.total_rows || 0), 0)
    };
  };

  const stats = getTotalStats();

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faFileImport} className="me-2 text-primary" />
          Bulk Data Import
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs activeKey={activeTab} onSelect={setActiveTab}>
          <Tab eventKey="upload" title="Upload Files">
            <div className="mt-3">
              <Alert variant="info">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                Upload Excel files for multiple master data categories. Each file should follow the template format.
              </Alert>

              <div className="row">
                {categories.map(category => (
                  <div key={category.key} className="col-md-6 mb-3">
                    <div className="card">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">{category.name}</h6>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => downloadTemplate(category.key)}
                        >
                          Download Template
                        </Button>
                      </div>
                      <div className="card-body">
                        <Form.Group className="mb-2">
                          <Form.Control
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={(e) => handleFileSelect(category.key, e)}
                            size="sm"
                          />
                        </Form.Group>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            Required: {category.required.join(', ')}
                          </small>
                          {selectedFiles[category.key] && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleImportCategory(category.key)}
                              disabled={importing}
                            >
                              Import
                            </Button>
                          )}
                        </div>
                        
                        {/* Import Results for this category */}
                        {importResults[category.key] && (
                          <div className="mt-2">
                            <div className="row text-center">
                              <div className="col-4">
                                <small className="text-success">
                                  <FontAwesomeIcon icon={faCheck} className="me-1" />
                                  {importResults[category.key].success_count}
                                </small>
                              </div>
                              <div className="col-4">
                                <small className="text-warning">
                                  <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                                  {importResults[category.key].error_count}
                                </small>
                              </div>
                              <div className="col-4">
                                <small className="text-info">
                                  Total: {importResults[category.key].total_rows}
                                </small>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {Object.keys(selectedFiles).length > 1 && (
                <div className="text-center mt-3">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleImportAll}
                    disabled={importing}
                  >
                    {importing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Importing All...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faUpload} className="me-2" />
                        Import All Selected Files
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Tab>

          <Tab eventKey="results" title={`Results ${stats.totalRows > 0 ? `(${stats.totalSuccess}/${stats.totalRows})` : ''}`}>
            <div className="mt-3">
              {stats.totalRows > 0 && (
                <>
                  <div className="row mb-4">
                    <div className="col-md-4">
                      <div className="card text-center border-success">
                        <div className="card-body">
                          <FontAwesomeIcon icon={faCheck} className="text-success fa-2x mb-2" />
                          <h4 className="text-success">{stats.totalSuccess}</h4>
                          <p className="mb-0">Successfully Imported</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card text-center border-warning">
                        <div className="card-body">
                          <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning fa-2x mb-2" />
                          <h4 className="text-warning">{stats.totalErrors}</h4>
                          <p className="mb-0">Errors</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card text-center border-info">
                        <div className="card-body">
                          <FontAwesomeIcon icon={faFileImport} className="text-info fa-2x mb-2" />
                          <h4 className="text-info">{stats.totalRows}</h4>
                          <p className="mb-0">Total Rows</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Results by Category */}
                  {Object.entries(importResults).map(([category, result]) => (
                    <div key={category} className="mb-3">
                      <h6>{categories.find(c => c.key === category)?.name}</h6>
                      <div className="card">
                        <div className="card-body">
                          <div className="row">
                            <div className="col-md-8">
                              <ProgressBar className="mb-2">
                                <ProgressBar 
                                  variant="success" 
                                  now={(result.success_count / result.total_rows) * 100} 
                                  key={1} 
                                />
                                <ProgressBar 
                                  variant="danger" 
                                  now={(result.error_count / result.total_rows) * 100} 
                                  key={2} 
                                />
                              </ProgressBar>
                            </div>
                            <div className="col-md-4 text-end">
                              <small>
                                {result.success_count} success, {result.error_count} errors
                              </small>
                            </div>
                          </div>
                          
                          {validationErrors[category] && validationErrors[category].length > 0 && (
                            <div className="mt-2">
                              <small className="text-danger">
                                <strong>Errors:</strong>
                              </small>
                              <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                                {validationErrors[category].slice(0, 5).map((error, index) => (
                                  <div key={index} className="text-danger small">
                                    Row {error.row}: {error.message}
                                  </div>
                                ))}
                                {validationErrors[category].length > 5 && (
                                  <div className="text-muted small">
                                    ... and {validationErrors[category].length - 5} more errors
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {stats.totalRows === 0 && (
                <Alert variant="info">
                  No import results yet. Upload and import files from the Upload tab.
                </Alert>
              )}
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BulkDataImport;
