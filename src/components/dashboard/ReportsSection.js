import React, { useState } from 'react';
import { Row, Col, Card, Table, Button, Badge, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileAlt, faDownload, faEye, faChartBar, faCalendarAlt,
  faFilter, faSearch, faPrint, faShare
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const ReportsSection = ({ data, userRole }) => {
  const [reportType, setReportType] = useState('all');
  const [dateRange, setDateRange] = useState('week');

  // Mock reports data - replace with actual API call
  const reports = [
    {
      id: 1,
      name: 'Daily Patient Report',
      type: 'patient',
      generated_at: '2024-01-15T10:30:00',
      status: 'completed',
      file_size: '2.3 MB',
      format: 'PDF'
    },
    {
      id: 2,
      name: 'Monthly Revenue Analysis',
      type: 'financial',
      generated_at: '2024-01-15T09:15:00',
      status: 'completed',
      file_size: '1.8 MB',
      format: 'Excel'
    },
    {
      id: 3,
      name: 'Lab Performance Metrics',
      type: 'operational',
      generated_at: '2024-01-15T08:45:00',
      status: 'processing',
      file_size: null,
      format: 'PDF'
    }
  ];

  const getStatusBadge = (status) => {
    const statusMap = {
      'completed': { variant: 'success', text: 'Completed' },
      'processing': { variant: 'warning', text: 'Processing' },
      'failed': { variant: 'danger', text: 'Failed' },
      'pending': { variant: 'secondary', text: 'Pending' }
    };
    const statusInfo = statusMap[status] || statusMap['pending'];
    return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>;
  };

  const getTypeIcon = (type) => {
    const typeMap = {
      'patient': faFileAlt,
      'financial': faChartBar,
      'operational': faFileAlt,
      'inventory': faFileAlt
    };
    return typeMap[type] || faFileAlt;
  };

  return (
    <div className="reports-section p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">
            <FontAwesomeIcon icon={faFileAlt} className="me-2 text-primary" />
            Reports Module
          </h4>
          <p className="text-white mb-0">
            Generate and manage medical reports, analytics, and performance metrics
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm">
            <FontAwesomeIcon icon={faFilter} className="me-1" />
            Filter
          </Button>
          <Button variant="primary" size="sm">
            <FontAwesomeIcon icon={faFileAlt} className="me-1" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Report Categories */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="text-center border-primary h-100">
            <Card.Body>
              <FontAwesomeIcon icon={faFileAlt} size="2x" className="text-primary mb-2" />
              <h5 className='text-white'>Patient Reports</h5>
              <p className="text-white small">Demographics, visit history, test results</p>
              <Button variant="outline-primary" size="sm">
                Generate
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center border-success h-100">
            <Card.Body>
              <FontAwesomeIcon icon={faChartBar} size="2x" className="text-success mb-2" />
              <h5 className='text-white'>Financial Reports</h5>
              <p className="text-white small">Revenue, expenses, profit analysis</p>
              <Button variant="outline-success" size="sm">
                Generate
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center border-warning h-100">
            <Card.Body>
              <FontAwesomeIcon icon={faFileAlt} size="2x" className="text-warning mb-2" />
              <h5 className='text-white'>Lab Reports</h5>
              <p className="text-white small">Test results, quality metrics, efficiency</p>
              <Button variant="outline-warning" size="sm">
                Generate
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center border-info h-100">
            <Card.Body>
              <FontAwesomeIcon icon={faFileAlt} size="2x" className="text-info mb-2" />
              <h5 className='text-white'>Inventory Reports</h5>
              <p className="text-white small">Stock levels, usage, procurement</p>
              <Button variant="outline-info" size="sm">
                Generate
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={4}>
          <Form.Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="all">All Report Types</option>
            <option value="patient">Patient Reports</option>
            <option value="financial">Financial Reports</option>
            <option value="operational">Operational Reports</option>
            <option value="inventory">Inventory Reports</option>
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </Form.Select>
        </Col>
        <Col md={4}>
          <div className="d-flex gap-2">
            <Button variant="outline-primary" size="sm" className="flex-fill">
              <FontAwesomeIcon icon={faSearch} className="me-1" />
              Search
            </Button>
            <Button variant="outline-secondary" size="sm">
              Reset
            </Button>
          </div>
        </Col>
      </Row>

      {/* Recent Reports */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <h6 className="mb-0 text-black">
            <FontAwesomeIcon icon={faFileAlt} className="me-2" />
            Recent Reports
          </h6>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table className="table-hover mb-0">
              <thead className="text-black">
                <tr>
                  <th className="text-black">Report Name</th>
                  <th className="text-black">Type</th>
                  <th className="text-black">Generated</th>
                  <th className="text-black">Status</th>
                  <th className="text-black">Size</th>
                  <th className="text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <FontAwesomeIcon 
                          icon={getTypeIcon(report.type)} 
                          className="me-2" 
                        />
                        <div>
                          <strong>{report.name}</strong>
                          <div className=" small">{report.format}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge bg="secondary">{report.type}</Badge>
                    </td>
                    <td>
                      <div>
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                        {new Date(report.generated_at).toLocaleDateString()}
                      </div>
                      <div className="text-white small">
                        {new Date(report.generated_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(report.status)}
                    </td>
                    <td>
                      {report.file_size || 'N/A'}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          disabled={report.status !== 'completed'}
                          title="View Report"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </Button>
                        <Button 
                          variant="outline-success" 
                          size="sm"
                          disabled={report.status !== 'completed'}
                          title="Download Report"
                        >
                          <FontAwesomeIcon icon={faDownload} />
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          disabled={report.status !== 'completed'}
                          title="Print Report"
                        >
                          <FontAwesomeIcon icon={faPrint} />
                        </Button>
                        <Button 
                          variant="outline-info" 
                          size="sm"
                          disabled={report.status !== 'completed'}
                          title="Share Report"
                        >
                          <FontAwesomeIcon icon={faShare} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Quick Report Generation */}
      <Row className="mt-4">
        <Col xs={12}>
          <Card className="bg-light">
            <Card.Body>
              <h6 className="mb-3 text-white">Quick Report Generation</h6>
              <Row>
                <Col md={3} className="mb-2">
                  <Button variant="primary" size="sm" className="w-100">
                    Daily Summary
                  </Button>
                </Col>
                <Col md={3} className="mb-2">
                  <Button variant="success" size="sm" className="w-100">
                    Revenue Report
                  </Button>
                </Col>
                <Col md={3} className="mb-2">
                  <Button variant="warning" size="sm" className="w-100">
                    Lab Performance
                  </Button>
                </Col>
                <Col md={3} className="mb-2">
                  <Button variant="info" size="sm" className="w-100">
                    Inventory Status
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReportsSection;
