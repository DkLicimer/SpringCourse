import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import StorePage from './pages/StorePage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import ProtectedRoute from './components/ProtectedRoute';

function Navigation() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <nav className="bg-white shadow-sm py-4 mb-6 flex justify-center space-x-6 items-center">
      <Link to="/" className="hover:text-indigo-600 font-medium">Витрина</Link>
      
      {user ? (
        <>
          <Link to="/cart" className="hover:text-indigo-600 font-medium">Корзина</Link>
          {isAdmin && (
            <Link to="/admin" className="text-amber-600 font-bold hover:text-amber-700">Админ-панель</Link>
          )}
          <span className="text-gray-400">|</span>
          <span className="text-sm text-gray-600 italic">{user.username}</span>
          <button onClick={logout} className="text-red-500 hover:text-red-700 text-sm">Выйти</button>
        </>
      ) : (
        <>
          <Link to="/login" className="hover:text-indigo-600">Вход</Link>
          <Link to="/register" className="hover:text-indigo-600">Регистрация</Link>
        </>
      )}
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<StorePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Защищенные роуты */}
          <Route path="/cart" element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute adminOnly={true}>
              <AdminPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;