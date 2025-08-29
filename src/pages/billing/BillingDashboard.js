import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Table, Badge, Form, InputGroup, Dropdown, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faSearch, faFileInvoiceDollar, faMoneyBillWave,
  faChartLine, faUsers, faRupeeSign, faCalendarAlt,
  faEye, faPrint, faEdit, faFilter, faDownload,
  faCheckCircle, faExclamationTriangle, faClock, faTimes,
  faTimesCircle, faUndo, faBan, faHandHoldingUsd, faShieldAlt,
  faBuilding, faGlobe, faBrain
} from '@fortawesome/free-solid-svg-icons';
import { billingAPI } from '../../services/api';
import ResponsiveBillingTable from '../../components/billing/ResponsiveBillingTable';
import AIInsightsDashboard from '../../components/billing/AIInsightsDashboard';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import '../../styles/BillingDashboard.css';

const BillingDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentTenantContext } = useTenant();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  
  // Dashboard data
  const [dashboardStats, setDashboardStats] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    todayInvoices: 0,
    todayAmount: 0
  });
  
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [quickStats, setQuickStats] = useState({
    pending: 0,
    paid: 0,
    partial: 0,
    cancelled: 0
  });

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch recent invoices
        const invoicesResponse = await billingAPI.getAllBillings({ limit: 10 });
        console.log('Recent Invoicesssssssssss:', invoicesResponse.data.items);
        setRecentInvoices(invoicesResponse.data.items || []);
        
        // Calculate dashboard statistics
        const allInvoicesResponse = await billingAPI.getAllBillings({ limit: 1000 });
        const allInvoices = allInvoicesResponse.data.items || [];
        
        calculateDashboardStats(allInvoices);
        calculateQuickStats(allInvoices);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        // setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate dashboard statistics
  const calculateDashboardStats = (invoices) => {
    const today = new Date().toISOString().split('T')[0];
    
    const stats = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
      paidAmount: invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0),
      pendingAmount: invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0),
      todayInvoices: invoices.filter(inv => inv.invoice_date === today).length,
      todayAmount: invoices.filter(inv => inv.invoice_date === today)
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    };
    
    setDashboardStats(stats);
  };

  // Calculate quick statistics
  const calculateQuickStats = (invoices) => {
    const stats = {
      pending: invoices.filter(inv => inv.status === 'Pending').length,
      paid: invoices.filter(inv => inv.status === 'Paid').length,
      partial: invoices.filter(inv => inv.status === 'Partial').length,
      cancelled: invoices.filter(inv => inv.status === 'Cancelled').length
    };
    
    setQuickStats(stats);
  };

  // Get access level information
  const getAccessLevelInfo = () => {
    if (!currentUser) return { level: 'Unknown', description: 'Access level unknown', icon: faShieldAlt, variant: 'secondary' };

    switch (currentUser.role) {
      case 'admin':
        return {
          level: 'System Administrator',
          description: 'Full access to all invoices across all franchises',
          icon: faGlobe,
          variant: 'danger'
        };
      case 'hub_admin':
        if (currentTenantContext?.is_hub) {
          return {
            level: 'Hub Administrator',
            description: 'Access to all franchise invoices and hub data',
            icon: faBuilding,
            variant: 'warning'
          };
        } else {
          return {
            level: 'Franchise Administrator',
            description: `Access limited to ${currentTenantContext?.name || 'your franchise'} invoices only`,
            icon: faShieldAlt,
            variant: 'info'
          };
        }
      case 'franchise_admin':
        return {
          level: 'Franchise Administrator',
          description: `Access limited to ${currentTenantContext?.name || 'your franchise'} invoices only`,
          icon: faShieldAlt,
          variant: 'info'
        };
      default:
        return {
          level: 'User',
          description: `Access limited to ${currentTenantContext?.name || 'your franchise'} invoices only`,
          icon: faShieldAlt,
          variant: 'success'
        };
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/billing/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Paid': return 'success';
      case 'Partial': return 'info';
      case 'Cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading billing dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  const accessInfo = getAccessLevelInfo();

  return (
    <div className="billing-dashboard">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-gray-800">
            <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
            Billing Dashboard
          </h1>
          <p className="text-muted mb-0">Manage invoices and payments</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={() => navigate('/billing/management')}>
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Manage Invoices
          </Button>
          <Button variant="outline-primary" onClick={() => navigate('/billing/analytics')}>
            <FontAwesomeIcon icon={faBrain} className="me-2" />
            AI Analytics
          </Button>
          <Button variant="outline-primary" onClick={() => navigate('/billing/reports')}>
            <FontAwesomeIcon icon={faChartLine} className="me-2" />
            Reports
          </Button>
          <Button variant="success" onClick={() => navigate('/billing/registration')} className="me-2">
            <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
            Registration/Billing
          </Button>
          {/* <Button variant="primary" onClick={() => navigate('/billing/create')}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            New Invoice
          </Button> */}
        </div>
      </div>

      {/* Access Level Indicator */}
      <Alert variant={accessInfo.variant} className="mb-4">
        <div className="d-flex align-items-center">
          <FontAwesomeIcon icon={accessInfo.icon} className="me-2" />
          <div>
            <strong>{accessInfo.level}</strong>
            <div className="small">{accessInfo.description}</div>
          </div>
        </div>
      </Alert>

      {/* Quick Stats Cards */}
      <Row className="mb-4">
        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-primary shadow h-100 py-2">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col className="mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Revenue
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {formatCurrency(dashboardStats.totalAmount)}
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
          <Card className="border-left-success shadow h-100 py-2">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col className="mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Paid Amount
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {formatCurrency(dashboardStats.paidAmount)}
                  </div>
                </Col>
                <Col className="col-auto">
                  <FontAwesomeIcon icon={faCheckCircle} className="fa-2x text-gray-300" />
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
                    {formatCurrency(dashboardStats.pendingAmount)}
                  </div>
                </Col>
                <Col className="col-auto">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="fa-2x text-gray-300" />
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
                    Today's Invoices
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {dashboardStats.todayInvoices}
                  </div>
                </Col>
                <Col className="col-auto">
                  <FontAwesomeIcon icon={faCalendarAlt} className="fa-2x text-gray-300" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions & Search */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card className="shadow">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Quick Search</h6>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSearch}>
                <Row>
                  <Col md={6}>
                    <InputGroup className="mb-3">
                      <Form.Control
                        type="text"
                        placeholder="Search by SID #, invoice #, patient name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Button variant="primary" type="submit">
                        <FontAwesomeIcon icon={faSearch} />
                      </Button>
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Partial">Partial</option>
                      <option value="Cancelled">Cancelled</option>
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Button
                      variant="outline-primary"
                      className="w-100"
                      onClick={() => navigate('/billing/list')}
                    >
                      <FontAwesomeIcon icon={faFilter} className="me-2" />
                      Advanced Search
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Invoice Status</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-warning">
                  <FontAwesomeIcon icon={faClock} className="me-2" />
                  Pending
                </span>
                <Badge bg="warning">{quickStats.pending}</Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-success">
                  <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                  Paid
                </span>
                <Badge bg="success">{quickStats.paid}</Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-info">
                  <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                  Partial
                </span>
                <Badge bg="info">{quickStats.partial}</Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-danger">
                  <FontAwesomeIcon icon={faTimes} className="me-2" />
                  Cancelled
                </span>
                <Badge bg="danger">{quickStats.cancelled}</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* AI-Powered Insights */}
      <AIInsightsDashboard invoiceData={recentInvoices} />

      {/* Recent Invoices */}
      <ResponsiveBillingTable
        billings={recentInvoices}
        title="Recent Invoices"
        loading={loading}
        itemsPerPage={10}
      />

      {/* Quick Actions */}
      <Row>
        <Col lg={12}>
          <Card className="shadow">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Quick Actions</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="mb-3">
                  <div className="d-grid">
                    <Button
                      variant="success"
                      size="lg"
                      onClick={() => navigate('/billing/registration')}
                    >
                      <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
                      Registration/Billing
                    </Button>
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="d-grid">
                    {/* <Button
                      variant="primary"
                      size="lg"
                      onClick={() => navigate('/billing/create')}
                    >
                      <FontAwesomeIcon icon={faPlus} className="me-2" />
                      New Invoice
                    </Button> */}
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="d-grid">
                    <Button
                      variant="success"
                      size="lg"
                      onClick={() => navigate('/billing/list?status=Pending')}
                    >
                      <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                      Collect Payments
                    </Button>
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="d-grid">
                    <Button
                      variant="info"
                      size="lg"
                      onClick={() => navigate('/billing/reports')}
                    >
                      <FontAwesomeIcon icon={faChartLine} className="me-2" />
                      View Reports
                    </Button>
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="d-grid">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => navigate('/billing/management')}
                    >
                      <FontAwesomeIcon icon={faEdit} className="me-2" />
                      Manage Invoices
                    </Button>
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="d-grid">
                    <Button
                      variant="warning"
                      size="lg"
                      onClick={() => navigate('/billing/due-close')}
                    >
                      <FontAwesomeIcon icon={faTimesCircle} className="me-2" />
                      Due Close
                    </Button>
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="d-grid">
                    <Button
                      variant="danger"
                      size="lg"
                      onClick={() => navigate('/billing/refund')}
                    >
                      <FontAwesomeIcon icon={faUndo} className="me-2" />
                      Refund
                    </Button>
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="d-grid">
                    <Button
                      variant="dark"
                      size="lg"
                      onClick={() => navigate('/billing/cancel')}
                    >
                      <FontAwesomeIcon icon={faBan} className="me-2" />
                      Bill Cancel
                    </Button>
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="d-grid">
                    <Button
                      variant="success"
                      size="lg"
                      onClick={() => navigate('/billing/collection')}
                    >
                      <FontAwesomeIcon icon={faHandHoldingUsd} className="me-2" />
                      Collection
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BillingDashboard;
