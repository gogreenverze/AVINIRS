import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, Button, Table, Badge, Row, Col, Form, InputGroup, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxes, faArrowLeft, faSearch, faFilter, faDownload,
  faCalendarAlt, faExchangeAlt, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { inventoryAPI } from '../../services/api';
import {
  DateInput,
  SelectInput,
  DataTable,
  ErrorModal
} from '../../components/common';
import '../../styles/InventoryTransactions.css';

const InventoryTransactions = () => {
  const { id } = useParams();

  // State for inventory item
  const [item, setItem] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('transaction_date');
  const [sortDirection, setSortDirection] = useState('desc');

  // Filter state
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Type options
  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'in', label: 'Stock In' },
    { value: 'out', label: 'Stock Out' }
  ];

  // Reason options
  const reasonOptions = [
    { value: '', label: 'All Reasons' },
    { value: 'Purchase', label: 'Purchase' },
    { value: 'Return', label: 'Return' },
    { value: 'Adjustment', label: 'Adjustment' },
    { value: 'Transfer', label: 'Transfer' },
    { value: 'Usage', label: 'Usage' },
    { value: 'Damage', label: 'Damage' },
    { value: 'Expired', label: 'Expired' },
    { value: 'Other', label: 'Other' }
  ];

  // Fetch inventory item and transactions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch item details
        const itemResponse = await inventoryAPI.getInventoryItemById(id);
        setItem(itemResponse.data);

        // Fetch transactions
        const transactionsResponse = await inventoryAPI.getInventoryTransactions(id);
        const transactionsData = transactionsResponse.data.transactions || transactionsResponse.data || [];
        setTransactions(transactionsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load inventory transactions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
    setCurrentPage(1);
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      type: '',
      startDate: '',
      endDate: '',
      reason: ''
    });
    setCurrentPage(1);
  };

  // Export transactions to CSV
  const exportToCSV = () => {
    try {
      // Filter transactions based on current filters
      const filteredData = applyFilters(transactions);

      // Create CSV content
      const headers = ['Date', 'Type', 'Quantity', 'Reason', 'Performed By', 'Notes'];
      const csvContent = [
        headers.join(','),
        ...filteredData.map(transaction => [
          new Date(transaction.transaction_date).toLocaleDateString(),
          transaction.type === 'in' ? 'Stock In' : 'Stock Out',
          `${transaction.quantity} ${item.unit}`,
          transaction.reason,
          transaction.performed_by || 'N/A',
          transaction.notes ? `"${transaction.notes.replace(/"/g, '""')}"` : 'N/A'
        ].join(','))
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${item.name}_transactions.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting to CSV:', err);
      setErrorMessage('Failed to export transactions to CSV. Please try again.');
      setShowErrorModal(true);
    }
  };

  // Apply filters to transactions
  const applyFilters = (data) => {
    return data.filter(transaction => {
      // Filter by type
      if (filters.type && transaction.type !== filters.type) {
        return false;
      }

      // Filter by reason
      if (filters.reason && transaction.reason !== filters.reason) {
        return false;
      }

      // Filter by date range
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        const transactionDate = new Date(transaction.transaction_date);
        if (transactionDate < startDate) {
          return false;
        }
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59); // Set to end of day
        const transactionDate = new Date(transaction.transaction_date);
        if (transactionDate > endDate) {
          return false;
        }
      }

      return true;
    });
  };

  // Filter and sort transactions
  const filteredTransactions = applyFilters(transactions)
    .sort((a, b) => {
      if (sortDirection === 'asc') {
        return a[sortField] > b[sortField] ? 1 : -1;
      } else {
        return a[sortField] < b[sortField] ? 1 : -1;
      }
    });

  // Paginate transactions
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Table columns
  const columns = [
    {
      header: 'Date',
      accessor: 'transaction_date',
      sortable: true,
      cell: (row) => formatDate(row.transaction_date)
    },
    {
      header: 'Type',
      accessor: 'type',
      sortable: true,
      cell: (row) => (
        <Badge bg={row.type === 'in' ? 'success' : 'danger'}>
          {row.type === 'in' ? 'Stock In' : 'Stock Out'}
        </Badge>
      )
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      sortable: true,
      cell: (row) => (
        <span>{row.quantity} {item?.unit}</span>
      )
    },
    {
      header: 'Reason',
      accessor: 'reason',
      sortable: true
    },
    {
      header: 'Performed By',
      accessor: 'performed_by',
      sortable: true,
      cell: (row) => row.performed_by || 'N/A'
    },
    {
      header: 'Notes',
      accessor: 'notes',
      sortable: false,
      cell: (row) => row.notes || 'N/A'
    }
  ];

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading inventory transactions...</p>
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

  if (!item) {
    return (
      <div className="alert alert-warning" role="alert">
        Inventory item not found.
      </div>
    );
  }

  return (
    <div className="inventory-transactions-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faExchangeAlt} className="me-2" />
          Inventory Transactions
        </h1>
        <div>
          <Link to={`/inventory/${id}`} className="btn btn-secondary me-2">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Item
          </Link>
          <Button variant="success" onClick={exportToCSV}>
            <FontAwesomeIcon icon={faDownload} className="me-2" />
            Export to CSV
          </Button>
        </div>
      </div>

      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Item Information</h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <div className="item-detail">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{item.name}</span>
              </div>
            </Col>
            <Col md={3}>
              <div className="item-detail">
                <span className="detail-label">SKU:</span>
                <span className="detail-value">{item.sku}</span>
              </div>
            </Col>
            <Col md={3}>
              <div className="item-detail">
                <span className="detail-label">Current Quantity:</span>
                <span className="detail-value">{item.quantity} {item.unit}</span>
              </div>
            </Col>
            <Col md={3}>
              <div className="item-detail">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{item.category}</span>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Transaction Filters</h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <SelectInput
                name="type"
                label="Transaction Type"
                value={filters.type}
                onChange={handleFilterChange}
                options={typeOptions}
              />
            </Col>
            <Col md={3}>
              <SelectInput
                name="reason"
                label="Reason"
                value={filters.reason}
                onChange={handleFilterChange}
                options={reasonOptions}
              />
            </Col>
            <Col md={3}>
              <DateInput
                name="startDate"
                label="Start Date"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </Col>
            <Col md={3}>
              <DateInput
                name="endDate"
                label="End Date"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </Col>
          </Row>
          <div className="d-flex justify-content-end mt-3">
            <Button variant="secondary" onClick={resetFilters}>
              <FontAwesomeIcon icon={faFilter} className="me-2" />
              Reset Filters
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card className="shadow mb-4">
        <Card.Header className="py-3 d-flex justify-content-between align-items-center">
          <h6 className="m-0 font-weight-bold text-primary">Transaction History</h6>
          <div className="transaction-summary">
            <span className="me-3">
              <Badge bg="success" className="me-1">In</Badge> {transactions.filter(t => t.type === 'in').reduce((sum, t) => sum + t.quantity, 0)} {item.unit}
            </span>
            <span>
              <Badge bg="danger" className="me-1">Out</Badge> {transactions.filter(t => t.type === 'out').reduce((sum, t) => sum + t.quantity, 0)} {item.unit}
            </span>
          </div>
        </Card.Header>
        <Card.Body>
          {filteredTransactions.length > 0 ? (
            <div className="table-responsive">
              <DataTable
                columns={columns}
                data={currentTransactions}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onSort={handleSort}
                sortField={sortField}
                sortDirection={sortDirection}
                loading={loading}
                emptyMessage="No transactions found."
              />
            </div>
          ) : (
            <Alert variant="info">
              <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
              No transactions found matching the current filters.
            </Alert>
          )}
        </Card.Body>
      </Card>

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

export default InventoryTransactions;
