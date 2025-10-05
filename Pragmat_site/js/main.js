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

async function submitForm(event) {
  event.preventDefault();

  const BOT_TOKEN = '8410390332:AAHNXWyyVAkAbbru6GAcft8kW3lblj-0AWo'; 
  const CHAT_ID = '5509707292';     // Замените на Chat ID сотрудника

  const form = event.target;
  const formData = new FormData(form);
  const submitButton = form.querySelector('button[type="submit"]');

  const name = formData.get("name");
  const phone = formData.get("phone");
  const consent = formData.get("privacy-consent");

  if (!name || !phone || !consent) {
    alert("Пожалуйста, заполните все обязательные поля и дайте согласие на обработку данных");
    return;
  }

  const phoneRegex = /^[+]?[0-9\s\-\(\)]+$/;
  if (!phoneRegex.test(phone)) {
    alert("Пожалуйста, введите корректный номер телефона");
    return;
  }

  let message = `<b>Новая заявка с сайта!</b>\n`;
  message += `<b>Имя:</b> ${name}\n`;
  message += `<b>Телефон:</b> ${phone}`;

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const params = new URLSearchParams({
    chat_id: CHAT_ID,
    text: message,
    parse_mode: 'HTML', 
  });

  submitButton.disabled = true;
  submitButton.textContent = 'ОТПРАВКА...';

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: params,
    });

    const data = await response.json();

    if (data.ok) {
      alert("Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.");
      form.reset();
    } else {
      throw new Error(`Ошибка Telegram: ${data.description}`);
    }

  } catch (error) {
    console.error("Ошибка при отправке формы:", error);
    alert("Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз или свяжитесь с нами по телефону.");
  } finally {
    // Возвращаем кнопку в исходное состояние
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

// === КОД ДЛЯ ЗАГРУЗКИ ДАННЫХ АКЦИИ ИЗ JSON ===
document.addEventListener('DOMContentLoaded', () => {
  loadPromotion();
});

async function loadPromotion() {
  const promoSection = document.getElementById('promotions');
  
  try {
    // Запрашиваем наш json файл
    const response = await fetch('promo.json');
    if (!response.ok) {
      throw new Error('Не удалось загрузить файл акции promo.json');
    }
    const promoData = await response.json();

    // Находим элементы на странице по их ID
    const titleElement = document.getElementById('promotion-title');
    const descriptionElement = document.getElementById('promotion-description');

    // Обновляем текстовый контент
    if (titleElement) titleElement.textContent = promoData.title;
    if (descriptionElement) descriptionElement.innerHTML = promoData.description.replace(/\n/g, '<br>'); // Заменяем переносы строк на <br> для корректного отображения

    // Обновляем фоновое изображение секции
    if (promoSection) {
      promoSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${promoData.backgroundImage}')`;
    }

  } catch (error) {
    console.error('Ошибка при загрузке акции:', error);
    // Если произошла ошибка (например, файл не найден), просто скрываем всю секцию
    if (promoSection) promoSection.style.display = 'none';
  }
}