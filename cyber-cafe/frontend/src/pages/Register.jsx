import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await api.register(form);
      login(data);
      nav("/computers");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-card">
      <h3 className="title mb-4">Регистрация</h3>
      {error && <p className="error">{error}</p>}
      <form onSubmit={submit} className="d-flex flex-column gap-3">
        <input className="form-control" placeholder="Логин"
          onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="form-control" placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="form-control" type="password" placeholder="Пароль"
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn btn-primary contact-btn">Зарегистрироваться</button>
      </form>
    </div>
  );
}