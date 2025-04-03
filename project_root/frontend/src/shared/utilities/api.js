import axios from 'axios';
import { API_BASE_URL } from './constants'; // Assuming constants.js defines this

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // Add other common headers if needed
  },
});

// --- Optional: Request Interceptor (e.g., for adding Auth tokens) ---
apiClient.interceptors.request.use(
  (config) => {
    // Example: Get token from localStorage or Redux store
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Optional: Response Interceptor (e.g., for handling errors globally) ---
apiClient.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response.data; // Often useful to return response.data directly
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    console.error('API Error:', error.response || error.message);
    // Example: Handle 401 Unauthorized errors (e.g., redirect to login)
    if (error.response && error.response.status === 401) {
      // Dispatch logout action or redirect
      console.log('Unauthorized access - redirecting to login...');
      // window.location.href = '/login';
    }
    return Promise.reject(error.response ? error.response.data : error.message); // Reject with specific error info
  }
);

// --- Example API Functions ---

// Example GET request
export const getDashboardStats = () => apiClient.get('/dashboard/stats');

// Example POST request
export const submitProposal = (proposalData) => apiClient.post('/governance/proposals', proposalData);

// Example GET request with params
export const getUserVotes = (userId) => apiClient.get(`/users/${userId}/votes`);


export default apiClient; // Export the configured instance