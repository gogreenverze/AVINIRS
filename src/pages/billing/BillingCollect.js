import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faSave, faMoneyBillWave, 
  faFileInvoiceDollar, faUser, faRupeeSign, faCreditCard, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { billingAPI } from '../../services/api';
import { 
  TextInput, 
  SelectInput, 
  DateInput, 
  CurrencyInput,
  FormSection,
  SuccessModal,
  ErrorModal,
  ConfirmationModal
} from '../../components/common';
import '../../styles/BillingCollect.css';

const BillingCollect = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Form state
  const [formData, setFormData] = useState({
    payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0],
    amount: 0,
    reference_number: '',
    notes: ''
  });

  // Original billing data
  const [billing, setBilling] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [payFullAmount, setPayFullAmount] = useState(true);

  // Payment method options
  const paymentMethods = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Credit Card', label: 'Credit Card' },
    { value: 'Debit Card', label: 'Debit Card' },
    { value: 'UPI', label: 'UPI' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Cheque', label: 'Cheque' },
    { value: 'Other', label: 'Other' }
  ];

  // Fetch billing data
  useEffect(() => {
    const fetchBilling = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await billingAPI.getBillingById(id);
        const billingData = response.data;
        
        setBilling(billingData);
        
        // Set default payment amount to balance due
        const balanceDue = billingData.total_amount - billingData.paid_amount;
        setFormData(prev => ({
          ...prev,
          amount: balanceDue
        }));
      } catch (err) {
        console.error('Error fetching billing:', err);
        setErrorMessage('Failed to load invoice data. Please try again later.');
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, [id]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handle payment amount toggle
  const handlePaymentAmountToggle = (e) => {
    const isFullPayment = e.target.value === 'full';
    setPayFullAmount(isFullPayment);
    
    if (isFullPayment && billing) {
      const balanceDue = billing.total_amount - billing.paid_amount;
      setFormData(prev => ({
        ...prev,
        amount: balanceDue
      }));
    } else if (!isFullPayment) {
      setFormData(prev => ({
        ...prev,
        amount: 0
      }));
    }
  };

  // Validate form before submission
  const validateForm = () => {
    if (!formData.payment_method) {
      setError('Please select a payment method.');
      return false;
    }
    
    if (!formData.payment_date) {
      setError('Please enter a payment date.');
      return false;
    }
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid payment amount.');
      return false;
    }
    
    const balanceDue = billing.total_amount - billing.paid_amount;
    if (amount > balanceDue) {
      setError(`Payment amount cannot exceed the balance due (${formatCurrency(balanceDue)}).`);
      return false;
    }
    
    // Additional validation for specific payment methods
    if (['Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Cheque'].includes(formData.payment_method) && !formData.reference_number) {
      setError('Please enter a reference number for this payment method.');
      return false;
    }
    
    setValidated(true);
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await billingAPI.collectPayment(id, formData);
      
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error collecting payment:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to process payment. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate(`/billing/${id}`);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowCancelModal(true);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading invoice details...</p>
      </div>
    );
  }

  // Check if payment can be collected
  const canCollectPayment = billing && (billing.status === 'Pending' || billing.status === 'Partial');

  if (!canCollectPayment) {
    return (
      <div className="billing-collect-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0 text-gray-800">
            <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
            Collect Payment
          </h1>
          <Link to={`/billing/${id}`} className="btn btn-secondary">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Invoice
          </Link>
        </div>
        
        <Alert variant="warning">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          Payment cannot be collected for this invoice because it has already been {billing?.status.toLowerCase()}.
        </Alert>
      </div>
    );
  }

  const balanceDue = billing.total_amount - billing.paid_amount;

  return (
    <div className="billing-collect-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
          Collect Payment
        </h1>
        <div>
          <Button variant="secondary" className="me-2" onClick={handleCancel}>
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={handleSubmit}
            disabled={submitting}
          >
            <FontAwesomeIcon icon={faSave} className="me-2" />
            {submitting ? 'Processing...' : 'Process Payment'}
          </Button>
        </div>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Payment Information</h6>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}

              <div className="invoice-summary mb-4">
                <div className="d-flex align-items-center mb-3">
                  <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2 text-primary" size="lg" />
                  <div>
                    <h5 className="mb-0">Invoice #{billing.invoice_number}</h5>
                    <p className="text-muted mb-0">
                      Date: {new Date(billing.invoice_date).toLocaleDateString()} | 
                      Status: {billing.status}
                    </p>
                  </div>
                </div>

                {billing.patient && (
                  <div className="d-flex align-items-center mb-3">
                    <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                    <div>
                      <p className="mb-0">
                        <strong>Patient:</strong> {billing.patient.first_name} {billing.patient.last_name}
                      </p>
                      <p className="text-muted mb-0">
                        ID: {billing.patient.patient_id} | 
                        Phone: {billing.patient.phone}
                      </p>
                    </div>
                  </div>
                )}

                <div className="payment-summary">
                  <div className="summary-row">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(billing.total_amount)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(billing.paid_amount)}</span>
                  </div>
                  <div className="summary-row balance">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(balanceDue)}</span>
                  </div>
                </div>
              </div>

              <Form noValidate validated={validated}>
                <FormSection title="Payment Details">
                  <Row>
                    <Col md={6}>
                      <SelectInput
                        name="payment_method"
                        label="Payment Method"
                        value={formData.payment_method}
                        onChange={handleChange}
                        options={paymentMethods}
                        required
                      />
                    </Col>
                    <Col md={6}>
                      <DateInput
                        name="payment_date"
                        label="Payment Date"
                        value={formData.payment_date}
                        onChange={handleChange}
                        required
                      />
                    </Col>
                  </Row>

                  <div className="payment-amount-toggle mb-3">
                    <Form.Label>Payment Amount</Form.Label>
                    <div>
                      <Form.Check
                        inline
                        type="radio"
                        id="full-payment"
                        name="payment-amount-type"
                        label="Pay Full Amount"
                        value="full"
                        checked={payFullAmount}
                        onChange={handlePaymentAmountToggle}
                      />
                      <Form.Check
                        inline
                        type="radio"
                        id="partial-payment"
                        name="payment-amount-type"
                        label="Pay Partial Amount"
                        value="partial"
                        checked={!payFullAmount}
                        onChange={handlePaymentAmountToggle}
                      />
                    </div>
                  </div>

                  <Row>
                    <Col md={6}>
                      <CurrencyInput
                        name="amount"
                        label="Amount"
                        value={formData.amount}
                        onChange={handleChange}
                        required
                        disabled={payFullAmount}
                        min={0}
                        max={balanceDue}
                      />
                    </Col>
                    <Col md={6}>
                      <TextInput
                        name="reference_number"
                        label={`Reference Number ${['Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Cheque'].includes(formData.payment_method) ? '*' : ''}`}
                        value={formData.reference_number}
                        onChange={handleChange}
                        required={['Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Cheque'].includes(formData.payment_method)}
                        placeholder="Transaction ID, Cheque No., etc."
                      />
                    </Col>
                  </Row>

                  <TextInput
                    name="notes"
                    label="Notes"
                    value={formData.notes}
                    onChange={handleChange}
                    as="textarea"
                    rows={3}
                    placeholder="Any additional information about this payment"
                  />
                </FormSection>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold">Payment Summary</h6>
            </Card.Header>
            <Card.Body>
              <div className="payment-confirmation">
                <div className="confirmation-item">
                  <span>Invoice Number:</span>
                  <span>#{billing.invoice_number}</span>
                </div>
                <div className="confirmation-item">
                  <span>Payment Method:</span>
                  <span>
                    {formData.payment_method === 'Credit Card' && <FontAwesomeIcon icon={faCreditCard} className="me-2" />}
                    {formData.payment_method === 'Cash' && <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />}
                    {formData.payment_method}
                  </span>
                </div>
                <div className="confirmation-item">
                  <span>Payment Date:</span>
                  <span>{new Date(formData.payment_date).toLocaleDateString()}</span>
                </div>
                <div className="confirmation-item">
                  <span>Amount:</span>
                  <span><FontAwesomeIcon icon={faRupeeSign} /> {parseFloat(formData.amount).toFixed(2)}</span>
                </div>
                {formData.reference_number && (
                  <div className="confirmation-item">
                    <span>Reference:</span>
                    <span>{formData.reference_number}</span>
                  </div>
                )}
                <div className="confirmation-item total">
                  <span>New Balance:</span>
                  <span>
                    <FontAwesomeIcon icon={faRupeeSign} /> 
                    {(balanceDue - parseFloat(formData.amount)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="d-grid gap-2 mt-4">
                <Button
                  variant="success"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={submitting || parseFloat(formData.amount) <= 0 || parseFloat(formData.amount) > balanceDue}
                >
                  <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                  {submitting ? 'Processing...' : 'Process Payment'}
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold">Help</h6>
            </Card.Header>
            <Card.Body>
              <p>
                <strong>Payment Method:</strong> Select how the payment is being made.
              </p>
              <p>
                <strong>Reference Number:</strong> For card payments, UPI, or cheques, enter the transaction ID or cheque number.
              </p>
              <p>
                <strong>Partial Payment:</strong> If the customer is not paying the full amount, select "Pay Partial Amount" and enter the amount being paid.
              </p>
              <p>
                <strong>Notes:</strong> Add any additional information about this payment for future reference.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={handleSuccessModalClose}
        title="Payment Processed"
        message="The payment has been successfully processed."
      />

      {/* Error Modal */}
      <ErrorModal
        show={showErrorModal}
        onHide={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        onConfirm={() => navigate(`/billing/${id}`)}
        title="Cancel Payment"
        message="Are you sure you want to cancel this payment process?"
        confirmText="Yes, Cancel"
        cancelText="No, Continue"
      />
    </div>
  );
};

export default BillingCollect;
