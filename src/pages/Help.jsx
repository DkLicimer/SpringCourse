import React from 'react';
import { Link } from 'react-router-dom'; // Добавим Link для навигации обратно

function Help() {
  return (
    <div className="container">
      <h1>Справка по Личному Кабинету</h1>

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Добро пожаловать!</h5>
          <p className="card-text">
            Этот личный кабинет является учебным проектом, разработанным с использованием React, React Router и Bootstrap.
            Все данные хранятся локально в вашем браузере (в Local Storage) и не передаются на сервер.
          </p>

          <h6 className="card-subtitle mb-2 text-muted">Разделы кабинета:</h6>
          <ul>
            <li>
                <strong>Главная / Профиль:</strong> Здесь вы можете просмотреть и отредактировать основную информацию о себе. Изменения сохраняются сразу в вашем браузере.
            </li>
            <li>
                <strong>Работа:</strong> Этот раздел содержит список ваших задач. Вы можете добавлять новые задачи, отмечать их как выполненные и удалять. Список задач также сохраняется в Local Storage.
            </li>
            <li>
                <strong>Справка:</strong> Текущая страница с общей информацией о проекте.
            </li>
          </ul>

          <h6 className="card-subtitle mb-2 mt-4 text-muted">Особенности хранения данных:</h6>
          <p className="card-text">
            Обратите внимание, поскольку данные хранятся в Local Storage браузера, они доступны только на этом устройстве и в этом браузере. Очистка данных сайта или кэша браузера может привести к потере всех ваших данных (профиля, задач).
          </p>

          <hr/>

          <p>
            <Link to="/dashboard" className="btn btn-primary">Перейти на Главную</Link> {/* Кнопка для возврата */}
          </p>

        </div>
      </div>

    </div>
  );
}

export default Help;