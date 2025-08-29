import React, { useState } from 'react';
import { Button, Badge, Collapse } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faChevronDown, faChevronUp, faEye } from '@fortawesome/free-solid-svg-icons';

/**
 * Mobile-optimized data card component for Master Data
 * Displays data in a card format suitable for mobile devices
 */
const MobileDataCard = ({
  data,
  fields,
  onEdit,
  onDelete,
  title,
  subtitle,
  statusField = 'is_active',
  primaryField,
  secondaryField,
  relatedRecords = null,
  onViewDetails = null,
  showExpandable = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const getFieldValue = (item, field) => {
    if (typeof field === 'function') {
      return field(item);
    }
    
    if (typeof field === 'string') {
      return item[field];
    }
    
    if (field.render) {
      return field.render(item[field.key], item);
    }
    
    return item[field.key] || 'N/A';
  };

  const getStatusBadge = (item) => {
    const status = item[statusField];
    if (typeof status === 'boolean') {
      return (
        <Badge 
          className={`status-badge ${status ? 'active' : 'inactive'}`}
          bg={status ? 'success' : 'danger'}
        >
          {status ? 'Active' : 'Inactive'}
        </Badge>
      );
    }
    return <Badge bg="secondary">{status || 'Unknown'}</Badge>;
  };

  const renderFieldValue = (item, field) => {
    const value = getFieldValue(item, field);
    
    // Handle special field types
    if (field.type === 'currency') {
      return `₹${value}`;
    }
    
    if (field.type === 'date') {
      return value ? new Date(value).toLocaleDateString() : 'N/A';
    }
    
    if (field.type === 'badge') {
      return <Badge bg={field.variant || 'primary'}>{value}</Badge>;
    }
    
    if (field.type === 'code') {
      return <code className="text-primary">{value}</code>;
    }
    
    return value;
  };

  return (
    <div className="mobile-data-card">
      <div className="mobile-card-header">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1 me-3">
            <div className="mobile-card-title">
              {title ? getFieldValue(data, title) : (primaryField ? getFieldValue(data, primaryField) : data.name || data.title || 'Item')}
            </div>
            {(subtitle || secondaryField) && (
              <div className="mobile-card-subtitle">
                {subtitle ? getFieldValue(data, subtitle) : getFieldValue(data, secondaryField)}
              </div>
            )}
          </div>
          <div className="mobile-card-status">
            {getStatusBadge(data)}
          </div>
        </div>
      </div>
      
      <div className="mobile-card-body">
        {fields.map((field, index) => {
          // Skip fields that are already shown in header
          if (field.key === primaryField || field.key === secondaryField || field.key === statusField) {
            return null;
          }
          
          return (
            <div key={index} className="mobile-card-field">
              <div className="mobile-card-label">
                {field.label || field.key}
              </div>
              <div className="mobile-card-value">
                {renderFieldValue(data, field)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Related Records Section */}
      {(relatedRecords || showExpandable) && (
        <div className="mobile-card-expandable">
          <Button
            variant="link"
            className="mobile-expand-btn w-100 text-start"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
          >
            <FontAwesomeIcon
              icon={isExpanded ? faChevronUp : faChevronDown}
              className="me-2"
            />
            {relatedRecords ? `Related Records (${relatedRecords.length})` : 'More Details'}
          </Button>

          <Collapse in={isExpanded}>
            <div className="mobile-card-expanded-content">
              {relatedRecords && relatedRecords.length > 0 ? (
                <div className="related-records-list">
                  {relatedRecords.slice(0, 3).map((record, index) => (
                    <div key={index} className="related-record-item">
                      <div className="related-record-title">
                        {record.name || record.title || `Record ${index + 1}`}
                      </div>
                      <div className="related-record-details">
                        {record.description || record.code || 'No details available'}
                      </div>
                    </div>
                  ))}
                  {relatedRecords.length > 3 && (
                    <div className="related-records-more">
                      +{relatedRecords.length - 3} more records
                    </div>
                  )}
                </div>
              ) : (
                <div className="expanded-content-placeholder">
                  Additional details would be displayed here
                </div>
              )}
            </div>
          </Collapse>
        </div>
      )}

      <div className="mobile-card-actions">
        {onViewDetails && (
          <Button
            variant="info"
            size="sm"
            className="mobile-action-btn touch-target"
            onClick={() => onViewDetails(data)}
            aria-label={`View details for ${data.name || data.title || 'item'}`}
          >
            <FontAwesomeIcon icon={faEye} />
            <span className="ms-2">View</span>
          </Button>
        )}
        {onEdit && (
          <Button
            variant="primary"
            size="sm"
            className="mobile-action-btn touch-target"
            onClick={() => onEdit(data)}
            aria-label={`Edit ${data.name || data.title || 'item'}`}
          >
            <FontAwesomeIcon icon={faEdit} />
            <span className="ms-2">Edit</span>
          </Button>
        )}
        {onDelete && (
          <Button
            variant="danger"
            size="sm"
            className="mobile-action-btn touch-target"
            onClick={() => onDelete(data)}
            aria-label={`Delete ${data.name || data.title || 'item'}`}
          >
            <FontAwesomeIcon icon={faTrash} />
            <span className="ms-2">Delete</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default MobileDataCard;
