import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import ClientsPage from "./pages/ClientsPage";
import CardsPage from "./pages/CardsPage";
import TransactionsPage from "./pages/TransactionsPage";
import ReportsPage from "./pages/ReportsPage";

export default function App() {
    return (
        <Router>
            <div className="app-layout">
                <Sidebar />
                <div className="main-content">
                    <Header />
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/clients" element={<ClientsPage />} />
                        {/* Разделы "Счета" и "Карты" пока ведут на одну страницу для наглядности */}
                        <Route path="/accounts" element={<CardsPage />} />
                        <Route path="/cards" element={<CardsPage />} />
                        <Route path="/transactions" element={<TransactionsPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}