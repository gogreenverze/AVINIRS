import React, { useState, useEffect } from 'react';
import { Modal, Button, Offcanvas, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faInfoCircle,
  faQuestionCircle,
  faCheckCircle,
  faTimes,
  faArrowLeft,
  faArrowRight,
  faCheck,
  faSave
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import '../../styles/components/Modals.css';

/**
 * Confirmation Modal component
 */
export const ConfirmationModal = ({
  show,
  onHide,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  size = 'md',
  centered = true,
  backdrop = 'static',
  keyboard = false,
  icon = faQuestionCircle,
  iconColor = 'primary'
}) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      size={size}
      centered={centered}
      backdrop={backdrop}
      keyboard={keyboard}
      className="confirmation-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex align-items-center">
          <div className={`modal-icon text-${iconColor} me-3`}>
            <FontAwesomeIcon icon={icon} size="2x" />
          </div>
          <div>{message}</div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          {cancelText}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

ConfirmationModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmVariant: PropTypes.string,
  size: PropTypes.string,
  centered: PropTypes.bool,
  backdrop: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  keyboard: PropTypes.bool,
  icon: PropTypes.object,
  iconColor: PropTypes.string
};

/**
 * Delete Confirmation Modal component
 */
export const DeleteConfirmationModal = ({
  show,
  onHide,
  onConfirm,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  itemName,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  ...props
}) => {
  return (
    <ConfirmationModal
      show={show}
      onHide={onHide}
      onConfirm={onConfirm}
      title={title}
      message={
        <>
          {message}
          {itemName && (
            <div className="mt-2 fw-bold">
              Item: {itemName}
            </div>
          )}
        </>
      }
      confirmText={confirmText}
      cancelText={cancelText}
      confirmVariant="danger"
      icon={faExclamationTriangle}
      iconColor="danger"
      {...props}
    />
  );
};

DeleteConfirmationModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  itemName: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string
};

/**
 * Information Modal component
 */
export const InfoModal = ({
  show,
  onHide,
  title = 'Information',
  message,
  buttonText = 'Close',
  size = 'md',
  centered = true,
  backdrop = true,
  keyboard = true,
  icon = faInfoCircle,
  iconColor = 'info'
}) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      size={size}
      centered={centered}
      backdrop={backdrop}
      keyboard={keyboard}
      className="info-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex align-items-center">
          <div className={`modal-icon text-${iconColor} me-3`}>
            <FontAwesomeIcon icon={icon} size="2x" />
          </div>
          <div>{message}</div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onHide}>
          {buttonText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

InfoModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  buttonText: PropTypes.string,
  size: PropTypes.string,
  centered: PropTypes.bool,
  backdrop: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  keyboard: PropTypes.bool,
  icon: PropTypes.object,
  iconColor: PropTypes.string
};

/**
 * Success Modal component
 */
export const SuccessModal = ({
  show,
  onHide,
  title = 'Success',
  message = 'Operation completed successfully.',
  buttonText = 'Close',
  ...props
}) => {
  return (
    <InfoModal
      show={show}
      onHide={onHide}
      title={title}
      message={message}
      buttonText={buttonText}
      icon={faCheckCircle}
      iconColor="success"
      {...props}
    />
  );
};

SuccessModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  buttonText: PropTypes.string
};

/**
 * Error Modal component
 */
export const ErrorModal = ({
  show,
  onHide,
  title = 'Error',
  message = 'An error occurred. Please try again.',
  buttonText = 'Close',
  ...props
}) => {
  return (
    <InfoModal
      show={show}
      onHide={onHide}
      title={title}
      message={message}
      buttonText={buttonText}
      icon={faTimes}
      iconColor="danger"
      {...props}
    />
  );
};

ErrorModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  buttonText: PropTypes.string
};

/**
 * Form Modal component
 */
export const FormModal = ({
  show,
  onHide,
  onSubmit,
  title,
  children,
  submitText = 'Submit',
  cancelText = 'Cancel',
  size = 'lg',
  centered = true,
  backdrop = 'static',
  keyboard = false,
  isSubmitting = false,
  fullscreen = false
}) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      size={size}
      centered={centered}
      backdrop={backdrop}
      keyboard={keyboard}
      fullscreen={fullscreen}
      className="form-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {children}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>
          {cancelText}
        </Button>
        <Button variant="primary" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : submitText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

FormModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  submitText: PropTypes.string,
  cancelText: PropTypes.string,
  size: PropTypes.string,
  centered: PropTypes.bool,
  backdrop: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  keyboard: PropTypes.bool,
  isSubmitting: PropTypes.bool,
  fullscreen: PropTypes.oneOfType([PropTypes.bool, PropTypes.string])
};

/**
 * Fullscreen Modal component
 */
export const FullscreenModal = ({
  show,
  onHide,
  title,
  children,
  actionButtons,
  scrollable = true,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = ''
}) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      fullscreen={true}
      className={`fullscreen-modal ${className}`}
      scrollable={scrollable}
    >
      <Modal.Header closeButton className={headerClassName}>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className={bodyClassName}>
        {children}
      </Modal.Body>
      {actionButtons && (
        <Modal.Footer className={footerClassName}>
          {actionButtons}
        </Modal.Footer>
      )}
    </Modal>
  );
};

FullscreenModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  actionButtons: PropTypes.node,
  scrollable: PropTypes.bool,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  footerClassName: PropTypes.string
};

/**
 * Side Modal component (using Offcanvas)
 */
export const SideModal = ({
  show,
  onHide,
  title,
  children,
  actionButtons,
  placement = 'end',
  backdrop = true,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = ''
}) => {
  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement={placement}
      backdrop={backdrop}
      className={`side-modal ${className}`}
    >
      <Offcanvas.Header closeButton className={`side-modal-header ${headerClassName}`}>
        <Offcanvas.Title>{title}</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className={`side-modal-body ${bodyClassName}`}>
        {children}
      </Offcanvas.Body>
      {actionButtons && (
        <div className={`side-modal-footer ${footerClassName}`}>
          {actionButtons}
        </div>
      )}
    </Offcanvas>
  );
};

SideModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  actionButtons: PropTypes.node,
  placement: PropTypes.oneOf(['start', 'end', 'top', 'bottom']),
  backdrop: PropTypes.bool,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  footerClassName: PropTypes.string
};

/**
 * Wizard Modal component for multi-step forms
 */
export const WizardModal = ({
  show,
  onHide,
  title,
  steps,
  onComplete,
  onCancel,
  initialStep = 0,
  size = 'lg',
  centered = true,
  backdrop = 'static',
  keyboard = false,
  completeText = 'Complete',
  cancelText = 'Cancel',
  nextText = 'Next',
  backText = 'Back',
  isSubmitting = false,
  className = '',
  validateStep = null
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [stepData, setStepData] = useState({});
  const [stepValidation, setStepValidation] = useState({});

  // Reset to initial step when modal is opened
  useEffect(() => {
    if (show) {
      setCurrentStep(initialStep);
      setStepData({});
      setStepValidation({});
    }
  }, [show, initialStep]);

  // Handle step data update
  const updateStepData = (data) => {
    setStepData(prevData => ({
      ...prevData,
      ...data
    }));
  };

  // Handle next step
  const handleNext = async () => {
    // If validation function is provided, validate current step
    if (validateStep) {
      const validationResult = await validateStep(currentStep, stepData);
      if (!validationResult.isValid) {
        setStepValidation(prev => ({
          ...prev,
          [currentStep]: validationResult.errors
        }));
        return;
      }
    }

    // Clear validation errors for current step
    setStepValidation(prev => ({
      ...prev,
      [currentStep]: null
    }));

    // Move to next step
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle back step
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle complete
  const handleComplete = () => {
    if (onComplete) {
      onComplete(stepData);
    }
  };

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <Modal
      show={show}
      onHide={onHide}
      size={size}
      centered={centered}
      backdrop={backdrop}
      keyboard={keyboard}
      className={`wizard-modal ${className}`}
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Progress Bar */}
        <div className="wizard-progress mb-4">
          <ProgressBar now={progressPercentage} variant="primary" />
          <div className="wizard-steps-text mt-2 d-flex justify-content-between">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{steps[currentStep].title}</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="wizard-step-content">
          {steps[currentStep].content({
            data: stepData,
            updateData: updateStepData,
            errors: stepValidation[currentStep] || {},
            stepIndex: currentStep
          })}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onCancel || onHide}
          disabled={isSubmitting}
        >
          {cancelText}
        </Button>

        {currentStep > 0 && (
          <Button
            variant="outline-primary"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            {backText}
          </Button>
        )}

        {currentStep < steps.length - 1 ? (
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={isSubmitting}
          >
            {nextText}
            <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
          </Button>
        ) : (
          <Button
            variant="success"
            onClick={handleComplete}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : completeText}
            <FontAwesomeIcon icon={faSave} className="ms-2" />
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

WizardModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      content: PropTypes.func.isRequired
    })
  ).isRequired,
  onComplete: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  initialStep: PropTypes.number,
  size: PropTypes.string,
  centered: PropTypes.bool,
  backdrop: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  keyboard: PropTypes.bool,
  completeText: PropTypes.string,
  cancelText: PropTypes.string,
  nextText: PropTypes.string,
  backText: PropTypes.string,
  isSubmitting: PropTypes.bool,
  className: PropTypes.string,
  validateStep: PropTypes.func
};
