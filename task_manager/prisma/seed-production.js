// prisma/seed-production.js
// Безопасное начальное наполнение БД для ПРОДАКШЕНА.
//  - НИЧЕГО не удаляет (в отличие от prisma/seed.js, который стирает все таблицы!)
//  - создаёт системные данные, без которых приложение не работает
//    (статусы задач и цель «Текучка» с жёстко прописанными в коде id)
//  - создаёт ОДНОГО администратора: Сидоренко Наталья Леонидовна
//  - пароль и email берутся из переменных окружения, в коде и в логах их нет
//  - можно запускать повторно: существующие данные не затираются
//
// Запуск (из папки проекта на сервере):
//   read -rsp "Пароль администратора: " ADMIN_PASSWORD; echo
//   export ADMIN_PASSWORD
//   ADMIN_EMAIL="natalia@вашдомен.ru" node prisma/seed-production.js
//   unset ADMIN_PASSWORD
//
// Чтобы принудительно сменить пароль уже существующего админа: FORCE_RESET=1

require('dotenv').config();

// Как и в остальных скриптах проекта: не даём системным PG* переменным перебить .env
delete process.env.PGUSER;
delete process.env.PGPASSWORD;
delete process.env.PGHOST;
delete process.env.PGPORT;
delete process.env.PGDATABASE;

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const bcrypt = require('bcryptjs');

const ADMIN = {
  name: 'Сидоренко Наталья Леонидовна',
  initials: 'СНЛ',
  department: 'Руководство',
  position: 'Руководитель',
};

function fail(msg) {
  console.error('❌ ' + msg);
  process.exit(1);
}

const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  fail('Укажите корректный ADMIN_EMAIL.');
}
if (password.length < 12) {
  fail('ADMIN_PASSWORD должен быть не короче 12 символов.');
}
if (!process.env.DATABASE_URL) {
  fail('DATABASE_URL не задан (проверьте файл .env).');
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Системные статусы задач (id используются в коде приложения)
  const statuses = [
    { id: 'status-todo', name: 'В очереди', color: '#64748b', position: 1 },
    { id: 'status-in-progress', name: 'Взял в работу', color: '#3b82f6', position: 2 },
    { id: 'status-done', name: 'Исполнено', color: '#10b981', position: 3 },
  ];
  for (const s of statuses) {
    await prisma.taskStatus.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, isDefault: true },
    });
  }

  // 2. Системная цель «Текучка» (id используется в коде приложения)
  await prisma.goal.upsert({
    where: { id: 'goal-current-tasks' },
    update: {},
    create: {
      id: 'goal-current-tasks',
      title: 'Текучка',
      color: '#94a3b8',
      isTemplate: true,
    },
  });

  // 3. Запись «Фокус недели» (пустая)
  await prisma.globalFocus.upsert({
    where: { id: 'current_focus' },
    update: {},
    create: { id: 'current_focus' },
  });

  // 4. Единственный администратор
  const otherAdmins = await prisma.user.findMany({
    where: { role: 'ADMIN', NOT: { email } },
    select: { email: true },
  });
  if (otherAdmins.length > 0) {
    console.warn(
      '⚠️  В базе уже есть другие администраторы: ' +
        otherAdmins.map((a) => a.email).join(', ')
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(password, 12);

  let user;
  if (!existing) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: ADMIN.name,
        initials: ADMIN.initials,
        department: ADMIN.department,
        role: 'ADMIN',
        reportingPeriodType: 'MONTH',
      },
    });
    console.log('✅ Администратор создан: ' + ADMIN.name + ' <' + email + '>');
  } else if (process.env.FORCE_RESET === '1') {
    user = await prisma.user.update({
      where: { email },
      data: { passwordHash, role: 'ADMIN' },
    });
    console.log('🔁 Пароль администратора обновлён.');
  } else {
    user = existing;
    console.log('ℹ️  Пользователь с таким email уже есть — пароль не менялся (FORCE_RESET=1 для сброса).');
  }

  // 5. Запись в «Составе коллектива»
  const passport = await prisma.socialPassport.findFirst({ where: { userId: user.id } });
  if (!passport) {
    await prisma.socialPassport.create({
      data: {
        userId: user.id,
        fullName: ADMIN.name,
        department: ADMIN.department,
        position: ADMIN.position,
        accountUrl: ADMIN.name,
        notes: '',
      },
    });
  }

  console.log('✅ Начальное наполнение завершено. Пароль в логи не выводится.');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
