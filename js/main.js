document.addEventListener('DOMContentLoaded', () => {
    
    /* ========================================== */
    /*            ПЛАВНЫЙ СКРОЛЛ (Smooth Scroll)  */
    /* ========================================== */
    const anchors = document.querySelectorAll('a[href^="#"]');

    anchors.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();

            const targetElement = document.querySelector(href);

            if (targetElement) {
                const headerOffset = 80; 
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });


    /* ========================================== */
    /*            ВИДЖЕТ СВЯЗИ                    */
    /* ========================================== */
    const widget = document.getElementById('contactWidget');
    const widgetBtn = document.getElementById('widgetToggle');

    if (widget && widgetBtn) {
        widgetBtn.addEventListener('click', () => {
            widget.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!widget.contains(e.target)) {
                widget.classList.remove('active');
            }
        });
    }


    /* ========================================== */
    /*            COOKIE BANNER LOGIC             */
    /* ========================================== */
    const cookieBanner = document.getElementById('cookieBanner');
    const acceptBtn = document.getElementById('acceptCookies');
    const storageKey = 'cookieConsentSpringCourse';

    if (!localStorage.getItem(storageKey)) {
        setTimeout(() => {
            if(cookieBanner) cookieBanner.classList.add('cookie-banner--visible');
        }, 2000);
    }

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem(storageKey, 'true');
            if(cookieBanner) cookieBanner.classList.remove('cookie-banner--visible');
        });
    }


    /* ========================================== */
    /*           МОБИЛЬНОЕ МЕНЮ                   */
    /* ========================================== */
    const burgerBtn = document.getElementById('burgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeMenuBtn = document.getElementById('closeMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const navLinks = document.querySelectorAll('.nav__link');

    function openMenu() {
        mobileMenu.classList.add('nav--active');
        menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        mobileMenu.classList.remove('nav--active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (burgerBtn) burgerBtn.addEventListener('click', openMenu);
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
    if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);

    navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });


    /* ========================================== */
    /*      МАСКА ТЕЛЕФОНА И ВАЛИДАЦИЯ ИМЕНИ      */
    /* ========================================== */
    const phoneInput = document.querySelector('input[name="phone"]');
    const nameInput = document.querySelector('input[name="name"]');

    if (phoneInput) {
        const maskOptions = {
            mask: '+{7} (000) 000-00-00',
            lazy: false 
        };
        const mask = IMask(phoneInput, maskOptions);
        
        phoneInput.addEventListener('focus', function() {
            mask.updateOptions({ lazy: false });
        });

        phoneInput.addEventListener('blur', function() {
            if (mask.value === '') {
                mask.updateOptions({ lazy: true });
            }
        });

        phoneInput.addEventListener('input', function() {
            this.style.border = 'none';
        });
    }

    if (nameInput) {
        nameInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^а-яА-ЯёЁ\s-]/g, '');
            if (this.value.length > 0) {
                 const words = this.value.split(' ');
                 for (let i = 0; i < words.length; i++) {
                     if (words[i].length > 0) {
                        words[i] = words[i][0].toUpperCase() + words[i].substr(1);
                     }
                 }
                 this.value = words.join(' ');
            }
        });
    }


    /* ========================================== */
    /*            ОТПРАВКА ФОРМЫ В TELEGRAM       */
    /* ========================================== */
    const contactForm = document.querySelector('.contact__form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const currentPhoneInput = contactForm.querySelector('input[name="phone"]');
            
            // --- ИСПРАВЛЕННАЯ ПРОВЕРКА ---
            // 1. Проверяем длину (меньше 18 символов)
            // 2. ИЛИ проверяем наличие знака "_" (значит маска не заполнена до конца)
            if (currentPhoneInput.value.length < 18 || currentPhoneInput.value.indexOf('_') >= 0) {
                currentPhoneInput.style.border = '2px solid red';
                alert('Пожалуйста, введите номер телефона полностью.');
                return; // Останавливаем отправку
            } else {
                currentPhoneInput.style.border = 'none';
            }

            const submitBtn = contactForm.querySelector('.form__submit');
            const originalBtnText = submitBtn.textContent;
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка...';

            const formData = new FormData(contactForm);

            try {
                const response = await fetch('telegram.php', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    contactForm.reset();
                    // Сбрасываем маску визуально
                    if (phoneInput) {
                        const event = new Event('blur'); 
                        phoneInput.dispatchEvent(event);
                    }

                    submitBtn.textContent = 'Спасибо! Заявка отправлена';
                    submitBtn.style.backgroundColor = '#4CAF50'; 
                    submitBtn.style.color = '#fff';

                    setTimeout(() => {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                        submitBtn.style.backgroundColor = ''; 
                        submitBtn.style.color = '';
                    }, 3000);
                    
                } else {
                    throw new Error('Ошибка отправки');
                }
            } catch (error) {
                alert('Произошла ошибка. Пожалуйста, попробуйте позже.');
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }

    /* ========================================== */
    /*            ЗАГРУЗКА КЕЙСОВ ИЗ JSON         */
    /* ========================================== */
    async function loadCases() {
        const container = document.getElementById('cases-container');
        if (!container) return;

        try {
            // Загружаем файл cases.json
            const response = await fetch('cases.json');
            const casesData = await response.json();

            // Формируем HTML для каждой карточки
            container.innerHTML = casesData.map(item => `
                <article class="case-card">
                    <div class="case-card__image-wrapper">
                        <img src="${item.image}" alt="Кейс" class="case-card__img">
                    </div>
                    <div class="case-card__info">
                        <p class="case-card__desc">${item.description}</p>
                        <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="case-card__link">подробнее</a>
                    </div>
                </article>
            `).join('');

        } catch (error) {
            console.error('Ошибка при загрузке кейсов:', error);
            container.innerHTML = '<p style="text-align:center;">Не удалось загрузить кейсы. Пожалуйста, обновите страницу.</p>';
        }
    }

    // Вызываем функцию загрузки
    loadCases();

    /* ========================================== */
    /*            ЗАГРУЗКА КОНТЕНТА БАННЕРА       */
    /* ========================================== */
    async function loadPromo() {
        const titleEl = document.getElementById('promo-title');
        const textEl = document.getElementById('promo-text-main');
        const highlightEl = document.getElementById('promo-highlight');

        if (!titleEl) return;

        try {
            const response = await fetch('content.json');
            const data = await response.json();
            const promo = data.promo;

            // Вставляем данные
            titleEl.textContent = promo.title;
            
            // Для основного текста: если вы хотите сохранить перенос строки <br>, 
            // можно добавить его в JSON или вставить программно.
            // Здесь мы просто вставляем текст
            textEl.textContent = promo.text + " "; 
            
            highlightEl.textContent = promo.highlight;

        } catch (error) {
            console.error('Ошибка при загрузке промо-баннера:', error);
            titleEl.textContent = "СПЕЦИАЛЬНОЕ ПРЕДЛОЖЕНИЕ";
        }
    }

    // Вызываем функцию
    loadPromo();

    /* ========================================== */
    /*      КОПИРОВАНИЕ И ПЕРЕХОД (ТЕЛ/ПОЧТА)     */
    /* ========================================== */

    const copyLinks = document.querySelectorAll('.js-copy-link');

    copyLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // 1. Предотвращаем немедленный переход
            e.preventDefault();

            const href = this.getAttribute('href'); // tel:+7... или mailto:...
            // Очищаем текст от префиксов для копирования
            const textToCopy = this.innerText.trim(); 

            // 2. Копируем в буфер обмена
            navigator.clipboard.writeText(textToCopy).then(() => {
                // 3. Визуальное уведомление (опционально)
                const originalText = this.innerText;
                this.innerText = 'Скопировано!';
                this.style.color = '#4CAF50'; // Меняем цвет на зеленый

                // 4. Через полсекунды возвращаем текст и перенаправляем
                setTimeout(() => {
                    this.innerText = originalText;
                    this.style.color = ''; // Возвращаем исходный цвет из CSS
                    
                    // Выполняем переход (откроется звонилка или почта)
                    window.location.href = href;
                }, 600);
            }).catch(err => {
                // Если браузер заблокировал копирование, просто переходим
                console.error('Ошибка копирования: ', err);
                window.location.href = href;
            });
        });
    });

});