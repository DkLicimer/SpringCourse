import { BrowserRouter, Routes, Route, Navigate, NavLink, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Computers from "./pages/Computers";
import MyBookings from "./pages/MyBookings";
import Admin from "./pages/Admin";
import "./app.css";

function PrivateRoute({ children, adminOnly = false }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/" />;
  return children;
}

function Header() {
  const { user, isAdmin, logout } = useAuth();
  return (
    <header className="header py-3">
      <nav className="main_nav">

        <div className="nav-left">
          <Link to="/" className="a_logo">CyberCafe</Link>
        </div>

        <div className="nav-center">
          <NavLink
            to="/computers"
            className={({ isActive }) => isActive ? "menu_item active" : "menu_item"}
          >
            Компьютеры
          </NavLink>
          {user && (
            <NavLink
              to="/my-bookings"
              className={({ isActive }) => isActive ? "main-menu-link active" : "main-menu-link"}
            >
              Мои брони
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => isActive ? "main-menu-link active" : "main-menu-link"}
            >
              Админ-панель
            </NavLink>
          )}
        </div>

        <div className="nav-right">
          {user ? (
            <>
              <span className="text-white">{user.username} ({user.role})</span>
              <button className="btn btn-primary contact-btn" onClick={logout}>Выйти</button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              >
                Вход
              </NavLink>
              <Link to="/register" className="btn btn-primary contact-btn">Регистрация</Link>
            </>
          )}
        </div>

      </nav>
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <main className="container py-5">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/computers" element={<Computers />} />
            <Route path="/my-bookings" element={
              <PrivateRoute><MyBookings /></PrivateRoute>
            } />
            <Route path="/admin" element={
              <PrivateRoute adminOnly><Admin /></PrivateRoute>
            } />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}