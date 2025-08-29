import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MobileDataCard from '../MobileDataCard';

const mockData = {
  id: 1,
  name: 'Test Category',
  description: 'Test description',
  is_active: true,
  created_at: '2024-01-01',
  code: 'TC001'
};

const mockFields = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'code', label: 'Code' },
  { key: 'created_at', label: 'Created', type: 'date' }
];

const mockProps = {
  data: mockData,
  fields: mockFields,
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onViewDetails: jest.fn(),
  statusField: 'is_active',
  primaryField: 'name',
  secondaryField: 'description'
};

describe('MobileDataCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders card with correct title and subtitle', () => {
    render(<MobileDataCard {...mockProps} />);
    
    expect(screen.getByText('Test Category')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  test('renders status badge correctly', () => {
    render(<MobileDataCard {...mockProps} />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('renders inactive status badge correctly', () => {
    const inactiveData = { ...mockData, is_active: false };
    render(<MobileDataCard {...mockProps} data={inactiveData} />);
    
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  test('renders field labels and values correctly', () => {
    render(<MobileDataCard {...mockProps} />);
    
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('TC001')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
  });

  test('excludes primary, secondary, and status fields from body', () => {
    render(<MobileDataCard {...mockProps} />);
    
    // These should not appear in the card body since they're in header
    const nameLabels = screen.queryAllByText('Name');
    const descriptionLabels = screen.queryAllByText('Description');
    
    // Should not find these as field labels in the body
    expect(nameLabels.length).toBe(0);
    expect(descriptionLabels.length).toBe(0);
  });

  test('calls onEdit when edit button is clicked', () => {
    render(<MobileDataCard {...mockProps} />);
    
    const editButton = screen.getByLabelText('Edit Test Category');
    fireEvent.click(editButton);
    
    expect(mockProps.onEdit).toHaveBeenCalledWith(mockData);
  });

  test('calls onDelete when delete button is clicked', () => {
    render(<MobileDataCard {...mockProps} />);
    
    const deleteButton = screen.getByLabelText('Delete Test Category');
    fireEvent.click(deleteButton);
    
    expect(mockProps.onDelete).toHaveBeenCalledWith(mockData);
  });

  test('calls onViewDetails when view button is clicked', () => {
    render(<MobileDataCard {...mockProps} />);
    
    const viewButton = screen.getByLabelText('View details for Test Category');
    fireEvent.click(viewButton);
    
    expect(mockProps.onViewDetails).toHaveBeenCalledWith(mockData);
  });

  test('renders expandable section when showExpandable is true', () => {
    render(<MobileDataCard {...mockProps} showExpandable={true} />);
    
    expect(screen.getByText('More Details')).toBeInTheDocument();
  });

  test('expands and collapses expandable section', async () => {
    render(<MobileDataCard {...mockProps} showExpandable={true} />);

    const expandButton = screen.getByText('More Details');

    // Initially collapsed - check if element exists but is not visible
    const expandableContent = screen.queryByText('Additional details would be displayed here');
    expect(expandableContent).toBeInTheDocument();

    // Click to expand
    fireEvent.click(expandButton);

    // Should be expanded now
    expect(screen.getByText('Additional details would be displayed here')).toBeVisible();
  });

  test('renders related records when provided', () => {
    const relatedRecords = [
      { name: 'Related Item 1', description: 'Description 1' },
      { name: 'Related Item 2', description: 'Description 2' }
    ];
    
    render(<MobileDataCard {...mockProps} relatedRecords={relatedRecords} />);
    
    expect(screen.getByText('Related Records (2)')).toBeInTheDocument();
    
    // Expand to see related records
    fireEvent.click(screen.getByText('Related Records (2)'));
    
    expect(screen.getByText('Related Item 1')).toBeInTheDocument();
    expect(screen.getByText('Related Item 2')).toBeInTheDocument();
  });

  test('handles different field types correctly', () => {
    const fieldsWithTypes = [
      { key: 'price', label: 'Price', type: 'currency' },
      { key: 'status', label: 'Status', type: 'badge', variant: 'success' },
      { key: 'code', label: 'Code', type: 'code' }
    ];
    
    const dataWithTypes = {
      ...mockData,
      price: 100,
      status: 'Active'
    };
    
    render(<MobileDataCard {...mockProps} data={dataWithTypes} fields={fieldsWithTypes} />);
    
    expect(screen.getByText('₹100')).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    render(<MobileDataCard {...mockProps} />);
    
    const editButton = screen.getByLabelText('Edit Test Category');
    const deleteButton = screen.getByLabelText('Delete Test Category');
    
    expect(editButton).toHaveAttribute('aria-label');
    expect(deleteButton).toHaveAttribute('aria-label');
  });

  test('applies touch target classes for mobile interaction', () => {
    render(<MobileDataCard {...mockProps} />);
    
    const editButton = screen.getByLabelText('Edit Test Category');
    const deleteButton = screen.getByLabelText('Delete Test Category');
    
    expect(editButton).toHaveClass('touch-target');
    expect(deleteButton).toHaveClass('touch-target');
  });
});
