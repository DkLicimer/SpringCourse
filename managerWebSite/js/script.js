document.addEventListener('DOMContentLoaded', function() {

    // --- Логика для бургер-меню ---
    const burgerMenu = document.getElementById('burger-menu');
    const nav = document.getElementById('nav');

    if (burgerMenu && nav) {
        burgerMenu.addEventListener('click', () => {
            // Переключаем классы для анимации бургера и показа/скрытия меню
            burgerMenu.classList.toggle('is-active');
            nav.classList.toggle('is-active');

            // Блокируем прокрутку страницы, когда меню открыто
            document.body.classList.toggle('no-scroll');
        });
    }


    // --- Плавная прокрутка к якорям ---
    // Находим все ссылки в навигации, которые ведут к якорным элементам
    const navLinks = document.querySelectorAll('.nav__link[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Отменяем стандартное поведение ссылки

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                // Если меню открыто на мобильной версии, закрываем его перед скроллом
                if (nav.classList.contains('is-active')) {
                    burgerMenu.classList.remove('is-active');
                    nav.classList.remove('is-active');
                    document.body.classList.remove('no-scroll');
                }

                // Выполняем плавную прокрутку к целевому элементу
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

});