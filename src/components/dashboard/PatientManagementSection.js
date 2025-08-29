import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Form, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faUserPlus, faSearch, faEye, faEdit, faCalendarAlt,
  faPhone, faEnvelope, faMapMarkerAlt, faFilter, faDownload
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';

const PatientManagementSection = ({ data, userRole }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch patients data
  const fetchPatients = async (page = 1, search = '', status = 'all') => {
    try {
      setLoading(true);
      // Use mock data for now since we don't have a specific patient API endpoint
      const mockPatients = data?.recent_activities?.patients || [];
      setPatients(mockPatients.slice(0, 10)); // Show first 10
      setTotalPages(1);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(currentPage, searchTerm, filterStatus);
  }, [currentPage, searchTerm, filterStatus]);

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Handle filter change
  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get patient status badge
  const getStatusBadge = (patient) => {
    const lastVisit = patient.last_visit_date;
    if (!lastVisit) return <Badge bg="secondary">New</Badge>;
    
    const daysSinceVisit = Math.floor((Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceVisit <= 7) return <Badge bg="success">Recent</Badge>;
    if (daysSinceVisit <= 30) return <Badge bg="warning">Regular</Badge>;
    return <Badge bg="info">Returning</Badge>;
  };

  return (
    <div className="patient-management-section p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">
            <FontAwesomeIcon icon={faUsers} className="me-2 text-primary" />
            Patient Management
          </h4>
          <p className="text-white mb-0">
            Manage patient records, demographics, and visit history
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm">
            <FontAwesomeIcon icon={faDownload} className="me-1" />
            Export
          </Button>
          <Link to="/patients/create" className="btn btn-primary btn-sm">
            <FontAwesomeIcon icon={faUserPlus} className="me-1" />
            Add Patient
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="text-center border-primary">
            <Card.Body>
              <h3 className="text-primary">{data?.overview?.total_patients || 0}</h3>
              <p className="mb-0 text-white">Total Patients</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center border-success">
            <Card.Body>
              <h3 className="text-success">{data?.overview?.today_patients || 0}</h3>
              <p className="mb-0 text-white">Today's Patients</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center border-warning">
            <Card.Body>
              <h3 className="text-warning">{data?.overview?.monthly_patients || 0}</h3>
              <p className="mb-0 text-white">This Month</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center border-info">
            <Card.Body>
              <h3 className="text-info">
                {patients.filter(p => p.gender === 'Female').length}
              </h3>
              <p className="mb-0 text-white">Female Patients</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filter */}
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <FontAwesomeIcon icon={faSearch} />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search patients by name, phone, or ID..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </InputGroup>
        </Col>
        <Col md={6}>
          <div className="d-flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => handleFilterChange('all')}
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'new' ? 'success' : 'outline-success'}
              size="sm"
              onClick={() => handleFilterChange('new')}
            >
              New
            </Button>
            <Button
              variant={filterStatus === 'recent' ? 'warning' : 'outline-warning'}
              size="sm"
              onClick={() => handleFilterChange('recent')}
            >
              Recent
            </Button>
            <Button
              variant={filterStatus === 'returning' ? 'info' : 'outline-info'}
              size="sm"
              onClick={() => handleFilterChange('returning')}
            >
              Returning
            </Button>
          </div>
        </Col>
      </Row>

      {/* Recent Patients Table */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <h6 className="mb-0 text-black">
            <FontAwesomeIcon icon={faUsers} className="me-2" />
            Recent Patients
          </h6>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : patients.length > 0 ? (
            <div className="table-responsive">
              <Table className="table-hover mb-0">
                <thead className="table-black">
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Age/Gender</th>
                    <th>Last Visit</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        <code>{patient.his_no || patient.id}</code>
                      </td>
                      <td>
                        <div>
                          <strong>{patient.first_name} {patient.last_name}</strong>
                          {patient.email && (
                            <div className=" small">
                              <FontAwesomeIcon icon={faEnvelope} className="me-1" />
                              {patient.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          {patient.mobile && (
                            <div className='text-black'>
                              <FontAwesomeIcon icon={faPhone} className="me-1 text-black" />
                              {patient.mobile}
                            </div>
                          )}
                          {patient.address && (
                            <div className=" small">
                              <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" />
                              {patient.address.substring(0, 30)}...
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          {patient.age && <span>{patient.age}Y</span>}
                          {patient.gender && (
                            <Badge 
                             
                              className="ms-1"
                            >
                              {patient.gender}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                          {formatDate(patient.last_visit_date || patient.created_at)}
                        </div>
                      </td>
                      <td>
                        {getStatusBadge(patient)}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Link 
                            to={`/patients/${patient.id}`}
                            className="btn btn-sm btn-outline-primary"
                            title="View Patient"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </Link>
                          <Link 
                            to={`/patients/${patient.id}/edit`}
                            className="btn btn-sm btn-outline-secondary"
                            title="Edit Patient"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4">
              <FontAwesomeIcon icon={faUsers} size="3x" className="text-white mb-3" />
              <h5>No Patients Found</h5>
              <p className="text-white">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No patients match your search criteria.'
                  : 'No patients have been registered yet.'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Link to="/patients/create" className="btn btn-primary">
                  <FontAwesomeIcon icon={faUserPlus} className="me-1" />
                  Add First Patient
                </Link>
              )}
            </div>
          )}
        </Card.Body>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Card.Footer className="bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-white">
                Page {currentPage} of {totalPages}
              </small>
              <div className="d-flex gap-1">
                <Button
                  variant="outline-primary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card.Footer>
        )}
      </Card>
    </div>
  );
};

export default PatientManagementSection;
