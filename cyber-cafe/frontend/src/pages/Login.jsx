import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await api.login(form);
      login(data);
      nav("/computers");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-card">
      <h3 className="title mb-4">Вход</h3>
      {error && <p className="error">{error}</p>}
      <form onSubmit={submit} className="d-flex flex-column gap-3">
        <input className="form-control" placeholder="Логин"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="form-control" type="password" placeholder="Пароль"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn btn-primary contact-btn">Войти</button>
      </form>
    </div>
  );
}