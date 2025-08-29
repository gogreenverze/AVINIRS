import React from 'react';
import { Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileInvoiceDollar,
  faHashtag,
  faRupeeSign,
  faPercentage,
  faCalculator
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';

/**
 * Mobile-optimized card component for invoice items
 * Displays invoice item information in a card format suitable for mobile devices
 */
const InvoiceItemMobileCard = ({ item, index }) => {
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <Card className="mobile-data-card invoice-item-mobile-card">
      {/* Card Header */}
      <Card.Header className="mobile-card-header">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1 me-3">
            <div className="mobile-card-title d-flex align-items-center">
              <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2 text-primary" />
              <span className="fw-bold">
                {item.description || item.test_name || item.testName || `Item ${index + 1}`}
              </span>
            </div>
            <div className="mt-1">
              <small className="text-primary">
                Test ID: {item.test_id || 'N/A'}
              </small>
            </div>
            {item.category && (
              <div className="mt-1">
                <small className="text-muted">{item.category}</small>
              </div>
            )}
          </div>
          <div className="mobile-card-status">
            <span className="badge bg-primary mb-1">
              {item.test_code || item.hmsCode || `T${String(item.test_id || (index + 1)).padStart(3, '0')}`}
            </span>
            {item.department && (
              <div>
                <span className="badge bg-secondary">
                  {item.department}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card.Header>

      {/* Card Body */}
      <Card.Body className="mobile-card-body">
        {item.turnaround_time && (
          <div className="mobile-card-field">
            <div className="mobile-card-label">
              <FontAwesomeIcon icon={faHashtag} className="me-1" />
              Turnaround Time
            </div>
            <div className="mobile-card-value">
              <span className="badge bg-info">{item.turnaround_time}</span>
            </div>
          </div>
        )}

        <div className="mobile-card-field">
          <div className="mobile-card-label">
            <FontAwesomeIcon icon={faHashtag} className="me-1" />
            Quantity
          </div>
          <div className="mobile-card-value">
            {item.quantity || 1}
          </div>
        </div>

        <div className="mobile-card-field">
          <div className="mobile-card-label">
            <FontAwesomeIcon icon={faRupeeSign} className="me-1" />
            Unit Price
          </div>
          <div className="mobile-card-value">
            {formatCurrency(item.unit_price || item.price)}
          </div>
        </div>

        {(item.discount > 0) && (
          <div className="mobile-card-field">
            <div className="mobile-card-label">
              <FontAwesomeIcon icon={faPercentage} className="me-1" />
              Discount
            </div>
            <div className="mobile-card-value text-warning">
              {item.discount}%
            </div>
          </div>
        )}

        <div className="mobile-card-field">
          <div className="mobile-card-label">
            <FontAwesomeIcon icon={faCalculator} className="me-1" />
            Total
          </div>
          <div className="mobile-card-value fw-bold text-success">
            {formatCurrency(item.total || item.amount)}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

InvoiceItemMobileCard.propTypes = {
  item: PropTypes.shape({
    description: PropTypes.string,
    quantity: PropTypes.number,
    unit_price: PropTypes.number,
    discount: PropTypes.number,
    total: PropTypes.number
  }).isRequired,
  index: PropTypes.number.isRequired
};

export default InvoiceItemMobileCard;
