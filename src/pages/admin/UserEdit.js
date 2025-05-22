import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faArrowLeft, faSave, faInfoCircle, faUserEdit
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import {
  TextInput,
  SelectInput,
  PasswordInput,
  FormSection,
  SuccessModal,
  ErrorModal,
  ConfirmationModal
} from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import '../../styles/UserEdit.css';

const UserEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    role: '',
    tenant_id: '',
    is_active: true
  });

  // Original user data
  const [originalUser, setOriginalUser] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tenants, setTenants] = useState([]);
  const [changePassword, setChangePassword] = useState(false);

  // Role options
  const roleOptions = [
    { value: '', label: 'Select Role' },
    { value: 'admin', label: 'Admin' },
    { value: 'hub_admin', label: 'Hub Admin' },
    { value: 'franchise_admin', label: 'Franchise Admin' },
    { value: 'lab_tech', label: 'Lab Technician' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'billing', label: 'Billing Staff' }
  ];

  // Status options
  const statusOptions = [
    { value: true, label: 'Active' },
    { value: false, label: 'Inactive' }
  ];

  // Fetch user and tenants
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user
        const userResponse = await adminAPI.getUserById(id);
        const userData = userResponse.data;

        setOriginalUser(userData);

        // Set form data
        setFormData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          username: userData.username || '',
          email: userData.email || '',
          password: '',
          confirm_password: '',
          role: userData.role || '',
          tenant_id: userData.tenant_id || '',
          is_active: userData.is_active !== undefined ? userData.is_active : true
        });

        // Fetch tenants
        const tenantsResponse = await adminAPI.getFranchises();
        setTenants(tenantsResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load user data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Toggle change password
  const handleToggleChangePassword = () => {
    setChangePassword(!changePassword);

    if (!changePassword) {
      setFormData(prevData => ({
        ...prevData,
        password: '',
        confirm_password: ''
      }));
    }
  };

  // Validate form before submission
  const validateForm = () => {
    if (!formData.first_name) {
      setError('Please enter a first name.');
      return false;
    }

    if (!formData.last_name) {
      setError('Please enter a last name.');
      return false;
    }

    if (!formData.username) {
      setError('Please enter a username.');
      return false;
    }

    if (!formData.email) {
      setError('Please enter an email address.');
      return false;
    }

    if (!formData.role) {
      setError('Please select a role.');
      return false;
    }

    if (changePassword) {
      if (!formData.password) {
        setError('Please enter a password.');
        return false;
      }

      if (formData.password !== formData.confirm_password) {
        setError('Passwords do not match.');
        return false;
      }

      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return false;
      }
    }

    if (!formData.tenant_id && (formData.role !== 'admin' && formData.role !== 'hub_admin')) {
      setError('Please select a franchise for this user.');
      return false;
    }

    setValidated(true);
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Prepare data for submission
      const userData = {
        ...formData,
        // Remove confirm_password before sending to API
        confirm_password: undefined
      };

      // If user is admin or hub_admin, set tenant_id to null
      if (userData.role === 'admin' || userData.role === 'hub_admin') {
        userData.tenant_id = null;
      }

      // If not changing password, remove password field
      if (!changePassword) {
        userData.password = undefined;
      }

      const response = await adminAPI.updateUser(id, userData);

      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error updating user:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to update user. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/admin/users');
  };

  // Handle cancel
  const handleCancel = () => {
    setShowCancelModal(true);
  };

  // Get tenant options
  const getTenantOptions = () => {
    const options = [{ value: '', label: 'Select Franchise' }];

    tenants.forEach(tenant => {
      options.push({
        value: tenant.id,
        label: tenant.name
      });
    });

    return options;
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

  if (error && !originalUser) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="user-edit-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faUserEdit} className="me-2" />
          Edit User
        </h1>
        <div>
          <Button variant="secondary" className="me-2" onClick={handleCancel}>
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            <FontAwesomeIcon icon={faSave} className="me-2" />
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Row>
          <Col lg={8}>
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">User Information</h6>
              </Card.Header>
              <Card.Body>
                {error && (
                  <Alert variant="danger" className="mb-4">
                    {error}
                  </Alert>
                )}

                <Row>
                  <Col md={6}>
                    <TextInput
                      name="first_name"
                      label="First Name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      placeholder="Enter first name"
                    />
                  </Col>
                  <Col md={6}>
                    <TextInput
                      name="last_name"
                      label="Last Name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      placeholder="Enter last name"
                    />
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <TextInput
                      name="username"
                      label="Username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      placeholder="Enter username"
                      disabled // Username should not be editable
                    />
                  </Col>
                  <Col md={6}>
                    <TextInput
                      name="email"
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter email address"
                    />
                  </Col>
                </Row>

                <div className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="change-password"
                    label="Change Password"
                    checked={changePassword}
                    onChange={handleToggleChangePassword}
                  />
                </div>

                {changePassword && (
                  <Row>
                    <Col md={6}>
                      <PasswordInput
                        name="password"
                        label="New Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="Enter new password"
                      />
                    </Col>
                    <Col md={6}>
                      <PasswordInput
                        name="confirm_password"
                        label="Confirm New Password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        required
                        placeholder="Confirm new password"
                      />
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>

            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Role & Access</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <SelectInput
                      name="role"
                      label="Role"
                      value={formData.role}
                      onChange={handleChange}
                      options={roleOptions}
                      required
                      disabled={currentUser?.id === originalUser?.id} // Cannot change own role
                    />
                  </Col>
                  <Col md={6}>
                    <SelectInput
                      name="is_active"
                      label="Status"
                      value={formData.is_active}
                      onChange={handleChange}
                      options={statusOptions}
                      required
                      disabled={currentUser?.id === originalUser?.id} // Cannot deactivate own account
                    />
                  </Col>
                </Row>

                {formData.role !== 'admin' && formData.role !== 'hub_admin' && (
                  <SelectInput
                    name="tenant_id"
                    label="Franchise"
                    value={formData.tenant_id}
                    onChange={handleChange}
                    options={getTenantOptions()}
                    required
                    disabled={currentUser?.role !== 'admin' && currentUser?.role !== 'hub_admin'}
                  />
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Summary</h6>
              </Card.Header>
              <Card.Body>
                <div className="summary-item">
                  <span>Name:</span>
                  <span>{formData.first_name} {formData.last_name}</span>
                </div>
                <div className="summary-item">
                  <span>Username:</span>
                  <span>{formData.username}</span>
                </div>
                <div className="summary-item">
                  <span>Email:</span>
                  <span>{formData.email}</span>
                </div>
                <div className="summary-item">
                  <span>Role:</span>
                  <span>{roleOptions.find(r => r.value === formData.role)?.label || 'Not specified'}</span>
                </div>
                <div className="summary-item">
                  <span>Status:</span>
                  <span>{formData.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                {formData.role !== 'admin' && formData.role !== 'hub_admin' && (
                  <div className="summary-item">
                    <span>Franchise:</span>
                    <span>{tenants.find(t => t.id === formData.tenant_id)?.name || 'Not specified'}</span>
                  </div>
                )}

                <div className="d-grid gap-2 mt-4">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    <FontAwesomeIcon icon={faSave} className="me-2" />
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Help</h6>
              </Card.Header>
              <Card.Body>
                <Alert variant="info">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  <strong>Note:</strong> Username cannot be changed after a user is created.
                </Alert>
                <p>
                  <strong>Role:</strong> Determines the user's permissions and access level in the system.
                </p>
                <p>
                  <strong>Franchise:</strong> The franchise this user belongs to. Only required for non-admin users.
                </p>
                {changePassword && (
                  <p>
                    <strong>Password:</strong> Must be at least 8 characters long.
                  </p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={handleSuccessModalClose}
        title="User Updated"
        message="The user has been successfully updated."
      />

      {/* Error Modal */}
      <ErrorModal
        show={showErrorModal}
        onHide={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        onConfirm={() => navigate('/admin/users')}
        title="Cancel Editing"
        message="Are you sure you want to cancel? All unsaved changes will be lost."
        confirmText="Yes, Cancel"
        cancelText="No, Continue Editing"
      />
    </div>
  );
};

export default UserEdit;
