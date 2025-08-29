import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Form, InputGroup, Row, Col, Tabs, Tab, Alert, Badge, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faPlus, faVial, faExchangeAlt, faEnvelope, faArrowRight, 
  faCheck, faTimes, faEye, faClock, faShippingFast, faComments, faFileAlt,
  faBell, faFilter, faSync
} from '@fortawesome/free-solid-svg-icons';
import { routingAPI, notificationAPI } from '../../../services/api';
import { useTenant } from '../../../context/TenantContext';
import ResponsiveRoutingTable from '../../../components/routing/ResponsiveRoutingTable';
import RoutingCreateModal from '../../../components/routing/RoutingCreateModal';
import NotificationPanel from '../../../components/routing/NotificationPanel';
import '../../../styles/SampleRoutingSystem.css';

const SampleRoutingDashboard = () => {
  const navigate = useNavigate();
  const { tenantData, currentTenantContext } = useTenant();
  
  // State management
  const [routings, setRoutings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inTransit: 0,
    completed: 0,
    rejected: 0
  });

  // Fetch routings data
  const fetchRoutings = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      console.log('Starting fetchRoutings...');
      console.log('Current tenant data:', tenantData);

      const params = {
        page: 1,
        limit: 100,
        search: searchQuery,
        direction: activeTab === 'all' ? undefined : activeTab,
        status: statusFilter || undefined
      };

      console.log('API call params:', params);
      const response = await routingAPI.getRoutings(params);
      console.log('API response:', response);

      // Handle different response formats
      let routingsData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          routingsData = response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          routingsData = response.data.items;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          routingsData = response.data.data;
        }
      }

      // Debug logging
      console.log('Processed routings data:', routingsData);
      console.log('Current tenant data:', tenantData);
      if (routingsData.length > 0) {
        console.log('Sample routing structure:', routingsData[0]);
      }

      setRoutings(routingsData);
      
      // Calculate statistics
      const newStats = {
        total: routingsData.length,
        pending: Array.isArray(routingsData) ? routingsData.filter(r => r.status === 'pending_approval').length : 0,
        inTransit: Array.isArray(routingsData) ? routingsData.filter(r => r.status === 'in_transit').length : 0,
        completed: Array.isArray(routingsData) ? routingsData.filter(r => r.status === 'completed').length : 0,
        rejected: Array.isArray(routingsData) ? routingsData.filter(r => r.status === 'rejected').length : 0
      };
      setStats(newStats);

    } catch (err) {
      console.error('Error fetching routings:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(`Failed to load sample routings: ${err.response?.data?.message || err.message}`);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Fetch notifications count
  const fetchNotificationCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.unread_count || 0);
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchRoutings();
    fetchNotificationCount();
  }, []);

  // Refresh data when filters change
  useEffect(() => {
    fetchRoutings();
  }, [searchQuery, activeTab, statusFilter]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRoutings(false);
      fetchNotificationCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [searchQuery, activeTab, statusFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRoutings(false);
    await fetchNotificationCount();
    setRefreshing(false);
  };

  const handleCreateRouting = () => {
    setShowCreateModal(true);
  };

  const handleRoutingCreated = () => {
    setShowCreateModal(false);
    fetchRoutings(false);
  };



  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending_approval':
        return 'warning';
      case 'approved':
        return 'info';
      case 'in_transit':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'completed':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'cancelled':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusDisplayName = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending_approval':
        return 'Pending Approval';
      case 'approved':
        return 'Approved';
      case 'in_transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status || 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading sample routing dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 sample-routing-dashboard">
      {/* Page Header */}
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-4">
        <div className="mb-3 mb-sm-0">
          <h1 className="h3 mb-0 text-gray-800">
            <FontAwesomeIcon icon={faExchangeAlt} className="me-2" />
            Sample Routing System
          </h1>
          <p className="text-muted mb-0">
            Comprehensive sample transfer management with real-time tracking
          </p>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-sm-auto">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-100 w-sm-auto"
          >
            <FontAwesomeIcon icon={faSync} spin={refreshing} className="me-1" />
            Refresh
          </Button>
          <Button
            variant="outline-info"
            size="sm"
            onClick={() => setShowNotifications(true)}
            className="position-relative w-100 w-sm-auto"
          >
            <FontAwesomeIcon icon={faBell} className="me-1" />
            Notifications
            {unreadCount > 0 && (
              <Badge
                bg="danger"
                pill
                className="position-absolute top-50 end-50 translate-middle"
                style={{ fontSize: '0.6rem' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateRouting}
            className="w-100 w-sm-auto"
          >
            <FontAwesomeIcon icon={faPlus} className="me-1" />
            New Routing
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <FontAwesomeIcon icon={faTimes} className="me-2" />
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
                    Total Routings
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.total}
                  </div>
                </Col>
                <Col xs="auto">
                  <FontAwesomeIcon icon={faVial} className="fa-2x text-gray-300" />
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
                    Pending Approval
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.pending}
                  </div>
                </Col>
                <Col xs="auto">
                  <FontAwesomeIcon icon={faClock} className="fa-2x text-gray-300" />
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
                    In Transit
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.inTransit}
                  </div>
                </Col>
                <Col xs="auto">
                  <FontAwesomeIcon icon={faShippingFast} className="fa-2x text-gray-300" />
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
                    Completed
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.completed}
                  </div>
                </Col>
                <Col xs="auto">
                  <FontAwesomeIcon icon={faCheck} className="fa-2x text-gray-300" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Card className="shadow mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FontAwesomeIcon icon={faSearch} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by sample ID, tracking number, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </Form.Select>
            </Col>
            <Col md={3} className="text-end">
              <small className="text-muted">
                {Array.isArray(routings) ? routings.length : 0} routing{(Array.isArray(routings) ? routings.length : 0) !== 1 ? 's' : ''} found
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Routing Tabs and Table */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="all" title="All Routings">
          <ResponsiveRoutingTable
            routings={Array.isArray(routings) ? routings : []}
            type="all"
            title={`All Sample Routings (${Array.isArray(routings) ? routings.length : 0} total)`}
            loading={false}
            itemsPerPage={20}
            onRoutingUpdate={fetchRoutings}
          />
        </Tab>

        <Tab eventKey="incoming" title="Incoming Transfers">
          <ResponsiveRoutingTable
            routings={Array.isArray(routings) ? routings.filter(r =>
              (r.to_tenant?.id === tenantData?.id) || (r.to_tenant_id === tenantData?.id)
            ) : []}
            type="incoming"
            title="Incoming Transfers"
            loading={false}
            itemsPerPage={20}
            onRoutingUpdate={fetchRoutings}
          />
        </Tab>

        <Tab eventKey="outgoing" title="Outgoing Transfers">
          <ResponsiveRoutingTable
            routings={Array.isArray(routings) ? routings.filter(r => {
              const currentTenantId = tenantData?.id;
              const fromTenantId = r.from_tenant?.id || r.from_tenant_id;
              const isOutgoing = fromTenantId === currentTenantId;

              console.log('Outgoing filter debug:', {
                routingId: r.id,
                currentTenantId: currentTenantId,
                fromTenantId: fromTenantId,
                from_tenant_object: r.from_tenant,
                from_tenant_id_field: r.from_tenant_id,
                isOutgoing: isOutgoing,
                tenantDataFull: tenantData
              });

              return isOutgoing;
            }) : []}
            type="outgoing"
            title="Outgoing Transfers"
            loading={false}
            itemsPerPage={20}
            onRoutingUpdate={fetchRoutings}
          />
        </Tab>
      </Tabs>

      {/* Create Routing Modal */}
      <RoutingCreateModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onRoutingCreated={handleRoutingCreated}
      />

      {/* Notifications Panel */}
      <NotificationPanel
        show={showNotifications}
        onHide={() => setShowNotifications(false)}
        onNotificationUpdate={fetchNotificationCount}
      />
    </div>
  );
};

export default SampleRoutingDashboard;
