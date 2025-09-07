// lib/api.js
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com/api'  // Replace with your production domain
    : '/api',  // Local development
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - runs before every request
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching issues
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - runs after every response
api.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      });
    }
    
    return response;
  },
  (error) => {
    // Enhanced error handling
    let errorMessage = 'An unexpected error occurred';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error.response) {
      // Server responded with error status
      errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
      errorCode = error.response.status;
      
      console.error(`❌ API Error [${errorCode}]:`, {
        url: error.config?.url,
        method: error.config?.method,
        message: errorMessage,
        data: error.response.data
      });
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error. Please check your connection.';
      errorCode = 'NETWORK_ERROR';
      
      console.error('❌ Network Error:', error.request);
    } else {
      // Request setup error
      console.error('❌ Request Setup Error:', error.message);
    }
    
    // Attach enhanced error info
    error.customMessage = errorMessage;
    error.customCode = errorCode;
    
    return Promise.reject(error);
  }
);

// API methods for your RAG Q&A App
const apiMethods = {
  // Document Upload APIs
  upload: {
    // Upload file or URL
    post: (data, config = {}) => {
      // Handle FormData for file uploads
      if (data instanceof FormData) {
        return api.post('/upload', data, {
          ...config,
          headers: {
            'Content-Type': 'multipart/form-data',
            ...config.headers
          },
          timeout: 60000 // 60 seconds for file uploads
        });
      }
      // Handle JSON data for URL uploads
      return api.post('/upload', data, config);
    },
    
    // Get all documents
    getDocuments: () => api.get('/upload/documents'),
    
    // Delete specific document
    deleteDocument: (documentId) => api.delete(`/upload/documents/${documentId}`)
  },

  // Query API
  query: {
    // Submit question for RAG processing
    post: (data) => api.post('/query', data, {
      timeout: 45000 // 45 seconds for AI processing
    })
  },

  // Generic methods (backward compatibility)
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config),
  patch: (url, data, config) => api.patch(url, data, config)
};

// Helper functions for common operations
export const apiHelpers = {
  // Upload a file with progress tracking
  uploadFileWithProgress: (file, fileType, onProgress) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('fileType', fileType);

    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
  },

  // Upload URL content
  uploadUrl: (url) => {
    return api.post('/upload', {
      fileType: 'url',
      url: url.trim()
    });
  },

  // Submit query with retry logic
  submitQuery: async (question, maxRetries = 2) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const response = await api.post('/query', { question });
        return response;
      } catch (error) {
        lastError = error;
        
        if (attempt <= maxRetries) {
          console.warn(`Query attempt ${attempt} failed, retrying...`);
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw lastError;
  },

  // Batch operations
  deleteMultipleDocuments: async (documentIds) => {
    const results = await Promise.allSettled(
      documentIds.map(id => api.delete(`/upload/documents/${id}`))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    return { successful, failed, total: documentIds.length };
  }
};

// Error handler for components
export const handleApiError = (error, defaultMessage = 'Something went wrong') => {
  if (error.customMessage) {
    return error.customMessage;
  }
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return defaultMessage;
};

// Export the main api instance and helper methods
export default {
  ...apiMethods,
  // Direct axios instance access if needed
  instance: api,
  // Helper methods
  helpers: apiHelpers,
  // Error handler
  handleError: handleApiError
};