import React, { useState, useEffect } from 'react';
import { whatsappAPI } from '../../services/api';

const WhatsAppSend = ({ 
  type = 'report', // 'report' or 'invoice'
  patientName = '',
  orderId = null,
  billingId = null,
  defaultPhone = '',
  defaultMessage = '',
  onSuccess = () => {},
  onError = () => {}
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: defaultPhone,
    message: defaultMessage,
    patient_name: patientName
  });

  useEffect(() => {
    checkWhatsAppStatus();
  }, []);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      phone_number: defaultPhone,
      message: defaultMessage,
      patient_name: patientName
    }));
  }, [defaultPhone, defaultMessage, patientName]);

  const checkWhatsAppStatus = async () => {
    try {
      const response = await whatsappAPI.getStatus();
      setIsEnabled(response.data.enabled);
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      setIsEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.phone_number || !formData.message || !formData.patient_name) {
      onError('Please fill in all required fields');
      return;
    }

    try {
      setSending(true);
      
      const data = {
        ...formData,
        order_id: orderId,
        billing_id: billingId
      };

      let response;
      if (type === 'report') {
        response = await whatsappAPI.sendReport(data);
      } else if (type === 'invoice') {
        response = await whatsappAPI.sendInvoice(data);
      }

      onSuccess(response.data.message);
      setShowForm(false);
      
      // Reset form
      setFormData({
        phone_number: defaultPhone,
        message: defaultMessage,
        patient_name: patientName
      });
      
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      onError(error.response?.data?.message || 'Failed to send WhatsApp message');
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return <div className="text-muted">Checking WhatsApp status...</div>;
  }

  if (!isEnabled) {
    return (
      <div className="alert alert-info">
        <i className="fas fa-info-circle me-2"></i>
        WhatsApp integration is not enabled for your organization.
      </div>
    );
  }

  return (
    <div className="whatsapp-send">
      {!showForm ? (
        <button
          className="btn btn-success"
          onClick={() => setShowForm(true)}
        >
          <i className="fab fa-whatsapp me-2"></i>
          Send via WhatsApp
        </button>
      ) : (
        <div className="whatsapp-form">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="fab fa-whatsapp me-2"></i>
                Send {type === 'report' ? 'Report' : 'Invoice'} via WhatsApp
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="patient_name" className="form-label">
                    Patient Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="patient_name"
                    name="patient_name"
                    value={formData.patient_name}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="phone_number" className="form-label">
                    WhatsApp Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="Enter WhatsApp number (e.g., 9876543210)"
                    className="form-control"
                    required
                  />
                  <small className="form-text text-muted">
                    Enter number without country code. +91 will be added automatically.
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="message" className="form-label">
                    Message <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="form-control"
                    rows="4"
                    placeholder={`Enter ${type} message...`}
                    required
                  />
                  <small className="form-text text-muted">
                    The message will be sent with sender and patient information headers.
                  </small>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={sending}
                  >
                    {sending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="fab fa-whatsapp me-2"></i>
                        Send Message
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowForm(false)}
                    disabled={sending}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppSend;
