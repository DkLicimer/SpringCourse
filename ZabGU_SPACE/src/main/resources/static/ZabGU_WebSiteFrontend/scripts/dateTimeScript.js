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
    const dayTabsContainer = document.getElementById('day-tabs-container');

    // --- ДАННЫЕ И СОСТОЯНИЕ ---
    const selectedRoomId = localStorage.getItem('selectedRoomId');
    let bookedSlots = new Map();
    let selectedSlots = new Set();
    let currentDate = new Date(); // Управляет текущей отображаемой неделей
    let activeDayIndex = 0; // 0=Пн, 1=Вт, ..., 6=Вс
    const startOfThisWeek = getMonday(new Date());
    startOfThisWeek.setHours(0, 0, 0, 0);

    let selectionStartSlot = null;

    if (!selectedRoomId) {
        alert("Пожалуйста, сначала выберите помещение!");
        window.location.href = '/rooms';
        return;
    }

    // Определяет, является ли отображаемая неделя текущей
    function isCurrentWeek(monday) {
        return monday.getTime() === startOfThisWeek.getTime();
    }

    // --- ЛОГИКА РАБОТЫ С API ---
    async function fetchBookedSlotsForWeek(monday) {
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const startDate = formatDate(monday);
        const endDate = formatDate(sunday);
        try {
            const url = `/api/rooms/${selectedRoomId}/schedule?start_date=${startDate}&end_date=${endDate}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Ошибка загрузки расписания');
            const bookings = await response.json();

            bookedSlots.clear();
            bookings.forEach(booking => {
                const startTime = new Date(booking.startTime);
                const endTime = new Date(booking.endTime);
                let current = new Date(startTime);
                let isFirstSlot = true;
                let totalSlots = (endTime.getTime() - startTime.getTime()) / (30 * 60 * 1000);

                while (current < endTime) {
                    const dateTimeString = `${formatDate(current)}T${formatTime(current.getHours() + current.getMinutes() / 60)}`;
                    if (isFirstSlot) {
                        bookedSlots.set(dateTimeString, { eventName: booking.eventName, isStart: true, slotCount: totalSlots });
                        isFirstSlot = false;
                    } else {
                        bookedSlots.set(dateTimeString, { eventName: "", isStart: false });
                    }
                    current.setMinutes(current.getMinutes() + 30);
                }
            });
        } catch (error) {
            console.error(error);
            alert("Не удалось загрузить расписание. Попробуйте позже.");
        }
    }

    // --- ЛОГИКА ОТРИСОВКИ (РЕНДЕРИНГА) ---

    // 1. Главная функция отрисовки
    async function renderSchedule() {
        const monday = getMonday(currentDate);
        updateWeekDisplay(monday);

        // Блокируем кнопку "назад", если это текущая неделя
        prevWeekBtn.disabled = isCurrentWeek(monday);

        await fetchBookedSlotsForWeek(monday);
        renderDayTabs(monday);
        renderSingleDayGrid(monday);
    }

    // 2. Рендеринг вкладок дней недели
    function renderDayTabs(monday) {
        dayTabsContainer.innerHTML = '';
        const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(monday);
            dayDate.setDate(monday.getDate() + i);

            const tab = document.createElement('button');
            tab.className = 'day-tab';
            tab.dataset.dayIndex = i;
            // Внутри кнопки два span для стилизации
            tab.innerHTML = `<span class="tab-day-name">${days[i]}</span><span class="tab-date">${dayDate.getDate()}</span>`;

            if (i === activeDayIndex) {
                tab.classList.add('active');
            }

            tab.addEventListener('click', () => {
                activeDayIndex = i;
                clearAllSelections(); // Сбрасываем выделение при смене дня
                renderDayTabs(monday); // Перерисовываем табы для смены класса active
                renderSingleDayGrid(monday); // Перерисовываем сетку для нового дня
            });
            dayTabsContainer.appendChild(tab);
        }
    }

    // 3. Рендеринг сетки для ОДНОГО выбранного дня
    function renderSingleDayGrid(monday) {
        scheduleContainer.innerHTML = '';
        const now = new Date();
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const maxBookingDate = new Date(now);
        maxBookingDate.setMonth(now.getMonth() + 6);
        maxBookingDate.setHours(23, 59, 59, 999);

        const dayDate = new Date(monday);
        dayDate.setDate(monday.getDate() + activeDayIndex);

        for (let time = TIME_START; time < TIME_END; time += TIME_STEP) {
            scheduleContainer.appendChild(createTimeLabel(time));

            const hours = Math.floor(time);
            const minutes = (time % 1) * 60;
            const slotDateTime = new Date(dayDate);
            slotDateTime.setHours(hours, minutes, 0, 0);

            let disabledReason = null;
            if (slotDateTime < twentyFourHoursFromNow) disabledReason = "past";
            else if (slotDateTime > maxBookingDate) disabledReason = "future";

            scheduleContainer.appendChild(createTimeSlot(dayDate, time, disabledReason));
            scheduleContainer.appendChild(createTimeLabel(time));
        }
    }

    // 4. Создание ячейки времени (слота)
    function createTimeSlot(date, time, disabledReason) {
        const slot = document.createElement('div');
        const dateTimeString = `${formatDate(date)}T${formatTime(time)}`;

        if (bookedSlots.has(dateTimeString)) {
            const eventInfo = bookedSlots.get(dateTimeString);
            if (eventInfo.isStart) {
                slot.className = 'time-slot booked';
                slot.style.gridRowEnd = `span ${eventInfo.slotCount}`;
                const textSpan = document.createElement('span');
                textSpan.textContent = eventInfo.eventName;
                slot.appendChild(textSpan);
            } else {
                slot.className = 'time-slot hidden-part';
                return slot;
            }
        } else {
            slot.className = 'time-slot';
            slot.dataset.datetime = dateTimeString;
            if (disabledReason) {
                slot.classList.add('disabled');
                if (disabledReason === "past") slot.title = "Бронирование возможно не менее чем за 24 часа.";
                else if (disabledReason === "future") slot.title = "Бронировать можно не более чем на 6 месяцев вперед.";
            }
            if (selectedSlots.has(dateTimeString)) {
                slot.classList.add('selected');
            }
        }
        return slot;
    }

    // --- ЛОГИКА ВЫБОРА ДИАПАЗОНА ---
    function clearAllSelections() {
        document.querySelectorAll('.time-slot.selected').forEach(s => s.classList.remove('selected'));
        selectedSlots.clear();
        selectionStartSlot = null;
        updateConfirmButtonState();
    }

    function handleSlotClick(event) {
        const targetSlot = event.target.closest('.time-slot');
        if (!targetSlot || targetSlot.classList.contains('disabled') || targetSlot.classList.contains('booked')) {
            return;
        }

        if (!selectionStartSlot) {
            clearAllSelections();
            selectionStartSlot = targetSlot;
            targetSlot.classList.add('selected');
            selectedSlots.add(targetSlot.dataset.datetime);
        } else {
            const allSlotsInDay = Array.from(scheduleContainer.querySelectorAll('.time-slot:not(.hidden-part)'));
            const startIndex = allSlotsInDay.indexOf(selectionStartSlot);
            const endIndex = allSlotsInDay.indexOf(targetSlot);

            const [minIdx, maxIdx] = [startIndex, endIndex].sort((a, b) => a - b);

            let isValidRange = true;
            let tempSelectedSlots = [];

            for (let i = minIdx; i <= maxIdx; i++) {
                const slotInRange = allSlotsInDay[i];
                if (slotInRange.classList.contains('booked') || slotInRange.classList.contains('disabled')) {
                    isValidRange = false;
                    break;
                }
                tempSelectedSlots.push(slotInRange);
            }

            if (isValidRange) {
                clearAllSelections();
                tempSelectedSlots.forEach(slot => {
                    slot.classList.add('selected');
                    selectedSlots.add(slot.dataset.datetime);
                });
                selectionStartSlot = null;
            } else {
                alert("Выбранный диапазон пересекается с занятым временем. Пожалуйста, выберите другой интервал.");
                clearAllSelections();
            }
        }
        updateConfirmButtonState();
    }

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
    function createTimeLabel(time) {
        const label = document.createElement('div');
        label.className = 'time-label';
        label.textContent = formatTime(time);
        return label;
    }
    function getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
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
    function updateConfirmButtonState() {
        confirmBtn.disabled = selectedSlots.size === 0;
    }

    // --- ИНИЦИАЛИЗАЦИЯ И СЛУШАТЕЛИ ---
    prevWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        activeDayIndex = 0; // При переключении недели всегда показываем понедельник
        clearAllSelections();
        renderSchedule();
    });
    nextWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        activeDayIndex = 0; // При переключении недели всегда показываем понедельник
        clearAllSelections();
        renderSchedule();
    });
    scheduleContainer.addEventListener('click', handleSlotClick);
    confirmBtn.addEventListener('click', (event) => {
        event.preventDefault();
        if (selectedSlots.size === 0) {
            alert('Пожалуйста, выберите временной диапазон.');
            return;
        }
        localStorage.setItem('selectedSlots', JSON.stringify(Array.from(selectedSlots).sort()));
        window.location.href = '/apply';
    });

    // --- ПЕРВЫЙ ЗАПУСК ---
    function initialize() {
        const monday = getMonday(currentDate);
        if (isCurrentWeek(monday)) {
            // Если текущая неделя, делаем активным сегодняшний день
            let todayIndex = new Date().getDay() - 1; // 0=Пн, ..., 6=Вс
            if (todayIndex < 0) todayIndex = 6; // Воскресенье
            activeDayIndex = todayIndex;
        } else {
            // Для всех остальных недель по умолчанию активен понедельник
            activeDayIndex = 0;
        }
        renderSchedule();
        updateConfirmButtonState();
    }

    initialize();
});