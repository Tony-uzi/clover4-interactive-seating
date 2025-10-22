// Authentication API Actions - Connected to Real Backend
// Authentication API - wired to the live backend

/**
 * Get stored auth token
 * @returns {string|null} Auth token
 */
export function getAuthToken() {
  return localStorage.getItem('token');
}

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export function isAuthenticated() {
  const token = getAuthToken();
  return !!token;
}

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - Password
 * @returns {Promise<Object>} Login result with token
 */
export async function login(email, password) {
  try {
    const response = await fetch('/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || 'Login failed'
      };
    }

    // Store token in localStorage
    localStorage.setItem('token', data.token);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    console.log('Login successful:', email);
    return {
      success: true,
      data: {
        token: data.token,
        user: data.user
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
}

/**
 * Logout current user
 * @returns {Promise<Object>} Logout result
 */
export async function logout() {
  // Clear stored authentication
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  console.log('Logout successful');
  return { success: true };
}

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's name
 * @param {string} userData.email - User's email
 * @param {string} userData.password - User's password
 * @returns {Promise<Object>} Registration result
 */
export async function register(userData) {
  try {
    const response = await fetch('/api/auth/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        password: userData.password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || 'Registration failed'
      };
    }

    console.log('Registration successful:', userData.email);
    return {
      success: true,
      data: {
        id: data.id,
        name: data.name
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
}

/**
 * Get current user profile from localStorage
 * @returns {Promise<Object>} User profile
 */
export async function getCurrentUser() {
  const token = getAuthToken();
  const userStr = localStorage.getItem('user');

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      return { success: true, data: user };
    } catch (e) {
      return { success: false, error: 'Invalid user data' };
    }
  }

  return { success: false, error: 'Not authenticated' };
}

/**
 * Verify token validity (checks if token exists)
 * @returns {Promise<Object>} Verification result
 */
export async function verifyToken() {
  const token = getAuthToken();
  if (!token) {
    return { success: false, error: 'No token found' };
  }

  // Consider the token valid if it exists; backend handles real validation
  return { success: true, data: { valid: true } };
}
