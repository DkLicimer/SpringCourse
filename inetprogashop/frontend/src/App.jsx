import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import StorePage from './pages/StorePage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import { ShoppingCart, LogOut, ShieldCheck, Store } from 'lucide-react';
import { CartProvider } from './context/CartContext';
import { useCart } from './context/CartContext';
import OrdersPage from './pages/OrdersPage';

function Navigation() {
  const { user, logout, isAdmin } = useAuth();
  const { totalCount } = useCart();

   return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 mb-6">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2 text-indigo-600 font-black text-xl tracking-tight">
          <Store size={28} />
          <span>MY_SHOP</span>
        </Link>
        
        <div className="flex items-center space-x-8">
          <Link to="/" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Витрина</Link>
          
          {user ? (
            <>
              <Link to="/cart" className="relative group p-2 text-gray-600 hover:text-indigo-600 transition-all">
                <ShoppingCart size={24} />
                
                {totalCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in duration-300">
                    {totalCount}
                  </span>
                )}
              </Link>

              <Link to="/orders" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">История</Link>
              
              {isAdmin && (
                <Link to="/admin" className="flex items-center text-amber-600 font-bold hover:text-amber-700 transition-colors">
                  <ShieldCheck size={20} className="mr-1" />
                  Админ
                </Link>
              )}

              <div className="h-6 w-[1px] bg-gray-200"></div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 leading-none">{user.username}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">{isAdmin ? 'Administrator' : 'Customer'}</p>
                </div>
                <button 
                  onClick={logout} 
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium">Вход</Link>
              <Link to="/register" className="bg-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
                Регистрация
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Toaster position="bottom-right" reverseOrder={false} />
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

            <Route path="/orders" element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;