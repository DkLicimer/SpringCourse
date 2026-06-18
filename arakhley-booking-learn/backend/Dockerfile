FROM python:3.11-slim

# Установка системных зависимостей + шрифтов для PDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    fonts-liberation \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Собираем статику и запускаем
CMD sh -c "python manage.py collectstatic --no-input && python manage.py migrate && python manage.py runserver 0.0.0.0:8000"