document.addEventListener('DOMContentLoaded', () => {
    // --- НАСТРОЙКИ ---
    const TIME_START = 8.5; // 8:30
    const TIME_END = 22;   // 22:00
    const TIME_STEP = 0.5; // 30 минут

    // --- ЭЛЕМЕНТЫ DOM ---
    const scheduleContainer = document.getElementById('schedule-container');
    const weekDisplay = document.getElementById('week-display');
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const confirmBtn = document.getElementById('confirm-booking');

    // --- ДАННЫЕ (симуляция) ---
    // В реальном проекте эти данные будут приходить с сервера
    let bookedSlots = new Set([
        '2025-09-04T09:00',
        '2025-09-04T09:30',
        '2025-09-04T10:00',
    ]);
    let selectedSlots = new Set();
    let currentDate = new Date(); // Текущая дата для навигации
    // 1. Получаем понедельник ТЕКУЩЕЙ недели и сохраняем его
    const startOfThisWeek = getMonday(new Date());
    // Обнуляем время для точного сравнения только дат
    startOfThisWeek.setHours(0, 0, 0, 0);

    // --- ОСНОВНАЯ ЛОГИКА ---

    // Функция для генерации и отображения сетки
    function renderSchedule() {
        scheduleContainer.innerHTML = ''; // Очищаем старую сетку
        const monday = getMonday(currentDate);

        // 1. Создаем заголовки (дни недели)
        createHeaders(monday);
        
        // 2. Создаем строки для каждого временного слота
        for (let time = TIME_START; time <= TIME_END; time += TIME_STEP) {
            // Метка времени слева
            scheduleContainer.appendChild(createTimeLabel(time));

            // Ячейки для каждого дня (ЭТОТ КОД БЫЛ УДАЛЕН, Я ЕГО ВЕРНУЛ)
            for (let day = 0; day < 7; day++) {
                const dayDate = new Date(monday);
                dayDate.setDate(monday.getDate() + day);
                scheduleContainer.appendChild(createTimeSlot(dayDate, time));
            }
            
            // Метка времени справа
            scheduleContainer.appendChild(createTimeLabel(time));
        }
        
        // 3. Обновляем отображение недели (ПРАВИЛЬНОЕ МЕСТО)
        updateWeekDisplay(monday);

        // 4. Проверяем, нужно ли отключить кнопку "назад" (ПРАВИЛЬНОЕ МЕСТО)
        const mondayOfDisplayedWeek = getMonday(currentDate);
        mondayOfDisplayedWeek.setHours(0, 0, 0, 0); // Также обнуляем время для сравнения

        if (mondayOfDisplayedWeek.getTime() <= startOfThisWeek.getTime()) {
            prevWeekBtn.disabled = true; // Делаем кнопку неактивной
        } else {
            prevWeekBtn.disabled = false; // Включаем ее обратно
        }
    }

    // Создание заголовков дней недели
    function createHeaders(monday) {
        scheduleContainer.appendChild(document.createElement('div')); // Пустая ячейка
        const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(monday);
            dayDate.setDate(monday.getDate() + i);
            const header = document.createElement('div');
            header.className = 'grid-header';
            header.textContent = `${days[i]}, ${dayDate.getDate()}`;
            scheduleContainer.appendChild(header);
        }
        scheduleContainer.appendChild(document.createElement('div')); // Пустая ячейка
    }

    // Создание метки времени
    function createTimeLabel(time) {
        const label = document.createElement('div');
        label.className = 'time-label';
        label.textContent = formatTime(time);
        return label;
    }

    // Создание ячейки времени
    function createTimeSlot(date, time) {
        const slot = document.createElement('div');
        slot.className = 'time-slot';

        const dateTimeString = `${formatDate(date)}T${formatTime(time)}`;
        slot.dataset.datetime = dateTimeString;

        if (bookedSlots.has(dateTimeString)) {
            slot.classList.add('booked');
            if (dateTimeString === '2025-09-04T09:30') {
                 slot.textContent = 'Название мероприятия';
            }
        } else if (selectedSlots.has(dateTimeString)) {
            slot.classList.add('selected');
        }
        
        return slot;
    }

    // Обработка клика по сетке (делегирование событий)
    function handleSlotClick(event) {
        const slot = event.target.closest('.time-slot');
        if (!slot || slot.classList.contains('booked')) {
            return; // Игнорируем клик, если это не ячейка или она занята
        }

        const dateTimeString = slot.dataset.datetime;
        if (selectedSlots.has(dateTimeString)) {
            selectedSlots.delete(dateTimeString);
            slot.classList.remove('selected');
        } else {
            selectedSlots.add(dateTimeString);
            slot.classList.add('selected');
        }
    }

    // Функция подтверждения бронирования
    function confirmBooking() {
        if (selectedSlots.size === 0) {
            alert('Пожалуйста, выберите хотя бы один временной слот.');
            return;
        }

        // Получаем ранее выбранное помещение из localStorage
        // На странице roomsPage.html нужно будет его сохранить:
        // localStorage.setItem('selectedRoom', 'Актовый зал');
        const selectedRoom = localStorage.getItem('selectedRoom') || 'Помещение не выбрано';
        
        const bookingData = {
            room: selectedRoom,
            slots: Array.from(selectedSlots).sort()
        };

        // В реальном проекте здесь будет отправка на сервер:
        // fetch('/api/book', { method: 'POST', body: JSON.stringify(bookingData) })
        console.log('--- ДАННЫЕ ДЛЯ ОТПРАВКИ НА СЕРВЕР ---');
        console.log(bookingData);

        // Очищаем выбор и обновляем сетку
        bookingData.slots.forEach(slot => bookedSlots.add(slot));
        selectedSlots.clear();
        renderSchedule();
    }

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
    function getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setDate(diff));
    }

    function formatTime(time) {
        const hours = Math.floor(time);
        const minutes = (time % 1) * 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    
    function formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function updateWeekDisplay(monday) {
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const monthNames = ["Января", "Февраля", "Марта", "Апреля", "Мая", "Июня", "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"];
        
        const start = `${monday.getDate()}`;
        const end = `${sunday.getDate()} ${monthNames[sunday.getMonth()]}`;
        weekDisplay.textContent = `${start} – ${end}`;
    }

    // --- ИНИЦИАЛИЗАЦИЯ И СЛУШАТЕЛИ СОБЫТИЙ ---
    prevWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        renderSchedule();
    });

    nextWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        renderSchedule();
    });

    scheduleContainer.addEventListener('click', handleSlotClick);
    confirmBtn.addEventListener('click', confirmBooking);
    
    // Первый запуск
    renderSchedule();

});