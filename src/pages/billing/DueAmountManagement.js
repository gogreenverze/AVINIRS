import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Table, Card, Alert, Modal, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faMoneyBillWave, faHistory, faReceipt, 
  faExclamationTriangle, faCheckCircle, faSpinner,
  faUser, faPhone, faCalendarAlt, faCreditCard
} from '@fortawesome/free-solid-svg-icons';

const DueAmountManagement = () => {
  // States
  const [loading, setLoading] = useState(false);
  const [dueAmounts, setDueAmounts] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    patient_name: '',
    mobile: '',
    sid_number: '',
    branch_id: ''
  });
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_amount: '',
    payment_method: 'Cash',
    payment_reference: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load due amounts
  const loadDueAmounts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value.trim()) {
          queryParams.append(key, value.trim());
        }
      });

      const response = await fetch(`/api/billing/due-amounts?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDueAmounts(data.items || []);
      } else {
        setError('Failed to load due amounts');
      }
    } catch (error) {
      console.error('Error loading due amounts:', error);
      setError('Error loading due amounts');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    loadDueAmounts();
  };

  // Handle payment processing
  const handlePayment = async () => {
    if (!selectedBilling || !paymentData.payment_amount) {
      setError('Please enter payment amount');
      return;
    }

    const amount = parseFloat(paymentData.payment_amount);
    if (amount <= 0 || amount > selectedBilling.due_amount) {
      setError(`Payment amount must be between ₹1 and ₹${selectedBilling.due_amount.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/billing/due-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          billing_id: selectedBilling.billing_id,
          payment_amount: amount,
          payment_method: paymentData.payment_method,
          payment_reference: paymentData.payment_reference,
          notes: paymentData.notes
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(`Payment of ₹${amount.toFixed(2)} processed successfully. Remaining due: ₹${result.remaining_due.toFixed(2)}`);
        setShowPaymentModal(false);
        setPaymentData({
          payment_amount: '',
          payment_method: 'Cash',
          payment_reference: '',
          notes: ''
        });
        loadDueAmounts(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadDueAmounts();
  }, []);

  return (
    <div className="due-amount-management p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
          Due Amount Management
        </h4>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess('')} dismissible>
          <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
          {success}
        </Alert>
      )}

      {/* Search Filters */}
      <Card className="mb-4">
        <Card.Header>
          <FontAwesomeIcon icon={faSearch} className="me-2" />
          Search Outstanding Bills
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row className="g-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Patient Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter patient name"
                    value={searchFilters.patient_name}
                    onChange={(e) => setSearchFilters(prev => ({
                      ...prev,
                      patient_name: e.target.value
                    }))}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Mobile Number</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="Enter mobile number"
                    value={searchFilters.mobile}
                    onChange={(e) => setSearchFilters(prev => ({
                      ...prev,
                      mobile: e.target.value
                    }))}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>SID Number</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter SID number"
                    value={searchFilters.sid_number}
                    onChange={(e) => setSearchFilters(prev => ({
                      ...prev,
                      sid_number: e.target.value
                    }))}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>&nbsp;</Form.Label>
                  <div>
                    <Button type="submit" variant="primary" disabled={loading}>
                      {loading ? (
                        <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                      ) : (
                        <FontAwesomeIcon icon={faSearch} className="me-2" />
                      )}
                      Search
                    </Button>
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Due Amounts Table */}
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <span>Outstanding Bills ({dueAmounts.length})</span>
            <Badge bg="warning">
              Total Due: ₹{dueAmounts.reduce((sum, bill) => sum + bill.due_amount, 0).toFixed(2)}
            </Badge>
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <FontAwesomeIcon icon={faSpinner} spin size="2x" />
              <div className="mt-2">Loading due amounts...</div>
            </div>
          ) : dueAmounts.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <FontAwesomeIcon icon={faCheckCircle} size="3x" className="mb-3" />
              <div>No outstanding bills found</div>
            </div>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>SID</th>
                  <th>Patient</th>
                  <th>Contact</th>
                  <th>Bill Date</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Due Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dueAmounts.map((bill) => (
                  <tr key={bill.billing_id}>
                    <td>
                      <strong>{bill.sid_number}</strong>
                    </td>
                    <td>
                      <FontAwesomeIcon icon={faUser} className="me-1 text-muted" />
                      {bill.patient_name}
                    </td>
                    <td>
                      <FontAwesomeIcon icon={faPhone} className="me-1 text-muted" />
                      {bill.patient_mobile}
                    </td>
                    <td>
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-1 text-muted" />
                      {new Date(bill.billing_date).toLocaleDateString()}
                    </td>
                    <td>₹{bill.total_amount.toFixed(2)}</td>
                    <td>₹{bill.paid_amount.toFixed(2)}</td>
                    <td>
                      <strong className="text-danger">
                        ₹{bill.due_amount.toFixed(2)}
                      </strong>
                    </td>
                    <td>
                      <Badge bg={bill.payment_status === 'Pending' ? 'danger' : 'warning'}>
                        {bill.payment_status}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => {
                          setSelectedBilling(bill);
                          setPaymentData(prev => ({
                            ...prev,
                            payment_amount: bill.due_amount.toFixed(2)
                          }));
                          setShowPaymentModal(true);
                        }}
                      >
                        <FontAwesomeIcon icon={faCreditCard} className="me-1" />
                        Pay
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Payment Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faCreditCard} className="me-2" />
            Process Payment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBilling && (
            <>
              <div className="mb-3 p-3  rounded">
                <Row>
                  <Col md={6}>
                    <strong>Patient:</strong> {selectedBilling.patient_name}<br />
                    <strong>SID:</strong> {selectedBilling.sid_number}<br />
                    <strong>Mobile:</strong> {selectedBilling.patient_mobile}
                  </Col>
                  <Col md={6}>
                    <strong>Total Amount:</strong> ₹{selectedBilling.total_amount.toFixed(2)}<br />
                    <strong>Paid Amount:</strong> ₹{selectedBilling.paid_amount.toFixed(2)}<br />
                    <strong className="text-danger">Due Amount:</strong> ₹{selectedBilling.due_amount.toFixed(2)}
                  </Col>
                </Row>
              </div>

              <Form>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Payment Amount *</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        max={selectedBilling.due_amount}
                        value={paymentData.payment_amount}
                        onChange={(e) => setPaymentData(prev => ({
                          ...prev,
                          payment_amount: e.target.value
                        }))}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Payment Method *</Form.Label>
                      <Form.Select
                        value={paymentData.payment_method}
                        onChange={(e) => setPaymentData(prev => ({
                          ...prev,
                          payment_method: e.target.value
                        }))}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3 mt-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Reference Number</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Transaction/Reference ID"
                        value={paymentData.payment_reference}
                        onChange={(e) => setPaymentData(prev => ({
                          ...prev,
                          payment_reference: e.target.value
                        }))}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Notes</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Payment notes (optional)"
                        value={paymentData.notes}
                        onChange={(e) => setPaymentData(prev => ({
                          ...prev,
                          notes: e.target.value
                        }))}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handlePayment} disabled={loading}>
            {loading ? (
              <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
            ) : (
              <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
            )}
            Process Payment
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DueAmountManagement;
