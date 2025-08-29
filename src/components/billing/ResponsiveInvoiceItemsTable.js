import React, { useState, useEffect } from 'react';
import { Table, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRupeeSign } from '@fortawesome/free-solid-svg-icons';
import InvoiceItemMobileCard from './InvoiceItemMobileCard';
import PropTypes from 'prop-types';

/**
 * Responsive invoice items table that switches between table and card view
 * based on screen size
 */
const ResponsiveInvoiceItemsTable = ({
  items = [],
  subtotal = 0,
  discount = 0,
  tax = 0,
  taxRate = 0,
  totalAmount = 0,
  title = 'Invoice Items'
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="mobile-invoice-items-container">
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              {title}
              <span className="badge bg-primary float-end">
                {items.length} Items
              </span>
            </h6>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="mobile-data-container">
              {items.map((item, index) => (
                <InvoiceItemMobileCard
                  key={index}
                  item={item}
                  index={index}
                />
              ))}
            </div>
            
            {/* Mobile Summary */}
            <div className="mobile-invoice-summary p-3 border-top">
              <div className="mobile-card-field">
                <div className="mobile-card-label fw-bold">
                  <FontAwesomeIcon icon={faRupeeSign} className="me-1" />
                  Subtotal
                </div>
                <div className="mobile-card-value fw-bold">
                  {formatCurrency(subtotal)}
                </div>
              </div>

              {discount > 0 && (
                <div className="mobile-card-field">
                  <div className="mobile-card-label fw-bold text-warning">
                    Discount
                  </div>
                  <div className="mobile-card-value fw-bold text-warning">
                    -{formatCurrency(discount)}
                  </div>
                </div>
              )}

              {/* {tax > 0 && (
                <div className="mobile-card-field">
                  <div className="mobile-card-label fw-bold">
                    Tax ({taxRate}%)
                  </div>
                  <div className="mobile-card-value fw-bold">
                    {formatCurrency(tax)}
                  </div>
                </div>
              )} */}

              <div className="mobile-card-field border-top pt-2 mt-2">
                <div className="mobile-card-label fw-bold text-primary fs-5">
                  <FontAwesomeIcon icon={faRupeeSign} className="me-1" />
                  Total
                </div>
                <div className="mobile-card-value fw-bold text-primary fs-5">
                  {formatCurrency(totalAmount)}
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="desktop-invoice-items-container">
      <h5 className="mb-3">{title}</h5>
      <div className="table-responsive">
        <Table className="table-hover" width="100%" cellSpacing="0">
          <thead>
            <tr>
              <th>Test Code</th>
              <th>Description</th>
              <th>Department</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Discount</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>
                  <span className="badge bg-secondary">
                    {item.test_code || item.hmsCode || `T${String(item.test_id || (index + 1)).padStart(3, '0')}`}
                  </span>
                </td>
                <td>
                  <div>
                    <strong>{item.description || item.test_name || item.testName}</strong>
                    <div className="mt-1">
                      <small className="text-primary">
                        Test ID: {item.test_id || 'N/A'}
                      </small>
                    </div>
                    {item.category && (
                      <div>
                        <small className="text-muted">{item.category}</small>
                      </div>
                    )}
                    {item.turnaround_time && (
                      <div>
                        <small className="text-info">TAT: {item.turnaround_time}</small>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <span className="">
                    {item.department || 'Laboratory'}
                  </span>
                </td>
                <td className="text-center">{item.quantity || 1}</td>
                <td>{formatCurrency(item.unit_price || item.price)}</td>
                <td className="text-center">
                  {item.discount ? `${item.discount}%` : '0%'}
                </td>
                <td className="fw-bold">{formatCurrency(item.total || item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="6" className="text-end"><strong>Subtotal:</strong></td>
              <td className="fw-bold">{formatCurrency(subtotal)}</td>
            </tr>
            {discount > 0 && (
              <tr>
                <td colSpan="6" className="text-end"><strong>Discount:</strong></td>
                <td className="fw-bold text-warning">-{formatCurrency(discount)}</td>
              </tr>
            )}
            {/* {tax > 0 && (
              <tr>
                <td colSpan="6" className="text-end"><strong>Tax ({taxRate}%):</strong></td>
                <td className="fw-bold">{formatCurrency(tax)}</td>
              </tr>
            )} */}
            <tr className="table-active">
              <td colSpan="6" className="text-end"><strong>Total:</strong></td>
              <td><strong className="text-primary fs-5">{formatCurrency(totalAmount)}</strong></td>
            </tr>
          </tfoot>
        </Table>
      </div>
    </div>
  );
};

ResponsiveInvoiceItemsTable.propTypes = {
  items: PropTypes.array.isRequired,
  subtotal: PropTypes.number,
  discount: PropTypes.number,
  tax: PropTypes.number,
  taxRate: PropTypes.number,
  totalAmount: PropTypes.number,
  title: PropTypes.string
};

export default ResponsiveInvoiceItemsTable;
