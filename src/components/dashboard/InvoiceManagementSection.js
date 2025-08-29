import React, { useState } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileInvoice, faEye, faDownload, faPrint, faPlus, faFilter,
  faExclamationTriangle, faCheckCircle, faClock, faShieldAlt, faGlobe
} from '@fortawesome/free-solid-svg-icons';
// import { useAuth } from '../../context/AuthContext'; // Future use
import { useTenant } from '../../context/TenantContext';

const InvoiceManagementSection = ({ data, userRole }) => {
  // const { currentUser } = useAuth(); // Future use
  const { tenantData } = useTenant();
  const [filter, setFilter] = useState('all');

  // Mock invoice data - replace with actual API call
  const invoices = [
    {
      id: 1,
      invoice_number: 'INV-2024-001',
      patient_name: 'John Doe',
      amount: 2500,
      status: 'paid',
      due_date: '2024-01-20',
      created_at: '2024-01-15',
      franchise: 'Main Branch'
    },
    {
      id: 2,
      invoice_number: 'INV-2024-002',
      patient_name: 'Jane Smith',
      amount: 1800,
      status: 'pending',
      due_date: '2024-01-25',
      created_at: '2024-01-16',
      franchise: 'Branch A'
    }
  ];

  // Get role-based access info
  const getAccessInfo = () => {
    if (userRole === 'admin') {
      return {
        level: 'System-wide Access',
        description: 'View all invoices across all franchises',
        icon: faGlobe,
        variant: 'danger'
      };
    } else if (userRole === 'hub_admin' && tenantData?.is_hub) {
      return {
        level: 'Hub Administrator',
        description: 'View all franchise invoices and hub data',
        icon: faShieldAlt,
        variant: 'warning'
      };
    } else {
      return {
        level: 'Franchise Access',
        description: `Limited to ${tenantData?.name || 'your franchise'} invoices only`,
        icon: faShieldAlt,
        variant: 'info'
      };
    }
  };

  const accessInfo = getAccessInfo();

  const getStatusBadge = (status) => {
    const statusMap = {
      'paid': { variant: 'success', icon: faCheckCircle, text: 'Paid' },
      'pending': { variant: 'warning', icon: faClock, text: 'Pending' },
      'overdue': { variant: 'danger', icon: faExclamationTriangle, text: 'Overdue' },
      'cancelled': { variant: 'secondary', icon: faExclamationTriangle, text: 'Cancelled' }
    };
    const statusInfo = statusMap[status] || statusMap['pending'];
    return (
      <Badge bg={statusInfo.variant}>
        <FontAwesomeIcon icon={statusInfo.icon} className="me-1" />
        {statusInfo.text}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(amount || 0);
    } catch (error) {
      // Fallback for browsers that don't support INR currency
      return `₹${(amount || 0).toLocaleString('en-IN')}`;
    }
  };

  return (
    <div className="invoice-management-section p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">
            <FontAwesomeIcon icon={faFileInvoice} className="me-2 text-primary" />
            Invoice Management
          </h4>
          <p className="text-white mb-0">
            Billing, payment tracking, and invoice generation with role-based access
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm">
            <FontAwesomeIcon icon={faFilter} className="me-1" />
            Filter
          </Button>
          <Button variant="primary" size="sm">
            <FontAwesomeIcon icon={faPlus} className="me-1" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Access Level Alert */}
      <Alert variant={accessInfo.variant} className="mb-4">
        <div className="d-flex align-items-center">
          <FontAwesomeIcon icon={accessInfo.icon} className="me-2" />
          <div>
            <strong>{accessInfo.level}</strong>
            <div className="small">{accessInfo.description}</div>
          </div>
        </div>
      </Alert>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="text-center border-primary">
            <Card.Body>
              <h3 className="text-primary">{data?.overview?.total_invoices || 0}</h3>
              <p className="mb-0 text-white">Total Invoices</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center border-warning">
            <Card.Body>
              <h3 className="text-warning">{data?.overview?.pending_invoices || 0}</h3>
              <p className="mb-0 text-white">Pending Payment</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center border-success">
            <Card.Body>
              <h3 className="text-success">{data?.overview?.paid_invoices || 0}</h3>
              <p className="mb-0 text-white">Paid Invoices</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center border-info">
            <Card.Body>
              <h3 className="text-info">
                {formatCurrency(data?.overview?.pending_payments || 0)}
              </h3>
              <p className="mb-0 text-white">Outstanding Amount</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filter Buttons */}
      <div className="mb-4">
        <div className="btn-group" role="group">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline-primary'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({invoices.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'warning' : 'outline-warning'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending ({invoices.filter(i => i.status === 'pending').length})
          </Button>
          <Button
            variant={filter === 'paid' ? 'success' : 'outline-success'}
            size="sm"
            onClick={() => setFilter('paid')}
          >
            Paid ({invoices.filter(i => i.status === 'paid').length})
          </Button>
          <Button
            variant={filter === 'overdue' ? 'danger' : 'outline-danger'}
            size="sm"
            onClick={() => setFilter('overdue')}
          >
            Overdue ({invoices.filter(i => i.status === 'overdue').length})
          </Button>
        </div>
      </div>

      {/* Invoices Table */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <h6 className="mb-0 text-black">
            <FontAwesomeIcon icon={faFileInvoice} className="me-2" />
            Recent Invoices
            {userRole !== 'admin' && !tenantData?.is_hub && (
              <Badge bg="info" className="ms-2">
                {tenantData?.name} Only
              </Badge>
            )}
          </h6>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table className="table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className='text-black'>Invoice #</th>
                  <th className='text-black'>Patient</th>
                  {(userRole === 'admin' || (userRole === 'hub_admin' && tenantData?.is_hub)) && (
                    <th className='text-black'>Franchise</th>
                  )}
                  <th className='text-black'>Amount</th>
                  <th className='text-black'>Due Date</th>
                  <th className='text-black'>Status</th>
                  <th className='text-black'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices
                  .filter(invoice => filter === 'all' || invoice.status === filter)
                  .map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <code>{invoice.invoice_number}</code>
                      </td>
                      <td>
                        <strong>{invoice.patient_name}</strong>
                      </td>
                      {(userRole === 'admin' || (userRole === 'hub_admin' && tenantData?.is_hub)) && (
                        <td>
                          <Badge bg="secondary">{invoice.franchise}</Badge>
                        </td>
                      )}
                      <td>
                        <strong>{formatCurrency(invoice.amount)}</strong>
                      </td>
                      <td>
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </td>
                      <td>
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            title="View Invoice"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </Button>
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            title="Download PDF"
                          >
                            <FontAwesomeIcon icon={faDownload} />
                          </Button>
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            title="Print Invoice"
                          >
                            <FontAwesomeIcon icon={faPrint} />
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

      {/* Quick Actions */}
      <Row className="mt-4">
        <Col xs={12}>
          <Card className="bg-light">
            <Card.Body>
              <h6 className="mb-3 text-white">Quick Actions</h6>
              <Row>
                <Col md={3} className="mb-2">
                  <Button variant="primary" size="sm" className="w-100">
                    Generate Invoice
                  </Button>
                </Col>
                <Col md={3} className="mb-2">
                  <Button variant="success" size="sm" className="w-100">
                    Payment Collection
                  </Button>
                </Col>
                <Col md={3} className="mb-2">
                  <Button variant="warning" size="sm" className="w-100">
                    Send Reminders
                  </Button>
                </Col>
                <Col md={3} className="mb-2">
                  <Button variant="info" size="sm" className="w-100">
                    Export Report
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default InvoiceManagementSection;
