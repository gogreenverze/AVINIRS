import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFlask, faVial, faUserMd, faFileInvoiceDollar, faBoxes, 
  faMicroscope, faEyeDropper, faTruck, faRulerHorizontal, faCogs,
  faUsers, faClipboardList, faShieldAlt, faBug, faLayerGroup,
  faBuilding, faCog, faKey, faPrint, faDatabase, faChevronRight,
  faPlus, faEdit, faTrash
} from '@fortawesome/free-solid-svg-icons';

const MasterDataCard = ({ 
  category, 
  title, 
  data = [], 
  onViewDetails, 
  onAddNew,
  description,
  lastUpdated 
}) => {
  // Icon mapping for categories
  const iconMap = {
    testCategories: faFlask,
    testParameters: faVial,
    sampleTypes: faVial,
    departments: faUserMd,
    paymentMethods: faFileInvoiceDollar,
    containers: faBoxes,
    instruments: faMicroscope,
    reagents: faEyeDropper,
    suppliers: faTruck,
    units: faRulerHorizontal,
    testMethods: faCogs,
    patients: faUsers,
    profileMaster: faClipboardList,
    methodMaster: faCogs,
    antibioticMaster: faShieldAlt,
    organismMaster: faBug,
    unitOfMeasurement: faRulerHorizontal,
    specimenMaster: faVial,
    organismVsAntibiotic: faLayerGroup,
    containerMaster: faBoxes,
    mainDepartmentMaster: faBuilding,
    departmentSettings: faCog,
    authorizationSettings: faKey,
    printOrder: faPrint,
    testMaster: faFlask,
    subTestMaster: faVial,
    departmentMaster: faBuilding
  };

  const icon = iconMap[category] || faDatabase;
  const recordCount = Array.isArray(data) ? data.length : 0;
  const activeCount = Array.isArray(data) ? data.filter(item => item.is_active !== false).length : 0;

  // Get status color based on record count
  const getStatusColor = () => {
    if (recordCount === 0) return 'secondary';
    if (recordCount < 5) return 'warning';
    return 'success';
  };

  // Format last updated date
  const formatLastUpdated = (dateString) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Card className="master-data-category-card h-100">
      <Card.Header className="master-data-card-header">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <div className="category-icon-wrapper me-3">
              <FontAwesomeIcon icon={icon} className="category-icon" />
            </div>
            <div>
              <h6 className="category-title mb-0">{title}</h6>
              <small className="category-description text-muted">
                {description || `Manage ${title.toLowerCase()}`}
              </small>
            </div>
          </div>
          <Badge bg={getStatusColor()} className="record-count-badge">
            {recordCount}
          </Badge>
        </div>
      </Card.Header>

      <Card.Body className="master-data-card-body">
        <div className="category-stats">
          <div className="stat-item">
            <span className="stat-label">Total Records:</span>
            <span className="stat-value">{recordCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active:</span>
            <span className="stat-value text-success">{activeCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Inactive:</span>
            <span className="stat-value text-muted">{recordCount - activeCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Last Updated:</span>
            <span className="stat-value">{formatLastUpdated(lastUpdated)}</span>
          </div>
        </div>

        {/* Quick Preview of Recent Items */}
        {recordCount > 0 && (
          <div className="recent-items mt-3">
            <small className="text-muted d-block mb-2">Recent Items:</small>
            <div className="recent-items-list">
              {data.slice(0, 3).map((item, index) => (
                <div key={index} className="recent-item">
                  <span className="recent-item-name">
                    {item.name || item.department || item.test_profile || item.description || `Item ${item.id}`}
                  </span>
                  {item.is_active !== false ? (
                    <Badge bg="success" size="sm">Active</Badge>
                  ) : (
                    <Badge bg="secondary" size="sm">Inactive</Badge>
                  )}
                </div>
              ))}
              {recordCount > 3 && (
                <small className="text-muted">
                  +{recordCount - 3} more items
                </small>
              )}
            </div>
          </div>
        )}

        {recordCount === 0 && (
          <div className="empty-state text-center py-3">
            <FontAwesomeIcon icon={icon} className="empty-icon text-muted mb-2" />
            <p className="text-muted mb-0">No records found</p>
            <small className="text-muted">Click "Add New" to get started</small>
          </div>
        )}
      </Card.Body>

      <Card.Footer className="master-data-card-footer">
        <div className="d-flex gap-2">
          <button
            className="btn btn-primary btn-sm flex-fill"
            onClick={() => onViewDetails(category)}
          >
            <FontAwesomeIcon icon={faChevronRight} className="me-1" />
            View Details
          </button>
          <button
            className="btn btn-outline-success btn-sm"
            onClick={() => onAddNew(category)}
            title="Add New Record"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default MasterDataCard;
