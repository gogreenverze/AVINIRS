import React from 'react';
import { Table, Button, Form, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

const InvoiceLineItems = ({ lineItems, onChange }) => {
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    onChange(updatedItems);
  };

  const addLineItem = () => {
    const newItems = [...lineItems, {
      description: '',
      quantity: 1,
      unit_price: 0
    }];
    onChange(newItems);
  };

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      const updatedItems = lineItems.filter((_, i) => i !== index);
      onChange(updatedItems);
    }
  };

  const calculateLineTotal = (quantity, unitPrice) => {
    const total = parseFloat(quantity) * parseFloat(unitPrice);
    return isNaN(total) ? 0 : total.toFixed(2);
  };

  return (
    <div className="border rounded p-3">
      <div className="table-responsive">
        <Table size="sm" className="mb-3">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Description</th>
              <th style={{ width: '15%' }}>Quantity</th>
              <th style={{ width: '20%' }}>Unit Price</th>
              <th style={{ width: '20%' }}>Total</th>
              <th style={{ width: '5%' }}></th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, index) => (
              <tr key={index}>
                <td>
                  <Form.Control
                    type="text"
                    placeholder="Service description..."
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    size="sm"
                  />
                </td>
                <td>
                  <Form.Control
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    size="sm"
                  />
                </td>
                <td>
                  <InputGroup size="sm">
                    <InputGroup.Text>₹</InputGroup.Text>
                    <Form.Control
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                    />
                  </InputGroup>
                </td>
                <td>
                  <div className="py-2 px-2 bg-light rounded text-end">
                    ₹{calculateLineTotal(item.quantity, item.unit_price)}
                  </div>
                </td>
                <td>
                  {lineItems.length > 1 && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      title="Remove line item"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      
      <div className="text-center">
        <Button
          variant="outline-primary"
          size="sm"
          onClick={addLineItem}
        >
          <FontAwesomeIcon icon={faPlus} className="me-1" />
          Add Line Item
        </Button>
      </div>
    </div>
  );
};

export default InvoiceLineItems;
