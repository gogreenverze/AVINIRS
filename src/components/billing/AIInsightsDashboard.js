import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRobot, faChartLine, faArrowTrendUp, faArrowTrendDown,
  faExclamationTriangle, faLightbulb, faCalendarAlt,
  faRupeeSign, faUsers, faBuilding, faClock, faCheckCircle,
  faBrain, faChartPie, faArrowUp, faArrowDown
} from '@fortawesome/free-solid-svg-icons';
import { billingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import '../../styles/AIInsights.css';

const AIInsightsDashboard = ({ invoiceData = [] }) => {
  const { currentUser } = useAuth();
  const { currentTenantContext } = useTenant();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // AI Analysis Engine
  const generateAIInsights = (data) => {
    if (!data || data.length === 0) {
      return {
        summary: 'Insufficient data for analysis',
        trends: [],
        recommendations: [],
        predictions: [],
        alerts: []
      };
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Recent data (last 30 days)
    const recentData = data.filter(invoice => 
      new Date(invoice.invoice_date) >= thirtyDaysAgo
    );

    // Previous period data (30-60 days ago)
    const previousData = data.filter(invoice => {
      const date = new Date(invoice.invoice_date);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });

    // Calculate metrics
    const recentRevenue = recentData.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0);
    const previousRevenue = previousData.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0);
    const revenueGrowth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const recentInvoiceCount = recentData.length;
    const previousInvoiceCount = previousData.length;
    const invoiceGrowth = previousInvoiceCount > 0 ? ((recentInvoiceCount - previousInvoiceCount) / previousInvoiceCount) * 100 : 0;

    // Payment analysis
    const paidInvoices = recentData.filter(inv => inv.status === 'Paid');
    const pendingInvoices = recentData.filter(inv => inv.status === 'Pending');
    const partialInvoices = recentData.filter(inv => inv.status === 'Partial');
    
    const paymentRate = recentData.length > 0 ? (paidInvoices.length / recentData.length) * 100 : 0;
    const avgInvoiceValue = recentData.length > 0 ? recentRevenue / recentData.length : 0;

    // Overdue analysis
    const overdueInvoices = pendingInvoices.filter(inv => 
      new Date(inv.due_date) < now
    );

    // Day of week analysis
    const dayOfWeekStats = {};
    recentData.forEach(invoice => {
      const day = new Date(invoice.invoice_date).toLocaleDateString('en-US', { weekday: 'long' });
      dayOfWeekStats[day] = (dayOfWeekStats[day] || 0) + 1;
    });

    const bestDay = Object.entries(dayOfWeekStats).reduce((a, b) => 
      dayOfWeekStats[a[0]] > dayOfWeekStats[b[0]] ? a : b, ['Monday', 0]
    )[0];

    // Generate insights
    const trends = [
      {
        title: 'Revenue Trend',
        value: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`,
        description: `Revenue ${revenueGrowth >= 0 ? 'increased' : 'decreased'} compared to previous month`,
        icon: revenueGrowth >= 0 ? faArrowTrendUp : faArrowTrendDown,
        variant: revenueGrowth >= 0 ? 'success' : 'danger'
      },
      {
        title: 'Invoice Volume',
        value: `${invoiceGrowth >= 0 ? '+' : ''}${invoiceGrowth.toFixed(1)}%`,
        description: `${invoiceGrowth >= 0 ? 'More' : 'Fewer'} invoices generated this month`,
        icon: invoiceGrowth >= 0 ? faArrowUp : faArrowDown,
        variant: invoiceGrowth >= 0 ? 'success' : 'warning'
      },
      {
        title: 'Payment Rate',
        value: `${paymentRate.toFixed(1)}%`,
        description: 'Of recent invoices have been paid',
        icon: faCheckCircle,
        variant: paymentRate >= 80 ? 'success' : paymentRate >= 60 ? 'warning' : 'danger'
      },
      {
        title: 'Average Invoice Value',
        value: `₹${avgInvoiceValue.toFixed(0)}`,
        description: 'Average value per invoice this month',
        icon: faRupeeSign,
        variant: 'info'
      }
    ];

    const recommendations = [];
    
    // Generate smart recommendations
    if (paymentRate < 70) {
      recommendations.push({
        title: 'Improve Payment Collection',
        description: 'Payment rate is below optimal. Consider implementing automated reminders and follow-up processes.',
        priority: 'high',
        icon: faExclamationTriangle
      });
    }

    if (overdueInvoices.length > 0) {
      recommendations.push({
        title: 'Address Overdue Invoices',
        description: `${overdueInvoices.length} invoices are overdue. Prioritize collection efforts for these accounts.`,
        priority: 'high',
        icon: faClock
      });
    }

    if (revenueGrowth < -10) {
      recommendations.push({
        title: 'Revenue Recovery Strategy',
        description: 'Revenue has declined significantly. Consider reviewing pricing strategy and customer retention.',
        priority: 'high',
        icon: faChartLine
      });
    }

    if (partialInvoices.length > recentData.length * 0.2) {
      recommendations.push({
        title: 'Reduce Partial Payments',
        description: 'High number of partial payments detected. Consider payment plan options or stricter payment terms.',
        priority: 'medium',
        icon: faLightbulb
      });
    }

    recommendations.push({
      title: 'Optimize Invoice Timing',
      description: `${bestDay} shows highest invoice activity. Consider scheduling important invoices on this day.`,
      priority: 'low',
      icon: faCalendarAlt
    });

    const predictions = [
      {
        title: 'Next Month Revenue Forecast',
        value: `₹${(recentRevenue * (1 + revenueGrowth / 100)).toFixed(0)}`,
        confidence: Math.max(60, Math.min(95, 80 - Math.abs(revenueGrowth) * 2)),
        description: 'Based on current trends and historical data'
      },
      {
        title: 'Expected Collection Rate',
        value: `${Math.max(50, Math.min(100, paymentRate + (revenueGrowth > 0 ? 5 : -5))).toFixed(1)}%`,
        confidence: 75,
        description: 'Projected payment collection efficiency'
      }
    ];

    const alerts = [];
    
    if (overdueInvoices.length > 5) {
      alerts.push({
        type: 'danger',
        title: 'High Overdue Count',
        message: `${overdueInvoices.length} invoices are overdue and require immediate attention.`
      });
    }

    if (paymentRate < 50) {
      alerts.push({
        type: 'warning',
        title: 'Low Payment Rate',
        message: 'Payment collection rate is critically low. Review collection processes.'
      });
    }

    if (revenueGrowth > 50) {
      alerts.push({
        type: 'success',
        title: 'Exceptional Growth',
        message: 'Revenue growth is exceptional! Consider scaling operations to maintain momentum.'
      });
    }

    return {
      summary: `Analyzed ${data.length} invoices with ${recentData.length} from the last 30 days`,
      trends,
      recommendations,
      predictions,
      alerts,
      metrics: {
        totalInvoices: data.length,
        recentInvoices: recentData.length,
        recentRevenue,
        previousRevenue,
        paymentRate,
        overdueCount: overdueInvoices.length
      }
    };
  };

  // Load and analyze data
  useEffect(() => {
    const analyzeData = async () => {
      try {
        setLoading(true);
        setError(null);

        let dataToAnalyze = invoiceData;
        
        // If no data provided, fetch it
        if (!dataToAnalyze || dataToAnalyze.length === 0) {
          const response = await billingAPI.getAllBillings({ limit: 1000 });
          dataToAnalyze = response.data.items || [];
        }

        const aiInsights = generateAIInsights(dataToAnalyze);
        setInsights(aiInsights);
      } catch (err) {
        console.error('Error generating AI insights:', err);
        setError('Failed to generate insights. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    analyzeData();
  }, [invoiceData]);

  if (loading) {
    return (
      <Card className="shadow">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">
            <FontAwesomeIcon icon={faRobot} className="me-2" />
            AI-Powered Insights
          </h6>
        </Card.Header>
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 mb-0">Analyzing invoice data and generating insights...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">
            <FontAwesomeIcon icon={faRobot} className="me-2" />
            AI-Powered Insights
          </h6>
        </Card.Header>
        <Card.Body>
          <Alert variant="danger">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            {error}
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <div className="ai-insights-dashboard">
      {/* Header */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">
            <FontAwesomeIcon icon={faBrain} className="me-2" />
            AI-Powered Business Intelligence
          </h6>
        </Card.Header>
        <Card.Body>
          <p className="mb-0">
            <FontAwesomeIcon icon={faRobot} className="me-2 text-info" />
            {insights.summary}
          </p>
        </Card.Body>
      </Card>

      {/* Alerts */}
      {insights.alerts && insights.alerts.length > 0 && (
        <Row className="mb-4">
          <Col>
            {insights.alerts.map((alert, index) => (
              <Alert key={index} variant={alert.type} className="mb-2">
                <strong>{alert.title}:</strong> {alert.message}
              </Alert>
            ))}
          </Col>
        </Row>
      )}

      {/* Key Trends */}
      <Row className="mb-4">
        {insights.trends && insights.trends.map((trend, index) => (
          <Col xl={3} md={6} key={index} className="mb-4">
            <Card className={`border-left-${trend.variant} shadow h-100 py-2`}>
              <Card.Body>
                <Row className="no-gutters align-items-center">
                  <Col className="mr-2">
                    <div className={`text-xs font-weight-bold text-${trend.variant} text-uppercase mb-1`}>
                      {trend.title}
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                      {trend.value}
                    </div>
                    <div className="text-xs text-muted">
                      {trend.description}
                    </div>
                  </Col>
                  <Col className="col-auto">
                    <FontAwesomeIcon icon={trend.icon} className={`fa-2x text-${trend.variant}`} />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* AI Recommendations */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card className="shadow">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">
                <FontAwesomeIcon icon={faLightbulb} className="me-2" />
                AI Recommendations
              </h6>
            </Card.Header>
            <Card.Body>
              {insights.recommendations && insights.recommendations.length > 0 ? (
                insights.recommendations.map((rec, index) => (
                  <div key={index} className={`recommendation-item mb-3 p-3 border-left-${rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'info'} bg-light`}>
                    <div className="d-flex align-items-start">
                      <FontAwesomeIcon
                        icon={rec.icon}
                        className={`me-3 mt-1 text-${rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'info'}`}
                      />
                      <div>
                        <h6 className="mb-1 text-white">{rec.title}</h6>
                        <p className="mb-1 text-muted">{rec.description}</p>
                        <Badge bg={rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'info'}>
                          {rec.priority.toUpperCase()} PRIORITY
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted mb-0">No specific recommendations at this time. Your billing performance looks good!</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* AI Predictions */}
        <Col lg={4}>
          <Card className="shadow">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">
                <FontAwesomeIcon icon={faChartPie} className="me-2" />
                AI Predictions
              </h6>
            </Card.Header>
            <Card.Body>
              {insights.predictions && insights.predictions.map((pred, index) => (
                <div key={index} className="prediction-item mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">{pred.title}</h6>
                    <Badge bg="info">{pred.confidence}% confidence</Badge>
                  </div>
                  <div className="h5 text-primary mb-1">{pred.value}</div>
                  <ProgressBar
                    now={pred.confidence}
                    variant="info"
                    className="mb-2"
                    style={{ height: '6px' }}
                  />
                  <p className="text-muted small mb-0">{pred.description}</p>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Performance Metrics Summary */}
      <Row>
        <Col>
          <Card className="shadow">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">
                <FontAwesomeIcon icon={faChartLine} className="me-2" />
                Performance Summary
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="text-center">
                  <div className="metric-item">
                    <div className="h4 text-primary">{insights.metrics?.totalInvoices || 0}</div>
                    <div className="text-muted">Total Invoices</div>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <div className="metric-item">
                    <div className="h4 text-success">₹{(insights.metrics?.recentRevenue || 0).toFixed(0)}</div>
                    <div className="text-muted">Recent Revenue</div>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <div className="metric-item">
                    <div className="h4 text-info">{(insights.metrics?.paymentRate || 0).toFixed(1)}%</div>
                    <div className="text-muted">Payment Rate</div>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <div className="metric-item">
                    <div className="h4 text-warning">{insights.metrics?.overdueCount || 0}</div>
                    <div className="text-muted">Overdue Invoices</div>
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

export default AIInsightsDashboard;
