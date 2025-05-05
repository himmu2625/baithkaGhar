/**
 * API client for making requests to the backend
 */
import * as hostAPI from './host';

// Export all API modules
export * from './host';

export const apiClient = {
  host: hostAPI,
  
  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<any>} - Response data
   */
  get: async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    return makeRequest(endpoint, {
      method: "GET",
      ...options,
    })
  },
  
  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body
   * @param {Object} options - Request options
   * @returns {Promise<any>} - Response data
   */
  post: async (endpoint: string, data: any, options: RequestInit = {}): Promise<any> => {
    return makeRequest(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    })
  },
  
  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body
   * @param {Object} options - Request options
   * @returns {Promise<any>} - Response data
   */
  put: async (endpoint: string, data: any, options: RequestInit = {}): Promise<any> => {
    return makeRequest(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    })
  },
  
  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<any>} - Response data
   */
  delete: async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    return makeRequest(endpoint, {
      method: "DELETE",
      ...options,
    })
  },
  
  /**
   * Upload a file
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - Form data with file
   * @param {Object} options - Request options
   * @returns {Promise<any>} - Response data
   */
  upload: async (endpoint: string, formData: FormData, options: RequestInit = {}): Promise<any> => {
    return makeRequest(endpoint, {
      method: "POST",
      body: formData,
      ...options,
    })
  },
}

/**
 * Make a request to the API
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<any>} - Response data
 */
async function makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  try {
    // Add authorization header if token exists
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      }
    }
    
    // Make the request
    const response = await fetch(`/api/${endpoint}`, options)
    
    // Parse the response
    const data = await response.json()
    
    // Check for errors
    if (!response.ok) {
      throw new Error(data.message || "An error occurred")
    }
    
    return data
  } catch (error: any) {
    console.error(`API error (${endpoint}):`, error)
    throw error
  }
}
