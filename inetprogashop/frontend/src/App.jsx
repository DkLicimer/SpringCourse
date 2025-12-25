import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import StorePage from './pages/StorePage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';

function App() {
  return (
    <Router>
      <nav className="bg-white shadow-sm py-4 mb-6 flex justify-center space-x-6">
        <Link to="/" className="hover:text-indigo-600">Витрина</Link>
        {localStorage.getItem('token') ? (
          <>
            <Link to="/cart" className="hover:text-indigo-600">Корзина</Link>
            <button onClick={() => {localStorage.clear(); window.location.reload();}} className="text-red-500">Выйти</button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-indigo-600">Вход</Link>
            <Link to="/register" className="hover:text-indigo-600">Регистрация</Link>
          </>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<StorePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cart" element={<CartPage />} />
      </Routes>
    </Router>
  );
}

export default App;