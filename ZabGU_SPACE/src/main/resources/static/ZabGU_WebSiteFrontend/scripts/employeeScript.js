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
    let roomIdToDelete = null; // Переменная для хранения ID удаляемого помещения

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

            // Если мы переключились на раздел "Помещения", загружаем данные
            if (button.dataset.section === 'rooms') {
                fetchAndRenderRooms();
            }
        });
    });

    // --- 1. ЛОГИКА ОТОБРАЖЕНИЯ (без изменений) ---
    function showAdminPanel() {
        loginFormContainer.style.display = 'none';
        adminPanel.style.display = 'block';
    }
    function showLoginForm() {
        loginFormContainer.style.display = 'block';
        adminPanel.style.display = 'none';
        localStorage.removeItem('jwtToken');
    }

    // --- 2. ЛОГИКА РАБОТЫ С API (общая функция без изменений) ---
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

    // --- 3. ЛОГИКА АУТЕНТИФИКАЦИИ (без изменений) ---
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
                fetchAndRenderApplications(); // Загружаем заявки после входа
            } else {
                loginError.textContent = 'Неверный логин или пароль.';
            }
        } catch (error) {
            loginError.textContent = 'Ошибка сети. Попробуйте позже.';
        }
    });

    // --- 4. ЛОГИКА РАБОТЫ С ЗАЯВКАМИ (без изменений) ---
    async function fetchAndRenderApplications(status = '') {
        try {
            const url = status ? `${API_BASE_URL}/admin/applications?status=${status}` : `${API_BASE_URL}/admin/applications`;
            const response = await fetchWithAuth(url);
            if (!response.ok) throw new Error('Не удалось загрузить заявки');
            const applications = await response.json();
            renderApplications(applications);
        } catch (error) { console.error(error.message); }
    }
    async function approveApplication(id) { /* ... (без изменений) ... */ }
    async function rejectApplication(id) { /* ... (без изменений) ... */ }
    function renderApplications(applications) { /* ... (без изменений) ... */ }
    function addEventListenersToItems() { /* ... (без изменений) ... */ }
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            fetchAndRenderApplications(button.dataset.status);
        });
    });

    // --- 5. НОВАЯ ЛОГИКА ДЛЯ РАЗДЕЛА "ПОМЕЩЕНИЯ" ---

    // 5.1. Получение и отрисовка списка помещений
    async function fetchAndRenderRooms() {
        try {
            // Используем публичный эндпоинт, т.к. для просмотра не нужна авторизация
            const response = await fetch(`${API_BASE_URL}/rooms`);
            if (!response.ok) throw new Error('Не удалось загрузить помещения');

            const rooms = await response.json();
            roomsListContainer.innerHTML = ''; // Очищаем контейнер

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

    // 5.2. Логика модального окна (открыть/закрыть)
    function openRoomModal(room = null) {
        roomEditForm.reset(); // Сбрасываем форму
        if (room) { // Режим редактирования
            roomModalTitle.textContent = 'Редактировать помещение';
            roomIdInput.value = room.id;
            document.getElementById('room-name').value = room.name;
            document.getElementById('room-address').value = room.address;
            document.getElementById('room-capacity').value = room.capacity;
            document.getElementById('room-image-path').value = room.imagePath;
        } else { // Режим создания
            roomModalTitle.textContent = 'Добавить новое помещение';
            roomIdInput.value = '';
        }
        roomEditModal.classList.add('visible');
    }

    function closeRoomModal() {
        roomEditModal.classList.remove('visible');
    }

    // 5.3. Логика сохранения (создание/обновление)
    async function handleRoomFormSubmit(event) {
        event.preventDefault();
        const id = roomIdInput.value;
        const imageFile = document.getElementById('room-image-file').files[0];

        // Используем FormData для отправки файла и текста вместе
        const formData = new FormData();
        formData.append('name', document.getElementById('room-name').value);
        formData.append('address', document.getElementById('room-address').value);
        formData.append('capacity', document.getElementById('room-capacity').value);

        if (imageFile) {
            formData.append('imageFile', imageFile);
        } else if (!id) {
            // Если это создание нового помещения, файл обязателен
            alert('Пожалуйста, выберите изображение для нового помещения.');
            return;
        }

        const url = id ? `${API_BASE_URL}/admin/rooms/${id}` : `${API_BASE_URL}/admin/rooms`;
        const method = id ? 'PUT' : 'POST';

        try {
            // ВАЖНО: При отправке FormData НЕ НУЖНО устанавливать заголовок Content-Type
            const token = localStorage.getItem('jwtToken');
            const response = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` }, // Только токен
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Ошибка ${response.status}`);
            }

            closeRoomModal();
            fetchAndRenderRooms(); // Обновляем список
        } catch (error) {
            alert(`Не удалось сохранить помещение: ${error.message}`);
        }
    }

    // 5.4. Логика удаления
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

    // 5.5. Навешивание обработчиков событий
    addRoomBtn.addEventListener('click', () => openRoomModal());
    cancelRoomEditBtn.addEventListener('click', closeRoomModal);
    roomEditForm.addEventListener('submit', handleRoomFormSubmit);

    // Делегирование событий для кнопок "Редактировать" и "Удалить"
    roomsListContainer.addEventListener('click', async (event) => {
        const target = event.target;
        if (target.classList.contains('btn-edit')) {
            const id = target.dataset.roomId;
            // Получаем актуальные данные комнаты перед открытием модального окна
            const response = await fetch(`${API_BASE_URL}/rooms/${id}`); // Предполагаем, что такой эндпоинт есть
            // ПРОСТОЕ РЕШЕНИЕ: получаем данные из общего списка, а не делаем доп. запрос
            const allRoomsResponse = await fetch(`${API_BASE_URL}/rooms`);
            const allRooms = await allRoomsResponse.json();
            const roomData = allRooms.find(r => r.id == id);
            if (roomData) {
                openRoomModal(roomData);
            } else {
                alert('Не удалось найти данные для этого помещения');
            }
        }
        if (target.classList.contains('btn-delete-card')) {
            const id = target.dataset.roomId;
            openDeleteModal(id);
        }
    });

    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    confirmDeleteBtn.addEventListener('click', handleDeleteConfirm);


    // --- 6. НАЧАЛЬНАЯ ЗАГРУЗКА И ВЫХОД ИЗ СИСТЕМЫ (без изменений) ---
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