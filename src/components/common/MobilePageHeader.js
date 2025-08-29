import React, { useState } from 'react';
import { Button, Dropdown, Collapse } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronDown, 
  faChevronUp, 
  faEllipsisV,
  faBars
} from '@fortawesome/free-solid-svg-icons';

/**
 * Mobile-optimized page header component
 * Provides responsive layout with collapsible actions and icon-based navigation
 */
const MobilePageHeader = ({
  title,
  subtitle,
  icon,
  primaryAction,
  secondaryActions = [],
  breadcrumbs = [],
  showActionsCollapsed = true,
  className = ''
}) => {
  const [actionsExpanded, setActionsExpanded] = useState(false);

  const toggleActions = () => {
    setActionsExpanded(!actionsExpanded);
  };

  const renderBreadcrumbs = () => {
    if (!breadcrumbs.length) return null;

    return (
      <nav aria-label="breadcrumb" className="mobile-breadcrumb">
        <ol className="breadcrumb mb-2">
          {breadcrumbs.map((crumb, index) => (
            <li 
              key={index} 
              className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
              aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
            >
              {crumb.link ? (
                <a href={crumb.link} className="text-decoration-none">
                  {crumb.icon && <FontAwesomeIcon icon={crumb.icon} className="me-1" />}
                  <span className="d-none d-sm-inline">{crumb.label}</span>
                  <span className="d-sm-none">{crumb.shortLabel || crumb.label}</span>
                </a>
              ) : (
                <>
                  {crumb.icon && <FontAwesomeIcon icon={crumb.icon} className="me-1" />}
                  <span className="d-none d-sm-inline">{crumb.label}</span>
                  <span className="d-sm-none">{crumb.shortLabel || crumb.label}</span>
                </>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  const renderPrimaryAction = () => {
    if (!primaryAction) return null;

    return (
      <Button
        variant={primaryAction.variant || 'primary'}
        onClick={primaryAction.onClick}
        disabled={primaryAction.disabled}
        className="mobile-primary-action"
        title={primaryAction.tooltip || primaryAction.label}
      >
        {primaryAction.icon && (
          <FontAwesomeIcon icon={primaryAction.icon} className="me-2" />
        )}
        <span className="d-none d-sm-inline">{primaryAction.label}</span>
        <span className="d-sm-none">{primaryAction.shortLabel || primaryAction.label}</span>
      </Button>
    );
  };

  const renderSecondaryActions = () => {
    if (!secondaryActions.length) return null;

    // On mobile, show actions in a dropdown if there are many
    if (secondaryActions.length > 2) {
      return (
        <Dropdown className="d-md-none">
          <Dropdown.Toggle 
            variant="outline-secondary" 
            size="sm"
            className="mobile-actions-toggle"
          >
            <FontAwesomeIcon icon={faEllipsisV} />
          </Dropdown.Toggle>
          <Dropdown.Menu align="end">
            {secondaryActions.map((action, index) => (
              <Dropdown.Item
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.icon && <FontAwesomeIcon icon={action.icon} className="me-2" />}
                {action.label}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      );
    }

    // On desktop or with few actions, show buttons directly
    return (
      <div className="secondary-actions d-flex gap-2">
        {secondaryActions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'outline-secondary'}
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.tooltip || action.label}
            className="mobile-secondary-action"
          >
            {action.icon && (
              <FontAwesomeIcon icon={action.icon} className="me-1" />
            )}
            <span className="d-none d-lg-inline">{action.label}</span>
            <span className="d-lg-none">{action.shortLabel || action.label}</span>
          </Button>
        ))}
      </div>
    );
  };

  const renderCollapsibleActions = () => {
    if (!showActionsCollapsed || !secondaryActions.length) return null;

    return (
      <div className="collapsible-actions d-md-none">
        <Button
          variant="link"
          onClick={toggleActions}
          className="actions-toggle-btn w-100 text-start p-2"
          aria-expanded={actionsExpanded}
        >
          <FontAwesomeIcon 
            icon={actionsExpanded ? faChevronUp : faChevronDown} 
            className="me-2" 
          />
          Actions ({secondaryActions.length})
        </Button>
        
        <Collapse in={actionsExpanded}>
          <div className="actions-content p-2">
            <div className="d-grid gap-2">
              {secondaryActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outline-primary'}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="text-start"
                >
                  {action.icon && <FontAwesomeIcon icon={action.icon} className="me-2" />}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </Collapse>
      </div>
    );
  };

  return (
    <div className={`mobile-page-header ${className}`}>
      {renderBreadcrumbs()}
      
      <div className="header-main">
        <div className="header-content">
          <div className="title-section">
            <h1 className="page-title">
              {icon && <FontAwesomeIcon icon={icon} className="me-2" />}
              <span className="d-none d-md-inline">{title}</span>
              <span className="d-md-none">{title.length > 20 ? title.substring(0, 20) + '...' : title}</span>
            </h1>
            {subtitle && (
              <p className="page-subtitle text-muted mb-0">
                <span className="d-none d-sm-inline">{subtitle}</span>
                <span className="d-sm-none">
                  {subtitle.length > 30 ? subtitle.substring(0, 30) + '...' : subtitle}
                </span>
              </p>
            )}
          </div>
          
          <div className="actions-section">
            {renderPrimaryAction()}
            <div className="d-none d-md-flex gap-2">
              {renderSecondaryActions()}
            </div>
          </div>
        </div>
        
        {renderCollapsibleActions()}
      </div>
    </div>
  );
};

export default MobilePageHeader;
