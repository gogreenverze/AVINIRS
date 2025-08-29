import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const PermissionContext = createContext();

export const usePermissions = () => useContext(PermissionContext);

export const PermissionProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [userModules, setUserModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user's accessible modules
  useEffect(() => {
    const loadUserModules = async () => {
      if (!isAuthenticated || !currentUser) {
        setUserModules([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('[PERMISSIONS] Loading modules for user:', currentUser);

        // Admin and hub_admin have access to all modules
        if (currentUser.role === 'admin' || currentUser.role === 'hub_admin') {
          console.log('[PERMISSIONS] User is admin/hub_admin, fetching all modules');
          const response = await api.get('/access-management/modules');
          console.log('[PERMISSIONS] Admin modules response:', response.data);
          setUserModules(response.data.data);
        } else {
          // For franchise users, use the new endpoint that doesn't require admin role
          console.log('[PERMISSIONS] User is franchise user, fetching accessible modules');
          const response = await api.get('/access-management/my-modules');
          console.log('[PERMISSIONS] Franchise modules response:', response.data);

          if (response.data.success) {
            console.log('[PERMISSIONS] Setting user modules:', response.data.data);
            setUserModules(response.data.data);
          } else {
            console.error('[PERMISSIONS] Failed to load user modules:', response.data.message);
            setUserModules([]);
          }
        }
      } catch (err) {
        console.error('[PERMISSIONS] Error loading user modules:', err);
        console.error('[PERMISSIONS] Error details:', err.response?.data);
        setError('Failed to load user permissions');
        setUserModules([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserModules();
  }, [currentUser, isAuthenticated]);

  // Check if user has access to a specific module
  const hasModuleAccess = (moduleCode) => {
    if (!currentUser || !isAuthenticated) {
      return false;
    }

    // Admin and hub_admin have access to all modules
    if (currentUser.role === 'admin' || currentUser.role === 'hub_admin') {
      return true;
    }

    // Check if module is in user's accessible modules
    return userModules.some(module => module.code === moduleCode);
  };

  // Check if user has access to a specific route
  const hasRouteAccess = (route) => {
    if (!currentUser || !isAuthenticated) {
      return false;
    }

    // Admin and hub_admin have access to all routes
    if (currentUser.role === 'admin' || currentUser.role === 'hub_admin') {
      return true;
    }

    // Find module by route and check access
    const module = userModules.find(m => route.startsWith(m.route));
    return !!module;
  };

  // Get modules by category
  const getModulesByCategory = () => {
    const categories = {};
    userModules.forEach(module => {
      if (!categories[module.category]) {
        categories[module.category] = [];
      }
      categories[module.category].push(module);
    });
    return categories;
  };

  // Get accessible navigation items
  const getAccessibleNavItems = () => {
    return userModules.filter(module => module.is_active);
  };

  const value = {
    userModules,
    loading,
    error,
    hasModuleAccess,
    hasRouteAccess,
    getModulesByCategory,
    getAccessibleNavItems
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

// Higher-order component for route protection
export const withPermissionCheck = (WrappedComponent, requiredModuleCode) => {
  return function PermissionProtectedComponent(props) {
    const { hasModuleAccess, loading } = usePermissions();

    if (loading) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    if (!hasModuleAccess(requiredModuleCode)) {
      return (
        <div className="container mt-5">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card border-danger">
                <div className="card-header bg-danger text-white">
                  <h5 className="mb-0">Access Denied</h5>
                </div>
                <div className="card-body text-center">
                  <i className="fas fa-lock fa-3x text-danger mb-3"></i>
                  <h6>Insufficient Permissions</h6>
                  <p className="text-muted">
                    You don't have permission to access this module. 
                    Please contact your administrator if you believe this is an error.
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => window.history.back()}
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

export default PermissionContext;
