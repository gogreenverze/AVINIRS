import React, { useState, useEffect } from 'react';
import { whatsappAPI } from '../../services/api';
import '../../styles/WhatsAppConfig.css';

const WhatsAppConfig = () => {
  const [config, setConfig] = useState({
    api_key: '',
    api_secret: '',
    phone_number_id: '',
    business_account_id: '',
    is_enabled: false,
    default_report_template: '',
    default_invoice_template: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [tenantId, setTenantId] = useState(1); // Default to hub tenant

  useEffect(() => {
    loadConfig();
  }, [tenantId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await whatsappAPI.getConfigByTenant(tenantId);
      setConfig(response.data);
    } catch (error) {
      console.error('Error loading WhatsApp config:', error);
      setMessage('Error loading configuration');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await whatsappAPI.updateConfig(tenantId, config);
      setMessage('WhatsApp configuration updated successfully');
      setMessageType('success');
    } catch (error) {
      console.error('Error saving WhatsApp config:', error);
      setMessage('Error saving configuration');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <div className="whatsapp-config">
        <div className="loading">Loading WhatsApp configuration...</div>
      </div>
    );
  }

  return (
    <div className="whatsapp-config">
      <div className="page-header">
        <h1>WhatsApp Configuration</h1>
        <p>Configure WhatsApp Business API integration for sending reports and invoices</p>
      </div>

      {message && (
        <div className={`alert alert-${messageType === 'success' ? 'success' : 'danger'}`}>
          {message}
        </div>
      )}

      <div className="config-form-container">
        <form onSubmit={handleSubmit} className="config-form">
          <div className="form-section">
            <h3>API Configuration</h3>
            
            <div className="form-group">
              <label htmlFor="api_key">API Key</label>
              <input
                type="password"
                id="api_key"
                name="api_key"
                value={config.api_key}
                onChange={handleInputChange}
                placeholder="Enter WhatsApp Business API Key"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="api_secret">API Secret</label>
              <input
                type="password"
                id="api_secret"
                name="api_secret"
                value={config.api_secret}
                onChange={handleInputChange}
                placeholder="Enter API Secret"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone_number_id">Phone Number ID</label>
              <input
                type="text"
                id="phone_number_id"
                name="phone_number_id"
                value={config.phone_number_id}
                onChange={handleInputChange}
                placeholder="Enter Phone Number ID"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="business_account_id">Business Account ID</label>
              <input
                type="text"
                id="business_account_id"
                name="business_account_id"
                value={config.business_account_id}
                onChange={handleInputChange}
                placeholder="Enter Business Account ID"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <div className="form-check">
                <input
                  type="checkbox"
                  id="is_enabled"
                  name="is_enabled"
                  checked={config.is_enabled}
                  onChange={handleInputChange}
                  className="form-check-input"
                />
                <label htmlFor="is_enabled" className="form-check-label">
                  Enable WhatsApp Integration
                </label>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Message Templates</h3>
            
            <div className="form-group">
              <label htmlFor="default_report_template">Default Report Template</label>
              <textarea
                id="default_report_template"
                name="default_report_template"
                value={config.default_report_template}
                onChange={handleInputChange}
                placeholder="Enter default template for test reports"
                className="form-control"
                rows="4"
              />
              <small className="form-text text-muted">
                Available variables: {'{patient_name}'}, {'{order_id}'}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="default_invoice_template">Default Invoice Template</label>
              <textarea
                id="default_invoice_template"
                name="default_invoice_template"
                value={config.default_invoice_template}
                onChange={handleInputChange}
                placeholder="Enter default template for invoices"
                className="form-control"
                rows="4"
              />
              <small className="form-text text-muted">
                Available variables: {'{patient_name}'}, {'{invoice_number}'}, {'{amount}'}
              </small>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>

      <div className="help-section">
        <h3>Setup Instructions</h3>
        <ol>
          <li>Create a WhatsApp Business Account</li>
          <li>Set up WhatsApp Business API through Facebook Developer Console</li>
          <li>Get your API credentials from the developer console</li>
          <li>Enter the credentials above and enable the integration</li>
          <li>Test the integration by sending a sample message</li>
        </ol>
      </div>
    </div>
  );
};

export default WhatsAppConfig;
