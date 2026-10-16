# Руководство по развертыванию и администрированию "ZabGU SPACE"

Этот документ описывает процесс развертывания, настройки, резервного копирования и обслуживания приложения "ZabGU SPACE" на боевом сервере.

## 1. Системные требования

### 1.1. Характеристики сервера (VPS/VDS)

| Компонент      | Минимальные требования  | Рекомендуемые требования   |
|:---------------|:------------------------|:---------------------------|
| **ОС**         | Ubuntu 22.04 LTS        | Ubuntu 22.04 LTS или новее |
| **Процессор**  | 2 vCPU                  | 2+ vCPU                    |
| **ОЗУ**        | 2 ГБ                    | 4 ГБ                       |
| **Диск**       | 40 ГБ SSD               | 80 ГБ SSD или NVMe         |
| **Сеть**       | Публичный IP-адрес      | Публичный IP-адрес         |

### 1.2. Предустановленное ПО

- **Docker** (последняя стабильная версия)
- **Docker Compose** (последняя стабильная версия)
- **Git**
- **Nginx** (рекомендуется для обратного прокси)
- **Certbot** (рекомендуется для SSL-сертификатов)

## 2. Подготовка к развертыванию

**ВАЖНО:** Не используйте `docker-compose.yaml` напрямую в продакшене. Он содержит небезопасные пароли.

### 2.1. Создание файла конфигурации

1.  Создайте в корне проекта файл `.env`. В нем будут храниться все секретные данные.
2.  Скопируйте в него следующее содержимое и **замените значения из файла application.properties**:

    ```env
    # Настройки базы данных PostgreSQL
    POSTGRES_USER=zabgu_prod_user
    POSTGRES_PASSWORD=ВАШ_СУПЕР_НАДЕЖНЫЙ_ПАРОЛЬ_ДЛЯ_БД
    POSTGRES_DB=zabgu_prod_db

    # Настройки приложения Spring Boot
    # Этот URL будет использоваться Spring для подключения к БД. 'db' - это имя сервиса в docker-compose.
    SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/zabgu_prod_db
    FILE_UPLOAD_DIR=/app/uploads

    # Секретный ключ для JWT (JSON Web Tokens)
    # Сгенерируйте случайную строку из 64+ символов (например, через openssl rand -base64 48)
    JWT_SECRET=ВАШ_ДЛИННЫЙ_И_НАДЕЖНЫЙ_СЕКРЕТНЫЙ_КЛЮЧ_JWT

    # Время жизни JWT токена (в миллисекундах). 86400000 = 24 часа.
    JWT_EXPIRATION_MS=86400000

    # Настройки почтового сервера (SMTP) для отправки уведомлений
    SPRING_MAIL_HOST=smtp.example.com
    SPRING_MAIL_PORT=587
    SPRING_MAIL_USERNAME=noreply@example.com
    SPRING_MAIL_PASSWORD=ПАРОЛЬ_ОТ_ПОЧТОВОГО_ЯЩИКА
    SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=true
    SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true
    ```

### 2.2. Создание `docker-compose.prod.yaml`

Создайте новый файл `docker-compose.prod.yaml`, который будет использовать переменные из `.env`.

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    container_name: zabgu-prod-db
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data

  app:
    build: .
    container_name: zabgu-prod-app
    restart: always
    ports:
      - "127.0.0.1:8080:8080" # Важно: порт доступен только локально для Nginx
    depends_on:
      - db
    environment:
      SPRING_DATASOURCE_URL: ${SPRING_DATASOURCE_URL}
      SPRING_DATASOURCE_USERNAME: ${POSTGRES_USER}
      SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD}
      FILE_UPLOAD_DIR: ${FILE_UPLOAD_DIR}
      APP_JWT_SECRET: ${JWT_SECRET}
      APP_JWT_EXPIRATION-MS: ${JWT_EXPIRATION_MS}
      SPRING_MAIL_HOST: ${SPRING_MAIL_HOST}
      SPRING_MAIL_PORT: ${SPRING_MAIL_PORT}
      SPRING_MAIL_USERNAME: ${SPRING_MAIL_USERNAME}
      SPRING_MAIL_PASSWORD: ${SPRING_MAIL_PASSWORD}
      SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH: ${SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH}
      SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE: ${SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE}
    volumes:
      - uploads_prod_data:/app/uploads

volumes:
  postgres_prod_data:
  uploads_prod_data: