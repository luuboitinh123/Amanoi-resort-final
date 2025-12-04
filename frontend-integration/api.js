// API Integration for Frontend
// Base API URL - Update this to match your backend server
const API_BASE_URL = 'http://localhost:3000/api';

// Helper function to get auth token from localStorage
function getAuthToken() {
  return localStorage.getItem('authToken');
}

// Helper function to set auth token
function setAuthToken(token) {
  localStorage.setItem('authToken', token);
}

// Helper function to remove auth token
function removeAuthToken() {
  localStorage.removeItem('authToken');
}

// Generic API request function
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...options,
    mode: 'cors', // Explicitly set CORS mode
    credentials: 'include' // Include credentials for CORS
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    console.error('Request URL:', url);
    console.error('Request config:', config);
    
    // Provide more helpful error messages
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Cannot connect to backend server. Make sure the server is running on http://localhost:3000');
    }
    
    throw error;
  }
}

// Authentication API
const AuthAPI = {
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: userData
    });
  },

  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    
    if (data.success && data.token) {
      setAuthToken(data.token);
    }
    
    return data;
  },

  logout: () => {
    removeAuthToken();
    window.location.href = 'index.html';
  },

  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  }
};

// Rooms API
const RoomsAPI = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(`/rooms${queryParams ? '?' + queryParams : ''}`);
  },

  getBySlug: async (slug) => {
    return apiRequest(`/rooms/${slug}`);
  },

  checkAvailability: async (roomId, checkIn, checkOut) => {
    return apiRequest('/rooms/check-availability', {
      method: 'POST',
      body: { room_id: roomId, check_in: checkIn, check_out: checkOut }
    });
  },

  getAvailabilityCalendar: async (roomId, startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return apiRequest(`/rooms/${roomId}/availability?${params.toString()}`);
  }
};

// Bookings API
const BookingsAPI = {
  create: async (bookingData) => {
    return apiRequest('/bookings', {
      method: 'POST',
      body: bookingData
    });
  },

  getMyBookings: async () => {
    return apiRequest('/bookings/my-bookings');
  },

  getByReference: async (reference) => {
    return apiRequest(`/bookings/${reference}`);
  },

  updatePayment: async (bookingId, paymentData) => {
    return apiRequest(`/bookings/${bookingId}/payment`, {
      method: 'PATCH',
      body: paymentData
    });
  },

  cancel: async (bookingId, password) => {
    return apiRequest(`/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      body: { password }
    });
  }
};

// Payments API
const PaymentsAPI = {
  applyCoupon: async (code, totalAmount) => {
    return apiRequest('/payments/apply-coupon', {
      method: 'POST',
      body: { code, total_amount: totalAmount }
    });
  },

  process: async (paymentData) => {
    return apiRequest('/payments/process', {
      method: 'POST',
      body: paymentData
    });
  }
};

// Users API
const UsersAPI = {
  updateProfile: async (profileData) => {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: profileData
    });
  }
};

// Admin API client
const AdminAPI = {
  async request(endpoint, options = {}) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Handle blob response for CSV export
    if (options.responseType === 'blob') {
      const response = await fetch(`${API_BASE_URL}/admin${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Request failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const contentDisposition = response.headers.get('Content-Disposition');
      a.download = contentDisposition ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') : 'export.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      return { success: true, message: 'File downloaded successfully' };
    }

    const response = await fetch(`${API_BASE_URL}/admin${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (response.status === 403) {
      throw new Error('Access denied. Admin privileges required.');
    }

    if (response.status === 401) {
      removeAuthToken();
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return { success: true, data: await response.text() };
  },

  getStats: async () => {
    return AdminAPI.request('/stats');
  },

  getUsers: async () => {
    return AdminAPI.request('/users');
  },

  getBookings: async () => {
    return AdminAPI.request('/bookings');
  },

  getRooms: async () => {
    return AdminAPI.request('/rooms');
  },

  getTables: async () => {
    return AdminAPI.request('/tables');
  },

  getTableStructure: async (tableName) => {
    return AdminAPI.request(`/table/${tableName}`);
  },

  executeQuery: async (query) => {
    return AdminAPI.request('/query', {
      method: 'POST',
      body: { query }
    });
  },

  cancelBooking: async (bookingId, password) => {
    return AdminAPI.request(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: { password }
    });
  },

  createUser: async (userData) => {
    return AdminAPI.request('/users', {
      method: 'POST',
      body: userData
    });
  },

  createBooking: async (bookingData) => {
    return AdminAPI.request('/bookings', {
      method: 'POST',
      body: bookingData
    });
  },

  exportData: async (type, format = 'json') => {
    if (format === 'csv') {
      return AdminAPI.request(`/export/${type}?format=${format}`, {
        method: 'GET',
        responseType: 'blob'
      });
    } else {
      return AdminAPI.request(`/export/${type}?format=${format}`, {
        method: 'GET'
      });
    }
  },

  importData: async (type, data) => {
    return AdminAPI.request(`/import/${type}`, {
      method: 'POST',
      body: { data }
    });
  },

  updateRoom: async (roomId, roomData) => {
    return AdminAPI.request(`/rooms/${roomId}`, {
      method: 'PUT',
      body: roomData
    });
  },

  createRoom: async (roomData) => {
    return AdminAPI.request('/rooms', {
      method: 'POST',
      body: roomData
    });
  },

  deleteRoom: async (roomId) => {
    return AdminAPI.request(`/rooms/${roomId}`, {
      method: 'DELETE'
    });
  }
};

// Reviews API
const ReviewsAPI = {
  getByRoom: async (roomId, approvedOnly = true) => {
    return apiRequest(`/reviews/room/${roomId}?approved_only=${approvedOnly}`);
  },

  getAll: async (filters = {}) => {
    // For admin, get all reviews via AdminAPI
    const queryParams = new URLSearchParams(filters).toString();
    return AdminAPI.request(`/reviews${queryParams ? '?' + queryParams : ''}`);
  },

  create: async (reviewData) => {
    return apiRequest('/reviews', {
      method: 'POST',
      body: reviewData
    });
  },

  approve: async (reviewId, approved = true) => {
    return apiRequest(`/reviews/${reviewId}/approve`, {
      method: 'PATCH',
      body: { approved }
    });
  },

  delete: async (reviewId) => {
    return apiRequest(`/reviews/${reviewId}`, {
      method: 'DELETE'
    });
  },

  update: async (reviewId, reviewData) => {
    return apiRequest(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: reviewData
    });
  },

  getStats: async (roomId) => {
    return apiRequest(`/reviews/room/${roomId}/stats`);
  }
};

// Upload API
const UploadAPI = {
  uploadRoomImages: async (roomId, formData) => {
    const token = getAuthToken();
    const url = `${API_BASE_URL}/upload/rooms/${roomId}/images`;
    
    const config = {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
        // Don't set Content-Type - browser will set it with boundary for FormData
      },
      body: formData
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  },

  deleteRoomImage: async (roomId, imageUrl) => {
    return apiRequest(`/upload/rooms/${roomId}/images`, {
      method: 'DELETE',
      body: { imageUrl }
    });
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthAPI, RoomsAPI, BookingsAPI, PaymentsAPI, UsersAPI, AdminAPI, ReviewsAPI, UploadAPI };
}

// Make APIs available globally
if (typeof window !== 'undefined') {
  window.AuthAPI = AuthAPI;
  window.RoomsAPI = RoomsAPI;
  window.BookingsAPI = BookingsAPI;
  window.PaymentsAPI = PaymentsAPI;
  window.UsersAPI = UsersAPI;
  window.AdminAPI = AdminAPI;
  window.ReviewsAPI = ReviewsAPI;
  window.UploadAPI = UploadAPI;
}

