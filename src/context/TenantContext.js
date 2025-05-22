import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const TenantContext = createContext();

export const useTenant = () => useContext(TenantContext);

export const TenantProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [tenantData, setTenantData] = useState(null);
  const [accessibleTenants, setAccessibleTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const response = await axios.get('/api/tenants/current');
        setTenantData(response.data);

        // Get accessible tenants if user is admin
        if (currentUser.role === 'admin' || currentUser.role === 'hub_admin') {
          const accessibleResponse = await axios.get('/api/tenants/accessible');
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

  const value = {
    tenantData,
    accessibleTenants,
    loading,
    error
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};
