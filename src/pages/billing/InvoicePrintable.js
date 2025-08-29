
import React from 'react';

const InvoicePrintable = React.forwardRef(({ billing }, ref) => {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <div ref={ref} style={{ fontSize: '10pt', padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <img src="/logo.png" alt="Logo" style={{ width: 100 }} />
        <div style={{ textAlign: 'right' }}>
          <h3 style={{ margin: 0 }}>AVINI LABS</h3>
          <p style={{ margin: 0 }}>No. 69, Mahadhana Street. Mayiladuthurai.</p>
          <p style={{ margin: 0 }}>Phone: 6384440505, 6384440504</p>
        </div>
      </div>

      <hr style={{ margin: '10px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <p>PID No.: {billing.patient.patient_id}</p>
          <p>Referrer: {billing.referrer || 'N/A'}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p>SID No.: {billing.sid_number}</p>
          <p>SID Date: {new Date(billing.invoice_date).toLocaleString()}</p>
          <p>Print Date: {new Date().toLocaleString()}</p>
        </div>
      </div>

      <p style={{ fontWeight: 'bold' }}>
        {billing.patient.first_name} {billing.patient.last_name} ({billing.patient.age} Y /{' '}
        {billing.patient.gender})
      </p>

      {/* Items */}
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', fontWeight: 'bold', borderBottom: '1px solid #000' }}>
          <div style={{ width: 50 }}>Sl. No</div>
          <div style={{ flex: 1 }}>Description</div>
          <div style={{ width: 100, textAlign: 'right' }}>Amount</div>
        </div>
        {billing.items.map((item, index) => (
          <div key={index} style={{ display: 'flex', padding: '4px 0' }}>
            <div style={{ width: 50 }}>{index + 1}</div>
            <div style={{ flex: 1 }}>{item.description}</div>
            <div style={{ width: 100, textAlign: 'right' }}>{formatCurrency(item.total)}</div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Bill Amount</span>
          <span>{formatCurrency(billing.total_amount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Discount</span>
          <span>{formatCurrency(billing.discount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <strong>Total Amount</strong>
          <strong>{formatCurrency(billing.total_amount - billing.discount)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Due Amount</span>
          <span>{formatCurrency(billing.total_amount - billing.paid_amount)}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 40 }}>
        <div style={{ textAlign: 'right' }}>
          <p>For AVINI LABS</p>
          <p>Authorised Signatory</p>
        </div>
        <div style={{ fontSize: '8pt' }}>
          <p>Note:</p>
          <p>1) Please be advised that your report will be available online or will be sent to your email subject to full payment.</p>
          <p>This is an Electronically generated Receipt & Does Not Require Signature.</p>
          <p>Bill User: {billing.created_by || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
});

export default InvoicePrintable;
