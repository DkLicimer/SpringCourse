import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  return (
    <>
      <h1>Exersice 1</h1>
      <h3>Список пользователей</h3>
      {/* Компонент UsersComponent */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Имя</th>
            <th>Email</th>
            <th>Город</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Иван Иванов</td>
            <td>ivan@example.com</td>
            <td>Москва</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Анна Смирнова</td>
            <td>anna@example.com</td>
            <td>Чита</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

export default App;
