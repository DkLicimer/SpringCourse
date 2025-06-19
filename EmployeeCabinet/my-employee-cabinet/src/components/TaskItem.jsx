import React from 'react';

// Компонент для отображения одной задачи
function TaskItem({ task, onToggleComplete, onDelete }) {
  // task: { id, text, completed }
  // onToggleComplete: функция для переключения статуса задачи
  // onDelete: функция для удаления задачи

  return (
    // Используем Bootstrap List Group Item
    <li className={`list-group-item d-flex justify-content-between align-items-center ${task.completed ? 'list-group-item-success' : ''}`}>
      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggleComplete(task.id)} // При изменении чекбокса вызываем функцию родителя
          id={`task-${task.id}`} // Уникальный ID для чекбокса
        />
        <label
          className={`form-check-label ${task.completed ? 'text-decoration-line-through' : ''}`}
          htmlFor={`task-${task.id}`}
          style={{ cursor: 'pointer' }} // Чтобы было видно, что на текст можно кликать
        >
          {task.text}
        </label>
      </div>
      <button
        type="button"
        className="btn btn-danger btn-sm" // Bootstrap классы для маленькой красной кнопки
        onClick={() => onDelete(task.id)} // При клике на кнопку вызываем функцию родителя
      >
        Удалить
      </button>
    </li>
  );
}

export default TaskItem;