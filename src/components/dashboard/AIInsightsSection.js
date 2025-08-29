import React, { useState } from 'react';
import { Row, Col, Card, Alert, Badge, Button, Modal, ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLightbulb, faExclamationTriangle, faInfoCircle, faChartLine,
  faDollarSign, faCogs, faEye, faCheck, faTimes, faRefresh
} from '@fortawesome/free-solid-svg-icons';
import { aiInsightsUtils } from '../../services/aiInsightsAPI';

const AIInsightsSection = ({ insights = [], alerts = [], onRefresh }) => {
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [filter, setFilter] = useState('all');

  // Filter insights based on selected filter
  const filteredInsights = insights.filter(insight => {
    if (filter === 'all') return true;
    if (filter === 'high') return insight.priority === 'high';
    if (filter === 'unread') return !insight.acknowledged;
    return insight.type === filter;
  });

  // Group insights by category
  const groupedInsights = aiInsightsUtils.groupInsightsByCategory(filteredInsights);

  // Get icon for insight type
  const getInsightIcon = (type) => {
    const iconMap = {
      'trend': faChartLine,
      'financial': faDollarSign,
      'operational': faCogs,
      'predictive': faLightbulb,
      'anomaly': faExclamationTriangle
    };
    return iconMap[type] || faLightbulb;
  };

  // Get variant for priority
  const getPriorityVariant = (priority) => {
    const variantMap = {
      'high': 'danger',
      'medium': 'warning',
      'low': 'info'
    };
    return variantMap[priority] || 'secondary';
  };

  // Handle insight click
  const handleInsightClick = (insight) => {
    setSelectedInsight(insight);
    setShowInsightModal(true);
  };

  // Handle insight acknowledgment
  const handleAcknowledgeInsight = async (insightId) => {
    try {
      // API call to acknowledge insight would go here
      console.log('Acknowledging insight:', insightId);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error acknowledging insight:', error);
    }
  };

  return (
    <div className="ai-insights-section p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">
            <FontAwesomeIcon icon={faLightbulb} className="me-2 text-warning" />
            AI-Powered Insights
          </h4>
          <p className="text-muted mb-0">
            Intelligent analytics and recommendations based on your data
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm" onClick={onRefresh}>
            <FontAwesomeIcon icon={faRefresh} className="me-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Row className="mb-4">
          <Col xs={12}>
            <h5 className="mb-3">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2 text-warning" />
              Important Alerts
            </h5>
            {alerts.map((alert, index) => (
              <Alert key={index} variant={alert.type} className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{alert.title}</strong>
                  <div>{alert.message}</div>
                </div>
                {alert.count && (
                  <Badge bg={alert.type} className="fs-6">
                    {alert.count}
                  </Badge>
                )}
              </Alert>
            ))}
          </Col>
        </Row>
      )}

      {/* Filter Buttons */}
      <div className="mb-4">
        <div className="btn-group" role="group">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline-primary'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({insights.length})
          </Button>
          <Button
            variant={filter === 'high' ? 'danger' : 'outline-danger'}
            size="sm"
            onClick={() => setFilter('high')}
          >
            High Priority ({insights.filter(i => i.priority === 'high').length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'warning' : 'outline-warning'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread ({insights.filter(i => !i.acknowledged).length})
          </Button>
          <Button
            variant={filter === 'financial' ? 'success' : 'outline-success'}
            size="sm"
            onClick={() => setFilter('financial')}
          >
            Financial ({insights.filter(i => i.type === 'financial').length})
          </Button>
          <Button
            variant={filter === 'operational' ? 'info' : 'outline-info'}
            size="sm"
            onClick={() => setFilter('operational')}
          >
            Operational ({insights.filter(i => i.type === 'operational').length})
          </Button>
        </div>
      </div>

      {/* Insights Grid */}
      {Object.keys(groupedInsights).length > 0 ? (
        Object.entries(groupedInsights).map(([category, categoryInsights]) => (
          <div key={category} className="mb-4">
            <h5 className="mb-3 text-primary">{category}</h5>
            <Row>
              {categoryInsights.map((insight, index) => (
                <Col lg={6} xl={4} className="mb-3" key={index}>
                  <Card 
                    className={`h-100 insight-card ${!insight.acknowledged ? 'border-warning' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleInsightClick(insight)}
                  >
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <FontAwesomeIcon 
                          icon={getInsightIcon(insight.type)} 
                          className="text-primary" 
                          size="lg"
                        />
                        <div className="d-flex gap-1">
                          <Badge bg={getPriorityVariant(insight.priority)}>
                            {insight.priority}
                          </Badge>
                          {!insight.acknowledged && (
                            <Badge bg="warning">New</Badge>
                          )}
                        </div>
                      </div>
                      
                      <h6 className="card-title">{insight.title}</h6>
                      <p className="card-text text-muted small mb-2">
                        {insight.description}
                      </p>
                      
                      {insight.recommendation && (
                        <div className="recommendation-preview">
                          <small className="text-success">
                            <FontAwesomeIcon icon={faLightbulb} className="me-1" />
                            {insight.recommendation.substring(0, 80)}
                            {insight.recommendation.length > 80 && '...'}
                          </small>
                        </div>
                      )}
                    </Card.Body>
                    
                    <Card.Footer className="bg-transparent border-top-0 pt-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {insight.type} • {insight.category}
                        </small>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInsightClick(insight);
                          }}
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </Button>
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        ))
      ) : (
        <Card className="text-center py-5">
          <Card.Body>
            <FontAwesomeIcon icon={faLightbulb} size="3x" className="text-muted mb-3" />
            <h5>No Insights Available</h5>
            <p className="text-muted">
              {filter === 'all' 
                ? 'No insights have been generated yet. Check back later for AI-powered recommendations.'
                : `No insights match the current filter: ${filter}`
              }
            </p>
            {filter !== 'all' && (
              <Button variant="outline-primary" onClick={() => setFilter('all')}>
                Show All Insights
              </Button>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Insight Detail Modal */}
      <Modal show={showInsightModal} onHide={() => setShowInsightModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={getInsightIcon(selectedInsight?.type)} className="me-2" />
            {selectedInsight?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedInsight && (
            <div>
              <div className="d-flex gap-2 mb-3">
                <Badge bg={getPriorityVariant(selectedInsight.priority)}>
                  {selectedInsight.priority} Priority
                </Badge>
                <Badge bg="secondary">{selectedInsight.type}</Badge>
                <Badge bg="info">{selectedInsight.category}</Badge>
              </div>
              
              <h6>Description</h6>
              <p>{selectedInsight.description}</p>
              
              {selectedInsight.recommendation && (
                <>
                  <h6>Recommendation</h6>
                  <Alert variant="success">
                    <FontAwesomeIcon icon={faLightbulb} className="me-2" />
                    {selectedInsight.recommendation}
                  </Alert>
                </>
              )}
              
              {selectedInsight.data && (
                <>
                  <h6>Supporting Data</h6>
                  <pre className="bg-light p-3 rounded">
                    {JSON.stringify(selectedInsight.data, null, 2)}
                  </pre>
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedInsight && !selectedInsight.acknowledged && (
            <Button 
              variant="success" 
              onClick={() => {
                handleAcknowledgeInsight(selectedInsight.id);
                setShowInsightModal(false);
              }}
            >
              <FontAwesomeIcon icon={faCheck} className="me-1" />
              Mark as Read
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowInsightModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AIInsightsSection;
