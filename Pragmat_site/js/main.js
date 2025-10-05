function openConsultationModal() {
        // Implement consultation modal logic
        alert("Открытие модального окна консультации");
      }

      function openCalculationModal() {
        // Implement calculation modal logic
        alert("Открытие модального окна расчета стоимости");
      }

      function submitForm(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        // Basic validation
        const name = formData.get("name");
        const phone = formData.get("phone");
        const consent = formData.get("privacy-consent");

        if (!name || !phone || !consent) {
          alert("Пожалуйста, заполните все обязательные поля и дайте согласие на обработку данных");
          return;
        }

        // Phone validation
        const phoneRegex = /^[+]?[0-9\s\-\(\)]+$/;
        if (!phoneRegex.test(phone)) {
          alert("Пожалуйста, введите корректный номер телефона");
          return;
        }

        // Submit form data
        console.log("Form submitted:", {
          name: name,
          phone: phone,
          consent: consent,
        });

        alert("Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.");
        form.reset();
      }

      // Smooth scrolling for navigation links
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