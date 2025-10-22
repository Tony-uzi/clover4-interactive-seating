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
        // On successful login, redirect to the home page (or honor redirect param)
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");
        navigate(redirect || "/");
      } else {
        // Login failed
        setError(result.error || "Invalid credentials");
        setLoading(false);
      }
    } catch (err) {
      setError("Network error. Please check if the backend is running.");
      setLoading(false);
    }
  };

  return (
    <section className="page auth">
      <h1>Log In</h1>

      <form className="form-card" onSubmit={onSubmit}>
        <label htmlFor="email">Email</label>
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

        <label htmlFor="password" style={{ marginTop: 8 }}>
          Password
        </label>
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

        {error && (
          <div
            style={{
              marginTop: 8,
              padding: "8px 12px",
              borderRadius: 6,
              background: "#fee2e2",
              color: "#b91c1c",
              fontSize: 13
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          style={{ marginTop: 12 }}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Log In"}
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </section>
  );
}
