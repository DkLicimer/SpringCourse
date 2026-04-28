import React, { useState, useEffect } from "react";
import "./TransactionsTable.css";

export default function TransactionsTable({ userId, refreshKey}) {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!userId) return;

    fetch(`http://localhost:8080/api/dashboard/${userId}/transactions`)
        .then((res) => res.json())
        .then((data) => setTransactions(data))
        .catch((err) => console.error("Ошибка загрузки транзакций:", err));
  }, [userId, refreshKey]);

  return (
      <div className="table-card">
        <div className="table-title">Последние операции</div>
        <table className="transactions-table">
          <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Категория</th>
            <th>Дата</th>
            <th>Сумма</th>
          </tr>
          </thead>
          <tbody>
          {transactions.map((t, i) => (
              <tr key={i}>
                <td className="td-id">{t.id}</td>
                <td>{t.name}</td>
                <td>
                <span className={`category-badge ${t.positive ? "income" : "expense"}`}>
                  {t.category}
                </span>
                </td>
                <td className="td-date">{t.date}</td>
                <td className={`td-amount ${t.positive ? "positive" : "negative"}`}>
                  {t.amount}
                </td>
              </tr>
          ))}
          {transactions.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>Загрузка...</td>
              </tr>
          )}
          </tbody>
        </table>
      </div>
  );
}