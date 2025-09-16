import { useState } from "react";
import { Link } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await fetch('/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || '登录失败');
    // 成功
    localStorage.setItem('token', data.token);
    alert('登录成功！token 已保存');
    // 跳转到首页或控制台
    window.location.href = '/';   // 或者用 navigate('/') 如果你用 useNavigate
  } catch (err) {
    alert(err.message);
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
          placeholder="you@example.com"
          value={form.email}
          onChange={onChange}
          required
        />

        <label htmlFor="password" style={{ marginTop: 8 }}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={onChange}
          required
        />

        <button
          type="submit"
          className="btn btn-primary"
          style={{ marginTop: 12 }}
        >
          Log In
        </button>
      </form>

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
