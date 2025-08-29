import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Form, InputGroup, Badge, Alert, Dropdown, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileInvoiceDollar, faSearch, faFilter, faDownload, faPlus,
  faEye, faEdit, faMoneyBillWave, faPrint, faTrash, faCheck,
  faExclamationTriangle, faClock, faTimes, faChartLine,
  faCalendarAlt, faRupeeSign, faBuilding, faUser, faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { billingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import ResponsiveBillingTable from '../../components/billing/ResponsiveBillingTable';
import AIInsightsDashboard from '../../components/billing/AIInsightsDashboard';
import '../../styles/AIInsights.css';

const InvoiceManagement = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentTenantContext, accessibleTenants } = useTenant();
  
  // State management
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');

  // Dashboard stats
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    partial: 0,
    overdue: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0
  });

  // Available statuses
  const statuses = [
    { value: '', label: 'All Statuses', variant: 'secondary' },
    { value: 'Pending', label: 'Pending', variant: 'warning' },
    { value: 'Paid', label: 'Paid', variant: 'success' },
    { value: 'Partial', label: 'Partial', variant: 'info' },
    { value: 'Overdue', label: 'Overdue', variant: 'danger' },
    { value: 'Cancelled', label: 'Cancelled', variant: 'secondary' }
  ];

  // Check if user can access all franchises
  const canAccessAllFranchises = () => {
    return currentUser?.role === 'admin' || 
           (currentUser?.role === 'hub_admin' && currentTenantContext?.is_hub);
  };

  // Fetch invoices with filters
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit: 1000 // Get all for comprehensive management
      };

      if (searchQuery) params.q = searchQuery;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedTenant) params.tenant_id = selectedTenant;
      if (dateRange.startDate) params.start_date = dateRange.startDate;
      if (dateRange.endDate) params.end_date = dateRange.endDate;

      const response = await billingAPI.getAllBillings(params);
      const invoiceData = response.data.items || [];
      
      setInvoices(invoiceData);
      calculateStats(invoiceData);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate dashboard statistics
  const calculateStats = (invoiceData) => {
    const stats = {
      total: invoiceData.length,
      paid: 0,
      pending: 0,
      partial: 0,
      overdue: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0
    };

    const today = new Date();
    
    invoiceData.forEach(invoice => {
      const amount = parseFloat(invoice.total_amount || 0);
      const paidAmount = parseFloat(invoice.paid_amount || 0);
      const dueDate = new Date(invoice.due_date);
      
      stats.totalAmount += amount;
      stats.paidAmount += paidAmount;
      
      switch (invoice.status) {
        case 'Paid':
          stats.paid++;
          break;
        case 'Pending':
          stats.pending++;
          if (dueDate < today) {
            stats.overdue++;
          }
          stats.pendingAmount += amount;
          break;
        case 'Partial':
          stats.partial++;
          stats.pendingAmount += (amount - paidAmount);
          break;
        default:
          break;
      }
    });

    setStats(stats);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchInvoices();
  };

  // Handle filter changes
  useEffect(() => {
    fetchInvoices();
  }, [selectedStatus, selectedTenant, dateRange]);

  // Initial load
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedInvoices.length === 0) return;

    try {
      setLoading(true);
      // Implementation for bulk status update would go here
      // For now, just refresh the data
      await fetchInvoices();
      setSelectedInvoices([]);
      setShowStatusModal(false);
      setBulkStatus('');
    } catch (err) {
      console.error('Error updating invoice statuses:', err);
      setError('Failed to update invoice statuses.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading invoice management...</p>
      </div>
    );
  }

  return (
    <div className="invoice-management">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-gray-800">
            <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
            Invoice Management
          </h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/billing">Billing Dashboard</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Invoice Management</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => navigate('/billing')}>
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Dashboard
          </Button>
          {/* <Button variant="success" onClick={() => navigate('/billing/create')}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            New Invoice
          </Button> */}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-primary shadow h-100 py-2">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col className="mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Invoices
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.total}
                  </div>
                </Col>
                <Col className="col-auto">
                  <FontAwesomeIcon icon={faFileInvoiceDollar} className="fa-2x text-gray-300" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-success shadow h-100 py-2">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col className="mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Total Revenue
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {formatCurrency(stats.totalAmount)}
                  </div>
                </Col>
                <Col className="col-auto">
                  <FontAwesomeIcon icon={faRupeeSign} className="fa-2x text-gray-300" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-info shadow h-100 py-2">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col className="mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Paid Amount
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {formatCurrency(stats.paidAmount)}
                  </div>
                </Col>
                <Col className="col-auto">
                  <FontAwesomeIcon icon={faCheck} className="fa-2x text-gray-300" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-warning shadow h-100 py-2">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col className="mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Pending Amount
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {formatCurrency(stats.pendingAmount)}
                  </div>
                </Col>
                <Col className="col-auto">
                  <FontAwesomeIcon icon={faClock} className="fa-2x text-gray-300" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Advanced Filters */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">
            <FontAwesomeIcon icon={faFilter} className="me-2" />
            Advanced Filters & Search
          </h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Search</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Search by SID, invoice #, patient name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button variant="primary" type="submit">
                      <FontAwesomeIcon icon={faSearch} />
                    </Button>
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {canAccessAllFranchises() && (
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Franchise</Form.Label>
                    <Form.Select
                      value={selectedTenant}
                      onChange={(e) => setSelectedTenant(e.target.value)}
                    >
                      <option value="">All Franchises</option>
                      {accessibleTenants?.map(tenant => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}

              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </Form.Group>
              </Col>

              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedStatus('');
                      setSelectedTenant('');
                      setDateRange({ startDate: '', endDate: '' });
                    }}
                  >
                    Clear Filters
                  </Button>

                  {selectedInvoices.length > 0 && (
                    <Button
                      variant="warning"
                      onClick={() => setShowStatusModal(true)}
                    >
                      <FontAwesomeIcon icon={faEdit} className="me-2" />
                      Bulk Update ({selectedInvoices.length})
                    </Button>
                  )}

                  <Button variant="success" onClick={() => navigate('/billing/reports')}>
                    <FontAwesomeIcon icon={faChartLine} className="me-2" />
                    Analytics
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Status Summary */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Status Summary</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="text-center">
                  <div className="status-summary-item">
                    <Badge bg="success" className="status-badge-large">
                      {stats.paid}
                    </Badge>
                    <div className="mt-2">
                      <FontAwesomeIcon icon={faCheck} className="me-1" />
                      Paid
                    </div>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <div className="status-summary-item">
                    <Badge bg="warning" className="status-badge-large">
                      {stats.pending}
                    </Badge>
                    <div className="mt-2">
                      <FontAwesomeIcon icon={faClock} className="me-1" />
                      Pending
                    </div>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <div className="status-summary-item">
                    <Badge bg="info" className="status-badge-large">
                      {stats.partial}
                    </Badge>
                    <div className="mt-2">
                      <FontAwesomeIcon icon={faMoneyBillWave} className="me-1" />
                      Partial
                    </div>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <div className="status-summary-item">
                    <Badge bg="danger" className="status-badge-large">
                      {stats.overdue}
                    </Badge>
                    <div className="mt-2">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                      Overdue
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* AI-Powered Insights */}
      <AIInsightsDashboard invoiceData={invoices} />

      {/* Invoice Table */}
      <ResponsiveBillingTable
        billings={invoices}
        title="Invoice Management"
        loading={loading}
        itemsPerPage={20}
      />

      {/* Bulk Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Bulk Status Update</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Update status for {selectedInvoices.length} selected invoices:</p>
          <Form.Group>
            <Form.Label>New Status</Form.Label>
            <Form.Select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
            >
              <option value="">Select Status</option>
              {statuses.slice(1).map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleBulkStatusUpdate}
            disabled={!bulkStatus}
          >
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default InvoiceManagement;
