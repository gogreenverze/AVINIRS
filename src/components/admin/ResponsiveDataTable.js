import React, { useState, useEffect } from 'react';
import { Table, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faDatabase } from '@fortawesome/free-solid-svg-icons';
import MobileDataCard from './MobileDataCard';

/**
 * Responsive data table that switches between table and card view
 * based on screen size and user preference
 */
const ResponsiveDataTable = ({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  onViewDetails,
  loading = false,
  emptyMessage = "No data available",
  mobileCardConfig = {},
  showRelatedRecords = false
}) => {
  const [isMobile, setIsMobile] = useState(false);



  useEffect(() => {
    const checkScreenSize = () => {
      // Mobile-first approach: mobile for screens < 768px
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const renderTableActions = (item) => (
    <div className="d-flex gap-1">
      {onEdit && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => onEdit(item)}
          title="Edit"
        >
          <FontAwesomeIcon icon={faEdit} />
        </Button>
      )}
      {onDelete && (
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(item)}
          title="Delete"
        >
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      )}
    </div>
  );

  const renderCellValue = (value, column, item) => {
    if (column.render) {
      return column.render(value, item);
    }

    if (column.type === 'currency') {
      return `₹${value}`;
    }

    if (column.type === 'date') {
      return value ? new Date(value).toLocaleDateString() : 'N/A';
    }

    if (column.type === 'badge') {
      return (
        <span className={`badge bg-${column.variant || 'primary'}`}>
          {value}
        </span>
      );
    }

    if (column.type === 'code') {
      return <code className="text-primary">{value}</code>;
    }

    if (column.type === 'boolean') {
      return (
        <span className={`badge bg-${value ? 'success' : 'danger'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      );
    }

    return value || 'N/A';
  };

  const renderEmptyState = () => (
    <div className="empty-state">
      <div className="empty-state-icon">
        <FontAwesomeIcon icon={faDatabase} />
      </div>
      <div className="empty-state-title">No Data Found</div>
      <div className="empty-state-description">{emptyMessage}</div>
    </div>
  );

  const renderLoadingState = () => (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <div className="ms-3">Loading data...</div>
    </div>
  );

  if (loading) {
    return renderLoadingState();
  }

  if (!data || data.length === 0) {
    return renderEmptyState();
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="mobile-data-container">
        {data.map((item, index) => (
          <MobileDataCard
            key={item.id || index}
            data={item}
            fields={columns}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewDetails={onViewDetails}
            showExpandable={showRelatedRecords}
            {...mobileCardConfig}
          />
        ))}
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="desktop-table-container">
      <div className="table-responsive h-100">
        <Table className="table-hover mb-0">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index} style={{ minWidth: column.minWidth }}>
                  {column.label || column.key}
                </th>
              ))}
              {(onEdit || onDelete) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.id || index}>
                {columns.map((column, colIndex) => (
                  <td key={colIndex}>
                    {renderCellValue(item[column.key], column, item)}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td>{renderTableActions(item)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default ResponsiveDataTable;
