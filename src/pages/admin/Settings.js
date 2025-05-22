import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCog, faSave, faInfoCircle, faGlobe, faEnvelope,
  faLock, faDatabase, faFileInvoiceDollar, faFlask
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
import { 
  TextInput, 
  SelectInput, 
  TextareaInput,
  NumberInput,
  SuccessModal,
  ErrorModal
} from '../../components/common';
import '../../styles/Settings.css';

const Settings = () => {
  // State for settings
  const [settings, setSettings] = useState({
    general: {
      site_name: '',
      site_logo: '',
      site_favicon: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      footer_text: '',
      timezone: 'Asia/Kolkata',
      date_format: 'DD-MM-YYYY',
      time_format: '12h'
    },
    email: {
      smtp_host: '',
      smtp_port: '',
      smtp_username: '',
      smtp_password: '',
      smtp_encryption: 'tls',
      from_email: '',
      from_name: ''
    },
    security: {
      password_min_length: 8,
      password_expiry_days: 90,
      max_login_attempts: 5,
      lockout_time_minutes: 30,
      session_timeout_minutes: 60,
      enable_2fa: false
    },
    lab: {
      enable_sample_tracking: true,
      enable_qc: true,
      default_sample_validity_days: 7,
      enable_auto_numbering: true,
      sample_id_prefix: 'SAM',
      result_id_prefix: 'RES'
    },
    billing: {
      currency: 'INR',
      currency_symbol: '₹',
      tax_rate: 18,
      invoice_prefix: 'INV',
      payment_terms_days: 30,
      enable_online_payments: false,
      enable_partial_payments: true
    }
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Options
  const timezoneOptions = [
    { value: 'Asia/Kolkata', label: 'Indian Standard Time (IST)' },
    { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' },
    { value: 'Asia/Singapore', label: 'Singapore Time (SGT)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' }
  ];
  
  const dateFormatOptions = [
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' },
    { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }
  ];
  
  const timeFormatOptions = [
    { value: '12h', label: '12-hour (AM/PM)' },
    { value: '24h', label: '24-hour' }
  ];
  
  const encryptionOptions = [
    { value: 'none', label: 'None' },
    { value: 'ssl', label: 'SSL' },
    { value: 'tls', label: 'TLS' }
  ];
  
  const currencyOptions = [
    { value: 'INR', label: 'Indian Rupee (₹)' },
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'AED', label: 'UAE Dirham (د.إ)' }
  ];

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await adminAPI.getSettings();
        
        // Merge with default settings to ensure all fields exist
        setSettings(prevSettings => ({
          ...prevSettings,
          ...response.data
        }));
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle form field changes
  const handleChange = (section, field, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [section]: {
        ...prevSettings[section],
        [field]: value
      }
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      await adminAPI.updateSettings(settings);
      
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error updating settings:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to update settings. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faCog} className="me-2" />
          System Settings
        </h1>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={submitting}
        >
          <FontAwesomeIcon icon={faSave} className="me-2" />
          {submitting ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-0"
            >
              <Tab eventKey="general" title={<><FontAwesomeIcon icon={faGlobe} className="me-2" />General</>} />
              <Tab eventKey="email" title={<><FontAwesomeIcon icon={faEnvelope} className="me-2" />Email</>} />
              <Tab eventKey="security" title={<><FontAwesomeIcon icon={faLock} className="me-2" />Security</>} />
              <Tab eventKey="lab" title={<><FontAwesomeIcon icon={faFlask} className="me-2" />Lab</>} />
              <Tab eventKey="billing" title={<><FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />Billing</>} />
            </Tabs>
          </Card.Header>
          <Card.Body>
            {activeTab === 'general' && (
              <div className="settings-section">
                <Row>
                  <Col md={6}>
                    <TextInput
                      name="site_name"
                      label="Site Name"
                      value={settings.general.site_name}
                      onChange={(e) => handleChange('general', 'site_name', e.target.value)}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <TextInput
                      name="contact_email"
                      label="Contact Email"
                      type="email"
                      value={settings.general.contact_email}
                      onChange={(e) => handleChange('general', 'contact_email', e.target.value)}
                      required
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <TextInput
                      name="contact_phone"
                      label="Contact Phone"
                      value={settings.general.contact_phone}
                      onChange={(e) => handleChange('general', 'contact_phone', e.target.value)}
                    />
                  </Col>
                  <Col md={6}>
                    <TextInput
                      name="site_logo"
                      label="Site Logo URL"
                      value={settings.general.site_logo}
                      onChange={(e) => handleChange('general', 'site_logo', e.target.value)}
                    />
                  </Col>
                </Row>
                <TextareaInput
                  name="address"
                  label="Address"
                  value={settings.general.address}
                  onChange={(e) => handleChange('general', 'address', e.target.value)}
                  rows={3}
                />
                <Row>
                  <Col md={4}>
                    <SelectInput
                      name="timezone"
                      label="Timezone"
                      value={settings.general.timezone}
                      onChange={(e) => handleChange('general', 'timezone', e.target.value)}
                      options={timezoneOptions}
                      required
                    />
                  </Col>
                  <Col md={4}>
                    <SelectInput
                      name="date_format"
                      label="Date Format"
                      value={settings.general.date_format}
                      onChange={(e) => handleChange('general', 'date_format', e.target.value)}
                      options={dateFormatOptions}
                      required
                    />
                  </Col>
                  <Col md={4}>
                    <SelectInput
                      name="time_format"
                      label="Time Format"
                      value={settings.general.time_format}
                      onChange={(e) => handleChange('general', 'time_format', e.target.value)}
                      options={timeFormatOptions}
                      required
                    />
                  </Col>
                </Row>
                <TextInput
                  name="footer_text"
                  label="Footer Text"
                  value={settings.general.footer_text}
                  onChange={(e) => handleChange('general', 'footer_text', e.target.value)}
                />
              </div>
            )}

            {activeTab === 'email' && (
              <div className="settings-section">
                <Alert variant="info" className="mb-4">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  Configure email settings for sending notifications, reports, and other system emails.
                </Alert>
                <Row>
                  <Col md={6}>
                    <TextInput
                      name="from_email"
                      label="From Email"
                      type="email"
                      value={settings.email.from_email}
                      onChange={(e) => handleChange('email', 'from_email', e.target.value)}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <TextInput
                      name="from_name"
                      label="From Name"
                      value={settings.email.from_name}
                      onChange={(e) => handleChange('email', 'from_name', e.target.value)}
                      required
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <TextInput
                      name="smtp_host"
                      label="SMTP Host"
                      value={settings.email.smtp_host}
                      onChange={(e) => handleChange('email', 'smtp_host', e.target.value)}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <TextInput
                      name="smtp_port"
                      label="SMTP Port"
                      value={settings.email.smtp_port}
                      onChange={(e) => handleChange('email', 'smtp_port', e.target.value)}
                      required
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <TextInput
                      name="smtp_username"
                      label="SMTP Username"
                      value={settings.email.smtp_username}
                      onChange={(e) => handleChange('email', 'smtp_username', e.target.value)}
                    />
                  </Col>
                  <Col md={6}>
                    <TextInput
                      name="smtp_password"
                      label="SMTP Password"
                      type="password"
                      value={settings.email.smtp_password}
                      onChange={(e) => handleChange('email', 'smtp_password', e.target.value)}
                    />
                  </Col>
                </Row>
                <SelectInput
                  name="smtp_encryption"
                  label="SMTP Encryption"
                  value={settings.email.smtp_encryption}
                  onChange={(e) => handleChange('email', 'smtp_encryption', e.target.value)}
                  options={encryptionOptions}
                />
              </div>
            )}

            {activeTab === 'security' && (
              <div className="settings-section">
                <Alert variant="info" className="mb-4">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  Configure security settings to protect your system and user accounts.
                </Alert>
                <Row>
                  <Col md={6}>
                    <NumberInput
                      name="password_min_length"
                      label="Minimum Password Length"
                      value={settings.security.password_min_length}
                      onChange={(e) => handleChange('security', 'password_min_length', parseInt(e.target.value))}
                      min={6}
                      max={20}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <NumberInput
                      name="password_expiry_days"
                      label="Password Expiry (Days)"
                      value={settings.security.password_expiry_days}
                      onChange={(e) => handleChange('security', 'password_expiry_days', parseInt(e.target.value))}
                      min={0}
                      help="0 = Never expire"
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <NumberInput
                      name="max_login_attempts"
                      label="Max Login Attempts"
                      value={settings.security.max_login_attempts}
                      onChange={(e) => handleChange('security', 'max_login_attempts', parseInt(e.target.value))}
                      min={1}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <NumberInput
                      name="lockout_time_minutes"
                      label="Account Lockout Time (Minutes)"
                      value={settings.security.lockout_time_minutes}
                      onChange={(e) => handleChange('security', 'lockout_time_minutes', parseInt(e.target.value))}
                      min={1}
                      required
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <NumberInput
                      name="session_timeout_minutes"
                      label="Session Timeout (Minutes)"
                      value={settings.security.session_timeout_minutes}
                      onChange={(e) => handleChange('security', 'session_timeout_minutes', parseInt(e.target.value))}
                      min={1}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Two-Factor Authentication</Form.Label>
                      <Form.Check
                        type="switch"
                        id="enable-2fa"
                        label="Enable Two-Factor Authentication"
                        checked={settings.security.enable_2fa}
                        onChange={(e) => handleChange('security', 'enable_2fa', e.target.checked)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            )}

            {activeTab === 'lab' && (
              <div className="settings-section">
                <Alert variant="info" className="mb-4">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  Configure laboratory-specific settings for sample processing and result management.
                </Alert>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Sample Tracking</Form.Label>
                      <Form.Check
                        type="switch"
                        id="enable-sample-tracking"
                        label="Enable Sample Tracking"
                        checked={settings.lab.enable_sample_tracking}
                        onChange={(e) => handleChange('lab', 'enable_sample_tracking', e.target.checked)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Quality Control</Form.Label>
                      <Form.Check
                        type="switch"
                        id="enable-qc"
                        label="Enable Quality Control"
                        checked={settings.lab.enable_qc}
                        onChange={(e) => handleChange('lab', 'enable_qc', e.target.checked)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <NumberInput
                      name="default_sample_validity_days"
                      label="Default Sample Validity (Days)"
                      value={settings.lab.default_sample_validity_days}
                      onChange={(e) => handleChange('lab', 'default_sample_validity_days', parseInt(e.target.value))}
                      min={1}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Auto Numbering</Form.Label>
                      <Form.Check
                        type="switch"
                        id="enable-auto-numbering"
                        label="Enable Auto Numbering for Samples and Results"
                        checked={settings.lab.enable_auto_numbering}
                        onChange={(e) => handleChange('lab', 'enable_auto_numbering', e.target.checked)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <TextInput
                      name="sample_id_prefix"
                      label="Sample ID Prefix"
                      value={settings.lab.sample_id_prefix}
                      onChange={(e) => handleChange('lab', 'sample_id_prefix', e.target.value)}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <TextInput
                      name="result_id_prefix"
                      label="Result ID Prefix"
                      value={settings.lab.result_id_prefix}
                      onChange={(e) => handleChange('lab', 'result_id_prefix', e.target.value)}
                      required
                    />
                  </Col>
                </Row>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="settings-section">
                <Alert variant="info" className="mb-4">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  Configure billing and payment settings for invoices and financial transactions.
                </Alert>
                <Row>
                  <Col md={6}>
                    <SelectInput
                      name="currency"
                      label="Currency"
                      value={settings.billing.currency}
                      onChange={(e) => handleChange('billing', 'currency', e.target.value)}
                      options={currencyOptions}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <TextInput
                      name="currency_symbol"
                      label="Currency Symbol"
                      value={settings.billing.currency_symbol}
                      onChange={(e) => handleChange('billing', 'currency_symbol', e.target.value)}
                      required
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <NumberInput
                      name="tax_rate"
                      label="Default Tax Rate (%)"
                      value={settings.billing.tax_rate}
                      onChange={(e) => handleChange('billing', 'tax_rate', parseFloat(e.target.value))}
                      min={0}
                      max={100}
                      step={0.01}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <TextInput
                      name="invoice_prefix"
                      label="Invoice Number Prefix"
                      value={settings.billing.invoice_prefix}
                      onChange={(e) => handleChange('billing', 'invoice_prefix', e.target.value)}
                      required
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <NumberInput
                      name="payment_terms_days"
                      label="Default Payment Terms (Days)"
                      value={settings.billing.payment_terms_days}
                      onChange={(e) => handleChange('billing', 'payment_terms_days', parseInt(e.target.value))}
                      min={0}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Payment Options</Form.Label>
                      <Form.Check
                        type="switch"
                        id="enable-online-payments"
                        label="Enable Online Payments"
                        checked={settings.billing.enable_online_payments}
                        onChange={(e) => handleChange('billing', 'enable_online_payments', e.target.checked)}
                        className="mb-2"
                      />
                      <Form.Check
                        type="switch"
                        id="enable-partial-payments"
                        label="Allow Partial Payments"
                        checked={settings.billing.enable_partial_payments}
                        onChange={(e) => handleChange('billing', 'enable_partial_payments', e.target.checked)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            )}
          </Card.Body>
          <Card.Footer className="py-3 d-flex justify-content-end">
            <Button 
              variant="primary" 
              type="submit"
              disabled={submitting}
            >
              <FontAwesomeIcon icon={faSave} className="me-2" />
              {submitting ? 'Saving...' : 'Save Settings'}
            </Button>
          </Card.Footer>
        </Card>
      </Form>

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        title="Settings Saved"
        message="System settings have been successfully updated."
      />

      {/* Error Modal */}
      <ErrorModal
        show={showErrorModal}
        onHide={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
      />
    </div>
  );
};

export default Settings;
