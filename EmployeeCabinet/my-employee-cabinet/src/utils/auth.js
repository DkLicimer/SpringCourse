import { getItem, setItem, removeItem } from './localStorage';

const USER_STORAGE_KEY = 'employeeCabinetUser'; // Ключ в Local Storage

// --- Предопределенные учетные данные для имитации ---
const EXPECTED_USERNAME = 'test'; // Замените на желаемый логин
const EXPECTED_PASSWORD = '1234'; // Замените на желаемый пароль
// ---------------------------------------------------

// Имитация "входа"
export const login = (username, password) => {
  // --- Новая логика проверки ---
  if (username === EXPECTED_USERNAME && password === EXPECTED_PASSWORD) {
    // Если учетные данные верны, сохраняем данные пользователя
    const userData = {
      username: username,
      isLoggedIn: true,
      profile: {
        name: username || 'Сотрудник',
        position: 'Стажер',
        department: 'Общий',
        status: 'Работает',
        email: '',
        phone: '',
        address: '',
        photoUrl: '',
      }
    };
    setItem(USER_STORAGE_KEY, userData);
    console.log('Имитация входа успешна для пользователя:', username);
    return userData; // Возвращаем данные пользователя при успехе
  } else {
    // Если учетные данные неверны
    console.warn('Попытка входа с неверными учетными данными:', username);
    // Не сохраняем в Local Storage и возвращаем null или false
    return null; // Возвращаем null при неудаче
  }
  // -----------------------------
};

// ... остальной код (logout, isLoggedIn, getCurrentUser, updateCurrentUser) без изменений
export const logout = () => {
  removeItem(USER_STORAGE_KEY);
  console.log('Имитация выхода');
};

export const isLoggedIn = () => {
  const user = getItem(USER_STORAGE_KEY);
  return user && user.isLoggedIn === true;
};

export const getCurrentUser = () => {
    return getItem(USER_STORAGE_KEY);
};

export const updateCurrentUser = (newData) => {
    const currentUser = getCurrentUser();
    if (currentUser) {
        const updatedUser = {
            ...currentUser,
            profile: {
                ...currentUser.profile,
                ...newData.profile,
            }
        };
        setItem(USER_STORAGE_KEY, updatedUser);
        console.log('Данные пользователя обновлены в Local Storage', updatedUser);
        return updatedUser;
    }
    return null;
};