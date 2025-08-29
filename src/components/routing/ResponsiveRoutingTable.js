import React, { useState, useEffect } from 'react';
import { Table, Card, Alert, Button, Badge, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, faCheck, faTimes, faArrowRight, faComments, faFileAlt,
  faShippingFast, faEllipsisV, faHistory, faClock, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import RoutingMobileCard from './RoutingMobileCard';
import Pagination from '../common/Pagination';
import { routingAPI } from '../../services/api';
import PropTypes from 'prop-types';

/**
 * Enhanced responsive routing table with comprehensive workflow actions
 */
const ResponsiveRoutingTable = ({
  routings = [],
  type = 'all',
  title = 'Sample Routings',
  loading = false,
  itemsPerPage = 20,
  onRoutingUpdate
}) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Reset to first page when routings change
  useEffect(() => {
    setCurrentPage(1);
  }, [routings]);

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

  const handleAction = async (routingId, action, data = {}) => {
    setActionLoading(prev => ({ ...prev, [`${routingId}-${action}`]: true }));
    
    try {
      let response;
      switch (action) {
        case 'approve':
          response = await routingAPI.approveRouting(routingId, data);
          break;
        case 'reject':
          response = await routingAPI.rejectRouting(routingId, data);
          break;
        case 'dispatch':
          response = await routingAPI.dispatchRouting(routingId, data);
          break;
        case 'receive':
          response = await routingAPI.receiveRouting(routingId, data);
          break;
        case 'complete':
          response = await routingAPI.completeRouting(routingId, data);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      if (onRoutingUpdate) {
        onRoutingUpdate();
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(`Failed to ${action} routing. Please try again.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [`${routingId}-${action}`]: false }));
    }
  };

  const getAvailableActions = (routing) => {
    const actions = [];
    const status = routing.status?.toLowerCase();

    // View action is always available
    actions.push({
      key: 'view',
      label: 'View Details',
      icon: faEye,
      variant: 'info',
      onClick: () => navigate(`/samples/routing/${routing.id}`)
    });

    // Chat action is always available for active routings
    if (status !== 'completed' && status !== 'cancelled' && status !== 'rejected') {
      actions.push({
        key: 'chat',
        label: 'Chat',
        icon: faComments,
        variant: 'secondary',
        onClick: () => navigate(`/samples/routing/${routing.id}/chat`)
      });
    }

    // History action is always available
    actions.push({
      key: 'history',
      label: 'History',
      icon: faHistory,
      variant: 'secondary',
      onClick: () => navigate(`/samples/routing/${routing.id}/history`)
    });

    // Status-specific actions
    switch (status) {
      case 'pending_approval':
        if (type === 'incoming' || type === 'all') {
          actions.push({
            key: 'approve',
            label: 'Approve',
            icon: faCheck,
            variant: 'success',
            onClick: () => handleAction(routing.id, 'approve', { notes: 'Approved' })
          });
          actions.push({
            key: 'reject',
            label: 'Reject',
            icon: faTimes,
            variant: 'danger',
            onClick: () => {
              const reason = prompt('Please provide a reason for rejection:');
              if (reason) {
                handleAction(routing.id, 'reject', { reason, notes: reason });
              }
            }
          });
        }
        break;

      case 'approved':
        if (type === 'outgoing' || type === 'all') {
          actions.push({
            key: 'dispatch',
            label: 'Dispatch',
            icon: faShippingFast,
            variant: 'primary',
            onClick: () => {
              const courier = prompt('Courier name (optional):');
              const contact = prompt('Courier contact (optional):');
              handleAction(routing.id, 'dispatch', { 
                courier_name: courier || '',
                courier_contact: contact || '',
                notes: 'Sample dispatched'
              });
            }
          });
        }
        break;

      case 'in_transit':
        if (type === 'incoming' || type === 'all') {
          actions.push({
            key: 'receive',
            label: 'Receive',
            icon: faCheckCircle,
            variant: 'success',
            onClick: () => {
              const condition = prompt('Sample condition on arrival (good/damaged):') || 'good';
              handleAction(routing.id, 'receive', { 
                condition,
                notes: `Sample received in ${condition} condition`
              });
            }
          });
        }
        break;

      case 'delivered':
        if (type === 'incoming' || type === 'all') {
          actions.push({
            key: 'complete',
            label: 'Complete',
            icon: faCheck,
            variant: 'success',
            onClick: () => handleAction(routing.id, 'complete', { notes: 'Routing completed' })
          });
        }
        break;
    }

    return actions;
  };

  // Pagination calculations
  const totalItems = routings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoutings = routings.slice(startIndex, endIndex);





  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <Card className="shadow mb-4">
        <Card.Body className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading routings...</p>
        </Card.Body>
      </Card>
    );
  }

  if (totalItems === 0) {
    return (
      <Alert variant="info" className="text-center">
        <FontAwesomeIcon icon={faArrowRight} className="me-2" />
        No {type === 'all' ? '' : type} routings found.
      </Alert>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="mobile-routing-container">
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              {title}
              <Badge bg="primary" className="float-end">
                {totalItems} Records
              </Badge>
            </h6>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="mobile-data-container">
              {paginatedRoutings.map(routing => (
                <RoutingMobileCard
                  key={routing.id}
                  routing={routing}
                  type={type}
                  actions={getAvailableActions(routing)}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          </Card.Body>
        </Card>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          size="sm"
          className="mt-3"
        />
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="desktop-routing-container">
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">
            {title}
            <Badge bg="primary" className="float-end">
              {totalItems} Records
            </Badge>
          </h6>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table className="table-hover" width="100%" cellSpacing="0">
              <thead>
                <tr>
                  <th>Sample ID</th>
                  <th>Patient</th>
                  <th>{type === 'incoming' ? 'From' : type === 'outgoing' ? 'To' : 'Route'}</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created</th>
                  <th>Tracking #</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRoutings.map(routing => {
                  const actions = getAvailableActions(routing);
                  
                  return (
                    <tr key={routing.id}>
                      <td>
                        <Link to={`/samples/routing/${routing.id}`} className="fw-bold">
                          {routing.sample?.sample_id || 'N/A'}
                        </Link>
                      </td>
                      <td>
                        {routing.patient ? (
                          <span>
                            {routing.patient.first_name} {routing.patient.last_name}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td>
                        {type === 'incoming' ? (
                          <span>{routing.from_tenant?.name || 'Unknown'}</span>
                        ) : type === 'outgoing' ? (
                          <span>{routing.to_tenant?.name || 'Unknown'}</span>
                        ) : (
                          <span>
                            {routing.from_tenant?.site_code || 'UNK'} → {routing.to_tenant?.site_code || 'UNK'}
                          </span>
                        )}
                      </td>
                      <td>
                        <Badge bg={getStatusBadgeVariant(routing.status)}>
                          {getStatusDisplayName(routing.status)}
                        </Badge>
                      </td>
                      <td>
                        <Badge 
                          bg={routing.priority === 'urgent' ? 'danger' : 
                              routing.priority === 'high' ? 'warning' : 'secondary'}
                        >
                          {routing.priority || 'normal'}
                        </Badge>
                      </td>
                      <td>
                        {routing.created_at ? 
                          new Date(routing.created_at).toLocaleDateString() : 
                          'N/A'
                        }
                      </td>
                      <td>
                        <code>{routing.tracking_number || 'N/A'}</code>
                      </td>
                      <td>
                        <div className="d-flex gap-1 z-40">
                          {actions.slice(0, 2).map(action => (
                            <Button
                              key={action.key}
                              variant={action.variant}
                              size="sm"
                              onClick={action.onClick}
                              disabled={actionLoading[`${routing.id}-${action.key}`]}
                              title={action.label}
                            >
                              <FontAwesomeIcon 
                                icon={action.icon} 
                                spin={actionLoading[`${routing.id}-${action.key}`]}
                              />
                            </Button>
                          ))}
                          
                          {actions.length > 2 && (
                            <Dropdown className='h-50 z-50'>
                              <Dropdown.Toggle variant="outline-secondary" size="sm">
                                <FontAwesomeIcon icon={faEllipsisV} />
                              </Dropdown.Toggle>
                              <Dropdown.Menu className='z-50'>
                                {actions.slice(2).map(action => (
                                  <Dropdown.Item
                                    key={action.key}
                                    onClick={action.onClick}
                                    disabled={actionLoading[`${routing.id}-${action.key}`]}
                                  >
                                    <FontAwesomeIcon icon={action.icon} className="me-2" />
                                    {action.label}
                                  </Dropdown.Item>
                                ))}
                              </Dropdown.Menu>
                            </Dropdown>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        className="mt-3"
      />
    </div>
  );
};

ResponsiveRoutingTable.propTypes = {
  routings: PropTypes.array.isRequired,
  type: PropTypes.oneOf(['all', 'incoming', 'outgoing']).isRequired,
  title: PropTypes.string,
  loading: PropTypes.bool,
  itemsPerPage: PropTypes.number,
  onRoutingUpdate: PropTypes.func
};

export default ResponsiveRoutingTable;
