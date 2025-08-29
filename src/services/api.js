import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5002/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('[API] Request:', config.method?.toUpperCase(), config.url, 'Token:', token ? 'Present' : 'Missing');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', response.status, response.config.method?.toUpperCase(), response.config.url);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const message = error.response?.data?.message;

    // console.error('[API] Response Error:', status, originalRequest.method?.toUpperCase(), originalRequest.url, message);

    // If error is 401 and not already retrying
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Don't try to refresh token for auth endpoints
      if (originalRequest.url?.includes('/auth/')) {
        console.log('[API] 401 on auth endpoint, clearing auth and redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Try to refresh the token
      try {
        console.log('[API] Attempting token refresh...');
        const refreshResponse = await api.post('/auth/refresh');
        const newToken = refreshResponse.data.token;

        // Update token in localStorage
        localStorage.setItem('token', newToken);

        // Update the original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

        console.log('[API] Token refreshed successfully, retrying original request');
        // Retry the original request
        return api(originalRequest);

      } catch (refreshError) {
        console.log('[API] Token refresh failed, clearing auth and redirecting to login');
        // Refresh failed, clear auth and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/user'),
  refreshToken: () => api.post('/auth/refresh'),
  validateToken: () => api.post('/auth/validate')
};

// Tenant API
export const tenantAPI = {
  getCurrentTenant: () => api.get('/tenants/current'),
  getAllTenants: () => api.get('/tenants/accessible'),
  getAccessibleTenants: () => api.get('/tenants/accessible'),
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
  searchPatients: (query, branchId = null) => {
    let url = `/patients/search?q=${query}`;
    if (branchId) {
      url += `&branch_id=${branchId}`;
    }
    return api.get(url);
  },
};

// Sample API
export const sampleAPI = {
  getAllSamples: (page = 1, limit = 20) => api.get(`/samples?page=${page}&limit=${limit}`),
  getSamples: (params = {}) => api.get('/samples', { params }),
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
  getSampleTransferById: (id) => api.get(`/samples/transfers/${id}`),
  createSampleTransfer: (data) => api.post('/samples/transfers', data),
  updateSampleTransfer: (id, data) => api.put(`/samples/transfers/${id}`, data),
  dispatchSampleTransfer: (id, data) => api.put(`/samples/transfers/${id}/dispatch`, data),
  
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
  searchBillings: (query) => api.get(`/billing/search?q=${query}`),
  deleteBilling: (id) => api.delete(`/billing/${id}`),

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

  // Master Data Management
  getMasterData: () => api.get('/admin/master-data'),
  addMasterDataItem: (category, data) => api.post(`/admin/master-data/${category}`, data),
  updateMasterDataItem: (category, id, data) => api.put(`/admin/master-data/${category}/${id}`, data),
  deleteMasterDataItem: (category, id) => api.delete(`/admin/master-data/${category}/${id}`),

  // Excel Import/Export for Master Data
  importMasterData: (formData) => {
    return api.post('/admin/master-data/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // GST Configuration Management
  getGSTConfig: () => api.get('/admin/gst-config'),
  createGSTConfig: (data) => api.post('/admin/gst-config', data),
  updateGSTConfig: (id, data) => api.put(`/admin/gst-config/${id}`, data),
  deleteGSTConfig: (id) => api.delete(`/admin/gst-config/${id}`),
  exportMasterData: (category) => {
    return api.get(`/admin/master-data/export/${category}`, {
      responseType: 'blob',
    });
  },
  exportAllMasterData: () => {
    return api.get('/admin/master-data/export', {
      responseType: 'blob',
    });
  },
  downloadTemplate: (category) => {
    return api.get(`/admin/master-data/template/${category}`, {
      responseType: 'blob',
    });
  },
  bulkImportMasterData: (formData) => {
    return api.post('/admin/master-data/bulk-import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Technical Master Data Management
  getTechnicalMasterData: () => api.get('/admin/technical-master-data'),
  addTechnicalMasterDataItem: (category, data) => api.post(`/admin/technical-master-data/${category}`, data),
  updateTechnicalMasterDataItem: (category, id, data) => api.put(`/admin/technical-master-data/${category}/${id}`, data),
  deleteTechnicalMasterDataItem: (category, id) => api.delete(`/admin/technical-master-data/${category}/${id}`),
  updateEnhancedTestMaster: (id, data) => api.put(`/admin/test-master-enhanced/${id}`, data),

  updateEnhancedResultMaster: (id, data) => api.put(`/admin/result-master-enhanced/${id}`, data),

  // Excel Data Integration
  getExcelData: () => api.get('/admin/excel-data'),
  searchExcelData: (query) => api.get(`/admin/excel-data/search?q=${encodeURIComponent(query)}`),
  lookupTestByCode: (testCode) => api.get(`/admin/excel-data/lookup/${testCode}`),
  lookupTestByName: (testName) => api.get(`/admin/excel-data/lookup-by-name/${encodeURIComponent(testName)}`),

  // Enhanced Test Master
  getEnhancedTestMaster: () => api.get('/admin/test-master-enhanced'),
  addEnhancedTestMaster: (data) => api.post('/admin/test-master-enhanced', data),
  updateEnhancedTestMaster: (id, data) => api.put(`/admin/test-master-enhanced/${id}`, data),
  deleteEnhancedTestMaster: (id) => api.delete(`/admin/test-master-enhanced/${id}`),

  // Referrer Master Data (legacy)
  getReferrerMasterData: () => api.get('/admin/referrer-master-data'),

  // Referral Master Data CRUD
  getReferralMaster: () => api.get('/admin/referral-master'),
  addReferralMaster: (data) => api.post('/admin/referral-master', data),
  updateReferralMaster: (id, data) => api.put(`/admin/referral-master/${id}`, data),
  deleteReferralMaster: (id) => api.delete(`/admin/referral-master/${id}`),

  // Enhanced Result Master
  getEnhancedResultMaster: () => api.get('/admin/result-master-enhanced'),
  addEnhancedResultMaster: (data) => api.post('/admin/result-master-enhanced', data),
  updateEnhancedResultMaster: (id, data) => api.put(`/admin/result-master-enhanced/${id}`, data),
  deleteEnhancedResultMaster: (id) => api.delete(`/admin/result-master-enhanced/${id}`),

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
  // Sample Type Management
  getSampleTypes: () => api.get('/admin/sample-types'),
  getSampleTypeById: (id) => api.get(`/admin/sample-types/${id}`),
  createSampleType: (data) => api.post('/admin/sample-types', data),
  updateSampleType: (id, data) => api.put(`/admin/sample-types/${id}`, data),
  deleteSampleType: (id) => api.delete(`/admin/sample-types/${id}`),
  // Test Parameter Management
  getTestParameters: () => api.get('/admin/test-parameters'),
  getTestParameterById: (id) => api.get(`/admin/test-parameters/${id}`),
  createTestParameter: (data) => api.post('/admin/test-parameters', data),
  updateTestParameter: (id, data) => api.put(`/admin/test-parameters/${id}`, data),
  deleteTestParameter: (id) => api.delete(`/admin/test-parameters/${id}`),
  // Department Management
  getDepartments: () => api.get('/admin/departments'),
  getDepartmentById: (id) => api.get(`/admin/departments/${id}`),
  createDepartment: (data) => api.post('/admin/departments', data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),
  // Payment Method Management
  getPaymentMethods: () => api.get('/admin/payment-methods'),
  getPaymentMethodById: (id) => api.get(`/admin/payment-methods/${id}`),
  createPaymentMethod: (data) => api.post('/admin/payment-methods', data),
  updatePaymentMethod: (id, data) => api.put(`/admin/payment-methods/${id}`, data),
  deletePaymentMethod: (id) => api.delete(`/admin/payment-methods/${id}`),

  // Access Management
  getModules: () => api.get('/access-management/modules'),
  getFranchisesWithPermissions: () => api.get('/access-management/franchises-with-permissions'),
  updateFranchisePermissions: (franchiseId, data) => api.put(`/access-management/franchise-permissions/${franchiseId}`, data),
  checkModuleAccess: (moduleCode) => api.get(`/access-management/check-module-access/${moduleCode}`),
  getMyPermissions: () => api.get('/access-management/my-permissions'),
  getMyModules: () => api.get('/access-management/my-modules'),

  // Signature Management
  getCurrentSignature: () => api.get('/admin/signature'),
  uploadSignature: (formData) => {
    return api.post('/admin/signature/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  removeSignature: () => api.delete('/admin/signature'),

  // Generic API access for custom endpoints
  get: (url) => api.get(url),
  post: (url, data) => api.post(url, data),
  put: (url, data) => api.put(url, data),
  delete: (url) => api.delete(url)
};

// Dashboard API
export const dashboardAPI = {
  getDashboardData: () => api.get('/dashboard'),
  getComprehensiveDashboard: () => api.get('/dashboard/comprehensive')
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

// Sample Routing API
export const routingAPI = {
  getRoutings: (params) => api.get('/samples/routing', { params }),
  getRoutingById: (id) => api.get(`/samples/routing/${id}`),
createRouting: (data) =>
  api.post('/samples/routing', data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  }),

  approveRouting: (id, data) => api.post(`/samples/routing/${id}/approve`, data),
  rejectRouting: (id, data) => api.post(`/samples/routing/${id}/reject`, data),
  dispatchRouting: (id, data) => api.post(`/samples/routing/${id}/dispatch`, data),
  receiveRouting: (id, data) => api.post(`/samples/routing/${id}/receive`, data),
  completeRouting: (id, data) => api.post(`/samples/routing/${id}/complete`, data),
  getRoutingHistory: (id) => api.get(`/samples/routing/${id}/history`)
};

// Chat API
export const chatAPI = {
  getMessages: (routingId) => api.get(`/routing/${routingId}/messages`),
  sendMessage: (routingId, data) => api.post(`/routing/${routingId}/messages`, data),
  markAsRead: (routingId, messageId) => api.post(`/routing/${routingId}/messages/${messageId}/read`),
  getUnreadCount: (routingId) => api.get(`/routing/${routingId}/messages/unread-count`),
  getUnreadSummary: () => api.get('/routing/messages/unread-summary')
};

// File API
export const fileAPI = {
  getFiles: (routingId) => api.get(`/routing/${routingId}/files`),
  uploadFile: (routingId, formData) => api.post(`/routing/${routingId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadFile: (routingId, fileId) => api.get(`/routing/${routingId}/files/${fileId}/download`, {
    responseType: 'blob'
  }),
  deleteFile: (routingId, fileId) => api.delete(`/routing/${routingId}/files/${fileId}`),
  getFilesSummary: () => api.get('/routing/files/summary')
};

// Invoice API
export const invoiceAPI = {
  getInvoices: (routingId) => api.get(`/routing/${routingId}/invoices`),
  createInvoice: (routingId, data) => api.post(`/routing/${routingId}/invoices`, data),
  getInvoiceById: (invoiceId) => api.get(`/invoices/${invoiceId}`),
  updateInvoice: (invoiceId, data) => api.put(`/invoices/${invoiceId}`, data),
  deleteInvoice: (invoiceId) => api.delete(`/invoices/${invoiceId}`),
  updateInvoiceStatus: (invoiceId, status) => api.post(`/invoices/${invoiceId}/status`, { status }),
  generateInvoicePDF: (invoiceId) => api.get(`/invoices/${invoiceId}/pdf`, {
    responseType: 'blob'
  })
};

// Notifications API
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (notificationId) => api.post(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
  getUnreadCount: () => api.get('/notifications/unread-count')
};



// Export the api instance as default
export default api;
