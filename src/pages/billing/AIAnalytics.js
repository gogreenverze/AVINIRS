import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Form, Badge, Alert, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBrain, faChartLine, faRobot, faLightbulb, faArrowLeft,
  faCalendarAlt, faDownload, faRefresh, faFilter, faCog,
  faChartPie, faChartBar, faArrowTrendUp, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { billingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import AIInsightsDashboard from '../../components/billing/AIInsightsDashboard';
import '../../styles/AIInsights.css';

const AIAnalytics = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentTenantContext } = useTenant();
  
  const [invoiceData, setInvoiceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [refreshing, setRefreshing] = useState(false);

  // Fetch comprehensive invoice data
  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit: 5000 // Get comprehensive data for analysis
      };

      if (dateRange.startDate) params.start_date = dateRange.startDate;
      if (dateRange.endDate) params.end_date = dateRange.endDate;

      const response = await billingAPI.getAllBillings(params);
      setInvoiceData(response.data.items || []);
    } catch (err) {
      console.error('Error fetching invoice data:', err);
      setError('Failed to load invoice data for analysis.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle data refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInvoiceData();
  };

  // Handle date range change
  const handleDateRangeChange = () => {
    fetchInvoiceData();
  };

  // Initial data load
  useEffect(() => {
    fetchInvoiceData();
  }, []);

  // Advanced analytics calculations
  const calculateAdvancedMetrics = () => {
    if (!invoiceData || invoiceData.length === 0) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Monthly breakdown
    const monthlyData = {};
    const customerAnalysis = {};
    const franchiseAnalysis = {};

    invoiceData.forEach(invoice => {
      const date = new Date(invoice.invoice_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          revenue: 0,
          count: 0,
          paid: 0,
          pending: 0,
          partial: 0
        };
      }

      const amount = parseFloat(invoice.total_amount) || 0;
      monthlyData[monthKey].revenue += amount;
      monthlyData[monthKey].count += 1;

      switch (invoice.status) {
        case 'Paid':
          monthlyData[monthKey].paid += 1;
          break;
        case 'Pending':
          monthlyData[monthKey].pending += 1;
          break;
        case 'Partial':
          monthlyData[monthKey].partial += 1;
          break;
      }

      // Customer analysis
      const patientId = invoice.patient_id;
      if (patientId) {
        if (!customerAnalysis[patientId]) {
          customerAnalysis[patientId] = {
            totalSpent: 0,
            invoiceCount: 0,
            lastInvoice: invoice.invoice_date
          };
        }
        customerAnalysis[patientId].totalSpent += amount;
        customerAnalysis[patientId].invoiceCount += 1;
        if (new Date(invoice.invoice_date) > new Date(customerAnalysis[patientId].lastInvoice)) {
          customerAnalysis[patientId].lastInvoice = invoice.invoice_date;
        }
      }

      // Franchise analysis
      const tenantId = invoice.tenant_id;
      if (tenantId) {
        if (!franchiseAnalysis[tenantId]) {
          franchiseAnalysis[tenantId] = {
            revenue: 0,
            count: 0,
            avgInvoiceValue: 0
          };
        }
        franchiseAnalysis[tenantId].revenue += amount;
        franchiseAnalysis[tenantId].count += 1;
        franchiseAnalysis[tenantId].avgInvoiceValue = franchiseAnalysis[tenantId].revenue / franchiseAnalysis[tenantId].count;
      }
    });

    // Top customers
    const topCustomers = Object.entries(customerAnalysis)
      .sort(([,a], [,b]) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Growth trends
    const monthKeys = Object.keys(monthlyData).sort();
    const growthTrends = monthKeys.map((month, index) => {
      if (index === 0) return { month, growth: 0 };
      const current = monthlyData[month].revenue;
      const previous = monthlyData[monthKeys[index - 1]].revenue;
      const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0;
      return { month, growth, revenue: current };
    });

    return {
      monthlyData,
      topCustomers,
      franchiseAnalysis,
      growthTrends,
      totalCustomers: Object.keys(customerAnalysis).length,
      avgCustomerValue: Object.values(customerAnalysis).reduce((sum, c) => sum + c.totalSpent, 0) / Object.keys(customerAnalysis).length
    };
  };

  const advancedMetrics = calculateAdvancedMetrics();

  if (loading && invoiceData.length === 0) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading AI analytics...</p>
      </div>
    );
  }

  return (
    <div className="ai-analytics">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-gray-800">
            <FontAwesomeIcon icon={faBrain} className="me-2" />
            AI-Powered Analytics
          </h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/billing">Billing Dashboard</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">AI Analytics</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-secondary" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FontAwesomeIcon icon={faRefresh} className={`me-2 ${refreshing ? 'fa-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate('/billing')}>
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          {error}
        </Alert>
      )}

      {/* Date Range Filter */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">
            <FontAwesomeIcon icon={faFilter} className="me-2" />
            Analysis Period
          </h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Button variant="primary" onClick={handleDateRangeChange}>
                <FontAwesomeIcon icon={faFilter} className="me-2" />
                Apply Filter
              </Button>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Button 
                variant="outline-secondary"
                onClick={() => {
                  setDateRange({ startDate: '', endDate: '' });
                  fetchInvoiceData();
                }}
              >
                Clear Filter
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Analytics Tabs */}
      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="overview" title={
          <span>
            <FontAwesomeIcon icon={faChartLine} className="me-2" />
            Overview
          </span>
        }>
          <AIInsightsDashboard invoiceData={invoiceData} />
        </Tab>

        <Tab eventKey="trends" title={
          <span>
            <FontAwesomeIcon icon={faChartLine} className="me-2" />
            Trends
          </span>
        }>
          <Row>
            <Col>
              <Card className="shadow">
                <Card.Header className="py-3">
                  <h6 className="m-0 font-weight-bold text-primary">
                    <FontAwesomeIcon icon={faChartBar} className="me-2" />
                    Growth Trends Analysis
                  </h6>
                </Card.Header>
                <Card.Body>
                  {advancedMetrics && advancedMetrics.growthTrends ? (
                    <div>
                      <p className="mb-3">Monthly revenue growth analysis:</p>
                      {advancedMetrics.growthTrends.slice(-6).map((trend, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                          <span>{trend.month}</span>
                          <div>
                            <Badge bg={trend.growth >= 0 ? 'success' : 'danger'} className="me-2">
                              {trend.growth >= 0 ? '+' : ''}{trend.growth.toFixed(1)}%
                            </Badge>
                            <span className="text-muted">₹{(trend.revenue || 0).toFixed(0)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">Insufficient data for trend analysis.</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="customers" title={
          <span>
            <FontAwesomeIcon icon={faChartPie} className="me-2" />
            Customer Insights
          </span>
        }>
          <Row>
            <Col>
              <Card className="shadow">
                <Card.Header className="py-3">
                  <h6 className="m-0 font-weight-bold text-primary">
                    Customer Analysis
                  </h6>
                </Card.Header>
                <Card.Body>
                  {advancedMetrics ? (
                    <div>
                      <Row className="mb-4">
                        <Col md={6}>
                          <div className="text-center">
                            <div className="h3 text-primary">{advancedMetrics.totalCustomers}</div>
                            <div className="text-muted">Total Customers</div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="text-center">
                            <div className="h3 text-success">₹{(advancedMetrics.avgCustomerValue || 0).toFixed(0)}</div>
                            <div className="text-muted">Avg Customer Value</div>
                          </div>
                        </Col>
                      </Row>
                      
                      <h6>Top Customers by Revenue:</h6>
                      {advancedMetrics.topCustomers.slice(0, 5).map(([customerId, data], index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                          <span>Customer #{customerId}</span>
                          <div>
                            <Badge bg="success" className="me-2">₹{data.totalSpent.toFixed(0)}</Badge>
                            <span className="text-muted">{data.invoiceCount} invoices</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No customer data available.</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </div>
  );
};

export default AIAnalytics;
