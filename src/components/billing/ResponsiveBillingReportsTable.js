import React, { useState, useEffect } from 'react';
import { Table, Card, Alert, Badge, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, faEdit, faExchangeAlt, faFileInvoiceDollar, faUser, faPhone, 
  faBuilding, faCalendarAlt 
} from '@fortawesome/free-solid-svg-icons';
import BillingReportsMobileCard from './BillingReportsMobileCard';
import Pagination from '../common/Pagination';
import billingReportsAPI from '../../services/billingReportsAPI';
import PropTypes from 'prop-types';
import axios from 'axios';
import { sampleAPI } from '../../services/api';

/**
 * Responsive billing reports table that switches between table and card view
 * based on screen size with pagination support and transfer action
 */
const ResponsiveBillingReportsTable = ({
  billingReports = [],
  title = 'Billing Reports',
  loading = false,
  itemsPerPage = 10,
  showTransferAction = false
}) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  console.log("element billingReports",billingReports)

  // Helper function to get report status badge variant
  const getReportStatusVariant = (report) => {
    if (report.authorized) return 'success';
    if (report.status === 'completed') return 'warning';
    if (report.status === 'pending') return 'secondary';
    return 'light';
  };

  // Helper function to get report status text
  const getReportStatusText = (report) => {
    if (report.authorized) return 'Authorized';
    if (report.status === 'completed') return 'Pending Authorization';
    if (report.status === 'pending') return 'In Progress';
    return 'Not Started';
  };

  // Determine if we're on the samples page to add proper referrer tracking
  const isFromSamples = location.pathname === '/samples';
  const referrerParam = isFromSamples ? '?from=samples' : '';

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Reset to first page when billingReports change
  useEffect(() => {
    setCurrentPage(1);
  }, [billingReports]);

  // Ensure billingReports is an array
  const reportsArray = Array.isArray(billingReports) ? billingReports : [];

  // Pagination calculations
  const totalItems = reportsArray.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReports = reportsArray.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of table on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };



 
 



  if (loading) {
    return (
      <Card className="shadow mb-4">
        <Card.Body className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading billing reports...</p>
        </Card.Body>
      </Card>
    );
  }

  if (totalItems === 0) {
    return (
      <Alert variant="info" className="text-center">
        <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
        No billing reports found.
      </Alert>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="mobile-billing-reports-container">
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              {title}
              <span className="badge bg-primary float-end">
                {totalItems} Records
              </span>
            </h6>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="mobile-data-container">
              {paginatedReports.map(report => (
                <BillingReportsMobileCard
                  key={report.id}
                  report={report}
                  showTransferAction={showTransferAction}
                />
              ))}
            </div>
          </Card.Body>
        </Card>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          size="sm"
          className="mt-3"
        />
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="desktop-billing-reports-container">
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">
            {title}
            <span className="badge bg-primary float-end">
              {totalItems} Records
            </span>
          </h6>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table className="table-hover" width="100%" cellSpacing="0">
              <thead>
                <tr>
                  <th>SID #</th>
                  <th>Patient</th>
                  <th>Clinic</th>
                  <th>Date</th>
                  <th>Tests</th>
                  <th>Amount</th>
                  <th>Status</th>
              
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReports.map(report => (
                  <tr key={report.id}>
                    <td>
                      <Link
                        to={`/billing/reports/${report.sid_number}${referrerParam}`}
                        className="fw-bold text-decoration-none text-primary"
                        aria-label={`View billing report details for ${report.sid_number}`}
                      >
                        {report.sid_number}
                      </Link>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <FontAwesomeIcon icon={faUser} className="me-1 text-muted" />
                        {report.patient_name}
                      </div>
                      {report.patient_phone && (
                        <small className="text-muted">
                          <FontAwesomeIcon icon={faPhone} className="me-1" />
                          {report.patient_phone}
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
                      <Badge bg={getReportStatusVariant(report)}>
                        {getReportStatusText(report)}
                      </Badge>
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
                            as={Link}
                            to={`/billing/reports/${report.sid_number}${referrerParam}`}
                            aria-label={`View billing report details for ${report.sid_number}`}
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </Button>
                        </OverlayTrigger>
                        
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>Edit Report</Tooltip>}
                        >
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            as={Link}
                            to={`/billing/reports/${report.sid_number}${referrerParam}${referrerParam ? '&' : '?'}edit=true`}
                            aria-label={`Edit billing report for ${report.sid_number}`}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                        </OverlayTrigger>

                        {showTransferAction && (
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>Transfer Report</Tooltip>}
                          >
                            <Button
                              variant="outline-warning"
                              size="sm"
                              as={Link}
                              to={`/samples/routing/create?billing_id=${report.billing_id}`}
                              aria-label={`Transfer billing report for ${report.sid_number}`}
                            >
                              <FontAwesomeIcon icon={faExchangeAlt} />
                            </Button>
                          </OverlayTrigger>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        className="mt-3"
      />
    </div>
  );
};

ResponsiveBillingReportsTable.propTypes = {
  billingReports: PropTypes.array.isRequired,
  title: PropTypes.string,
  loading: PropTypes.bool,
  itemsPerPage: PropTypes.number,
  showTransferAction: PropTypes.bool
};

export default ResponsiveBillingReportsTable;
