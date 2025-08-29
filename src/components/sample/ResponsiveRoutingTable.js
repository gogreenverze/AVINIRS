import React, { useState, useEffect } from 'react';
import { Table, Card, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faCheck, faTimes, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import RoutingMobileCard from './RoutingMobileCard';
import Pagination from '../common/Pagination';
import PropTypes from 'prop-types';

/**
 * Responsive routing table that switches between table and card view
 * based on screen size with pagination support
 */
const ResponsiveRoutingTable = ({
  routings = [],
  type = 'incoming',
  title = 'Transfers',
  loading = false,
  itemsPerPage = 20
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Reset to first page when routings change
  useEffect(() => {
    setCurrentPage(1);
  }, [routings]);

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'in transit':
        return 'info';
      case 'delivered':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Pagination calculations
  const totalItems = routings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoutings = routings.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of table on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <Card className="shadow mb-4">
        <Card.Body className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading transfers...</p>
        </Card.Body>
      </Card>
    );
  }

  if (totalItems === 0) {
    return (
      <Alert variant="info" className="text-center">
        <FontAwesomeIcon icon={faArrowRight} className="me-2" />
        No {type} transfers found.
      </Alert>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="mobile-routing-container">
        <Card className="shadow mb-4">
          <Card.Header className="py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              {title}
              <span className="badge bg-primary float-end">
                {totalItems} Records
              </span>
            </h6>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="mobile-data-container">
              {paginatedRoutings.map(routing => (
                <RoutingMobileCard
                  key={routing.id}
                  routing={routing}
                  type={type}
                />
              ))}
            </div>
          </Card.Body>
        </Card>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          size="sm"
          className="mt-3"
        />
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="desktop-routing-container">
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">
            {title}
            <span className="badge bg-primary float-end">
              {totalItems} Records
            </span>
          </h6>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table className="table-hover" width="100%" cellSpacing="0">
              <thead>
                <tr>
                  <th>Sample ID</th>
                  <th>{type === 'incoming' ? 'From' : 'To'}</th>
                  <th>Dispatch Date</th>
                  <th>Tracking #</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRoutings.map(routing => (
                  <tr key={routing.id}>
                    <td>
                      {routing.sample ? (
                        <Link to={`/samples/${routing.sample.id}`}>
                          {routing.sample.sample_id}
                        </Link>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      {type === 'incoming' 
                        ? (routing.from_tenant?.name || 'Unknown')
                        : (routing.to_tenant?.name || 'Unknown')
                      }
                    </td>
                    <td>
                      {routing.dispatch_date
                        ? new Date(routing.dispatch_date).toLocaleDateString()
                        : 'Not dispatched'
                      }
                    </td>
                    <td>{routing.tracking_number || 'N/A'}</td>
                    <td>
                      <span className={`badge bg-${getStatusBadgeVariant(routing.status)}`}>
                        {routing.status}
                      </span>
                    </td>
                    <td>
                      <Link 
                        to={`/samples/routing/${routing.id}`} 
                        className="btn btn-info btn-sm me-1"
                        aria-label={`View routing details for ${routing.sample?.sample_id || 'sample'}`}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </Link>
                      {type === 'incoming' && routing.status === 'In Transit' && (
                        <>
                          <Link 
                            to={`/samples/routing/${routing.id}/receive`} 
                            className="btn btn-success btn-sm me-1"
                            aria-label={`Receive sample ${routing.sample?.sample_id || 'sample'}`}
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </Link>
                          <Link 
                            to={`/samples/routing/${routing.id}/reject`} 
                            className="btn btn-danger btn-sm"
                            aria-label={`Reject sample ${routing.sample?.sample_id || 'sample'}`}
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </Link>
                        </>
                      )}
                      {type === 'outgoing' && routing.status === 'Pending' && (
                        <Link 
                          to={`/samples/routing/${routing.id}/dispatch`} 
                          className="btn btn-primary btn-sm"
                          aria-label={`Dispatch sample ${routing.sample?.sample_id || 'sample'}`}
                        >
                          <FontAwesomeIcon icon={faArrowRight} />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        className="mt-3"
      />
    </div>
  );
};

ResponsiveRoutingTable.propTypes = {
  routings: PropTypes.array.isRequired,
  type: PropTypes.oneOf(['incoming', 'outgoing']).isRequired,
  title: PropTypes.string,
  loading: PropTypes.bool,
  itemsPerPage: PropTypes.number
};

export default ResponsiveRoutingTable;
