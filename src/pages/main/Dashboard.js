import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Row, Col, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardList, faUserPlus, faClipboardCheck, 
  faExclamationTriangle, faHospital, faEye
} from '@fortawesome/free-solid-svg-icons';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import axios from 'axios';
import '../../styles/Dashboard.css';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { tenantData } = useTenant();
  const [dashboardData, setDashboardData] = useState({
    pendingOrders: 0,
    todayPatients: 0,
    pendingResults: 0,
    lowStockItems: 0,
    recentOrders: [],
    dailyTests: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        const response = await axios.get('/api/dashboard');
        setDashboardData(response.data);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Chart data
  const chartData = {
    labels: dashboardData.dailyTests.map(day => day.date),
    datasets: [
      {
        label: 'Tests',
        data: dashboardData.dailyTests.map(day => day.count),
        fill: true,
        backgroundColor: 'rgba(212, 0, 110, 0.05)',
        borderColor: 'rgba(212, 0, 110, 1)',
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: 'rgba(212, 0, 110, 1)',
        pointBorderColor: 'rgba(212, 0, 110, 1)',
        pointHoverRadius: 5,
        pointHoverBackgroundColor: 'rgba(212, 0, 110, 1)',
        pointHoverBorderColor: 'rgba(212, 0, 110, 1)',
        pointHitRadius: 10,
        pointBorderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(34, 34, 34, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(212, 0, 110, 0.8)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `Tests: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          precision: 0,
        },
      },
    },
  };

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Dashboard</h1>
        <div>
          <span className="mr-2">
            <FontAwesomeIcon icon={faHospital} className="me-2" />
            {tenantData?.name}
          </span>
          {tenantData?.is_hub && (
            <span className="badge bg-primary ms-2">Hub</span>
          )}
        </div>
      </div>

      {/* Dashboard Cards Row */}
      <Row>
        {/* Pending Orders Card */}
        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-primary shadow h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Pending Orders
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {dashboardData?.pendingOrders}
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faClipboardList} className="fa-2x text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Today's Patients Card */}
        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-success shadow h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Today's Patients
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {dashboardData?.todayPatients}
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faUserPlus} className="fa-2x text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Pending Results Card */}
        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-info shadow h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Pending Results
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {dashboardData?.pendingResults}
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faClipboardCheck} className="fa-2x text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Low Stock Items Card */}
        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-warning shadow h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Low Stock Items
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {dashboardData?.lowStockItems}
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="fa-2x text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Content Row */}
      <Row>
        {/* Test Statistics Chart */}
        <Col xl={8} lg={7}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 className="m-0 font-weight-bold text-primary">Test Statistics (Last 7 Days)</h6>
            </Card.Header>
            <Card.Body>
              <div className="chart-area">
                <Line data={chartData} options={chartOptions} height={300} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Orders */}
        <Col xl={4} lg={5}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Recent Orders</h6>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table className="table-sm" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Patient</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData?.recentOrders.map(order => (
                      <tr key={order.id}>
                        <td>{order.order_id}</td>
                        <td>{order?.patient?.first_name} {order.patient?.last_name}</td>
                        <td>
                          <span className={`badge bg-${
                            order.status === 'Completed' ? 'success' :
                            order.status === 'Pending' ? 'warning' :
                            'info'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <Link to={`/samples/${order.id}`} className="btn btn-sm btn-info">
                            <FontAwesomeIcon icon={faEye} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Franchise Overview (if hub) */}
      {tenantData?.is_hub && tenantData?.franchises && tenantData.franchises.length > 0 && (
        <Row>
          <Col xs={12}>
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Franchise Overview</h6>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table className="table-bordered" width="100%" cellSpacing="0">
                    <thead>
                      <tr>
                        <th>Site</th>
                        <th>Code</th>
                        <th>Location</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenantData?.franchises.map(franchise => (
                        <tr key={franchise.id}>
                          <td>{franchise.name}</td>
                          <td>{franchise.site_code}</td>
                          <td>{franchise.address}</td>
                          <td>
                            <Link to={`/admin/franchises/${franchise.id}`} className="btn btn-sm btn-primary">
                              <FontAwesomeIcon icon={faEye} className="me-1" /> View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Dashboard;
