const form = document.querySelector('.application-form');
const modal = document.getElementById('notification-modal');
const closeModalBtn = document.getElementById('close-modal-btn');

// Добавляем обработчик события на отправку формы
form.addEventListener('submit', function(event) {
    // 1. Предотвращаем стандартное поведение формы (перезагрузку страницы)
    event.preventDefault();

    // 2. Показываем модальное окно
    modal.style.display = 'flex';

    // Опционально: здесь можно добавить код для реальной отправки данных на сервер (например, через fetch)
    // form.reset(); // Можно раскомментировать, чтобы очистить поля формы после отправки
});

// Функция для закрытия модального окна
function closeModal() {
    modal.style.display = 'none';
}

// Закрываем окно по клику на кнопку "ОК"
closeModalBtn.addEventListener('click', function() {
    window.location.href = '/mainPage.html'; 
});

// Закрываем окно по клику на темный фон (оверлей)
modal.addEventListener('click', function(event) {
    // Сработает, только если клик был именно по фону, а не по содержимому окна
    if (event.target === modal) {
        closeModal();
    }
});