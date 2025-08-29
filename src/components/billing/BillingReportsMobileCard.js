import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye, faEdit, faExchangeAlt, faUser, faPhone, faBuilding,
  faCalendarAlt, faFileInvoiceDollar, faVial
} from '@fortawesome/free-solid-svg-icons';
import billingReportsAPI from '../../services/billingReportsAPI';
import PropTypes from 'prop-types';

/**
 * Mobile card component for billing reports with touch-friendly actions
 */
const BillingReportsMobileCard = ({ report, showTransferAction = false }) => {
  const location = useLocation();

  // Determine if we're on the samples page to add proper referrer tracking
  const isFromSamples = location.pathname === '/samples';
  const referrerParam = isFromSamples ? '?from=samples' : '';

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

  const getActionButtons = () => {
    const buttons = [];

    // View Details button - navigate to billing reports detail page
    buttons.push(
      <Button
        key="view"
        as={Link}
        to={`/billing/reports/${report.sid_number}${referrerParam}`}
        variant="outline-primary"
        size="sm"
        className="mobile-action-btn touch-target"
        aria-label={`View billing report details for ${report.sid_number}`}
      >
        <FontAwesomeIcon icon={faEye} />
        <span className="ms-2 d-none d-sm-inline">View</span>
      </Button>
    );

    // Edit Report button - navigate to billing reports detail page in edit mode
    buttons.push(
      <Button
        key="edit"
        as={Link}
        to={`/billing/reports/${report.sid_number}${referrerParam}${referrerParam ? '&' : '?'}edit=true`}
        variant="outline-secondary"
        size="sm"
        className="mobile-action-btn touch-target"
        aria-label={`Edit billing report for ${report.sid_number}`}
      >
        <FontAwesomeIcon icon={faEdit} />
        <span className="ms-2 d-none d-sm-inline">Edit</span>
      </Button>
    );

    // Transfer button (if enabled)
    if (showTransferAction) {
      buttons.push(
        <Button
          key="transfer"
          as={Link}
          to={`/samples/routing/create?billing_id=${report.billing_id}`}
          variant="outline-warning"
          size="sm"
          className="mobile-action-btn touch-target"
          aria-label={`Transfer billing report for ${report.sid_number}`}
        >
          <FontAwesomeIcon icon={faExchangeAlt} />
          <span className="ms-2 d-none d-sm-inline">Transfer</span>
        </Button>
      );
    }

    return buttons;
  };

  return (
    <Card className="mobile-card mb-3 border-left-primary">
      <Card.Body className="p-3">
        {/* Header with SID and Status */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 className="mb-1">
              <Link
                to={`/billing/reports/${report.sid_number}${referrerParam}`}
                className="text-decoration-none fw-bold"
                aria-label={`View billing report details for ${report.sid_number}`}
              >
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2 text-primary" />
                {report.sid_number}
              </Link>
            </h6>
          </div>
          <div className="d-flex flex-column gap-1">
            <Badge bg={billingReportsAPI.getStatusVariant(report.status)}>
              {report.status}
            </Badge>
            <Badge bg={getReportStatusVariant(report)} className="small">
              {getReportStatusText(report)}
            </Badge>
          </div>
        </div>

        {/* Patient Information */}
        <div className="mb-2">
          <div className="d-flex align-items-center mb-1">
            <FontAwesomeIcon icon={faUser} className="me-2 text-muted" />
            <span className="fw-medium">{report.patient_name}</span>
          </div>
          {report.patient_phone && (
            <div className="d-flex align-items-center text-muted small">
              <FontAwesomeIcon icon={faPhone} className="me-2" />
              <span>{report.patient_phone}</span>
            </div>
          )}
        </div>

        {/* Clinic and Date Information */}
        <div className="mb-2">
          <div className="d-flex align-items-center mb-1">
            <FontAwesomeIcon icon={faBuilding} className="me-2 text-muted" />
            <span className="small">{report.clinic_name}</span>
          </div>
          <div className="d-flex align-items-center text-muted small">
            <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
            <span>{billingReportsAPI.formatDate(report.billing_date)}</span>
          </div>
        </div>

        {/* Test Count and Amount */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            <FontAwesomeIcon icon={faVial} className="me-2 text-info" />
            <Badge bg="info">{report.test_count} tests</Badge>
          </div>
          <div className="text-end">
            <div className="fw-bold text-success">
              {billingReportsAPI.formatCurrency(report.total_amount)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex flex-wrap gap-2 justify-content-start">
          {getActionButtons()}
        </div>
      </Card.Body>
    </Card>
  );
};

BillingReportsMobileCard.propTypes = {
  report: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    billing_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    sid_number: PropTypes.string.isRequired,
    patient_name: PropTypes.string.isRequired,
    patient_phone: PropTypes.string,
    clinic_name: PropTypes.string.isRequired,
    billing_date: PropTypes.string.isRequired,
    test_count: PropTypes.number.isRequired,
    total_amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    status: PropTypes.string.isRequired
  }).isRequired,
  showTransferAction: PropTypes.bool
};

export default BillingReportsMobileCard;
