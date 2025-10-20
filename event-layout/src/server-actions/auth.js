// Authentication API Actions - Connected to Real Backend
// 认证API 负责用户登录、注册、token管理

/*在前端集中管理“登录/注册/登出/Token 存取/鉴权头拼装/本地用户态读取”这些通用动作。

给其它业务 API 提供稳定、统一的接口形态：{ success, data | error }，以便页面直接消费。

让页面刷新后仍能保持登录态（通过 localStorage 持久化）
 */

/*C. 登录流程详解

```
用户输入 → login(email, password) → fetch('/api/auth/login/')
    ↓
发送请求：
{
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
}
    ↓
后端 Django 处理：
- views_auth.py 的 login() 函数
- 验证邮箱和密码
- 生成 JWT token（authentication.py）
    ↓
返回响应：
{
  "token": "eyJhbGc...",
  "user": {
    "id": 11,
    "name": "Tony"
  }
}
    ↓
前端处理：
- localStorage.setItem('token', data.token)
- localStorage.setItem('user', JSON.stringify(data.user))
- 返回 { success: true, data: {...} }
``` */

/**
 * Get stored auth token
 * returns {string 或 null} Auth token
 * 从 localStorage 取出登录后保存的 token（可能返回 string 或 null）
 */
export function getAuthToken() {
  return localStorage.getItem('token');
}

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 * 只要能取到非空字符串，就认为“已登录”
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
 * 发送 POST /api/auth/login/，传入邮箱和密码
 * 解析响应为 JSON。成功则保存 token 到 localStorage，失败返回错误信息。
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

  // Token存在即视为有效（实际验证由后端处理）
  return { success: true, data: { valid: true } };
}
