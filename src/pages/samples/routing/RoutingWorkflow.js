import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Row, Col, Badge, Button, Alert, Tabs, Tab, Breadcrumb } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faVial, faUser, faMapMarkerAlt, faClock, faBarcode,
  faCheck, faTimes, faShippingFast, faComments, faFileAlt, faHistory,
  faExclamationTriangle, faCheckCircle, faTimesCircle, faFileInvoice
} from '@fortawesome/free-solid-svg-icons';
import { routingAPI } from '../../../services/api';
import { useTenant } from '../../../context/TenantContext';
import WorkflowSteps from '../../../components/routing/WorkflowSteps';
import ChatInterface from '../../../components/routing/ChatInterface';
import FileManager from '../../../components/routing/FileManager';
import InvoiceTab from '../../../components/routing/InvoiceTab';
import '../../../styles/SampleRoutingSystem.css';

const RoutingWorkflow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTenantContext } = useTenant();

  const [routing, setRouting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('workflow');

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

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
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

  const getStatusDisplayName = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending_approval':
        return 'Pending Approval';
      case 'approved':
        return 'Approved';
      case 'in_transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status || 'Unknown';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return faExclamationTriangle;
      case 'high':
        return faExclamationTriangle;
      default:
        return faClock;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'danger';
      case 'high':
        return 'warning';
      default:
        return 'secondary';
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

  if (loading) {
    return (
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading routing details...</p>
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
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
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
        <Breadcrumb.Item active>
          {routing.sample?.sample_id || 'Unknown Sample'}
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 mb-0 text-gray-800">
            <FontAwesomeIcon icon={faVial} className="me-2" />
            Sample Routing: {routing.sample?.sample_id || 'N/A'}
          </h1>
          <p className="text-muted mb-0">
            Tracking: <code>{routing.tracking_number}</code>
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => navigate('/samples/routing')}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-1" />
            Back to Routing
          </Button>
          <Button 
            variant="outline-info" 
            size="sm"
            onClick={() => setActiveTab('chat')}
          >
            <FontAwesomeIcon icon={faComments} className="me-1" />
            Chat
          </Button>
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => setActiveTab('files')}
          >
            <FontAwesomeIcon icon={faFileAlt} className="me-1" />
            Files
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card className="shadow">
            <Card.Header>
              <h6 className="m-0 font-weight-bold text-primary">Routing Overview</h6>
            </Card.Header>
            <Card.Body className="text-white">
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <strong>Status:</strong>
                    <Badge bg={getStatusBadgeVariant(routing.status)} className="ms-2">
                      {getStatusDisplayName(routing.status)}
                    </Badge>
                  </div>
                  <div className="mb-3">
                    <strong>Priority:</strong>
                    <Badge bg={getPriorityColor(routing.priority)} className="ms-2">
                      <FontAwesomeIcon icon={getPriorityIcon(routing.priority)} className="me-1" />
                      {routing.priority || 'normal'}
                    </Badge>
                  </div>
                  <div className="mb-3">
                    <strong>
                      <FontAwesomeIcon icon={faUser} className="me-1" />
                      Patient:
                    </strong>
                    <span className="ms-2">
                      {routing.patient ? 
                        `${routing.patient.first_name} ${routing.patient.last_name}` : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <div className="mb-3">
                    <strong>
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" />
                      Route:
                    </strong>
                    <span className="ms-2">
                      {routing.from_tenant?.name || 'Unknown'} → {routing.to_tenant?.name || 'Unknown'}
                    </span>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <strong>Reason:</strong>
                    <p className="mb-0 mt-1 text-muted">{routing.reason}</p>
                  </div>
                  {routing.notes && (
                    <div className="mb-3">
                      <strong>Notes:</strong>
                      <p className="mb-0 mt-1 text-muted">{routing.notes}</p>
                    </div>
                  )}
                  <div className="mb-3">
                    <strong>
                      <FontAwesomeIcon icon={faClock} className="me-1" />
                      Created:
                    </strong>
                    <span className="ms-2">{formatDate(routing.created_at)}</span>
                  </div>
                  {routing.expected_delivery_date && (
                    <div className="mb-3">
                      <strong>Expected Delivery:</strong>
                      <span className="ms-2">{formatDate(routing.expected_delivery_date)}</span>
                    </div>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow">
            <Card.Header>
              <h6 className="m-0 font-weight-bold text-primary">Sample Details</h6>
            </Card.Header>
            <Card.Body className="text-white">
              {routing.sample ? (
                <>
                  <div className="mb-2">
                    <strong>Sample ID:</strong>
                    <Link to={`/samples/${routing.sample.id}`} className="ms-2">
                      {routing.sample.sample_id}
                    </Link>
                  </div>
                  <div className="mb-2">
                    <strong>Type:</strong>
                    <span className="ms-2">{routing.sample.sample_type}</span>
                  </div>
                  <div className="mb-2">
                    <strong>Collection Date:</strong>
                    <span className="ms-2">{formatDate(routing.sample.collection_date)}</span>
                  </div>
                  <div className="mb-2">
                    <strong>Routing Status:</strong>
                    <Badge bg={getStatusBadgeVariant(routing.status)} className="ms-2">
                      {getStatusDisplayName(routing.status)}
                    </Badge>
                  </div>
                </>
              ) : (
                <p className="text-muted">Sample information not available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="workflow" title={
          <>
            <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
            Workflow
          </>
        }>
          <WorkflowSteps 
            routing={routing} 
            onWorkflowUpdate={fetchRouting}
          />
        </Tab>

        <Tab eventKey="chat" title={
          <>
            <FontAwesomeIcon icon={faComments} className="me-1" />
            Communication
          </>
        }>
          <ChatInterface routingId={routing.id} />
        </Tab>

        <Tab eventKey="files" title={
          <>
            <FontAwesomeIcon icon={faFileAlt} className="me-1" />
            Files
          </>
        }>
          <FileManager routingId={routing.id} />
        </Tab>

        <Tab eventKey="history" title={
          <>
            <FontAwesomeIcon icon={faHistory} className="me-1" />
            History
          </>
        }>
          <Card className="shadow">
            <Card.Header>
              <h6 className="m-0 font-weight-bold text-primary">Routing History</h6>
            </Card.Header>
            <Card.Body className="text-white">
              {routing.workflow?.stage_history ? (
                <div className="timeline">
                  {routing.workflow.stage_history.map((stage, index) => (
                    <div key={index} className="timeline-item mb-3">
                      {console.log("element",stage)}
                      <div className="d-flex align-items-start">
                        <div className="timeline-marker me-3">
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className="text-success"
                          />
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{stage.stage_id.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h6>
                          <p className=" mb-1">{stage.notes}</p>
                          <small className="">
                            {formatDate(stage.entered_at)}
                            {stage.entered_by && ` • User ID: ${stage.entered_by}`}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No workflow history available</p>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="invoices" title={
          <>
            <FontAwesomeIcon icon={faFileInvoice} className="me-1" />
            Invoices
          </>
        }>
          <InvoiceTab routingId={routing.id} routing={routing} />
        </Tab>
      </Tabs>
    </div>
  );
};

export default RoutingWorkflow;
