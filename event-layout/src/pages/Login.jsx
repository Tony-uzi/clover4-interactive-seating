import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as AuthAPI from "../server-actions/auth";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const result = await AuthAPI.login(form.email, form.password);
      
      if (result.success) {
        // 登录成功
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");
        navigate(redirect || "/conference");
      } else {
        // 登录失败
        setError(result.error || "Invalid credentials");
        setLoading(false);
      }
    } catch (err) {
      setError("Network error. Please check if the backend is running.");
      setLoading(false);
    }
  };

  return (
    <section className="auth">
      <h1>Welcome Back</h1>

      <form className="form-card" onSubmit={onSubmit}>
        <div>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            value={form.email}
            onChange={onChange}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={onChange}
            autoComplete="current-password"
            required
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
          {loading ? "Signing in..." : "Log In"}
        </button>
      </form>

      <p style={{ marginTop: 24, textAlign: 'center', color: '#64748b' }}>
        Don't have an account? <Link to="/signup" style={{ color: '#667eea', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
      </p>
    </section>
  );
}
