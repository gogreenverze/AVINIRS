import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faExclamationTriangle, faFileInvoice } from '@fortawesome/free-solid-svg-icons';
import { invoiceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import InvoiceList from './InvoiceList';
import InvoiceCreateModal from './InvoiceCreateModal';

const InvoiceTab = ({ routingId, routing }) => {
  const { currentUser } = useAuth();
  const { currentTenantContext } = useTenant();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [routingId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await invoiceAPI.getInvoices(routingId);
      setInvoices(response.data);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = () => {
    setShowCreateModal(true);
  };

  const handleInvoiceCreated = () => {
    setShowCreateModal(false);
    fetchInvoices();
  };

  const handleInvoiceUpdated = () => {
    fetchInvoices();
  };

  // Check if current user can create invoices based on ownership transfer
  const canCreateInvoice = () => {
    const userRole = currentUser?.role;
    const userTenantId = currentTenantContext?.id;

    // Admin and hub_admin can always create invoices
    if (userRole === 'admin' || userRole === 'hub_admin') {
      return true;
    }

    // Check if any invoices exist and their ownership status
    if (invoices.length > 0) {
      const ownershipTransferred = invoices.some(inv => inv.ownership_transferred);
      if (ownershipTransferred) {
        // After ownership transfer: only destination can create new invoices
        return userTenantId === routing?.to_tenant_id;
      } else {
        // Before ownership transfer: only source can create invoices
        return userTenantId === routing?.from_tenant_id;
      }
    } else {
      // No existing invoices: source franchise can create
      return userTenantId === routing?.from_tenant_id;
    }
  };

  if (loading) {
    return (
      <Card className="shadow">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading invoices...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow">
        <Card.Body>
          <Alert variant="danger">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            {error}
            <div className="mt-2">
              <Button variant="outline-danger" size="sm" onClick={fetchInvoices}>
                Try Again
              </Button>
            </div>
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h6 className="m-0 font-weight-bold text-primary">
            <FontAwesomeIcon icon={faFileInvoice} className="me-2" />
            Invoices for Routing {routing?.tracking_number}
          </h6>
          {canCreateInvoice() && (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleCreateInvoice}
            >
              <FontAwesomeIcon icon={faPlus} className="me-1" />
              Create Invoice
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          {invoices.length === 0 ? (
            <div className="text-center py-4">
              <FontAwesomeIcon 
                icon={faFileInvoice} 
                size="3x" 
                className="text-muted mb-3" 
              />
              <h5 className="text-muted">No Invoices Found</h5>
              <p className="text-muted">
                {canCreateInvoice() 
                  ? 'Create your first invoice for this routing.'
                  : 'No invoices have been created for this routing yet.'
                }
              </p>
              {canCreateInvoice() && (
                <Button 
                  variant="outline-primary" 
                  onClick={handleCreateInvoice}
                >
                  <FontAwesomeIcon icon={faPlus} className="me-1" />
                  Create First Invoice
                </Button>
              )}
            </div>
          ) : (
            <InvoiceList 
              invoices={invoices}
              routing={routing}
              onInvoiceUpdated={handleInvoiceUpdated}
            />
          )}
        </Card.Body>
      </Card>

      {/* Create Invoice Modal */}
      <InvoiceCreateModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        routingId={routingId}
        routing={routing}
        onInvoiceCreated={handleInvoiceCreated}
      />
    </>
  );
};

export default InvoiceTab;
