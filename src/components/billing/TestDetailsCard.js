import React from 'react';
import { Card, Badge, Row, Col, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFlask, 
  faCode, 
  faBuilding, 
  faRulerCombined, 
  faDroplet, 
  faRupeeSign,
  faHashtag,
  faClipboardList
} from '@fortawesome/free-solid-svg-icons';
import billingReportsAPI from '../../services/billingReportsAPI';

/**
 * TestDetailsCard Component
 * Displays individual test information in a responsive card format
 */
const TestDetailsCard = ({ test, index, editMode = false, onResultChange }) => {
  // Helper function to get test instructions
  const getTestInstructions = (test) => {
    // Check multiple possible sources for instructions
    const instructions = 
      test.test_master_data?.instructions ||
      test.instructions ||
      test.test_instructions ||
      '';
    
    return instructions || 'No specific instructions';
  };

  // Helper function to get test ID
  const getTestId = (test) => {
    return test.test_master_id || test.test_id || test.id || 'N/A';
  };

  // Helper function to get HMS code
  const getHmsCode = (test) => {
    return test.test_master_data?.hmsCode || test.hms_code || test.hmsCode || 'N/A';
  };

  // Helper function to get department
  const getDepartment = (test) => {
    return test.test_master_data?.department || test.department || 'N/A';
  };

  // Helper function to get reference range
  const getReferenceRange = (test) => {
    return test.test_master_data?.referenceRange || test.reference_range || test.referenceRange || 'N/A';
  };

  // Helper function to get specimen
  const getSpecimen = (test) => {
    const specimen = test.test_master_data?.specimen || test.specimen;
    if (Array.isArray(specimen)) {
      return specimen.join(', ');
    }
    return specimen || 'N/A';
  };

  return (
    <Card className="test-details-card h-100 shadow-sm">
      {/* Card Header */}
      <Card.Header className="test-card-header">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <div className="test-card-title d-flex align-items-center mb-1">
              <FontAwesomeIcon icon={faFlask} className="me-2 text-primary" />
              <h6 className="mb-0 fw-bold text-truncate">{test.test_name}</h6>
            </div>
            {test.short_name && (
              <small className="text-muted">{test.short_name}</small>
            )}
          </div>
          <Badge bg="primary" className="test-id-badge">
            <FontAwesomeIcon icon={faHashtag} className="me-1" />
            {getTestId(test)}
          </Badge>
        </div>
      </Card.Header>

      {/* Card Body */}
      <Card.Body className="test-card-body">
        <Row className="g-3">
          {/* HMS Code and Department */}
          <Col xs={12} sm={6}>
            <div className="test-detail-item">
              <div className="test-detail-label">
                <FontAwesomeIcon icon={faCode} className="me-1 text-info" />
                HMS Code
              </div>
              <div className="test-detail-value">
                <code className="bg-light px-2 py-1 rounded">{getHmsCode(test)}</code>
              </div>
            </div>
          </Col>

          <Col xs={12} sm={6}>
            <div className="test-detail-item">
              <div className="test-detail-label">
                <FontAwesomeIcon icon={faBuilding} className="me-1 text-secondary" />
                Department
              </div>
              <div className="test-detail-value">
                <Badge bg="secondary">{getDepartment(test)}</Badge>
              </div>
            </div>
          </Col>

          {/* Test Results Section - Editable */}
          {editMode && (
            <Col xs={12}>
              <div className="test-detail-item">
                <div className="test-detail-label">
                  <FontAwesomeIcon icon={faFlask} className="me-1 text-primary" />
                  Test Results
                </div>
                <div className="test-detail-value">
                  <div className="test-results-editable bg-light p-2 rounded">
                    {test.sub_tests && test.sub_tests.length > 0 ? (
                      test.sub_tests.map((subTest, index) => (
                        <div key={index} className="sub-test-result mb-2">
                          <div className="sub-test-name fw-bold text-primary mb-1">
                            {subTest.name || subTest.test_name || subTest.parameter || 'Sub Test'}
                          </div>
                          <Row className="g-2">
                            <Col xs={12} sm={4}>
                              <Form.Control
                                type="text"
                                placeholder="Result value"
                                value={subTest.result || ''}
                                onChange={(e) => onResultChange && onResultChange(test.id || test.test_master_id, index, 'result', e.target.value)}
                                size="sm"
                              />
                              <small className="text-muted">Result</small>
                            </Col>
                            <Col xs={12} sm={4}>
                              <Form.Control
                                type="text"
                                placeholder="Unit"
                                value={subTest.unit || ''}
                                onChange={(e) => onResultChange && onResultChange(test.id || test.test_master_id, index, 'unit', e.target.value)}
                                size="sm"
                              />
                              <small className="text-muted">Unit</small>
                            </Col>
                            <Col xs={12} sm={4}>
                              <Form.Control
                                type="text"
                                placeholder="Reference range"
                                value={subTest.reference || ''}
                                onChange={(e) => onResultChange && onResultChange(test.id || test.test_master_id, index, 'reference', e.target.value)}
                                size="sm"
                              />
                              <small className="text-muted">Reference</small>
                            </Col>
                          </Row>
                        </div>
                      ))
                    ) : (
                      <div className="single-test-result">
                        <Row className="g-2">
                          <Col xs={12} sm={4}>
                            <Form.Control
                              type="text"
                              placeholder="Result value"
                              value={test.result_value || ''}
                              onChange={(e) => onResultChange && onResultChange(test.id || test.test_master_id, 0, 'result', e.target.value)}
                              size="sm"
                            />
                            <small className="text-muted">Result</small>
                          </Col>
                          <Col xs={12} sm={4}>
                            <Form.Control
                              type="text"
                              placeholder="Unit"
                              value={test.result_unit || test.test_master_data?.result_unit || ''}
                              onChange={(e) => onResultChange && onResultChange(test.id || test.test_master_id, 0, 'unit', e.target.value)}
                              size="sm"
                            />
                            <small className="text-muted">Unit</small>
                          </Col>
                          <Col xs={12} sm={4}>
                            <Form.Control
                              type="text"
                              placeholder="Reference range"
                              value={test.reference_range || test.test_master_data?.reference_range || ''}
                              onChange={(e) => onResultChange && onResultChange(test.id || test.test_master_id, 0, 'reference', e.target.value)}
                              size="sm"
                            />
                            <small className="text-muted">Reference</small>
                          </Col>
                        </Row>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Col>
          )}

          {/* Instructions */}
          <Col xs={12}>
            <div className="test-detail-item">
              <div className="test-detail-label">
                <FontAwesomeIcon icon={faClipboardList} className="me-1 text-warning" />
                Instructions
              </div>
              <div className="test-detail-value">
                <div className="test-instructions bg-light p-2 rounded">
                  {getTestInstructions(test)}
                </div>
              </div>
            </div>
          </Col>

          {/* Reference Range and Specimen */}
          <Col xs={12} sm={6}>
            <div className="test-detail-item">
              <div className="test-detail-label">
                <FontAwesomeIcon icon={faRulerCombined} className="me-1 text-success" />
                Reference Range
              </div>
              <div className="test-detail-value">
                <small className="text-success fw-medium">{getReferenceRange(test)}</small>
              </div>
            </div>
          </Col>

          <Col xs={12} sm={6}>
            <div className="test-detail-item">
              <div className="test-detail-label">
                <FontAwesomeIcon icon={faDroplet} className="me-1 text-danger" />
                Specimen
              </div>
              <div className="test-detail-value">
                <span className="text-danger fw-medium">{getSpecimen(test)}</span>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

      {/* Card Footer - Financial Information */}
      <Card.Footer className="test-card-footer bg-light">
        <Row className="g-2 align-items-center">
          <Col xs={4} className="text-center">
            <div className="financial-item">
              <div className="financial-label">Price</div>
              <div className="financial-value text-primary fw-bold">
                {billingReportsAPI.formatCurrency(test.price)}
              </div>
            </div>
          </Col>
          <Col xs={4} className="text-center">
            <div className="financial-item">
              <div className="financial-label">Qty</div>
              <div className="financial-value fw-bold">
                {test.quantity}
              </div>
            </div>
          </Col>
          <Col xs={4} className="text-center">
            <div className="financial-item">
              <div className="financial-label">Amount</div>
              <div className="financial-value text-success fw-bold">
                <FontAwesomeIcon icon={faRupeeSign} className="me-1" />
                {billingReportsAPI.formatCurrency(test.amount)}
              </div>
            </div>
          </Col>
        </Row>
      </Card.Footer>
    </Card>
  );
};

export default TestDetailsCard;
