import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Button, Form, InputGroup, Pagination, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faPlus, faEye, faEdit, faFlask, 
  faVenusMars, faBirthdayCake, faPhone, faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import { patientAPI } from '../../services/api';
import '../../styles/PatientList.css';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch patients data
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        if (searchQuery) {
          response = await patientAPI.searchPatients(searchQuery);
        } else {
          response = await patientAPI.getAllPatients(currentPage);
        }
        
        setPatients(response.data.items);
        setTotalPages(response.data.total_pages);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Failed to load patients. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [currentPage, searchQuery]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  // Handle pagination
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    
    // Previous button
    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      />
    );
    
    // First page
    items.push(
      <Pagination.Item 
        key={1} 
        active={currentPage === 1}
        onClick={() => handlePageChange(1)}
      >
        1
      </Pagination.Item>
    );
    
    // Ellipsis if needed
    if (currentPage > 3) {
      items.push(<Pagination.Ellipsis key="ellipsis1" disabled />);
    }
    
    // Pages around current page
    for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page++) {
      items.push(
        <Pagination.Item 
          key={page} 
          active={currentPage === page}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }
    
    // Ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
    }
    
    // Last page if not first page
    if (totalPages > 1) {
      items.push(
        <Pagination.Item 
          key={totalPages} 
          active={currentPage === totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    // Next button
    items.push(
      <Pagination.Next 
        key="next" 
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      />
    );
    
    return items;
  };

  return (
    <div className="patient-list-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Patients</h1>
        <Link to="/patients/create" className="btn btn-primary">
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          New Patient
        </Link>
      </div>

      {/* Search Card */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Search Patients</h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search by name, ID, or phone number..."
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
          <p className="mt-2">Loading patients...</p>
        </div>
      )}

      {/* Desktop View */}
      {!loading && !error && !isMobile && (
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              Patient List
              <span className="badge bg-primary float-end">
                {patients.length} Records
              </span>
            </h6>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table className="table-hover" width="100%" cellSpacing="0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Gender</th>
                    <th>Date of Birth</th>
                    <th>Phone</th>
                    <th>Registration Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(patient => (
                    <tr key={patient.id}>
                      <td>{patient.patient_id}</td>
                      <td>{patient.first_name} {patient.last_name}</td>
                      <td>{patient.gender}</td>
                      <td>{new Date(patient.date_of_birth).toLocaleDateString()}</td>
                      <td>{patient.phone}</td>
                      <td>{new Date(patient.created_at).toLocaleDateString()}</td>
                      <td>
                        <Link to={`/patients/${patient.id}`} className="btn btn-info btn-sm me-1">
                          <FontAwesomeIcon icon={faEye} />
                        </Link>
                        <Link to={`/patients/${patient.id}/edit`} className="btn btn-primary btn-sm me-1">
                          <FontAwesomeIcon icon={faEdit} />
                        </Link>
                        <Link to={`/samples?patient_id=${patient.id}`} className="btn btn-success btn-sm">
                          <FontAwesomeIcon icon={faFlask} /> Samples
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Mobile View */}
      {!loading && !error && isMobile && (
        <div className="mobile-patient-list">
          <div className="record-count mb-3">
            <span className="badge bg-primary">
              {patients.length} Records
            </span>
          </div>

          {patients.map(patient => (
            <Card key={patient.id} className="mb-3 mobile-card">
              <Card.Header className="py-2">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="card-title mb-0">{patient.first_name} {patient.last_name}</h6>
                  <span className="badge bg-primary">ID: {patient.patient_id}</span>
                </div>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="patient-info mb-3">
                  <div className="d-flex align-items-center mb-1">
                    <FontAwesomeIcon icon={faVenusMars} className="me-2 text-primary" />
                    <strong>Gender:</strong>
                    <span className="ms-2">{patient.gender}</span>
                  </div>
                  <div className="d-flex align-items-center mb-1">
                    <FontAwesomeIcon icon={faBirthdayCake} className="me-2 text-primary" />
                    <strong>Date of Birth:</strong>
                    <span className="ms-2">{new Date(patient.date_of_birth).toLocaleDateString()}</span>
                  </div>
                  <div className="d-flex align-items-center mb-1">
                    <FontAwesomeIcon icon={faPhone} className="me-2 text-primary" />
                    <strong>Phone:</strong>
                    <span className="ms-2">{patient.phone}</span>
                  </div>
                  {patient.email && (
                    <div className="d-flex align-items-center">
                      <FontAwesomeIcon icon={faEnvelope} className="me-2 text-primary" />
                      <strong>Email:</strong>
                      <span className="ms-2">{patient.email}</span>
                    </div>
                  )}
                </div>

                <div className="mobile-btn-group">
                  <Link to={`/patients/${patient.id}`} className="btn btn-info">
                    <FontAwesomeIcon icon={faEye} className="me-1" /> View
                  </Link>
                  <Link to={`/patients/${patient.id}/edit`} className="btn btn-primary">
                    <FontAwesomeIcon icon={faEdit} className="me-1" /> Edit
                  </Link>
                  <Link to={`/samples?patient_id=${patient.id}`} className="btn btn-success">
                    <FontAwesomeIcon icon={faFlask} className="me-1" /> Samples
                  </Link>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>{renderPaginationItems()}</Pagination>
        </div>
      )}
    </div>
  );
};

export default PatientList;
