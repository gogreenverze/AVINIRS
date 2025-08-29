import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxes, faPlus, faSearch, faFilter
} from '@fortawesome/free-solid-svg-icons';
import { inventoryAPI } from '../../services/api';
import {
  DeleteConfirmationModal,
  SuccessModal,
  ErrorModal
} from '../../components/common';
import ResponsiveInventoryTable from '../../components/inventory/ResponsiveInventoryTable';
import '../../styles/InventoryList.css';

const InventoryList = () => {
  // State for inventory items
  const [inventoryItems, setInventoryItems] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterCategory, setFilterCategory] = useState('');

  // Categories for filtering
  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'Reagents', label: 'Reagents' },
    { value: 'Consumables', label: 'Consumables' },
    { value: 'Equipment', label: 'Equipment' },
    { value: 'Chemicals', label: 'Chemicals' },
    { value: 'Glassware', label: 'Glassware' }
  ];

  // Fetch inventory items
  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await inventoryAPI.getInventoryItems();
        setInventoryItems(response.data.items || []);
      } catch (err) {
        console.error('Error fetching inventory items:', err);
        setError('Failed to load inventory items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryItems();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
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

  // Handle filter
  const handleFilter = (e) => {
    setFilterCategory(e.target.value);
    setCurrentPage(1);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await inventoryAPI.deleteInventoryItem(itemToDelete.id);

      setInventoryItems(prevItems =>
        prevItems.filter(item => item.id !== itemToDelete.id)
      );

      setShowDeleteModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      setErrorMessage('Failed to delete inventory item. Please try again.');
      setShowDeleteModal(false);
      setShowErrorModal(true);
    }
  };

  // Filter and sort inventory items
  const filteredItems = inventoryItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory ? item.category === filterCategory : true;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortDirection === 'asc') {
        return a[sortField] > b[sortField] ? 1 : -1;
      } else {
        return a[sortField] < b[sortField] ? 1 : -1;
      }
    });

  // Paginate inventory items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Get stock level badge variant
  const getStockLevelBadgeVariant = (quantity, reorderLevel) => {
    if (quantity <= 0) {
      return 'danger';
    } else if (quantity <= reorderLevel) {
      return 'warning';
    } else {
      return 'success';
    }
  };

  // Get stock level text
  const getStockLevelText = (quantity, reorderLevel) => {
    if (quantity <= 0) {
      return 'Out of Stock';
    } else if (quantity <= reorderLevel) {
      return 'Low Stock';
    } else {
      return 'In Stock';
    }
  };



  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading inventory items...</p>
      </div>
    );
  }

  return (
    <div className="inventory-list-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faBoxes} className="me-2" />
          Inventory Management
        </h1>
        <Link to="/inventory/create" className="btn btn-primary">
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Add New Item
        </Link>
      </div>

      <Card className="shadow mb-4">
        <Card.Header className="py-3 d-flex flex-wrap justify-content-between align-items-center">
          <h6 className="m-0 font-weight-bold text-primary">Inventory Items</h6>
          <div className="d-flex">
            <Form.Select
              className="me-2"
              style={{ width: 'auto' }}
              value={filterCategory}
              onChange={handleFilter}
            >
              {categories?.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </Form.Select>
            <InputGroup style={{ width: 'auto' }}>
              <Form.Control
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearch}
              />
              <Button variant="outline-secondary">
                <FontAwesomeIcon icon={faSearch} />
              </Button>
            </InputGroup>
          </div>
        </Card.Header>
        <Card.Body>
          {error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : (
            <ResponsiveInventoryTable
              items={currentItems}
              title="Inventory Items"
              loading={loading}
              itemsPerPage={itemsPerPage}
              onDelete={handleDeleteConfirm}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </Card.Body>
      </Card>

      {/* Stock Level Summary */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-left-success shadow h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    In Stock Items
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {inventoryItems.filter(item => item.quantity > item.reorder_level).length}
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faBoxes} className="fa-2x text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-left-warning shadow h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Low Stock Items
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {inventoryItems.filter(item => item.quantity > 0 && item.quantity <= item.reorder_level).length}
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faBoxes} className="fa-2x text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-left-danger shadow h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">
                    Out of Stock Items
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {inventoryItems.filter(item => item.quantity <= 0).length}
                  </div>
                </div>
                <div className="col-auto">
                  <FontAwesomeIcon icon={faBoxes} className="fa-2x text-gray-300" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Inventory Item"
        message={`Are you sure you want to delete the inventory item "${itemToDelete?.name}"? This action cannot be undone.`}
      />

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        title="Success"
        message="Inventory item has been deleted successfully."
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

export default InventoryList;
