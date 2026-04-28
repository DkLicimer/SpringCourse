import React from "react";
import "./QuickActions.css";

const actions = [
  { icon: "bi-plus-circle", label: "Пополнить" },
  { icon: "bi-arrow-right-circle", label: "Перевести" },
  { icon: "bi-receipt", label: "Платёж" },
  { icon: "bi-download", label: "Выгрузить" },
];

export default function QuickActions() {
  return (
    <div className="quick-card">
      <div className="quick-title">Быстрые действия</div>
      <div className="quick-list">
        {actions.map((a, i) => (
          <div key={i} className="quick-item">
            <div className="quick-icon-wrap">
              <i className={`bi ${a.icon} quick-icon`}></i>
            </div>
            <span className="quick-label">{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}