import React, { useState, useEffect } from 'react';
import { Table, Card, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faMoneyBillWave, 
  faPrint, 
  faFileInvoiceDollar,
  faRupeeSign,
  faEdit,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import BillingMobileCard from './BillingMobileCard';
import Pagination from '../common/Pagination';
import PropTypes from 'prop-types';
import axios from 'axios';
import { billingAPI } from '../../services/api';
import EditBillingModal from './EditBillingModal';

/**
 * Responsive billing table that switches between table and card view
 * based on screen size with pagination support
 */
const ResponsiveBillingTable = ({
  billings = [],
  title = 'Invoice List',
  loading = false,
  itemsPerPage = 20
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);
 
     const handleEdit = (billing) => {
    setSelectedBilling(billing);
    setShowEditModal(true);
  };

 const handleDelete = async (id) => {
  
  if (window.confirm('Are you sure you want to delete this billing record?')) {
    try {
    
     const res = await billingAPI.deleteBilling(id)
       if (res.data.success) {
        alert('Billing deleted.');
        // Optionally refetch the billing list or update state
       }
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  }
};


  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Reset to first page when billings change
  useEffect(() => {
    setCurrentPage(1);
  }, [billings]);

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'danger';
      case 'cancelled':
        return 'secondary';
      case 'partial':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  // Pagination calculations
  const totalItems = billings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBillings = billings.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of table on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <Card className="shadow mb-4">
        <Card.Body className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading invoices...</p>
        </Card.Body>
      </Card>
    );
  }

  if (totalItems === 0) {
    return (
      <Alert variant="info" className="text-center">
        <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
        No invoices found.
      </Alert>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="mobile-billing-container">
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              {title}
              <span className="badge bg-primary float-end">
                {totalItems} Records
              </span>
            </h6>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="mobile-data-container">
              {paginatedBillings.map(billing => (
                <BillingMobileCard
                  key={billing.id}
                  billing={billing}
                />
              ))}
            </div>
          </Card.Body>
        </Card>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          size="sm"
          className="mt-3"
        />
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="desktop-billing-container">
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">
            {title}
            <span className="badge bg-primary float-end">
              {totalItems} Records
            </span>
          </h6>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table className="table-hover" width="100%" cellSpacing="0">
              <thead>
                <tr>
                  <th>SID #</th>
                  <th>Invoice #</th>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBillings.map(billing => (
                  <tr key={billing.id}>
                    <td>
                      <Link
                        to={`/billing/${billing.id}`}
                        className="fw-bold text-decoration-none text-primary"
                        aria-label={`View invoice details for SID ${billing.sid_number}`}
                        title="Click to view invoice details"
                      >
                        <Badge bg="primary" className="sid-badge">
                          {billing.sid_number || 'N/A'}
                        </Badge>
                      </Link>
                    </td>
                    <td>
                      <Link
                        to={`/billing/${billing.id}`}
                        className="fw-bold text-decoration-none"
                        aria-label={`View invoice details for ${billing.invoice_number}`}
                      >
                        {billing.invoice_number}
                      </Link>
                    </td>
                    <td>
                      {billing.patient ? (
                        <Link 
                          to={`/patients/${billing.patient.id}`}
                          className="text-decoration-none"
                          aria-label={`View patient details for ${billing.patient.first_name} ${billing.patient.last_name}`}
                        >
                          {billing.patient.first_name} {billing.patient.last_name}
                        </Link>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      {billing.invoice_date
                        ? new Date(billing.invoice_date).toLocaleDateString()
                        : 'N/A'
                      }
                    </td>
                    <td>
                      <FontAwesomeIcon icon={faRupeeSign} className="me-1" />
                      {formatCurrency(billing.total_amount)}
                    </td>
                    <td>
                      <Badge bg={getStatusBadgeVariant(billing.payment_status)}>
                        {billing.payment_status || 'Unknown'}
                      </Badge>
                    </td>
                    <td>
                      <Link 
                        to={`/billing/${billing.id}`} 
                        className="btn btn-info btn-sm me-1"
                        aria-label={`View invoice details for ${billing.invoice_number}`}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </Link>
               <button
  type="button"
  className="btn btn-warning btn-sm me-2"
  onClick={() => handleEdit(billing)}
 
>
  <FontAwesomeIcon icon={faEdit} />
</button>

<button
  type="button"
  className="btn btn-danger btn-sm"
   onClick={() => handleDelete(billing.id)}
>
 
  <FontAwesomeIcon icon={faTrash} />
</button>

                      {/* {billing.status !== 'Paid' && billing.status !== 'Cancelled' && (
                        <Link 
                          to={`/billing/${billing.id}/collect`} 
                          className="btn btn-success btn-sm me-1"
                          aria-label={`Collect payment for invoice ${billing.invoice_number}`}
                        >
                          <FontAwesomeIcon icon={faMoneyBillWave} />
                        </Link>
                      )} */}
                      {/* <Link 
                        to={`/billing/${billing.id}/print`} 
                        className="btn btn-primary btn-sm"
                        aria-label={`Print invoice ${billing.invoice_number}`}
                      >
                        <FontAwesomeIcon icon={faPrint} />
                      </Link> */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        className="mt-3"
      />
     <EditBillingModal
  show={showEditModal}
  onHide={() => setShowEditModal(false)}
  billing={selectedBilling}
 
/>
    </div>
  );
};

ResponsiveBillingTable.propTypes = {
  billings: PropTypes.array.isRequired,
  title: PropTypes.string,
  loading: PropTypes.bool,
  itemsPerPage: PropTypes.number
};

export default ResponsiveBillingTable;
