import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

const EditBillingModal = ({ show, onHide, billing }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (billing) {
      setFormData(billing);
    }
  }, [billing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNestedChange = (e, field) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [name]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    try {
     const token = localStorage.getItem('token'); // or whatever key you use

const response = await fetch(`/api/billing/${billing.id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(formData),
});

      const result = await response.json();
      if (result.success) {
        onHide();
      } else {
        alert(result.message || 'Update failed');
      }
    } catch (error) {
      console.error('Update error', error);
    }
  };

  return (
    <Modal show={show} onHide={onHide} backdrop="static" size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Billing Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select name="status" value={formData.status || ''} onChange={handleChange}>
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                  <option value="Completed">Completed</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Invoice Number</Form.Label>
                <Form.Control type="text" name="invoice_number" value={formData.invoice_number || ''} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Invoice Date</Form.Label>
                <Form.Control type="date" name="invoice_date" value={formData.invoice_date?.slice(0, 10) || ''} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Due Date</Form.Label>
                <Form.Control type="date" name="due_date" value={formData.due_date?.slice(0, 10) || ''} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>SID Number</Form.Label>
                <Form.Control type="text" name="sid_number" value={formData.sid_number || ''} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Patient First Name</Form.Label>
                <Form.Control type="text" name="first_name" value={formData.patient?.first_name || ''} onChange={(e) => handleNestedChange(e, 'patient')} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Patient Last Name</Form.Label>
                <Form.Control type="text" name="last_name" value={formData.patient?.last_name || ''} onChange={(e) => handleNestedChange(e, 'patient')} />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Total Amount</Form.Label>
                <Form.Control type="number" name="total_amount" value={formData.total_amount || ''} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Paid Amount</Form.Label>
                <Form.Control type="number" name="paid_amount" value={formData.paid_amount || ''} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>GST Rate (%)</Form.Label>
                <Form.Control type="number" name="gst_rate" value={formData.gst_rate || ''} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>GST Amount</Form.Label>
                <Form.Control type="number" name="gst_amount" value={formData.gst_amount || ''} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Discount (%)</Form.Label>
                <Form.Control type="number" name="discount_percent" value={formData.discount_percent || ''} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control as="textarea" name="notes" value={formData.notes || ''} rows={3} onChange={handleChange} />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Other Charges</Form.Label>
                <Form.Control type="number" name="other_charges" value={formData.other_charges || 0} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Subtotal</Form.Label>
                <Form.Control type="number" name="subtotal" value={formData.subtotal || 0} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Balance</Form.Label>
                <Form.Control type="number" name="balance" value={formData.balance || 0} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Branch</Form.Label>
                <Form.Control type="text" name="branch" value={formData.branch || ''} onChange={handleChange} />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Payment Status</Form.Label>
                <Form.Control type="text" name="payment_status" value={formData.payment_status || ''} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Payment Method</Form.Label>
                <Form.Control type="text" name="payment_method" value={formData.payment_method || ''} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Created By</Form.Label>
                <Form.Control type="text" name="created_by" value={formData.created_by || ''} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Tenant ID</Form.Label>
                <Form.Control type="text" name="tenant_id" value={formData.tenant_id || ''} onChange={handleChange} />
              </Form.Group>
            </Col>
          </Row>

          {/* Items are not editable here directly, but you can add another modal/table for that */}
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>Save Changes</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditBillingModal;
