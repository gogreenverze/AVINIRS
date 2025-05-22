import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faArrowLeft, faSave, faInfoCircle, faUserPlus
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import {
  TextInput,
  SelectInput,
  PasswordInput,
  FormSection,
  SuccessModal,
  ErrorModal
} from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import '../../styles/UserCreate.css';

const UserCreate = () => {
  const navigate = useNavigate();
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

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tenants, setTenants] = useState([]);

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

  // Fetch tenants
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);

        const response = await adminAPI.getFranchises();
        setTenants(response.data);

        // If current user is not a hub admin, set tenant_id to current user's tenant
        if (currentUser?.role !== 'admin' && currentUser?.role !== 'hub_admin' && currentUser?.tenant_id) {
          setFormData(prevData => ({
            ...prevData,
            tenant_id: currentUser.tenant_id
          }));
        }
      } catch (err) {
        console.error('Error fetching tenants:', err);
        setError('Failed to load franchises. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [currentUser]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Generate username
  const generateUsername = () => {
    if (!formData.first_name || !formData.last_name) {
      setError('Please enter first name and last name to generate username.');
      return;
    }

    const firstName = formData.first_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const lastName = formData.last_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    const username = `${firstName}.${lastName}${randomNum}`;

    setFormData(prevData => ({
      ...prevData,
      username
    }));
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
      setError('Please enter a username or generate one.');
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

      const response = await adminAPI.createUser(userData);

      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error creating user:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to create user. Please try again.');
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

  return (
    <div className="user-create-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faUserPlus} className="me-2" />
          Add New User
        </h1>
        <div>
          <Link to="/admin/users" className="btn btn-secondary me-2">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to List
          </Link>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            <FontAwesomeIcon icon={faSave} className="me-2" />
            {submitting ? 'Saving...' : 'Save'}
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
                    <div className="mb-3">
                      <Form.Label>
                        Username <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="input-group">
                        <Form.Control
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          required
                          placeholder="Enter username"
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={generateUsername}
                        >
                          Generate
                        </Button>
                      </div>
                    </div>
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

                <Row>
                  <Col md={6}>
                    <PasswordInput
                      name="password"
                      label="Password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Enter password"
                    />
                  </Col>
                  <Col md={6}>
                    <PasswordInput
                      name="confirm_password"
                      label="Confirm Password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      required
                      placeholder="Confirm password"
                    />
                  </Col>
                </Row>
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
                    disabled={currentUser?.role !== 'admin' && currentUser?.role !== 'hub_admin' && currentUser?.role !== 'franchise_admin'}
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
                  <span>{formData.username || 'Not specified'}</span>
                </div>
                <div className="summary-item">
                  <span>Email:</span>
                  <span>{formData.email || 'Not specified'}</span>
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
                    {submitting ? 'Saving...' : 'Create User'}
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
                  <strong>Username</strong> must be unique. You can generate a username automatically by clicking the "Generate" button.
                </Alert>
                <p>
                  <strong>Role:</strong> Determines the user's permissions and access level in the system.
                </p>
                <p>
                  <strong>Franchise:</strong> The franchise this user belongs to. Only required for non-admin users.
                </p>
                <p>
                  <strong>Password:</strong> Must be at least 8 characters long.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={handleSuccessModalClose}
        title="User Created"
        message="The user has been successfully created."
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

export default UserCreate;
