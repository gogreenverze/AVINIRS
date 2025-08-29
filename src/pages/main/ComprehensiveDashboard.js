import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, Badge, Nav, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt, faUsers, faFileAlt, faFileInvoice, faBoxes, faChartLine,
  faExclamationTriangle, faLightbulb, faHospital, faShieldAlt, faGlobe, faBuilding
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { dashboardAPI } from '../../services/api';
import realTimeService from '../../services/realTimeService';
import AIInsightsSection from '../../components/dashboard/AIInsightsSection';
import PatientManagementSection from '../../components/dashboard/PatientManagementSection';
import ReportsSection from '../../components/dashboard/ReportsSection';
import InvoiceManagementSection from '../../components/dashboard/InvoiceManagementSection';
import InventorySection from '../../components/dashboard/InventorySection';
import FinancialAccountsSection from '../../components/dashboard/FinancialAccountsSection';
import DashboardMetrics from '../../components/dashboard/DashboardMetrics';
import '../../styles/ComprehensiveDashboard.css';

const ComprehensiveDashboard = () => {
  const { currentUser } = useAuth();
  const { tenantData } = useTenant();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch comprehensive dashboard data
  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await dashboardAPI.getComprehensiveDashboard();
      setDashboardData(response.data);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      // setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time updates
    const unsubscribe = realTimeService.subscribe('dashboard', (data) => {
      setDashboardData(data);
      setRefreshing(false);
    }, 2 * 60 * 1000); // Update every 2 minutes

    // Set up periodic refresh indicator
    const refreshInterval = setInterval(() => {
      setRefreshing(true);
    }, 2 * 60 * 1000 - 5000); // Show refreshing 5 seconds before actual refresh

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
      realTimeService.cleanup();
    };
  }, []);

  // Get role-based access level display
  const getAccessLevelInfo = () => {
    switch (currentUser?.role) {
      case 'admin':
        return {
          level: 'System Administrator',
          description: 'Full access to all data across all franchises',
          icon: faGlobe,
          variant: 'danger'
        };
      case 'hub_admin':
        if (tenantData?.is_hub) {
          return {
            level: 'Hub Administrator',
            description: 'Access to all franchise data and hub operations',
            icon: faBuilding,
            variant: 'warning'
          };
        } else {
          return {
            level: 'Franchise Administrator',
            description: `Access limited to ${tenantData?.name || 'your franchise'} data only`,
            icon: faShieldAlt,
            variant: 'info'
          };
        }
      case 'franchise_admin':
        return {
          level: 'Franchise Administrator',
          description: `Access limited to ${tenantData?.name || 'your franchise'} data only`,
          icon: faShieldAlt,
          variant: 'info'
        };
      default:
        return {
          level: 'User',
          description: 'Limited access based on assigned permissions',
          icon: faUsers,
          variant: 'secondary'
        };
    }
  };

  const accessInfo = getAccessLevelInfo();

  if (loading) {
    return (
      <Container fluid className="dashboard-loading">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading comprehensive dashboard...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid>
        <Alert variant="danger" className="m-4">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="comprehensive-dashboard">
      {/* Header Section */}
      <div className="dashboard-header mb-4">
        <Row className="align-items-center">
          <Col lg={8} md={12} className="mb-3 mb-lg-0">
            <h1 className="h3 mb-2 text-white">
              <FontAwesomeIcon icon={faTachometerAlt} className="me-2" />
              Comprehensive Dashboard
            </h1>
            <div className="d-flex align-items-center flex-wrap">
              <FontAwesomeIcon icon={faHospital} className="me-2 text-white" />
              <span className="text-white me-3">{tenantData?.name}</span>
              {tenantData?.is_hub && (
                <Badge bg="light" text="light" className="me-3">Hub</Badge>
              )}
              {refreshing && (
                <div className="d-flex align-items-center text-white-50">
                  <Spinner size="sm" animation="border" className="me-2" />
                  <small>Refreshing...</small>
                </div>
              )}
            </div>
          </Col>
          <Col lg={4} md={12} className="text-lg-end text-center">
            <Card className="border-0 shadow-sm">
              <Card.Body className="py-2 px-3">
                <div className="d-flex align-items-center justify-content-center justify-content-lg-start">
                  <FontAwesomeIcon
                    icon={accessInfo.icon}
                    className={`me-2 text-white`}
                  />
                  <div className="text-start">
                    <div className="fw-bold text-white small">{accessInfo.level}</div>
                    <div className="text-white" style={{ fontSize: '0.75rem' }}>
                      {accessInfo.description}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Dashboard Metrics Overview */}
      {dashboardData?.data && (
        <DashboardMetrics 
          data={dashboardData.data.overview} 
          trends={dashboardData.data.trends}
          userRole={currentUser?.role}
        />
      )}

      {/* Main Dashboard Tabs */}
      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Card className="shadow-sm">
          <Card.Header className="bg-white border-bottom">
            <Nav variant="tabs" className="card-header-tabs flex-nowrap overflow-auto">
              <Nav.Item>
                <Nav.Link eventKey="overview" className="text-nowrap">
                  <FontAwesomeIcon icon={faTachometerAlt} className="me-1 d-none d-md-inline" />
                  <span className="d-none d-sm-inline">Overview</span>
                  <span className="d-sm-none">Home</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="ai-insights" className="text-nowrap">
                  <FontAwesomeIcon icon={faLightbulb} className="me-1 d-none d-md-inline" />
                  <span className="d-none d-sm-inline">AI Insights</span>
                  <span className="d-sm-none">AI</span>
                  {dashboardData?.data?.ai_insights?.length > 0 && (
                    <Badge bg="warning" className="ms-1" style={{ fontSize: '0.6rem' }}>
                      {dashboardData.data.ai_insights.length}
                    </Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="patients" className="text-nowrap">
                  <FontAwesomeIcon icon={faUsers} className="me-1 d-none d-md-inline" />
                  <span className="d-none d-sm-inline">Patients</span>
                  <span className="d-sm-none">Patients</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="reports" className="text-nowrap">
                  <FontAwesomeIcon icon={faFileAlt} className="me-1 d-none d-md-inline" />
                  <span className="d-none d-sm-inline">Reports</span>
                  <span className="d-sm-none">Reports</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="invoices" className="text-nowrap">
                  <FontAwesomeIcon icon={faFileInvoice} className="me-1 d-none d-md-inline" />
                  <span className="d-none d-sm-inline">Invoices</span>
                  <span className="d-sm-none">Bills</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="inventory" className="text-nowrap">
                  <FontAwesomeIcon icon={faBoxes} className="me-1 d-none d-md-inline" />
                  <span className="d-none d-sm-inline">Inventory</span>
                  <span className="d-sm-none">Stock</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="financial" className="text-nowrap">
                  <FontAwesomeIcon icon={faChartLine} className="me-1 d-none d-md-inline" />
                  <span className="d-none d-sm-inline">Financial</span>
                  <span className="d-sm-none">Finance</span>
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>

          <Card.Body className="p-0">
            <Tab.Content>
              <Tab.Pane eventKey="overview">
                <div className="p-4">
                  {/* Overview content will be added here */}
                  <h5>Dashboard Overview</h5>
                  <p>Comprehensive view of all system metrics and activities.</p>
                </div>
              </Tab.Pane>

              <Tab.Pane eventKey="ai-insights">
                <AIInsightsSection 
                  insights={dashboardData?.data?.ai_insights || []}
                  alerts={dashboardData?.data?.alerts || []}
                  onRefresh={fetchDashboardData}
                />
              </Tab.Pane>

              <Tab.Pane eventKey="patients">
                <PatientManagementSection 
                  data={dashboardData?.data}
                  userRole={currentUser?.role}
                />
              </Tab.Pane>

              <Tab.Pane eventKey="reports">
                <ReportsSection 
                  data={dashboardData?.data}
                  userRole={currentUser?.role}
                />
              </Tab.Pane>

              <Tab.Pane eventKey="invoices">
                <InvoiceManagementSection 
                  data={dashboardData?.data}
                  userRole={currentUser?.role}
                />
              </Tab.Pane>

              <Tab.Pane eventKey="inventory">
                <InventorySection 
                  data={dashboardData?.data}
                  userRole={currentUser?.role}
                />
              </Tab.Pane>

              <Tab.Pane eventKey="financial">
                <FinancialAccountsSection 
                  data={dashboardData?.data}
                  userRole={currentUser?.role}
                />
              </Tab.Pane>
            </Tab.Content>
          </Card.Body>
        </Card>
      </Tab.Container>
    </Container>
  );
};

export default ComprehensiveDashboard;
