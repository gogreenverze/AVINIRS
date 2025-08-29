import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

// Create axios instance with default config
const billingAPI = axios.create({
  baseURL: `${API_BASE_URL}/billing`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
billingAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
billingAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Billing API methods
export const billingService = {
  // Get all billing records
  getAllBilling: async (params = {}) => {
    try {
      const response = await billingAPI.get('/', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch billing records'
      };
    }
  },

  // Get billing record by ID
  getBillingById: async (id) => {
    try {
      const response = await billingAPI.get(`/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch billing record'
      };
    }
  },

  // Create new billing record
  createBilling: async (billingData) => {
    try {
      const response = await billingAPI.post('/', billingData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create billing record'
      };
    }
  },

  // Update billing record
  updateBilling: async (id, billingData) => {
    try {
      const response = await billingAPI.put(`/${id}`, billingData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update billing record'
      };
    }
  },

  // Delete billing record
  deleteBilling: async (id) => {
    try {
      const response = await billingAPI.delete(`/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete billing record'
      };
    }
  },

  // Get billing statistics
  getBillingStats: async (params = {}) => {
    try {
      const response = await billingAPI.get('/stats', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch billing statistics'
      };
    }
  },

  // Generate billing report
  generateReport: async (params = {}) => {
    try {
      const response = await billingAPI.get('/report', { 
        params,
        responseType: 'blob'
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to generate report'
      };
    }
  },

  // Print billing receipt
  printReceipt: async (id) => {
    try {
      const response = await billingAPI.get(`/${id}/print`, {
        responseType: 'blob'
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to print receipt'
      };
    }
  },

  // Search billing records
  searchBilling: async (searchTerm, filters = {}) => {
    try {
      const response = await billingAPI.get('/search', {
        params: {
          q: searchTerm,
          ...filters
        }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to search billing records'
      };
    }
  },

  // Get payment methods
  getPaymentMethods: async () => {
    try {
      const response = await billingAPI.get('/payment-methods');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch payment methods'
      };
    }
  },

  // Process payment
  processPayment: async (billingId, paymentData) => {
    try {
      const response = await billingAPI.post(`/${billingId}/payment`, paymentData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to process payment'
      };
    }
  },

  // Get billing templates
  getTemplates: async () => {
    try {
      const response = await billingAPI.get('/templates');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch templates'
      };
    }
  },

  // Validate billing data
  validateBilling: async (billingData) => {
    try {
      const response = await billingAPI.post('/validate', billingData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Validation failed'
      };
    }
  }
};

export const addTestToBilling = async (billingId, testData) => {
  try {
    const response = await billingAPI.post(`${billingId}/add-test`, testData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Failed to add test to billing' };
  }
};



export default billingService;
