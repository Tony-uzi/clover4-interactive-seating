import { useState } from "react";
import { Link } from "react-router-dom";

const FAKE_USERNAME = "admin";
const FAKE_PASSWORD = "admin";
const TOKEN_STORAGE_KEY = "planner_auth_token";
const USER_STORAGE_KEY = "planner_auth_user";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    const username = form.email.trim().toLowerCase();
    const password = form.password;

    if (username === FAKE_USERNAME && password === FAKE_PASSWORD) {
      const token = `fake-admin-token-${Date.now().toString(36)}`;
      const payload = {
        username: FAKE_USERNAME,
        issuedAt: new Date().toISOString()
      };
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(payload));
      alert("Logged in successfully. Demo token issued.");
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      window.location.href = redirect || "/conference-planner";
      return;
    }

    setError("Invalid credentials. Use admin / admin to access the demo.");
    setLoading(false);
  };

  return (
    <section className="page auth">
      <h1>Log In</h1>

      <form className="form-card" onSubmit={onSubmit}>
        <label htmlFor="email">Username</label>
        <input
          id="email"
          name="email"
          type="text"
          placeholder="admin"
          value={form.email}
          onChange={onChange}
          autoComplete="username"
          required
        />

        <label htmlFor="password" style={{ marginTop: 8 }}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="admin"
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

      <div
        style={{
          marginTop: 16,
          fontSize: 13,
          color: "#64748b",
          background: "#f8fafc",
          padding: "12px 16px",
          borderRadius: 8
        }}
      >
        Demo access only: enter <strong>admin</strong> as both username and password to receive a fake token stored in
        local storage for later use.
      </div>

      <div className="alt-actions" style={{ marginTop: 12 }}>
        <button
          type="button"
          className="btn"
          onClick={() => alert("TODO: Google OAuth")}
        >
          <i className="fab fa-google" /> &nbsp;Continue with Google
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => alert("TODO: SSO")}
        >
          <i className="fas fa-user" /> &nbsp;Single Sign-On
        </button>
      </div>

      <p style={{ marginTop: 12 }}>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </section>
  );
}
