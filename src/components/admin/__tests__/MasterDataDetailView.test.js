import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MasterDataDetailView from '../MasterDataDetailView';

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
  title: 'Test Categories',
  category: 'test-categories',
  data: mockData,
  columns: mockColumns,
  onBack: jest.fn(),
  onAdd: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  loading: false,
  error: null
};

// Mock window.innerWidth for responsive testing
const mockInnerWidth = (width) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
};

describe('MasterDataDetailView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with correct title and data count', () => {
    render(<MasterDataDetailView {...mockProps} />);
    
    expect(screen.getByText('Test Categories')).toBeInTheDocument();
    expect(screen.getByText('2 of 2 records')).toBeInTheDocument();
  });

  test('renders responsive data table with data', () => {
    render(<MasterDataDetailView {...mockProps} />);

    // Should find the data regardless of table or card format
    expect(screen.getByText('Test Category 1')).toBeInTheDocument();
    expect(screen.getByText('Test Category 2')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  test('shows mobile cards on small screens', () => {
    mockInnerWidth(600);
    render(<MasterDataDetailView {...mockProps} />);
    
    // Should render mobile cards
    expect(screen.getByText('Test Category 1')).toBeInTheDocument();
    expect(screen.getByText('Test Category 2')).toBeInTheDocument();
  });

  test('shows desktop table on large screens', () => {
    mockInnerWidth(1024);
    render(<MasterDataDetailView {...mockProps} />);
    
    // Should render desktop table with headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  test('handles search functionality', () => {
    render(<MasterDataDetailView {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search test categories...');
    fireEvent.change(searchInput, { target: { value: 'Category 1' } });
    
    expect(screen.getByText('Test Category 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Category 2')).not.toBeInTheDocument();
  });

  test('calls onBack when back button is clicked', () => {
    render(<MasterDataDetailView {...mockProps} />);

    // Find the back button by its icon (first button in header)
    const backButton = screen.getAllByRole('button')[0];
    fireEvent.click(backButton);

    expect(mockProps.onBack).toHaveBeenCalled();
  });

  test('calls onAdd when add new button is clicked', () => {
    render(<MasterDataDetailView {...mockProps} />);
    
    const addButton = screen.getByText('Add New');
    fireEvent.click(addButton);
    
    expect(mockProps.onAdd).toHaveBeenCalledWith('test-categories');
  });

  test('renders loading state correctly', () => {
    render(<MasterDataDetailView {...mockProps} loading={true} />);
    
    expect(screen.getByText('Loading Test Categories...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('renders error state correctly', () => {
    const errorProps = { ...mockProps, error: 'Failed to load data' };
    render(<MasterDataDetailView {...errorProps} />);
    
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  test('shows pagination when there are multiple pages', () => {
    const manyItems = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `Test Category ${i + 1}`,
      description: `Description ${i + 1}`,
      is_active: true,
      created_at: '2024-01-01'
    }));
    
    const propsWithManyItems = { ...mockProps, data: manyItems };
    render(<MasterDataDetailView {...propsWithManyItems} />);
    
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  test('filters data correctly with search', () => {
    render(<MasterDataDetailView {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search test categories...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No matching records found')).toBeInTheDocument();
  });

  test('shows empty state when no data', () => {
    const emptyProps = { ...mockProps, data: [] };
    render(<MasterDataDetailView {...emptyProps} />);
    
    expect(screen.getByText('No records available')).toBeInTheDocument();
  });

  test('has proper mobile responsive classes', () => {
    const { container } = render(<MasterDataDetailView {...mockProps} />);
    
    expect(container.querySelector('.master-data-detail-view')).toBeInTheDocument();
  });

  test('renders export and import buttons', () => {
    render(<MasterDataDetailView {...mockProps} />);
    
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });
});
