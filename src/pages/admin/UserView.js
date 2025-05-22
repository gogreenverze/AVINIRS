import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, Button, Badge, Row, Col, Table, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faArrowLeft, faEdit, faTrash, faUser,
  faEnvelope, faIdCard, faBuilding, faUserTag, faHistory,
  faCalendarAlt, faCheckCircle, faTimesCircle, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import { 
  DeleteConfirmationModal,
  SuccessModal,
  ErrorModal
} from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import '../../styles/UserView.css';

const UserView = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  
  // State for user
  const [user, setUser] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user
        const userResponse = await adminAPI.getUserById(id);
        setUser(userResponse.data);
        
        // Fetch login history
        const historyResponse = await adminAPI.getUserLoginHistory(id);
        setLoginHistory(historyResponse.data);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    setShowDeleteModal(true);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await adminAPI.deleteUser(id);
      
      setShowDeleteModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error deleting user:', err);
      setErrorMessage('Failed to delete user. Please try again.');
      setShowDeleteModal(false);
      setShowErrorModal(true);
    }
  };

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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="alert alert-warning" role="alert">
        User not found.
      </div>
    );
  }

  return (
    <div className="user-view-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faUser} className="me-2" />
          User Details
        </h1>
        <div>
          <Link to="/admin/users" className="btn btn-secondary me-2">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to List
          </Link>
          <Link to={`/admin/users/${id}/edit`} className="btn btn-primary me-2">
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Edit
          </Link>
          {currentUser?.id !== user.id && (
            <Button variant="danger" onClick={handleDeleteConfirm}>
              <FontAwesomeIcon icon={faTrash} className="me-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">User Information</h6>
            </Card.Header>
            <Card.Body>
              <div className="user-profile">
                <div className="user-avatar">
                  <div className="avatar-placeholder">
                    {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                  </div>
                </div>
                <div className="user-info">
                  <h4>{user.first_name} {user.last_name}</h4>
                  <div className="user-meta">
                    <Badge bg={getRoleBadgeVariant(user.role)}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                    <Badge bg={user.is_active ? 'success' : 'danger'} className="ms-2">
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="user-details mt-4">
                <Row>
                  <Col md={6}>
                    <div className="detail-item">
                      <div className="detail-icon">
                        <FontAwesomeIcon icon={faIdCard} />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Username</div>
                        <div className="detail-value">{user.username}</div>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="detail-item">
                      <div className="detail-icon">
                        <FontAwesomeIcon icon={faEnvelope} />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Email</div>
                        <div className="detail-value">{user.email}</div>
                      </div>
                    </div>
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col md={6}>
                    <div className="detail-item">
                      <div className="detail-icon">
                        <FontAwesomeIcon icon={faUserTag} />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Role</div>
                        <div className="detail-value">{getRoleDisplayName(user.role)}</div>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="detail-item">
                      <div className="detail-icon">
                        <FontAwesomeIcon icon={faBuilding} />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Franchise</div>
                        <div className="detail-value">{user.tenant?.name || 'N/A'}</div>
                      </div>
                    </div>
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col md={6}>
                    <div className="detail-item">
                      <div className="detail-icon">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Created At</div>
                        <div className="detail-value">{formatDate(user.created_at)}</div>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="detail-item">
                      <div className="detail-icon">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Last Updated</div>
                        <div className="detail-value">{formatDate(user.updated_at)}</div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow mb-4">
            <Card.Header className="py-3 d-flex justify-content-between align-items-center">
              <h6 className="m-0 font-weight-bold text-primary">Login History</h6>
              <Badge bg="info">{loginHistory.length} Entries</Badge>
            </Card.Header>
            <Card.Body>
              {loginHistory.length > 0 ? (
                <div className="table-responsive">
                  <Table className="table-hover" width="100%" cellSpacing="0">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>IP Address</th>
                        <th>Device</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginHistory.map((entry, index) => (
                        <tr key={index}>
                          <td>{formatDate(entry.timestamp)}</td>
                          <td>{entry.ip_address}</td>
                          <td>{entry.user_agent || 'Unknown'}</td>
                          <td>
                            {entry.success ? (
                              <Badge bg="success">
                                <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                                Success
                              </Badge>
                            ) : (
                              <Badge bg="danger">
                                <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
                                Failed
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="info">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  No login history available for this user.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Account Status</h6>
            </Card.Header>
            <Card.Body>
              <div className="status-item">
                <div className="status-label">Account Status</div>
                <div className="status-value">
                  {user.is_active ? (
                    <Badge bg="success" className="status-badge">
                      <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge bg="danger" className="status-badge">
                      <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
              <div className="status-item">
                <div className="status-label">Last Login</div>
                <div className="status-value">
                  {user.last_login ? formatDate(user.last_login) : 'Never'}
                </div>
              </div>
              <div className="status-item">
                <div className="status-label">Failed Login Attempts</div>
                <div className="status-value">
                  {user.failed_login_attempts || 0}
                </div>
              </div>
              <div className="status-item">
                <div className="status-label">Password Last Changed</div>
                <div className="status-value">
                  {user.password_changed_at ? formatDate(user.password_changed_at) : 'Never'}
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Permissions</h6>
            </Card.Header>
            <Card.Body>
              <div className="permissions-list">
                {user.role === 'admin' && (
                  <>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                      Full System Access
                    </div>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                      User Management
                    </div>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                      Franchise Management
                    </div>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                      System Settings
                    </div>
                  </>
                )}
                
                {user.role === 'hub_admin' && (
                  <>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                      Hub Administration
                    </div>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                      User Management
                    </div>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                      Franchise Management
                    </div>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faTimesCircle} className="text-danger me-2" />
                      System Settings
                    </div>
                  </>
                )}
                
                {user.role === 'lab_tech' && (
                  <>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                      Sample Management
                    </div>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                      Result Entry
                    </div>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faTimesCircle} className="text-danger me-2" />
                      User Management
                    </div>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faTimesCircle} className="text-danger me-2" />
                      System Settings
                    </div>
                  </>
                )}
                
                {user.role === 'doctor' && (
                  <>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                      Patient Management
                    </div>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                      Result Verification
                    </div>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faTimesCircle} className="text-danger me-2" />
                      User Management
                    </div>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faTimesCircle} className="text-danger me-2" />
                      System Settings
                    </div>
                  </>
                )}
                
                {user.role === 'receptionist' && (
                  <>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                      Patient Registration
                    </div>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                      Sample Collection
                    </div>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faTimesCircle} className="text-danger me-2" />
                      Result Entry
                    </div>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faTimesCircle} className="text-danger me-2" />
                      System Settings
                    </div>
                  </>
                )}
                
                {user.role === 'billing' && (
                  <>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                      Invoice Management
                    </div>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                      Payment Processing
                    </div>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faTimesCircle} className="text-danger me-2" />
                      User Management
                    </div>
                    <div className="permission-item">
                      <FontAwesomeIcon icon={faTimesCircle} className="text-danger me-2" />
                      System Settings
                    </div>
                  </>
                )}
              </div>
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
        message={`Are you sure you want to delete the user "${user.first_name} ${user.last_name}"? This action cannot be undone.`}
      />

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        title="Success"
        message="User has been deleted successfully."
        redirectTo="/admin/users"
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

export default UserView;
