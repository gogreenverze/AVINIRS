import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Redirect to login page
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';

      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/user')
};

// Tenant API
export const tenantAPI = {
  getCurrentTenant: () => api.get('/tenants/current'),
  getAllTenants: () => api.get('/tenants/accessible'),
  getTenants: () => api.get('/tenants'),
  getTenant: (id) => api.get(`/tenants/${id}`),
  createTenant: (data) => api.post('/tenants', data),
  updateTenant: (id, data) => api.put(`/tenants/${id}`, data),
  deleteTenant: (id) => api.delete(`/tenants/${id}`)
};

// Patient API
export const patientAPI = {
  getAllPatients: (page = 1, limit = 20) => api.get(`/patients?page=${page}&limit=${limit}`),
  getPatientById: (id) => api.get(`/patients/${id}`),
  createPatient: (patientData) => api.post('/patients', patientData),
  updatePatient: (id, patientData) => api.put(`/patients/${id}`, patientData),
  deletePatient: (id) => api.delete(`/patients/${id}`),
  searchPatients: (query) => api.get(`/patients/search?q=${query}`),
};

// Sample API
export const sampleAPI = {
  getAllSamples: (page = 1, limit = 20) => api.get(`/samples?page=${page}&limit=${limit}`),
  getSampleById: (id) => api.get(`/samples/${id}`),
  getSamplesByPatient: (patientId) => api.get(`/samples?patient_id=${patientId}`),
  getSamplesByStatus: (status) => api.get(`/samples?status=${status}`),
  createSample: (data) => api.post('/samples', data),
  updateSample: (id, data) => api.put(`/samples/${id}`, data),
  deleteSample: (id) => api.delete(`/samples/${id}`),
  searchSamples: (query) => api.get(`/samples/search?q=${query}`),
  getSampleTypes: () => api.get('/samples/types'),
  getContainers: () => api.get('/samples/containers'),
  getSampleRouting: () => api.get('/samples/routing'),
  getSampleTransfers: (page = 1, limit = 20) => api.get(`/samples/transfers?page=${page}&limit=${limit}`),
  createSampleTransfer: (data) => api.post('/samples/transfers', data),
  updateSampleTransfer: (id, data) => api.put(`/samples/transfers/${id}`, data)
};

// Result API
export const resultAPI = {
  getAllResults: (page = 1, limit = 20) => api.get(`/results?page=${page}&limit=${limit}`),
  getResultById: (id) => api.get(`/results/${id}`),
  getResultsByPatient: (patientId) => api.get(`/results?patient_id=${patientId}`),
  getResultsBySample: (sampleId) => api.get(`/results?sample_id=${sampleId}`),
  getResultsByStatus: (status) => api.get(`/results?status=${status}`),
  createResult: (data) => api.post('/results', data),
  updateResult: (id, data) => api.put(`/results/${id}`, data),
  verifyResult: (id) => api.post(`/results/${id}/verify`),
  searchResults: (query) => api.get(`/results/search?q=${query}`),
  getReports: (params = {}) => api.get('/results/reports', { params }),
  getQualityControlData: () => api.get('/results/quality-control')
};

// Billing API
export const billingAPI = {
  getAllBillings: (params = {}) => api.get('/billing', { params }),
  getBillingById: (id) => api.get(`/billing/${id}`),
  createBilling: (data) => api.post('/billing', data),
  updateBilling: (id, data) => api.put(`/billing/${id}`, data),
  collectPayment: (id, data) => api.post(`/billing/${id}/collect`, data),
  searchBillings: (query) => api.get(`/billing/search?q=${query}`)
};

// Inventory API
export const inventoryAPI = {
  getInventoryItems: (page = 1, limit = 20) => api.get(`/inventory?page=${page}&limit=${limit}`),
  getInventoryItemById: (id) => api.get(`/inventory/${id}`),
  createInventoryItem: (data) => api.post('/inventory', data),
  updateInventoryItem: (id, data) => api.put(`/inventory/${id}`, data),
  deleteInventoryItem: (id) => api.delete(`/inventory/${id}`),
  searchInventoryItems: (query) => api.get(`/inventory/search?q=${query}`),
  getInventoryTransactions: (itemId) => api.get(`/inventory/${itemId}/transactions`),
  addInventoryTransaction: (itemId, data) => api.post(`/inventory/${itemId}/transactions`, data),
  getLowStockItems: () => api.get('/inventory/low-stock')
};

// Admin API
export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: () => api.get('/admin/users'),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  getUserLoginHistory: (id) => api.get(`/admin/users/${id}/login-history`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getFranchises: () => api.get('/admin/franchises'),
  getFranchiseById: (id) => api.get(`/admin/franchises/${id}`),
  createFranchise: (data) => api.post('/admin/franchises', data),
  updateFranchise: (id, data) => api.put(`/admin/franchises/${id}`, data),
  deleteFranchise: (id) => api.delete(`/admin/franchises/${id}`),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  getMasterData: () => api.get('/admin/master-data'),
  addMasterDataItem: (category, data) => api.post(`/admin/master-data/${category}`, data),
  updateMasterDataItem: (category, id, data) => api.put(`/admin/master-data/${category}/${id}`, data),
  deleteMasterDataItem: (category, id) => api.delete(`/admin/master-data/${category}/${id}`),
  // Doctor Management
  getDoctors: () => api.get('/admin/doctors'),
  getDoctorById: (id) => api.get(`/admin/doctors/${id}`),
  createDoctor: (data) => api.post('/admin/doctors', data),
  updateDoctor: (id, data) => api.put(`/admin/doctors/${id}`, data),
  deleteDoctor: (id) => api.delete(`/admin/doctors/${id}`),
  // Test Category Management
  getTestCategories: () => api.get('/admin/test-categories'),
  getTestCategoryById: (id) => api.get(`/admin/test-categories/${id}`),
  createTestCategory: (data) => api.post('/admin/test-categories', data),
  updateTestCategory: (id, data) => api.put(`/admin/test-categories/${id}`, data),
  deleteTestCategory: (id) => api.delete(`/admin/test-categories/${id}`),
  // Test Management
  getTests: () => api.get('/admin/tests'),
  getTestById: (id) => api.get(`/admin/tests/${id}`),
  createTest: (data) => api.post('/admin/tests', data),
  updateTest: (id, data) => api.put(`/admin/tests/${id}`, data),
  deleteTest: (id) => api.delete(`/admin/tests/${id}`),
  // Test Panel Management
  getTestPanels: () => api.get('/admin/test-panels'),
  getTestPanelById: (id) => api.get(`/admin/test-panels/${id}`),
  createTestPanel: (data) => api.post('/admin/test-panels', data),
  updateTestPanel: (id, data) => api.put(`/admin/test-panels/${id}`, data),
  deleteTestPanel: (id) => api.delete(`/admin/test-panels/${id}`),
  // Container Management
  getContainers: () => api.get('/admin/containers'),
  getContainerById: (id) => api.get(`/admin/containers/${id}`),
  createContainer: (data) => api.post('/admin/containers', data),
  updateContainer: (id, data) => api.put(`/admin/containers/${id}`, data),
  deleteContainer: (id) => api.delete(`/admin/containers/${id}`),
  // Role Management
  getRoles: () => api.get('/admin/roles'),
  getRoleById: (id) => api.get(`/admin/roles/${id}`),
  createRole: (data) => api.post('/admin/roles', data),
  updateRole: (id, data) => api.put(`/admin/roles/${id}`, data),
  deleteRole: (id) => api.delete(`/admin/roles/${id}`),
  // Permission Management
  getPermissions: () => api.get('/admin/permissions'),
  getPermissionById: (id) => api.get(`/admin/permissions/${id}`),
  createPermission: (data) => api.post('/admin/permissions', data),
  updatePermission: (id, data) => api.put(`/admin/permissions/${id}`, data),
  deletePermission: (id) => api.delete(`/admin/permissions/${id}`),
  // Franchise Management
  createFranchise: (data) => api.post('/admin/franchises', data),
  // Sample Type Management
  getSampleTypes: () => api.get('/admin/sample-types'),
  getSampleTypeById: (id) => api.get(`/admin/sample-types/${id}`),
  createSampleType: (data) => api.post('/admin/sample-types', data),
  updateSampleType: (id, data) => api.put(`/admin/sample-types/${id}`, data),
  deleteSampleType: (id) => api.delete(`/admin/sample-types/${id}`)
};

// Dashboard API
export const dashboardAPI = {
  getDashboardData: () => api.get('/dashboard')
};

// Email API
export const emailAPI = {
  sendReport: (data) => api.post('/email/send-report', data)
};

// WhatsApp API
export const whatsappAPI = {
  getConfig: () => api.get('/whatsapp/config'),
  getConfigByTenant: (tenantId) => api.get(`/whatsapp/config/${tenantId}`),
  updateConfig: (tenantId, data) => api.put(`/whatsapp/config/${tenantId}`, data),
  getMessages: (page = 1, limit = 20) => api.get(`/whatsapp/messages?page=${page}&limit=${limit}`),
  sendReport: (data) => api.post('/whatsapp/send/report', data),
  sendInvoice: (data) => api.post('/whatsapp/send/invoice', data),
  getStatus: () => api.get('/whatsapp/status')
};



// Export all APIs
export default {
  authAPI,
  tenantAPI,
  dashboardAPI,
  patientAPI,
  sampleAPI,
  resultAPI,
  billingAPI,
  inventoryAPI,
  adminAPI,
  whatsappAPI
};
