/**
 * Real-time Data Service
 * Handles real-time updates for dashboard metrics and notifications
 */
import React from 'react';

class RealTimeService {
  constructor() {
    this.subscribers = new Map();
    this.pollingIntervals = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
  }

  /**
   * Subscribe to real-time updates for a specific data type
   * @param {string} dataType - Type of data to subscribe to
   * @param {function} callback - Callback function to handle updates
   * @param {number} interval - Polling interval in milliseconds (default: 30000)
   */
  subscribe(dataType, callback, interval = 30000) {
    if (!this.subscribers.has(dataType)) {
      this.subscribers.set(dataType, new Set());
    }
    
    this.subscribers.get(dataType).add(callback);
    
    // Start polling if not already started for this data type
    if (!this.pollingIntervals.has(dataType)) {
      this.startPolling(dataType, interval);
    }
    
    console.log(`[RealTime] Subscribed to ${dataType} updates`);
    
    // Return unsubscribe function
    return () => this.unsubscribe(dataType, callback);
  }

  /**
   * Unsubscribe from real-time updates
   * @param {string} dataType - Type of data to unsubscribe from
   * @param {function} callback - Callback function to remove
   */
  unsubscribe(dataType, callback) {
    if (this.subscribers.has(dataType)) {
      this.subscribers.get(dataType).delete(callback);
      
      // Stop polling if no more subscribers
      if (this.subscribers.get(dataType).size === 0) {
        this.stopPolling(dataType);
        this.subscribers.delete(dataType);
      }
    }
    
    console.log(`[RealTime] Unsubscribed from ${dataType} updates`);
  }

  /**
   * Start polling for a specific data type
   * @param {string} dataType - Type of data to poll
   * @param {number} interval - Polling interval in milliseconds
   */
  startPolling(dataType, interval) {
    const pollFunction = async () => {
      try {
        const data = await this.fetchData(dataType);
        this.notifySubscribers(dataType, data);
        this.reconnectAttempts = 0; // Reset on successful fetch
      } catch (error) {
        console.error(`[RealTime] Error fetching ${dataType}:`, error);
        this.handleError(dataType, error);
      }
    };

    // Initial fetch
    pollFunction();
    
    // Set up interval
    const intervalId = setInterval(pollFunction, interval);
    this.pollingIntervals.set(dataType, intervalId);
    
    console.log(`[RealTime] Started polling for ${dataType} every ${interval}ms`);
  }

  /**
   * Stop polling for a specific data type
   * @param {string} dataType - Type of data to stop polling
   */
  stopPolling(dataType) {
    if (this.pollingIntervals.has(dataType)) {
      clearInterval(this.pollingIntervals.get(dataType));
      this.pollingIntervals.delete(dataType);
      console.log(`[RealTime] Stopped polling for ${dataType}`);
    }
  }

  /**
   * Fetch data for a specific type
   * @param {string} dataType - Type of data to fetch
   * @returns {Promise} Promise resolving to the fetched data
   */
  async fetchData(dataType) {
    const api = (await import('./api')).default;
    
    switch (dataType) {
      case 'dashboard':
        const response = await api.get('/dashboard/comprehensive');
        return response.data;
      
      case 'notifications':
        const notifResponse = await api.get('/notifications');
        return notifResponse.data;
      
      case 'alerts':
        const alertsResponse = await api.get('/dashboard/alerts');
        return alertsResponse.data;
      
      case 'metrics':
        const metricsResponse = await api.get('/dashboard/metrics');
        return metricsResponse.data;
      
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }
  }

  /**
   * Notify all subscribers of a data type
   * @param {string} dataType - Type of data that was updated
   * @param {any} data - Updated data
   */
  notifySubscribers(dataType, data) {
    if (this.subscribers.has(dataType)) {
      this.subscribers.get(dataType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[RealTime] Error in subscriber callback for ${dataType}:`, error);
        }
      });
    }
  }

  /**
   * Handle errors during data fetching
   * @param {string} dataType - Type of data that failed to fetch
   * @param {Error} error - The error that occurred
   */
  handleError(dataType, error) {
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`[RealTime] Retrying ${dataType} in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        if (this.pollingIntervals.has(dataType)) {
          this.fetchData(dataType)
            .then(data => this.notifySubscribers(dataType, data))
            .catch(err => this.handleError(dataType, err));
        }
      }, delay);
    } else {
      console.error(`[RealTime] Max reconnection attempts reached for ${dataType}`);
      this.notifySubscribers(`${dataType}_error`, error);
    }
  }

  /**
   * Manually trigger a data refresh for a specific type
   * @param {string} dataType - Type of data to refresh
   */
  async refresh(dataType) {
    try {
      const data = await this.fetchData(dataType);
      this.notifySubscribers(dataType, data);
      return data;
    } catch (error) {
      console.error(`[RealTime] Error refreshing ${dataType}:`, error);
      throw error;
    }
  }

  /**
   * Get connection status
   * @returns {boolean} True if connected, false otherwise
   */
  getConnectionStatus() {
    return this.reconnectAttempts < this.maxReconnectAttempts;
  }

  /**
   * Clean up all subscriptions and intervals
   */
  cleanup() {
    // Clear all intervals
    this.pollingIntervals.forEach((intervalId, dataType) => {
      clearInterval(intervalId);
      console.log(`[RealTime] Cleaned up polling for ${dataType}`);
    });
    
    // Clear all data structures
    this.pollingIntervals.clear();
    this.subscribers.clear();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    
    console.log('[RealTime] Service cleaned up');
  }

  /**
   * Update polling interval for a specific data type
   * @param {string} dataType - Type of data to update interval for
   * @param {number} newInterval - New interval in milliseconds
   */
  updateInterval(dataType, newInterval) {
    if (this.pollingIntervals.has(dataType)) {
      this.stopPolling(dataType);
      this.startPolling(dataType, newInterval);
      console.log(`[RealTime] Updated ${dataType} polling interval to ${newInterval}ms`);
    }
  }

  /**
   * Get list of active subscriptions
   * @returns {Array} Array of active data types
   */
  getActiveSubscriptions() {
    return Array.from(this.subscribers.keys());
  }

  /**
   * Get subscriber count for a data type
   * @param {string} dataType - Type of data to check
   * @returns {number} Number of subscribers
   */
  getSubscriberCount(dataType) {
    return this.subscribers.has(dataType) ? this.subscribers.get(dataType).size : 0;
  }
}

// Create singleton instance
const realTimeService = new RealTimeService();

// React hook for using real-time data
export const useRealTimeData = (dataType, interval = 30000) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleUpdate = (newData) => {
      setData(newData);
      setLoading(false);
      setError(null);
    };

    const handleError = (err) => {
      setError(err);
      setLoading(false);
    };

    // Subscribe to updates
    const unsubscribe = realTimeService.subscribe(dataType, handleUpdate, interval);
    
    // Subscribe to errors
    const unsubscribeError = realTimeService.subscribe(`${dataType}_error`, handleError, interval);

    return () => {
      unsubscribe();
      unsubscribeError();
    };
  }, [dataType, interval]);

  const refresh = React.useCallback(() => {
    setLoading(true);
    return realTimeService.refresh(dataType);
  }, [dataType]);

  return { data, loading, error, refresh };
};

export default realTimeService;
