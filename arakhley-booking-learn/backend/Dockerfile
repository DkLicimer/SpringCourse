FROM python:3.11-slim

# Установка системных зависимостей + шрифтов для PDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    fonts-liberation \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Настройка локали для корректной поддержки кириллицы в Python
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Собираем статику и запускаем
CMD sh -c "python manage.py collectstatic --no-input && python manage.py migrate && python manage.py runserver 0.0.0.0:8000"