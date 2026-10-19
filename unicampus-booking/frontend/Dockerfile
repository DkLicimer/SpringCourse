FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
# Отключаем лишние проверки аудита и доп. логи, чтобы ничего не висло
RUN npm install --no-audit --no-fund

COPY . .

EXPOSE 5173

# Запускаем Vite сервер разработки с пробросом наружу
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]