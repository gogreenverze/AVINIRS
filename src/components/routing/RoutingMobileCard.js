import React from 'react';
import { Card, Badge, Button, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faVial, faUser, faMapMarkerAlt, faClock, faBarcode,
  faExclamationTriangle, faCheckCircle, faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';

/**
 * Enhanced mobile card component for routing display
 */
const RoutingMobileCard = ({ 
  routing, 
  type = 'all', 
  actions = [],
  actionLoading = {}
}) => {
  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending_approval':
        return 'warning';
      case 'approved':
        return 'info';
      case 'in_transit':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'completed':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'cancelled':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusDisplayName = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending_approval':
        return 'Pending Approval';
      case 'approved':
        return 'Approved';
      case 'in_transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status || 'Unknown';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return faExclamationTriangle;
      case 'high':
        return faExclamationTriangle;
      default:
        return faClock;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'danger';
      case 'high':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <Card className="routing-mobile-card">
      {/* Header */}
      <div className="mobile-card-header">
        <Row className="align-items-center">
          <Col xs={8}>
            <div className="mobile-card-title">
              <FontAwesomeIcon icon={faVial} className="me-2 text-primary" />
              <Link 
                to={`/samples/routing/${routing.id}`} 
                className="text-decoration-none fw-bold"
              >
                {routing.sample?.sample_id || 'N/A'}
              </Link>
            </div>
            <div className="mobile-card-subtitle">
              <FontAwesomeIcon icon={faBarcode} className="me-1" />
              {routing.tracking_number || 'No tracking'}
            </div>
          </Col>
          <Col xs={4} className="text-end">
            <Badge bg={getStatusBadgeVariant(routing.status)} className="mb-1">
              {getStatusDisplayName(routing.status)}
            </Badge>
            <br />
            <Badge bg={getPriorityColor(routing.priority)}>
              <FontAwesomeIcon icon={getPriorityIcon(routing.priority)} className="me-1" />
              {routing.priority || 'normal'}
            </Badge>
          </Col>
        </Row>
      </div>

      {/* Body */}
      <div className="mobile-card-body">
        {/* Patient Information */}
        {routing.patient && (
          <div className="mobile-card-field">
            <span className="mobile-card-label">
              <FontAwesomeIcon icon={faUser} className="me-1" />
              Patient:
            </span>
            <span className="mobile-card-value">
              {routing.patient.first_name} {routing.patient.last_name}
            </span>
          </div>
        )}

        {/* Route Information */}
        <div className="mobile-card-field">
          <span className="mobile-card-label">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" />
            Route:
          </span>
          <span className="mobile-card-value">
            <span className="text-muted">{routing.from_tenant?.site_code || 'UNK'}</span>
            {' → '}
            <span className="text-primary">{routing.to_tenant?.site_code || 'UNK'}</span>
          </span>
        </div>

        {/* Facilities */}
        {type === 'incoming' && routing.from_tenant && (
          <div className="mobile-card-field">
            <span className="mobile-card-label">From:</span>
            <span className="mobile-card-value">{routing.from_tenant.name}</span>
          </div>
        )}

        {type === 'outgoing' && routing.to_tenant && (
          <div className="mobile-card-field">
            <span className="mobile-card-label">To:</span>
            <span className="mobile-card-value">{routing.to_tenant.name}</span>
          </div>
        )}

        {type === 'all' && (
          <>
            <div className="mobile-card-field">
              <span className="mobile-card-label">From:</span>
              <span className="mobile-card-value">{routing.from_tenant?.name || 'Unknown'}</span>
            </div>
            <div className="mobile-card-field">
              <span className="mobile-card-label">To:</span>
              <span className="mobile-card-value">{routing.to_tenant?.name || 'Unknown'}</span>
            </div>
          </>
        )}

        {/* Reason */}
        <div className="mobile-card-field">
          <span className="mobile-card-label">Reason:</span>
          <span className="mobile-card-value">{routing.reason || 'N/A'}</span>
        </div>

        {/* Dates */}
        <div className="mobile-card-field">
          <span className="mobile-card-label">
            <FontAwesomeIcon icon={faClock} className="me-1" />
            Created:
          </span>
          <span className="mobile-card-value">
            {formatDate(routing.created_at)}
            {routing.created_at && (
              <small className="text-muted ms-1">
                {formatTime(routing.created_at)}
              </small>
            )}
          </span>
        </div>

        {/* Dispatch Date */}
        {routing.dispatch_date && (
          <div className="mobile-card-field">
            <span className="mobile-card-label">Dispatched:</span>
            <span className="mobile-card-value">
              {formatDate(routing.dispatch_date)}
              <small className="text-muted ms-1">
                {formatTime(routing.dispatch_date)}
              </small>
            </span>
          </div>
        )}

        {/* Expected Delivery */}
        {routing.expected_delivery_date && (
          <div className="mobile-card-field">
            <span className="mobile-card-label">Expected:</span>
            <span className="mobile-card-value">
              {formatDate(routing.expected_delivery_date)}
            </span>
          </div>
        )}

        {/* Courier Information */}
        {routing.courier_name && (
          <div className="mobile-card-field">
            <span className="mobile-card-label">Courier:</span>
            <span className="mobile-card-value">
              {routing.courier_name}
              {routing.courier_contact && (
                <small className="text-muted ms-1">
                  ({routing.courier_contact})
                </small>
              )}
            </span>
          </div>
        )}

        {/* Special Instructions */}
        {routing.special_instructions && (
          <div className="mobile-card-field">
            <span className="mobile-card-label">Instructions:</span>
            <span className="mobile-card-value">
              <small>{routing.special_instructions}</small>
            </span>
          </div>
        )}

        {/* Temperature Requirements */}
        {routing.temperature_requirements && routing.temperature_requirements !== 'room_temperature' && (
          <div className="mobile-card-field">
            <span className="mobile-card-label">Temperature:</span>
            <span className="mobile-card-value">
              <Badge bg="info" className="text-capitalize">
                {routing.temperature_requirements.replace('_', ' ')}
              </Badge>
            </span>
          </div>
        )}

        {/* Workflow Progress */}
        {routing.workflow && (
          <div className="mobile-card-field">
            <span className="mobile-card-label">Progress:</span>
            <span className="mobile-card-value">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="progress" style={{ height: '4px' }}>
                    <div 
                      className="progress-bar bg-primary" 
                      style={{ 
                        width: `${getProgressPercentage(routing.workflow.current_stage)}%` 
                      }}
                    />
                  </div>
                </div>
                <small className="text-muted ms-2">
                  {getProgressPercentage(routing.workflow.current_stage)}%
                </small>
              </div>
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="mobile-card-actions">
          {actions.map(action => (
            <Button
              key={action.key}
              variant={action.variant}
              size="sm"
              className="mobile-action-btn"
              onClick={action.onClick}
              disabled={actionLoading[`${routing.id}-${action.key}`]}
            >
              <FontAwesomeIcon 
                icon={action.icon} 
                className="me-1"
                spin={actionLoading[`${routing.id}-${action.key}`]}
              />
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
};

// Helper function to calculate progress percentage
const getProgressPercentage = (currentStage) => {
  const stageProgress = {
    'initiated': 10,
    'pending_approval': 20,
    'approved': 40,
    'in_transit': 60,
    'delivered': 80,
    'completed': 100,
    'rejected': 0,
    'cancelled': 0
  };
  
  return stageProgress[currentStage] || 0;
};

RoutingMobileCard.propTypes = {
  routing: PropTypes.object.isRequired,
  type: PropTypes.oneOf(['all', 'incoming', 'outgoing']),
  actions: PropTypes.array,
  actionLoading: PropTypes.object
};

export default RoutingMobileCard;
