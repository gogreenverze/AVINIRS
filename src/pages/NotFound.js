import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faHome, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import '../styles/NotFound.css';

const NotFound = () => {
  return (
    <Container className="not-found-container">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <div className="text-center">
            <div className="error-icon">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <h1 className="error-code">404</h1>
            <h2 className="error-title">Page Not Found</h2>
            <p className="error-message">
              The page you are looking for might have been removed, had its name changed,
              or is temporarily unavailable.
            </p>
            <div className="mt-4">
              <Link to="/" className="btn btn-primary me-3">
                <FontAwesomeIcon icon={faHome} className="me-2" />
                Go to Dashboard
              </Link>
              <Button variant="secondary" onClick={() => window.history.back()}>
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                Go Back
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound;
