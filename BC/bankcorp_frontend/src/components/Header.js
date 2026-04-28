import React from "react";
import { useLocation } from "react-router-dom"; // Хук для получения текущего URL
import "./Header.css";
import avatar from '../assets/avatar.png';

// Словарь заголовков для каждого пути
const pageTitles = {
    "/": "Главная страница",
    "/clients": "Управление клиентами",
    "/accounts": "Счета и балансы",
    "/cards": "Банковские карты",
    "/transactions": "История транзакций",
    "/reports": "Аналитика и отчёты"
};

export default function Header() {
    const location = useLocation();
    const currentTitle = pageTitles[location.pathname] || "BankCorp";

    return (
        <header className="header">
            <div className="header-left">
                <h1 className="header-title">{currentTitle}</h1>
            </div>
            <div className="header-right">
                <span className="header-username">Иван Иванов</span>
                <div className="header-avatar">
                    <img src={avatar} alt="Аватар" className="header-avatar-img" />
                </div>
            </div>
        </header>
    );
}