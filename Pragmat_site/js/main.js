// --- СТАРЫЙ КОД (остается без изменений) ---

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

  if (!name || !phone || !consent) {
    alert("Пожалуйста, заполните все обязательные поля и дайте согласие на обработку данных.");
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


// --- НОВЫЙ КОД (логика для бургер-меню) ---

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
  // Если карусели на странице нет, ничего не делаем
  if (!carousel) {
    return;
  }

  let scrollInterval;

  // --- Настройки скорости ---
  const scrollSpeed = 1; // Количество пикселей для прокрутки за один шаг. Чем больше, тем быстрее.
  const intervalTime = 30; // Пауза между шагами в миллисекундах. Чем меньше, тем плавнее и быстрее.

  const startAutoScroll = () => {
    // Предотвращаем запуск нескольких интервалов одновременно
    clearInterval(scrollInterval);

    scrollInterval = setInterval(() => {
      // Проверяем, достигли ли мы конца карусели
      // carousel.scrollWidth - это полная ширина всего контента
      // carousel.clientWidth - это видимая ширина карусели
      if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 1) {
        // Если дошли до конца, плавно возвращаемся в начало
        carousel.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
      } else {
        // Иначе, просто прокручиваем на заданное количество пикселей
        carousel.scrollLeft += scrollSpeed;
      }
    }, intervalTime);
  };

  const stopAutoScroll = () => {
    clearInterval(scrollInterval);
  };

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