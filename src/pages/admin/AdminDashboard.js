import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Row, Col, Table, Button, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faCog, faDatabase, faUserPlus, faEdit, faTrash,
  faBuilding, faPlus, faEye, faHospital, faUserShield, faUserCog, faUserMd, faShieldAlt, faSignature
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import MobilePageHeader from '../../components/common/MobilePageHeader';
import ResponsiveDataTable from '../../components/admin/ResponsiveDataTable';
import MobileChart from '../../components/admin/MobileChart';
import TenantSwitcher from '../../components/admin/TenantSwitcher';
import '../../styles/AdminDashboard.css';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const { tenantData, selectedTenantId, currentTenantContext } = useTenant();
  const [users, setUsers] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

  // Fetch admin data
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch users
        const usersResponse = await adminAPI.getUsers();
        setUsers(usersResponse.data);

        // Fetch franchises if user is hub admin
        if (currentUser?.role === 'admin' || currentUser?.role === 'hub_admin') {
          const franchisesResponse = await adminAPI.getFranchises();
          setFranchises(franchisesResponse.data);
        }

        // Fetch analytics
        const analyticsResponse = await adminAPI.getAnalytics();
        setAnalytics(analyticsResponse.data);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Failed to load administrative data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [currentUser, selectedTenantId]); // Re-fetch when tenant selection changes

  // Filter data based on selected tenant
  const getFilteredUsers = () => {
    if (!selectedTenantId || currentUser?.role !== 'admin') {
      return users; // Show all users if no tenant selected or not admin
    }
    return users.filter(user => user.tenant_id === selectedTenantId);
  };

  const getFilteredFranchises = () => {
    // For franchise management, always show ALL franchises regardless of tenant selection
    // The tenant switcher is for filtering users and other data, not for limiting franchise management
    return franchises;
  };

  const filteredUsers = getFilteredUsers();
  const filteredFranchises = getFilteredFranchises();

  // Franchise table columns configuration
  const franchiseColumns = [
    {
      key: 'name',
      label: 'Name',
      render: (value, row) => (
        <Link to={`/admin/franchises/${row.id}`} className="text-decoration-none fw-bold">
          {row.name}
        </Link>
      )
    },
    {
      key: 'site_code',
      label: 'Code',
      render: (value) => (
        <code className="bg-light px-2 py-1 rounded text-primary">
          {value}
        </code>
      )
    },
    {
      key: 'address',
      label: 'Location'
    },
    {
      key: 'contact_phone',
      label: 'Contact'
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value) => (
        <span className={`badge ${value ? 'bg-success' : 'bg-danger'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  // Mobile card configuration for franchises
  const franchiseMobileCardConfig = {
    title: (franchise) => franchise.name,
    subtitle: (franchise) => `${franchise.site_code} • ${franchise.contact_phone}`,
    primaryField: 'address',
    secondaryField: 'contact_phone',
    statusField: 'is_active'
  };

  // Handle franchise actions
  const handleViewFranchise = (franchise) => {
    window.location.href = `/admin/franchises/${franchise.id}`;
  };

  const handleEditFranchise = (franchise) => {
    window.location.href = `/admin/franchises/${franchise.id}/edit`;
  };

  // User table columns configuration
  const userColumns = [
    {
      key: 'name',
      label: 'Name',
      render: (value, row) => (
        <Link to={`/admin/users/${row.id}`} className="text-decoration-none fw-bold">
          {row.first_name} {row.last_name}
        </Link>
      )
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
      render: (value, row) => {
        const roleVariants = {
          admin: 'danger',
          hub_admin: 'primary',
          lab_tech: 'success',
          doctor: 'info',
          receptionist: 'warning',
          billing: 'secondary'
        };
        const roleNames = {
          admin: 'Admin',
          hub_admin: 'Hub Admin',
          lab_tech: 'Lab Technician',
          doctor: 'Doctor',
          receptionist: 'Receptionist',
          billing: 'Billing Staff'
        };
        return (
          <span className={`badge bg-${roleVariants[row.role] || 'secondary'}`}>
            {roleNames[row.role] || row.role}
          </span>
        );
      }
    },
    {
      key: 'tenant',
      label: 'Site',
      render: (value, row) => row.tenant?.name || 'N/A'
    }
  ];

  // Mobile card configuration for users
  const userMobileCardConfig = {
    title: (user) => `${user.first_name} ${user.last_name}`,
    subtitle: (user) => user.email,
    primaryField: 'username',
    secondaryField: 'role',
    statusField: 'is_active'
  };

  // Handle user actions
  const handleViewUser = (user) => {
    window.location.href = `/admin/users/${user.id}`;
  };

  const handleEditUser = (user) => {
    window.location.href = `/admin/users/${user.id}/edit`;
  };

  const handleDeleteUser = (user) => {
    if (currentUser?.id !== user.id) {
      if (window.confirm(`Are you sure you want to delete the user "${user.first_name} ${user.last_name}"? This action cannot be undone.`)) {
        // Handle delete logic here
        console.log('Delete user:', user.id);
      }
    }
  };

  // User role distribution chart data (using filtered data)
  const userRoleData = {
    labels: ['Admin', 'Lab Technician', 'Doctor', 'Receptionist', 'Billing Staff'],
    datasets: [
      {
        data: [
          filteredUsers.filter(user => user.role === 'admin').length,
          filteredUsers.filter(user => user.role === 'lab_tech').length,
          filteredUsers.filter(user => user.role === 'doctor').length,
          filteredUsers.filter(user => user.role === 'receptionist').length,
          filteredUsers.filter(user => user.role === 'billing').length
        ],
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

  // Sample distribution chart data
  const sampleDistributionData = analytics ? {
    labels: analytics.sample_types.map(item => item.type_name),
    datasets: [
      {
        label: 'Sample Distribution',
        data: analytics.sample_types.map(item => item.count),
        backgroundColor: 'rgba(212, 0, 110, 0.6)',
        borderColor: 'rgba(212, 0, 110, 1)',
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

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading administrative data...</p>
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
    <div className="admin-dashboard-container">
      <MobilePageHeader
        title="Administration"
        subtitle={
          selectedTenantId && currentUser?.role === 'admin'
            ? `${currentTenantContext?.name || 'Selected Franchise'} - Administration`
            : "System administration and management"
        }
        icon={faCog}
        primaryAction={currentUser?.role === 'admin' ? {
          label: "System Settings",
          shortLabel: "Settings",
          icon: faCog,
          onClick: () => window.location.href = "/admin/settings",
          variant: "primary"
        } : null}
        secondaryActions={[
          {
            label: "User Management",
            shortLabel: "Users",
            icon: faUsers,
            onClick: () => window.location.href = "/admin/users",
            variant: "outline-primary"
          },
          {
            label: "Master Data",
            shortLabel: "Data",
            icon: faDatabase,
            onClick: () => window.location.href = "/admin/master-data",
            variant: "outline-info"
          },
          {
            label: "Signature Management",
            shortLabel: "Signatures",
            icon: faSignature,
            onClick: () => window.location.href = "/admin/signature-management",
            variant: "outline-success"
          }
        ]}
        breadcrumbs={[
          { label: "Dashboard", shortLabel: "Home", link: "/dashboard" },
          { label: "Administration", shortLabel: "Admin" }
        ]}
      />

      {/* Tenant Switcher for Super Admin */}
      <TenantSwitcher />

      {/* Admin Statistics Cards */}
      <Row className="mb-4 g-3">
        <Col xs={6} lg={3} className="mb-3 mb-lg-0">
          <Card className="border-left-primary shadow h-100 admin-stat-card">
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Users
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {filteredUsers.length}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faUsers} className="fa-lg text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {tenantData?.is_hub && (
          <Col xs={6} lg={3} className="mb-3 mb-lg-0">
            <Card className="border-left-success shadow h-100 admin-stat-card">
              <Card.Body className="p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                      Franchises
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                      {franchises.length}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <FontAwesomeIcon icon={faBuilding} className="fa-lg text-gray-300" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}

        <Col xs={6} lg={3} className="mb-3 mb-lg-0">
          <Card className="border-left-info shadow h-100 admin-stat-card">
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Tests
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {analytics?.test_count || 0}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faDatabase} className="fa-lg text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} lg={3} className="mb-3 mb-lg-0">
          <Card className="border-left-warning shadow h-100 admin-stat-card">
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    <span className="d-none d-sm-inline">Revenue (Monthly)</span>
                    <span className="d-sm-none">Revenue</span>
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    ₹{analytics?.monthly_revenue?.toLocaleString() || 0}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faBuilding} className="fa-lg text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="users" title="Users">
          <Card className="shadow mb-4">
            <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 className="m-0 font-weight-bold text-primary">User Management</h6>
              <Link to="/admin/users/create" className="btn btn-sm btn-primary">
                <FontAwesomeIcon icon={faUserPlus} className="me-1" /> Add User
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              <ResponsiveDataTable
                data={filteredUsers}
                columns={userColumns}
                onViewDetails={handleViewUser}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                loading={loading}
                emptyMessage={
                  selectedTenantId ?
                    `No users found for ${currentTenantContext?.name || 'selected franchise'}` :
                    'No users found'
                }
                mobileCardConfig={userMobileCardConfig}
              />
            </Card.Body>
          </Card>

          {/* User Role Distribution Chart */}
          <MobileChart
            type="doughnut"
            data={userRoleData}
            title="User Role Distribution"
            subtitle="Distribution of users across different roles"
            height={300}
            mobileHeight={250}
          />
        </Tab>

        <Tab eventKey="franchises" title="Franchises" disabled={!tenantData?.is_hub}>
          {tenantData?.is_hub ? (
            <Card className="shadow mb-4">
              <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
                <h6 className="m-0 font-weight-bold text-primary">Franchise Management</h6>
                <Link to="/admin/franchises/create" className="btn btn-sm btn-primary">
                  <FontAwesomeIcon icon={faPlus} className="me-1" /> Add Franchise
                </Link>
              </Card.Header>
              <Card.Body className="p-0">
                <ResponsiveDataTable
                  data={filteredFranchises}
                  columns={franchiseColumns}
                  onViewDetails={handleViewFranchise}
                  onEdit={handleEditFranchise}
                  loading={loading}
                  emptyMessage="No franchises found. Click 'Add Franchise' to create a new franchise."
                  mobileCardConfig={franchiseMobileCardConfig}
                />
              </Card.Body>
            </Card>
          ) : (
            <div className="alert alert-info">
              <FontAwesomeIcon icon={faBuilding} className="me-2" />
              Franchise management is only available for hub administrators.
            </div>
          )}
        </Tab>

        {/* <Tab eventKey="master-data" title="Master Data">
          <Row>
            <Col md={6}>
              <Card className="shadow mb-4">
                <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
                  <h6 className="m-0 font-weight-bold text-primary">Test Catalog</h6>
                  <Link to="/admin/tests" className="btn btn-sm btn-primary">
                    <FontAwesomeIcon icon={faEye} className="me-1" /> Manage
                  </Link>
                </Card.Header>
                <Card.Body>
                  <p>Manage test catalog, categories, and pricing.</p>
                  <div className="d-grid gap-2">
                    <Link to="/admin/tests/create" className="btn btn-outline-primary">
                      <FontAwesomeIcon icon={faPlus} className="me-1" /> Add Test
                    </Link>
                    <Link to="/admin/test-categories" className="btn btn-outline-secondary">
                      <FontAwesomeIcon icon={faDatabase} className="me-1" /> Test Categories
                    </Link>
                    <Link to="/admin/test-panels" className="btn btn-outline-info">
                      <FontAwesomeIcon icon={faDatabase} className="me-1" /> Test Panels
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="shadow mb-4">
                <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
                  <h6 className="m-0 font-weight-bold text-primary">Sample Types</h6>
                  <Link to="/admin/sample-types" className="btn btn-sm btn-primary">
                    <FontAwesomeIcon icon={faEye} className="me-1" /> Manage
                  </Link>
                </Card.Header>
                <Card.Body>
                  <p>Manage sample types, containers, and collection methods.</p>
                  <div className="d-grid gap-2">
                    <Link to="/admin/sample-types/create" className="btn btn-outline-primary">
                      <FontAwesomeIcon icon={faPlus} className="me-1" /> Add Sample Type
                    </Link>
                    <Link to="/admin/containers" className="btn btn-outline-secondary">
                      <FontAwesomeIcon icon={faDatabase} className="me-1" /> Containers
                    </Link>
                    <Link to="/admin/rejection-criteria" className="btn btn-outline-danger">
                      <FontAwesomeIcon icon={faDatabase} className="me-1" /> Rejection Criteria
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Card className="shadow mb-4">
                <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
                  <h6 className="m-0 font-weight-bold text-primary">Doctors</h6>
                  <Link to="/admin/doctors" className="btn btn-sm btn-primary">
                    <FontAwesomeIcon icon={faEye} className="me-1" /> Manage
                  </Link>
                </Card.Header>
                <Card.Body>
                  <p>Manage referring doctors and their details.</p>
                  <div className="d-grid gap-2">
                    <Link to="/admin/doctors/create" className="btn btn-outline-primary">
                      <FontAwesomeIcon icon={faUserMd} className="me-1" /> Add Doctor
                    </Link>
                    <Link to="/admin/specialties" className="btn btn-outline-secondary">
                      <FontAwesomeIcon icon={faDatabase} className="me-1" /> Specialties
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="shadow mb-4">
                <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
                  <h6 className="m-0 font-weight-bold text-primary">GST Configuration</h6>
                  <Link to="/admin/gst-config" className="btn btn-sm btn-primary">
                    <FontAwesomeIcon icon={faEye} className="me-1" /> Manage
                  </Link>
                </Card.Header>
                <Card.Body>
                  <p>Configure GST rates and calculation rules for billing.</p>
                  <div className="d-grid gap-2">
                    <Link to="/admin/gst-config" className="btn btn-outline-primary">
                      <FontAwesomeIcon icon={faCog} className="me-1" /> GST Settings
                    </Link>
                    <Link to="/admin/settings" className="btn btn-outline-secondary">
                      <FontAwesomeIcon icon={faCog} className="me-1" /> System Settings
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="shadow mb-4">
                <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
                  <h6 className="m-0 font-weight-bold text-primary">Roles & Permissions</h6>
                  <Link to="/admin/roles" className="btn btn-sm btn-primary">
                    <FontAwesomeIcon icon={faEye} className="me-1" /> Manage
                  </Link>
                </Card.Header>
                <Card.Body>
                  <p>Manage user roles and permissions.</p>
                  <div className="d-grid gap-2">
                    <Link to="/admin/roles/create" className="btn btn-outline-primary">
                      <FontAwesomeIcon icon={faUserShield} className="me-1" /> Add Role
                    </Link>
                    <Link to="/admin/permissions" className="btn btn-outline-secondary">
                      <FontAwesomeIcon icon={faUserCog} className="me-1" /> Permissions
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {(currentUser?.role === 'admin' || currentUser?.role === 'hub_admin') && (
            <Row>
              <Col md={6}>
                <Card className="shadow mb-4">
                  <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
                    <h6 className="m-0 font-weight-bold text-primary">Access Management</h6>
                    <Link to="/admin/access-management" className="btn btn-sm btn-primary">
                      <FontAwesomeIcon icon={faEye} className="me-1" /> Manage
                    </Link>
                  </Card.Header>
                  <Card.Body>
                    <p>Manage franchise module access permissions and restrictions.</p>
                    <div className="d-grid gap-2">
                      <Link to="/admin/access-management" className="btn btn-outline-primary">
                        <FontAwesomeIcon icon={faShieldAlt} className="me-1" /> Franchise Permissions
                      </Link>
                      <Link to="/admin/roles" className="btn btn-outline-secondary">
                        <FontAwesomeIcon icon={faUserCog} className="me-1" /> Role Management
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {currentUser?.role === 'admin' && (
            <Row>
              <Col md={6}>
                <Card className="shadow mb-4">
                  <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
                    <h6 className="m-0 font-weight-bold text-primary">Signature Management</h6>
                    <Link to="/admin/signature-management" className="btn btn-sm btn-primary">
                      <FontAwesomeIcon icon={faEye} className="me-1" /> Manage
                    </Link>
                  </Card.Header>
                  <Card.Body>
                    <p>Manage doctor signatures for PDF reports and documents.</p>
                    <div className="d-grid gap-2">
                      <Link to="/admin/signature-management" className="btn btn-outline-primary">
                        <FontAwesomeIcon icon={faSignature} className="me-1" /> Upload Signature
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}


          {sampleDistributionData && (
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Sample Type Distribution</h6>
              </Card.Header>
              <Card.Body>
                <div className="chart-container">
                  <Bar data={sampleDistributionData} options={barOptions} height={300} />
                </div>
              </Card.Body>
            </Card>
          )}
        </Tab> */}

        <Tab
          eventKey="whatsapp"
          title={<><FontAwesomeIcon icon={faWhatsapp} className="me-2" />WhatsApp</>}
          disabled={!(currentUser?.role === 'admin' || currentUser?.role === 'hub_admin')}
        >
          {(currentUser?.role === 'admin' || currentUser?.role === 'hub_admin') ? (
            <Row>
              <Col md={6}>
                <Card className="shadow mb-4">
                  <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
                    <h6 className="m-0 font-weight-bold text-primary">WhatsApp Configuration</h6>
                    <Link to="/admin/whatsapp/config" className="btn btn-sm btn-primary">
                      <FontAwesomeIcon icon={faCog} className="me-1" /> Configure
                    </Link>
                  </Card.Header>
                  <Card.Body>
                    <p>Configure WhatsApp Business API integration for sending reports and invoices.</p>
                    <div className="d-grid gap-2">
                      <Link to="/admin/whatsapp/config" className="btn btn-outline-primary">
                        <FontAwesomeIcon icon={faCog} className="me-1" /> API Settings
                      </Link>
                      <Link to="/admin/whatsapp/messages" className="btn btn-outline-secondary">
                        <FontAwesomeIcon icon={faEye} className="me-1" /> Message History
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="shadow mb-4">
                  <Card.Header className="py-3">
                    <h6 className="m-0 font-weight-bold text-primary">WhatsApp Features</h6>
                  </Card.Header>
                  <Card.Body>
                    <p>Available WhatsApp integration features:</p>
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <FontAwesomeIcon icon={faWhatsapp} className="text-success me-2" />
                        Send test reports to patients
                      </li>
                      <li className="mb-2">
                        <FontAwesomeIcon icon={faWhatsapp} className="text-success me-2" />
                        Send invoices and billing information
                      </li>
                      <li className="mb-2">
                        <FontAwesomeIcon icon={faWhatsapp} className="text-success me-2" />
                        Automated message templates
                      </li>
                      <li className="mb-2">
                        <FontAwesomeIcon icon={faWhatsapp} className="text-success me-2" />
                        Message delivery tracking
                      </li>
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          ) : (
            <div className="alert alert-warning">
              <FontAwesomeIcon icon={faWhatsapp} className="me-2" />
              WhatsApp configuration is only available for administrators.
            </div>
          )}
        </Tab>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
