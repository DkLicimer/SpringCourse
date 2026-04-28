import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
    const location = useLocation();
    const match = location.pathname.match(/\/client\/(\d+)/);
    const clientId = match ? match[1] : null;

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <i className="bi bi-bank sidebar-logo-icon"></i>
                <span className="sidebar-logo-text">BankCorp</span>
            </div>
            <nav className="sidebar-nav">
                <NavLink to="/clients" className={({ isActive }) => `sidebar-nav-item ${isActive || location.pathname === "/" ? "active" : ""}`} style={{ textDecoration: 'none' }}>
                    <i className="bi bi-people sidebar-nav-icon"></i>
                    <span className="sidebar-nav-label">База клиентов</span>
                </NavLink>
                <NavLink to="/reports" className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`} style={{ textDecoration: 'none' }}>
                    <i className="bi bi-bar-chart sidebar-nav-icon"></i>
                    <span className="sidebar-nav-label">Аналитика банка</span>
                </NavLink>

                {clientId && (
                    <>
                        <div className="sidebar-divider">Управление клиентом</div>
                        <NavLink to={`/client/${clientId}`} end className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`} style={{ textDecoration: 'none' }}>
                            <i className="bi bi-person-badge sidebar-nav-icon"></i>
                            <span className="sidebar-nav-label">Сводка клиента</span>
                        </NavLink>
                        <NavLink to={`/client/${clientId}/accounts`} className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`} style={{ textDecoration: 'none' }}>
                            <i className="bi bi-wallet2 sidebar-nav-icon"></i>
                            <span className="sidebar-nav-label">Счета и продукты</span>
                        </NavLink>
                        <NavLink to={`/client/${clientId}/transactions`} className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`} style={{ textDecoration: 'none' }}>
                            <i className="bi bi-arrow-left-right sidebar-nav-icon"></i>
                            <span className="sidebar-nav-label">История операций</span>
                        </NavLink>
                    </>
                )}
            </nav>
        </aside>
    );
}

