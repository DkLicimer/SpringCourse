document.addEventListener('DOMContentLoaded', () => {
    // === СТАРЫЕ ЭЛЕМЕНТЫ ===
    const loginFormContainer = document.getElementById('login-form-container');
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const applicationListContent = document.getElementById('application-list-content');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const adminNavButtons = document.querySelectorAll('.admin-nav-btn');
    const adminSections = document.querySelectorAll('.admin-section');
    const logoutButton = document.getElementById('logout-button');

    // === НОВЫЕ ЭЛЕМЕНТЫ ДЛЯ РАЗДЕЛА "ПОМЕЩЕНИЯ" ===
    const roomsListContainer = document.getElementById('rooms-list-container');
    const addRoomBtn = document.getElementById('add-room-btn');
    const roomEditModal = document.getElementById('room-edit-modal');
    const roomEditForm = document.getElementById('room-edit-form');
    const cancelRoomEditBtn = document.getElementById('cancel-room-edit-btn');
    const roomModalTitle = document.getElementById('room-modal-title');
    const roomIdInput = document.getElementById('room-id-input');

    // Элементы модального окна удаления
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    let roomIdToDelete = null;

    const API_BASE_URL = 'http://localhost:8080/api';

    // --- ЛОГИКА НАВИГАЦИИ ПО РАЗДЕЛАМ ---
    adminNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSectionId = `section-${button.dataset.section}`;

            adminNavButtons.forEach(btn => btn.classList.remove('active'));
            adminSections.forEach(section => section.classList.remove('active'));

            button.classList.add('active');
            const activeSection = document.getElementById(targetSectionId);
            activeSection.classList.add('active');

            if (button.dataset.section === 'rooms') {
                fetchAndRenderRooms();
            }
        });
    });

    // --- 1. ЛОГИКА ОТОБРАЖЕНИЯ ---
    function showAdminPanel() {
        loginFormContainer.style.display = 'none';
        adminPanel.style.display = 'block';
    }
    function showLoginForm() {
        loginFormContainer.style.display = 'block';
        adminPanel.style.display = 'none';
        localStorage.removeItem('jwtToken');
    }

    // --- 2. ЛОГИКА РАБОТЫ С API ---
    async function fetchWithAuth(url, options = {}) {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            showLoginForm();
            throw new Error("Токен не найден");
        }
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...options.headers };
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401 || response.status === 403) {
            showLoginForm();
            throw new Error("Ошибка авторизации");
        }
        return response;
    }

    // --- 3. ЛОГИКА АУТЕНТИФИКАЦИИ ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        const login = e.target.login.value;
        const password = e.target.password.value;
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, password }),
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('jwtToken', data.accessToken);
                showAdminPanel();
                fetchAndRenderApplications();
            } else {
                loginError.textContent = 'Неверный логин или пароль.';
            }
        } catch (error) {
            loginError.textContent = 'Ошибка сети. Попробуйте позже.';
        }
    });

    // --- 4. ЛОГИКА РАБОТЫ С ЗАЯВКАМИ ---
    async function fetchAndRenderApplications(status = '') {
        try {
            const url = status ? `${API_BASE_URL}/admin/applications?status=${status}` : `${API_BASE_URL}/admin/applications`;
            const response = await fetchWithAuth(url);
            if (!response.ok) throw new Error('Не удалось загрузить заявки');
            const applications = await response.json();
            renderApplications(applications);
        } catch (error) { console.error(error.message); }
    }

    function renderApplications(applications) {
        applicationListContent.innerHTML = '';

        if (!applications || applications.length === 0) {
            applicationListContent.innerHTML = '<p style="padding: 20px; text-align: center; color: #888;">Заявки с выбранным статусом не найдены.</p>';
            return;
        }

        applications.forEach(app => {
            const chitaZone = 'Asia/Chita';
            const startTime = new Date(app.startTime).toLocaleString('ru-RU', { timeZone: chitaZone, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(app.endTime).toLocaleString('ru-RU', { timeZone: chitaZone, hour: '2-digit', minute: '2-digit' });
            const timeString = `${startTime} – ${endTime}`;

            let statusClass = '';
            let statusText = '';
            switch (app.status) {
                case 'APPROVED':
                    statusClass = 'status-approved';
                    statusText = 'Одобрена';
                    break;
                case 'REJECTED':
                    statusClass = 'status-rejected';
                    statusText = 'Отклонена';
                    break;
                default:
                    statusClass = 'status-pending';
                    statusText = 'Ожидает';
                    break;
            }

            const item = document.createElement('div');
            item.className = 'application-item';
            item.dataset.id = app.id;

            item.innerHTML = `
            <div class="item-summary">
                <span class="toggle-icon">▼</span>
                <span>${app.id}</span>
                <span>${app.eventName}</span>
                <span>${app.roomName}</span>
                <span class="item-time">${timeString}</span>
                <span><div class="status-badge ${statusClass}">${statusText}</div></span>
            </div>
            <div class="item-details">
                <div class="details-content">
                    <p><strong>Заявитель:</strong> ${app.applicantFullName}</p>
                    <p><strong>Должность:</strong> ${app.applicantPosition}</p>
                    <p><strong>Email:</strong> ${app.applicantEmail}</p>
                    <p><strong>Телефон:</strong> ${app.applicantPhone}</p>
                    <p><strong>Нужен звукорежиссёр:</strong> ${app.soundEngineerRequired ? 'Да' : 'Нет'}</p>
                    ${app.rejectionReason ? `<p><strong>Причина отклонения:</strong> ${app.rejectionReason}</p>` : ''}
                </div>
                <div class="action-buttons">
                    ${app.status === 'PENDING' ? `
                        <button class="btn-approve">Одобрить</button>
                        <button class="btn-reject">Отклонить</button>
                    ` : ''}
                </div>
            </div>
        `;
            applicationListContent.appendChild(item);
        });

        addEventListenersToItems();
    }

    function addEventListenersToItems() {
        document.querySelectorAll('.application-item').forEach(item => {
            const summary = item.querySelector('.item-summary');
            const id = item.dataset.id;

            summary.addEventListener('click', () => {
                item.classList.toggle('expanded');
            });

            const approveBtn = item.querySelector('.btn-approve');
            if (approveBtn) {
                approveBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('Вы уверены, что хотите ОДОБРИТЬ эту заявку?')) {
                        approveApplication(id);
                    }
                });
            }

            const rejectBtn = item.querySelector('.btn-reject');
            if (rejectBtn) {
                rejectBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const reason = prompt('Укажите причину отклонения:');
                    if (reason) {
                        rejectApplication(id, reason);
                    }
                });
            }
        });
    }

    async function approveApplication(id) {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/admin/applications/${id}/approve`, { method: 'POST' });
            if (!response.ok) throw new Error('Ошибка при одобрении');
            fetchAndRenderApplications(document.querySelector('.filter-btn.active').dataset.status);
        } catch (error) {
            alert(error.message);
        }
    }

    async function rejectApplication(id, reason) {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/admin/applications/${id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: reason })
            });
            if (!response.ok) throw new Error('Ошибка при отклонении');
            fetchAndRenderApplications(document.querySelector('.filter-btn.active').dataset.status);
        } catch (error) {
            alert(error.message);
        }
    }

    // DUPLICATE FUNCTION REMOVED FROM HERE

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            fetchAndRenderApplications(button.dataset.status);
        });
    });

    // --- 5. ЛОГИКА ДЛЯ РАЗДЕЛА "ПОМЕЩЕНИЯ" ---

    // ... остальной код для помещений без изменений ...
    async function fetchAndRenderRooms() {
        try {
            const response = await fetch(`${API_BASE_URL}/rooms`);
            if (!response.ok) throw new Error('Не удалось загрузить помещения');

            const rooms = await response.json();
            roomsListContainer.innerHTML = '';

            if (rooms.length === 0) {
                roomsListContainer.innerHTML = '<p>Помещения еще не добавлены.</p>';
                return;
            }

            rooms.forEach(room => {
                const card = document.createElement('div');
                card.className = 'room-card-admin';
                card.innerHTML = `
                    <h5>${room.name}</h5>
                    <p><strong>Адрес:</strong> ${room.address}</p>
                    <div class="room-card-actions">
                        <button class="btn-edit" data-room-id="${room.id}">Редактировать</button>
                        <button class="btn-delete-card" data-room-id="${room.id}">Удалить</button>
                    </div>
                `;
                roomsListContainer.appendChild(card);
            });
        } catch (error) {
            roomsListContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }

    function openRoomModal(room = null) {
        roomEditForm.reset();
        if (room) {
            roomModalTitle.textContent = 'Редактировать помещение';
            roomIdInput.value = room.id;
            document.getElementById('room-name').value = room.name;
            document.getElementById('room-address').value = room.address;
            document.getElementById('room-capacity').value = room.capacity;
        } else {
            roomModalTitle.textContent = 'Добавить новое помещение';
            roomIdInput.value = '';
        }
        roomEditModal.classList.add('visible');
    }

    function closeRoomModal() {
        roomEditModal.classList.remove('visible');
    }

    async function handleRoomFormSubmit(event) {
        event.preventDefault();
        const id = roomIdInput.value;
        const imageFile = document.getElementById('room-image-file').files[0];

        const formData = new FormData();
        formData.append('name', document.getElementById('room-name').value);
        formData.append('address', document.getElementById('room-address').value);
        formData.append('capacity', document.getElementById('room-capacity').value);

        if (imageFile) {
            formData.append('imageFile', imageFile);
        } else if (!id) {
            alert('Пожалуйста, выберите изображение для нового помещения.');
            return;
        }

        const url = id ? `${API_BASE_URL}/admin/rooms/${id}` : `${API_BASE_URL}/admin/rooms`;
        const method = id ? 'PUT' : 'POST';

        try {
            const token = localStorage.getItem('jwtToken');
            const response = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Ошибка ${response.status}`);
            }

            closeRoomModal();
            fetchAndRenderRooms();
        } catch (error) {
            alert(`Не удалось сохранить помещение: ${error.message}`);
        }
    }

    function openDeleteModal(id) {
        roomIdToDelete = id;
        deleteConfirmModal.classList.add('visible');
    }

    function closeDeleteModal() {
        deleteConfirmModal.classList.remove('visible');
        roomIdToDelete = null;
    }

    async function handleDeleteConfirm() {
        if (!roomIdToDelete) return;

        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/admin/rooms/${roomIdToDelete}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Ошибка ${response.status}`);
            }
            closeDeleteModal();
            fetchAndRenderRooms();
        } catch(error) {
            alert(`Ошибка удаления: ${error.message}`);
            closeDeleteModal();
        }
    }

    addRoomBtn.addEventListener('click', () => openRoomModal());
    cancelRoomEditBtn.addEventListener('click', closeRoomModal);
    roomEditForm.addEventListener('submit', handleRoomFormSubmit);

    roomsListContainer.addEventListener('click', async (event) => {
        const target = event.target;

        if (target.classList.contains('btn-edit')) {
            const id = target.dataset.roomId;
            try {
                const response = await fetch(`${API_BASE_URL}/rooms/${id}`);
                if (!response.ok) {
                    throw new Error(`Ошибка сети: ${response.status}`);
                }
                const roomData = await response.json();
                openRoomModal(roomData);
            } catch (error) {
                console.error("Ошибка при получении данных о помещении:", error);
                alert('Не удалось загрузить данные для этого помещения.');
            }
        }
        if (target.classList.contains('btn-delete-card')) {
            const id = target.dataset.roomId;
            openDeleteModal(id);
        }
    });

    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    confirmDeleteBtn.addEventListener('click', handleDeleteConfirm);


    // --- 6. НАЧАЛЬНАЯ ЗАГРУЗКА И ВЫХОД ИЗ СИСТЕМЫ ---
    if (localStorage.getItem('jwtToken')) {
        showAdminPanel();
        fetchAndRenderApplications();
    } else {
        showLoginForm();
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault();
            localStorage.removeItem('jwtToken');
            alert('Вы успешно вышли из системы.');
            window.location.href = '/';
        });
    }

    // --- 7. ЛОГИКА ДЛЯ РАЗДЕЛА "КАЛЕНДАРЬ" ---

    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthDisplay = document.getElementById('current-month-display');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');

    let currentDate = new Date(); // Используем для отслеживания текущего отображаемого месяца

    // Функция для генерации "случайного" цвета на основе названия помещения
    function getRoomColor(roomName) {
        let hash = 0;
        for (let i = 0; i < roomName.length; i++) {
            hash = roomName.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
        for (let i = 0; i < 3; i++) {
            let value = (hash >> (i * 8)) & 0xFF;
            color += ('00' + value.toString(16)).substr(-2);
        }
        return color;
    }

    async function renderCalendar() {
        if (!calendarGrid) return; // Выходим, если элементы календаря не на странице

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // 1. Устанавливаем заголовок
        currentMonthDisplay.textContent = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(currentDate);

        // 2. Очищаем старую сетку
        calendarGrid.innerHTML = '';

        // 3. Определяем даты для запроса к API (с запасом в одну неделю до и после)
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - 7); // Захватываем конец предыдущего месяца

        const endDate = new Date(lastDayOfMonth);
        endDate.setDate(endDate.getDate() + 7); // Захватываем начало следующего месяца

        // 4. Запрашиваем данные
        let events = [];
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/admin/schedule?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`);
            if (response.ok) {
                events = await response.json();
            }
        } catch (error) {
            console.error("Ошибка загрузки расписания для календаря:", error);
        }

        // 5. Строим календарь
        const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0=Пн, 1=Вт...
        const daysInMonth = lastDayOfMonth.getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Дни предыдущего месяца
        for (let i = 0; i < firstDayOfWeek; i++) {
            const day = daysInPrevMonth - firstDayOfWeek + i + 1;
            calendarGrid.appendChild(createDayCell(day, month - 1, year, events, true));
        }

        // Дни текущего месяца
        for (let i = 1; i <= daysInMonth; i++) {
            calendarGrid.appendChild(createDayCell(i, month, year, events, false));
        }

        // Дни следующего месяца
        const remainingCells = 42 - (firstDayOfWeek + daysInMonth); // 6 недель * 7 дней
        for (let i = 1; i <= remainingCells; i++) {
            calendarGrid.appendChild(createDayCell(i, month + 1, year, events, true));
        }
    }

    function createDayCell(day, month, year, allEvents, isOtherMonth) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        if (isOtherMonth) cell.classList.add('other-month');

        const cellDate = new Date(year, month, day);
        const today = new Date();
        if (cellDate.toDateString() === today.toDateString()) {
            cell.classList.add('today');
        }

        const dayNumber = document.createElement('span');
        dayNumber.textContent = day;
        cell.appendChild(dayNumber);

        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'calendar-events';

        // Ищем события для этого дня
        const dayEvents = allEvents.filter(event => {
            const eventStartDate = new Date(event.startTime);
            return eventStartDate.getFullYear() === cellDate.getFullYear() &&
                eventStartDate.getMonth() === cellDate.getMonth() &&
                eventStartDate.getDate() === cellDate.getDate();
        });

        dayEvents.forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = 'calendar-event';
            eventEl.dataset.applicationId = event.id;
            const eventTime = new Date(event.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            eventEl.textContent = `${eventTime} - ${event.roomName}`;
            eventEl.title = `${event.eventName}\n${event.applicantFullName}`;
            eventEl.style.backgroundColor = getRoomColor(event.roomName);
            eventsContainer.appendChild(eventEl);
        });

        cell.appendChild(eventsContainer);
        return cell;
    }

    // Обработчики для кнопок навигации
    if (prevMonthBtn && nextMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    // Добавляем вызов renderCalendar при переключении на вкладку
    adminNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.dataset.section === 'calendar') {
                renderCalendar();
            }
        });
    });

    // Первоначальная отрисовка, если вкладка "Календарь" активна по умолчанию
    if (document.querySelector('.admin-nav-btn[data-section="calendar"].active')) {
        renderCalendar();
    }

    // --- 8. ЛОГИКА ПЕРЕХОДА ИЗ КАЛЕНДАРЯ В ЗАЯВКИ ---

    async function handleCalendarEventClick(e) {
        // Ищем ближайший родительский элемент с классом 'calendar-event'
        const eventElement = e.target.closest('.calendar-event');

        // Если клик был не по событию, ничего не делаем
        if (!eventElement) return;

        const appId = eventElement.dataset.applicationId;
        if (!appId) return;

        // 1. Находим нужную вкладку и программно "кликаем" по ней
        const applicationsTab = document.querySelector('.admin-nav-btn[data-section="applications"]');
        if (applicationsTab) {
            applicationsTab.click();
        }

        // 2. Ждем короткую паузу, чтобы список заявок успел загрузиться
        // Это простой, но надежный способ дождаться асинхронной операции
        await new Promise(resolve => setTimeout(resolve, 100));

        // 3. Находим элемент заявки в списке
        const targetApplication = document.querySelector(`.application-item[data-id="${appId}"]`);

        if (targetApplication) {
            // 4. Плавно прокручиваем к нему
            targetApplication.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // 5. Раскрываем детали, если они еще не раскрыты
            if (!targetApplication.classList.contains('expanded')) {
                targetApplication.classList.add('expanded');
            }

            // 6. Добавляем временную подсветку для привлечения внимания
            targetApplication.style.backgroundColor = '#e6f7ff'; // Светло-голубой
            setTimeout(() => {
                targetApplication.style.backgroundColor = ''; // Убираем подсветку через 2 секунды
            }, 2000);

        } else {
            // Если заявка не найдена (например, из-за фильтра), сбрасываем фильтры и пробуем снова
            const allFilterBtn = document.querySelector('.filter-btn[data-status=""]');
            if(allFilterBtn) {
                allFilterBtn.click();
                // Еще одна пауза для загрузки
                await new Promise(resolve => setTimeout(resolve, 100));
                const finalTarget = document.querySelector(`.application-item[data-id="${appId}"]`);
                if (finalTarget) {
                    finalTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    if (!finalTarget.classList.contains('expanded')) {
                        finalTarget.classList.add('expanded');
                    }
                    finalTarget.style.backgroundColor = '#e6f7ff';
                    setTimeout(() => { finalTarget.style.backgroundColor = ''; }, 2000);
                } else {
                    alert('Не удалось найти указанную заявку.');
                }
            }
        }
    }

    // Привязываем наш новый обработчик к сетке календаря
    if (calendarGrid) {
        calendarGrid.addEventListener('click', handleCalendarEventClick);
    }

    // --- 9. ЛОГИКА ДЛЯ РАЗДЕЛА "АНАЛИТИКА" ---

    // Переменные для хранения созданных графиков, чтобы их можно было уничтожить
    let popularityChartInstance = null;
    let activityChartInstance = null;

    async function loadAndRenderAnalytics() {
        const dashboard = document.getElementById('analytics-dashboard');
        if (!dashboard) return;

        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/admin/analytics`);
            if (!response.ok) throw new Error('Не удалось загрузить данные аналитики');
            const data = await response.json();

            // 1. Рендерим KPI-карточки
            document.getElementById('kpi-total').textContent = data.totalApplications;
            document.getElementById('kpi-approved').textContent = data.approvedApplications;
            document.getElementById('kpi-rejected').textContent = data.rejectedApplications;

            // 2. Рендерим график популярности помещений
            renderRoomPopularityChart(data.roomPopularity);

            // 3. Рендерим график активности
            renderBookingActivityChart(data.dailyActivity);

        } catch (error) {
            console.error(error);
            dashboard.innerHTML = '<p style="color: red; text-align: center;">Ошибка загрузки аналитики.</p>';
        }
    }

    function renderRoomPopularityChart(popularityData) {
        const ctx = document.getElementById('room-popularity-chart');
        if (!ctx) return;

        // Уничтожаем старый график, если он был
        if (popularityChartInstance) {
            popularityChartInstance.destroy();
        }

        const labels = popularityData.map(item => item.roomName);
        const data = popularityData.map(item => item.bookingCount);

        popularityChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Кол-во бронирований',
                    data: data,
                    backgroundColor: 'rgba(109, 190, 0, 0.6)',
                    borderColor: 'rgba(109, 190, 0, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    function renderBookingActivityChart(activityData) {
        const ctx = document.getElementById('booking-activity-chart');
        if (!ctx) return;

        if (activityChartInstance) {
            activityChartInstance.destroy();
        }

        const labels = activityData.map(item => new Date(item.date).toLocaleDateString('ru-RU'));
        const data = activityData.map(item => item.bookingCount);

        activityChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Новые бронирования',
                    data: data,
                    fill: true,
                    backgroundColor: 'rgba(109, 190, 0, 0.1)',
                    borderColor: 'rgba(109, 190, 0, 1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Добавляем вызов аналитики при переключении на вкладку
    adminNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.dataset.section === 'analytics') {
                loadAndRenderAnalytics();
            }
        });
    });

    // Первоначальная отрисовка, если вкладка "Аналитика" активна по умолчанию
    if (document.querySelector('.admin-nav-btn[data-section="analytics"].active')) {
        loadAndRenderAnalytics();
    }

});

