import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Row, Col, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faEdit, faVial, faClipboardCheck, faFileInvoiceDollar,
  faUser, faVenusMars, faBirthdayCake, faPhone, faEnvelope,
  faMapMarkerAlt, faIdCard, faTint, faUserMd
} from '@fortawesome/free-solid-svg-icons';
import { patientAPI } from '../../services/api';
import '../../styles/PatientView.css';

const PatientView = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await patientAPI.getPatientById(id);
        setPatient(response.data);
      } catch (err) {
        console.error('Error fetching patient:', err);
        setError('Failed to load patient details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading patient details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        {error}
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="alert alert-warning m-4" role="alert">
        Patient not found.
      </div>
    );
  }

  return (
    <div className="patient-view-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faUser} className="me-2" />
          Patient Details
        </h1>
        <div>
          <Link to="/patients" className="btn btn-secondary me-2">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to List
          </Link>
          <Link to={`/patients/${id}/edit`} className="btn btn-primary">
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Edit Patient
          </Link>
        </div>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">
                {patient.first_name} {patient.last_name}
                <span className="badge bg-primary float-end">ID: {patient.patient_id}</span>
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="patient-detail-item">
                    <FontAwesomeIcon icon={faVenusMars} className="me-2 text-primary" />
                    <strong>Gender:</strong>
                    <span>{patient.gender}</span>
                  </div>
                  <div className="patient-detail-item">
                    <FontAwesomeIcon icon={faBirthdayCake} className="me-2 text-primary" />
                    <strong>Date of Birth:</strong>
                    <span>{new Date(patient.date_of_birth).toLocaleDateString()}</span>
                  </div>
                  <div className="patient-detail-item">
                    <FontAwesomeIcon icon={faPhone} className="me-2 text-primary" />
                    <strong>Phone:</strong>
                    <span>{patient.phone || 'Not provided'}</span>
                  </div>
                  <div className="patient-detail-item">
                    <FontAwesomeIcon icon={faEnvelope} className="me-2 text-primary" />
                    <strong>Email:</strong>
                    <span>{patient.email || 'Not provided'}</span>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="patient-detail-item">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-primary" />
                    <strong>Address:</strong>
                    <span>{patient.address || 'Not provided'}</span>
                  </div>
                  <div className="patient-detail-item">
                    <FontAwesomeIcon icon={faIdCard} className="me-2 text-primary" />
                    <strong>Insurance Provider:</strong>
                    <span>{patient.insurance_provider || 'Not provided'}</span>
                  </div>
                  <div className="patient-detail-item">
                    <FontAwesomeIcon icon={faIdCard} className="me-2 text-primary" />
                    <strong>Insurance ID:</strong>
                    <span>{patient.insurance_id || 'Not provided'}</span>
                  </div>
                  <div className="patient-detail-item">
                    <FontAwesomeIcon icon={faTint} className="me-2 text-primary" />
                    <strong>Blood Group:</strong>
                    <span>{patient.blood_group || 'Not provided'}</span>
                  </div>
                </Col>
              </Row>

              <hr />

              <Row>
                <Col md={6}>
                  <div className="patient-detail-item">
                    <FontAwesomeIcon icon={faUserMd} className="me-2 text-primary" />
                    <strong>Emergency Contact:</strong>
                    <span>{patient.emergency_contact || 'Not provided'}</span>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="patient-detail-item">
                    <FontAwesomeIcon icon={faPhone} className="me-2 text-primary" />
                    <strong>Emergency Phone:</strong>
                    <span>{patient.emergency_phone || 'Not provided'}</span>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold">Related Information</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <Link to={`/samples?patient_id=${patient.id}`} className="btn btn-info btn-block w-100">
                  <FontAwesomeIcon icon={faVial} className="me-2" /> View Samples
                </Link>
              </div>
              <div className="mb-3">
                <Link to={`/results?patient_id=${patient.id}`} className="btn btn-success btn-block w-100">
                  <FontAwesomeIcon icon={faClipboardCheck} className="me-2" /> View Results
                </Link>
              </div>
              <div className="mb-3">
                <Link to={`/billing?patient_id=${patient.id}`} className="btn btn-warning btn-block w-100">
                  <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" /> View Billing
                </Link>
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold">Quick Actions</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <Link to={`/samples/create?patient_id=${patient.id}`} className="btn btn-primary btn-block w-100">
                  <FontAwesomeIcon icon={faVial} className="me-2" /> New Sample
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PatientView;
