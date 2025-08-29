import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResponsiveDataTable from '../ResponsiveDataTable';

// Mock window.innerWidth for responsive testing
const mockInnerWidth = (width) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
};

const mockData = [
  {
    id: 1,
    name: 'Test Category 1',
    description: 'Test description 1',
    is_active: true,
    created_at: '2024-01-01'
  },
  {
    id: 2,
    name: 'Test Category 2',
    description: 'Test description 2',
    is_active: false,
    created_at: '2024-01-02'
  }
];

const mockColumns = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'is_active', label: 'Status', type: 'boolean' },
  { key: 'created_at', label: 'Created', type: 'date' }
];

const mockProps = {
  data: mockData,
  columns: mockColumns,
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onViewDetails: jest.fn(),
  loading: false,
  emptyMessage: 'No data available',
  mobileCardConfig: {
    primaryField: 'name',
    secondaryField: 'description'
  }
};

describe('ResponsiveDataTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders mobile view on small screens (< 768px)', () => {
    mockInnerWidth(600);
    render(<ResponsiveDataTable {...mockProps} />);
    
    // Should render mobile cards instead of table
    expect(screen.getByText('Test Category 1')).toBeInTheDocument();
    expect(screen.getByText('Test Category 2')).toBeInTheDocument();
    
    // Should not render table headers
    expect(screen.queryByText('Name')).not.toBeInTheDocument();
    expect(screen.queryByText('Description')).not.toBeInTheDocument();
  });

  test('renders desktop table view on large screens (>= 768px)', () => {
    mockInnerWidth(1024);
    render(<ResponsiveDataTable {...mockProps} />);
    
    // Should render table headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    
    // Should render table data
    expect(screen.getByText('Test Category 1')).toBeInTheDocument();
    expect(screen.getByText('Test Category 2')).toBeInTheDocument();
  });

  test('switches between mobile and desktop views on resize', () => {
    // Start with desktop view
    mockInnerWidth(1024);
    const { rerender } = render(<ResponsiveDataTable {...mockProps} />);
    
    expect(screen.getByText('Name')).toBeInTheDocument(); // Table header
    
    // Switch to mobile view
    mockInnerWidth(600);
    rerender(<ResponsiveDataTable {...mockProps} />);
    
    // Table headers should not be visible in mobile view
    expect(screen.queryByText('Name')).not.toBeInTheDocument();
  });

  test('renders loading state correctly', () => {
    render(<ResponsiveDataTable {...mockProps} loading={true} />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  test('renders empty state correctly', () => {
    render(<ResponsiveDataTable {...mockProps} data={[]} />);
    
    expect(screen.getByText('No Data Found')).toBeInTheDocument();
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  test('calls onEdit when edit button is clicked in mobile view', () => {
    mockInnerWidth(600);
    render(<ResponsiveDataTable {...mockProps} />);
    
    const editButtons = screen.getAllByLabelText(/Edit/);
    fireEvent.click(editButtons[0]);
    
    expect(mockProps.onEdit).toHaveBeenCalledWith(mockData[0]);
  });

  test('calls onDelete when delete button is clicked in mobile view', () => {
    mockInnerWidth(600);
    render(<ResponsiveDataTable {...mockProps} />);
    
    const deleteButtons = screen.getAllByLabelText(/Delete/);
    fireEvent.click(deleteButtons[0]);
    
    expect(mockProps.onDelete).toHaveBeenCalledWith(mockData[0]);
  });

  test('renders status badges correctly', () => {
    mockInnerWidth(1024);
    render(<ResponsiveDataTable {...mockProps} />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  test('applies correct breakpoint (768px)', () => {
    // Test exactly at breakpoint
    mockInnerWidth(768);
    render(<ResponsiveDataTable {...mockProps} />);
    
    // Should render desktop view at 768px
    expect(screen.getByText('Name')).toBeInTheDocument();
    
    // Test just below breakpoint
    mockInnerWidth(767);
    const { rerender } = render(<ResponsiveDataTable {...mockProps} />);
    rerender(<ResponsiveDataTable {...mockProps} />);
    
    // Should render mobile view at 767px
    expect(screen.queryByText('Name')).not.toBeInTheDocument();
  });
});
