document.addEventListener('DOMContentLoaded', () => {
    //======================================================================
    // 1. КОНСТАНТЫ И ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
    //======================================================================

    // --- Элементы DOM ---
    const loginFormContainer = document.getElementById('login-form-container');
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const adminNavButtons = document.querySelectorAll('.admin-nav-btn');
    const adminSections = document.querySelectorAll('.admin-section');
    const logoutButton = document.getElementById('logout-button');

    // Элементы раздела "Заявки"
    const applicationListContent = document.getElementById('application-list-content');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Элементы раздела "Помещения"
    const roomsListContainer = document.getElementById('rooms-list-container');
    const addRoomBtn = document.getElementById('add-room-btn');
    const roomEditModal = document.getElementById('room-edit-modal');
    const roomEditForm = document.getElementById('room-edit-form');
    const cancelRoomEditBtn = document.getElementById('cancel-room-edit-btn');
    const roomModalTitle = document.getElementById('room-modal-title');
    const roomIdInput = document.getElementById('room-id-input');
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

    // Элементы раздела "Календарь"
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthDisplay = document.getElementById('current-month-display');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');

    // --- Константы API ---
    const API_BASE_URL = '/api'; // Относительный путь для переносимости

    // --- Переменные состояния приложения ---
    let currentPage = 0;
    let currentStatus = ''; // '' означает "Все заявки"
    let roomIdToDelete = null;
    let calendarCurrentDate = new Date(); // Для календаря
    let popularityChartInstance = null; // Для аналитики
    let activityChartInstance = null; // Для аналитики

    //======================================================================
    // 2. ОСНОВНЫЕ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    //======================================================================

    /**
     * Показывает админ-панель и скрывает форму входа.
     */
    function showAdminPanel() {
        loginFormContainer.style.display = 'none';
        adminPanel.style.display = 'block';
    }

    /**
     * Показывает форму входа, скрывает админ-панель и очищает токен.
     */
    function showLoginForm() {
        loginFormContainer.style.display = 'block';
        adminPanel.style.display = 'none';
        localStorage.removeItem('jwtToken');
    }

    /**
     * Обертка для fetch, добавляющая токен авторизации и обрабатывающая ошибки.
     */
    async function fetchWithAuth(url, options = {}) {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            showLoginForm();
            throw new Error("Токен не найден");
        }
        const headers = {
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        // Для FormData Content-Type устанавливается браузером автоматически
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        } else if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401 || response.status === 403) {
            showLoginForm();
            throw new Error("Ошибка авторизации");
        }
        return response;
    }


    //======================================================================
    // 3. МОДУЛЬ: АУТЕНТИФИКАЦИЯ
    //======================================================================

    /**
     * Обрабатывает отправку формы входа.
     */
    async function handleLoginSubmit(event) {
        event.preventDefault();
        loginError.textContent = '';
        const login = event.target.login.value;
        const password = event.target.password.value;
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
                fetchAndRenderApplications('', 0);
            } else {
                loginError.textContent = 'Неверный логин или пароль.';
            }
        } catch (error) {
            loginError.textContent = 'Ошибка сети. Попробуйте позже.';
        }
    }


    //======================================================================
    // 4. МОДУЛЬ: УПРАВЛЕНИЕ ЗАЯВКАМИ
    //======================================================================

    /**
     * Загружает и отображает страницу с заявками.
     */
    async function fetchAndRenderApplications(status, page) {
        page = (typeof page === 'number' && page >= 0) ? page : 0;
        currentStatus = status;
        currentPage = page;

        try {
            const url = status
                ? `${API_BASE_URL}/admin/applications?status=${status}&page=${page}&size=15`
                : `${API_BASE_URL}/admin/applications?page=${page}&size=15`;
            const response = await fetchWithAuth(url);
            if (!response.ok) throw new Error(`Не удалось загрузить заявки (статус: ${response.status})`);
            const pageData = await response.json();
            renderApplications(pageData.content);
            renderPaginationControls(pageData);
        } catch (error) {
            console.error(error);
            applicationListContent.innerHTML = `<p style="padding: 20px; text-align: center; color: #888;">Ошибка загрузки данных.</p>`;
        }
    }

    /**
     * Отображает список заявок в DOM.
     */
    function renderApplications(applications) {
        applicationListContent.innerHTML = '';
        if (!applications || applications.length === 0) {
            applicationListContent.innerHTML = '<p style="padding: 20px; text-align: center; color: #888;">Заявки с выбранным статусом не найдены.</p>';
            return;
        }
        applications.forEach(app => {
            const item = document.createElement('div');
            const chitaZone = 'Asia/Chita';
            const startTime = new Date(app.startTime).toLocaleString('ru-RU', { timeZone: chitaZone, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(app.endTime).toLocaleString('ru-RU', { timeZone: chitaZone, hour: '2-digit', minute: '2-digit' });
            const timeString = `${startTime} – ${endTime}`;
            let statusClass = '', statusText = '';
            switch (app.status) {
                case 'APPROVED': statusClass = 'status-approved'; statusText = 'Одобрена'; break;
                case 'REJECTED': statusClass = 'status-rejected'; statusText = 'Отклонена'; break;
                default: statusClass = 'status-pending'; statusText = 'Ожидает'; break;
            }
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
                        <p><strong>Заявитель:</strong> ${app.applicantFullName}</p><p><strong>Должность:</strong> ${app.applicantPosition}</p><p><strong>Email:</strong> ${app.applicantEmail}</p><p><strong>Телефон:</strong> ${app.applicantPhone}</p><p><strong>Нужен звукорежиссёр:</strong> ${app.soundEngineerRequired ? 'Да' : 'Нет'}</p>${app.rejectionReason ? `<p><strong>Причина отклонения:</strong> ${app.rejectionReason}</p>` : ''}
                    </div>
                    <div class="action-buttons">
                        ${(() => {
                                    if (app.status === 'PENDING') {
                                        return `<button class="btn-approve">Одобрить</button><button class="btn-reject">Отклонить</button>`;
                                    } else if (app.status === 'APPROVED') {
                                        return `<button class="btn-cancel">Отменить бронь</button>`;
                                    }
                                    return ''; // Для статуса REJECTED кнопок нет
                                })()}
                    </div>
                </div>`;
            applicationListContent.appendChild(item);
        });
        addEventListenersToApplicationItems();
    }

    /**
     * Добавляет обработчики событий на кнопки заявок.
     */
    function addEventListenersToApplicationItems() {
        document.querySelectorAll('.application-item').forEach(item => {
            const summary = item.querySelector('.item-summary');
            const id = item.dataset.id;
            summary.addEventListener('click', () => item.classList.toggle('expanded'));
            const approveBtn = item.querySelector('.btn-approve');
            if (approveBtn) {
                approveBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('Вы уверены, что хотите ОДОБРИТЬ эту заявку?')) {
                        updateApplicationStatus(id, 'approve');
                    }
                });
            }
            const rejectBtn = item.querySelector('.btn-reject');
            if (rejectBtn) {
                rejectBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const reason = prompt('Укажите причину отклонения:');
                    if (reason) {
                        updateApplicationStatus(id, 'reject', reason);
                    }
                });
            }
            const cancelBtn = item.querySelector('.btn-cancel');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const reason = prompt('Укажите причину отмены бронирования:');
                    // Проверяем, что пользователь ввел причину и не нажал "Отмена"
                    if (reason && reason.trim()) {
                        updateApplicationStatus(id, 'cancel', reason);
                    }
                });
            }
        });
    }

    /**
     * Универсальная функция для изменения статуса заявки.
     */
    async function updateApplicationStatus(id, action, reason = null) {
        const url = `${API_BASE_URL}/admin/applications/${id}/${action}`;
        const options = { method: 'POST' };
        if ((action === 'reject' || action === 'cancel') && reason) {
            options.body = JSON.stringify({ reason });
        }
        try {
            const response = await fetchWithAuth(url, options);
            if (!response.ok) throw new Error(`Ошибка при выполнении действия: ${action}`);
            await fetchAndRenderApplications(currentStatus, currentPage);
        } catch (error) {
            alert(error.message);
        }
    }

    /**
     * Отображает кнопки пагинации.
     */
    function renderPaginationControls(pageData) {
        const paginationContainer = document.getElementById('pagination-controls');
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';
        if (pageData.totalPages <= 1) return;
        const createButton = (text, page, isDisabled = false) => {
            const button = document.createElement('button');
            button.innerHTML = text;
            button.className = 'pagination-btn';
            button.disabled = isDisabled;
            button.addEventListener('click', () => fetchAndRenderApplications(currentStatus, page));
            return button;
        };
        paginationContainer.appendChild(createButton('‹ Назад', pageData.number - 1, pageData.first));
        for (let i = 0; i < pageData.totalPages; i++) {
            const pageButton = createButton(i + 1, i);
            if (i === pageData.number) pageButton.classList.add('active');
            paginationContainer.appendChild(pageButton);
        }
        paginationContainer.appendChild(createButton('Вперед ›', pageData.number + 1, pageData.last));
    }


    //======================================================================
    // 5. МОДУЛЬ: УПРАВЛЕНИЕ ПОМЕЩЕНИЯМИ
    //======================================================================

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
                    </div>`;
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
            document.getElementById('room-capacity').value = room.capacity.replace(/<br\s*\/?>/gi, '|'); // Обратное преобразование
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
            const response = await fetchWithAuth(url, { method, body: formData });
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
            const response = await fetchWithAuth(`${API_BASE_URL}/admin/rooms/${roomIdToDelete}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Ошибка ${response.status}`);
            }
            closeDeleteModal();
            fetchAndRenderRooms();
        } catch (error) {
            alert(`Ошибка удаления: ${error.message}`);
            closeDeleteModal();
        }
    }

    //======================================================================
    // 6. МОДУЛЬ: КАЛЕНДАРЬ
    //======================================================================

    function getRoomColor(roomName) {
        let hash = 0;
        for (let i = 0; i < roomName.length; i++) hash = roomName.charCodeAt(i) + ((hash << 5) - hash);
        let color = '#';
        for (let i = 0; i < 3; i++) {
            let value = (hash >> (i * 8)) & 0xFF;
            color += ('00' + value.toString(16)).substr(-2);
        }
        return color;
    }

    async function renderCalendar() {
        if (!calendarGrid) return;
        const year = calendarCurrentDate.getFullYear();
        const month = calendarCurrentDate.getMonth();
        currentMonthDisplay.textContent = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(calendarCurrentDate);
        calendarGrid.innerHTML = '';
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - 7);
        const endDate = new Date(lastDayOfMonth);
        endDate.setDate(endDate.getDate() + 7);
        let events = [];
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/admin/schedule?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`);
            if (response.ok) events = await response.json();
        } catch (error) {
            console.error("Ошибка загрузки расписания для календаря:", error);
        }
        const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
        const daysInMonth = lastDayOfMonth.getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        for (let i = 0; i < firstDayOfWeek; i++) {
            calendarGrid.appendChild(createDayCell(daysInPrevMonth - firstDayOfWeek + i + 1, month - 1, year, events, true));
        }
        for (let i = 1; i <= daysInMonth; i++) {
            calendarGrid.appendChild(createDayCell(i, month, year, events, false));
        }
        const remainingCells = 42 - (firstDayOfWeek + daysInMonth);
        for (let i = 1; i <= remainingCells; i++) {
            calendarGrid.appendChild(createDayCell(i, month + 1, year, events, true));
        }
    }

    function createDayCell(day, month, year, allEvents, isOtherMonth) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        if (isOtherMonth) cell.classList.add('other-month');
        const cellDate = new Date(year, month, day);
        if (cellDate.toDateString() === new Date().toDateString()) cell.classList.add('today');
        const dayNumber = document.createElement('span');
        dayNumber.textContent = day;
        cell.appendChild(dayNumber);
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'calendar-events';
        const dayEvents = allEvents.filter(event => new Date(event.startTime).toDateString() === cellDate.toDateString());
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

    async function handleCalendarEventClick(e) {
        const eventElement = e.target.closest('.calendar-event');
        if (!eventElement) return;
        const appId = eventElement.dataset.applicationId;
        if (!appId) return;
        document.querySelector('.admin-nav-btn[data-section="applications"]').click();
        await new Promise(resolve => setTimeout(resolve, 150));
        let targetApplication = document.querySelector(`.application-item[data-id="${appId}"]`);
        if (targetApplication) {
            targetApplication.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (!targetApplication.classList.contains('expanded')) targetApplication.classList.add('expanded');
            targetApplication.style.backgroundColor = '#e6f7ff';
            setTimeout(() => { targetApplication.style.backgroundColor = ''; }, 2000);
        } else {
            document.querySelector('.filter-btn[data-status=""]').click();
            await new Promise(resolve => setTimeout(resolve, 150));
            targetApplication = document.querySelector(`.application-item[data-id="${appId}"]`);
            if (targetApplication) {
                targetApplication.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (!targetApplication.classList.contains('expanded')) targetApplication.classList.add('expanded');
                targetApplication.style.backgroundColor = '#e6f7ff';
                setTimeout(() => { targetApplication.style.backgroundColor = ''; }, 2000);
            } else {
                alert('Не удалось найти указанную заявку.');
            }
        }
    }


    //======================================================================
    // 7. МОДУЛЬ: АНАЛИТИКА
    //======================================================================

    async function loadAndRenderAnalytics() {
        const dashboard = document.getElementById('analytics-dashboard');
        if (!dashboard) return;
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/admin/analytics`);
            if (!response.ok) throw new Error('Не удалось загрузить данные аналитики');
            const data = await response.json();
            document.getElementById('kpi-total').textContent = data.totalApplications;
            document.getElementById('kpi-approved').textContent = data.approvedApplications;
            document.getElementById('kpi-rejected').textContent = data.rejectedApplications;
            renderRoomPopularityChart(data.roomPopularity);
            renderBookingActivityChart(data.dailyActivity);
        } catch (error) {
            console.error(error);
            dashboard.innerHTML = '<p style="color: red; text-align: center;">Ошибка загрузки аналитики.</p>';
        }
    }

    function renderRoomPopularityChart(popularityData) {
        const ctx = document.getElementById('room-popularity-chart');
        if (!ctx) return;
        if (popularityChartInstance) popularityChartInstance.destroy();
        popularityChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: popularityData.map(item => item.roomName),
                datasets: [{ label: 'Кол-во бронирований', data: popularityData.map(item => item.bookingCount), backgroundColor: 'rgba(109, 190, 0, 0.6)', borderColor: 'rgba(109, 190, 0, 1)', borderWidth: 1 }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
        });
    }

    function renderBookingActivityChart(activityData) {
        const ctx = document.getElementById('booking-activity-chart');
        if (!ctx) return;
        if (activityChartInstance) activityChartInstance.destroy();
        activityChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: activityData.map(item => new Date(item.date).toLocaleDateString('ru-RU')),
                datasets: [{ label: 'Новые бронирования', data: activityData.map(item => item.bookingCount), fill: true, backgroundColor: 'rgba(109, 190, 0, 0.1)', borderColor: 'rgba(109, 190, 0, 1)', tension: 0.1 }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
        });
    }


    //======================================================================
    // 8. ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
    //======================================================================

    function initialize() {
        // --- Навигация по разделам админ-панели ---
        adminNavButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetSectionId = `section-${button.dataset.section}`;
                adminNavButtons.forEach(btn => btn.classList.remove('active'));
                adminSections.forEach(section => section.classList.remove('active'));
                button.classList.add('active');
                document.getElementById(targetSectionId).classList.add('active');
                switch (button.dataset.section) {
                    case 'rooms': fetchAndRenderRooms(); break;
                    case 'calendar': renderCalendar(); break;
                    case 'analytics': loadAndRenderAnalytics(); break;
                }
            });
        });

        // --- Обработчики для фильтров заявок ---
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                fetchAndRenderApplications(button.dataset.status, 0);
            });
        });

        // --- Обработчики для раздела "Помещения" ---
        addRoomBtn.addEventListener('click', () => openRoomModal());
        cancelRoomEditBtn.addEventListener('click', closeRoomModal);
        roomEditForm.addEventListener('submit', handleRoomFormSubmit);
        roomsListContainer.addEventListener('click', async (event) => {
            const target = event.target;
            if (target.classList.contains('btn-edit')) {
                const id = target.dataset.roomId;
                try {
                    const response = await fetch(`${API_BASE_URL}/rooms/${id}`);
                    if (!response.ok) throw new Error(`Ошибка сети: ${response.status}`);
                    const roomData = await response.json();
                    openRoomModal(roomData);
                } catch (error) {
                    alert('Не удалось загрузить данные для этого помещения.');
                }
            }
            if (target.classList.contains('btn-delete-card')) {
                openDeleteModal(target.dataset.roomId);
            }
        });
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
        confirmDeleteBtn.addEventListener('click', handleDeleteConfirm);

        // --- Обработчики для раздела "Календарь" ---
        if (prevMonthBtn && nextMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
                renderCalendar();
            });
            nextMonthBtn.addEventListener('click', () => {
                calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
                renderCalendar();
            });
        }
        if (calendarGrid) {
            calendarGrid.addEventListener('click', handleCalendarEventClick);
        }

        // --- Обработчик формы входа и кнопки выхода ---
        loginForm.addEventListener('submit', handleLoginSubmit);
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault();
            alert('Вы успешно вышли из системы.');
            showLoginForm();
        });

        // --- Проверка токена и запуск приложения ---
        if (localStorage.getItem('jwtToken')) {
            showAdminPanel();
            fetchAndRenderApplications(currentStatus, currentPage); // Начальная загрузка заявок
        } else {
            showLoginForm();
        }
    }

    initialize(); // Запускаем всю инициализацию
});