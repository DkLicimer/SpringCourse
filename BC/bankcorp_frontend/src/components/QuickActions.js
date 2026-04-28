import React from "react";
import "./QuickActions.css";

export default function QuickActions({ onActionClick }) {
    const actions = [
        { icon: "bi-plus-circle", label: "Внесение наличных", isIncome: true },
        { icon: "bi-receipt", label: "Платёж", isIncome: false },
        { icon: "bi-arrow-right-circle", label: "Перевести", isIncome: false },
    ];

    return (
        <div className="quick-card">
            <div className="quick-title">Кассовые операции</div>
            <div className="quick-list">
                {actions.map((a, i) => (
                    <div key={i} className="quick-item" onClick={() => onActionClick(a.isIncome)}>
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