import React, { useState, useEffect } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatsCard from "./components/StatsCard";
import QuickActions from "./components/QuickActions";
import TransactionsTable from "./components/TransactionsTable";

export default function App() {
  const [stats, setStats] = useState([]);
  const USER_ID = 1; // Запрашиваем данные для пользователя ID=1

  useEffect(() => {
    fetch(`http://localhost:8080/api/dashboard/${USER_ID}/stats`)
        .then((res) => res.json())
        .then((data) => setStats(data))
        .catch((err) => console.error("Ошибка загрузки статистики:", err));
  }, []);

  return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Header />
          <div className="page-body">
            <div className="stats-grid">
              {stats.length > 0 ? (
                  stats.map((s, i) => <StatsCard key={i} {...s} />)
              ) : (
                  <p>Загрузка данных...</p>
              )}
            </div>
            <div className="bottom-section">
              <QuickActions />
              <TransactionsTable userId={USER_ID} />
            </div>
          </div>
        </div>
      </div>
  );
}