import React, { useState, useEffect } from 'react';
import { Modal, ListGroup, Badge, Button, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, faTimes, faCheck, faEnvelope, faFileAlt, 
  faExchangeAlt, faCheckCircle, faTimesCircle 
} from '@fortawesome/free-solid-svg-icons';
import { notificationAPI } from '../../services/api';
import PropTypes from 'prop-types';

const NotificationPanel = ({ show, onHide, onNotificationUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show) {
      fetchNotifications();
    }
  }, [show]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await notificationAPI.getNotifications({ limit: 50 });
      setNotifications(response.data.items || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      
      if (onNotificationUpdate) {
        onNotificationUpdate();
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({
          ...notif,
          is_read: true,
          read_at: new Date().toISOString()
        }))
      );
      
      if (onNotificationUpdate) {
        onNotificationUpdate();
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'routing_created':
      case 'routing_approved':
      case 'routing_rejected':
      case 'routing_cancelled':
        return faExchangeAlt;
      case 'new_message':
        return faEnvelope;
      case 'file_shared':
        return faFileAlt;
      case 'sample_delivered':
      case 'sample_received':
        return faCheckCircle;
      case 'routing_issue':
        return faTimesCircle;
      default:
        return faBell;
    }
  };

  const getNotificationVariant = (type, priority) => {
    if (priority === 'high') return 'danger';
    
    switch (type) {
      case 'routing_approved':
      case 'sample_delivered':
      case 'sample_received':
        return 'success';
      case 'routing_rejected':
      case 'routing_cancelled':
      case 'routing_issue':
        return 'danger';
      case 'new_message':
      case 'file_shared':
        return 'info';
      default:
        return 'primary';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faBell} className="me-2" />
          Notifications
          {unreadCount > 0 && (
            <Badge bg="danger" className="ms-2">
              {unreadCount}
            </Badge>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: '500px', overflowY: 'auto',color:"white" }}>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            <FontAwesomeIcon icon={faTimes} className="me-2" />
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-4">
            <FontAwesomeIcon icon={faBell} size="3x" className=" mb-3" />
            <p className="text-muted">No notifications found</p>
          </div>
        ) : (
          <ListGroup variant="flush" >
            {notifications.map(notification => (
              <ListGroup.Item
                key={notification.id}
                className={`d-flex align-items-start ${!notification.is_read ? 'bg-light' : 'bg-light'}`}
              >
                <div className="me-3 mt-1 text-white">
                  <FontAwesomeIcon
                    icon={getNotificationIcon(notification.type)}
                    className={`text-${getNotificationVariant(notification.type, notification.priority)}`}
                  />
                </div>
                
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start">
                    <h6 className="mb-1  text-white fw-bold">
                      {notification.title}
                      {!notification.is_read && (
                        <Badge bg="primary" className="ms-2" style={{ fontSize: '0.6rem' }}>
                          New
                        </Badge>
                      )}
                    </h6>
                    <small className="text-white">
                      {formatTimeAgo(notification.created_at)}
                    </small>
                  </div>
                  
                  <p className="mb-1 text-white">
                    {notification.message}
                  </p>
                  
                  {notification.priority === 'high' && (
                    <Badge bg="warning" className="me-2">
                      High Priority
                    </Badge>
                  )}
                  
                  {notification.data?.sample_id && (
                    <Badge bg="info" className="me-2">
                      Sample: {notification.data.sample_id}
                    </Badge>
                  )}
                  
                  {!notification.is_read && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <FontAwesomeIcon icon={faCheck} className="me-1" />
                      Mark as Read
                    </Button>
                  )}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>

      <Modal.Footer>
        {unreadCount > 0 && (
          <Button variant="outline-primary" onClick={handleMarkAllAsRead}>
            <FontAwesomeIcon icon={faCheck} className="me-1" />
            Mark All as Read ({unreadCount})
          </Button>
        )}
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

NotificationPanel.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onNotificationUpdate: PropTypes.func
};

export default NotificationPanel;
