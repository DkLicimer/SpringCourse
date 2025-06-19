import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isLoggedIn, logout } from '../utils/auth';

function AppNavbar() {
  const authenticated = isLoggedIn();
  const navigate = useNavigate();
  const location = useLocation();

  if (!authenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    // Добавляем fixed-top и меняем bg-dark на bg-danger (или bg-primary, в зависимости от оттенка красного)
    // navbar-dark оставляет текст белым, что подходит для темного/красного фона
    <nav className="navbar navbar-expand-lg navbar-dark bg-danger fixed-top"> {/* bg-danger - красный фон, fixed-top - фиксация */}
      <div className="container-fluid">
        <Link className="navbar-brand" to="/dashboard">
          Личный Кабинет
        </Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} aria-current={location.pathname === '/dashboard' ? 'page' : undefined} to="/dashboard">Главная</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${location.pathname === '/work' ? 'active' : ''}`} aria-current={location.pathname === '/work' ? 'page' : undefined} to="/work">Работа</Link>
            </li>
            <li className="nav-item">
               <Link className={`nav-link ${location.pathname === '/help' ? 'active' : ''}`} aria-current={location.pathname === '/help' ? 'page' : undefined} to="/help">Справка</Link>
             </li>
          </ul>

          <ul className="navbar-nav mb-2 mb-lg-0">
             <li className="nav-item">
               {/* Используем btn-outline-light для белой кнопки с красным контуром на красном фоне */}
               <button className="btn btn-outline-light" onClick={handleLogout}>
                 Выйти
               </button>
             </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default AppNavbar;