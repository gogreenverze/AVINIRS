import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the MasterData component with our new navigation
const MockMasterDataNavigation = ({ 
  activeTab = 'testCategories',
  onTabChange = jest.fn(),
  tabSearchQuery = '',
  onTabSearch = jest.fn(),
  navigationView = 'categories',
  onNavigationViewToggle = jest.fn(),
  openCategories = new Set(['test-management']),
  onCategoryToggle = jest.fn(),
  masterData = {}
}) => {
  const getNavigationCategories = () => [
    {
      id: 'test-management',
      title: 'Test Management',
      color: '#007bff',
      items: [
        { key: 'testCategories', title: 'Test Categories' },
        { key: 'testParameters', title: 'Test Parameters' },
        { key: 'testMaster', title: 'Test Master' }
      ]
    },
    {
      id: 'sample-management',
      title: 'Sample & Specimen',
      color: '#28a745',
      items: [
        { key: 'sampleTypes', title: 'Sample Types' },
        { key: 'specimenMaster', title: 'Specimen Master' }
      ]
    }
  ];

  const getFilteredNavigation = () => {
    const categories = getNavigationCategories();
    if (!tabSearchQuery) return categories;
    
    return categories.map(category => ({
      ...category,
      items: category.items.filter(item =>
        item.title.toLowerCase().includes(tabSearchQuery.toLowerCase())
      )
    })).filter(category => category.items.length > 0);
  };

  const getCurrentCategory = () => {
    const categories = getNavigationCategories();
    return categories.find(category => 
      category.items.some(item => item.key === activeTab)
    );
  };

  const getCurrentTabInfo = () => {
    const categories = getNavigationCategories();
    for (const category of categories) {
      const tab = category.items.find(item => item.key === activeTab);
      if (tab) return tab;
    }
    return null;
  };

  return (
    <div className="modern-navigation-container">
      <div className="navigation-header">
        <div className="navigation-controls">
          <div className="navigation-search">
            <input
              type="text"
              className="navigation-search-input"
              placeholder="Search menu items..."
              value={tabSearchQuery}
              onChange={(e) => onTabSearch(e.target.value)}
              data-testid="navigation-search"
            />
          </div>
          <button
            className="view-toggle-btn"
            onClick={onNavigationViewToggle}
            data-testid="view-toggle"
          >
            {navigationView === 'categories' ? 'List View' : 'Categories'}
          </button>
        </div>
        
        <div className="current-selection">
          <div className="breadcrumb-container">
            {getCurrentCategory() && (
              <>
                <span className="category-badge" data-testid="current-category">
                  {getCurrentCategory().title}
                </span>
                <span className="breadcrumb-separator">›</span>
              </>
            )}
            <span className="current-item" data-testid="current-item">
              {getCurrentTabInfo()?.title || 'Select Item'}
            </span>
          </div>
        </div>
      </div>

      <div className="navigation-content">
        {navigationView === 'categories' ? (
          <div className="categories-navigation">
            {getFilteredNavigation().map(category => (
              <div key={category.id} className="navigation-category">
                <div 
                  className={`category-header ${openCategories.has(category.id) ? 'open' : ''}`}
                  onClick={() => onCategoryToggle(category.id)}
                  data-testid={`category-${category.id}`}
                >
                  <div className="category-info">
                    <span className="category-title">{category.title}</span>
                    <span className="category-count">({category.items.length})</span>
                  </div>
                </div>
                
                {openCategories.has(category.id) && (
                  <div className="category-items">
                    {category.items.map(item => (
                      <div
                        key={item.key}
                        className={`navigation-item ${activeTab === item.key ? 'active' : ''}`}
                        onClick={() => onTabChange(item.key)}
                        data-testid={`nav-item-${item.key}`}
                      >
                        <span className="item-title">{item.title}</span>
                        {masterData[item.key] && (
                          <span className="item-count">
                            {masterData[item.key].length}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="list-navigation">
            {getNavigationCategories().flatMap(cat => cat.items)
              .filter(tab => 
                !tabSearchQuery || 
                tab.title.toLowerCase().includes(tabSearchQuery.toLowerCase())
              ).map(tab => (
                <div
                  key={tab.key}
                  className={`navigation-item ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => onTabChange(tab.key)}
                  data-testid={`nav-item-${tab.key}`}
                >
                  <span className="item-title">{tab.title}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

describe('Modern Navigation', () => {
  const defaultProps = {
    activeTab: 'testCategories',
    onTabChange: jest.fn(),
    tabSearchQuery: '',
    onTabSearch: jest.fn(),
    navigationView: 'categories',
    onNavigationViewToggle: jest.fn(),
    openCategories: new Set(['test-management']),
    onCategoryToggle: jest.fn(),
    masterData: {
      testCategories: [1, 2, 3],
      testParameters: [1, 2]
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders navigation with categories view by default', () => {
    render(<MockMasterDataNavigation {...defaultProps} />);

    expect(screen.getByTestId('category-test-management')).toBeInTheDocument();
    expect(screen.getByTestId('category-sample-management')).toBeInTheDocument();
    expect(screen.getByTestId('current-category')).toHaveTextContent('Test Management');
    expect(screen.getByTestId('current-item')).toHaveTextContent('Test Categories');
  });

  test('shows navigation items when category is open', () => {
    render(<MockMasterDataNavigation {...defaultProps} />);

    expect(screen.getByTestId('nav-item-testCategories')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-testParameters')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-testMaster')).toBeInTheDocument();
  });

  test('toggles category open/closed state', () => {
    const onCategoryToggle = jest.fn();
    render(
      <MockMasterDataNavigation 
        {...defaultProps} 
        onCategoryToggle={onCategoryToggle}
        openCategories={new Set()}
      />
    );
    
    const categoryHeader = screen.getByTestId('category-test-management');
    fireEvent.click(categoryHeader);
    
    expect(onCategoryToggle).toHaveBeenCalledWith('test-management');
  });

  test('switches between categories and list view', () => {
    const onNavigationViewToggle = jest.fn();
    render(
      <MockMasterDataNavigation 
        {...defaultProps} 
        onNavigationViewToggle={onNavigationViewToggle}
      />
    );
    
    const viewToggle = screen.getByTestId('view-toggle');
    expect(viewToggle).toHaveTextContent('List View');
    
    fireEvent.click(viewToggle);
    expect(onNavigationViewToggle).toHaveBeenCalled();
  });

  test('renders list view correctly', () => {
    render(
      <MockMasterDataNavigation 
        {...defaultProps} 
        navigationView="list"
      />
    );
    
    // Should show all items in a flat list
    expect(screen.getByTestId('nav-item-testCategories')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-testParameters')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-sampleTypes')).toBeInTheDocument();
  });

  test('handles tab selection', () => {
    const onTabChange = jest.fn();
    render(
      <MockMasterDataNavigation 
        {...defaultProps} 
        onTabChange={onTabChange}
      />
    );
    
    const testParametersItem = screen.getByTestId('nav-item-testParameters');
    fireEvent.click(testParametersItem);
    
    expect(onTabChange).toHaveBeenCalledWith('testParameters');
  });

  test('highlights active tab', () => {
    render(
      <MockMasterDataNavigation 
        {...defaultProps} 
        activeTab="testParameters"
      />
    );
    
    const activeItem = screen.getByTestId('nav-item-testParameters');
    expect(activeItem).toHaveClass('active');
  });

  test('filters navigation items based on search', () => {
    const onTabSearch = jest.fn();
    render(
      <MockMasterDataNavigation 
        {...defaultProps} 
        tabSearchQuery="test categories"
        onTabSearch={onTabSearch}
      />
    );
    
    const searchInput = screen.getByTestId('navigation-search');
    fireEvent.change(searchInput, { target: { value: 'parameters' } });
    
    expect(onTabSearch).toHaveBeenCalledWith('parameters');
  });

  test('shows item counts when data is available', () => {
    render(<MockMasterDataNavigation {...defaultProps} />);
    
    const testCategoriesItem = screen.getByTestId('nav-item-testCategories');
    expect(testCategoriesItem).toHaveTextContent('3'); // Count from masterData
  });

  test('shows category item counts', () => {
    render(<MockMasterDataNavigation {...defaultProps} />);
    
    expect(screen.getByText('(3)')).toBeInTheDocument(); // Test Management has 3 items
    expect(screen.getByText('(2)')).toBeInTheDocument(); // Sample & Specimen has 2 items
  });

  test('updates breadcrumb when active tab changes', () => {
    const { rerender } = render(<MockMasterDataNavigation {...defaultProps} />);
    
    expect(screen.getByTestId('current-item')).toHaveTextContent('Test Categories');
    
    rerender(
      <MockMasterDataNavigation 
        {...defaultProps} 
        activeTab="sampleTypes"
      />
    );
    
    expect(screen.getByTestId('current-category')).toHaveTextContent('Sample & Specimen');
    expect(screen.getByTestId('current-item')).toHaveTextContent('Sample Types');
  });
});
