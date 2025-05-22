import React, { useState, useEffect } from 'react';
import { Alert, Toast, ToastContainer, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInfoCircle,
  faCheckCircle,
  faExclamationTriangle,
  faTimes,
  faExclamationCircle,
  faBullhorn,
  faBell
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import '../../styles/components/Alerts.css';

/**
 * Custom Alert component
 */
export const CustomAlert = ({
  variant = 'primary',
  message,
  icon,
  dismissible = false,
  onClose,
  className = '',
  ...props
}) => {
  // Determine icon based on variant if not provided
  const getIcon = () => {
    if (icon) return icon;

    switch (variant) {
      case 'success':
        return faCheckCircle;
      case 'danger':
        return faExclamationCircle;
      case 'warning':
        return faExclamationTriangle;
      case 'info':
      default:
        return faInfoCircle;
    }
  };

  return (
    <Alert
      variant={variant}
      dismissible={dismissible}
      onClose={onClose}
      className={`custom-alert ${className}`}
      {...props}
    >
      <div className="d-flex align-items-center">
        <FontAwesomeIcon icon={getIcon()} className="me-2" />
        <div>{message}</div>
      </div>
    </Alert>
  );
};

CustomAlert.propTypes = {
  variant: PropTypes.string,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  icon: PropTypes.object,
  dismissible: PropTypes.bool,
  onClose: PropTypes.func,
  className: PropTypes.string
};

/**
 * Toast Notification component
 */
export const ToastNotification = ({
  show,
  onClose,
  title,
  message,
  variant = 'primary',
  icon,
  autohide = true,
  delay = 5000,
  position = 'top-end',
  className = '',
  ...props
}) => {
  // Determine icon based on variant if not provided
  const getIcon = () => {
    if (icon) return icon;

    switch (variant) {
      case 'success':
        return faCheckCircle;
      case 'danger':
        return faExclamationCircle;
      case 'warning':
        return faExclamationTriangle;
      case 'info':
      default:
        return faInfoCircle;
    }
  };

  return (
    <Toast
      show={show}
      onClose={onClose}
      delay={delay}
      autohide={autohide}
      className={`toast-notification bg-${variant} text-white ${className}`}
      {...props}
    >
      <Toast.Header closeButton>
        <FontAwesomeIcon icon={getIcon()} className="me-2" />
        <strong className="me-auto">{title}</strong>
        <small>just now</small>
      </Toast.Header>
      <Toast.Body>{message}</Toast.Body>
    </Toast>
  );
};

ToastNotification.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  variant: PropTypes.string,
  icon: PropTypes.object,
  autohide: PropTypes.bool,
  delay: PropTypes.number,
  position: PropTypes.string,
  className: PropTypes.string
};

/**
 * Toast Container component
 */
export const CustomToastContainer = ({
  position = 'top-end',
  className = '',
  children,
  ...props
}) => {
  return (
    <ToastContainer
      position={position}
      className={`p-3 ${className}`}
      {...props}
    >
      {children}
    </ToastContainer>
  );
};

CustomToastContainer.propTypes = {
  position: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node
};

/**
 * Alert Context
 */
const AlertContext = React.createContext({
  showAlert: () => {},
  hideAlert: () => {},
  showToast: () => {},
  showSnackbar: () => {},
  showBanner: () => {},
  hideBanner: () => {}
});

/**
 * Alert Provider component
 */
export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);
  const [toast, setToast] = useState(null);
  const [snackbar, setSnackbar] = useState(null);
  const [banner, setBanner] = useState(null);

  // Hide alert after timeout
  useEffect(() => {
    if (alert && alert.timeout) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, alert.timeout);

      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Show alert
  const showAlert = ({
    message,
    variant = 'primary',
    icon,
    dismissible = true,
    timeout = 0,
    className = ''
  }) => {
    setAlert({
      message,
      variant,
      icon,
      dismissible,
      timeout,
      className
    });
  };

  // Hide alert
  const hideAlert = () => {
    setAlert(null);
  };

  // Show toast
  const showToast = ({
    title,
    message,
    variant = 'primary',
    icon,
    autohide = true,
    delay = 5000
  }) => {
    setToast({
      show: true,
      title,
      message,
      variant,
      icon,
      autohide,
      delay
    });
  };

  // Hide toast
  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  // Show snackbar
  const showSnackbar = ({
    message,
    variant = 'primary',
    icon,
    duration = 3000,
    position = 'bottom-center',
    action,
    actionText
  }) => {
    setSnackbar({
      show: true,
      message,
      variant,
      icon,
      duration,
      position,
      action,
      actionText
    });
  };

  // Hide snackbar
  const hideSnackbar = () => {
    setSnackbar(prev => prev ? { ...prev, show: false } : null);
  };

  // Show banner
  const showBanner = ({
    message,
    title,
    variant = 'primary',
    icon = faBullhorn,
    dismissible = true,
    actions = [],
    sticky = false
  }) => {
    setBanner({
      show: true,
      message,
      title,
      variant,
      icon,
      dismissible,
      actions,
      sticky
    });
  };

  // Hide banner
  const hideBanner = () => {
    setBanner(prev => prev ? { ...prev, show: false } : null);
  };

  return (
    <AlertContext.Provider value={{
      showAlert,
      hideAlert,
      showToast,
      showSnackbar,
      showBanner,
      hideBanner
    }}>
      {alert && (
        <CustomAlert
          variant={alert.variant}
          message={alert.message}
          icon={alert.icon}
          dismissible={alert.dismissible}
          onClose={hideAlert}
          className={alert.className}
        />
      )}

      <CustomToastContainer position="top-end">
        {toast && (
          <ToastNotification
            show={toast.show}
            onClose={hideToast}
            title={toast.title}
            message={toast.message}
            variant={toast.variant}
            icon={toast.icon}
            autohide={toast.autohide}
            delay={toast.delay}
          />
        )}
      </CustomToastContainer>

      {snackbar && (
        <SnackbarAlert
          show={snackbar.show}
          message={snackbar.message}
          variant={snackbar.variant}
          icon={snackbar.icon}
          duration={snackbar.duration}
          position={snackbar.position}
          onClose={hideSnackbar}
          action={snackbar.action}
          actionText={snackbar.actionText}
        />
      )}

      {banner && (
        <BannerAlert
          show={banner.show}
          message={banner.message}
          title={banner.title}
          variant={banner.variant}
          icon={banner.icon}
          dismissible={banner.dismissible}
          onClose={hideBanner}
          actions={banner.actions}
          sticky={banner.sticky}
        />
      )}

      {children}
    </AlertContext.Provider>
  );
};

AlertProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * useAlert hook
 */
export const useAlert = () => {
  const context = React.useContext(AlertContext);

  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }

  return context;
};

/**
 * Snackbar Alert component for temporary notifications
 */
export const SnackbarAlert = ({
  show,
  message,
  variant = 'primary',
  icon,
  duration = 3000,
  position = 'bottom-center',
  onClose,
  action,
  actionText = 'Action',
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(show);

  // Handle show/hide based on props
  useEffect(() => {
    setIsVisible(show);

    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  // Determine icon based on variant if not provided
  const getIcon = () => {
    if (icon) return icon;

    switch (variant) {
      case 'success':
        return faCheckCircle;
      case 'danger':
        return faExclamationCircle;
      case 'warning':
        return faExclamationTriangle;
      case 'info':
      default:
        return faInfoCircle;
    }
  };

  // Position classes
  const getPositionClass = () => {
    switch (position) {
      case 'top-left':
        return 'snackbar-top-left';
      case 'top-center':
        return 'snackbar-top-center';
      case 'top-right':
        return 'snackbar-top-right';
      case 'bottom-left':
        return 'snackbar-bottom-left';
      case 'bottom-right':
        return 'snackbar-bottom-right';
      case 'bottom-center':
      default:
        return 'snackbar-bottom-center';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`snackbar-alert snackbar-${variant} ${getPositionClass()} ${className}`}
      {...props}
    >
      <div className="snackbar-content">
        <FontAwesomeIcon icon={getIcon()} className="snackbar-icon" />
        <span className="snackbar-message">{message}</span>
        {action && (
          <Button
            variant="link"
            className="snackbar-action"
            onClick={action}
          >
            {actionText}
          </Button>
        )}
        {onClose && (
          <Button
            variant="link"
            className="snackbar-close"
            onClick={() => {
              setIsVisible(false);
              onClose();
            }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        )}
      </div>
    </div>
  );
};

SnackbarAlert.propTypes = {
  show: PropTypes.bool.isRequired,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  variant: PropTypes.string,
  icon: PropTypes.object,
  duration: PropTypes.number,
  position: PropTypes.oneOf([
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right'
  ]),
  onClose: PropTypes.func,
  action: PropTypes.func,
  actionText: PropTypes.string,
  className: PropTypes.string
};

/**
 * Banner Alert component for important announcements
 */
export const BannerAlert = ({
  show = true,
  message,
  title,
  variant = 'primary',
  icon = faBullhorn,
  dismissible = true,
  onClose,
  actions = [],
  sticky = false,
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(show);

  // Handle show/hide based on props
  useEffect(() => {
    setIsVisible(show);
  }, [show]);

  if (!isVisible) return null;

  return (
    <div
      className={`banner-alert banner-${variant} ${sticky ? 'banner-sticky' : ''} ${className}`}
      {...props}
    >
      <div className="banner-content">
        <div className="banner-icon">
          <FontAwesomeIcon icon={icon} size="lg" />
        </div>
        <div className="banner-text">
          {title && <div className="banner-title">{title}</div>}
          <div className="banner-message">{message}</div>
        </div>
        <div className="banner-actions">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'outline-light'}
              size="sm"
              onClick={action.onClick}
              className="me-2"
            >
              {action.icon && <FontAwesomeIcon icon={action.icon} className="me-1" />}
              {action.text}
            </Button>
          ))}
          {dismissible && (
            <Button
              variant="link"
              className="banner-close"
              onClick={() => {
                setIsVisible(false);
                if (onClose) onClose();
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

BannerAlert.propTypes = {
  show: PropTypes.bool,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  title: PropTypes.string,
  variant: PropTypes.string,
  icon: PropTypes.object,
  dismissible: PropTypes.bool,
  onClose: PropTypes.func,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      variant: PropTypes.string,
      icon: PropTypes.object
    })
  ),
  sticky: PropTypes.bool,
  className: PropTypes.string
};
