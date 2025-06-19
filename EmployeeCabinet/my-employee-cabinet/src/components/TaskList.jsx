import React from 'react';
import TaskItem from './TaskItem'; // Импортируем компонент отдельной задачи

// Компонент для отображения списка задач
function TaskList({ tasks, onToggleComplete, onDelete }) {
  // tasks: массив объектов задач
  // onToggleComplete, onDelete: функции-обработчики, переданные от родителя

  if (!tasks || tasks.length === 0) {
    return <p>Задач пока нет. Добавьте первую!</p>;
  }

  return (
    // Используем Bootstrap List Group
    <ul className="list-group mt-4">
      {/* Перебираем массив задач и рендерим TaskItem для каждой */}
      {tasks.map(task => (
        <TaskItem
          key={task.id} // Уникальный ключ важен для React при рендеринге списков
          task={task}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

export default TaskList;