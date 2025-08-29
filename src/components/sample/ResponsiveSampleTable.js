import React, { useState, useEffect } from 'react';
import { Table, Card, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEdit, faExchangeAlt, faVial } from '@fortawesome/free-solid-svg-icons';
import SampleMobileCard from './SampleMobileCard';
import Pagination from '../common/Pagination';
import PropTypes from 'prop-types';

/**
 * Responsive sample table that switches between table and card view
 * based on screen size with pagination support
 */
const ResponsiveSampleTable = ({
  samples = [],
  title = 'Sample List',
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

  // Reset to first page when samples change
  useEffect(() => {
    setCurrentPage(1);
  }, [samples]);

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'collected':
        return 'success';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'completed':
        return 'primary';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Pagination calculations
  const totalItems = samples.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSamples = samples.slice(startIndex, endIndex);

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
          <p className="mt-3 text-muted">Loading samples...</p>
        </Card.Body>
      </Card>
    );
  }

  if (totalItems === 0) {
    return (
      <Alert variant="info" className="text-center">
        <FontAwesomeIcon icon={faVial} className="me-2" />
        No samples found.
      </Alert>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="mobile-sample-container">
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
              {paginatedSamples.map(sample => (
                <SampleMobileCard
                  key={sample.id}
                  sample={sample}
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
    <div className="desktop-sample-container">
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
                  <th>Patient</th>
                  <th>Sample Type</th>
                  <th>Collection Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSamples.map(sample => (
                  <tr key={sample.id}>
                    <td>
                      <Link 
                        to={`/samples/${sample.id}`}
                        className="fw-bold text-decoration-none"
                        aria-label={`View sample details for ${sample.sample_id}`}
                      >
                        {sample.sample_id}
                      </Link>
                    </td>
                    <td>
                      {sample.patient ? (
                        <Link 
                          to={`/patients/${sample.patient.id}`}
                          className="text-decoration-none"
                          aria-label={`View patient details for ${sample.patient.first_name} ${sample.patient.last_name}`}
                        >
                          {sample.patient.first_name} {sample.patient.last_name}
                        </Link>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>{sample.sample_type || 'N/A'}</td>
                    <td>
                      {sample.collection_date
                        ? new Date(sample.collection_date).toLocaleDateString()
                        : 'N/A'
                      }
                    </td>
                    <td>
                      <Badge bg={getStatusBadgeVariant(sample.status)}>
                        {sample.status || 'Unknown'}
                      </Badge>
                    </td>
                    <td>
                      <Link 
                        to={`/samples/${sample.id}`} 
                        className="btn btn-info btn-sm me-1"
                        aria-label={`View sample details for ${sample.sample_id}`}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </Link>
                      <Link 
                        to={`/samples/${sample.id}/edit`} 
                        className="btn btn-primary btn-sm me-1"
                        aria-label={`Edit sample ${sample.sample_id}`}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Link>
                      {sample.status === 'Collected' && (
                        <Link 
                          to={`/samples/routing/create?sample_id=${sample.id}`} 
                          className="btn btn-warning btn-sm"
                          aria-label={`Transfer sample ${sample.sample_id}`}
                        >
                          <FontAwesomeIcon icon={faExchangeAlt} />
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

ResponsiveSampleTable.propTypes = {
  samples: PropTypes.array.isRequired,
  title: PropTypes.string,
  loading: PropTypes.bool,
  itemsPerPage: PropTypes.number
};

export default ResponsiveSampleTable;
