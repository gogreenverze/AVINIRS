import React, { useState } from 'react';
import { Dropdown, Badge, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faExchangeAlt, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import api from '../../services/api';

const TenantSwitcher = () => {
  const { currentUser } = useAuth();
  const { accessibleTenants, selectedTenantId, switchTenant, currentTenantContext } = useTenant();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Get the currently selected tenant object
  const selectedTenant = selectedTenantId
    ? accessibleTenants.find(t => t.id === selectedTenantId)
    : null;

  // Only show for system admin
  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  const handleTenantSwitch = async (tenant) => {
    if (tenant.id === selectedTenant?.id) {
      return; // Already selected
    }

    try {
      setLoading(true);
      setError(null);

      // Call the tenant switch API (optional - for backend logging)
      try {
        await api.post(`/admin/switch-tenant/${tenant.id}`);
      } catch (apiErr) {
        console.warn('Backend tenant switch API failed, continuing with client-side switch:', apiErr);
      }

      // Update the tenant context (this will trigger data refresh in components)
      switchTenant(tenant.id);

      setSuccess(true);

      // Auto-hide success message after 2 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 2000);

    } catch (err) {
      console.error('Error switching tenant:', err);
      setError(err.response?.data?.message || 'Failed to switch tenant context');
    } finally {
      setLoading(false);
    }
  };

  const resetToAllTenants = () => {
    // Reset to show all tenants
    switchTenant(null);
    setSuccess(true);

    // Auto-hide success message after 2 seconds
    setTimeout(() => {
      setSuccess(false);
    }, 2000);
  };

  return (
    <div className="tenant-switcher mb-3">
      {/* Success Message */}
      {success && (
        <Alert variant="success" className="mb-2" dismissible onClose={() => setSuccess(false)}>
          <FontAwesomeIcon icon={faCheck} className="me-2" />
          Tenant context updated successfully!
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="danger" className="mb-2" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="d-flex align-items-center">
        <span className="me-2 text-muted">
          <FontAwesomeIcon icon={faBuilding} className="me-1" />
          Viewing:
        </span>
        
        <Dropdown>
          <Dropdown.Toggle 
            variant={selectedTenant ? "primary" : "outline-primary"} 
            size="sm"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faExchangeAlt} className="me-2" />
            {loading ? 'Switching...' : (selectedTenant ? selectedTenant.name : 'All Franchises')}
            {selectedTenant && selectedTenant.is_hub && (
              <Badge bg="warning" className="ms-2">HUB</Badge>
            )}
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item onClick={resetToAllTenants}>
              <FontAwesomeIcon icon={faBuilding} className="me-2 text-primary" />
              All Franchises
              {!selectedTenant && <FontAwesomeIcon icon={faCheck} className="ms-2 text-success" />}
            </Dropdown.Item>
            
            <Dropdown.Divider />
            
            {accessibleTenants.map((tenant) => (
              <Dropdown.Item 
                key={tenant.id}
                onClick={() => handleTenantSwitch(tenant)}
                className={selectedTenant?.id === tenant.id ? 'active' : ''}
              >
                <FontAwesomeIcon icon={faBuilding} className="me-2" />
                {tenant.name}
                {tenant.is_hub && (
                  <Badge bg="warning" className="ms-2">HUB</Badge>
                )}
                <small className="text-muted d-block">{tenant.site_code}</small>
                {selectedTenant?.id === tenant.id && (
                  <FontAwesomeIcon icon={faCheck} className="ms-2 text-success" />
                )}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </div>
  );
};

export default TenantSwitcher;
