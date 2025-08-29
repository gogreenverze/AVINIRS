import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faUserPlus, faVial, faClipboardCheck, faFileAlt,
  faDollarSign, faFileInvoice, faBoxes,
  faArrowTrendUp, faArrowTrendDown, faEquals
} from '@fortawesome/free-solid-svg-icons';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Link } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const DashboardMetrics = ({ data, trends, userRole }) => {
  // Format currency
  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount || 0);
    } catch (error) {
      // Fallback for browsers that don't support INR currency
      return `₹${(amount || 0).toLocaleString('en-IN')}`;
    }
  };

  // Get trend icon and color
  const getTrendIndicator = (growth) => {
    if (growth > 0) {
      return { icon: faArrowTrendUp, color: 'success', text: `+${growth}%` };
    } else if (growth < 0) {
      return { icon: faArrowTrendDown, color: 'danger', text: `${growth}%` };
    } else {
      return { icon: faEquals, color: 'secondary', text: '0%' };
    }
  };

  const revenueTrend = getTrendIndicator(trends?.revenue_growth || 0);

  // Chart data for daily trends
  const chartData = {
    labels: trends?.daily_trends?.map(day => {
      const date = new Date(day.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || [],
    datasets: [
      {
        label: 'Patients',
        data: trends?.daily_trends?.map(day => day.patients) || [],
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Revenue',
        data: trends?.daily_trends?.map(day => day.revenue) || [],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        
        tension: 0.3,
        fill: true,
        yAxisID: 'y1'
      }
    ]
  };

  const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        color: 'white', // legend text color
      },
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      bodyColor: 'white',       // tooltip text
      titleColor: 'white',      // tooltip title
      backgroundColor: '#333',  // optional: tooltip background
    },
  },
  scales: {
    x: {
      display: true,
      ticks: {
        color: 'white', // x-axis tick color
      },
      title: {
        display: true,
        text: 'Date',
        color: 'white', // x-axis title color
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.2)', // optional: x-axis grid line color
      },
    },
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      ticks: {
        color: 'white', // y-axis tick color
      },
      title: {
        display: true,
        text: 'Patients',
        color: 'white', // y-axis title color
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.2)', // optional: y-axis grid line color
      },
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      ticks: {
        color: 'white', // y1-axis tick color
      },
      title: {
        display: true,
        text: 'Revenue (₹)',
        color: 'white', // y1-axis title color
      },
      grid: {
        drawOnChartArea: false,
      },
    },
  },
};

  return (
    <div className="dashboard-metrics mb-4">
      {/* Key Metrics Cards */}
      <Row className="mb-4">
        {/* Patient Metrics */}
        <Col xl={3} md={6} className="mb-3">
          <Card className="border-left-primary shadow h-100">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Patients
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {data?.total_patients?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-white">
                    Today: {data?.today_patients || 0} | Month: {data?.monthly_patients || 0}
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faUsers} className="fa-2x text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Sample Metrics */}
        <Col xl={3} md={6} className="mb-3">
          <Card className="border-left-success shadow h-100">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Samples
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {data?.total_samples?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-white">
                    Pending: {data?.pending_samples || 0} | Completed: {data?.completed_samples || 0}
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faVial} className="fa-2x text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Results Metrics */}
        <Col xl={3} md={6} className="mb-3">
          <Card className="border-left-info shadow h-100">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Results
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {data?.total_results?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-white">
                    Pending: {data?.pending_results || 0} | Completed: {data?.completed_results || 0}
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faClipboardCheck} className="fa-2x text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Revenue Metrics */}
        <Col xl={3} md={6} className="mb-3">
          <Card className="border-left-warning shadow h-100">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Monthly Revenue
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {formatCurrency(data?.monthly_revenue)}
                  </div>
                  <div className="text-xs d-flex align-items-center">
                    <FontAwesomeIcon 
                      icon={revenueTrend.icon} 
                      className={`me-1 text-${revenueTrend.color}`} 
                    />
                    <span className={`text-${revenueTrend.color}`}>
                      {revenueTrend.text} vs last month
                    </span>
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faDollarSign} className="fa-2x text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Secondary Metrics */}
      <Row className="mb-4">
        {/* Invoice Metrics */}
        <Col xl={3} md={6} className="mb-3">
          <Card className="border-left-secondary shadow h-100">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-secondary text-uppercase mb-1">
                    Invoices
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {data?.total_invoices?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-white">
                    Pending: {data?.pending_invoices || 0} | Paid: {data?.paid_invoices || 0}
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faFileInvoice} className="fa-2x text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Inventory Metrics */}
        <Col xl={3} md={6} className="mb-3">
          <Card className="border-left-danger shadow h-100">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">
                    Inventory Items
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {data?.total_inventory_items?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-white">
                    Low Stock: {data?.low_stock_items || 0} | Out of Stock: {data?.out_of_stock_items || 0}
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faBoxes} className="fa-2x text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Financial Summary */}
        <Col xl={3} md={6} className="mb-3">
          <Card className="border-left-success shadow h-100">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Total Revenue
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {formatCurrency(data?.total_revenue)}
                  </div>
                  <div className="text-xs text-white">
                    Pending: {formatCurrency(data?.pending_payments)}
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faDollarSign} className="fa-2x text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col xl={3} md={6} className="mb-3">
          <Card className="border-left-info shadow h-100">
            <Card.Body className="text-center">
              <div className="text-xs font-weight-bold text-info text-uppercase mb-2">
                Quick Actions
              </div>
              <div className="d-grid gap-2">
                <Link to="/patients" className="btn btn-sm btn-outline-primary">
                  <FontAwesomeIcon icon={faUserPlus} className="me-1" />
                  Add Patient
                </Link>
               
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Trends Chart */}
      {trends?.daily_trends && trends.daily_trends.length > 0 && (
        <Row>
          <Col xs={12}>
            <Card className="shadow">
              <Card.Header>
                <h6 className="m-0 font-weight-bold text-primary">
                  7-Day Trends: Patients & Revenue
                </h6>
              </Card.Header>
              <Card.Body>
                <div style={{ height: '300px',color:"white" }}>
                  <Line data={chartData} options={chartOptions} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default DashboardMetrics;
