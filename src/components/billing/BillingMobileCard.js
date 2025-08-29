import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faMoneyBillWave, 
  faPrint,
  faFileInvoiceDollar,
  faUser,
  faCalendarAlt,
  faRupeeSign,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';

/**
 * Mobile-optimized card component for billing data
 * Displays billing information in a card format suitable for mobile devices
 */
const BillingMobileCard = ({ billing }) => {
  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'danger';
      case 'cancelled':
        return 'secondary';
      case 'partial':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const renderActionButtons = () => {
    const buttons = [];

    // View button (always available)
    buttons.push(
      <Button
        key="view"
        as={Link}
        to={`/billing/${billing.id}`}
        variant="info"
        size="sm"
        className="mobile-action-btn touch-target"
        aria-label={`View invoice details for ${billing.invoice_number}`}
      >
        <FontAwesomeIcon icon={faEye} />
        <span className="ms-2 d-none d-sm-inline">View</span>
      </Button>
    );

    // Collect payment button (only for unpaid invoices)
    if (billing.status !== 'Paid' && billing.status !== 'Cancelled') {
      buttons.push(
        <Button
          key="collect"
          as={Link}
          to={`/billing/${billing.id}/collect`}
          variant="success"
          size="sm"
          className="mobile-action-btn touch-target"
          aria-label={`Collect payment for invoice ${billing.invoice_number}`}
        >
          <FontAwesomeIcon icon={faMoneyBillWave} />
          <span className="ms-2 d-none d-sm-inline">Collect</span>
        </Button>
      );
    }

    // Print button
    buttons.push(
      <Button
        key="print"
        as={Link}
        to={`/billing/${billing.id}/print`}
        variant="primary"
        size="sm"
        className="mobile-action-btn touch-target"
        aria-label={`Print invoice ${billing.invoice_number}`}
      >
        <FontAwesomeIcon icon={faPrint} />
        <span className="ms-2 d-none d-sm-inline">Print</span>
      </Button>
    );

    return buttons;
  };

  return (
    <Card className="mobile-data-card billing-mobile-card">
      {/* Card Header */}
      <Card.Header className="mobile-card-header">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1 me-3">
            <div className="mobile-card-title d-flex align-items-center">
              <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2 text-primary" />
              <Link
                to={`/billing/${billing.id}`}
                className="text-decoration-none fw-bold"
                aria-label={`View invoice details for SID ${billing.sid_number}`}
              >
                SID: {billing.sid_number || 'N/A'}
              </Link>
            </div>
            <div className="mobile-card-subtitle text-muted">
              Invoice: #{billing.invoice_number}
            </div>
            {billing.patient && (
              <div className="mobile-card-subtitle">
                <FontAwesomeIcon icon={faUser} className="me-1" />
                <Link 
                  to={`/patients/${billing.patient.id}`}
                  className="text-decoration-none"
                  aria-label={`View patient details for ${billing.patient.first_name} ${billing.patient.last_name}`}
                >
                  {billing.patient.first_name} {billing.patient.last_name}
                </Link>
              </div>
            )}
          </div>
          <div className="mobile-card-status">
            <Badge 
              bg={getStatusBadgeVariant(billing.status)}
              className="status-badge"
            >
              {billing.status || 'Unknown'}
            </Badge>
          </div>
        </div>
      </Card.Header>

      {/* Card Body */}
      <Card.Body className="mobile-card-body">
        <div className="mobile-card-field">
          <div className="mobile-card-label">
            <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
            Invoice Date
          </div>
          <div className="mobile-card-value">
            {formatDate(billing.invoice_date)}
          </div>
        </div>

        <div className="mobile-card-field">
          <div className="mobile-card-label">
            <FontAwesomeIcon icon={faRupeeSign} className="me-1" />
            Total Amount
          </div>
          <div className="mobile-card-value fw-bold text-success">
            {formatCurrency(billing.total_amount)}
          </div>
        </div>

        {billing.paid_amount > 0 && (
          <div className="mobile-card-field">
            <div className="mobile-card-label">
              Paid Amount
            </div>
            <div className="mobile-card-value text-info">
              {formatCurrency(billing.paid_amount)}
            </div>
          </div>
        )}

        {billing.balance > 0 && (
          <div className="mobile-card-field">
            <div className="mobile-card-label">
              Balance Due
            </div>
            <div className="mobile-card-value text-warning fw-bold">
              {formatCurrency(billing.balance)}
            </div>
          </div>
        )}

        {billing.due_date && (
          <div className="mobile-card-field">
            <div className="mobile-card-label">
              Due Date
            </div>
            <div className="mobile-card-value">
              {formatDate(billing.due_date)}
            </div>
          </div>
        )}

        {billing.payment_method && (
          <div className="mobile-card-field">
            <div className="mobile-card-label">
              Payment Method
            </div>
            <div className="mobile-card-value">
              {billing.payment_method}
            </div>
          </div>
        )}

        {billing.notes && (
          <div className="mobile-card-field">
            <div className="mobile-card-label">
              <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
              Notes
            </div>
            <div className="mobile-card-value">
              {billing.notes}
            </div>
          </div>
        )}
      </Card.Body>

      {/* Card Actions */}
      <div className="mobile-card-actions">
        {renderActionButtons()}
      </div>
    </Card>
  );
};

BillingMobileCard.propTypes = {
  billing: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    invoice_number: PropTypes.string.isRequired,
    sid_number: PropTypes.string,
    patient: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      first_name: PropTypes.string,
      last_name: PropTypes.string
    }),
    invoice_date: PropTypes.string,
    total_amount: PropTypes.number,
    paid_amount: PropTypes.number,
    balance: PropTypes.number,
    due_date: PropTypes.string,
    status: PropTypes.string,
    payment_method: PropTypes.string,
    notes: PropTypes.string
  }).isRequired
};

export default BillingMobileCard;
