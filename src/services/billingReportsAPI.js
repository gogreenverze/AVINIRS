/**
 * Billing Reports API Service
 * Handles comprehensive billing report operations with franchise-based access control
 */

import axios from 'axios';
import api from './api';

const billingReportsAPI = {
  /**
   * Generate comprehensive billing report for a billing record
   * @param {number} billingId - Billing ID to generate report for
   * @returns {Promise} API response
   */
  generateReport: async (billingId) => {
    try {
      const response = await api.post(`/billing-reports/generate/${billingId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to generate billing report'
      };
    }
  },

  /**
   * Get all billing reports with role-based access control
   * @param {number} franchiseId - Optional franchise ID for filtering
   * @returns {Promise} API response
   */
  getAllReports: async (franchiseId = null) => {
    try {
      const params = new URLSearchParams();
      if (franchiseId) {
        params.append('franchise_id', franchiseId);
      }

      const url = `/billing-reports/list${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('[billingReportsAPI] Making request to:', url);

      const response = await api.get(url);
      console.log('[billingReportsAPI] Raw response:', response);
      console.log('[billingReportsAPI] Response data:', response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[billingReportsAPI] Error:', error);
      console.error('[billingReportsAPI] Error response:', error.response);

      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get billing reports'
      };
    }
  },

  /**
   * Search billing reports with various filters
   * @param {Object} searchParams - Search parameters
   * @param {number} franchiseId - Optional franchise ID for filtering
   * @returns {Promise} API response
   */
  searchReports: async (searchParams = {}, franchiseId = null) => {
    try {
      const params = new URLSearchParams();

      if (searchParams.sid) params.append('sid', searchParams.sid);
      if (searchParams.patient_name) params.append('patient_name', searchParams.patient_name);
      if (searchParams.mobile) params.append('mobile', searchParams.mobile);
      if (searchParams.date_from) params.append('date_from', searchParams.date_from);
      if (searchParams.date_to) params.append('date_to', searchParams.date_to);
      if (franchiseId) params.append('franchise_id', franchiseId);

      const response = await api.get(`/billing-reports/search?${params.toString()}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to search billing reports'
      };
    }
  },

  /**
   * Get billing report by SID number
   * @param {string} sidNumber - SID number
   * @returns {Promise} API response
   */
  getReportBySID: async (sidNumber) => {
    try {
      const response = await api.get(`/billing-reports/sid/${sidNumber}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to retrieve billing report'
      };
    }
  },

  /**
   * Get SID autocomplete suggestions
   * @param {string} partialSID - Partial SID for autocomplete
   * @param {number} limit - Maximum number of suggestions
   * @returns {Promise} API response
   */
  getSIDAutocomplete: async (partialSID, limit = 10) => {
    try {
      const response = await api.get(`/billing-reports/sid-autocomplete?q=${partialSID}&limit=${limit}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get SID suggestions'
      };
    }
  },

  /**
   * Get billing reports statistics
   * @param {number} franchiseId - Optional franchise ID for filtering
   * @returns {Promise} API response
   */
  getReportsStats: async (franchiseId = null) => {
    try {
      const params = new URLSearchParams();
      if (franchiseId) {
        params.append('franchise_id', franchiseId);
      }

      const url = `/billing-reports/stats${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get reports statistics'
      };
    }
  },

  /**
   * Generate and download PDF for billing report
   * @param {number} reportId - Report ID
   * @returns {Promise} Blob response for PDF download
   */
  downloadReportPDF: async (reportId) => {
    try {
      const response = await api.get(`/billing-reports/${reportId}/pdf`, {
        responseType: 'blob'
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to download PDF'
      };
    }
  },

  /**
   * Utility function to download PDF blob as file
   * @param {Blob} blob - PDF blob data
   * @param {string} filename - Filename for download
   */
  downloadPDFBlob: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Update test item in billing report
   * @param {string} sidNumber - SID number
   * @param {number} testIndex - Index of test item to update
   * @param {Object} testData - Updated test data
   * @returns {Promise} API response
   */
  updateTestItem: async (sidNumber, testIndex, testData) => {
    try {
      const response = await api.put(`/billing-reports/sid/${sidNumber}/test/${testIndex}`, testData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update test item'
      };
    }
  },

  /**
   * Update entire billing report
   * @param {string} sidNumber - SID number
   * @param {Object} reportData - Updated report data
   * @returns {Promise} API response
   */
  updateReport: async (sidNumber, reportData) => {
    try {
      const response = await api.put(`/billing-reports/sid/${sidNumber}`, reportData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update billing report'
      };
    }
  },

  /**
   * Format currency for display
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  },

  /**
   * Format date for display
   * @param {string} dateString - Date string to format
   * @returns {string} Formatted date string
   */
  formatDate: (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  },

  /**
   * Format datetime for display
   * @param {string} dateTimeString - DateTime string to format
   * @returns {string} Formatted datetime string
   */
  formatDateTime: (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
      return new Date(dateTimeString).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid DateTime';
    }
  },

  /**
   * Get status badge variant for Bootstrap
   * @param {string} status - Status string
   * @returns {string} Bootstrap variant
   */
  getStatusVariant: (status) => {
    switch (status?.toLowerCase()) {
      case 'generated':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'error':
        return 'danger';
      case 'processing':
        return 'info';
      default:
        return 'secondary';
    }
  },

  /**
   * Validate SID format
   * @param {string} sid - SID to validate
   * @returns {boolean} True if valid SID format
   */
  validateSIDFormat: (sid) => {
    // SID format: 2-3 letters followed by 3 digits (e.g., AM001, AS001)
    const sidPattern = /^[A-Z]{2,3}\d{3}$/;
    return sidPattern.test(sid);
  },

  /**
   * Get franchise prefix from SID
   * @param {string} sid - SID number
   * @returns {string} Franchise prefix
   */
  getFranchisePrefix: (sid) => {
    if (!sid || sid.length < 2) return '';
    return sid.substring(0, 2);
  },

  /**
   * Get test match success rate color
   * @param {number} rate - Success rate (0-1)
   * @returns {string} Color class
   */
  getMatchRateColor: (rate) => {
    if (rate >= 0.9) return 'text-success';
    if (rate >= 0.7) return 'text-warning';
    return 'text-danger';
  },

  /**
   * Authorize a billing report
   * @param {number} reportId - Report ID to authorize
   * @param {Object} authorizationData - Authorization details
   * @returns {Promise} API response
   */
  authorizeReport: async (reportId, authorizationData) => {
      const token = localStorage.getItem('token');
    try {
      const response = await api.post(`/billing-reports/${reportId}/authorize`, authorizationData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to authorize report'
      };
    }
  },


/**
 * Update sample status in a billing report
 * @param {string} sidNumber - SID number
 * @param {number} testId - Test ID
 * @param {Object} payload - Payload with sample status details
 * @returns {Promise<Object>} API response
 */
updateSampleStatus: async (sidNumber, testId, payload) => {
  const token = localStorage.getItem('token');

  try {
    const response = await api.put(
      `/billing-reports/sid/${sidNumber}/sample-status`,
      {
        test_items: [  // 👈 wrap it here
          {
            id: testId,
            ...payload
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update sample status',
    };
  }
}


};

export default billingReportsAPI;
