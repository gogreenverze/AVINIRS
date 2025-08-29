import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Form, InputGroup, Row, Col, Card, Modal, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faPlus, faFileInvoiceDollar, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import billingReportsAPI from '../../services/billingReportsAPI';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import ResponsiveBillingReportsTable from '../../components/billing/ResponsiveBillingReportsTable';
import '../../styles/SampleList.css';

const SampleList = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const patientIdParam = queryParams.get('patient_id');

  // Check for success message from billing registration
  const billingSuccessMessage = location.state?.message;
  const billingId = location.state?.billingId;
  const redirectedPatientId = location.state?.patientId;

  // Auth and tenant context
  const { user } = useAuth();
  const { currentTenantContext, accessibleTenants } = useTenant();

  // State management
  const [billingReports, setBillingReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientId, setPatientId] = useState(patientIdParam || redirectedPatientId || '');
  const [patientName, setPatientName] = useState('');
  const [showNewSampleModal, setShowNewSampleModal] = useState(false);
  const [selectedFranchise, setSelectedFranchise] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(!!billingSuccessMessage);



  // Helper function to check if user can access all franchises
  const canAccessAllFranchises = () => {
    // Admin role can access all franchises
    if (user?.role === 'admin') return true;

    // Users from Mayiladuthurai hub (tenant_id 1) can access all franchises
    if (currentTenantContext?.is_hub && currentTenantContext?.site_code === 'MYD') return true;

    return false;
  };

  // Helper function to get available franchises for filtering
  const getAvailableFranchises = () => {
    if (!canAccessAllFranchises()) return [];
    return accessibleTenants || [];
  };

  // Fetch billing reports data
  useEffect(() => {
    const fetchBillingReports = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;
        if (searchQuery) {
          // Search billing reports by SID or patient name
          // Since the API expects specific fields, we'll try both SID and patient_name
          const searchParams = {};

          // If the search query looks like a SID (letters + numbers), search by SID
          if (/^[A-Z]{2,3}\d{0,3}$/i.test(searchQuery)) {
            searchParams.sid = searchQuery.toUpperCase();
          } else {
            // Otherwise search by patient name
            searchParams.patient_name = searchQuery;
          }

          const franchiseId = selectedFranchise || null;
          response = await billingReportsAPI.searchReports(searchParams, franchiseId);
        } else {
          // Get all reports with franchise filtering if applicable
          const franchiseId = selectedFranchise || null;
          response = await billingReportsAPI.getAllReports(franchiseId);
        }

        console.log('[SampleList] API Response:', response);

        if (response.success) {
          // Handle different possible response structures
          let reports = [];
          console.log('[SampleList] Response data structure:', response.data);

          if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
            reports = response.data.data.data;
            console.log('[SampleList] Found reports in data.data.data:', reports.length);
          } else if (response.data.data && Array.isArray(response.data.data)) {
            reports = response.data.data;
            console.log('[SampleList] Found reports in data.data:', reports.length);
          } else if (response.data.reports && Array.isArray(response.data.reports)) {
            reports = response.data.reports;
            console.log('[SampleList] Found reports in data.reports:', reports.length);
          } else if (Array.isArray(response.data)) {
            reports = response.data;
            console.log('[SampleList] Found reports in data:', reports.length);
          } else {
            console.warn('[SampleList] Unexpected billing reports data structure:', response.data);
            reports = [];
          }

          console.log('[SampleList] Setting billing reports:', reports);
          setBillingReports(reports);
        } else {
          console.error('[SampleList] API Error:', response.error);
          setError(response.error || 'Failed to load billing reports.');
        }
      } catch (err) {
        console.error('Error fetching billing reports:', err);
        setError('Failed to load billing reports. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBillingReports();
  }, [searchQuery, selectedFranchise]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
  };

  // Handle new sample button click
  const handleNewSampleClick = () => {
    setShowNewSampleModal(true);
  };

  // Handle franchise filter change
  const handleFranchiseChange = (e) => {
    setSelectedFranchise(e.target.value);
  };



  return (
    <div className="sample-list-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
          Billing Reports
        </h1>
        {/* <div>
          <Button variant="primary" onClick={handleNewSampleClick}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            New Sample
          </Button>
        </div> */}
      </div>

      {/* Success Message from Billing Registration */}
      {showSuccessMessage && billingSuccessMessage && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setShowSuccessMessage(false)}
          className="mb-4"
        >
          <Alert.Heading>
            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
            Billing Created Successfully!
          </Alert.Heading>
          <p className="mb-2">{billingSuccessMessage}</p>
          {billingId && (
            <p className="mb-0">
              <strong>Billing ID:</strong> {billingId}
              {redirectedPatientId && (
                <span className="ms-3">
                  <strong>Patient ID:</strong> {redirectedPatientId}
                </span>
              )}
            </p>
          )}
        </Alert>
      )}

      {/* Search and Filter Card */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Search & Filter Billing Reports</h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={canAccessAllFranchises() ? 4 : 6}>
                <InputGroup className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="Search by SID, patient name, or clinic..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button variant="primary" type="submit">
                    <FontAwesomeIcon icon={faSearch} />
                  </Button>
                </InputGroup>
              </Col>
              {canAccessAllFranchises() && (
                <Col md={4}>
                  <Form.Select
                    value={selectedFranchise}
                    onChange={handleFranchiseChange}
                    className="mb-3"
                  >
                    <option value="">All Franchises</option>
                    {getAvailableFranchises().map(franchise => (
                      <option key={franchise.id} value={franchise.id}>
                        {franchise.name} ({franchise.site_code})
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              )}
              <Col md={canAccessAllFranchises() ? 4 : 6}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFranchise('');
                  }}
                  className="w-100 mb-3"
                >
                  Clear Filters
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Loading Message */}
      {loading && (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading billing reports...</p>
        </div>
      )}

      {/* Responsive Billing Reports Table */}
      {!loading && !error && (
        <ResponsiveBillingReportsTable
          billingReports={billingReports}
          title="Billing Reports"
          loading={loading}
          itemsPerPage={10}
          showTransferAction={true}
        />
      )}

      {/* New Sample Modal */}
      <Modal show={showNewSampleModal} onHide={() => setShowNewSampleModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faInfoCircle} className="me-2 text-info" />
            Create New Registration
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="mb-3">
            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
            <strong>Sample creation is not available here.</strong>
          </Alert>
          <p>
            To create a new registration, please navigate to the <strong>Billing</strong> module
            where you can register new patients and create billing records.
          </p>
          <p className="mb-0">
            This will ensure proper workflow and data consistency across the system.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewSampleModal(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            as={Link}
            to="/billing/create"
            onClick={() => setShowNewSampleModal(false)}
          >
            Go to Billing Registration
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SampleList;
