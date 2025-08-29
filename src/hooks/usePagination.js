import { useState, useMemo } from 'react';

/**
 * Custom hook for pagination logic
 * 
 * @param {Array} data - The data array to paginate
 * @param {number} itemsPerPage - Number of items per page (default: 20)
 * @returns {Object} Pagination state and methods
 */
const usePagination = (data = [], itemsPerPage = 20) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination values
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Get paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      // Scroll to top on page change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset to first page when data changes
  const resetPagination = () => {
    setCurrentPage(1);
  };

  // Go to specific page
  const goToPage = (page) => {
    handlePageChange(page);
  };

  // Go to next page
  const goToNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Go to previous page
  const goToPrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  // Go to first page
  const goToFirst = () => {
    handlePageChange(1);
  };

  // Go to last page
  const goToLast = () => {
    handlePageChange(totalPages);
  };

  // Check if we can go to next page
  const canGoNext = currentPage < totalPages;

  // Check if we can go to previous page
  const canGoPrevious = currentPage > 1;

  // Get current page info
  const getCurrentPageInfo = () => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    return {
      startItem,
      endItem,
      totalItems,
      currentPage,
      totalPages
    };
  };

  return {
    // Data
    paginatedData,
    
    // State
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    
    // Methods
    handlePageChange,
    resetPagination,
    goToPage,
    goToNext,
    goToPrevious,
    goToFirst,
    goToLast,
    
    // Utilities
    canGoNext,
    canGoPrevious,
    getCurrentPageInfo
  };
};

export default usePagination;
