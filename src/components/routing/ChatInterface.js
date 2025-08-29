import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Alert, ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faComments, faUser, faClock } from '@fortawesome/free-solid-svg-icons';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PropTypes from 'prop-types';

const ChatInterface = ({ routingId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    
    // Auto-refresh messages every 10 seconds
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [routingId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setError(null);
      const response = await chatAPI.getMessages(routingId);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    setSending(true);
    setError(null);

    try {
      const messageData = {
        content: newMessage.trim(),
        message_type: 'text'
      };

      await chatAPI.sendMessage(routingId, messageData);
      setNewMessage('');
      
      // Refresh messages to show the new one
      await fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <Card className="shadow">
        <Card.Body className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading chat messages...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow">
      <Card.Header>
        <h6 className="m-0 font-weight-bold text-primary">
          <FontAwesomeIcon icon={faComments} className="me-2" />
          Communication
        </h6>
      </Card.Header>
      
      <Card.Body className="p-0">
        {error && (
          <Alert variant="danger" className="m-3 mb-0">
            {error}
          </Alert>
        )}

        {/* Messages Area */}
        <div 
          className="messages-container p-3" 
          style={{ 
            height: '400px', 
            overflowY: 'auto',
            backgroundColor: '#f8f9fa'
          }}
        >
          {messages.length === 0 ? (
            <div className="text-center text-muted py-5">
              <FontAwesomeIcon icon={faComments} size="3x" className="mb-3" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((message, index) => {
                // Use both sender_id comparison and is_own_message field from backend
                const isOwnMessage = message.sender_id === user?.id || message.is_own_message;

                return (
                  <div
                    key={message.id || index}
                    className={`message-item mb-3 d-flex ${
                      isOwnMessage ? 'justify-content-end' : 'justify-content-start'
                    }`}
                  >
                    <div
                      className={`message-bubble p-3 rounded ${
                        isOwnMessage 
                          ? 'bg-primary text-white' 
                          : 'bg-white border'
                      }`}
                      style={{ maxWidth: '70%' }}
                    >
                      <div className="message-header mb-1">
                        <small className={`fw-bold ${isOwnMessage ? 'text-light' : 'text-primary'}`}>
                          <FontAwesomeIcon icon={faUser} className="me-1" />
                          {isOwnMessage ? 'You' : message.sender_name || 'Unknown User'}
                        </small>
                      </div>
                      
                      <div className="message-content">
                        {message.content}
                      </div>
                      
                      <div className="message-time mt-2">
                        <small className={`${isOwnMessage ? 'text-light' : 'text-muted'}`}>
                          <FontAwesomeIcon icon={faClock} className="me-1" />
                          {formatMessageTime(message.created_at)}
                        </small>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="message-input-container p-3 border-top">
          <Form onSubmit={handleSendMessage}>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
                className="flex-grow-1"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={sending || !newMessage.trim()}
              >
                {sending ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  <FontAwesomeIcon icon={faPaperPlane} />
                )}
              </Button>
            </div>
          </Form>
        </div>
      </Card.Body>
    </Card>
  );
};

ChatInterface.propTypes = {
  routingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

export default ChatInterface;
