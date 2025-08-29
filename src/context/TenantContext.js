import React, { createContext, useState, useContext, useEffect } from 'react';
import { tenantAPI } from '../services/api';
import { useAuth } from './AuthContext';

const TenantContext = createContext();

export const useTenant = () => useContext(TenantContext);

export const TenantProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [tenantData, setTenantData] = useState(null);
  const [accessibleTenants, setAccessibleTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for stored tenant selection on load
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      const storedTenantId = localStorage.getItem('selectedTenantId');
      if (storedTenantId) {
        setSelectedTenantId(parseInt(storedTenantId));
      }
    }
  }, [currentUser]);

  // Fetch tenant data when user is authenticated
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!isAuthenticated || !currentUser) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        // Get tenant data for the current user
        const response = await tenantAPI.getCurrentTenant();
        setTenantData(response.data);

        // Get accessible tenants if user is admin or hub_admin
        if (currentUser.role === 'admin' || currentUser.role === 'hub_admin' || currentUser.role === 'franchise_admin') {
          const accessibleResponse = await tenantAPI.getAccessibleTenants();
          setAccessibleTenants(accessibleResponse.data);
        }
      } catch (err) {
        console.error('Tenant data fetch error:', err);
        setError(err.response?.data?.message || 'Failed to fetch tenant data');
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();
  }, [isAuthenticated, currentUser]);

  const switchTenant = (tenantId) => {
    setSelectedTenantId(tenantId);
    if (tenantId) {
      localStorage.setItem('selectedTenantId', tenantId.toString());
    } else {
      localStorage.removeItem('selectedTenantId');
    }
  };

  const getCurrentTenantContext = () => {
    // For admin users with selected tenant
    if (currentUser?.role === 'admin' && selectedTenantId) {
      return accessibleTenants.find(t => t.id === selectedTenantId) || tenantData;
    }
    // For all other users (franchise_admin, etc.), use their tenant data
    return tenantData;
  };

  const value = {
    tenantData,
    accessibleTenants,
    selectedTenantId,
    currentTenantContext: getCurrentTenantContext(),
    switchTenant,
    loading,
    error
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};
