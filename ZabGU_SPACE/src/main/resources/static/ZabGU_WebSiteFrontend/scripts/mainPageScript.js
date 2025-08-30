// Функция для закрытия всплывающего окна
function closePopup() {
    // Убираем класс .show для плавной анимации исчезновения
    document.getElementById('popup-notification').classList.remove('show');
}

// Устанавливаем таймер на появление
setTimeout(function() {
    const popup = document.getElementById('popup-notification');
    if (popup) {
        // Добавляем класс .show, чтобы запустить CSS-анимацию
        popup.classList.add('show');
    }
}, 500); // 0.5 секунды