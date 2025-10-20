import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
        alert('✅ Sign up success! Please log in.');
        navigate('/login');
      } else {
        setError(result.error || 'Registration failed');
        setLoading(false);
      }
    } catch (err) {
      setError('Network error. Please check if the backend is running.');
      setLoading(false);
    }
  };
  return (
    <section className="auth">
      <h1>Create an Account</h1>

      <form className="form-card" onSubmit={onSubmit}>
        <div>
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            name="name"
            placeholder="Your name"
            value={form.name}
            onChange={onChange}
            required
          />
        </div>

        <div>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={onChange}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={onChange}
            required
            minLength={8}
          />
        </div>

        <div>
          <label htmlFor="confirm">Confirm Password</label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            placeholder="Re-enter your password"
            value={form.confirm}
            onChange={onChange}
            required
            minLength={8}
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <p style={{ marginTop: 24, textAlign: 'center', color: '#64748b' }}>
        Already have an account? <Link to="/login" style={{ color: '#667eea', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
      </p>
    </section>
  );
}
