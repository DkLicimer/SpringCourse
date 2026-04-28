import React from "react";
import { useLocation } from "react-router-dom";
import "./Header.css";
import avatar from '../assets/avatar.png';

export default function Header() {
    const location = useLocation();

    let currentTitle = "АБС BankCorp";
    if (location.pathname === "/clients" || location.pathname === "/") {
        currentTitle = "Единая база клиентов";
    } else if (location.pathname.includes("/accounts") || location.pathname.includes("/cards")) {
        currentTitle = "Оформленные продукты клиента";
    } else if (location.pathname.includes("/transactions")) {
        currentTitle = "Реестр операций";
    } else if (location.pathname.includes("/client/")) {
        currentTitle = "Карточка клиента";
    } else if (location.pathname.startsWith("/reports")) {
        currentTitle = "Внутренняя отчетность";
    }

    return (
        <header className="header">
            <div className="header-left">
                <h1 className="header-title">{currentTitle}</h1>
            </div>
            <div className="header-right">
                <span className="header-username">Менеджер: Иван Иванов</span>
                <div className="header-avatar">
                    <img src={avatar} alt="Аватар" className="header-avatar-img" />
                </div>
            </div>
        </header>
    );
}