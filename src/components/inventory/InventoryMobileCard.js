import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faEdit, 
  faTrash,
  faExchangeAlt,
  faBoxes,
  faBarcode,
  faLayerGroup,
  faHashtag,
  faExclamationTriangle,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';

/**
 * Mobile-optimized card component for inventory data
 * Displays inventory information in a card format suitable for mobile devices
 */
const InventoryMobileCard = ({ item, onDelete }) => {
  const getStockLevelBadgeVariant = (quantity, reorderLevel) => {
    if (quantity <= 0) return 'danger';
    if (quantity <= reorderLevel) return 'warning';
    return 'success';
  };

  const getStockLevelText = (quantity, reorderLevel) => {
    if (quantity <= 0) return 'Out of Stock';
    if (quantity <= reorderLevel) return 'Low Stock';
    return 'In Stock';
  };

  const getStockLevelIcon = (quantity, reorderLevel) => {
    if (quantity <= 0) return faTimesCircle;
    if (quantity <= reorderLevel) return faExclamationTriangle;
    return faCheckCircle;
  };

  const handleDeleteConfirm = () => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      onDelete(item);
    }
  };

  const renderActionButtons = () => {
    const buttons = [];

    // View button
    buttons.push(
      <Button
        key="view"
        as={Link}
        to={`/inventory/${item.id}`}
        variant="info"
        size="sm"
        className="mobile-action-btn touch-target"
        aria-label={`View details for ${item.name}`}
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
        to={`/inventory/${item.id}/edit`}
        variant="primary"
        size="sm"
        className="mobile-action-btn touch-target"
        aria-label={`Edit ${item.name}`}
      >
        <FontAwesomeIcon icon={faEdit} />
        <span className="ms-2 d-none d-sm-inline">Edit</span>
      </Button>
    );

    // Transactions button
    buttons.push(
      <Button
        key="transactions"
        as={Link}
        to={`/inventory/${item.id}/transactions`}
        variant="success"
        size="sm"
        className="mobile-action-btn touch-target"
        aria-label={`View transactions for ${item.name}`}
      >
        <FontAwesomeIcon icon={faExchangeAlt} />
        <span className="ms-2 d-none d-sm-inline">Transactions</span>
      </Button>
    );

    // Delete button
    if (onDelete) {
      buttons.push(
        <Button
          key="delete"
          variant="danger"
          size="sm"
          className="mobile-action-btn touch-target"
          onClick={handleDeleteConfirm}
          aria-label={`Delete ${item.name}`}
        >
          <FontAwesomeIcon icon={faTrash} />
          <span className="ms-2 d-none d-sm-inline">Delete</span>
        </Button>
      );
    }

    return buttons;
  };

  return (
    <Card className="mobile-data-card inventory-mobile-card">
      {/* Card Header */}
      <Card.Header className="mobile-card-header">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1 me-3">
            <div className="mobile-card-title d-flex align-items-center">
              <FontAwesomeIcon icon={faBoxes} className="me-2 text-primary" />
              <Link 
                to={`/inventory/${item.id}`}
                className="text-decoration-none fw-bold"
                aria-label={`View details for ${item.name}`}
              >
                {item.name}
              </Link>
            </div>
            <div className="mobile-card-subtitle">
              <FontAwesomeIcon icon={faBarcode} className="me-1" />
              SKU: {item.sku || 'N/A'}
            </div>
          </div>
          <div className="mobile-card-status">
            <Badge 
              bg={getStockLevelBadgeVariant(item.quantity, item.reorder_level)}
              className="status-badge d-flex align-items-center"
            >
              <FontAwesomeIcon 
                icon={getStockLevelIcon(item.quantity, item.reorder_level)} 
                className="me-1" 
              />
              {getStockLevelText(item.quantity, item.reorder_level)}
            </Badge>
          </div>
        </div>
      </Card.Header>

      {/* Card Body */}
      <Card.Body className="mobile-card-body">
        <div className="mobile-card-field">
          <div className="mobile-card-label">
            <FontAwesomeIcon icon={faLayerGroup} className="me-1" />
            Category
          </div>
          <div className="mobile-card-value">
            {item.category || 'N/A'}
          </div>
        </div>

        <div className="mobile-card-field">
          <div className="mobile-card-label">
            <FontAwesomeIcon icon={faHashtag} className="me-1" />
            Quantity
          </div>
          <div className="mobile-card-value fw-bold">
            {item.quantity} {item.unit || 'units'}
          </div>
        </div>

        {item.reorder_level && (
          <div className="mobile-card-field">
            <div className="mobile-card-label">
              Reorder Level
            </div>
            <div className="mobile-card-value">
              {item.reorder_level} {item.unit || 'units'}
            </div>
          </div>
        )}

        {item.location && (
          <div className="mobile-card-field">
            <div className="mobile-card-label">
              Location
            </div>
            <div className="mobile-card-value">
              {item.location}
            </div>
          </div>
        )}

        {item.supplier && (
          <div className="mobile-card-field">
            <div className="mobile-card-label">
              Supplier
            </div>
            <div className="mobile-card-value">
              {item.supplier}
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

InventoryMobileCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    sku: PropTypes.string,
    category: PropTypes.string,
    quantity: PropTypes.number,
    unit: PropTypes.string,
    reorder_level: PropTypes.number,
    location: PropTypes.string,
    supplier: PropTypes.string
  }).isRequired,
  onDelete: PropTypes.func
};

export default InventoryMobileCard;
