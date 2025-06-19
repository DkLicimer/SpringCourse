// Получение данных из Local Storage с автоматическим парсингом JSON
export const getItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    // Если элемент существует, пытаемся его распарсить как JSON
    // Если не JSON или null/undefined, возвращаем как есть
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error getting item "${key}" from localStorage:`, error);
    return null; // В случае ошибки чтения или парсинга
  }
};

// Сохранение данных в Local Storage с автоматическим преобразованием в JSON
export const setItem = (key, value) => {
  try {
    // Преобразуем любое значение в строку JSON перед сохранением
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item "${key}" in localStorage:`, error);
  }
};

// Удаление данных из Local Storage
export const removeItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item "${key}" from localStorage:`, error);
  }
};