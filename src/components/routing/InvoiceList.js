import React, { useState } from 'react';
import { Table, Badge, Button, ButtonGroup, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, faEdit, faTrash, faDownload, faEllipsisV,
  faFileInvoice, faPaperPlane, faCheckCircle, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { invoiceAPI } from '../../services/api';
import InvoiceViewModal from './InvoiceViewModal';

const InvoiceList = ({ invoices, routing, onInvoiceUpdated }) => {
  const { currentUser } = useAuth();
  const { currentTenantContext } = useTenant();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'secondary';
      case 'sent':
        return 'warning';
      case 'paid':
        return 'success';
      case 'overdue':
        return 'danger';
      case 'cancelled':
        return 'dark';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return faFileInvoice;
      case 'sent':
        return faPaperPlane;
      case 'paid':
        return faCheckCircle;
      case 'overdue':
        return faExclamationTriangle;
      case 'cancelled':
        return faTrash;
      default:
        return faFileInvoice;
    }
  };

  // Check permissions for different actions based on ownership transfer
  const canEditInvoice = (invoice) => {
    const userRole = currentUser?.role;
    const userTenantId = currentTenantContext?.id;

    // Admin and hub_admin can edit any invoice
    if (userRole === 'admin' || userRole === 'hub_admin') {
      return true;
    }

    // Check if routing is completed - no editing after completion
    if (routing?.status === 'completed') {
      return false;
    }

    // Check ownership transfer status
    if (invoice.ownership_transferred) {
      // After ownership transfer: only destination can edit
      return userTenantId === invoice.to_tenant_id && invoice.status !== 'paid';
    } else {
      // Before ownership transfer: only source can edit
      return userTenantId === invoice.from_tenant_id && invoice.status !== 'paid';
    }
  };

  const canDeleteInvoice = (invoice) => {
    const userRole = currentUser?.role;
    const userTenantId = currentTenantContext?.id;

    // Admin and hub_admin can delete any draft invoice
    if (userRole === 'admin' || userRole === 'hub_admin') {
      return invoice.status === 'draft';
    }

    // Check ownership transfer status
    if (invoice.ownership_transferred) {
      // After ownership transfer: only destination can delete draft invoices
      return userTenantId === invoice.to_tenant_id && invoice.status === 'draft';
    } else {
      // Before ownership transfer: only source can delete draft invoices
      return userTenantId === invoice.from_tenant_id && invoice.status === 'draft';
    }
  };

  const canChangeStatus = (invoice) => {
    const userRole = currentUser?.role;
    const userTenantId = currentTenantContext?.id;

    // Admin and hub_admin can change any status
    if (userRole === 'admin' || userRole === 'hub_admin') {
      return true;
    }

    // Check ownership transfer status
    if (invoice.ownership_transferred) {
      // After ownership transfer: destination can send/cancel, both can mark as paid
      if (userTenantId === invoice.to_tenant_id) {
        return true; // Can send/cancel
      }
      if (userTenantId === invoice.from_tenant_id) {
        return invoice.status === 'sent'; // Can only mark as paid
      }
    } else {
      // Before ownership transfer: source can send/cancel, both can mark as paid
      if (userTenantId === invoice.from_tenant_id) {
        return true; // Can send/cancel
      }
      if (userTenantId === invoice.to_tenant_id) {
        return invoice.status === 'sent'; // Can only mark as paid
      }
    }

    return false;
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handleStatusChange = async (invoice, newStatus) => {
    try {
      setActionLoading({ ...actionLoading, [`status_${invoice.id}`]: true });
      await invoiceAPI.updateInvoiceStatus(invoice.id, newStatus);
      onInvoiceUpdated();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      alert('Failed to update invoice status. Please try again.');
    } finally {
      setActionLoading({ ...actionLoading, [`status_${invoice.id}`]: false });
    }
  };

  const handleDeleteInvoice = async (invoice) => {
    if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading({ ...actionLoading, [`delete_${invoice.id}`]: true });
      await invoiceAPI.deleteInvoice(invoice.id);
      onInvoiceUpdated();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice. Please try again.');
    } finally {
      setActionLoading({ ...actionLoading, [`delete_${invoice.id}`]: false });
    }
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      setActionLoading({ ...actionLoading, [`download_${invoice.id}`]: true });
      const response = await invoiceAPI.generateInvoicePDF(invoice.id);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setActionLoading({ ...actionLoading, [`download_${invoice.id}`]: false });
    }
  };

  return (
    <>
      <div className="table-responsive">
        <Table hover>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>
                  <strong>{invoice.invoice_number}</strong>
                </td>
                <td>{formatDate(invoice.invoice_date)}</td>
                <td>{formatDate(invoice.due_date)}</td>
                <td>
                  <Badge bg={getStatusBadgeVariant(invoice.status)}>
                    <FontAwesomeIcon icon={getStatusIcon(invoice.status)} className="me-1" />
                    {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                  </Badge>
                </td>
                <td>
                  <strong>{formatCurrency(invoice.total_amount, invoice.currency)}</strong>
                </td>
                <td>
                  <ButtonGroup size="sm">
                    <Button
                      variant="outline-primary"
                      onClick={() => handleViewInvoice(invoice)}
                      title="View Invoice"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </Button>
                    
                    <Dropdown as={ButtonGroup}>
                      <Dropdown.Toggle 
                        variant="outline-secondary" 
                        size="sm"
                        disabled={actionLoading[`status_${invoice.id}`] || actionLoading[`delete_${invoice.id}`]}
                      >
                        <FontAwesomeIcon icon={faEllipsisV} />
                      </Dropdown.Toggle>
                      
                      <Dropdown.Menu>
                        {canChangeStatus(invoice) && invoice.status === 'draft' && (
                          <Dropdown.Item onClick={() => handleStatusChange(invoice, 'sent')}>
                            <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                            Send Invoice
                          </Dropdown.Item>
                        )}
                        
                        {canChangeStatus(invoice) && invoice.status === 'sent' && (
                          <Dropdown.Item onClick={() => handleStatusChange(invoice, 'paid')}>
                            <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                            Mark as Paid
                          </Dropdown.Item>
                        )}
                        
                        {canChangeStatus(invoice) && invoice.status !== 'cancelled' && (
                          <Dropdown.Item onClick={() => handleStatusChange(invoice, 'cancelled')}>
                            <FontAwesomeIcon icon={faTrash} className="me-2" />
                            Cancel Invoice
                          </Dropdown.Item>
                        )}
                        
                        <Dropdown.Divider />
                        
                        <Dropdown.Item onClick={() => handleDownloadPDF(invoice)}>
                          <FontAwesomeIcon icon={faDownload} className="me-2" />
                          Download PDF
                        </Dropdown.Item>
                        
                        {canDeleteInvoice(invoice) && (
                          <>
                            <Dropdown.Divider />
                            <Dropdown.Item 
                              onClick={() => handleDeleteInvoice(invoice)}
                              className="text-danger"
                            >
                              <FontAwesomeIcon icon={faTrash} className="me-2" />
                              Delete Invoice
                            </Dropdown.Item>
                          </>
                        )}
                      </Dropdown.Menu>
                    </Dropdown>
                  </ButtonGroup>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* View/Edit Invoice Modal */}
      <InvoiceViewModal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        invoice={selectedInvoice}
        routing={routing}
        onInvoiceUpdated={onInvoiceUpdated}
      />
    </>
  );
};

export default InvoiceList;
