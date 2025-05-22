import React, { useState } from 'react';
import { Form, InputGroup, Button, Row, Col, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faClock,
  faEye,
  faEyeSlash,
  faUpload,
  faTimes,
  faPlus,
  faPercent,
  faDollarSign,
  faHashtag
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import '../../styles/components/FormComponents.css';

/**
 * Text Input component with label and validation
 */
export const TextInput = ({
  name,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  type = 'text',
  error,
  className = '',
  ...props
}) => {
  return (
    <Form.Group className={`mb-3 ${className}`} controlId={name}>
      <Form.Label>
        {label} {required && <span className="text-danger">*</span>}
      </Form.Label>
      <Form.Control
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        isInvalid={!!error}
        {...props}
      />
      {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
    </Form.Group>
  );
};

TextInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string
};

/**
 * Password Input component with show/hide toggle
 */
export const PasswordInput = ({
  name,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <Form.Group className={`mb-3 ${className}`} controlId={name}>
      <Form.Label>
        {label} {required && <span className="text-danger">*</span>}
      </Form.Label>
      <InputGroup>
        <Form.Control
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          isInvalid={!!error}
          {...props}
        />
        <Button
          variant="outline-secondary"
          onClick={() => setShowPassword(!showPassword)}
        >
          <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
        </Button>
        {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
      </InputGroup>
    </Form.Group>
  );
};

PasswordInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string
};

/**
 * Select Input component with label and validation
 */
export const SelectInput = ({
  name,
  label,
  value,
  onChange,
  options = [],
  required = false,
  disabled = false,
  error,
  className = '',
  placeholder = 'Select...',
  ...props
}) => {
  return (
    <Form.Group className={`mb-3 ${className}`} controlId={name}>
      <Form.Label>
        {label} {required && <span className="text-danger">*</span>}
      </Form.Label>
      <Form.Select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        isInvalid={!!error}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Form.Select>
      {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
    </Form.Group>
  );
};

SelectInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string,
  placeholder: PropTypes.string
};

/**
 * Textarea Input component with label and validation
 */
export const TextareaInput = ({
  name,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  rows = 3,
  error,
  className = '',
  ...props
}) => {
  return (
    <Form.Group className={`mb-3 ${className}`} controlId={name}>
      <Form.Label>
        {label} {required && <span className="text-danger">*</span>}
      </Form.Label>
      <Form.Control
        as="textarea"
        rows={rows}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        isInvalid={!!error}
        {...props}
      />
      {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
    </Form.Group>
  );
};

TextareaInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  rows: PropTypes.number,
  error: PropTypes.string,
  className: PropTypes.string
};

/**
 * Date Input component with label and validation
 */
export const DateInput = ({
  name,
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  className = '',
  ...props
}) => {
  return (
    <Form.Group className={`mb-3 ${className}`} controlId={name}>
      <Form.Label>
        {label} {required && <span className="text-danger">*</span>}
      </Form.Label>
      <InputGroup>
        <Form.Control
          type="date"
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          isInvalid={!!error}
          {...props}
        />
        <InputGroup.Text>
          <FontAwesomeIcon icon={faCalendarAlt} />
        </InputGroup.Text>
        {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
      </InputGroup>
    </Form.Group>
  );
};

DateInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string
};

/**
 * Time Input component with label and validation
 */
export const TimeInput = ({
  name,
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  className = '',
  ...props
}) => {
  return (
    <Form.Group className={`mb-3 ${className}`} controlId={name}>
      <Form.Label>
        {label} {required && <span className="text-danger">*</span>}
      </Form.Label>
      <InputGroup>
        <Form.Control
          type="time"
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          isInvalid={!!error}
          {...props}
        />
        <InputGroup.Text>
          <FontAwesomeIcon icon={faClock} />
        </InputGroup.Text>
        {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
      </InputGroup>
    </Form.Group>
  );
};

TimeInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string
};

/**
 * Checkbox Input component with label
 */
export const CheckboxInput = ({
  name,
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <Form.Group className={`mb-3 ${className}`} controlId={name}>
      <Form.Check
        type="checkbox"
        name={name}
        label={label}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
    </Form.Group>
  );
};

CheckboxInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

/**
 * Number Input component with label and validation
 */
export const NumberInput = ({
  name,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  error,
  className = '',
  ...props
}) => {
  return (
    <Form.Group className={`mb-3 ${className}`} controlId={name}>
      <Form.Label>
        {label} {required && <span className="text-danger">*</span>}
      </Form.Label>
      <InputGroup>
        {prefix && (
          <InputGroup.Text>
            {typeof prefix === 'string' ? prefix : <FontAwesomeIcon icon={prefix} />}
          </InputGroup.Text>
        )}
        <Form.Control
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          isInvalid={!!error}
          {...props}
        />
        {suffix && (
          <InputGroup.Text>
            {typeof suffix === 'string' ? suffix : <FontAwesomeIcon icon={suffix} />}
          </InputGroup.Text>
        )}
        {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
      </InputGroup>
    </Form.Group>
  );
};

NumberInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  prefix: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  suffix: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  error: PropTypes.string,
  className: PropTypes.string
};

/**
 * Currency Input component with label and validation
 */
export const CurrencyInput = ({
  name,
  label,
  value,
  onChange,
  placeholder = '0.00',
  required = false,
  disabled = false,
  currencySymbol = '₹',
  error,
  className = '',
  ...props
}) => {
  return (
    <NumberInput
      name={name}
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      prefix={currencySymbol}
      step="0.01"
      min="0"
      error={error}
      className={className}
      {...props}
    />
  );
};

CurrencyInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  currencySymbol: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string
};

/**
 * Percentage Input component with label and validation
 */
export const PercentageInput = ({
  name,
  label,
  value,
  onChange,
  placeholder = '0',
  required = false,
  disabled = false,
  error,
  className = '',
  ...props
}) => {
  return (
    <NumberInput
      name={name}
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      suffix={faPercent}
      step="0.01"
      min="0"
      max="100"
      error={error}
      className={className}
      {...props}
    />
  );
};

PercentageInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string
};

/**
 * Form Row component for creating a row with multiple inputs
 */
export const FormRow = ({ children, className = '' }) => {
  return (
    <Row className={className}>
      {React.Children.map(children, (child, index) => (
        <Col key={index}>{child}</Col>
      ))}
    </Row>
  );
};

FormRow.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

/**
 * Form Section component for creating a section with a title
 */
export const FormSection = ({ title, children, className = '' }) => {
  return (
    <div className={`form-section ${className}`}>
      <h6 className="form-section-title">{title}</h6>
      {children}
    </div>
  );
};

FormSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

/**
 * File Input component with label and validation
 */
export const FileInput = ({
  name,
  label,
  onChange,
  accept,
  multiple = false,
  required = false,
  disabled = false,
  error,
  className = '',
  buttonText = 'Choose File',
  selectedFiles = [],
  onRemoveFile,
  ...props
}) => {
  return (
    <Form.Group className={`mb-3 ${className}`} controlId={name}>
      <Form.Label>
        {label} {required && <span className="text-danger">*</span>}
      </Form.Label>
      <InputGroup>
        <Form.Control
          type="file"
          name={name}
          onChange={onChange}
          accept={accept}
          multiple={multiple}
          required={required}
          disabled={disabled}
          isInvalid={!!error}
          className="d-none"
          {...props}
        />
        <Button
          variant="outline-secondary"
          onClick={() => document.getElementById(name).click()}
          disabled={disabled}
        >
          <FontAwesomeIcon icon={faUpload} className="me-2" />
          {buttonText}
        </Button>
        <Form.Control
          readOnly
          placeholder={multiple ? "No files chosen" : "No file chosen"}
          value={
            selectedFiles.length > 0
              ? multiple
                ? `${selectedFiles.length} file(s) selected`
                : selectedFiles[0]?.name || ""
              : ""
          }
          disabled
        />
        {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
      </InputGroup>

      {selectedFiles.length > 0 && (
        <div className="selected-files mt-2">
          {selectedFiles.map((file, index) => (
            <Badge
              bg="light"
              text="dark"
              className="me-2 mb-2 p-2 d-inline-flex align-items-center"
              key={index}
            >
              {file.name}
              {onRemoveFile && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 ms-2 text-danger"
                  onClick={() => onRemoveFile(index)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </Form.Group>
  );
};

FileInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  accept: PropTypes.string,
  multiple: PropTypes.bool,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string,
  buttonText: PropTypes.string,
  selectedFiles: PropTypes.array,
  onRemoveFile: PropTypes.func
};

/**
 * Radio Input component with label and validation
 */
export const RadioInput = ({
  name,
  label,
  options = [],
  value,
  onChange,
  required = false,
  disabled = false,
  inline = false,
  error,
  className = '',
  ...props
}) => {
  return (
    <Form.Group className={`mb-3 ${className}`} controlId={name}>
      <Form.Label>
        {label} {required && <span className="text-danger">*</span>}
      </Form.Label>
      <div>
        {options.map((option, index) => (
          <Form.Check
            key={index}
            type="radio"
            id={`${name}-${index}`}
            name={name}
            label={option.label}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            disabled={disabled || option.disabled}
            inline={inline}
            isInvalid={!!error}
            {...props}
          />
        ))}
      </div>
      {error && <Form.Control.Feedback type="invalid" className="d-block">{error}</Form.Control.Feedback>}
    </Form.Group>
  );
};

RadioInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool
    })
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  inline: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string
};

/**
 * Multi-Select Input component with label and validation
 */
export const MultiSelectInput = ({
  name,
  label,
  value = [],
  onChange,
  options = [],
  required = false,
  disabled = false,
  error,
  className = '',
  placeholder = 'Select options...',
  ...props
}) => {
  const handleSelectChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    onChange({
      target: {
        name,
        value: selectedOptions
      }
    });
  };

  return (
    <Form.Group className={`mb-3 ${className}`} controlId={name}>
      <Form.Label>
        {label} {required && <span className="text-danger">*</span>}
      </Form.Label>
      <Form.Select
        name={name}
        value={value}
        onChange={handleSelectChange}
        required={required}
        disabled={disabled}
        isInvalid={!!error}
        multiple
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Form.Select>
      {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
      <Form.Text className="text-muted">
        Hold Ctrl (or Cmd on Mac) to select multiple options
      </Form.Text>
    </Form.Group>
  );
};

MultiSelectInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string,
  placeholder: PropTypes.string
};
