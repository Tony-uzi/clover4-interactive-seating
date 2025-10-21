import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiUser, FiAlertCircle, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import * as AuthAPI from "../server-actions/auth";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const result = await AuthAPI.register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.error || 'Registration failed');
        setLoading(false);
      }
    } catch (err) {
      setError('Network error. Please check if the backend is running.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <FiCheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Account Created Successfully!
            </h2>
            <p className="text-gray-600 mb-4">
              Redirecting you to login page...
            </p>
            <div className="inline-block">
              <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">🍀</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create an Account
          </h1>
          <p className="text-gray-600">
            Join Clover 4 and start planning amazing events
          </p>
        </div>

        {/* Signup form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Name field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={onChange}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={onChange}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={onChange}
                  required
                  minLength={8}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Confirm password field */}
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  placeholder="Re-enter your password"
                  value={form.confirm}
                  onChange={onChange}
                  required
                  minLength={8}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <FiArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-semibold text-green-600 hover:text-green-700 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Additional info */}
        <p className="text-center text-sm text-gray-500 mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
