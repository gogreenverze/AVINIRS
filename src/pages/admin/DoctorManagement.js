import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Button, Form, InputGroup, Badge, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faPlus, faEye, faEdit, faTrash, faUserMd,
  faPhone, faEnvelope, faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DoctorManagement = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Handle delete doctor
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await adminAPI.deleteDoctor(id);
        setDoctors(doctors.filter(doctor => doctor.id !== id));
      } catch (err) {
        console.error('Error deleting doctor:', err);
        setError('Failed to delete doctor. Please try again.');
      }
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

  return (
    <div className="doctor-management-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faUserMd} className="me-2" />
          Doctor Management
        </h1>
        {(user?.role === 'admin' || user?.role === 'hub_admin') && (
          <Link to="/admin/doctors/create" className="btn btn-primary">
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add Doctor
          </Link>
        )}
      </div>

      {/* Search Card */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Search Doctors</h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search by name, email, phone, specialty, or license number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="primary" type="submit">
                <FontAwesomeIcon icon={faSearch} />
              </Button>
            </InputGroup>
          </Form>
        </Card.Body>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Loading Message */}
      {loading && (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading doctors...</p>
        </div>
      )}

      {/* Doctors Table */}
      {!loading && !error && (
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              Doctors List
              <span className="badge bg-primary float-end">
                {filteredDoctors.length} Records
              </span>
            </h6>
          </Card.Header>
          <Card.Body>
            {filteredDoctors.length === 0 ? (
              <div className="text-center py-4">
                <FontAwesomeIcon icon={faUserMd} size="3x" className="text-gray-300 mb-3" />
                <p className="text-gray-500">No doctors found.</p>
                {(user?.role === 'admin' || user?.role === 'hub_admin') && (
                  <Link to="/admin/doctors/create" className="btn btn-primary">
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Add First Doctor
                  </Link>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="table-hover" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Specialty</th>
                      <th>Contact</th>
                      <th>License</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDoctors.map(doctor => (
                      <tr key={doctor.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-sm me-3">
                              <div className="avatar-initial bg-primary rounded-circle">
                                <FontAwesomeIcon icon={faUserMd} className="text-white" />
                              </div>
                            </div>
                            <div>
                              <div className="fw-bold">
                                Dr. {doctor.first_name} {doctor.last_name}
                              </div>
                              <div className="text-muted small">
                                {doctor.qualification || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{doctor.specialty || 'General'}</td>
                        <td>
                          <div>
                            <FontAwesomeIcon icon={faPhone} className="me-1 text-muted" />
                            {doctor.phone || 'N/A'}
                          </div>
                          <div>
                            <FontAwesomeIcon icon={faEnvelope} className="me-1 text-muted" />
                            {doctor.email || 'N/A'}
                          </div>
                        </td>
                        <td>{doctor.license_number || 'N/A'}</td>
                        <td>
                          <Badge bg={getStatusBadgeVariant(doctor.status || 'Active')}>
                            {doctor.status || 'Active'}
                          </Badge>
                        </td>
                        <td>
                          <Link to={`/admin/doctors/${doctor.id}`} className="btn btn-info btn-sm me-1">
                            <FontAwesomeIcon icon={faEye} />
                          </Link>
                          {(user?.role === 'admin' || user?.role === 'hub_admin') && (
                            <>
                              <Link to={`/admin/doctors/${doctor.id}/edit`} className="btn btn-warning btn-sm me-1">
                                <FontAwesomeIcon icon={faEdit} />
                              </Link>
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => handleDelete(doctor.id)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

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
    </div>
  );
};

export default DoctorManagement;
