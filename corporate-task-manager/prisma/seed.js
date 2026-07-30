// prisma/seed.js
require('dotenv').config(); // Загружаем переменные окружения из .env
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const bcrypt = require('bcryptjs');

// Создаем пул соединений и передаем в адаптер Prisma
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Начало заполнения базы данных...');

  // 1. Создаем дефолтные статусы задач
  await prisma.taskStatus.upsert({
    where: { id: 'status-todo' },
    update: {},
    create: {
      id: 'status-todo',
      name: 'В очереди',
      color: '#64748b', // Slate-серый
      isDefault: true,
      position: 1,
    },
  });

  await prisma.taskStatus.upsert({
    where: { id: 'status-in-progress' },
    update: {},
    create: {
      id: 'status-in-progress',
      name: 'Взял в работу',
      color: '#3b82f6', // Синий
      isDefault: true,
      position: 2,
    },
  });

  await prisma.taskStatus.upsert({
    where: { id: 'status-done' },
    update: {},
    create: {
      id: 'status-done',
      name: 'Исполнено',
      color: '#10b981', // Зеленый
      isDefault: true,
      position: 3,
    },
  });

  // 2. Создаем шаблонную цель "Текучка"
  await prisma.goal.upsert({
    where: { id: 'goal-current-tasks' },
    update: {},
    create: {
      id: 'goal-current-tasks',
      title: 'Текучка',
      color: '#94a3b8', // Серый
      isTemplate: true,
    },
  });

  // 3. Создаем Администратора по умолчанию
  const hashedPassword = await bcrypt.hash('admin12345', 10);
  await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      passwordHash: hashedPassword,
      name: 'Иван Иванов (Админ)',
      initials: 'ИИ',
      role: 'ADMIN',
    },
  });

  console.log('Данные успешно загружены!');
  console.log('Пользователь: admin@company.com / Пароль: admin12345');
}

main()
  .catch((e) => {
    console.error('Ошибка при заполнении БД:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Обязательно закрываем пул соединений
  });