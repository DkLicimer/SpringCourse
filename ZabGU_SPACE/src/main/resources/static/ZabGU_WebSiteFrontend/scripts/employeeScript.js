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
});