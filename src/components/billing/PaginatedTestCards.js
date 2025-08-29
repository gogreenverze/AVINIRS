import React, { useState, useEffect } from 'react';
import { Table, Alert, Pagination as BootstrapPagination } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const PaginatedTestTable = ({
  testItems = [],
  title = 'Test Details',
  itemsPerPage = 5,
  editMode = false,
  onResultChange
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [testItems]);

  const totalItems = testItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = testItems.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const tableSection = document.querySelector('.test-table-section');
    if (tableSection) {
      tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <BootstrapPagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </BootstrapPagination.Item>
      );
    }
    return <BootstrapPagination className="justify-content-center">{pages}</BootstrapPagination>;
  };

  if (!testItems || testItems.length === 0) {
    return (
      <Alert variant="info">
        <div className="d-flex align-items-center">
          <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
          <div>
            <strong>No Test Details Available</strong>
            <div>No test items found for this billing report.</div>
          </div>
        </div>
      </Alert>
    );
  }

  return (
    <div className="test-table-section">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="text-primary mb-0">
          <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
          {title} ({totalItems} tests)
        </h6>
        {totalPages > 1 && (
          <small className="text-muted">
            Page {currentPage} of {totalPages}
          </small>
        )}
      </div>

      <Table responsive bordered hover size="sm" className='mb-3'>
        <thead className="table-primary text-black ">
          <tr>
            <th className="text-black">#</th>
            <th className="text-black">Test Name</th>
            <th className="text-black">Result</th>
            <th className="text-black">Units</th>
            <th className="text-black">Reference Range</th>
            {/* Add more columns if needed */}
          </tr>
        </thead>
        <tbody>
          {currentItems.map((test, index) => (
            <tr key={test.id || test.test_master_id || test.test_id || index}>
              <td>{startIndex + index + 1}</td>
              <td>{test.name || test.test_name}</td>
              <td>{editMode ? (
                <input
                  type="text"
                  value={test.result || ''}
                  onChange={(e) =>
                    onResultChange?.(startIndex + index, {
                      ...test,
                      result: e.target.value
                    })
                  }
                  className="form-control form-control-sm"
                />
              ) : (
                test.result || '-'
              )}</td>
              <td>{test.unit || '-'}</td>
              <td>{test.reference_range || '-'}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      {totalPages > 1 && renderPagination()}

      <div className="d-block d-md-none text-center mt-3">
        <small className="text-muted">
          Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} tests
        </small>
      </div>
    </div>
  );
};

export default PaginatedTestTable;
