import api from './api';

/**
 * AI Insights API Service
 * Provides intelligent analytics and recommendations
 */
export const aiInsightsAPI = {
  /**
   * Get comprehensive dashboard data with AI insights
   */
  getComprehensiveDashboard: () => api.get('/dashboard/comprehensive'),

  /**
   * Get AI-powered insights for specific modules
   */
  getModuleInsights: (module) => api.get(`/ai-insights/${module}`),

  /**
   * Get predictive analytics
   */
  getPredictiveAnalytics: (type, timeframe = '30d') => 
    api.get(`/ai-insights/predictions?type=${type}&timeframe=${timeframe}`),

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations: (category) => 
    api.get(`/ai-insights/recommendations?category=${category}`),

  /**
   * Get trend analysis
   */
  getTrendAnalysis: (metrics, period = '7d') => 
    api.get(`/ai-insights/trends?metrics=${metrics.join(',')}&period=${period}`),

  /**
   * Get anomaly detection results
   */
  getAnomalyDetection: (dataType) => 
    api.get(`/ai-insights/anomalies?type=${dataType}`),

  /**
   * Get financial insights
   */
  getFinancialInsights: () => api.get('/ai-insights/financial'),

  /**
   * Get operational insights
   */
  getOperationalInsights: () => api.get('/ai-insights/operational'),

  /**
   * Get patient flow insights
   */
  getPatientFlowInsights: () => api.get('/ai-insights/patient-flow'),

  /**
   * Get inventory optimization insights
   */
  getInventoryInsights: () => api.get('/ai-insights/inventory'),

  /**
   * Get lab efficiency insights
   */
  getLabEfficiencyInsights: () => api.get('/ai-insights/lab-efficiency'),

  /**
   * Generate custom insights based on user query
   */
  generateCustomInsights: (query, context = {}) => 
    api.post('/ai-insights/custom', { query, context }),

  /**
   * Get insights summary for dashboard
   */
  getInsightsSummary: () => api.get('/ai-insights/summary'),

  /**
   * Mark insight as read/acknowledged
   */
  acknowledgeInsight: (insightId) => 
    api.post(`/ai-insights/${insightId}/acknowledge`),

  /**
   * Get insight history
   */
  getInsightHistory: (page = 1, limit = 20) => 
    api.get(`/ai-insights/history?page=${page}&limit=${limit}`),

  /**
   * Export insights report
   */
  exportInsightsReport: (format = 'pdf', filters = {}) => 
    api.post('/ai-insights/export', { format, filters }, {
      responseType: 'blob'
    })
};

/**
 * AI Insights Utilities
 */
export const aiInsightsUtils = {
  /**
   * Format insight priority for display
   */
  formatPriority: (priority) => {
    const priorities = {
      'high': { label: 'High', color: 'danger', icon: 'exclamation-triangle' },
      'medium': { label: 'Medium', color: 'warning', icon: 'exclamation-circle' },
      'low': { label: 'Low', color: 'info', icon: 'info-circle' }
    };
    return priorities[priority] || priorities['low'];
  },

  /**
   * Format insight type for display
   */
  formatType: (type) => {
    const types = {
      'trend': { label: 'Trend Analysis', icon: 'chart-line' },
      'financial': { label: 'Financial', icon: 'dollar-sign' },
      'operational': { label: 'Operational', icon: 'cogs' },
      'predictive': { label: 'Predictive', icon: 'crystal-ball' },
      'anomaly': { label: 'Anomaly', icon: 'exclamation-triangle' }
    };
    return types[type] || { label: 'General', icon: 'lightbulb' };
  },

  /**
   * Calculate insight score based on various factors
   */
  calculateInsightScore: (insight) => {
    let score = 0;
    
    // Priority weight
    const priorityWeights = { 'high': 3, 'medium': 2, 'low': 1 };
    score += priorityWeights[insight.priority] || 1;
    
    // Type weight
    const typeWeights = { 
      'financial': 3, 
      'operational': 2.5, 
      'trend': 2, 
      'predictive': 2.5,
      'anomaly': 3 
    };
    score += typeWeights[insight.type] || 1;
    
    // Recency weight (newer insights score higher)
    const createdAt = new Date(insight.created_at || Date.now());
    const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 3 - daysSinceCreated * 0.1);
    
    return Math.round(score * 10) / 10;
  },

  /**
   * Group insights by category
   */
  groupInsightsByCategory: (insights) => {
    return insights.reduce((groups, insight) => {
      const category = insight.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(insight);
      return groups;
    }, {});
  },

  /**
   * Filter insights by criteria
   */
  filterInsights: (insights, criteria) => {
    return insights.filter(insight => {
      if (criteria.priority && insight.priority !== criteria.priority) return false;
      if (criteria.type && insight.type !== criteria.type) return false;
      if (criteria.category && insight.category !== criteria.category) return false;
      if (criteria.acknowledged !== undefined && 
          Boolean(insight.acknowledged) !== criteria.acknowledged) return false;
      return true;
    });
  },

  /**
   * Sort insights by relevance
   */
  sortInsightsByRelevance: (insights) => {
    return insights.sort((a, b) => {
      const scoreA = aiInsightsUtils.calculateInsightScore(a);
      const scoreB = aiInsightsUtils.calculateInsightScore(b);
      return scoreB - scoreA;
    });
  },

  /**
   * Generate insight summary text
   */
  generateSummaryText: (insights) => {
    const total = insights.length;
    const highPriority = insights.filter(i => i.priority === 'high').length;
    const categories = [...new Set(insights.map(i => i.category))].length;
    
    return `${total} insights available across ${categories} categories. ${highPriority} high-priority items require attention.`;
  }
};

export default aiInsightsAPI;
