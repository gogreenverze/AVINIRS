import React, { useState } from 'react';
import { Card, Row, Col, Badge, Button, Alert, Form, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck, faTimes, faShippingFast, faCheckCircle, faClock,
  faExclamationTriangle, faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { routingAPI } from '../../services/api';
import { useTenant } from '../../context/TenantContext';
import PropTypes from 'prop-types';

const WorkflowSteps = ({ routing, onWorkflowUpdate }) => {
  const { currentTenantContext } = useTenant();
  const [actionLoading, setActionLoading] = useState({});
  const [showActionModal, setShowActionModal] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [actionData, setActionData] = useState({});



  const workflowSteps = [
    {
      id: 'initiated',
      name: 'Initiated',
      description: 'Routing request created',
      icon: faArrowRight,
      color: 'secondary'
    },
    {
      id: 'pending_approval',
      name: 'Pending Approval',
      description: 'Waiting for destination approval',
      icon: faClock,
      color: 'warning'
    },
    {
      id: 'approved',
      name: 'Approved',
      description: 'Approved by destination facility',
      icon: faCheck,
      color: 'info'
    },
    {
      id: 'in_transit',
      name: 'In Transit',
      description: 'Sample is being transported',
      icon: faShippingFast,
      color: 'primary'
    },
    {
      id: 'delivered',
      name: 'Delivered',
      description: 'Sample delivered to destination',
      icon: faCheckCircle,
      color: 'success'
    },
    {
      id: 'completed',
      name: 'Completed',
      description: 'Routing process completed',
      icon: faCheckCircle,
      color: 'success'
    }
  ];

  const getCurrentStepIndex = () => {
    const currentStage = routing.workflow?.current_stage;
    return workflowSteps.findIndex(step => step.id === currentStage);
  };

  const getAvailableActions = () => {
    const actions = [];
    const status = routing.status?.toLowerCase();
    const userTenantId = currentTenantContext?.id;

    switch (status) {
      case 'pending_approval':
        // Only destination tenant can approve/reject
        if (routing.to_tenant_id === userTenantId) {
          actions.push({
            key: 'approve',
            label: 'Approve Routing',
            icon: faCheck,
            variant: 'success',
            requiresInput: true,
            fields: [
              { name: 'notes', label: 'Approval Notes', type: 'textarea', placeholder: 'Optional approval notes...' }
            ]
          });
          actions.push({
            key: 'reject',
            label: 'Reject Routing',
            icon: faTimes,
            variant: 'danger',
            requiresInput: true,
            fields: [
              { name: 'reason', label: 'Rejection Reason', type: 'textarea', required: true, placeholder: 'Please provide a reason for rejection...' }
            ]
          });
        }
        break;

      case 'approved':
        // Only source tenant can dispatch after approval
        if (routing.from_tenant_id === userTenantId) {
          actions.push({
            key: 'dispatch',
            label: 'Dispatch Sample',
            icon: faShippingFast,
            variant: 'primary',
            requiresInput: true,
            fields: [
              { name: 'courier_name', label: 'Courier Name', type: 'text', placeholder: 'Courier or delivery service name...' },
              { name: 'courier_contact', label: 'Courier Contact', type: 'text', placeholder: 'Phone number or contact info...' },
              { name: 'notes', label: 'Dispatch Notes', type: 'textarea', placeholder: 'Any special dispatch instructions...' }
            ]
          });
        }
        break;

      case 'in_transit':
        // Only destination tenant can receive
        if (routing.to_tenant_id === userTenantId) {
          actions.push({
            key: 'receive',
            label: 'Receive Sample',
            icon: faCheckCircle,
            variant: 'success',
            requiresInput: true,
            fields: [
              {
                name: 'condition',
                label: 'Sample Condition',
                type: 'select',
                required: true,
                options: [
                  { value: 'good', label: 'Good Condition' },
                  { value: 'damaged', label: 'Damaged' },
                  { value: 'compromised', label: 'Compromised' }
                ]
              },
              { name: 'notes', label: 'Receipt Notes', type: 'textarea', placeholder: 'Any observations about the sample condition...' }
            ]
          });
        }
        break;

      case 'delivered':
        // Only destination tenant can complete
        if (routing.to_tenant_id === userTenantId) {
          actions.push({
            key: 'complete',
            label: 'Complete Routing',
            icon: faCheckCircle,
            variant: 'success',
            requiresInput: true,
            fields: [
              { name: 'notes', label: 'Completion Notes', type: 'textarea', placeholder: 'Final notes about the routing process...' }
            ]
          });
        }
        break;

      default:
        // No actions available for other statuses
        break;
    }

    return actions;
  };

  const handleActionClick = (action) => {
    if (action.requiresInput) {
      setCurrentAction(action);
      setActionData({});
      setShowActionModal(true);
    } else {
      performAction(action.key, {});
    }
  };

  const performAction = async (actionKey, data) => {
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));

    try {
      switch (actionKey) {
        case 'approve':
          await routingAPI.approveRouting(routing.id, data);
          break;
        case 'reject':
          await routingAPI.rejectRouting(routing.id, data);
          break;
        case 'dispatch':
          await routingAPI.dispatchRouting(routing.id, data);
          break;
        case 'receive':
          await routingAPI.receiveRouting(routing.id, data);
          break;
        case 'complete':
          await routingAPI.completeRouting(routing.id, data);
          break;
        default:
          throw new Error(`Unknown action: ${actionKey}`);
      }

      if (onWorkflowUpdate) {
        onWorkflowUpdate();
      }
    } catch (error) {
      console.error(`Error performing ${actionKey}:`, error);
      alert(`Failed to ${actionKey} routing. Please try again.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = currentAction.fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !actionData[field.name]?.trim());
    
    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    performAction(currentAction.key, actionData);
    setShowActionModal(false);
  };

  const currentStepIndex = getCurrentStepIndex();
  const availableActions = getAvailableActions();

  return (
    <>
      <Card className="shadow">
        <Card.Header>
          <h6 className="m-0 font-weight-bold text-primary">Workflow Progress</h6>
        </Card.Header>
        <Card.Body className="text-white">
          {/* Progress Steps */}
          <div className="workflow-steps mb-4">
            <Row>
              {workflowSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isRejected = routing.status === 'rejected' && step.id === 'pending_approval';
                
                return (
                  <Col key={step.id} className="text-center mb-3">
                    <div className="workflow-step">
                      <div 
                        className={`workflow-step-icon ${
                          isRejected ? 'bg-danger' :
                          isCompleted ? `bg-${step.color}` : 'bg-light'
                        } text-white rounded-circle d-inline-flex align-items-center justify-content-center`}
                        style={{ width: '50px', height: '50px' }}
                      >
                        <FontAwesomeIcon 
                          icon={isRejected ? faTimes : step.icon} 
                          className={isCompleted || isRejected ? 'text-white' : ''}
                        />
                      </div>
                      <div className="mt-2">
                        <h6 className={`mb-1 ${isCurrent ? 'text-primary' : ''}`}>
                          {step.name}
                        </h6>
                        <small className="">{step.description}</small>
                        {isCurrent && (
                          <div className="mt-1">
                            <Badge bg="primary">Current</Badge>
                          </div>
                        )}
                        {isRejected && step.id === 'pending_approval' && (
                          <div className="mt-1">
                            <Badge bg="danger">Rejected</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Line */}
                    {index < workflowSteps.length - 1 && (
                      <div 
                        className={`workflow-line ${
                          index < currentStepIndex ? 'bg-success' : 'bg-light'
                        }`}
                        style={{ 
                          height: '2px', 
                          width: '100%', 
                          position: 'absolute',
                          top: '25px',
                          left: '50%',
                          zIndex: -1
                        }}
                      />
                    )}
                  </Col>
                );
              })}
            </Row>
          </div>

          {/* Current Status */}
          <Alert variant={routing.status === 'rejected' ? 'danger' : 'info'}>
            <FontAwesomeIcon 
              icon={routing.status === 'rejected' ? faExclamationTriangle : faClock} 
              className="me-2" 
            />
            <strong>Current Status:</strong> {routing.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            {routing.rejection_reason && (
              <div className="mt-2">
                <strong>Rejection Reason:</strong> {routing.rejection_reason}
              </div>
            )}
          </Alert>

          {/* Available Actions */}
          {availableActions.length > 0 && (
            <div className="mt-4">
              <h6 className="mb-3">Available Actions:</h6>
              <div className="d-flex gap-2 flex-wrap">
                {availableActions.map(action => (
                  <Button
                    key={action.key}
                    variant={action.variant}
                    onClick={() => handleActionClick(action)}
                    disabled={actionLoading[action.key]}
                  >
                    <FontAwesomeIcon
                      icon={action.icon}
                      className="me-1"
                      spin={actionLoading[action.key]}
                    />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Action Modal */}
      <Modal show={showActionModal} onHide={() => setShowActionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={currentAction?.icon} className="me-2" />
            {currentAction?.label}
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleModalSubmit}>
          <Modal.Body>
            {currentAction?.fields.map(field => (
              <Form.Group key={field.name} className="mb-3">
                <Form.Label>
                  {field.label}
                  {field.required && <span className="text-danger">*</span>}
                </Form.Label>
                
                {field.type === 'textarea' ? (
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={actionData[field.name] || ''}
                    onChange={(e) => setActionData(prev => ({
                      ...prev,
                      [field.name]: e.target.value
                    }))}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                ) : field.type === 'select' ? (
                  <Form.Select
                    value={actionData[field.name] || ''}
                    onChange={(e) => setActionData(prev => ({
                      ...prev,
                      [field.name]: e.target.value
                    }))}
                    required={field.required}
                  >
                    <option value="">Select...</option>
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                ) : (
                  <Form.Control
                    type={field.type}
                    value={actionData[field.name] || ''}
                    onChange={(e) => setActionData(prev => ({
                      ...prev,
                      [field.name]: e.target.value
                    }))}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}
              </Form.Group>
            ))}
          </Modal.Body>
          
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowActionModal(false)}>
              Cancel
            </Button>
            <Button 
              variant={currentAction?.variant} 
              type="submit"
              disabled={actionLoading[currentAction?.key]}
            >
              {actionLoading[currentAction?.key] ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Processing...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={currentAction?.icon} className="me-1" />
                  {currentAction?.label}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

WorkflowSteps.propTypes = {
  routing: PropTypes.object.isRequired,
  onWorkflowUpdate: PropTypes.func
};

export default WorkflowSteps;
