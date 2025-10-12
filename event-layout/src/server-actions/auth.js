// Authentication API Actions with Fake Data
// TODO: Replace fake authentication with real API when backend is ready

const FAKE_USER = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin'
};

const FAKE_TOKEN = 'fake-jwt-token-' + Date.now();

// Simulated delay for API calls
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Login with username and password
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} Login result with token
 */
export async function login(username, password) {
  await delay();

  // Fake authentication: accept admin/admin
  if (username === 'admin' && password === 'admin') {
    const token = FAKE_TOKEN;
    const user = { ...FAKE_USER };

    // Store token in localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));

    console.log('Login successful:', username);
    return {
      success: true,
      data: {
        token,
        user
      }
    };
  }

  return {
    success: false,
    error: 'Invalid credentials. Use admin/admin for fake login.'
  };
}

/**
 * Logout current user
 * @returns {Promise<Object>} Logout result
 */
export async function logout() {
  await delay();

  // Clear stored authentication
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');

  console.log('Logout successful');
  return { success: true };
}

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Registration result
 */
export async function register(userData) {
  await delay();

  console.log('Registering user:', userData.username);

  // Fake registration - auto-login after register
  const token = FAKE_TOKEN;
  const user = {
    id: Math.floor(Math.random() * 1000) + 2,
    username: userData.username,
    email: userData.email,
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    role: 'user'
  };

  // Store token in localStorage
  localStorage.setItem('authToken', token);
  localStorage.setItem('user', JSON.stringify(user));

  return {
    success: true,
    data: {
      token,
      user
    }
  };
}

/**
 * Get current user profile
 * @returns {Promise<Object>} User profile
 */
export async function getCurrentUser() {
  await delay();

  const token = localStorage.getItem('authToken');
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
 * Update user profile
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object>} Updated user
 */
export async function updateProfile(updates) {
  await delay();

  const userStr = localStorage.getItem('user');
  if (!userStr) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const user = JSON.parse(userStr);
    const updatedUser = { ...user, ...updates };
    localStorage.setItem('user', JSON.stringify(updatedUser));

    console.log('Profile updated:', updatedUser);
    return { success: true, data: updatedUser };
  } catch (e) {
    return { success: false, error: 'Failed to update profile' };
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export function isAuthenticated() {
  const token = localStorage.getItem('authToken');
  return !!token;
}

/**
 * Get stored auth token
 * @returns {string|null} Auth token
 */
export function getAuthToken() {
  return localStorage.getItem('authToken');
}

/**
 * Verify token validity
 * @returns {Promise<Object>} Verification result
 */
export async function verifyToken() {
  await delay();

  const token = getAuthToken();
  if (!token) {
    return { success: false, error: 'No token found' };
  }

  // In fake implementation, all tokens are valid
  return { success: true, data: { valid: true } };
}

/**
 * Change password
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Change result
 */
export async function changePassword(oldPassword, newPassword) {
  await delay();

  console.log('Password change requested (fake implementation)');

  // In fake implementation, always succeed
  return { success: true, message: 'Password changed successfully (fake)' };
}
