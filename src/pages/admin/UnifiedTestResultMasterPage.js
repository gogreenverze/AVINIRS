import React from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import UnifiedTestResultMaster from '../../components/admin/UnifiedTestResultMaster';

const UnifiedTestResultMasterPage = () => {
  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1 text-black">
                <FontAwesomeIcon icon={faDatabase} className="me-2 text-black" />
                Unified Test & Result Master
              </h2>
              <p className=" mb-0">
                Combined Test Master and Result Master management with Excel auto-population
              </p>
            </div>
          </div>

          {/* Information Alert */}
          <Alert variant="info" className="mb-4">
            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
            <strong>Auto-Population Feature:</strong> Enter a test code or test name to automatically populate fields from imported Excel data. 
            You can override any auto-populated field with manual entries.
          </Alert>

          {/* Main Component */}
          <UnifiedTestResultMaster />
        </Col>
      </Row>
    </Container>
  );
};

export default UnifiedTestResultMasterPage;
