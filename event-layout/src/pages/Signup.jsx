import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });


const onSubmit = async (e) => {
  e.preventDefault();
  if (form.password !== form.confirm) {
    alert('Passwords do not match.');
    return;
  }
  try {
    const res = await fetch('/api/auth/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'fail');
    alert('sign up success');
    nav('/home');
  } catch (err) {
    alert(err.message);
  }
};
  return (
    <section className="page auth">
      <h1>Create an Account</h1>

      <form className="form-card" onSubmit={onSubmit}>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          placeholder="Your name"
          value={form.name}
          onChange={onChange}
          required
        />

        <label htmlFor="email" style={{ marginTop: 8 }}>
          Email
        </label>
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
          placeholder="At least 8 characters"
          value={form.password}
          onChange={onChange}
          required
          minLength={8}
        />

        <label htmlFor="confirm" style={{ marginTop: 8 }}>
          Confirm Password
        </label>
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

        <button
          type="submit"
          className="btn btn-primary"
          style={{ marginTop: 12 }}
        >
          Sign Up
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}
