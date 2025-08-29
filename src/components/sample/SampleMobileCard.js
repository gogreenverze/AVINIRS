import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faEdit, 
  faExchangeAlt,
  faVial,
  faUser,
  faFlask,
  faCalendarAlt,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';

/**
 * Mobile-optimized card component for sample data
 * Displays sample information in a card format suitable for mobile devices
 */
const SampleMobileCard = ({ sample }) => {
  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'collected':
        return 'success';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'completed':
        return 'primary';
      case 'rejected':
        return 'danger';
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

  const renderActionButtons = () => {
    const buttons = [];

    // View button (always available)
    buttons.push(
      <Button
        key="view"
        as={Link}
        to={`/samples/${sample.id}`}
        variant="info"
        size="sm"
        className="mobile-action-btn touch-target"
        aria-label={`View sample details for ${sample.sample_id}`}
      >
        <FontAwesomeIcon icon={faEye} />
        <span className="ms-2 d-none d-sm-inline">View</span>
      </Button>
    );

    // Edit button
    buttons.push(
      <Button
        key="edit"
        as={Link}
        to={`/samples/${sample.id}/edit`}
        variant="primary"
        size="sm"
        className="mobile-action-btn touch-target"
        aria-label={`Edit sample ${sample.sample_id}`}
      >
        <FontAwesomeIcon icon={faEdit} />
        <span className="ms-2 d-none d-sm-inline">Edit</span>
      </Button>
    );

    // Transfer button (only for collected samples)
    if (sample.status === 'Collected') {
      buttons.push(
        <Button
          key="transfer"
          as={Link}
          to={`/samples/routing/create?sample_id=${sample.id}`}
          variant="warning"
          size="sm"
          className="mobile-action-btn touch-target"
          aria-label={`Transfer sample ${sample.sample_id}`}
        >
          <FontAwesomeIcon icon={faExchangeAlt} />
          <span className="ms-2 d-none d-sm-inline">Transfer</span>
        </Button>
      );
    }

    return buttons;
  };

  return (
    <Card className="mobile-data-card sample-mobile-card">
      {/* Card Header */}
      <Card.Header className="mobile-card-header">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1 me-3">
            <div className="mobile-card-title d-flex align-items-center">
              <FontAwesomeIcon icon={faVial} className="me-2 text-primary" />
              <Link 
                to={`/samples/${sample.id}`}
                className="text-decoration-none fw-bold"
                aria-label={`View sample details for ${sample.sample_id}`}
              >
                {sample.sample_id}
              </Link>
            </div>
            {sample.patient && (
              <div className="mobile-card-subtitle">
                <FontAwesomeIcon icon={faUser} className="me-1" />
                <Link 
                  to={`/patients/${sample.patient.id}`}
                  className="text-decoration-none"
                  aria-label={`View patient details for ${sample.patient.first_name} ${sample.patient.last_name}`}
                >
                  {sample.patient.first_name} {sample.patient.last_name}
                </Link>
              </div>
            )}
          </div>
          <div className="mobile-card-status">
            <Badge 
              bg={getStatusBadgeVariant(sample.status)}
              className="status-badge"
            >
              {sample.status || 'Unknown'}
            </Badge>
          </div>
        </div>
      </Card.Header>

      {/* Card Body */}
      <Card.Body className="mobile-card-body">
        <div className="mobile-card-field">
          <div className="mobile-card-label">
            <FontAwesomeIcon icon={faFlask} className="me-1" />
            Sample Type
          </div>
          <div className="mobile-card-value">
            {sample.sample_type || 'N/A'}
          </div>
        </div>

        <div className="mobile-card-field">
          <div className="mobile-card-label">
            <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
            Collection Date
          </div>
          <div className="mobile-card-value">
            {formatDate(sample.collection_date)}
          </div>
        </div>

        {sample.collection_time && (
          <div className="mobile-card-field">
            <div className="mobile-card-label">
              Collection Time
            </div>
            <div className="mobile-card-value">
              {sample.collection_time}
            </div>
          </div>
        )}

        {sample.priority && (
          <div className="mobile-card-field">
            <div className="mobile-card-label">
              Priority
            </div>
            <div className="mobile-card-value">
              <Badge 
                bg={sample.priority === 'High' ? 'danger' : sample.priority === 'Medium' ? 'warning' : 'secondary'}
                className="priority-badge"
              >
                {sample.priority}
              </Badge>
            </div>
          </div>
        )}

        {sample.notes && (
          <div className="mobile-card-field">
            <div className="mobile-card-label">
              <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
              Notes
            </div>
            <div className="mobile-card-value">
              {sample.notes}
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

SampleMobileCard.propTypes = {
  sample: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    sample_id: PropTypes.string.isRequired,
    patient: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      first_name: PropTypes.string,
      last_name: PropTypes.string
    }),
    sample_type: PropTypes.string,
    collection_date: PropTypes.string,
    collection_time: PropTypes.string,
    status: PropTypes.string,
    priority: PropTypes.string,
    notes: PropTypes.string
  }).isRequired
};

export default SampleMobileCard;
