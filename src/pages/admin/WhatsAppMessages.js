import React, { useState, useEffect } from 'react';
import { whatsappAPI } from '../../services/api';
import '../../styles/WhatsAppMessages.css';

const WhatsAppMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    loadMessages();
  }, [currentPage]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await whatsappAPI.getMessages(currentPage, 20);
      setMessages(response.data.items);
      setTotalPages(response.data.pages);
      setTotalItems(response.data.total);
    } catch (error) {
      console.error('Error loading WhatsApp messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'pending': 'badge-warning',
      'sent': 'badge-success',
      'delivered': 'badge-info',
      'failed': 'badge-danger'
    };
    
    return (
      <span className={`badge ${statusClasses[status] || 'badge-secondary'}`}>
        {status}
      </span>
    );
  };

  const getMessageTypeBadge = (type) => {
    const typeClasses = {
      'report': 'badge-primary',
      'invoice': 'badge-success',
      'notification': 'badge-info'
    };
    
    return (
      <span className={`badge ${typeClasses[type] || 'badge-secondary'}`}>
        {type}
      </span>
    );
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="whatsapp-messages">
        <div className="loading">Loading WhatsApp messages...</div>
      </div>
    );
  }

  return (
    <div className="whatsapp-messages">
      <div className="page-header">
        <h1>WhatsApp Messages</h1>
        <p>View history of all WhatsApp messages sent through the system</p>
      </div>

      <div className="messages-stats">
        <div className="stat-card">
          <h3>{totalItems}</h3>
          <p>Total Messages</p>
        </div>
        <div className="stat-card">
          <h3>{messages.filter(m => m.status === 'sent').length}</h3>
          <p>Sent Today</p>
        </div>
        <div className="stat-card">
          <h3>{messages.filter(m => m.status === 'failed').length}</h3>
          <p>Failed Today</p>
        </div>
      </div>

      <div className="messages-table-container">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Date</th>
              <th>Recipient</th>
              <th>Type</th>
              <th>Status</th>
              <th>Message Preview</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  No WhatsApp messages found
                </td>
              </tr>
            ) : (
              messages.map((message) => (
                <tr key={message.id}>
                  <td>{formatDate(message.created_at)}</td>
                  <td>{message.recipient_number}</td>
                  <td>{getMessageTypeBadge(message.message_type)}</td>
                  <td>{getStatusBadge(message.status)}</td>
                  <td>
                    <div className="message-preview">
                      {message.message_content.substring(0, 100)}
                      {message.message_content.length > 100 && '...'}
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        // Show full message in modal
                        alert(message.message_content);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          <nav>
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
              </li>
              
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  </li>
                );
              })}
              
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
};

export default WhatsAppMessages;
