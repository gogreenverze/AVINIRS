import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const ProtectedRoute = ({ children, requiredModule, requiredRole }) => {
  const { isAuthenticated, loading: authLoading, currentUser } = useAuth();
  const { hasModuleAccess, loading: permissionLoading } = usePermissions();

  // Show loading while checking authentication and permissions
  if (authLoading || permissionLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if required
  if (requiredRole && currentUser?.role !== requiredRole) {
    // Allow admin and hub_admin to access most role-restricted routes
    if (!['admin', 'hub_admin'].includes(currentUser?.role)) {
      return (
        <div className="container mt-5">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card border-warning">
                <div className="card-header bg-warning text-dark">
                  <h5 className="mb-0">
                    <FontAwesomeIcon icon={faLock} className="me-2" />
                    Role Access Required
                  </h5>
                </div>
                <div className="card-body text-center">
                  <FontAwesomeIcon icon={faLock} className="fa-3x text-warning mb-3" />
                  <h6>Insufficient Role Permissions</h6>
                  <p className="text-muted">
                    This page requires <strong>{requiredRole}</strong> role access.
                    Your current role is <strong>{currentUser?.role}</strong>.
                  </p>
                  <button
                    className="btn btn-primary me-2"
                    onClick={() => window.history.back()}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="me-1" />
                    Go Back
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Check module-based access if required
  if (requiredModule && !hasModuleAccess(requiredModule)) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card border-danger">
              <div className="card-header bg-danger text-white">
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faLock} className="me-2" />
                  Module Access Denied
                </h5>
              </div>
              <div className="card-body text-center">
                <FontAwesomeIcon icon={faLock} className="fa-3x text-danger mb-3" />
                <h6>Insufficient Module Permissions</h6>
                <p className="text-muted">
                  You don't have permission to access the <strong>{requiredModule}</strong> module.
                  Please contact your administrator if you believe this is an error.
                </p>
                <div className="mt-3">
                  <button
                    className="btn btn-primary me-2"
                    onClick={() => window.history.back()}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="me-1" />
                    Go Back
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    Dashboard
                  </button>
                </div>
                <div className="mt-3">
                  <small className="text-muted">
                    Current role: <strong>{currentUser?.role}</strong> |
                    Franchise: <strong>{currentUser?.tenant?.name || 'Unknown'}</strong>
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      );
    }

  // All checks passed, render the protected content
  return children;
};

export default ProtectedRoute;
