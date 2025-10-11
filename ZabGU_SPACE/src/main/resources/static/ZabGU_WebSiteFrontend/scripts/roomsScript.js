document.addEventListener('DOMContentLoaded', () => {
    // === ШАГ 1: Получаем доступ ко всем нужным элементам DOM ===
    const cardsContainer = document.getElementById('room-cards-container');

    // Элементы модального окна
    const modal = document.getElementById('room-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalImageContainer = document.getElementById('modal-image-container');
    const modalDetailsContainer = document.getElementById('modal-details-container');

    // Переменная для хранения данных о комнатах
    let roomsData = [];

    // === ШАГ 2: Функция для создания карточек-превью ===
    function createRoomCard(room) {
        // В data-атрибутах храним ВСЮ информацию, которая понадобится для модального окна
        return `
            <div class="room-card" 
                 data-room-id="${room.id}"
                 data-room-name="${room.name}"
                 data-room-address="${room.address}"
                 data-room-capacity="${room.capacity}"
                 data-room-image="${room.imagePath}">
                
                <img src="${room.imagePath}" alt="Фото ${room.name}" class="card-main-image">
                <div class="card-title-overlay">
                    <h2 class="card-title">${room.name}</h2>
                </div>
            </div>
        `;
    }

    // === ШАГ 3: Функция для отображения карточек на странице ===
    function displayRoomCards() {
        if (!cardsContainer) return;
        cardsContainer.innerHTML = roomsData.map(createRoomCard).join('');
        addEventListenersToCards(); // После создания карточек, вешаем на них обработчики
    }

    // === ШАГ 4: Функция для назначения обработчиков клика ===
    function addEventListenersToCards() {
        document.querySelectorAll('.room-card').forEach(card => {
            card.addEventListener('click', () => {
                const roomDataSet = card.dataset; // Получаем объект со всеми data-атрибутами
                openModal(roomDataSet); // Передаем его в функцию открытия модального окна
            });
        });
    }

    // === ШАГ 5: КЛЮЧЕВАЯ ФУНКЦИЯ - Заполнение и открытие модального окна ===
    function openModal(roomData) {
        // Форматируем текст о вместительности
        const formattedCapacity = roomData.roomCapacity.replace(/\|/g, '<br>');

        // Вставляем картинку
        modalImageContainer.innerHTML = `<img src="${roomData.roomImage}" alt="Фото ${roomData.roomName}">`;

        // Вставляем блок с деталями. Убедитесь, что здесь есть тег <a> с кнопкой!
        modalDetailsContainer.innerHTML = `
            <h2 class="modal-title">${roomData.roomName}</h2>
            <p class="modal-address">${roomData.roomAddress}</p>
            <div class="modal-capacity">
                <p class="modal-capacity-title">О помещении:</p>
                <p class="modal-capacity-details">${formattedCapacity}</p>
            </div>
            <a href="/schedule" id="modal-select-time-btn" class="card-button">Выбрать время</a>
        `;

        // Находим созданную кнопку и вешаем на нее обработчик для сохранения данных
        const modalSelectBtn = document.getElementById('modal-select-time-btn');
        if (modalSelectBtn) {
            modalSelectBtn.addEventListener('click', () => {
                localStorage.setItem('selectedRoomId', roomData.roomId);
                localStorage.setItem('selectedRoomName', roomData.roomName);
            });
        }

        // Показываем модальное окно
        modal.classList.add('visible');
    }

    // === ШАГ 6: Функция для закрытия модального окна ===
    function closeModal() {
        modal.classList.remove('visible');
        // Очищаем контент, чтобы при следующем открытии не было "мелькания" старых данных
        modalImageContainer.innerHTML = '';
        modalDetailsContainer.innerHTML = '';
    }

    // === ШАГ 7: Функция загрузки данных с сервера ===
    async function loadRooms() {
        try {
            const response = await fetch('http://localhost:8080/api/rooms');
            if (!response.ok) throw new Error('Не удалось загрузить данные');
            roomsData = await response.json();
            displayRoomCards();
        } catch (error) {
            console.error(error);
            if (cardsContainer) {
                cardsContainer.innerHTML = '<p style="color: white; text-align: center;">Ошибка загрузки помещений.</p>';
            }
        }
    }

    // === ШАГ 8: Назначаем обработчики для закрытия модального окна ===
    if(modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if(modal) modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // === ШАГ 9: Запускаем весь процесс ===
    loadRooms();
});