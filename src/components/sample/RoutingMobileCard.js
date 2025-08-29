import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faCheck, 
  faTimes, 
  faArrowRight, 
  faVial,
  faBuilding,
  faCalendarAlt,
  faBarcode,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';

/**
 * Mobile-optimized card component for routing data
 * Displays routing information in a card format suitable for mobile devices
 */
const RoutingMobileCard = ({ routing, type = 'incoming' }) => {
  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'in transit':
        return 'info';
      case 'delivered':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not dispatched';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderActionButtons = () => {
    const buttons = [];

    // View button (always available)
    buttons.push(
      <Button
        key="view"
        as={Link}
        to={`/samples/routing/${routing.id}`}
        variant="info"
        size="sm"
        className="mobile-action-btn touch-target"
        aria-label={`View routing details for ${routing.sample?.sample_id || 'sample'}`}
      >
        <FontAwesomeIcon icon={faEye} />
        <span className="ms-2 d-none d-sm-inline">View</span>
      </Button>
    );

    // Type-specific action buttons
    if (type === 'incoming') {
      if (routing.status === 'In Transit') {
        buttons.push(
          <Button
            key="receive"
            as={Link}
            to={`/samples/routing/${routing.id}/receive`}
            variant="success"
            size="sm"
            className="mobile-action-btn touch-target"
            aria-label={`Receive sample ${routing.sample?.sample_id || 'sample'}`}
          >
            <FontAwesomeIcon icon={faCheck} />
            <span className="ms-2 d-none d-sm-inline">Receive</span>
          </Button>
        );

        buttons.push(
          <Button
            key="reject"
            as={Link}
            to={`/samples/routing/${routing.id}/reject`}
            variant="danger"
            size="sm"
            className="mobile-action-btn touch-target"
            aria-label={`Reject sample ${routing.sample?.sample_id || 'sample'}`}
          >
            <FontAwesomeIcon icon={faTimes} />
            <span className="ms-2 d-none d-sm-inline">Reject</span>
          </Button>
        );
      }
    } else if (type === 'outgoing') {
      if (routing.status === 'Pending') {
        buttons.push(
          <Button
            key="dispatch"
            as={Link}
            to={`/samples/routing/${routing.id}/dispatch`}
            variant="primary"
            size="sm"
            className="mobile-action-btn touch-target"
            aria-label={`Dispatch sample ${routing.sample?.sample_id || 'sample'}`}
          >
            <FontAwesomeIcon icon={faArrowRight} />
            <span className="ms-2 d-none d-sm-inline">Dispatch</span>
          </Button>
        );
      }
    }

    return buttons;
  };

  return (
    <Card className="mobile-data-card routing-mobile-card">
      {/* Card Header */}
      <Card.Header className="mobile-card-header">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1 me-3">
            <div className="mobile-card-title d-flex align-items-center">
              <FontAwesomeIcon icon={faVial} className="me-2 text-primary" />
              {routing.sample ? (
                <Link 
                  to={`/samples/${routing.sample.id}`}
                  className="text-decoration-none fw-bold"
                  aria-label={`View sample details for ${routing.sample.sample_id}`}
                >
                  {routing.sample.sample_id}
                </Link>
              ) : (
                <span className="text-muted">N/A</span>
              )}
            </div>
            <div className="mobile-card-subtitle">
              <FontAwesomeIcon icon={faBuilding} className="me-1" />
              {type === 'incoming' 
                ? `From: ${routing.from_tenant?.name || 'Unknown'}`
                : `To: ${routing.to_tenant?.name || 'Unknown'}`
              }
            </div>
          </div>
          <div className="mobile-card-status">
            <Badge 
              bg={getStatusBadgeVariant(routing.status)}
              className="status-badge"
            >
              {routing.status || 'Unknown'}
            </Badge>
          </div>
        </div>
      </Card.Header>

      {/* Card Body */}
      <Card.Body className="mobile-card-body">
        <div className="mobile-card-field">
          <div className="mobile-card-label">
            <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
            Dispatch Date
          </div>
          <div className="mobile-card-value">
            {formatDate(routing.dispatch_date)}
          </div>
        </div>

        <div className="mobile-card-field">
          <div className="mobile-card-label">
            <FontAwesomeIcon icon={faBarcode} className="me-1" />
            Tracking Number
          </div>
          <div className="mobile-card-value">
            {routing.tracking_number || 'N/A'}
          </div>
        </div>

        {routing.notes && (
          <div className="mobile-card-field">
            <div className="mobile-card-label">
              <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
              Notes
            </div>
            <div className="mobile-card-value">
              {routing.notes}
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

RoutingMobileCard.propTypes = {
  routing: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    sample: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      sample_id: PropTypes.string
    }),
    from_tenant: PropTypes.shape({
      name: PropTypes.string
    }),
    to_tenant: PropTypes.shape({
      name: PropTypes.string
    }),
    dispatch_date: PropTypes.string,
    tracking_number: PropTypes.string,
    status: PropTypes.string,
    notes: PropTypes.string
  }).isRequired,
  type: PropTypes.oneOf(['incoming', 'outgoing']).isRequired
};

export default RoutingMobileCard;
