document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.application-form');
    const modal = document.getElementById('notification-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalText = modal.querySelector('.modal-content p');

    // Добавляем обработчик события на отправку формы
    form.addEventListener('submit', async function(event) {
        event.preventDefault(); // Предотвращаем стандартную перезагрузку

        // --- 1. Сбор данных для отправки ---
        const roomId = localStorage.getItem('selectedRoomId');
        const selectedSlotsJSON = localStorage.getItem('selectedSlots');

        if (!roomId || !selectedSlotsJSON) {
            alert("Ошибка: Не найдена информация о выбранном помещении или времени. Пожалуйста, начните сначала.");
            window.location.href = '/roomsPage.html';
            return;
        }

        const selectedSlots = JSON.parse(selectedSlotsJSON);
        if (selectedSlots.length === 0) {
            alert("Ошибка: Не выбраны временные слоты.");
            return;
        }

        // Вычисляем начало и конец интервала
        const startTime = new Date(selectedSlots[0]);
        const lastSlotTime = new Date(selectedSlots[selectedSlots.length - 1]);
        const endTime = new Date(lastSlotTime.getTime() + 30 * 60 * 1000); // Добавляем 30 минут к последнему слоту

        // Создаем объект payload в соответствии с API контрактом
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

        // --- 2. Отправка данных на сервер ---
        try {
            const response = await fetch('http://localhost:8080/api/applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // Успех
                modalText.textContent = 'Ваша заявка принята. Дождитесь одобрения администратора';
                modal.style.display = 'flex';
                form.reset(); // Очищаем форму
                // Очищаем localStorage, чтобы не было "мусора"
                localStorage.removeItem('selectedRoomId');
                localStorage.removeItem('selectedRoomName');
                localStorage.removeItem('selectedSlots');
            } else {
                // Ошибка от сервера
                const errorData = await response.json();
                const errorMessage = errorData.message || 'Произошла ошибка при отправке заявки.';
                alert(`Ошибка: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Сетевая ошибка:', error);
            alert('Не удалось связаться с сервером. Пожалуйста, попробуйте позже.');
        }
    });

    // --- 3. Логика модального окна (остается почти без изменений) ---
    function closeModal() {
        modal.style.display = 'none';
    }

    closeModalBtn.addEventListener('click', function() {
        // Теперь просто перенаправляем на главную, т.к. данные уже отправлены
        window.location.href = '/mainPage.html';
    });

    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
});