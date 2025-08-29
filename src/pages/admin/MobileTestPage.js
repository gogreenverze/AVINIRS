import React, { useState } from 'react';
import { Card, Row, Col, Button, Badge, Table, Form, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faEdit, faTrash, faEye, faPlus, faSearch,
  faUserShield, faDatabase, faChartBar, faCog, faFileExcel
} from '@fortawesome/free-solid-svg-icons';
import MobilePageHeader from '../../components/common/MobilePageHeader';
import ResponsiveDataTable from '../../components/admin/ResponsiveDataTable';
import MobileChart from '../../components/admin/MobileChart';

/**
 * Mobile Test Page - For testing mobile responsiveness
 * This page demonstrates all mobile-optimized components
 */
const MobileTestPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data for testing
  const sampleUsers = [
    {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      username: 'johndoe',
      role: 'admin',
      is_active: true,
      tenant: { name: 'Main Lab' }
    },
    {
      id: 2,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      username: 'janesmith',
      role: 'lab_tech',
      is_active: true,
      tenant: { name: 'Branch Lab' }
    },
    {
      id: 3,
      first_name: 'Dr. Michael',
      last_name: 'Johnson',
      email: 'michael.johnson@example.com',
      username: 'drjohnson',
      role: 'doctor',
      is_active: false,
      tenant: { name: 'Main Lab' }
    }
  ];

  // Sample chart data
  const chartData = {
    labels: ['Admin', 'Lab Tech', 'Doctor', 'Receptionist', 'Billing'],
    datasets: [
      {
        data: [2, 5, 3, 4, 2],
        backgroundColor: [
          '#4e73df',
          '#1cc88a',
          '#36b9cc',
          '#f6c23e',
          '#e74a3b'
        ],
        borderWidth: 1
      }
    ]
  };

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value, row) => `${row.first_name} ${row.last_name}`
    },
    {
      key: 'username',
      label: 'Username'
    },
    {
      key: 'email',
      label: 'Email'
    },
    {
      key: 'role',
      label: 'Role',
      render: (value) => (
        <Badge bg={value === 'admin' ? 'danger' : value === 'lab_tech' ? 'success' : 'info'}>
          {value.replace('_', ' ').toUpperCase()}
        </Badge>
      )
    },
    {
      key: 'tenant',
      label: 'Site',
      render: (value, row) => row.tenant?.name || 'N/A'
    }
  ];

  // Mobile card configuration
  const mobileCardConfig = {
    title: (user) => `${user.first_name} ${user.last_name}`,
    subtitle: (user) => user.email,
    primaryField: 'username',
    secondaryField: 'role',
    statusField: 'is_active'
  };

  const handleEdit = (user) => {
    console.log('Edit user:', user);
  };

  const handleDelete = (user) => {
    console.log('Delete user:', user);
  };

  const handleView = (user) => {
    console.log('View user:', user);
  };

  return (
    <div className="mobile-test-page">
      {/* Mobile Page Header Test */}
      <MobilePageHeader
        title="Mobile Responsiveness Test"
        subtitle="Testing all mobile-optimized components and layouts"
        icon={faUsers}
        primaryAction={{
          label: "Add New Item",
          shortLabel: "Add",
          icon: faPlus,
          onClick: () => console.log("Primary action clicked"),
          variant: "primary"
        }}
        secondaryActions={[
          {
            label: "Export Data",
            shortLabel: "Export",
            icon: faFileExcel,
            onClick: () => console.log("Export clicked"),
            variant: "outline-success"
          },
          {
            label: "Settings",
            shortLabel: "Settings",
            icon: faCog,
            onClick: () => console.log("Settings clicked"),
            variant: "outline-secondary"
          },
          {
            label: "Analytics",
            shortLabel: "Charts",
            icon: faChartBar,
            onClick: () => console.log("Analytics clicked"),
            variant: "outline-info"
          }
        ]}
        breadcrumbs={[
          { label: "Dashboard", shortLabel: "Home", link: "/dashboard" },
          { label: "Admin", shortLabel: "Admin", link: "/admin" },
          { label: "Mobile Test", shortLabel: "Test" }
        ]}
      />

      {/* Statistics Cards Test */}
      <Row className="mb-4 g-3">
        <Col xs={6} lg={3}>
          <Card className="border-left-primary shadow h-100 admin-stat-card">
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Users
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {sampleUsers.length}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faUsers} className="fa-lg text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} lg={3}>
          <Card className="border-left-success shadow h-100 admin-stat-card">
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Active Users
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {sampleUsers.filter(u => u.is_active).length}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faUserShield} className="fa-lg text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} lg={3}>
          <Card className="border-left-info shadow h-100 admin-stat-card">
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Roles
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    5
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faDatabase} className="fa-lg text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} lg={3}>
          <Card className="border-left-warning shadow h-100 admin-stat-card">
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    <span className="d-none d-sm-inline">Inactive Users</span>
                    <span className="d-sm-none">Inactive</span>
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {sampleUsers.filter(u => !u.is_active).length}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faUsers} className="fa-lg text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filter Test */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
            <h6 className="m-0 font-weight-bold text-primary">
              Responsive Data Table Test
            </h6>
            <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-lg-auto">
              <Form.Control
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ minWidth: '200px' }}
              />
              <Button variant="outline-secondary">
                <FontAwesomeIcon icon={faSearch} />
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <ResponsiveDataTable
            data={sampleUsers}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetails={handleView}
            loading={false}
            emptyMessage="No users found."
            mobileCardConfig={mobileCardConfig}
          />
        </Card.Body>
      </Card>

      {/* Chart Test */}
      <MobileChart
        type="doughnut"
        data={chartData}
        title="User Role Distribution"
        subtitle="Distribution of users across different roles"
        height={300}
        mobileHeight={250}
      />

      {/* Mobile Alerts Test */}
      <Alert variant="info" className="mb-3">
        <FontAwesomeIcon icon={faUsers} className="me-2" />
        This is a mobile-optimized info alert with proper spacing and typography.
      </Alert>

      <Alert variant="success" className="mb-3">
        <FontAwesomeIcon icon={faUserShield} className="me-2" />
        Mobile responsiveness test completed successfully!
      </Alert>
    </div>
  );
};

export default MobileTestPage;
