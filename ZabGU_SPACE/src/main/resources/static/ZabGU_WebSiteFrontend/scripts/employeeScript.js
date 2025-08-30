document.addEventListener('DOMContentLoaded', () => {
    const loginFormContainer = document.getElementById('login-form-container');
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const applicationListContent = document.getElementById('application-list-content');
    const filterButtons = document.querySelectorAll('.filter-btn');

    const API_BASE_URL = 'http://localhost:8080/api';

    // --- 1. ЛОГИКА ОТОБРАЖЕНИЯ ---
    function showAdminPanel() {
        loginFormContainer.style.display = 'none';
        adminPanel.style.display = 'block';
    }

    function showLoginForm() {
        loginFormContainer.style.display = 'block';
        adminPanel.style.display = 'none';
        localStorage.removeItem('jwtToken'); // На всякий случай чистим токен
    }

    // --- 2. ЛОГИКА РАБОТЫ С API ---

    // Общая функция для fetch с авторизацией
    async function fetchWithAuth(url, options = {}) {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            showLoginForm();
            throw new Error("Токен не найден");
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        };

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401 || response.status === 403) {
            // Если токен невалидный, выкидываем на логин
            showLoginForm();
            throw new Error("Ошибка авторизации");
        }
        return response;
    }

    // Вход в систему
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

    // Получение и отрисовка заявок
    async function fetchAndRenderApplications(status = '') {
        try {
            const url = status ? `${API_BASE_URL}/admin/applications?status=${status}` : `${API_BASE_URL}/admin/applications`;
            const response = await fetchWithAuth(url);
            if (!response.ok) throw new Error('Не удалось загрузить заявки');

            const applications = await response.json();
            renderApplications(applications);
        } catch (error) {
            console.error(error.message);
        }
    }

    // Одобрение заявки
    async function approveApplication(id) {
        try {
            await fetchWithAuth(`${API_BASE_URL}/admin/applications/${id}/approve`, { method: 'POST' });
            fetchAndRenderApplications(); // Обновляем список
        } catch (error) {
            alert('Не удалось одобрить заявку.');
        }
    }

    // Отклонение заявки
    async function rejectApplication(id) {
        const reason = prompt("Укажите причину отклонения:", "Не указана");
        if (reason === null) return; // Пользователь нажал "Отмена"

        try {
            await fetchWithAuth(`${API_BASE_URL}/admin/applications/${id}/reject`, {
                method: 'POST',
                body: JSON.stringify({ reason }),
            });
            fetchAndRenderApplications(); // Обновляем список
        } catch (error) {
            alert('Не удалось отклонить заявку.');
        }
    }

    // --- 3. ЛОГИКА ОТРИСОВКИ (RENDER) ---
    function renderApplications(applications) {
        applicationListContent.innerHTML = ''; // Очищаем старый список
        if (applications.length === 0) {
            applicationListContent.innerHTML = '<p style="text-align: center; padding: 20px;">Заявки не найдены.</p>';
            return;
        }

        applications.forEach(app => {
            const statusClasses = {
                APPROVED: 'status-approved',
                PENDING: 'status-pending',
                REJECTED: 'status-rejected',
            };
            const statusText = {
                APPROVED: 'Одобрено',
                PENDING: 'Ожидает',
                REJECTED: 'Отклонено',
            };

            const item = document.createElement('article');
            item.className = 'application-item';
            item.innerHTML = `
                <div class="item-summary">
                    <div class="toggle-icon">▾</div>
                    <span>${app.id}</span>
                    <span>${app.eventName}</span>
                    <span>${app.roomName}</span>
                    <div class="status-badge ${statusClasses[app.status] || ''}">${statusText[app.status] || ''}</div>
                </div>
                <div class="item-details">
                    <div class="details-content">
                        <p><b>ФИО:</b> ${app.applicantFullName}</p>
                        <p><b>Должность, подразделение:</b> ${app.applicantPosition}</p>
                        <p><b>Email:</b> ${app.applicantEmail}</p>
                        <p><b>Телефон:</b> ${app.applicantPhone}</p>
                        <p><b>Дата:</b> ${new Date(app.startTime).toLocaleDateString()}</p>
                        <p><b>Время:</b> ${new Date(app.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(app.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        ${app.rejectionReason ? `<p><b>Причина отклонения:</b> ${app.rejectionReason}</p>` : ''}
                    </div>
                    <div class="action-buttons">
                        <button class="btn-approve" data-id="${app.id}">Одобрить</button>
                        <button class="btn-reject" data-id="${app.id}">Отклонить</button>
                    </div>
                </div>
            `;
            applicationListContent.appendChild(item);
        });

        // Добавляем обработчики событий на созданные элементы
        addEventListenersToItems();
    }

    function addEventListenersToItems() {
        document.querySelectorAll('.item-summary').forEach(summary => {
            summary.addEventListener('click', () => summary.closest('.application-item').classList.toggle('expanded'));
        });
        document.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                approveApplication(btn.dataset.id);
            });
        });
        document.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                rejectApplication(btn.dataset.id);
            });
        });
    }

    // Обработчики для кнопок-фильтров
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            fetchAndRenderApplications(button.dataset.status);
        });
    });

    // --- 4. НАЧАЛЬНАЯ ЗАГРУЗКА ---
    if (localStorage.getItem('jwtToken')) {
        showAdminPanel();
        fetchAndRenderApplications();
    } else {
        showLoginForm();
    }
});