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
    let bookedSlots = new Map();
    let selectedSlots = new Set();
    let currentDate = new Date();
    const startOfThisWeek = getMonday(new Date());
    startOfThisWeek.setHours(0, 0, 0, 0);

    if (!selectedRoomId) {
        alert("Пожалуйста, сначала выберите помещение!");
        window.location.href = '/rooms';
        return;
    }

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
            bookedSlots.clear();
            bookings.forEach(booking => {
                const startTime = new Date(booking.startTime);
                const endTime = new Date(booking.endTime);
                const durationMinutes = (endTime - startTime) / (1000 * 60);
                const totalSlots = Math.round(durationMinutes / 30);
                let current = new Date(startTime);
                let slotIndex = 0;
                while (current < endTime) {
                    const dateTimeString = `${formatDate(current)}T${formatTime(current.getHours() + current.getMinutes() / 60)}`;
                    const isFirstSlot = (slotIndex === 0);
                    const eventInfo = {
                        eventName: isFirstSlot ? booking.eventName : "",
                        slotCount: isFirstSlot ? totalSlots : 0
                    };
                    bookedSlots.set(dateTimeString, eventInfo);
                    current.setMinutes(current.getMinutes() + 30);
                    slotIndex++;
                }
            });
        } catch (error) {
            console.error(error);
            alert("Не удалось загрузить расписание. Попробуйте позже.");
        }
    }

    async function renderSchedule() {
        // ... (без изменений) ...
        const monday = getMonday(currentDate);
        await fetchBookedSlots(monday);
        scheduleContainer.innerHTML = '';
        createHeaders(monday);
        const now = new Date();
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        for (let time = TIME_START; time < TIME_END; time += TIME_STEP) {
            scheduleContainer.appendChild(createTimeLabel(time));
            for (let day = 0; day < 7; day++) {
                const dayDate = new Date(monday);
                dayDate.setDate(monday.getDate() + day);
                const hours = Math.floor(time);
                const minutes = (time % 1) * 60;
                const slotDateTime = new Date(dayDate);
                slotDateTime.setHours(hours, minutes, 0, 0);
                const isDisabled = slotDateTime < twentyFourHoursFromNow;
                scheduleContainer.appendChild(createTimeSlot(dayDate, time, isDisabled));
            }
            scheduleContainer.appendChild(createTimeLabel(time));
        }
        scheduleContainer.appendChild(createTimeLabel(TIME_END));
        for (let i = 0; i < 7; i++) {
            const finalBorder = document.createElement('div');
            finalBorder.className = 'grid-bottom-border';
            scheduleContainer.appendChild(finalBorder);
        }
        scheduleContainer.appendChild(createTimeLabel(TIME_END));
        updateWeekDisplay(monday);
        const mondayOfDisplayedWeek = getMonday(currentDate);
        mondayOfDisplayedWeek.setHours(0, 0, 0, 0);
        if (mondayOfDisplayedWeek.getTime() <= startOfThisWeek.getTime()) {
            prevWeekBtn.style.visibility = 'hidden';
        } else {
            prevWeekBtn.style.visibility = 'visible';
        }
    }

    // === ИСПРАВЛЕННАЯ ФУНКЦИЯ createTimeSlot ===
    function createTimeSlot(date, time, isDisabled) {
        const slot = document.createElement('div');
        slot.className = 'time-slot';
        const dateTimeString = `${formatDate(date)}T${formatTime(time)}`;
        slot.dataset.datetime = dateTimeString;

        // Шаг 1: Проверяем, забронирована ли ячейка.
        if (bookedSlots.has(dateTimeString)) {
            const eventInfo = bookedSlots.get(dateTimeString);
            slot.classList.add('booked');
            if (eventInfo.eventName) {
                slot.textContent = eventInfo.eventName;
                slot.dataset.slotCount = eventInfo.slotCount;
            }
            // Шаг 2: Если не забронирована, проверяем, выбрана ли она пользователем.
        } else if (selectedSlots.has(dateTimeString)) {
            slot.classList.add('selected');
        }

        // Шаг 3: НЕЗАВИСИМО от предыдущих шагов, проверяем, доступна ли ячейка по времени.
        // Этот класс может быть добавлен поверх класса 'booked'.
        if (isDisabled) {
            slot.classList.add('disabled');
            slot.title = "Бронирование возможно не менее чем за 24 часа.";
        }

        return slot;
    }

    function createHeaders(monday) { /* ... (без изменений) ... */
        const emptyHeaderStart = document.createElement('div');
        emptyHeaderStart.className = 'grid-header';
        scheduleContainer.appendChild(emptyHeaderStart);
        const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(monday);
            dayDate.setDate(monday.getDate() + i);
            const header = document.createElement('div');
            header.className = 'grid-header';
            header.textContent = `${days[i]}, ${dayDate.getDate()}`;
            scheduleContainer.appendChild(header);
        }
        const emptyHeaderEnd = document.createElement('div');
        emptyHeaderEnd.className = 'grid-header';
        scheduleContainer.appendChild(emptyHeaderEnd);
    }
    function createTimeLabel(time) { /* ... (без изменений) ... */
        const label = document.createElement('div');
        label.className = 'time-label';
        label.textContent = formatTime(time);
        return label;
    }
    function getMonday(date) { /* ... (без изменений) ... */
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }
    function formatDate(date) { /* ... (без изменений) ... */
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    function formatTime(time) { /* ... (без изменений) ... */
        const hours = Math.floor(time);
        const minutes = (time % 1) * 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    function updateWeekDisplay(monday) { /* ... (без изменений) ... */
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const monthNames = ["Января", "Февраля", "Марта", "Апреля", "Мая", "Июня", "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"];
        const start = `${monday.getDate()}`;
        const end = `${sunday.getDate()} ${monthNames[sunday.getMonth()]}`;
        weekDisplay.textContent = `${start} – ${end}`;
    }

    // === ИСПРАВЛЕННАЯ ФУНКЦИЯ handleSlotClick ===
    function handleSlotClick(event) {
        const slot = event.target.closest('.time-slot');
        if (!slot) return;

        // Проверка на 'disabled' должна идти ПЕРЕД проверкой на 'booked'
        if (slot.classList.contains('disabled')) {
            alert('Бронирование возможно только на будущие даты (не менее чем за 24 часа).');
            return;
        }

        // Эта проверка теперь будет работать, так как класс 'booked' присваивается всегда
        if (slot.classList.contains('booked')) {
            return; // Просто ничего не делаем, если ячейка забронирована
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

    // --- ИНИЦИАЛИЗАЦИЯ И СЛУШАТЕЛИ ---
    prevWeekBtn.addEventListener('click', () => { /* ... (без изменений) ... */
        currentDate.setDate(currentDate.getDate() - 7);
        renderSchedule();
    });
    nextWeekBtn.addEventListener('click', () => { /* ... (без изменений) ... */
        currentDate.setDate(currentDate.getDate() + 7);
        renderSchedule();
    });
    scheduleContainer.addEventListener('click', handleSlotClick);
    confirmBtn.addEventListener('click', () => { /* ... (без изменений) ... */
        if (selectedSlots.size === 0) {
            alert('Пожалуйста, выберите хотя бы один временной слот.');
            return;
        }
        localStorage.setItem('selectedSlots', JSON.stringify(Array.from(selectedSlots).sort()));
        window.location.href = '/apply';
    });

    await renderSchedule();
});