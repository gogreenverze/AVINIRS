// FranchiseView.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, Button, Badge, Row, Col, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faEdit, faTrash, faBuilding, faMapMarkerAlt,
  faPhone, faQrcode, faCheckCircle, faTimesCircle, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api'; // Assuming you have a similar adminAPI for franchises
import {
  DeleteConfirmationModal,
  SuccessModal,
  ErrorModal
} from '../../components/common';


const FranchiseView = () => {
  const { id } = useParams();

  // State for franchise
  const [franchise, setFranchise] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [franchies,setFranchies] = useState([]);


  // Fetch franchise
  useEffect(() => {
    const fetchFranchise = async () => {
      try {
        setLoading(true);
        setError(null);

        // Replace with your actual API call to get franchise by ID
        // For demonstration, we'll simulate an API call with the provided data
        // const dummyFranchises = [
        //   {
        //     "address": "45 DB Road, RS Puram, Coimbatore, Tamil Nadu",
        //     "contact_phone": "9876543211",
        //     "id": 2,
        //     "is_active": true,
        //     "is_hub": false,
        //     "name": "AVINI Labs Coimbatore",
        //     "site_code": "CBE"
        //   },
        //   {
        //     "address": "78 North Veli Street, Madurai, Tamil Nadu",
        //     "contact_phone": "9876543212",
        //     "id": 3,
        //     "is_active": true,
        //     "is_hub": false,
        //     "name": "AVINI Labs Madurai",
        //     "site_code": "MDU"
        //   }
        // ];

        // const foundFranchise = dummyFranchises?.find(f => f.id === parseInt(id));

        //    const userResponse = await adminAPI.getUserById(id);
        //         setFranchies(userResponse.data);

        // if (foundFranchise) {
        //   setFranchise(foundFranchise);
        // } else {
        //   setError('Franchise not found.');
        // }

        // If you have a real API:
        const response = await adminAPI.getFranchiseById(id);
        setFranchise(response.data);

      } catch (err) {
        console.error('Error fetching franchise:', err);
        setError('Failed to load franchise data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFranchise();
  }, [id]);

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    setShowDeleteModal(true);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      // Replace with your actual API call to delete franchise
      // await adminAPI.deleteFranchise(id);

      setShowDeleteModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error deleting franchise:', err);
      setErrorMessage('Failed to delete franchise. Please try again.');
      setShowDeleteModal(false);
      setShowErrorModal(true);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading franchise data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="text-center my-5">
        {error}
      </Alert>
    );
  }

  if (!franchise) {
    return (
      <Alert variant="warning" className="text-center my-5">
        Franchise not found.
      </Alert>
    );
  }

  return (
    <div className="franchise-view-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faBuilding} className="me-2" />
          Franchise Details
        </h1>
        <div>
          <Link to="/admin" className="btn btn-secondary me-2">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to List
          </Link>
          <Link to={`/admin/franchises/${id}/edit`} className="btn btn-primary me-2">
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Edit
          </Link>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            Delete
          </Button>
        </div>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Franchise Information</h6>
            </Card.Header>
            <Card.Body>
              <div className="franchise-profile">
                <div className="franchise-avatar">
                  <div className="avatar-placeholder">
                    {franchise.name.charAt(0)}
                  </div>
                </div>
                <div className="franchise-info">
                  <h4>{franchise.name}</h4>
                  <div className="franchise-meta">
                    <Badge bg={franchise.is_hub ? 'primary' : 'info'}>
                      {franchise.is_hub ? 'Hub' : 'Branch'}
                    </Badge>
                    <Badge bg={franchise.is_active ? 'success' : 'danger'} className="ms-2">
                      {franchise.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="franchise-details mt-4">
                <Row>
                  <Col md={6}>
                    <div className="detail-item">
                      <div className="detail-icon">
                        <FontAwesomeIcon icon={faQrcode} />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Site Code</div>
                        <div className="detail-value">{franchise.site_code}</div>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="detail-item">
                      <div className="detail-icon">
                        <FontAwesomeIcon icon={faPhone} />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Contact Phone</div>
                        <div className="detail-value">{franchise.contact_phone}</div>
                      </div>
                    </div>
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col xs={12}>
                    <div className="detail-item">
                      <div className="detail-icon">
                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Address</div>
                        <div className="detail-value">{franchise.address}</div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Status and Type</h6>
            </Card.Header>
            <Card.Body>
              <div className="status-item">
                <div className="status-label">Operational Status</div>
                <div className="status-value">
                  {franchise.is_active ? (
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
                <div className="status-label">Franchise Type</div>
                <div className="status-value">
                  {franchise.is_hub ? (
                    <Badge bg="primary" className="status-badge">
                      <FontAwesomeIcon icon={faBuilding} className="me-1" />
                      Hub Location
                    </Badge>
                  ) : (
                    <Badge bg="info" className="status-badge">
                      <FontAwesomeIcon icon={faBuilding} className="me-1" />
                      Branch Location
                    </Badge>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Associated Data</h6>
            </Card.Header>
            <Card.Body>
              <Alert variant="info">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                Additional associated data (e.g., linked users, daily reports) would appear here.
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Franchise"
        message={`Are you sure you want to delete the franchise "${franchise.name}"? This action cannot be undone.`}
      />

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        title="Success"
        message="Franchise has been deleted successfully."
        redirectTo="/admin/franchises"
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

export default FranchiseView;