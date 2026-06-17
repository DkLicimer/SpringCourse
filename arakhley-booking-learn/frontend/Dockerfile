# Этап сборки статических файлов
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Этап запуска веб-сервера
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Копируем конфигурационный файл Nginx для обработки роутинга и проксирования API
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]