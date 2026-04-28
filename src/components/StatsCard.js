import React from "react";
import "./StatsCard.css";

export default function StatsCard({ icon, label, value, change, positive }) {
  return (
    <div className="stats-card">
        
      <div className="stats-card-top">
        
        <div className="stats-card-icon-wrap">
          <i className={`bi ${icon} stats-card-icon`}></i>
        </div>
        
      </div>
      <div className="stats-card-label">{label}</div>
      <div className="stats-card-value">{value}</div>
      
      <span className={`stats-card-change ${positive ? "positive" : "negative"}`}>
          {change}
        </span>
    </div>
  );
}

