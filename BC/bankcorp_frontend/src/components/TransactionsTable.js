import React from "react";
import "./TransactionsTable.css";

const transactions = [
  {
    id: "#00123",
    name: "Зарплата",
    category: "Доход",
    date: "01.06.2025",
    amount: "+38 200 ₽",
    positive: true,
  },
  {
    id: "#00124",
    name: "Продукты",
    category: "Расход",
    date: "02.06.2025",
    amount: "-3 400 ₽",
    positive: false,
  },
  {
    id: "#00125",
    name: "Аренда",
    category: "Расход",
    date: "03.06.2025",
    amount: "-18 000 ₽",
    positive: false,
  },
  {
    id: "#00126",
    name: "Фриланс",
    category: "Доход",
    date: "04.06.2025",
    amount: "+12 000 ₽",
    positive: true,
  },
  {
    id: "#00127",
    name: "Кафе",
    category: "Расход",
    date: "05.06.2025",
    amount: "-1 200 ₽",
    positive: false,
  },
];

export default function TransactionsTable() {
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
        </tbody>
      </table>
    </div>
  );
}