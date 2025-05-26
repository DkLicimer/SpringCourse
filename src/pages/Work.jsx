import React, { useState, useEffect, useMemo } from 'react'; // Добавляем useMemo
import TaskList from '../components/TaskList';
import { getItem, setItem } from '../utils/localStorage';

const TASKS_STORAGE_KEY = 'employeeTasks';

// Константы для статусов фильтра
const FILTER_STATUSES = {
  ALL: 'all',
  ACTIVE: 'active',
  COMPLETED: 'completed',
};


function Work() {
  const [tasks, setTasks] = useState(() => {
    const storedTasks = getItem(TASKS_STORAGE_KEY);
    return storedTasks || [];
  });

  const [newTaskText, setNewTaskText] = useState('');

  // --- Новое состояние для текущего фильтра ---
  const [filterStatus, setFilterStatus] = useState(FILTER_STATUSES.ALL);
  // --------------------------------------------

  // Эффект для сохранения задач в Local Storage при каждом изменении массива tasks
  useEffect(() => {
    setItem(TASKS_STORAGE_KEY, tasks);
    console.log('Список задач сохранен в Local Storage');
  }, [tasks]);

  // Обработчик добавления новой задачи
  const handleAddTask = (e) => {
    e.preventDefault();

    if (newTaskText.trim() === '') {
      return;
    }

    const newTaskId = Date.now();
    const newTask = {
      id: newTaskId,
      text: newTaskText.trim(),
      completed: false,
    };

    setTasks([...tasks, newTask]);
    setNewTaskText('');
  };

  // Обработчик переключения статуса задачи
  const handleToggleTaskComplete = (taskId) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
  };

  // Обработчик удаления задачи
  const handleDeleteTask = (taskId) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
  };

  // --- Логика фильтрации ---
  // Используем useMemo для оптимизации: пересчитываем только при изменении tasks или filterStatus
  const filteredTasks = useMemo(() => {
    switch (filterStatus) {
      case FILTER_STATUSES.ACTIVE:
        return tasks.filter(task => !task.completed);
      case FILTER_STATUSES.COMPLETED:
        return tasks.filter(task => task.completed);
      case FILTER_STATUSES.ALL:
      default:
        return tasks; // По умолчанию или для 'all' возвращаем все задачи
    }
  }, [tasks, filterStatus]); // Зависимости useMemo
  // --------------------------


  return (
    <div className="container">
      <h1>Мои Задачи</h1>

      {/* Форма для добавления новой задачи (без изменений) */}
      <form className="mb-4" onSubmit={handleAddTask}>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Новая задача..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            aria-label="Новая задача"
          />
          <button
            className="btn btn-primary"
            type="submit"
          >
            Добавить
          </button>
        </div>
      </form>

      {/* --- Кнопки фильтрации --- */}
      <div className="mb-3">
        <div className="btn-group" role="group" aria-label="Фильтр задач">
          <button
            type="button"
            className={`btn ${filterStatus === FILTER_STATUSES.ALL ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatus(FILTER_STATUSES.ALL)}
          >
            Все ({tasks.length}) {/* Показываем общее количество задач */}
          </button>
          <button
            type="button"
            className={`btn ${filterStatus === FILTER_STATUSES.ACTIVE ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatus(FILTER_STATUSES.ACTIVE)}
          >
            Активные ({tasks.filter(task => !task.completed).length}) {/* Показываем количество активных */}
          </button>
          <button
            type="button"
            className={`btn ${filterStatus === FILTER_STATUSES.COMPLETED ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatus(FILTER_STATUSES.COMPLETED)}
          >
            Выполненные ({tasks.filter(task => task.completed).length}) {/* Показываем количество выполненных */}
          </button>
        </div>
      </div>
      {/* ------------------------- */}


      {/* Рендерим список задач, передавая ОТФИЛЬТРОВАННЫЙ массив */}
      <TaskList
        tasks={filteredTasks} // ПЕРЕДАЕМ ОТФИЛЬТРОВАННЫЙ СПИСОК!
        onToggleComplete={handleToggleTaskComplete}
        onDelete={handleDeleteTask}
      />

    </div>
  );
}

export default Work;