import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Form, InputGroup, Table, Badge, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faUserPlus, faSearch, faEdit, faEye, faTrash,
  faSort, faSortUp, faSortDown, faFilter, faUserShield,
  faFileExcel, faFileImport
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import {
  DataTable,
  DeleteConfirmationModal,
  SuccessModal,
  ErrorModal
} from '../../components/common';
import ResponsiveDataTable from '../../components/admin/ResponsiveDataTable';
import MobilePageHeader from '../../components/common/MobilePageHeader';
import { useAuth } from '../../context/AuthContext';
import '../../styles/UserManagement.css';

const UserManagement = () => {
  const { currentUser } = useAuth();

  // State for users
  const [users, setUsers] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('first_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterRole, setFilterRole] = useState('');

  // Role options
  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'hub_admin', label: 'Hub Admin' },
    { value: 'franchise_admin', label: 'Franchise Admin' },
    { value: 'lab_tech', label: 'Lab Technician' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'billing', label: 'Billing Staff' }
  ];

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await adminAPI.getUsers();
        setUsers(response.data);
        console.log("element",response.data)
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle filter
  const handleFilter = (e) => {
    setFilterRole(e.target.value);
    setCurrentPage(1);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await adminAPI.deleteUser(userToDelete.id);

      setUsers(prevUsers =>
        prevUsers.filter(user => user.id !== userToDelete.id)
      );

      setShowDeleteModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error deleting user:', err);
      setErrorMessage('Failed to delete user. Please try again.');
      setShowDeleteModal(false);
      setShowErrorModal(true);
    }
  };

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      const matchesSearch =
        user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole ? user.role === filterRole : true;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let aValue, bValue;

      if (sortField === 'name') {
        aValue = `${a.first_name} ${a.last_name}`;
        bValue = `${b.first_name} ${b.last_name}`;
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Paginate users
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Get role badge variant
  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'hub_admin':
        return 'primary';
      case 'lab_tech':
        return 'success';
      case 'doctor':
        return 'info';
      case 'receptionist':
        return 'warning';
      case 'billing':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  // Get role display name
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'hub_admin':
        return 'Hub Admin';
      case 'lab_tech':
        return 'Lab Technician';
      case 'doctor':
        return 'Doctor';
      case 'receptionist':
        return 'Receptionist';
      case 'billing':
        return 'Billing Staff';
      default:
        return role;
    }
  };


  // Table columns for ResponsiveDataTable
  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value, row) => (
        <Link to={`/admin/users/${row.id}`} className="text-decoration-none">
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
      render: (value, row) => (
        <Badge bg={getRoleBadgeVariant(row.role)}>
          {getRoleDisplayName(row.role)}
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

  // Handle user actions
  const handleViewUser = (user) => {
    window.location.href = `/admin/users/${user.id}`;
  };

  const handleEditUser = (user) => {
    window.location.href = `/admin/users/${user.id}/edit`;
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <MobilePageHeader
        title="User Management"
        subtitle="Manage system users, roles, and permissions"
        icon={faUsers}
        primaryAction={{
          label: "Add New User",
          shortLabel: "Add User",
          icon: faUserPlus,
          onClick: () => window.location.href = "/admin/users/create",
          variant: "primary"
        }}
        secondaryActions={[
          {
            label: "Export Users",
            shortLabel: "Export",
            icon: faFileExcel,
            onClick: () => console.log("Export users"),
            variant: "outline-success"
          },
          {
            label: "Import Users",
            shortLabel: "Import",
            icon: faFileImport,
            onClick: () => console.log("Import users"),
            variant: "outline-info"
          }
        ]}
        breadcrumbs={[
          { label: "Admin", shortLabel: "Admin", link: "/admin" },
          { label: "User Management", shortLabel: "Users" }
        ]}
      />

      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
            <h6 className="m-0 font-weight-bold text-primary">
              <FontAwesomeIcon icon={faUsers} className="me-2 d-lg-none" />
              Users ({filteredUsers.length})
            </h6>
            <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-lg-auto">
              <Form.Select
                className="flex-shrink-0"
                style={{ minWidth: '150px' }}
                value={filterRole}
                onChange={handleFilter}
              >
                {roleOptions.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </Form.Select>
              <InputGroup style={{ minWidth: '200px' }}>
                <Form.Control
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
                <Button variant="outline-secondary">
                  <FontAwesomeIcon icon={faSearch} />
                </Button>
              </InputGroup>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {error ? (
            <div className="alert alert-danger m-3" role="alert">
              {error}
            </div>
          ) : (
            <ResponsiveDataTable
              data={currentUsers}
              columns={columns}
              onEdit={handleEditUser}
              onDelete={(user) => currentUser?.id !== user.id ? handleDeleteConfirm(user) : null}
              onViewDetails={handleViewUser}
              loading={loading}
              emptyMessage="No users found."
              mobileCardConfig={mobileCardConfig}
            />
          )}
        </Card.Body>
      </Card>

      {/* Role Summary */}
      <Row className="mb-4">
        <Col xs={12}>
          <Card className="shadow">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">
                <FontAwesomeIcon icon={faUserShield} className="me-2" />
                Role Summary
              </h6>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col xs={6} sm={4} md={2}>
                  <div className="role-summary-item">
                    <div className="role-badge bg-danger">
                      <FontAwesomeIcon icon={faUserShield} />
                    </div>
                    <div className="role-info">
                      <div className="role-name">Admin</div>
                      <div className="role-count">{users.filter(user => user.role === 'admin').length}</div>
                    </div>
                  </div>
                </Col>
                <Col xs={6} sm={4} md={2}>
                  <div className="role-summary-item">
                    <div className="role-badge bg-primary">
                      <FontAwesomeIcon icon={faUserShield} />
                    </div>
                    <div className="role-info">
                      <div className="role-name">Hub Admin</div>
                      <div className="role-count">{users.filter(user => user.role === 'hub_admin').length}</div>
                    </div>
                  </div>
                </Col>
                <Col xs={6} sm={4} md={2}>
                  <div className="role-summary-item">
                    <div className="role-badge bg-success">
                      <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <div className="role-info">
                      <div className="role-name">Lab Tech</div>
                      <div className="role-count">{users.filter(user => user.role === 'lab_tech').length}</div>
                    </div>
                  </div>
                </Col>
                <Col xs={6} sm={4} md={2}>
                  <div className="role-summary-item">
                    <div className="role-badge bg-info">
                      <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <div className="role-info">
                      <div className="role-name">Doctor</div>
                      <div className="role-count">{users.filter(user => user.role === 'doctor').length}</div>
                    </div>
                  </div>
                </Col>
                <Col xs={6} sm={4} md={2}>
                  <div className="role-summary-item">
                    <div className="role-badge bg-warning">
                      <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <div className="role-info">
                      <div className="role-name">Receptionist</div>
                      <div className="role-count">{users.filter(user => user.role === 'receptionist').length}</div>
                    </div>
                  </div>
                </Col>
                <Col xs={6} sm={4} md={2}>
                  <div className="role-summary-item">
                    <div className="role-badge bg-secondary">
                      <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <div className="role-info">
                      <div className="role-name">Billing</div>
                      <div className="role-count">{users.filter(user => user.role === 'billing').length}</div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete the user "${userToDelete?.first_name} ${userToDelete?.last_name}"? This action cannot be undone.`}
      />

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        title="Success"
        message="User has been deleted successfully."
      />

      {/* Error Modal */}
      <ErrorModal
        show={showErrorModal}
        onHide={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
      />
    </div>
  );
};

export default UserManagement;
