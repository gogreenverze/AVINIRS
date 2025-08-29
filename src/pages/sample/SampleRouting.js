import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Form, InputGroup, Row, Col, Tabs, Tab, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faPlus, faVial, faExchangeAlt, faEnvelope, faArrowRight, faCheck, faTimes
} from '@fortawesome/free-solid-svg-icons';
import { sampleAPI } from '../../services/api';
import { useTenant } from '../../context/TenantContext';
import ResponsiveRoutingTable from '../../components/sample/ResponsiveRoutingTable';
import '../../styles/SampleRouting.css';

const SampleRouting = () => {
  const { tenantData } = useTenant();
  const [routings, setRoutings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('incoming');
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Fetch sample routing data
  useEffect(() => {
    const fetchRoutings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await sampleAPI.getSampleTransfers();
        setRoutings(response.data.items || []);
         console.log("checkroutingsss",response.data)
        setUnreadMessages(0); // For now, set to 0 as we don't have message system
      } catch (err) {
        console.error('Error fetching sample transfers:', err);
        setError('Failed to load sample transfers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoutings();
  }, []);

  console.log("rountings",routings)

  // Filter routings based on active tab and search query
  const filteredRoutings = routings.filter(routing => {
    // Filter by tab
    if (activeTab === 'incoming' && routing.to_tenant_id !== tenantData?.id) {
      return false;
    }
    if (activeTab === 'outgoing' && routing.from_tenant_id !== tenantData?.id) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        routing.sample?.sample_id?.toLowerCase().includes(query) ||
        routing.tracking_number?.toLowerCase().includes(query) ||
        routing.from_tenant?.name?.toLowerCase().includes(query) ||
        routing.to_tenant?.name?.toLowerCase().includes(query)
      );
    }

    return true;
  });



  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
  };



  console.log("filterroutings",filteredRoutings)
  return (
    <div className="sample-routing-container">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Sample Transfers</h1>
        <div>
          <Link to="/samples/routing/create" className="btn btn-primary">
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            New Transfer
          </Link>
        </div>
      </div>

      {/* Search Card */}
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Search Transfers</h6>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search by sample ID, tracking number, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="primary" type="submit">
                <FontAwesomeIcon icon={faSearch} />
              </Button>
            </InputGroup>
          </Form>
        </Card.Body>
      </Card>

      {/* Messages Notification */}
      {unreadMessages > 0 && (
        <div className="alert alert-info">
          <FontAwesomeIcon icon={faEnvelope} className="me-2" />
          You have {unreadMessages} unread message{unreadMessages > 1 ? 's' : ''} related to transfers.
          <Link to="/samples/routing/messages" className="btn btn-sm btn-info ms-3">
            View Messages
          </Link>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Loading Message */}
      {loading && (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading transfers...</p>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="incoming" title="Incoming Transfers">
          <ResponsiveRoutingTable
            routings={filteredRoutings}
            type="incoming"
            title="Incoming Transfers"
            loading={loading}
            itemsPerPage={20}
          />
        </Tab>

        <Tab eventKey="outgoing" title="Outgoing Transfers">
          <ResponsiveRoutingTable
            routings={filteredRoutings}
            type="outgoing"
            title="Outgoing Transfers"
            loading={loading}
            itemsPerPage={20}
          />
        </Tab>
      </Tabs>

      {/* Transfer Dashboard */}
      {!loading && !error && (
        <Row className="mb-4">
          <Col md={6} xl={3} className="mb-4">
            <Card className="border-left-warning shadow h-100 py-2">
              <Card.Body>
                <div className="row no-gutters align-items-center">
                  <div className="col mr-2">
                    <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                      Pending Transfers
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                      {routings.filter(r => r.status === 'Pending').length}
                    </div>
                  </div>
                  <div className="col-auto">
                    <FontAwesomeIcon icon={faExchangeAlt} className="fa-2x text-gray-300" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} xl={3} className="mb-4">
            <Card className="border-left-info shadow h-100 py-2">
              <Card.Body>
                <div className="row no-gutters align-items-center">
                  <div className="col mr-2">
                    <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                      In Transit
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                      {routings.filter(r => r.status === 'In Transit').length}
                    </div>
                  </div>
                  <div className="col-auto">
                    <FontAwesomeIcon icon={faArrowRight} className="fa-2x text-gray-300" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} xl={3} className="mb-4">
            <Card className="border-left-success shadow h-100 py-2">
              <Card.Body>
                <div className="row no-gutters align-items-center">
                  <div className="col mr-2">
                    <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                      Received
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                      {routings.filter(r => r.status === 'Received').length}
                    </div>
                  </div>
                  <div className="col-auto">
                    <FontAwesomeIcon icon={faCheck} className="fa-2x text-gray-300" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} xl={3} className="mb-4">
            <Card className="border-left-danger shadow h-100 py-2">
              <Card.Body>
                <div className="row no-gutters align-items-center">
                  <div className="col mr-2">
                    <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">
                      Rejected
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                      {routings.filter(r => r.status === 'Rejected').length}
                    </div>
                  </div>
                  <div className="col-auto">
                    <FontAwesomeIcon icon={faTimes} className="fa-2x text-gray-300" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default SampleRouting;
