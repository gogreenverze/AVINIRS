import React from 'react';
import { Row, Col, Card, Table, Button, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine, faDollarSign, faArrowUp, faArrowDown, faEquals,
  faCalendarAlt, faDownload, faEye, faPlus, faArrowTrendUp, faArrowTrendDown
} from '@fortawesome/free-solid-svg-icons';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const FinancialAccountsSection = ({ data, userRole }) => {
  // const [timeframe, setTimeframe] = useState('month'); // Future use

  // Mock financial data - replace with actual API call
  const financialData = {
    revenue: {
      total: 125000,
      monthly: 45000,
      growth: 12.5
    },
    expenses: {
      total: 85000,
      monthly: 28000,
      growth: -5.2
    },
    profit: {
      total: 40000,
      monthly: 17000,
      margin: 32.0
    },
    accounts: [
      {
        id: 1,
        name: 'Cash Account',
        type: 'asset',
        balance: 25000,
        last_transaction: '2024-01-15'
      },
      {
        id: 2,
        name: 'Accounts Receivable',
        type: 'asset',
        balance: 18500,
        last_transaction: '2024-01-14'
      },
      {
        id: 3,
        name: 'Equipment',
        type: 'asset',
        balance: 150000,
        last_transaction: '2024-01-10'
      },
      {
        id: 4,
        name: 'Accounts Payable',
        type: 'liability',
        balance: 12000,
        last_transaction: '2024-01-13'
      }
    ]
  };

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

  const getTrendIcon = (growth) => {
    if (growth > 0) return { icon: faArrowTrendUp, color: 'success' };
    if (growth < 0) return { icon: faArrowTrendDown, color: 'danger' };
    return { icon: faEquals, color: 'secondary' };
  };

  // Revenue vs Expenses Chart
  const revenueExpenseData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [35000, 42000, 38000, 45000, 48000, 45000],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Expenses',
        data: [25000, 28000, 26000, 30000, 32000, 28000],
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  // Expense Breakdown Chart
  const expenseBreakdownData = {
    labels: ['Salaries', 'Equipment', 'Supplies', 'Utilities', 'Marketing', 'Other'],
    datasets: [
      {
        data: [15000, 5000, 3000, 2000, 1500, 1500],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ]
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    }
  };

  return (
    <div className="financial-accounts-section p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">
            <FontAwesomeIcon icon={faChartLine} className="me-2 text-primary" />
            Financial Accounts
          </h4>
          <p className="text-muted mb-0">
            Revenue tracking, expense management, and profit/loss analytics
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm">
            <FontAwesomeIcon icon={faDownload} className="me-1" />
            Export Report
          </Button>
          <Button variant="primary" size="sm">
            <FontAwesomeIcon icon={faPlus} className="me-1" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="border-success h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-success text-uppercase mb-1">Total Revenue</h6>
                  <h3 className="mb-0 text-white">{formatCurrency(financialData.revenue.total)}</h3>
                  <div className="d-flex align-items-center mt-2">
                    <FontAwesomeIcon 
                      icon={getTrendIcon(financialData.revenue.growth).icon} 
                      className={`me-1 text-${getTrendIcon(financialData.revenue.growth).color}`} 
                    />
                    <span className={`text-${getTrendIcon(financialData.revenue.growth).color}`}>
                      {financialData.revenue.growth > 0 ? '+' : ''}{financialData.revenue.growth}%
                    </span>
                  </div>
                </div>
                <FontAwesomeIcon icon={faArrowUp} className="fa-2x text-success opacity-25" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} className="mb-3">
          <Card className="border-danger h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-danger text-uppercase mb-1">Total Expenses</h6>
                  <h3 className="mb-0 text-white">{formatCurrency(financialData.expenses.total)}</h3>
                  <div className="d-flex align-items-center mt-2">
                    <FontAwesomeIcon 
                      icon={getTrendIcon(financialData.expenses.growth).icon} 
                      className={`me-1 text-${getTrendIcon(financialData.expenses.growth).color}`} 
                    />
                    <span className={`text-${getTrendIcon(financialData.expenses.growth).color}`}>
                      {financialData.expenses.growth > 0 ? '+' : ''}{financialData.expenses.growth}%
                    </span>
                  </div>
                </div>
                <FontAwesomeIcon icon={faArrowDown} className="fa-2x text-danger opacity-25" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} className="mb-3">
          <Card className="border-primary h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-primary text-uppercase mb-1">Net Profit</h6>
                  <h3 className="mb-0 text-white">{formatCurrency(financialData.profit.total)}</h3>
                  <div className="mt-2">
                    <span className="text-muted">Margin: {financialData.profit.margin}%</span>
                  </div>
                </div>
                <FontAwesomeIcon icon={faDollarSign} className="fa-2x text-primary opacity-25" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row className="mb-4">
        <Col lg={8} className="mb-3">
          <Card className="h-100">
            <Card.Header>
              <h6 className="mb-0">Revenue vs Expenses Trend</h6>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '300px' }}>
                <Line data={revenueExpenseData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4} className="mb-3">
          <Card className="h-100">
            <Card.Header>
              <h6 className="mb-0">Expense Breakdown</h6>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '300px' }}>
                <Doughnut data={expenseBreakdownData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Accounts Table */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <h6 className="mb-0 text-black">
            <FontAwesomeIcon icon={faChartLine} className="me-2 text-black" />
            Account Balances
          </h6>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table className="table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className='text-black'>Account Name</th>
                  <th className='text-black'>Type</th>
                  <th className='text-black'>Balance</th>
                  <th className='text-black'>Last Transaction</th>
                  <th className='text-black'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {financialData.accounts.map((account) => (
                  <tr key={account.id}>
                    <td>
                      <strong>{account.name}</strong>
                    </td>
                    <td>
                      <Badge bg={account.type === 'asset' ? 'success' : 'warning'}>
                        {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                      </Badge>
                    </td>
                    <td>
                      <strong className={account.type === 'asset' ? 'text-success' : 'text-warning'}>
                        {formatCurrency(account.balance)}
                      </strong>
                    </td>
                    <td>
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                      {new Date(account.last_transaction).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          title="View Transactions"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </Button>
                        <Button 
                          variant="outline-success" 
                          size="sm"
                          title="Add Transaction"
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Financial Insights */}
      <Row className="mt-4">
        <Col xs={12}>
          <Card className="bg-light">
            <Card.Body>
              <h6 className="mb-3 text-white">Financial Insights</h6>
              <Row>
                <Col md={6} className="mb-3">
                  <div className="d-flex align-items-center">
                    <FontAwesomeIcon icon={faArrowTrendUp} className="text-success me-2" />
                    <div>
                      <strong className='text-white'>Revenue Growth</strong>
                      <div className="text-muted small">
                        Revenue increased by {financialData.revenue.growth}% this month
                      </div>
                    </div>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-flex align-items-center">
                    <FontAwesomeIcon icon={faDollarSign} className="text-primary me-2" />
                    <div>
                      <strong className='text-white'>Profit Margin</strong>
                      <div className="text-muted small">
                        Current profit margin is {financialData.profit.margin}%
                      </div>
                    </div>
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

export default FinancialAccountsSection;
