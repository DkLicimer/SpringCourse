// prisma/create-deputy-admin.js
require('dotenv').config();

// Очищаем конфликтующие переменные Windows
delete process.env.PGUSER;
delete process.env.PGPASSWORD;
delete process.env.PGHOST;
delete process.env.PGPORT;
delete process.env.PGDATABASE;

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const bcrypt = require('bcryptjs');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ==========================================
// ⚙️ ДАННЫЕ ДЛЯ НОВОЙ УЧЕТНОЙ ЗАПИСИ ЗАМА
// (можете изменить почту, ФИО и пароль)
// ==========================================
const DEPUTY_DATA = {
  email: 'deputy@company.com',
  password: 'deputyPassword123',
  name: 'Смирнова Елена Викторовна (Зам. руководителя)',
  initials: 'СЕВ',
  department: 'Руководство',
  role: 'ADMIN', // Права полного администратора системы
  reportingPeriodType: 'MONTH',
};

async function main() {
  console.log(`🔍 Проверка наличия пользователя ${DEPUTY_DATA.email}...`);

  const passwordHash = await bcrypt.hash(DEPUTY_DATA.password, 10);

  // Используем upsert: если пользователь уже есть — обновит пароль и роль, если нет — создаст с нуля
  const user = await prisma.user.upsert({
    where: { email: DEPUTY_DATA.email },
    update: {
      name: DEPUTY_DATA.name,
      initials: DEPUTY_DATA.initials,
      role: DEPUTY_DATA.role,
      department: DEPUTY_DATA.department,
      passwordHash: passwordHash,
    },
    create: {
      email: DEPUTY_DATA.email,
      passwordHash: passwordHash,
      name: DEPUTY_DATA.name,
      initials: DEPUTY_DATA.initials,
      role: DEPUTY_DATA.role,
      department: DEPUTY_DATA.department,
      reportingPeriodType: DEPUTY_DATA.reportingPeriodType,
    },
  });

  // Автоматически синхронизируем запись в таблице «Состав коллектива»
  const existingPassport = await prisma.socialPassport.findFirst({
    where: { userId: user.id },
  });

  if (!existingPassport) {
    await prisma.socialPassport.create({
      data: {
        userId: user.id,
        fullName: user.name,
        department: user.department || 'Руководство',
        position: 'Заместитель руководителя',
        accountUrl: user.name,
        notes: 'Учетная запись заместителя руководителя с полными правами управления',
      },
    });
  }

  console.log('✅ Учетная запись заместителя успешно создана/обновлена!');
  console.log('------------------------------------------------------------');
  console.log('Данные для входа в систему:');
  console.log(`📧 Email:    ${DEPUTY_DATA.email}`);
  console.log(`🔑 Пароль:   ${DEPUTY_DATA.password}`);
  console.log(`👑 Роль:     ${DEPUTY_DATA.role} (Полный доступ)`);
  console.log('------------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при создании учетной записи:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });