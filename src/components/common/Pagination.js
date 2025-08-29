import React from 'react';
import { Pagination as BootstrapPagination } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';

/**
 * Reusable Pagination Component with Mobile-Responsive Design
 * 
 * Features:
 * - Mobile-first responsive design
 * - WCAG AA compliant
 * - Touch-friendly controls
 * - Configurable page size (default: 20)
 * - Smart ellipsis for large page counts
 */
const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 20,
  onPageChange,
  showInfo = true,
  size = 'md',
  className = ''
}) => {
  // Don't render if there's only one page or no items
  if (totalPages <= 1 || totalItems === 0) {
    return null;
  }

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  // Generate pagination items with smart ellipsis
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    // Previous button
    items.push(
      <BootstrapPagination.Prev 
        key="prev" 
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        <FontAwesomeIcon icon={faChevronLeft} className="d-none d-md-inline me-1" />
        <span className="d-none d-md-inline">Previous</span>
        <span className="d-md-none">
          <FontAwesomeIcon icon={faChevronLeft} />
        </span>
      </BootstrapPagination.Prev>
    );

    // First page (always show)
    if (totalPages > 0) {
      items.push(
        <BootstrapPagination.Item 
          key={1} 
          active={currentPage === 1}
          onClick={() => handlePageChange(1)}
          aria-label="Go to page 1"
          aria-current={currentPage === 1 ? 'page' : undefined}
        >
          1
        </BootstrapPagination.Item>
      );
    }

    // Left ellipsis
    if (currentPage > 4) {
      items.push(
        <BootstrapPagination.Ellipsis 
          key="ellipsis-left" 
          disabled 
          aria-label="More pages"
        >
          <FontAwesomeIcon icon={faEllipsisH} />
        </BootstrapPagination.Ellipsis>
      );
    }

    // Pages around current page
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    
    for (let page = startPage; page <= endPage; page++) {
      if (page !== 1 && page !== totalPages) {
        items.push(
          <BootstrapPagination.Item 
            key={page} 
            active={currentPage === page}
            onClick={() => handlePageChange(page)}
            aria-label={`Go to page ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </BootstrapPagination.Item>
        );
      }
    }

    // Right ellipsis
    if (currentPage < totalPages - 3) {
      items.push(
        <BootstrapPagination.Ellipsis 
          key="ellipsis-right" 
          disabled 
          aria-label="More pages"
        >
          <FontAwesomeIcon icon={faEllipsisH} />
        </BootstrapPagination.Ellipsis>
      );
    }

    // Last page (always show if more than 1 page)
    if (totalPages > 1) {
      items.push(
        <BootstrapPagination.Item 
          key={totalPages} 
          active={currentPage === totalPages}
          onClick={() => handlePageChange(totalPages)}
          aria-label={`Go to page ${totalPages}`}
          aria-current={currentPage === totalPages ? 'page' : undefined}
        >
          {totalPages}
        </BootstrapPagination.Item>
      );
    }

    // Next button
    items.push(
      <BootstrapPagination.Next 
        key="next" 
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
      >
        <span className="d-none d-md-inline">Next</span>
        <FontAwesomeIcon icon={faChevronRight} className="d-none d-md-inline ms-1" />
        <span className="d-md-none">
          <FontAwesomeIcon icon={faChevronRight} />
        </span>
      </BootstrapPagination.Next>
    );

    return items;
  };

  // Calculate display info
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`pagination-container ${className}`}>
      {/* Pagination Info */}
      {showInfo && (
        <div className="pagination-info text-center text-md-start mb-3">
          <small className="text-muted">
            Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{' '}
            <strong>{totalItems}</strong> results
          </small>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="d-flex justify-content-center">
        <BootstrapPagination 
          size={size}
          className="mb-0"
          aria-label="Page navigation"
        >
          {renderPaginationItems()}
        </BootstrapPagination>
      </div>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired,
  itemsPerPage: PropTypes.number,
  onPageChange: PropTypes.func.isRequired,
  showInfo: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string
};

export default Pagination;
