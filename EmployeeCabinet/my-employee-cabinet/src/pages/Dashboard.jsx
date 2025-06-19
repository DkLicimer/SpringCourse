import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser, updateCurrentUser } from '../utils/auth'; // Импортируем нужные функции

function Dashboard() {
  const navigate = useNavigate();
  // Используем состояние для хранения данных пользователя в компоненте
  const [user, setUser] = useState(getCurrentUser());
  // Состояние для управления режимом редактирования
  const [isEditing, setIsEditing] = useState(false);
  // Состояние для данных формы при редактировании (чтобы не изменять user напрямую до сохранения)
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    department: '',
    status: '',
    email: '',
    phone: '',
    address: '',
    photoUrl: '',
  });

  const [formErrors, setFormErrors] = useState({});


  // Эффект для загрузки данных пользователя при монтировании компонента
  // и установки их в состояние и форму
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser?.profile) {
      setUser(currentUser);
      // Инициализируем форму данными из профиля пользователя
      setFormData({
        name: currentUser.profile.name || '',
        position: currentUser.profile.position || '',
        department: currentUser.profile.department || '',
        status: currentUser.profile.status || '',
        email: currentUser.profile.email || '',
        phone: currentUser.profile.phone || '',
        address: currentUser.profile.address || '',
        photoUrl: currentUser.profile.photoUrl || '',
      });
    } else {
      // Если пользователя нет (хотя ProtectedRoute должен это предотвратить),
      // можно перенаправить на логин или показать ошибку
      navigate('/login');
    }
  }, [navigate]); // Зависимость от navigate

  // Обработчик изменения полей формы
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (formErrors[name]) {
         setFormErrors({
             ...formErrors,
             [name]: '',
         });
    }
  };

  // --- Функция валидации формы ---
  const validateForm = () => {
      const errors = {};
      // Пример базовой валидации:
      if (!formData.name.trim()) {
          errors.name = 'Имя обязательно для заполнения.';
      }
      if (!formData.position.trim()) {
          errors.position = 'Должность обязательна для заполнения.';
      }
       // Валидация Email (простой формат)
       if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Введите корректный Email.';
       }
       // Валидация Телефона (только цифры)
       if (formData.phone && !/^\d{11}$/.test(formData.phone)) {
            errors.phone = 'Номер телефона должен содержать только цифры.';
       }
       // Валидация URL фото (проверяем, что если не пусто, то похоже на URL)
       if (formData.photoUrl && !/^https?:\/\/.+\..+/.test(formData.photoUrl)) {
           errors.photoUrl = 'Введите корректный URL фото (начинается с http:// или https://).';
       }


      setFormErrors(errors); // Обновляем состояние ошибок
      // Возвращаем true, если ошибок нет, иначе false
      return Object.keys(errors).length === 0;
  };

  // Обработчик сохранения изменений
  const handleSave = () => {
    // --- Добавляем проверку валидации перед сохранением ---
    if (validateForm()) {
      // Если форма валидна, сохраняем
      const updatedUser = updateCurrentUser({ profile: formData });
      if (updatedUser) {
        setUser(updatedUser);
        setIsEditing(false);
        setFormErrors({}); // Очищаем ошибки после успешного сохранения
        console.log('Профиль обновлен');
      } else {
         console.error('Ошибка при сохранении профиля: пользователь не найден.');
      }
    } else {
        // Если форма невалидна, ошибки уже установлены в validateForm
        console.log('Форма содержит ошибки. Сохранение отменено.');
        // Можно добавить сообщение, что нужно исправить ошибки
    }
    // ----------------------------------------------------
  };

  // Обработчик отмены редактирования
  const handleCancel = () => {
    // Сбрасываем форму обратно на текущие данные пользователя
    if (user?.profile) {
        setFormData({
          name: user.profile.name || '',
          position: user.profile.position || '',
          department: user.profile.department || '',
          status: user.profile.status || '',
           // --- Сбрасываем новые поля ---
          email: user.profile.email || '',
          phone: user.profile.phone || '',
          address: user.profile.address || '',
          photoUrl: user.profile.photoUrl || '',
          // -----------------------------
        });
    }
    setIsEditing(false);
    setFormErrors({}); // Очищаем ошибки при отмене
  };

  // Обработчик выхода (без изменений)
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Отображение лоадера или заглушки пока user не загружен
  if (!user) {
      return <div className="container">Загрузка профиля...</div>;
  }


  return (
    <div className="container">
      <div className="row justify-content-between align-items-center mb-4">
        <div className="col">
          <h1>Личный Кабинет {user?.profile?.name ? `(${user.profile.name})` : ''}</h1>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Информация о сотруднике</div>
        <div className="card-body">
          {isEditing ? (
            // Режим редактирования: показываем форму
            <form>
              {/* --- Существующие поля --- */}
              <div className="mb-3">
                <label htmlFor="nameInput" className="form-label">Имя:</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.name ? 'is-invalid' : ''}`} 
                  id="nameInput"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
                 {/* Отображаем сообщение об ошибке */}
                {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
              </div>
               <div className="mb-3">
                <label htmlFor="positionInput" className="form-label">Должность:</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.position ? 'is-invalid' : ''}`}
                  id="positionInput"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                />
                 {formErrors.position && <div className="invalid-feedback">{formErrors.position}</div>}
              </div>
               <div className="mb-3">
                <label htmlFor="departmentInput" className="form-label">Отдел:</label>
                <input
                  type="text"
                  className="form-control" // Для этого поля валидация не добавлена, класс не нужен
                  id="departmentInput"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                />
              </div>
               <div className="mb-3">
                <label htmlFor="statusInput" className="form-label">Статус:</label>
                <input
                  type="text"
                  className="form-control" // Для этого поля валидация не добавлена
                  id="statusInput"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                />
              </div>

              {/* --- Новые поля для редактирования --- */}
               <div className="mb-3">
                 <label htmlFor="emailInput" className="form-label">Email:</label>
                 <input
                   type="email" // Используем type="email" для лучшей семантики и базовой валидации браузера
                   className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                   id="emailInput"
                   name="email"
                   value={formData.email}
                   onChange={handleInputChange}
                 />
                  {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
               </div>
                <div className="mb-3">
                  <label htmlFor="phoneInput" className="form-label">Телефон:</label>
                  <input
                    type="tel" // type="tel" для телефонов
                    className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
                    id="phoneInput"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                   {formErrors.phone && <div className="invalid-feedback">{formErrors.phone}</div>}
                </div>
                 <div className="mb-3">
                  <label htmlFor="addressInput" className="form-label">Адрес:</label>
                   <textarea // Можно использовать textarea для адреса
                     className="form-control"
                     id="addressInput"
                     name="address"
                     value={formData.address}
                     onChange={handleInputChange}
                     rows="3" // Указываем количество строк
                   ></textarea>
                </div>
                 <div className="mb-3">
                  <label htmlFor="photoUrlInput" className="form-label">URL Фото:</label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.photoUrl ? 'is-invalid' : ''}`}
                    id="photoUrlInput"
                    name="photoUrl"
                    value={formData.photoUrl}
                    onChange={handleInputChange}
                  />
                  {formErrors.photoUrl && <div className="invalid-feedback">{formErrors.photoUrl}</div>}
                </div>
               {/* --------------------------------- */}


              <button type="button" className="btn btn-primary me-2" onClick={handleSave}>
                Сохранить
              </button>
               <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Отмена
              </button>
            </form>
          ) : (
            // Режим просмотра: показываем данные
            <div>
               {/* --- Отображение фото, если URL есть --- */}
               {user?.profile?.photoUrl && (
                   <div className="mb-3 text-center">
                       <img
                           src={user.profile.photoUrl}
                           alt="Фото сотрудника"
                           className="img-thumbnail rounded-circle" // Bootstrap классы для стилизации фото
                           style={{ width: '150px', height: '150px', objectFit: 'cover' }} // Базовые стили
                           onError={(e) => { // Обработчик ошибки загрузки фото
                               e.target.onerror = null; // Предотвращаем бесконечный цикл ошибок
                               e.target.src = 'https://via.placeholder.com/150?text=Нет+фото'; // Заглушка при ошибке
                           }}
                       />
                   </div>
               )}

              {/* --- Существующие поля --- */}
              <p><strong>Имя:</strong> {user?.profile?.name || 'Не указано'}</p>
              <p><strong>Должность:</strong> {user?.profile?.position || 'Не указано'}</p>
              <p><strong>Отдел:</strong> {user?.profile?.department || 'Не указано'}</p>
              <p><strong>Статус:</strong> {user?.profile?.status || 'Не указано'}</p>
              <p><strong>Email:</strong> {user?.profile?.email || 'Не указано'}</p>
              <p><strong>Телефон:</strong> {user?.profile?.phone || 'Не указано'}</p>
              <p><strong>Адрес:</strong> {user?.profile?.address || 'Не указано'}</p>
              


              <button type="button" className="btn btn-secondary mt-3" onClick={() => setIsEditing(true)}>
                Редактировать Профиль
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default Dashboard;