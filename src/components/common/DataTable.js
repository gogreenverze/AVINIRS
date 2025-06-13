import React, { useState } from 'react';
import { Table, Form, InputGroup, Button, Pagination } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSort, faSortUp, faSortDown, faEye, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import '../../styles/components/DataTable.css';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Reusable DataTable component with sorting, filtering, and pagination
 * 
 * @param {Object} props - Component props
 * @param {Array} props.data - Data to display in the table
 * @param {Array} props.columns - Column definitions
 * @param {Function} props.onRowClick - Function to call when a row is clicked
 * @param {boolean} props.isLoading - Whether the data is loading
 * @param {string} props.emptyMessage - Message to display when there is no data
 * @param {number} props.currentPage - Current page number
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Function to call when page changes
 * @param {string} props.searchPlaceholder - Placeholder text for search input
 * @param {Function} props.onSearch - Function to call when search is performed
 * @param {boolean} props.showSearch - Whether to show the search input
 * @param {Array} props.actions - Action buttons to display for each row
 */
const DataTable = ({
  data = [],
  columns = [],
  onRowClick,
  isLoading = false,
  emptyMessage = 'No data available',
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  searchPlaceholder = 'Search...',
  onSearch,
  showSearch = true,
  actions = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');


  const { currentUser } = useAuth();


  const userLocation = useLocation();

  // console.log("element",userLocation)


  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
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

  // Sort data if sortField is set
  const sortedData = [...data];
  if (sortField) {
    sortedData.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    
    // Previous button
    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      />
    );
    
    // First page
    items.push(
      <Pagination.Item 
        key={1} 
        active={currentPage === 1}
        onClick={() => onPageChange(1)}
      >
        1
      </Pagination.Item>
    );
    
    // Ellipsis if needed
    if (currentPage > 3) {
      items.push(<Pagination.Ellipsis key="ellipsis1" disabled />);
    }
    
    // Pages around current page
    for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page++) {
      items.push(
        <Pagination.Item 
          key={page} 
          active={currentPage === page}
          onClick={() => onPageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }
    
    // Ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
    }
    
    // Last page if not first page
    if (totalPages > 1) {
      items.push(
        <Pagination.Item 
          key={totalPages} 
          active={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    // Next button
    items.push(
      <Pagination.Next 
        key="next" 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      />
    );
    
    return items;
  };

  // Render sort icon
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <FontAwesomeIcon icon={faSort} className="ms-1 text-muted" />;
    }
    
    return sortDirection === 'asc' 
      ? <FontAwesomeIcon icon={faSortUp} className="ms-1 text-primary" />
      : <FontAwesomeIcon icon={faSortDown} className="ms-1 text-primary" />;
  };





      

       
      
  return (
    <div className="data-table-container">
      {/* Search */}
      {showSearch && (
        <div className="data-table-search mb-3">
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="primary" type="submit">
                <FontAwesomeIcon icon={faSearch} />
              </Button>
            </InputGroup>
          </Form>
        </div>
      )}

      {/* Table */}
      <div className="table-responsive">
        <Table className="data-table" hover>
          <thead>
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.field} 
                  onClick={() => column.sortable !== false && handleSort(column.field)}
                  className={column.sortable !== false ? 'sortable' : ''}
                  style={column.width ? { width: column.width } : {}}
                >
                  {column.header}
                  {column.sortable !== false && renderSortIcon(column.field)}
                </th>
              ))}
              {actions.length > 0 && <th className="actions-column">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="text-center">
                  {emptyMessage}
                </td>
              </tr>
            ) : userLocation.pathname == "/admin/users" ?
            (
              sortedData.map((row, rowIndex) => (
                <tr 
                  key={row.id || rowIndex} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={onRowClick ? 'clickable' : ''}
                >
                  { (
                    <>
                   <td className="actions-cell">{row.first_name}</td>
      <td className="actions-cell">{row.username}</td>
      <td className="actions-cell">{row.email}</td>
      <td className="actions-cell">{row.role}</td>
      <td className="actions-cell">{row?.tenant?.name}</td>
     <td>
                              <Link to={`/admin/users/${row.id}`} className="btn btn-info btn-sm me-1">
                                <FontAwesomeIcon icon={faEye} />
                              </Link>
                              <Link to={`/admin/users/${row.id}/edit`} className="btn btn-primary btn-sm me-1">
                                <FontAwesomeIcon icon={faEdit} />
                              </Link>
                              {currentUser?.id !== row.id && (
                                <Button variant="danger" size="sm">
                                  <FontAwesomeIcon icon={faTrash} />
                                </Button>
                              )}
                            </td>
      </>
                  )}
                  {/* {actions.length > 0 && (
                    <td className="actions-cell">
                      {actions.map((action, actionIndex) => (
                        <Button
                          key={actionIndex}
                          variant={action.variant || 'primary'}
                          size="sm"
                          className="me-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(row);
                          }}
                          disabled={action.isDisabled ? action.isDisabled(row) : false}
                        >
                          {action.icon && <FontAwesomeIcon icon={action.icon} className={action.label ? 'me-1' : ''} />}
                          {action.label}
                        </Button>
                      ))}
                    </td>
                  )} */}
                </tr>
              ))
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr 
                  key={row.id || rowIndex} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={onRowClick ? 'clickable' : ''}
                >
                  {columns.map((column) => (
                    <td key={`${rowIndex}-${column.field}`}>
                      {column.render ? column.render(row) : row[column.field]}
                   
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="actions-cell">
                      {actions.map((action, actionIndex) => (
                        <Button
                          key={actionIndex}
                          variant={action.variant || 'primary'}
                          size="sm"
                          className="me-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(row);
                          }}
                          disabled={action.isDisabled ? action.isDisabled(row) : false}
                        >
                          {action.icon && <FontAwesomeIcon icon={action.icon} className={action.label ? 'me-1' : ''} />}
                          {action.label}
                        </Button>
                      ))}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>{renderPaginationItems()}</Pagination>
        </div>
      )}
    </div>
  );
};

DataTable.propTypes = {
  data: PropTypes.array,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string.isRequired,
      header: PropTypes.string.isRequired,
      sortable: PropTypes.bool,
      width: PropTypes.string,
      render: PropTypes.func
    })
  ),
  onRowClick: PropTypes.func,
  isLoading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  onPageChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  onSearch: PropTypes.func,
  showSearch: PropTypes.bool,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      icon: PropTypes.object,
      variant: PropTypes.string,
      onClick: PropTypes.func.isRequired,
      isDisabled: PropTypes.func
    })
  )
};

export default DataTable;
