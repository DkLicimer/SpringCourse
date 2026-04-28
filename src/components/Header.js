import React from "react";
import "./Header.css";
import avatar from '../assets/avatar.png';

export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">Главная страница</h1>
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