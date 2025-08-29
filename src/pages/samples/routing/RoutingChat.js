import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Alert, Breadcrumb, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faComments, faVial, faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { routingAPI } from '../../../services/api';
import ChatInterface from '../../../components/routing/ChatInterface';
import '../../../styles/SampleRoutingSystem.css';

const RoutingChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [routing, setRouting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRouting();
  }, [id]);

  const fetchRouting = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await routingAPI.getRoutingById(id);
      setRouting(response.data);
    } catch (err) {
      console.error('Error fetching routing:', err);
      setError('Failed to load routing details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid px-4">
        <Alert variant="danger" className="mt-4">
          <FontAwesomeIcon icon={faTimesCircle} className="me-2" />
          {error}
          <div className="mt-2">
            <Button variant="outline-danger" size="sm" onClick={() => navigate('/samples/routing')}>
              <FontAwesomeIcon icon={faArrowLeft} className="me-1" />
              Back to Routing
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (!routing) {
    return (
      <div className="container-fluid px-4">
        <Alert variant="warning" className="mt-4">
          <FontAwesomeIcon icon={faTimesCircle} className="me-2" />
          Routing not found.
          <div className="mt-2">
            <Button variant="outline-warning" size="sm" onClick={() => navigate('/samples/routing')}>
              <FontAwesomeIcon icon={faArrowLeft} className="me-1" />
              Back to Routing
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/samples/routing' }}>
          Sample Routing
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/samples/routing/${id}` }}>
          {routing.sample?.sample_id || 'Unknown Sample'}
        </Breadcrumb.Item>
        <Breadcrumb.Item active>
          Chat
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 mb-0 text-gray-800">
            <FontAwesomeIcon icon={faComments} className="me-2" />
            Chat - {routing.sample?.sample_id || 'N/A'}
          </h1>
          <p className="text-muted mb-0">
            Secure communication for routing: <code>{routing.tracking_number}</code>
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => navigate(`/samples/routing/${id}`)}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-1" />
            Back to Routing
          </Button>
        </div>
      </div>

      {/* Routing Info Card */}
      <Card className="shadow mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-1">
                <FontAwesomeIcon icon={faVial} className="me-1" />
                {routing.sample?.sample_id} - {routing.sample?.sample_type}
              </h6>
              <p className="text-muted mb-0">
                {routing.from_tenant?.name} → {routing.to_tenant?.name}
              </p>
            </div>
            <div className="text-end">
              <p className="mb-0">
                <strong>Status:</strong> {routing.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
              <p className="mb-0 text-muted">
                <strong>Priority:</strong> {routing.priority || 'normal'}
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Chat Interface */}
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <ChatInterface routingId={routing.id} />
        </div>
      </div>
    </div>
  );
};

export default RoutingChat;
