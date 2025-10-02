// js/script.js (для страницы roomsPage.html)

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Находим все нужные элементы на странице ---
    const roomImage = document.getElementById('room-image');
    const roomName = document.getElementById('room-name');
    const roomAddress = document.getElementById('room-address');
    const roomCapacity = document.getElementById('room-capacity');
    const prevArrow = document.getElementById('prev-arrow');
    const nextArrow = document.getElementById('next-arrow');
    const chooseTimeLink = document.querySelector('.choose-time-button a');

    // --- 2. Глобальные переменные ---
    let roomsData = []; // Здесь будем хранить данные, полученные с сервера
    let currentIndex = 0;

    // --- 3. Функция для загрузки данных с сервера ---
    async function loadRooms() {
        try {
            const response = await fetch('http://localhost:8080/api/rooms');
            if (!response.ok) {
                throw new Error('Не удалось загрузить данные о помещениях');
            }
            roomsData = await response.json();

            // Показываем первое помещение, если данные загрузились
            if (roomsData.length > 0) {
                updateRoomDisplay();
            } else {
                // Обработка случая, когда с сервера пришел пустой массив
                roomName.textContent = "Помещения не найдены";
                roomAddress.textContent = "";
                roomCapacity.textContent = "";
            }
        } catch (error) {
            console.error(error);
            roomName.textContent = "Ошибка загрузки";
            // Можно скрыть или заблокировать кнопки
            prevArrow.style.display = 'none';
            nextArrow.style.display = 'none';
        }
    }

    // --- 4. Функция для обновления информации на странице ---
    function updateRoomDisplay() {
        if (roomsData.length === 0) return;

        const currentRoom = roomsData[currentIndex];

        roomImage.style.opacity = 0;
        setTimeout(() => {
            roomImage.src = currentRoom.imagePath;
            roomName.textContent = currentRoom.name;
            roomAddress.textContent = currentRoom.address;
            const formattedCapacity = currentRoom.capacity.replace(/\|/g, '<br>');
            roomCapacity.innerHTML = formattedCapacity;
            roomImage.style.opacity = 1;
        }, 400);
    }

    // --- 5. Назначаем обработчики кликов на стрелки ---
    nextArrow.addEventListener('click', () => {
        if (roomsData.length === 0) return;
        currentIndex = (currentIndex + 1) % roomsData.length;
        updateRoomDisplay();
    });

    prevArrow.addEventListener('click', () => {
        if (roomsData.length === 0) return;
        currentIndex = (currentIndex === 0) ? roomsData.length - 1 : currentIndex - 1;
        updateRoomDisplay();
    });

    // --- 6. Обработчик клика на кнопку "Выбрать время" ---
    if (chooseTimeLink) {
        chooseTimeLink.addEventListener('click', () => {
            if (roomsData.length === 0) return;

            const currentRoom = roomsData[currentIndex];

            // Сохраняем ID и ИМЯ выбранного помещения в localStorage
            // ID нужен для запросов к API, а имя - для отображения
            localStorage.setItem('selectedRoomId', currentRoom.id);
            localStorage.setItem('selectedRoomName', currentRoom.name);

            console.log(`Помещение "${currentRoom.name}" (ID: ${currentRoom.id}) сохранено.`);
        });
    }

    // --- 7. Запускаем загрузку данных при открытии страницы ---
    loadRooms();
});