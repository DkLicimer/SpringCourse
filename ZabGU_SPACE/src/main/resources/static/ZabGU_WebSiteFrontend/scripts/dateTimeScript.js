document.addEventListener('DOMContentLoaded', async () => {
    // --- НАСТРОЙКИ ---
    const TIME_START = 8.5;
    const TIME_END = 22;
    const TIME_STEP = 0.5;

    // --- ЭЛЕМЕНТЫ DOM ---
    const scheduleContainer = document.getElementById('schedule-container');
    const weekDisplay = document.getElementById('week-display');
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const confirmBtn = document.getElementById('confirm-booking');

    // --- ДАННЫЕ ---
    const selectedRoomId = localStorage.getItem('selectedRoomId');
    const selectedRoomName = localStorage.getItem('selectedRoomName') || 'Помещение не выбрано';
    let bookedSlots = new Map(); // Map<"YYYY-MM-DDTHH:mm", "EventName">
    let selectedSlots = new Set();
    let currentDate = new Date();
    const startOfThisWeek = getMonday(new Date());
    startOfThisWeek.setHours(0, 0, 0, 0);

    // Проверка, выбрано ли помещение
    if (!selectedRoomId) {
        alert("Пожалуйста, сначала выберите помещение!");
        window.location.href = '/roomsPage.html'; // Возвращаем на страницу выбора
        return;
    }

    // --- ЛОГИКА ---

    // Новая функция для загрузки занятых слотов
    async function fetchBookedSlots(monday) {
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const startDate = formatDate(monday);
        const endDate = formatDate(sunday);

        try {
            const url = `http://localhost:8080/api/rooms/${selectedRoomId}/schedule?start_date=${startDate}&end_date=${endDate}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Ошибка загрузки расписания');

            const bookings = await response.json();
            bookedSlots.clear(); // Очищаем старые данные

            // Конвертируем интервалы в 30-минутные слоты
            bookings.forEach(booking => {
                const startTime = new Date(booking.startTime);
                const endTime = new Date(booking.endTime);

                let current = new Date(startTime);
                let slotCount = 0;

                while (current < endTime) {
                    const dateTimeString = `${formatDate(current)}T${formatTime(current.getHours() + current.getMinutes() / 60)}`;
                    // Добавляем название мероприятия только в первый слот, чтобы не дублировать
                    const eventName = (slotCount === 0) ? booking.eventName : "";
                    bookedSlots.set(dateTimeString, eventName);

                    current.setMinutes(current.getMinutes() + 30);
                    slotCount++;
                }
            });

        } catch (error) {
            console.error(error);
            alert("Не удалось загрузить расписание. Попробуйте позже.");
        }
    }

    async function renderSchedule() {
        const monday = getMonday(currentDate);

        // Загружаем актуальные данные перед отрисовкой
        await fetchBookedSlots(monday);

        scheduleContainer.innerHTML = '';
        createHeaders(monday);

        for (let time = TIME_START; time <= TIME_END; time += TIME_STEP) {
            scheduleContainer.appendChild(createTimeLabel(time));
            for (let day = 0; day < 7; day++) {
                const dayDate = new Date(monday);
                dayDate.setDate(monday.getDate() + day);
                scheduleContainer.appendChild(createTimeSlot(dayDate, time));
            }
            scheduleContainer.appendChild(createTimeLabel(time));
        }

        updateWeekDisplay(monday);

        const mondayOfDisplayedWeek = getMonday(currentDate);
        mondayOfDisplayedWeek.setHours(0, 0, 0, 0);
        prevWeekBtn.disabled = mondayOfDisplayedWeek.getTime() < startOfThisWeek.getTime();
    }

    function createTimeSlot(date, time) {
        const slot = document.createElement('div');
        slot.className = 'time-slot';
        const dateTimeString = `${formatDate(date)}T${formatTime(time)}`;
        slot.dataset.datetime = dateTimeString;

        if (bookedSlots.has(dateTimeString)) {
            slot.classList.add('booked');
            slot.textContent = bookedSlots.get(dateTimeString) || ""; // Отображаем название мероприятия
        } else if (selectedSlots.has(dateTimeString)) {
            slot.classList.add('selected');
        }
        return slot;
    }

    // ... (остальные функции: createHeaders, createTimeLabel, getMonday, formatDate, formatTime, updateWeekDisplay)
    // ... ОНИ ОСТАЮТСЯ БЕЗ ИЗМЕНЕНИЙ

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
    function createTimeLabel(time) {
        const label = document.createElement('div');
        label.className = 'time-label';
        label.textContent = formatTime(time);
        return label;
    }
    function getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setDate(diff));
    }
    function formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    function formatTime(time) {
        const hours = Math.floor(time);
        const minutes = (time % 1) * 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    function updateWeekDisplay(monday) {
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const monthNames = ["Января", "Февраля", "Марта", "Апреля", "Мая", "Июня", "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"];

        const start = `${monday.getDate()}`;
        const end = `${sunday.getDate()} ${monthNames[sunday.getMonth()]}`;
        weekDisplay.textContent = `${start} – ${end}`;
    }

    function handleSlotClick(event) {
        const slot = event.target.closest('.time-slot');
        if (!slot || slot.classList.contains('booked')) return;

        const dateTimeString = slot.dataset.datetime;
        if (selectedSlots.has(dateTimeString)) {
            selectedSlots.delete(dateTimeString);
            slot.classList.remove('selected');
        } else {
            selectedSlots.add(dateTimeString);
            slot.classList.add('selected');
        }
    }

    // --- ИНИЦИАЛИЗАЦИЯ И СЛУШАТЕЛИ ---
    prevWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        renderSchedule();
    });

    nextWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        renderSchedule();
    });

    scheduleContainer.addEventListener('click', handleSlotClick);

    // Кнопка "Подтвердить" теперь сохраняет выбор и переходит дальше
    confirmBtn.addEventListener('click', () => {
        if (selectedSlots.size === 0) {
            alert('Пожалуйста, выберите хотя бы один временной слот.');
            return;
        }
        // Сохраняем выбранные слоты в localStorage для следующей страницы
        localStorage.setItem('selectedSlots', JSON.stringify(Array.from(selectedSlots).sort()));

        // Переходим на страницу заявки
        window.location.href = '/applicationPage.html';
    });

    // Первый запуск
    await renderSchedule();
});


// Вставьте сюда без изменений тела этих функций из вашего оригинального файла:
// createHeaders, createTimeLabel, getMonday, formatDate, formatTime, updateWeekDisplay