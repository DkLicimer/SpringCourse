from django.db import models

class OrganizationSettings(models.Model):
    """
    Синглтон настроек университета (всегда одна запись).
    Позволяет настраивать бренд и реквизиты из админки.
    """
    university_name = models.CharField(
        max_length=255, 
        default="Забайкальский Государственный Университет",
        verbose_name="Полное наименование вуза"
    )
    university_short_name = models.CharField(
        max_length=50, 
        default="ЗабГУ", 
        verbose_name="Краткое наименование"
    )
    logo = models.ImageField(
        upload_to="branding/", 
        blank=True, 
        null=True, 
        verbose_name="Логотип вуза"
    )
    primary_color = models.CharField(
        max_length=7, 
        default="#1E3A8A", 
        verbose_name="Основной цвет (HEX)",
        help_text="Например: #1E3A8A (Тёмно-синий) или #3B9551 (Зелёный)"
    )
    accent_color = models.CharField(
        max_length=7, 
        default="#10B981", 
        verbose_name="Акцентный цвет (HEX)",
        help_text="Цвет активных кнопок и свободных слотов (#10B981)"
    )
    contact_phone = models.CharField(
        max_length=50, 
        default="8 (914) 491-20-84", 
        verbose_name="Контактный телефон"
    )
    contact_email = models.EmailField(
        default="projectsddm@zabgu.ru", 
        verbose_name="Контактный E-mail"
    )
    address = models.CharField(
        max_length=255, 
        default="г. Чита, ул. Александро-Заводская, д. 30", 
        verbose_name="Юридический адрес"
    )
    
    # Реквизиты для оплаты путевок
    recipient_name = models.TextField(
        default="УФК по Приморскому краю (ФГБОУ ВО «ЗабГУ» л/с 20916X16810)",
        verbose_name="Получатель платежа"
    )
    inn = models.CharField(max_length=20, default="7534000257", verbose_name="ИНН")
    kpp = models.CharField(max_length=20, default="753601001", verbose_name="КПП")
    oktmo = models.CharField(max_length=20, default="76701000", verbose_name="ОКТМО")
    bank_name = models.CharField(
        max_length=255, 
        default="ОКЦ № 1 ДГУ Банка России//УФК по Приморскому краю, г Владивосток",
        verbose_name="Банк получателя"
    )
    bik = models.CharField(max_length=20, default="010507002", verbose_name="БИК")
    bank_account = models.CharField(max_length=50, default="40102810545370000012", verbose_name="Счет банка (ЕКС)")
    recipient_account = models.CharField(max_length=50, default="03214643000000012009", verbose_name="Счет получателя")
    kbk = models.CharField(max_length=50, default="00000000000000000130", verbose_name="КБК")
    payment_purpose = models.CharField(
        max_length=100, 
        default="Арахлей", 
        verbose_name="Обязательное назначение платежа"
    )

    class Meta:
        verbose_name = "Настройки организации и брендинг"
        verbose_name_plural = "Настройки организации и брендинг"

    def save(self, *args, **kwargs):
        # Паттерн Singleton: не даём создать вторую запись
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Настройки: {self.university_name}"