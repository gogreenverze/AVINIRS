import React, { useState, useEffect } from 'react';
import { Table, Card, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faEdit, 
  faTrash,
  faExchangeAlt,
  faBoxes,
  faExclamationTriangle,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import InventoryMobileCard from './InventoryMobileCard';
import Pagination from '../common/Pagination';
import PropTypes from 'prop-types';

/**
 * Responsive inventory table that switches between table and card view
 * based on screen size with pagination support
 */
const ResponsiveInventoryTable = ({
  items = [],
  title = 'Inventory Items',
  loading = false,
  itemsPerPage = 20,
  onDelete,
  currentPage = 1,
  totalPages = 1,
  onPageChange
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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

  const handleDeleteConfirm = (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      onDelete(item);
    }
  };

  if (loading) {
    return (
      <Card className="shadow mb-4">
        <Card.Body className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading inventory items...</p>
        </Card.Body>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Alert variant="info" className="text-center">
        <FontAwesomeIcon icon={faBoxes} className="me-2" />
        No inventory items found.
      </Alert>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="mobile-inventory-container">
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              {title}
              <span className="badge bg-primary float-end">
                {items.length} Items
              </span>
            </h6>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="mobile-data-container">
              {items.map(item => (
                <InventoryMobileCard
                  key={item.id}
                  item={item}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </Card.Body>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={items.length}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
            size="sm"
            className="mt-3"
          />
        )}
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="desktop-inventory-container">
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">
            {title}
            <span className="badge bg-primary float-end">
              {items.length} Items
            </span>
          </h6>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table className="table-hover" width="100%" cellSpacing="0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Stock Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <Link 
                        to={`/inventory/${item.id}`}
                        className="fw-bold text-decoration-none"
                        aria-label={`View details for ${item.name}`}
                      >
                        {item.name}
                      </Link>
                    </td>
                    <td>{item.sku || 'N/A'}</td>
                    <td>{item.category || 'N/A'}</td>
                    <td>
                      <span>{item.quantity} {item.unit || 'units'}</span>
                    </td>
                    <td>
                      <Badge 
                        bg={getStockLevelBadgeVariant(item.quantity, item.reorder_level)}
                        className="d-flex align-items-center w-auto"
                      >
                        <FontAwesomeIcon 
                          icon={getStockLevelIcon(item.quantity, item.reorder_level)} 
                          className="me-1" 
                        />
                        {getStockLevelText(item.quantity, item.reorder_level)}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex">
                        <Link 
                          to={`/inventory/${item.id}`} 
                          className="btn btn-sm btn-info me-1"
                          aria-label={`View details for ${item.name}`}
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </Link>
                        <Link 
                          to={`/inventory/${item.id}/edit`} 
                          className="btn btn-sm btn-primary me-1"
                          aria-label={`Edit ${item.name}`}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </Link>
                        <Link 
                          to={`/inventory/${item.id}/transactions`} 
                          className="btn btn-sm btn-success me-1"
                          aria-label={`View transactions for ${item.name}`}
                        >
                          <FontAwesomeIcon icon={faExchangeAlt} />
                        </Link>
                        {onDelete && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteConfirm(item)}
                            aria-label={`Delete ${item.name}`}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
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
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={items.length}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          className="mt-3"
        />
      )}
    </div>
  );
};

ResponsiveInventoryTable.propTypes = {
  items: PropTypes.array.isRequired,
  title: PropTypes.string,
  loading: PropTypes.bool,
  itemsPerPage: PropTypes.number,
  onDelete: PropTypes.func,
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  onPageChange: PropTypes.func
};

export default ResponsiveInventoryTable;
