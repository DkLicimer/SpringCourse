function scrollToContactForm() {
  const formWrapper = document.querySelector('.contact-form-wrapper');
  if (formWrapper) {
    formWrapper.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}

function openConsultationModal() {
  scrollToContactForm();
}

function openCalculationModal() {
  scrollToContactForm();
}

// --- КОД ДЛЯ МАСКИ НОМЕРА ТЕЛЕФОНА ---

// Находим наше поле для ввода телефона
const phoneInput = document.querySelector('#phone');

// Функция, которая будет вызываться при любом вводе в поле
const onPhoneInput = (e) => {
  const input = e.target;
  let value = input.value.replace(/\D/g, ''); // Удаляем все нецифровые символы
  let formattedValue = '';
  
  // Если первая цифра - 7, 8 или 9, считаем, что это российский номер
  if (['7', '8', '9'].includes(value[0])) {
    if (value[0] === '9') value = '7' + value; // Если начали с 9, подставляем +7
    const firstDigit = (value[0] === '8') ? '8' : '7';
    formattedValue = `+${firstDigit}`; // Начинаем форматирование
    
    // Если есть еще символы после +7
    if (value.length > 1) {
      formattedValue += ' (' + value.substring(1, 4);
    }
    if (value.length >= 5) {
      formattedValue += ') ' + value.substring(4, 7);
    }
    if (value.length >= 8) {
      formattedValue += '-' + value.substring(7, 9);
    }
    if (value.length >= 10) {
      formattedValue += '-' + value.substring(9, 11);
    }
  } else {
    // Если это не российский номер, просто оставляем знак "+" и цифры
    formattedValue = '+' + value;
  }
  
  input.value = formattedValue; // Применяем отформатированное значение
};

// Функция для обработки нажатия Backspace
const onPhoneKeyDown = (e) => {
  const input = e.target;
  // Если нажимаем Backspace и в конце строки есть нецифровые символы (например, "-"),
  // удаляем их вместе с последней цифрой для удобства пользователя.
  if (e.keyCode === 8 && /\D\s*$/.test(input.value)) {
    e.preventDefault();
    input.value = input.value.replace(/\D\s*(\d?)$/, '');
  }
};

// Функция, которая срабатывает, когда пользователь убирает курсор с поля
const onPhonePaste = (e) => {
    const pasted = e.clipboardData || window.clipboardData;
    if (pasted) {
        const pastedText = pasted.getData('Text');
        if (/\D/g.test(pastedText)) { // Если вставленный текст содержит нецифровые символы
            e.preventDefault();
            // Очищаем и форматируем вставленный номер
            const value = pastedText.replace(/\D/g, '');
            // Имитируем событие ввода, чтобы отформатировать номер
            document.execCommand('insertText', false, value);
        }
    }
};

// Привязываем наши функции к событиям поля ввода
if (phoneInput) {
  phoneInput.addEventListener('input', onPhoneInput);
  phoneInput.addEventListener('keydown', onPhoneKeyDown);
  phoneInput.addEventListener('paste', onPhonePaste);
}

// Новая, безопасная версия функции для работы с PHP
async function submitForm(event) {
  event.preventDefault(); // Предотвращаем перезагрузку страницы

  const form = event.target;
  const formData = new FormData(form); // Собираем все данные из формы
  const submitButton = form.querySelector('button[type="submit"]');

  // Проверка на стороне клиента (остается для удобства пользователя)
  const name = formData.get("name");
  const phone = formData.get("phone");
  const consent = formData.get("privacy-consent");

// Проверяем имя
if (!name.trim()) {
    alert("Пожалуйста, укажите ваше имя.");
    return;
}

// Проверяем номер телефона на ПОЛНОТУ
const phoneDigitsOnly = phone.replace(/\D/g, ''); // Оставляем только цифры
if (phoneDigitsOnly.length < 11) { // Полный российский номер содержит 11 цифр ("7" + 10)
    alert("Пожалуйста, введите номер телефона полностью.");
    return;
}

// Проверяем согласие
if (!consent) {
    alert("Пожалуйста, дайте согласие на обработку персональных данных.");
    return;
}

  
  // Блокируем кнопку, чтобы избежать повторных отправок
  submitButton.disabled = true;
  submitButton.textContent = 'ОТПРАВКА...';
  
  try {
    // Отправляем данные на наш PHP-скрипт
    const response = await fetch('send_telegram.php', {
      method: 'POST',
      body: formData, // FormData идеально подходит для отправки в PHP
    });

    // Ждем JSON-ответ от нашего PHP-скрипта
    const data = await response.json();

    if (data.success) {
      // Если PHP ответил, что все хорошо
      alert("Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.");
      form.reset(); // Очищаем форму
    } else {
      // Если PHP вернул ошибку, показываем ее
      throw new Error(data.message || 'Произошла неизвестная ошибка на сервере.');
    }

  } catch (error) {
    // Если произошла ошибка сети или не удалось обработать JSON
    console.error("Ошибка при отправке формы:", error);
    alert("Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз или свяжитесь с нами по телефону.");
  } finally {
    // В любом случае возвращаем кнопку в рабочее состояние
    submitButton.disabled = false;
    submitButton.textContent = 'ОТПРАВИТЬ';
  }
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  loadPromotion();
  initBurgerMenu(); 
  initPortfolioCarousel();
  initGalleryScroll();
});

async function loadPromotion() {
  const promoSection = document.getElementById('promotions');
  try {
    const response = await fetch('promo.json');
    if (!response.ok) {
      throw new Error('Не удалось загрузить файл акции promo.json');
    }
    const promoData = await response.json();
    const titleElement = document.getElementById('promotion-title');
    const descriptionElement = document.getElementById('promotion-description');
    if (titleElement) titleElement.textContent = promoData.title;
    if (descriptionElement) descriptionElement.innerHTML = promoData.description.replace(/\n/g, '<br>');
    if (promoSection) {
      promoSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${promoData.backgroundImage}')`;
    }
  } catch (error) {
    console.error('Ошибка при загрузке акции:', error);
    if (promoSection) promoSection.style.display = 'none';
  }
}


// --- Логика для бургер-меню ---

function initBurgerMenu() {
  const burgerBtn = document.querySelector('.burger-menu');
  const nav = document.querySelector('.main-nav');
  const navLinks = nav.querySelectorAll('a');

  if (!burgerBtn || !nav) return;

  burgerBtn.addEventListener('click', () => {
    // Переключаем классы для анимации и отображения
    burgerBtn.classList.toggle('is-active');
    nav.classList.toggle('is-active');
    // Блокируем прокрутку страницы, когда меню открыто
    document.body.classList.toggle('no-scroll');
  });

  // Закрываем меню при клике на ссылку (для перехода по якорям)
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      burgerBtn.classList.remove('is-active');
      nav.classList.remove('is-active');
      document.body.classList.remove('no-scroll');
    });
  });
}

// --- Для автоматической прокрутки карусели "Наши работы" ---

function initPortfolioCarousel() {
  const carousel = document.querySelector('.portfolio-carousel');
  if (!carousel) {
    return;
  }

  // --- Клонируем все элементы для создания "бесконечной" ленты ---
  const carouselItems = Array.from(carousel.children);
  carouselItems.forEach(item => {
    const clone = item.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    carousel.appendChild(clone);
  });

  // --- Настройки анимации ---
  let scrollInterval;
  const scrollSpeed = 1; // Количество пикселей для прокрутки за один шаг.
  const intervalTime = 10; // Пауза между шагами в миллисекундах (меньше = плавнее).

  // --- Логика авто-прокрутки ---
  const startAutoScroll = () => {
    // Предотвращаем запуск нескольких интервалов одновременно
    clearInterval(scrollInterval);

    scrollInterval = setInterval(() => {
      // Проверяем, не дошли ли мы до начала клонированных элементов.
      // carousel.scrollWidth / 2 — это ровно граница между оригиналами и клонами.
      if (carousel.scrollLeft >= carousel.scrollWidth / 2) {
        // Если да, МГНОВЕННО перескакиваем в начало.
        // Этот скачок незаметен, т.к. картинки в начале и в середине идентичны.
        carousel.scrollLeft = 0;
      } else {
        // Иначе, просто продолжаем плавно прокручивать.
        carousel.scrollLeft += scrollSpeed;
      }
    }, intervalTime);
  };

  const stopAutoScroll = () => {
    clearInterval(scrollInterval);
  };

  // --- Обработчики событий для остановки/запуска прокрутки ---
  // Останавливаем прокрутку, когда пользователь наводит мышь...
  carousel.addEventListener('mouseenter', stopAutoScroll);
  // ...и возобновляем, когда убирает мышь
  carousel.addEventListener('mouseleave', startAutoScroll);

  // То же самое для сенсорных устройств
  carousel.addEventListener('touchstart', stopAutoScroll, { passive: true });
  carousel.addEventListener('touchend', startAutoScroll);

  // Запускаем автопрокрутку при загрузке страницы
  startAutoScroll();
}

/* === ЛОГИКА ДЛЯ БЕСКОНЕЧНОЙ ПРОКРУТКИ ГАЛЕРЕИ === */

function initGalleryScroll() {
  const galleryRows = document.querySelectorAll('.club-gallery__row');

  galleryRows.forEach(row => {
    // 1. Находим все картинки, которые изначально есть в ряду
    const items = Array.from(row.children);
    
    // 2. Создаем копию каждой картинки и добавляем ее в конец этого же ряда
    items.forEach(item => {
      const clone = item.cloneNode(true);
      row.appendChild(clone);
    });
  });
}

