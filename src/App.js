import React from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatsCard from "./components/StatsCard";
import QuickActions from "./components/QuickActions";
import TransactionsTable from "./components/TransactionsTable";

const stats = [
  {
    icon: "bi-wallet2",
    label: "Баланс",
    value: "124 530 ₽",
    change: "+2.4%",
    positive: true,
  },
  {
    icon: "bi-arrow-down-circle",
    label: "Доходы",
    value: "38 200 ₽",
    change: "+5.1%",
    positive: true,
  },
  {
    icon: "bi-arrow-up-circle",
    label: "Расходы",
    value: "14 870 ₽",
    change: "-1.3%",
    positive: false,
  },
  {
    icon: "bi-piggy-bank",
    label: "Накопления",
    value: "52 000 ₽",
    change: "+8.0%",
    positive: true,
  },
];

export default function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="page-body">
          <div className="stats-grid">
            {stats.map((s, i) => (
              <StatsCard key={i} {...s} />
            ))}
          </div>
          <div className="bottom-section">
            <QuickActions />
            <TransactionsTable />
          </div>
        </div>
      </div>
    </div>
  );
}