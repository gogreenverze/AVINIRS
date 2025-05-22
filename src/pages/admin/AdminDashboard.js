import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Row, Col, Table, Button, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faCog, faDatabase, faUserPlus, faEdit, faTrash,
  faBuilding, faPlus, faEye, faHospital, faUserShield, faUserCog, faUserMd
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import '../../styles/AdminDashboard.css';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const { tenantData } = useTenant();
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
  }, [currentUser]);

  // User role distribution chart data
  const userRoleData = {
    labels: ['Admin', 'Lab Technician', 'Doctor', 'Receptionist', 'Billing Staff'],
    datasets: [
      {
        data: [
          users.filter(user => user.role === 'admin').length,
          users.filter(user => user.role === 'lab_tech').length,
          users.filter(user => user.role === 'doctor').length,
          users.filter(user => user.role === 'receptionist').length,
          users.filter(user => user.role === 'billing').length
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
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Administration</h1>
        <div>
          {currentUser?.role === 'admin' && (
            <Link to="/admin/settings" className="btn btn-primary">
              <FontAwesomeIcon icon={faCog} className="me-2" />
              System Settings
            </Link>
          )}
        </div>
      </div>

      {/* Admin Cards */}
      <Row className="mb-4">
        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-primary shadow h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Users
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {users.length}
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faUsers} className="fa-2x text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {tenantData?.is_hub && (
          <Col xl={3} md={6} className="mb-4">
            <Card className="border-left-success shadow h-100 py-2">
              <Card.Body>
                <div className="row no-gutters align-items-center">
                  <div className="col mr-2">
                    <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                      Franchises
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                      {franchises.length}
                    </div>
                  </div>
                  <div className="col-auto">
                    <FontAwesomeIcon icon={faBuilding} className="fa-2x text-gray-300" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}

        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-info shadow h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Tests
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {analytics?.test_count || 0}
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faDatabase} className="fa-2x text-gray-300" />
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
                    Revenue (Monthly)
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    ₹{analytics?.monthly_revenue?.toLocaleString() || 0}
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faBuilding} className="fa-2x text-gray-300" />
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
            <Card.Body>
              <div className="table-responsive">
                <Table className="table-hover" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Site</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.first_name} {user.last_name}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>
                          {user.role === 'admin' && (
                            <span className="badge bg-danger">Admin</span>
                          )}
                          {user.role === 'hub_admin' && (
                            <span className="badge bg-primary">Hub Admin</span>
                          )}
                          {user.role === 'lab_tech' && (
                            <span className="badge bg-success">Lab Technician</span>
                          )}
                          {user.role === 'doctor' && (
                            <span className="badge bg-info">Doctor</span>
                          )}
                          {user.role === 'receptionist' && (
                            <span className="badge bg-warning">Receptionist</span>
                          )}
                          {user.role === 'billing' && (
                            <span className="badge bg-secondary">Billing Staff</span>
                          )}
                        </td>
                        <td>{user.tenant?.name || 'N/A'}</td>
                        <td>
                          <Link to={`/admin/users/${user.id}`} className="btn btn-info btn-sm me-1">
                            <FontAwesomeIcon icon={faEye} />
                          </Link>
                          <Link to={`/admin/users/${user.id}/edit`} className="btn btn-primary btn-sm me-1">
                            <FontAwesomeIcon icon={faEdit} />
                          </Link>
                          {currentUser?.id !== user.id && (
                            <Button variant="danger" size="sm">
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* User Role Distribution Chart */}
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">User Role Distribution</h6>
            </Card.Header>
            <Card.Body>
              <div className="chart-container">
                <Doughnut data={userRoleData} options={doughnutOptions} />
              </div>
            </Card.Body>
          </Card>
        </Tab>

        {tenantData?.is_hub && (
          <Tab eventKey="franchises" title="Franchises">
            <Card className="shadow mb-4">
              <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
                <h6 className="m-0 font-weight-bold text-primary">Franchise Management</h6>
                <Link to="/admin/franchises/create" className="btn btn-sm btn-primary">
                  <FontAwesomeIcon icon={faPlus} className="me-1" /> Add Franchise
                </Link>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table className="table-hover" width="100%" cellSpacing="0">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Location</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {franchises.map(franchise => (
                        <tr key={franchise.id}>
                          <td>{franchise.name}</td>
                          <td>{franchise.site_code}</td>
                          <td>{franchise.address}</td>
                          <td>{franchise.contact_phone}</td>
                          <td>
                            {franchise.is_active ? (
                              <span className="badge bg-success">Active</span>
                            ) : (
                              <span className="badge bg-danger">Inactive</span>
                            )}
                          </td>
                          <td>
                            <Link to={`/admin/franchises/${franchise.id}`} className="btn btn-info btn-sm me-1">
                              <FontAwesomeIcon icon={faEye} />
                            </Link>
                            <Link to={`/admin/franchises/${franchise.id}/edit`} className="btn btn-primary btn-sm me-1">
                              <FontAwesomeIcon icon={faEdit} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Tab>
        )}

        <Tab eventKey="master-data" title="Master Data">
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

          {/* Sample Distribution Chart */}
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
        </Tab>

        {(currentUser?.role === 'admin' || currentUser?.role === 'hub_admin') && (
          <Tab eventKey="whatsapp" title={<><FontAwesomeIcon icon={faWhatsapp} className="me-2" />WhatsApp</>}>
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
          </Tab>
        )}
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
