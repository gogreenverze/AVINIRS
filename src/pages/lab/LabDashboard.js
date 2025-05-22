import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Row, Col, Table, Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFlask, faVial, faClipboardCheck, faExclamationTriangle,
  faCheckCircle, faHourglassHalf, faTasks, faChartLine
} from '@fortawesome/free-solid-svg-icons';
import { sampleAPI, resultAPI } from '../../services/api';
import {
  BarChart,
  PieChart,
  LineChart,
  StatCard
} from '../../components/common';
import '../../styles/LabDashboard.css';

const LabDashboard = () => {
  const [pendingSamples, setPendingSamples] = useState([]);
  const [pendingResults, setPendingResults] = useState([]);
  const [stats, setStats] = useState({
    totalSamples: 0,
    processedSamples: 0,
    pendingSamples: 0,
    completedResults: 0,
    pendingResults: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch lab data
  useEffect(() => {
    const fetchLabData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch pending samples
        const samplesResponse = await sampleAPI.getSamplesByStatus('Collected');
        const samplesData = samplesResponse.data.items || samplesResponse.data || [];
        setPendingSamples(samplesData.slice(0, 5)); // Show only 5 most recent

        // Fetch pending results
        const resultsResponse = await resultAPI.getResultsByStatus('Pending');
        const resultsData = resultsResponse.data.items || resultsResponse.data || [];
        setPendingResults(resultsData.slice(0, 5)); // Show only 5 most recent

        // Set stats
        setStats({
          totalSamples: samplesData.length + 50, // Adding some dummy data for visualization
          processedSamples: 50,
          pendingSamples: samplesData.length,
          completedResults: 45,
          pendingResults: resultsData.length
        });
      } catch (err) {
        console.error('Error fetching lab data:', err);
        setError('Failed to load lab dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLabData();
  }, []);

  // Sample status badge variant
  const getSampleStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Collected':
        return 'warning';
      case 'In Process':
        return 'info';
      case 'Processed':
        return 'success';
      case 'Rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Result status badge variant
  const getResultStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Completed':
        return 'info';
      case 'Verified':
        return 'success';
      case 'Rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Chart data for sample processing
  const sampleChartData = {
    labels: ['Collected', 'In Process', 'Processed', 'Rejected'],
    datasets: [
      {
        label: 'Samples by Status',
        data: [stats.pendingSamples, 15, stats.processedSamples, 5],
        backgroundColor: [
          'rgba(246, 194, 62, 0.7)',
          'rgba(54, 185, 204, 0.7)',
          'rgba(28, 200, 138, 0.7)',
          'rgba(231, 74, 59, 0.7)'
        ],
        borderColor: [
          'rgba(246, 194, 62, 1)',
          'rgba(54, 185, 204, 1)',
          'rgba(28, 200, 138, 1)',
          'rgba(231, 74, 59, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Chart data for results
  const resultChartData = {
    labels: ['Pending', 'Completed', 'Verified', 'Rejected'],
    datasets: [
      {
        label: 'Results by Status',
        data: [stats.pendingResults, stats.completedResults, 30, 3],
        backgroundColor: [
          'rgba(246, 194, 62, 0.7)',
          'rgba(54, 185, 204, 0.7)',
          'rgba(28, 200, 138, 0.7)',
          'rgba(231, 74, 59, 0.7)'
        ],
        borderColor: [
          'rgba(246, 194, 62, 1)',
          'rgba(54, 185, 204, 1)',
          'rgba(28, 200, 138, 1)',
          'rgba(231, 74, 59, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Chart data for daily sample processing
  const dailyChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Samples Received',
        data: [12, 19, 15, 17, 14, 8, 5],
        backgroundColor: 'rgba(78, 115, 223, 0.7)',
        borderColor: 'rgba(78, 115, 223, 1)',
        borderWidth: 1
      },
      {
        label: 'Samples Processed',
        data: [10, 15, 13, 14, 12, 7, 4],
        backgroundColor: 'rgba(28, 200, 138, 0.7)',
        borderColor: 'rgba(28, 200, 138, 1)',
        borderWidth: 1
      }
    ]
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading lab dashboard...</p>
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

  return (
    <div className="lab-dashboard-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FontAwesomeIcon icon={faFlask} className="me-2" />
          Lab Dashboard
        </h1>
        <div>
          <Link to="/lab/process" className="btn btn-primary me-2">
            <FontAwesomeIcon icon={faVial} className="me-2" />
            Process Samples
          </Link>
          <Link to="/lab/quality-control" className="btn btn-info">
            <FontAwesomeIcon icon={faClipboardCheck} className="me-2" />
            Quality Control
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col xl={3} md={6} className="mb-4">
          <StatCard
            title="Pending Samples"
            value={stats.pendingSamples}
            icon={<FontAwesomeIcon icon={faHourglassHalf} />}
            color="warning"
          />
        </Col>
        <Col xl={3} md={6} className="mb-4">
          <StatCard
            title="Processed Today"
            value={stats.processedSamples}
            icon={<FontAwesomeIcon icon={faFlask} />}
            color="info"
          />
        </Col>
        <Col xl={3} md={6} className="mb-4">
          <StatCard
            title="Pending Results"
            value={stats.pendingResults}
            icon={<FontAwesomeIcon icon={faTasks} />}
            color="danger"
          />
        </Col>
        <Col xl={3} md={6} className="mb-4">
          <StatCard
            title="Completed Results"
            value={stats.completedResults}
            icon={<FontAwesomeIcon icon={faCheckCircle} />}
            color="success"
          />
        </Col>
      </Row>

      {/* Charts */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Daily Sample Processing</h6>
            </Card.Header>
            <Card.Body>
              <BarChart data={dailyChartData} height={300} />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Row>
            <Col lg={12} className="mb-4">
              <Card className="shadow">
                <Card.Header className="py-3">
                  <h6 className="m-0 font-weight-bold text-primary">Sample Status</h6>
                </Card.Header>
                <Card.Body>
                  <PieChart data={sampleChartData} height={150} />
                </Card.Body>
              </Card>
            </Col>
            <Col lg={12}>
              <Card className="shadow">
                <Card.Header className="py-3">
                  <h6 className="m-0 font-weight-bold text-primary">Result Status</h6>
                </Card.Header>
                <Card.Body>
                  <PieChart data={resultChartData} height={150} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Pending Samples */}
      <Row className="mb-4">
        <Col lg={6}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3 d-flex justify-content-between align-items-center">
              <h6 className="m-0 font-weight-bold text-primary">Pending Samples</h6>
              <Link to="/samples" className="btn btn-sm btn-primary">View All</Link>
            </Card.Header>
            <Card.Body>
              {pendingSamples.length > 0 ? (
                <div className="table-responsive">
                  <Table className="table-hover" width="100%" cellSpacing="0">
                    <thead>
                      <tr>
                        <th>Sample ID</th>
                        <th>Patient</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingSamples.map(sample => (
                        <tr key={sample.id}>
                          <td>{sample.sample_id}</td>
                          <td>
                            {sample.patient ? (
                              <Link to={`/patients/${sample.patient.id}`}>
                                {sample.patient.first_name} {sample.patient.last_name}
                              </Link>
                            ) : 'N/A'}
                          </td>
                          <td>{sample.sample_type}</td>
                          <td>
                            <Badge bg={getSampleStatusBadgeVariant(sample.status)}>
                              {sample.status}
                            </Badge>
                          </td>
                          <td>
                            <Link to={`/lab/process?sample_id=${sample.id}`} className="btn btn-sm btn-info">
                              Process
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-success mb-3" size="2x" />
                  <p className="mb-0">No pending samples to process.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Pending Results */}
        <Col lg={6}>
          <Card className="shadow mb-4">
            <Card.Header className="py-3 d-flex justify-content-between align-items-center">
              <h6 className="m-0 font-weight-bold text-primary">Pending Results</h6>
              <Link to="/results" className="btn btn-sm btn-primary">View All</Link>
            </Card.Header>
            <Card.Body>
              {pendingResults.length > 0 ? (
                <div className="table-responsive">
                  <Table className="table-hover" width="100%" cellSpacing="0">
                    <thead>
                      <tr>
                        <th>Result ID</th>
                        <th>Patient</th>
                        <th>Test</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingResults.map(result => (
                        <tr key={result.id}>
                          <td>{result.result_id}</td>
                          <td>
                            {result.patient ? (
                              <Link to={`/patients/${result.patient.id}`}>
                                {result.patient.first_name} {result.patient.last_name}
                              </Link>
                            ) : 'N/A'}
                          </td>
                          <td>{result.test_name}</td>
                          <td>
                            <Badge bg={getResultStatusBadgeVariant(result.status)}>
                              {result.status}
                            </Badge>
                          </td>
                          <td>
                            <Link to={`/results/${result.id}/edit`} className="btn btn-sm btn-info">
                              Enter Result
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-success mb-3" size="2x" />
                  <p className="mb-0">No pending results to enter.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LabDashboard;
