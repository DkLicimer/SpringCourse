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
                const headerOffset = 100; 
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

});