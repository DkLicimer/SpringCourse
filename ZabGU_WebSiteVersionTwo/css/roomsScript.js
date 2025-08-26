// js/script.js (для страницы roomsPage.html)

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Наша "база данных" помещений ---
    const rooms = [
        {
            name: 'Актовый зал',
            address: 'ул. Александро-Заводская, 30',
            capacity: 'до 100 человек',
            image: 'css/images/roomOne.jpg'
        },
        {
            name: 'Конференц-зал',
            address: 'ул. Чкалова, 140',
            capacity: 'до 50 человек',
            image: 'css/images/roomTwo.jpg'
        },
        {
            name: 'Коворкинг "Точка Кипения"',
            address: 'ул. Ангарская, 34',
            capacity: 'до 150 человек',
            image: 'css/images/roomThree.jpg'
        }
    ];

    // --- 2. Находим все нужные элементы на странице ---
    const roomImage = document.getElementById('room-image');
    const roomName = document.getElementById('room-name');
    const roomAddress = document.getElementById('room-address');
    const roomCapacity = document.getElementById('room-capacity');

    const prevArrow = document.getElementById('prev-arrow');
    const nextArrow = document.getElementById('next-arrow');

    // --- 3. Переменная для отслеживания текущего слайда ---
    let currentIndex = 0;

    // --- 4. Функция для обновления информации на странице ---
    function updateRoomDisplay() {
        const currentRoom = rooms[currentIndex];
        roomImage.style.opacity = 0;
        setTimeout(() => {
            roomImage.src = currentRoom.image;
            roomName.textContent = currentRoom.name;
            roomAddress.textContent = currentRoom.address;
            roomCapacity.textContent = currentRoom.capacity;
            roomImage.style.opacity = 1;
        }, 400);
    }

    // --- 5. Назначаем обработчики кликов на стрелки ---
    nextArrow.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % rooms.length;
        updateRoomDisplay();
    });

    prevArrow.addEventListener('click', () => {
        currentIndex = (currentIndex === 0) ? rooms.length - 1 : currentIndex - 1;
        updateRoomDisplay();
    });
    
    // --- НОВЫЙ КОД ДЛЯ СОХРАНЕНИЯ ВЫБОРА ---
    // Находим ссылку/кнопку "Выбрать время"
    const chooseTimeLink = document.querySelector('.choose-time-button a');

    // Добавляем обработчик клика
    if (chooseTimeLink) {
        chooseTimeLink.addEventListener('click', (event) => {
            // event.preventDefault(); // Раскомментируйте, если не хотите сразу переходить по ссылке
            
            // Получаем имя ТЕКУЩЕГО отображаемого помещения
            const currentRoomName = roomName.textContent;
            
            // Сохраняем имя в localStorage, чтобы оно было доступно на следующей странице
            localStorage.setItem('selectedRoom', currentRoomName);
            
            console.log(`Помещение "${currentRoomName}" сохранено. Переход на страницу бронирования...`);
            // window.location.href = chooseTimeLink.href; // Раскомментируйте, если используете preventDefault()
        });
    }
    // --- КОНЕЦ НОВОГО КОДА ---


    // --- 6. Показываем первое помещение при загрузке страницы ---
    updateRoomDisplay();
});