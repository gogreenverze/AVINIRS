import React, { useState, useMemo } from 'react';
import { Card, Button, Form, InputGroup, Alert, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faSearch, faPlus, faEdit, faTrash, faFilter,
  faDownload, faUpload, faSortUp, faSortDown, faSort
} from '@fortawesome/free-solid-svg-icons';
import ResponsiveDataTable from './ResponsiveDataTable';

const MasterDataDetailView = ({
  category,
  title,
  data = [],
  columns = [],
  onBack,
  onAdd,
  onEdit,
  onDelete,
  loading = false,
  error = null
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = data.filter(item => {
        return Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(query)
        );
      });
    }

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortField] || '';
        const bValue = b[sortField] || '';
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortDirection === 'asc' ? comparison : -comparison;
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  // Note: Sorting and cell rendering is now handled by ResponsiveDataTable component

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading {title}...</p>
      </div>
    );
  }

  return (
    <div className="master-data-detail-view">
      {/* Header */}
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <Button
                variant="outline-light"
                size="sm"
                onClick={onBack}
                className="me-3"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </Button>
              <div>
                <h5 className="mb-0">{title}</h5>
                <small className="opacity-75">
                  {filteredAndSortedData.length} of {data.length} records
                </small>
              </div>
            </div>
            <Button
              variant="light"
              size="sm"
              onClick={() => onAdd(category)}
            >
              <FontAwesomeIcon icon={faPlus} className="me-1" />
              Add New
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          {/* Search and Filters */}
          <div className="row mb-3">
            <div className="col-md-6">
              <InputGroup>
                <InputGroup.Text>
                  <FontAwesomeIcon icon={faSearch} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={`Search ${title.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
            </div>
            <div className="col-md-6 text-end">
              <Button variant="outline-secondary" size="sm" className="me-2">
                <FontAwesomeIcon icon={faDownload} className="me-1" />
                Export
              </Button>
              <Button variant="outline-secondary" size="sm">
                <FontAwesomeIcon icon={faUpload} className="me-1" />
                Import
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          {/* Responsive Data Table */}
          <ResponsiveDataTable
            data={paginatedData}
            columns={columns}
            onEdit={onEdit}
            onDelete={onDelete}
            loading={loading}
            emptyMessage={searchQuery ? 'No matching records found' : 'No records available'}
            mobileCardConfig={{
              primaryField: columns[0]?.key || 'name',
              secondaryField: columns[1]?.key || 'description',
              statusField: 'is_active'
            }}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} entries
              </div>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, index) => (
                    <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(index + 1)}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default MasterDataDetailView;
