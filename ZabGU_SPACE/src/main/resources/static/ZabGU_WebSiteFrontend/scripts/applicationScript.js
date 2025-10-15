document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.application-form');
    const modal = document.getElementById('notification-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalText = modal.querySelector('.modal-content p');

    // === БЛОК ВАЛИДАЦИИ ===

    const fieldsToValidate = [
        'full-name', 'position', 'event-name', 'email', 'phone'
    ];

    // Функция для ПОКАЗА ошибки
    function showError(input, message) {
        const formField = input.parentElement;
        formField.classList.add('error');
        const errorSpan = formField.querySelector('.error-message');
        errorSpan.textContent = message;
    }

    // Функция для СКРЫТИЯ ошибки
    function clearError(input) {
        const formField = input.parentElement;
        formField.classList.remove('error');
        const errorSpan = formField.querySelector('.error-message');
        errorSpan.textContent = '';
    }

    // Главная функция-валидатор
    function validateField(input) {
        let isValid = true;
        const value = input.value.trim();

        // Сначала проверяем на пустоту, если поле обязательное
        if (input.required && value === '') {
            showError(input, 'Это поле не может быть пустым');
            return false;
        }

        // Проверки по конкретным полям
        switch (input.id) {
            case 'full-name':
                if (value.length < 5) {
                    showError(input, 'ФИО должно содержать не менее 5 символов');
                    isValid = false;
                }
                break;
            case 'position':
            case 'event-name':
                if (value.length < 3) {
                    showError(input, 'Значение должно содержать не менее 3 символов');
                    isValid = false;
                }
                break;
            case 'email':
                // Используем встроенную в браузер проверку валидности для email
                if (!input.validity.valid) {
                    showError(input, 'Введите корректный email адрес');
                    isValid = false;
                }
                break;
            case 'phone':
                // Используем паттерн, заданный прямо в HTML
                const phoneRegex = new RegExp(input.pattern);
                if (!phoneRegex.test(value)) {
                    showError(input, 'Введите номер в формате +7 9XX XXX-XX-XX');
                    isValid = false;
                }
                break;
        }

        // Если все проверки пройдены, убираем ошибку
        if (isValid) {
            clearError(input);
        }
        return isValid;
    }

    // Вешаем обработчики на каждое поле
    fieldsToValidate.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (input) {
            // Валидируем, когда пользователь убирает фокус
            input.addEventListener('blur', () => validateField(input));
            // И убираем ошибку сразу, как только пользователь начинает исправлять
            input.addEventListener('input', () => {
                if (input.parentElement.classList.contains('error')) {
                    validateField(input);
                }
            });
        }
    });

    // === КОНЕЦ БЛОКА ВАЛИДАЦИИ ===


    // Добавляем обработчик события на отправку формы
    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        // --- 1. Финальная проверка всех полей перед отправкой ---
        let isFormValid = true;
        fieldsToValidate.forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (input && !validateField(input)) {
                isFormValid = false;
            }
        });

        // Если хоть одно поле невалидно, прерываем отправку
        if (!isFormValid) {
            return;
        }

        // --- 2. Сбор данных для отправки (остается как было) ---
        const roomId = localStorage.getItem('selectedRoomId');
        const selectedSlotsJSON = localStorage.getItem('selectedSlots');

        if (!roomId || !selectedSlotsJSON) {
            alert("Критическая ошибка: Не найдена информация о бронировании. Пожалуйста, начните сначала.");
            window.location.href = '/rooms';
            return;
        }

        const selectedSlots = JSON.parse(selectedSlotsJSON);
        const startTime = new Date(selectedSlots[0]);
        const lastSlotTime = new Date(selectedSlots[selectedSlots.length - 1]);
        const endTime = new Date(lastSlotTime.getTime() + 30 * 60 * 1000);

        const payload = {
            roomId: parseInt(roomId, 10),
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            eventName: document.getElementById('event-name').value,
            soundEngineerRequired: document.getElementById('sound-engineer').checked,
            applicantFullName: document.getElementById('full-name').value,
            applicantPosition: document.getElementById('position').value,
            applicantEmail: document.getElementById('email').value,
            applicantPhone: document.getElementById('phone').value
        };

        // --- 3. Отправка данных на сервер (остается почти без изменений) ---
        try {
            const response = await fetch('/api/applications', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                modalText.textContent = 'Ваша заявка принята. Дождитесь одобрения администратора. Ответ придёт к Вам на почту.';
                modal.classList.add('visible');
                form.reset();
                localStorage.removeItem('selectedRoomId');
                localStorage.removeItem('selectedRoomName');
                localStorage.removeItem('selectedSlots');
            } else {
                const errorData = await response.json();
                // Для серверных ошибок все еще используем alert
                alert(`Ошибка сервера: ${errorData.message || 'Произошла ошибка при отправке заявки.'}`);
            }
        } catch (error) {
            console.error('Сетевая ошибка:', error);
            alert('Не удалось связаться с сервером. Пожалуйста, попробуйте позже.');
        }
    });

    // --- Логика модального окна ---

    // Функция закрытия модального окна и редиректа
    function closeModal() {
        // 1. Скрываем модальное окно
        modal.classList.remove('visible');

        // 2. Перенаправляем пользователя на главную страницу
        window.location.href = '/';
    }

    // Назначаем обработчик на кнопку "ОК" внутри модального окна
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    // Назначаем обработчик на клик по затемненному фону (вне окна)
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
});