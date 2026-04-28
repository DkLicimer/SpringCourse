import React from "react";
import { NavLink } from "react-router-dom"; // Импортируем компонент для ссылок
import "./Sidebar.css";

// Добавили пути (path) для каждой страницы
const menuItems = [
    { path: "/", icon: "bi-house-door", label: "Главная" },
    { path: "/clients", icon: "bi-people", label: "Клиенты" },
    { path: "/accounts", icon: "bi-wallet2", label: "Счета" },
    { path: "/cards", icon: "bi-credit-card", label: "Карты" },
    { path: "/transactions", icon: "bi-arrow-left-right", label: "Транзакции" },
    { path: "/reports", icon: "bi-bar-chart", label: "Отчёты" },
];

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <i className="bi bi-bank sidebar-logo-icon"></i>
                <span className="sidebar-logo-text">BankCorp</span>
            </div>
            <nav className="sidebar-nav">
                {menuItems.map((item, i) => (
                    <NavLink
                        key={i}
                        to={item.path}
                        // NavLink автоматически дает класс 'active', если путь совпадает
                        className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
                        style={{ textDecoration: 'none' }} // Убираем подчеркивание ссылок
                    >
                        <i className={`bi ${item.icon} sidebar-nav-icon`}></i>
                        <span className="sidebar-nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}