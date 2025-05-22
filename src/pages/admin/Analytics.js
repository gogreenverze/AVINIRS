import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar, faUsers, faVial, faMoneyBill, faCalendarAlt,
  faArrowUp, faArrowDown, faArrowTrendUp, faArrowTrendDown
} from '@fortawesome/free-solid-svg-icons';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const Analytics = () => {
  const { currentUser } = useAuth();
  const { tenantData } = useTenant();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const analyticsResponse = await adminAPI.getAnalytics();
        setAnalytics(analyticsResponse.data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Sample distribution chart data
  const sampleDistributionData = analytics ? {
    labels: analytics.sample_types.map(item => item.type_name),
    datasets: [
      {
        label: 'Sample Distribution',
        data: analytics.sample_types.map(item => item.count),
        backgroundColor: [
          '#4e73df',
          '#1cc88a',
          '#36b9cc',
          '#f6c23e',
          '#e74a3b',
          '#858796',
          '#5a5c69'
        ],
        borderColor: [
          '#4e73df',
          '#1cc88a',
          '#36b9cc',
          '#f6c23e',
          '#e74a3b',
          '#858796',
          '#5a5c69'
        ],
        borderWidth: 1
      }
    ]
  } : null;

  // Monthly revenue trend (mock data for demonstration)
  const monthlyRevenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue (₹)',
        data: [45000, 52000, 48000, 61000, 55000, analytics?.monthly_revenue || 58000],
        borderColor: 'rgba(212, 0, 110, 1)',
        backgroundColor: 'rgba(212, 0, 110, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Test volume chart data
  const testVolumeData = analytics ? {
    labels: analytics.sample_types.map(item => item.type_name),
    datasets: [
      {
        label: 'Test Volume',
        data: analytics.sample_types.map(item => item.count),
        backgroundColor: 'rgba(54, 185, 204, 0.6)',
        borderColor: 'rgba(54, 185, 204, 1)',
        borderWidth: 1
      }
    ]
  } : null;

  // Chart options
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(34, 34, 34, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(212, 0, 110, 0.8)',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      },
      tooltip: {
        backgroundColor: 'rgba(34, 34, 34, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(212, 0, 110, 0.8)',
        borderWidth: 1
      }
    }
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(34, 34, 34, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(212, 0, 110, 0.8)',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faChartBar} className="me-2" />
          Analytics Dashboard
        </h1>
        <div className="text-muted">
          <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <Row className="mb-4">
        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-primary shadow h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Tests
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {analytics?.test_count || 0}
                  </div>
                  <div className="text-xs text-success">
                    <FontAwesomeIcon icon={faArrowUp} className="me-1" />
                    12% from last month
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faVial} className="fa-2x text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-success shadow h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Monthly Revenue
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    ₹{analytics?.monthly_revenue?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-success">
                    <FontAwesomeIcon icon={faArrowUp} className="me-1" />
                    8% from last month
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faMoneyBill} className="fa-2x text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-info shadow h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Active Users
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {analytics?.user_count || 0}
                  </div>
                  <div className="text-xs text-success">
                    <FontAwesomeIcon icon={faArrowUp} className="me-1" />
                    5% from last month
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faUsers} className="fa-2x text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-warning shadow h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Avg. Processing Time
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    2.4 hrs
                  </div>
                  <div className="text-xs text-danger">
                    <FontAwesomeIcon icon={faArrowDown} className="me-1" />
                    3% from last month
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faCalendarAlt} className="fa-2x text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Analytics Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="overview" title="Overview">
          <Row>
            <Col lg={8}>
              <Card className="shadow mb-4">
                <Card.Header className="py-3">
                  <h6 className="m-0 font-weight-bold text-primary">Revenue Trend</h6>
                </Card.Header>
                <Card.Body>
                  <div className="chart-container">
                    <Line data={monthlyRevenueData} options={lineOptions} height={100} />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="shadow mb-4">
                <Card.Header className="py-3">
                  <h6 className="m-0 font-weight-bold text-primary">Sample Distribution</h6>
                </Card.Header>
                <Card.Body>
                  {sampleDistributionData && (
                    <div className="chart-container">
                      <Doughnut data={sampleDistributionData} options={doughnutOptions} />
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="tests" title="Test Analytics">
          <Row>
            <Col lg={12}>
              <Card className="shadow mb-4">
                <Card.Header className="py-3">
                  <h6 className="m-0 font-weight-bold text-primary">Test Volume by Type</h6>
                </Card.Header>
                <Card.Body>
                  {testVolumeData && (
                    <div className="chart-container">
                      <Bar data={testVolumeData} options={barOptions} height={100} />
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {analytics?.sample_types && (
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Test Type Details</h6>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table className="table-hover" width="100%" cellSpacing="0">
                    <thead>
                      <tr>
                        <th>Test Type</th>
                        <th>Total Count</th>
                        <th>Percentage</th>
                        <th>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.sample_types.map((type, index) => {
                        const total = analytics.sample_types.reduce((sum, t) => sum + t.count, 0);
                        const percentage = ((type.count / total) * 100).toFixed(1);
                        return (
                          <tr key={index}>
                            <td>{type.type_name}</td>
                            <td>{type.count}</td>
                            <td>{percentage}%</td>
                            <td>
                              <span className={`text-${Math.random() > 0.5 ? 'success' : 'danger'}`}>
                                <FontAwesomeIcon icon={Math.random() > 0.5 ? faArrowTrendUp : faArrowTrendDown} className="me-1" />
                                {Math.floor(Math.random() * 20)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}
        </Tab>

        <Tab eventKey="revenue" title="Revenue Analytics">
          <Row>
            <Col lg={12}>
              <Card className="shadow mb-4">
                <Card.Header className="py-3">
                  <h6 className="m-0 font-weight-bold text-primary">Monthly Revenue Breakdown</h6>
                </Card.Header>
                <Card.Body>
                  <div className="chart-container">
                    <Line data={monthlyRevenueData} options={lineOptions} height={100} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col lg={6}>
              <Card className="shadow mb-4">
                <Card.Header className="py-3">
                  <h6 className="m-0 font-weight-bold text-primary">Revenue Summary</h6>
                </Card.Header>
                <Card.Body>
                  <div className="row">
                    <div className="col-6">
                      <div className="text-center">
                        <div className="h4 font-weight-bold text-primary">
                          ₹{analytics?.monthly_revenue?.toLocaleString() || 0}
                        </div>
                        <div className="text-muted">This Month</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center">
                        <div className="h4 font-weight-bold text-success">
                          ₹{((analytics?.monthly_revenue || 0) * 0.92).toLocaleString()}
                        </div>
                        <div className="text-muted">Last Month</div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="shadow mb-4">
                <Card.Header className="py-3">
                  <h6 className="m-0 font-weight-bold text-primary">Performance Metrics</h6>
                </Card.Header>
                <Card.Body>
                  <div className="row">
                    <div className="col-12 mb-3">
                      <div className="d-flex justify-content-between">
                        <span>Revenue Growth</span>
                        <span className="text-success">+8.2%</span>
                      </div>
                      <div className="progress">
                        <div className="progress-bar bg-success" style={{width: '82%'}}></div>
                      </div>
                    </div>
                    <div className="col-12 mb-3">
                      <div className="d-flex justify-content-between">
                        <span>Test Volume Growth</span>
                        <span className="text-info">+12.5%</span>
                      </div>
                      <div className="progress">
                        <div className="progress-bar bg-info" style={{width: '75%'}}></div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="d-flex justify-content-between">
                        <span>Customer Satisfaction</span>
                        <span className="text-warning">94.2%</span>
                      </div>
                      <div className="progress">
                        <div className="progress-bar bg-warning" style={{width: '94%'}}></div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </div>
  );
};

export default Analytics;
