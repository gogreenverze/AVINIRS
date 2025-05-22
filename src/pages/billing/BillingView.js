import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, Table, Button, Badge, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileInvoiceDollar, faArrowLeft, faPrint, faMoneyBillWave,
  faUser, faCalendarAlt, faRupeeSign, faCheckCircle, faShare
} from '@fortawesome/free-solid-svg-icons';
import { billingAPI } from '../../services/api';
import { InfoModal, SuccessModal, ErrorModal } from '../../components/common';
import WhatsAppSend from '../../components/common/WhatsAppSend';
import '../../styles/BillingView.css';

const BillingView = () => {
  const { id } = useParams();
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch billing data
  useEffect(() => {
    const fetchBilling = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await billingAPI.getBillingById(id);
        setBilling(response.data);
      } catch (err) {
        console.error('Error fetching billing:', err);
        setError('Failed to load billing details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, [id]);

  // Handle share invoice
  const handleShare = () => {
    // Implementation for sharing invoice (e.g., via email or WhatsApp)
    setShowShareModal(false);
    setShowSuccessModal(true);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Paid':
        return 'success';
      case 'Partial':
        return 'info';
      case 'Cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
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
        <p className="mt-2">Loading billing details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="alert alert-warning" role="alert">
        Billing record not found.
      </div>
    );
  }

  return (
    <div className="billing-view-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
          Invoice Details
        </h1>
        <div>
          <Link to="/billing" className="btn btn-secondary me-2">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to List
          </Link>
          <Button variant="primary" className="me-2" onClick={() => window.print()}>
            <FontAwesomeIcon icon={faPrint} className="me-2" />
            Print
          </Button>
          {(billing.status === 'Pending' || billing.status === 'Partial') && (
            <Link to={`/billing/${id}/collect`} className="btn btn-success me-2">
              <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
              Collect Payment
            </Link>
          )}
          <Button variant="info" onClick={() => setShowShareModal(true)}>
            <FontAwesomeIcon icon={faShare} className="me-2" />
            Share
          </Button>
        </div>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">
                Invoice #{billing.invoice_number}
                <Badge
                  bg={getStatusBadgeVariant(billing.status)}
                  className="float-end"
                >
                  {billing.status}
                </Badge>
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="billing-detail-item">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                    <strong>Invoice Date:</strong>
                    <span>{new Date(billing.invoice_date).toLocaleDateString()}</span>
                  </div>
                  <div className="billing-detail-item">
                    <FontAwesomeIcon icon={faRupeeSign} className="me-2 text-primary" />
                    <strong>Total Amount:</strong>
                    <span>{formatCurrency(billing.total_amount)}</span>
                  </div>
                  <div className="billing-detail-item">
                    <FontAwesomeIcon icon={faRupeeSign} className="me-2 text-primary" />
                    <strong>Paid Amount:</strong>
                    <span>{formatCurrency(billing.paid_amount)}</span>
                  </div>
                  <div className="billing-detail-item">
                    <FontAwesomeIcon icon={faRupeeSign} className="me-2 text-primary" />
                    <strong>Balance:</strong>
                    <span>{formatCurrency(billing.total_amount - billing.paid_amount)}</span>
                  </div>
                </Col>
                <Col md={6}>
                  {billing.patient && (
                    <>
                      <div className="billing-detail-item">
                        <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                        <strong>Patient:</strong>
                        <span>
                          <Link to={`/patients/${billing.patient.id}`}>
                            {billing.patient.first_name} {billing.patient.last_name}
                          </Link>
                        </span>
                      </div>
                      <div className="billing-detail-item">
                        <strong>Patient ID:</strong>
                        <span>{billing.patient.patient_id}</span>
                      </div>
                      <div className="billing-detail-item">
                        <strong>Contact:</strong>
                        <span>{billing.patient.phone}</span>
                      </div>
                      <div className="billing-detail-item">
                        <strong>Email:</strong>
                        <span>{billing.patient.email || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </Col>
              </Row>

              <hr />

              <h5 className="mb-3">Invoice Items</h5>
              <div className="table-responsive">
                <Table className="table-hover" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Discount</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billing.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.description}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.unit_price)}</td>
                        <td>{item.discount}%</td>
                        <td>{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4" className="text-end"><strong>Subtotal:</strong></td>
                      <td>{formatCurrency(billing.subtotal)}</td>
                    </tr>
                    {billing.discount > 0 && (
                      <tr>
                        <td colSpan="4" className="text-end"><strong>Discount:</strong></td>
                        <td>-{formatCurrency(billing.discount)}</td>
                      </tr>
                    )}
                    {billing.tax > 0 && (
                      <tr>
                        <td colSpan="4" className="text-end"><strong>Tax ({billing.tax_rate}%):</strong></td>
                        <td>{formatCurrency(billing.tax)}</td>
                      </tr>
                    )}
                    <tr className="table-active">
                      <td colSpan="4" className="text-end"><strong>Total:</strong></td>
                      <td><strong>{formatCurrency(billing.total_amount)}</strong></td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold">Payment History</h6>
            </Card.Header>
            <Card.Body>
              {billing.payments && billing.payments.length > 0 ? (
                <div className="payment-history">
                  {billing.payments.map((payment, index) => (
                    <div key={index} className="payment-item">
                      <div className="payment-date">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </div>
                      <div className="payment-details">
                        <div className="payment-amount">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="payment-method">
                          {payment.payment_method}
                          {payment.status === 'Completed' && (
                            <FontAwesomeIcon icon={faCheckCircle} className="ms-2 text-success" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No payment records found.</p>
              )}

              {(billing.status === 'Pending' || billing.status === 'Partial') && (
                <div className="mt-3">
                  <Link to={`/billing/${id}/collect`} className="btn btn-success btn-block w-100">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                    Collect Payment
                  </Link>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* WhatsApp Send Component */}
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold">WhatsApp</h6>
            </Card.Header>
            <Card.Body>
              <WhatsAppSend
                type="invoice"
                patientName={billing.patient ? `${billing.patient.first_name} ${billing.patient.last_name}` : ''}
                billingId={billing.id}
                defaultPhone={billing.patient?.phone || ''}
                defaultMessage={`Your invoice is ready. Invoice #${billing.invoice_number}. Total amount: ${formatCurrency(billing.total_amount)}. Thank you for choosing AVINI LABS.`}
                onSuccess={(message) => {
                  // Show success notification
                  console.log('WhatsApp invoice sent:', message);
                }}
                onError={(error) => {
                  // Show error notification
                  console.error('WhatsApp error:', error);
                }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Share Modal */}
      <InfoModal
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        title="Share Invoice"
        message={
          <div>
            <p>Share invoice #{billing.invoice_number} with the patient:</p>
            <div className="d-grid gap-2">
              <Button variant="success" onClick={handleShare}>
                <i className="fab fa-whatsapp me-2"></i>
                Share via WhatsApp
              </Button>
              <Button variant="primary" onClick={handleShare}>
                <i className="fas fa-envelope me-2"></i>
                Share via Email
              </Button>
            </div>
          </div>
        }
      />

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        title="Success"
        message="Invoice has been shared successfully!"
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

export default BillingView;
