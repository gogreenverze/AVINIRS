import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Form, InputGroup, Table, Badge, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faUserPlus, faSearch, faEdit, faEye, faTrash,
  faSort, faSortUp, faSortDown, faFilter, faUserShield
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import {
  DataTable,
  DeleteConfirmationModal,
  SuccessModal,
  ErrorModal
} from '../../components/common';
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


  // Table columns
  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <Link to={`/admin/users/${row.id}`}>{row.first_name} {row.last_name}</Link>
      )
    },
    {
      header: 'Username',
      accessor: 'username',
      sortable: true
    },
    {
      header: 'Email',
      accessor: 'email',
      sortable: true
    },
    {
      header: 'Role',
      accessor: 'role',
      sortable: true,
      cell: (row) => (
        <Badge bg={getRoleBadgeVariant(row.role)}>
          {getRoleDisplayName(row.role)}
        </Badge>
      )
    },
    {
      header: 'Site',
      accessor: 'tenant',
      sortable: false,
      cell: (row) => row.tenant?.name || 'N/A'
    },
    {
      header: 'Actions',
      accessor: 'actions',
      sortable: false,
      cell: (row) => (
        <div className="d-flex">
          <Link to={`/admin/users/${row.id}`} className="btn btn-sm btn-info me-1">
            <FontAwesomeIcon icon={faEye} />
          </Link>
          <Link to={`/admin/users/${row.id}/edit`} className="btn btn-sm btn-primary me-1">
            <FontAwesomeIcon icon={faEdit} />
          </Link>
          {currentUser?.id !== row.id && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteConfirm(row)}
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          )}
        </div>
      )
    }
  ];

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
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faUsers} className="me-2" />
          User Management
        </h1>
        <Link to="/admin/users/create" className="btn btn-primary">
          <FontAwesomeIcon icon={faUserPlus} className="me-2" />
          Add New User
        </Link>
      </div>

      <Card className="shadow mb-4">
        <Card.Header className="py-3 d-flex flex-wrap justify-content-between align-items-center">
          <h6 className="m-0 font-weight-bold text-primary">Users</h6>
          <div className="d-flex">
            <Form.Select
              className="me-2"
              style={{ width: 'auto' }}
              value={filterRole}
              onChange={handleFilter}
            >
              {roleOptions.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </Form.Select>
            <InputGroup style={{ width: 'auto' }}>
              <Form.Control
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearch}
              />
              <Button variant="outline-secondary">
                <FontAwesomeIcon icon={faSearch} />
              </Button>
            </InputGroup>
          </div>
        </Card.Header>
        <Card.Body>
          {error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : (
            <div className="table-responsive">
              <DataTable
                columns={columns}   
                data={currentUsers}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onSort={handleSort}
                sortField={sortField}
                sortDirection={sortDirection}
                loading={loading}
                emptyMessage="No users found."
              />
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Role Summary */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className="shadow">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Role Summary</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={2} className="mb-3">
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
                <Col md={2} className="mb-3">
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
                <Col md={2} className="mb-3">
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
                <Col md={2} className="mb-3">
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
                <Col md={2} className="mb-3">
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
                <Col md={2} className="mb-3">
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
