document.addEventListener('DOMContentLoaded', async () => {
    // --- НАСТРОЙКИ ---
    const TIME_START = 8.5;
    const TIME_END = 22;
    const TIME_STEP = 0.5;
    const DAYS_IN_WEEK = 7;

    // --- ЭЛЕМЕНТЫ DOM ---
    const scheduleContainer = document.getElementById('schedule-container');
    const weekDisplay = document.getElementById('week-display');
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const confirmBtn = document.getElementById('confirm-booking');

    // --- ДАННЫЕ И СОСТОЯНИЕ ---
    const selectedRoomId = localStorage.getItem('selectedRoomId');
    let bookedSlots = new Map();
    let selectedSlots = new Set();
    let currentDate = new Date();
    const startOfThisWeek = getMonday(new Date());
    startOfThisWeek.setHours(0, 0, 0, 0);

    // Переменная для логики выбора двумя кликами
    let selectionStartSlot = null;

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
            const url = `/api/rooms/${selectedRoomId}/schedule?start_date=${startDate}&end_date=${endDate}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Ошибка загрузки расписания');
            const bookings = await response.json();

            bookedSlots.clear(); // Очищаем старые данные

            bookings.forEach(booking => {
                const startTime = new Date(booking.startTime);
                const endTime = new Date(booking.endTime);
                let current = new Date(startTime);
                let isFirstSlot = true;
                let totalSlots = (endTime.getTime() - startTime.getTime()) / (30 * 60 * 1000);

                while (current < endTime) {
                    const dateTimeString = `${formatDate(current)}T${formatTime(current.getHours() + current.getMinutes() / 60)}`;
                    // Сохраняем информацию только для ПЕРВОЙ ячейки брони
                    if (isFirstSlot) {
                        bookedSlots.set(dateTimeString, {
                            eventName: booking.eventName,
                            isStart: true, // Флаг начала брони
                            slotCount: totalSlots // Сколько ячеек занимает бронь
                        });
                        isFirstSlot = false;
                    } else {
                        // Остальные ячейки просто помечаем как "занятые", но без информации
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

    async function renderSchedule() {
        // ... (без изменений) ...
        const monday = getMonday(currentDate);
        await fetchBookedSlots(monday);
        scheduleContainer.innerHTML = '';
        createHeaders(monday);
        const now = new Date();
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const maxBookingDate = new Date(now);
        maxBookingDate.setMonth(now.getMonth() + 6);
        // Устанавливаем время на конец дня, чтобы включить последний день полностью
        maxBookingDate.setHours(23, 59, 59, 999);

        for (let time = TIME_START; time < TIME_END; time += TIME_STEP) {
            scheduleContainer.appendChild(createTimeLabel(time));
            for (let day = 0; day < 7; day++) {
                const dayDate = new Date(monday);
                dayDate.setDate(monday.getDate() + day);
                const hours = Math.floor(time);
                const minutes = (time % 1) * 60;
                const slotDateTime = new Date(dayDate);
                slotDateTime.setHours(hours, minutes, 0, 0);
                let disabledReason = null;
                if (slotDateTime < twentyFourHoursFromNow) {
                    disabledReason = "past"; // Причина: время уже прошло
                } else if (slotDateTime > maxBookingDate) {
                    disabledReason = "future"; // Причина: слишком далекое будущее
                }
                scheduleContainer.appendChild(createTimeSlot(dayDate, time, disabledReason));;
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


    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (без изменений) ---
    function createTimeSlot(date, time, disabledReason) {
        const slot = document.createElement('div');
        const dateTimeString = `${formatDate(date)}T${formatTime(time)}`;

        // Проверяем, есть ли информация о брони в этом слоте
        if (bookedSlots.has(dateTimeString)) {
            const eventInfo = bookedSlots.get(dateTimeString);

            if (eventInfo.isStart) {
                // Это НАЧАЛО бронирования. Создаем большую ячейку.
                slot.className = 'time-slot booked';
                slot.dataset.datetime = dateTimeString;

                // Устанавливаем высоту ячейки в зависимости от количества слотов
                slot.style.height = `calc(${eventInfo.slotCount * 30}px + ${eventInfo.slotCount - 1} * 0px)`; // 30px - высота слота
                // Устанавливаем grid-row-end, чтобы ячейка растянулась
                slot.style.gridRowEnd = `span ${eventInfo.slotCount}`;

                // Добавляем текстовый узел для вертикального выравнивания
                const textSpan = document.createElement('span');
                textSpan.textContent = eventInfo.eventName;
                slot.appendChild(textSpan);

            } else {
                // Это "хвост" бронирования. Мы не создаем для него видимый элемент,
                // так как его место уже занято большой ячейкой.
                // Можно вернуть пустой div или null, чтобы не нарушать сетку.
                slot.className = 'time-slot hidden-part';
                return slot;
            }

        } else {
            // Это свободная или недоступная ячейка (логика остается прежней)
            slot.className = 'time-slot';
            slot.dataset.datetime = dateTimeString;
            if (disabledReason) {
                slot.classList.add('disabled');
                if (disabledReason === "past") slot.title = "Бронирование возможно не менее чем за 24 часа.";
                else if (disabledReason === "future") slot.title = "Бронировать можно не более чем на 6 месяцев вперед.";
            }
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
    function updateConfirmButtonState() {
        const hasSelection = selectedSlots.size > 0;
        confirmBtn.disabled = !hasSelection;
    }

    // ==========================================================
    // ===               НОВАЯ ЛОГИКА ВЫБОРА                  ===
    // ==========================================================

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
            // --- ПЕРВЫЙ КЛИК: НАЧАЛО ВЫБОРА ---
            clearAllSelections();
            selectionStartSlot = targetSlot;
            targetSlot.classList.add('selected');
            selectedSlots.add(targetSlot.dataset.datetime);
        } else {
            // --- ВТОРОЙ КЛИК: ЗАВЕРШЕНИЕ ВЫБОРА ---
            const allSlots = Array.from(scheduleContainer.querySelectorAll('.time-slot'));
            const startIndex = allSlots.indexOf(selectionStartSlot);
            const endIndex = allSlots.indexOf(targetSlot);

            // 1. Проверяем, что выбор в одной колонке (в одном дне)
            const startColumn = startIndex % DAYS_IN_WEEK;
            const endColumn = endIndex % DAYS_IN_WEEK;
            if (startColumn !== endColumn) {
                alert("Нельзя выбирать диапазон на несколько дней. Пожалуйста, выберите время в пределах одного дня.");
                clearAllSelections();
                return;
            }

            // 2. Определяем верхнюю и нижнюю строки в выбранной колонке
            const startRow = Math.floor(startIndex / DAYS_IN_WEEK);
            const endRow = Math.floor(endIndex / DAYS_IN_WEEK);
            const [minRow, maxRow] = [startRow, endRow].sort((a, b) => a - b);

            let isValidRange = true;
            let tempSelectedSlots = [];

            // 3. Проверяем все ячейки СТРОГО ВНУТРИ этой колонки между строками
            for (let r = minRow; r <= maxRow; r++) {
                const slotIndexToCheck = r * DAYS_IN_WEEK + startColumn;
                const slotInRange = allSlots[slotIndexToCheck];

                if (slotInRange.classList.contains('booked') || slotInRange.classList.contains('disabled')) {
                    isValidRange = false;
                    break; // Нашли препятствие, диапазон невалиден
                }
                tempSelectedSlots.push(slotInRange);
            }

            // 4. Применяем или сбрасываем выделение
            if (isValidRange) {
                clearAllSelections();
                tempSelectedSlots.forEach(slot => {
                    slot.classList.add('selected');
                    selectedSlots.add(slot.dataset.datetime);
                });
                selectionStartSlot = null; // Выбор завершен, сбрасываем
            } else {
                alert("Выбранный диапазон пересекается с занятым временем. Пожалуйста, выберите другой интервал.");
                clearAllSelections();
            }
        }
        updateConfirmButtonState();
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

    confirmBtn.addEventListener('click', (event) => {
        event.preventDefault();
        if (selectedSlots.size === 0) {
            alert('Пожалуйста, выберите временной диапазон.');
            return;
        }
        localStorage.setItem('selectedSlots', JSON.stringify(Array.from(selectedSlots).sort()));
        window.location.href = '/apply';
    });

    await renderSchedule();
    updateConfirmButtonState();
});