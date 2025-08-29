import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Button, Form, InputGroup, Badge, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faPlus, faEye, faEdit, faTrash, faUserMd,
  faPhone, faEnvelope, faMapMarkerAlt, faFileExcel, faFileImport
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ResponsiveDataTable from '../../components/admin/ResponsiveDataTable';
import MobilePageHeader from '../../components/common/MobilePageHeader';
import {
  DeleteConfirmationModal,
  SuccessModal,
  ErrorModal
} from '../../components/common';

const DoctorManagement = () => {
  const { currentUser } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [doctorToDelete, setDoctorToDelete] = useState(null);

  // Fetch doctors on component mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await adminAPI.getDoctors();
        setDoctors(response.data.data || []);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('Failed to load doctors. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Filter doctors based on search query
  const filteredDoctors = doctors.filter(doctor => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      doctor.first_name?.toLowerCase().includes(query) ||
      doctor.last_name?.toLowerCase().includes(query) ||
      doctor.email?.toLowerCase().includes(query) ||
      doctor.phone?.toLowerCase().includes(query) ||
      doctor.specialty?.toLowerCase().includes(query) ||
      doctor.license_number?.toLowerCase().includes(query)
    );
  });

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (doctor) => {
    setDoctorToDelete(doctor);
    setShowDeleteModal(true);
  };

  // Handle delete doctor
  const handleDelete = async () => {
    try {
      await adminAPI.deleteDoctor(doctorToDelete.id);
      setDoctors(doctors.filter(doctor => doctor.id !== doctorToDelete.id));
      setShowDeleteModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error deleting doctor:', err);
      setErrorMessage('Failed to delete doctor. Please try again.');
      setShowDeleteModal(false);
      setShowErrorModal(true);
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Inactive':
        return 'secondary';
      case 'Suspended':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value, row) => (
        <div className="d-flex align-items-center">
          <div className="avatar avatar-sm me-3">
            <div className="avatar-initial bg-primary rounded-circle">
              <FontAwesomeIcon icon={faUserMd} className="text-white" />
            </div>
          </div>
          <div>
            <Link to={`/admin/doctors/${row.id}`} className="text-decoration-none fw-bold">
              Dr. {row.first_name} {row.last_name}
            </Link>
            <div className="text-muted small">
              {row.qualification || 'N/A'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'specialty',
      label: 'Specialty',
      render: (value, row) => row.specialty || 'General'
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (value, row) => (
        <div>
          <div>
            <FontAwesomeIcon icon={faPhone} className="me-1 text-muted" />
            {row.phone || 'N/A'}
          </div>
          <div>
            <FontAwesomeIcon icon={faEnvelope} className="me-1 text-muted" />
            {row.email || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'license_number',
      label: 'License',
      render: (value, row) => row.license_number || 'N/A'
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => (
        <Badge bg={getStatusBadgeVariant(row.status || 'Active')}>
          {row.status || 'Active'}
        </Badge>
      )
    }
  ];

  // Mobile card configuration
  const mobileCardConfig = {
    title: (doctor) => `Dr. ${doctor.first_name} ${doctor.last_name}`,
    subtitle: (doctor) => doctor.specialty || 'General',
    primaryField: 'phone',
    secondaryField: 'email',
    statusField: 'status'
  };

  // Handle doctor actions
  const handleViewDoctor = (doctor) => {
    window.location.href = `/admin/doctors/${doctor.id}`;
  };

  const handleEditDoctor = (doctor) => {
    window.location.href = `/admin/doctors/${doctor.id}/edit`;
  };

  return (
    <div className="doctor-management-container">
      <MobilePageHeader
        title="Doctor Management"
        subtitle="Manage referring doctors and their details"
        icon={faUserMd}
        primaryAction={(currentUser?.role === 'admin' || currentUser?.role === 'hub_admin') ? {
          label: "Add New Doctor",
          shortLabel: "Add Doctor",
          icon: faPlus,
          onClick: () => window.location.href = "/admin/doctors/create",
          variant: "primary"
        } : null}
        secondaryActions={[
          {
            label: "Export Doctors",
            shortLabel: "Export",
            icon: faFileExcel,
            onClick: () => console.log("Export doctors"),
            variant: "outline-success"
          },
          {
            label: "Import Doctors",
            shortLabel: "Import",
            icon: faFileImport,
            onClick: () => console.log("Import doctors"),
            variant: "outline-info"
          }
        ]}
        breadcrumbs={[
          { label: "Admin", shortLabel: "Admin", link: "/admin" },
          { label: "Doctor Management", shortLabel: "Doctors" }
        ]}
      />

      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
            <h6 className="m-0 font-weight-bold text-primary">
              <FontAwesomeIcon icon={faUserMd} className="me-2 d-lg-none" />
              Doctors ({filteredDoctors.length})
            </h6>
            <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-lg-auto">
              <InputGroup style={{ minWidth: '200px' }}>
                <Form.Control
                  type="text"
                  placeholder="Search doctors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
              data={filteredDoctors}
              columns={columns}
              onEdit={(currentUser?.role === 'admin' || currentUser?.role === 'hub_admin') ? handleEditDoctor : null}
              onDelete={(currentUser?.role === 'admin' || currentUser?.role === 'hub_admin') ? handleDeleteConfirm : null}
              onViewDetails={handleViewDoctor}
              loading={loading}
              emptyMessage="No doctors found. Click 'Add Doctor' to create a new doctor."
              mobileCardConfig={mobileCardConfig}
            />
          )}
        </Card.Body>
      </Card>

      {/* Statistics Cards */}
      {!loading && !error && doctors.length > 0 && (
        <Row>
          <Col md={6} xl={3} className="mb-4">
            <Card className="border-left-primary shadow h-100 py-2">
              <Card.Body>
                <div className="row no-gutters align-items-center">
                  <div className="col mr-2">
                    <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                      Total Doctors
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                      {doctors.length}
                    </div>
                  </div>
                  <div className="col-auto">
                    <FontAwesomeIcon icon={faUserMd} className="fa-2x text-gray-300" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6} xl={3} className="mb-4">
            <Card className="border-left-success shadow h-100 py-2">
              <Card.Body>
                <div className="row no-gutters align-items-center">
                  <div className="col mr-2">
                    <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                      Active Doctors
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                      {doctors.filter(d => d.status === 'Active' || !d.status).length}
                    </div>
                  </div>
                  <div className="col-auto">
                    <FontAwesomeIcon icon={faUserMd} className="fa-2x text-gray-300" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Doctor"
        message={`Are you sure you want to delete Dr. ${doctorToDelete?.first_name} ${doctorToDelete?.last_name}? This action cannot be undone.`}
      />

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        title="Success"
        message="Doctor has been deleted successfully."
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

export default DoctorManagement;
