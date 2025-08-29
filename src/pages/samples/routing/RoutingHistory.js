import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Alert, Breadcrumb, Button, Row, Col, Badge, Timeline } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faHistory, faVial, faTimesCircle, faCheckCircle,
  faUser, faClock, faComments, faFileAlt, faBell
} from '@fortawesome/free-solid-svg-icons';
import { routingAPI } from '../../../services/api';
import '../../../styles/SampleRoutingSystem.css';

const RoutingHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [routing, setRouting] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRoutingAndHistory();
  }, [id]);

  const fetchRoutingAndHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [routingResponse, historyResponse] = await Promise.all([
        routingAPI.getRoutingById(id),
        routingAPI.getRoutingHistory(id)
      ]);
      
      setRouting(routingResponse.data);
      setHistory(historyResponse.data);
    } catch (err) {
      console.error('Error fetching routing history:', err);
      setError('Failed to load routing history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStageIcon = (stageId) => {
    switch (stageId) {
      case 'initiated':
        return faVial;
      case 'pending_approval':
        return faClock;
      case 'approved':
        return faCheckCircle;
      case 'in_transit':
        return faArrowLeft;
      case 'delivered':
        return faCheckCircle;
      case 'completed':
        return faCheckCircle;
      case 'rejected':
        return faTimesCircle;
      case 'cancelled':
        return faTimesCircle;
      default:
        return faClock;
    }
  };

  const getStageColor = (stageId) => {
    switch (stageId) {
      case 'initiated':
        return 'secondary';
      case 'pending_approval':
        return 'warning';
      case 'approved':
        return 'info';
      case 'in_transit':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'completed':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'cancelled':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStageName = (stageId) => {
    return stageId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading routing history...</p>
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
          History
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 mb-0 text-gray-800">
            <FontAwesomeIcon icon={faHistory} className="me-2" />
            Routing History - {routing.sample?.sample_id || 'N/A'}
          </h1>
          <p className="text-muted mb-0">
            Complete audit trail for routing: <code>{routing.tracking_number}</code>
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

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-left-primary shadow h-100 py-2">
            <Card.Body>
              <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                Workflow Steps
              </div>
              <div className="h5 mb-0 font-weight-bold text-gray-800">
                {history?.workflow_history?.length || 0}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="border-left-info shadow h-100 py-2">
            <Card.Body>
              <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                Messages
              </div>
              <div className="h5 mb-0 font-weight-bold text-gray-800">
                {history?.messages_count || 0}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="border-left-success shadow h-100 py-2">
            <Card.Body>
              <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                Files Shared
              </div>
              <div className="h5 mb-0 font-weight-bold text-gray-800">
                {history?.files_count || 0}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="border-left-warning shadow h-100 py-2">
            <Card.Body>
              <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                Notifications
              </div>
              <div className="h5 mb-0 font-weight-bold text-gray-800">
                {history?.notifications_count || 0}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Routing Overview */}
      <Card className="shadow mb-4 text-white">
        <Card.Header>
          <h6 className="m-0 font-weight-bold text-primary">Routing Overview</h6>
        </Card.Header>
        <Card.Body className='text-black'>
          <Row>
            <Col md={6}>
              <div className="mb-3">
                <strong>Sample:</strong>
                <span className="ms-2">{routing.sample?.sample_id} - {routing.sample?.sample_type}</span>
              </div>
              <div className="mb-3">
                <strong>Route:</strong>
                <span className="ms-2">{routing.from_tenant?.name} → {routing.to_tenant?.name}</span>
              </div>
              <div className="mb-3">
                <strong>Current Status:</strong>
                <Badge bg={getStageColor(routing.status)} className="ms-2">
                  {getStageName(routing.status)}
                </Badge>
              </div>
            </Col>
            <Col md={6}>
              <div className="mb-3">
                <strong>Created:</strong>
                <span className="ms-2">{formatDate(history?.created_at)}</span>
              </div>
              <div className="mb-3">
                <strong>Last Updated:</strong>
                <span className="ms-2">{formatDate(history?.updated_at)}</span>
              </div>
              <div className="mb-3">
                <strong>Priority:</strong>
                <Badge bg={routing.priority === 'urgent' ? 'danger' : routing.priority === 'high' ? 'warning' : 'secondary'} className="ms-2">
                  {routing.priority || 'normal'}
                </Badge>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Workflow Timeline */}
      <Card className="shadow">
        <Card.Header>
          <h6 className="m-0 font-weight-bold text-primary">
            <FontAwesomeIcon icon={faHistory} className="me-2" />
            Workflow Timeline
          </h6>
        </Card.Header>
        <Card.Body className='text-white'>
          {history?.workflow_history && history.workflow_history.length > 0 ? (
            <div className="timeline">
              {history.workflow_history.map((stage, index) => (
                <div key={index} className="timeline-item mb-4">
                  <div className="d-flex align-items-start">
                    <div className="timeline-marker me-3">
                      <div 
                        className={`rounded-circle d-flex align-items-center justify-content-center bg-${getStageColor(stage.stage_id)} text-white`}
                        style={{ width: '40px', height: '40px' }}
                      >
                        <FontAwesomeIcon icon={getStageIcon(stage.stage_id)} />
                      </div>
                    </div>
                    
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-0">
                          {getStageName(stage.stage_id)}
                        </h6>
                        <small className="text-muted">
                          <FontAwesomeIcon icon={faClock} className="me-1" />
                          {formatDate(stage.entered_at)}
                        </small>
                      </div>
                      
                      {stage.notes && (
                        <p className="text-muted mb-2">{stage.notes}</p>
                      )}
                      
                      <div className="d-flex align-items-center gap-3">
                        {stage.entered_by && (
                          <small className="text-muted">
                            <FontAwesomeIcon icon={faUser} className="me-1" />
                            User ID: {stage.entered_by}
                          </small>
                        )}
                        
                        {stage.metadata && Object.keys(stage.metadata).length > 0 && (
                          <small className="text-muted">
                            Additional data available
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Timeline line */}
                  {index < history.workflow_history.length - 1 && (
                    <div 
                      className="timeline-line bg-light"
                      style={{ 
                        width: '2px', 
                        height: '30px', 
                        marginLeft: '19px',
                        marginTop: '10px',
                        marginBottom: '10px'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted py-5">
              <FontAwesomeIcon icon={faHistory} size="3x" className="mb-3" />
              <p>No workflow history available</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default RoutingHistory;
