import React from "react";
import "./Sidebar.css";

const menuItems = [
  { icon: "bi-house-door", label: "Главная", active: true },
  { icon: "bi-people",     label: "Клиенты", active: false },
  { icon: "bi-wallet2",    label: "Счета",   active: false },
  { icon: "bi-credit-card",label: "Карты",   active: false },
  { icon: "bi-arrow-left-right", label: "Транзакции", active: false },
  { icon: "bi-bar-chart",  label: "Отчёты",  active: false },
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
          <div
            key={i}
            className={`sidebar-nav-item ${item.active ? "active" : ""}`}
          >
            <i className={`bi ${item.icon} sidebar-nav-icon`}></i>
            <span className="sidebar-nav-label">{item.label}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
}