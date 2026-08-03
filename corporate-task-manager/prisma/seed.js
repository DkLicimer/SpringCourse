// prisma/seed.js
require('dotenv').config();

// Очищаем глобальные переменные Windows, чтобы они не перебивали наш .env
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

async function main() {
  console.log('🧹 Очистка старых данных перед заполнением...');
  
  await prisma.notification.deleteMany({});
  await prisma.calendarEvent.deleteMany({});
  await prisma.teambuilding.deleteMany({});
  await prisma.socialPassport.deleteMany({});
  await prisma.postRequest.deleteMany({});
  await prisma.contentPlan.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.taskAssignment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.tableAccess.deleteMany({});
  await prisma.goal.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.taskStatus.deleteMany({});

  console.log('🚀 Наполнение базы данных тестовыми записями...');

  // 1. Создаем дефолтные статусы задач
  const statusTodo = await prisma.taskStatus.create({
    data: { id: 'status-todo', name: 'В очереди', color: '#64748b', isDefault: true, position: 1 },
  });

  const statusInProgress = await prisma.taskStatus.create({
    data: { id: 'status-in-progress', name: 'Взял в работу', color: '#3b82f6', isDefault: true, position: 2 },
  });

  const statusDone = await prisma.taskStatus.create({
    data: { id: 'status-done', name: 'Исполнено', color: '#10b981', isDefault: true, position: 3 },
  });

  // 2. Создаем системную цель "Текучка" и новые глобальные цели
  const goalCurrent = await prisma.goal.create({
    data: { id: 'goal-current-tasks', title: 'Текучка', color: '#94a3b8', isTemplate: true },
  });

  const goalMarketing = await prisma.goal.create({
    data: { title: 'Осенний Маркетинг', color: '#f97316' }, // Оранжевый
  });

  const goalRebranding = await prisma.goal.create({
    data: { title: 'Ребрендинг Сайта', color: '#8b5cf6' }, // Фиолетовый
  });

  // 3. Хешируем пароли для пользователей
  const adminPassword = await bcrypt.hash('admin12345', 10);
  const employeePassword = await bcrypt.hash('employee123', 10);

  // Создаем Администратора
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      passwordHash: adminPassword,
      name: 'Иван Иванов (Админ)',
      initials: 'ИИ',
      role: 'ADMIN',
    },
  });

  // Создаем трех сотрудников
  const petrov = await prisma.user.create({
    data: {
      email: 'petrov@mail.com',
      passwordHash: employeePassword,
      name: 'Петров Петр Петрович',
      initials: 'ПП',
      role: 'EMPLOYEE',
    },
  });

  const ivanova = await prisma.user.create({
    data: {
      email: 'ivanova@mail.com',
      passwordHash: employeePassword,
      name: 'Иванова Анна Сергеевна',
      initials: 'ИА',
      role: 'EMPLOYEE',
    },
  });

  const smirnov = await prisma.user.create({
    data: {
      email: 'smirnov@mail.com',
      passwordHash: employeePassword,
      name: 'Смирнов Алексей Игоревич',
      initials: 'СА',
      role: 'EMPLOYEE',
    },
  });

  // 4. Распределяем права доступа на таблицы для сотрудников
  await prisma.tableAccess.createMany({
    data: [
      { userId: petrov.id, tableName: 'social_passport', canRead: true, canWrite: true },
      { userId: petrov.id, tableName: 'teambuilding', canRead: true, canWrite: false },
      { userId: petrov.id, tableName: 'content_plan', canRead: true, canWrite: true },
      { userId: petrov.id, tableName: 'post_request', canRead: true, canWrite: true },
      
      { userId: ivanova.id, tableName: 'social_passport', canRead: true, canWrite: true },
      { userId: ivanova.id, tableName: 'teambuilding', canRead: true, canWrite: true },
      { userId: ivanova.id, tableName: 'content_plan', canRead: true, canWrite: true },
      { userId: ivanova.id, tableName: 'post_request', canRead: true, canWrite: true },

      { userId: smirnov.id, tableName: 'social_passport', canRead: true, canWrite: false },
      { userId: smirnov.id, tableName: 'teambuilding', canRead: false, canWrite: false },
      { userId: smirnov.id, tableName: 'content_plan', canRead: true, canWrite: false },
      { userId: smirnov.id, tableName: 'post_request', canRead: true, canWrite: true },
    ],
  });

  // 5. Создаем тестовые Задачи
  const deadlineTomorrow = new Date();
  deadlineTomorrow.setDate(deadlineTomorrow.getDate() + 1);

  const urgentTask = await prisma.task.create({
    data: {
      title: 'Устранить уязвимость на боевом сервере',
      description: 'Обнаружена критическая ошибка в системе авторизации. Требуется срочный патч безопасности.',
      deadline: deadlineTomorrow,
      isPriority: true,
      intermediateControl: true,
      adminNotes: 'Контролирует лично админ',
      goalId: goalCurrent.id,
      createdById: adminUser.id,
    },
  });

  await prisma.taskAssignment.create({
    data: { taskId: urgentTask.id, userId: smirnov.id, statusId: statusInProgress.id },
  });

  const deadlineInThreeDays = new Date();
  deadlineInThreeDays.setDate(deadlineInThreeDays.getDate() + 3);

  const marketingTask = await prisma.task.create({
    data: {
      title: 'Подготовить баннеры для таргета VK',
      description: 'Отрисовать 3 варианта рекламных баннеров для запуска осенней кампании.',
      deadline: deadlineInThreeDays,
      assignmentType: 'SIMULTANEOUS',
      goalId: goalMarketing.id,
      createdById: adminUser.id,
    },
  });

  await prisma.taskAssignment.createMany({
    data: [
      { taskId: marketingTask.id, userId: petrov.id, statusId: statusTodo.id },
      { taskId: marketingTask.id, userId: ivanova.id, statusId: statusInProgress.id },
    ],
  });

  const chainTask = await prisma.task.create({
    data: {
      title: 'Написание и согласование ТЗ ребрендинга',
      description: 'Этап 1: Смирнов пишет ТЗ. Этап 2: Петров делает смету по ТЗ.',
      assignmentType: 'SEQUENTIAL',
      goalId: goalRebranding.id,
      createdById: adminUser.id,
    },
  });

  await prisma.taskAssignment.createMany({
    data: [
      { taskId: chainTask.id, userId: smirnov.id, statusId: statusInProgress.id, sequenceOrder: 0, isBlocked: false },
      { taskId: chainTask.id, userId: petrov.id, statusId: statusTodo.id, sequenceOrder: 1, isBlocked: true },
    ],
  });

  await prisma.comment.create({
    data: {
      taskId: marketingTask.id,
      userId: petrov.id,
      text: 'Первые наброски макетов загрузил на Яндекс.Диск, ссылка в описании.',
    },
  });

  // 6. Справочник контактов
  await prisma.contact.createMany({
    data: [
      { fullName: 'Алексеев Дмитрий Васильевич', department: 'IT-отдел', position: 'Системный администратор', phone: '+7 (999) 111-22-33', email: 'admin_dima@company.com', notes: 'Кабинет 302, внутренний номер 104' },
      { fullName: 'Кузнецова Елена Павловна', department: 'Отдел кадров', position: 'HR-директор', phone: '+7 (999) 444-55-66', email: 'hr_elena@company.com', notes: 'По всем вопросам отпусков и оформлений' },
      { fullName: 'Васильев Сергей Юрьевич', department: 'Юридический отдел', position: 'Ведущий юрист', phone: '+7 (999) 777-88-99', email: 'lawyer_sergey@company.com' },
    ],
  });

  // 7. Состав коллектива (ПЕРЕИМЕНОВАНО И ИСПРАВЛЕНО!)
  await prisma.socialPassport.createMany({
    data: [
      { department: 'Администрация ДДМа', accountUrl: 'Сидоренко Наталья Владимировна', followers: 101, notes: 'Директор, общий контроль процессов' },
      { department: 'Художественное направление', accountUrl: 'Петров Петр Петрович', followers: 204, notes: 'Педагог доп. образования, руководитель студии рисования' },
      { department: 'ИТ и Робототехника', accountUrl: 'Смирнов Алексей Игоревич', followers: 302, notes: 'Педагог, куратор направления программирования' },
    ],
  });

  // 8. Командообразование
  const teamDate = new Date();
  teamDate.setDate(teamDate.getDate() + 15);

  await prisma.teambuilding.createMany({
    data: [
      { eventName: 'Осенний выезд на пейнтбол', date: teamDate, budget: 45000.0, participantsCount: 18, notes: 'Заказан трансфер от офиса на 10:00' },
      { eventName: 'Новогодний корпоратив 2027', date: new Date('2026-12-25'), budget: 150000.0, participantsCount: 45, notes: 'Ресторан забронирован, предоплата внесена' },
    ],
  });

  // 9. Контент-план
  const planDate1 = new Date();
  planDate1.setDate(planDate1.getDate() + 2);
  const planDate2 = new Date();
  planDate2.setDate(planDate2.getDate() - 1);

  await prisma.contentPlan.create({
    data: {
      topic: 'Анонс осенней распродажи',
      platform: 'VK',
      publishDate: planDate1,
      status: 'Черновик',
      authorId: adminUser.id,
      notes: 'Прикрепить ссылку на новые товары',
    },
  });

  await prisma.contentPlan.create({
    data: {
      topic: 'Поздравление системного администратора',
      platform: 'Telegram',
      publishDate: planDate2,
      status: 'Опубликовано',
      authorId: petrov.id,
    },
  });

  // Заявка на пост
  await prisma.postRequest.create({
    data: {
      topic: 'Заявка: Статья об ИТ-технологиях в компании',
      description: 'Хотим написать большую статью о переходе на Docker. Текст подготовлен.',
      platform: 'Сайт',
      requestedDate: deadlineInThreeDays,
      status: 'PENDING',
      userId: ivanova.id,
    },
  });

  // 10. Динамическое наполнение сетки Календаря под текущую неделю
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const startMon = new Date(monday);
  startMon.setHours(10, 0, 0, 0);
  const endMon = new Date(startMon);
  endMon.setHours(11, 30, 0, 0);

  const startTue = new Date(monday);
  startTue.setDate(monday.getDate() + 1);
  startTue.setHours(14, 0, 0, 0);
  const endTue = new Date(startTue);
  endTue.setHours(15, 0, 0, 0);

  const startWed = new Date(monday);
  startWed.setDate(monday.getDate() + 2);
  startWed.setHours(11, 0, 0, 0);
  const endWed = new Date(startWed);
  endWed.setHours(13, 0, 0, 0);

  await prisma.calendarEvent.createMany({
    data: [
      { title: 'Еженедельная планерка команды', startTime: startMon, endTime: endMon, type: 'MEETING', bookedById: petrov.id, description: 'Обсуждение задач на неделю и планов по маркетингу' },
      { title: 'Согласование бюджета тимбилдинга', startTime: startTue, endTime: endTue, type: 'MEETING', bookedById: ivanova.id },
      { title: 'Личные задачи (Время занято)', startTime: startWed, endTime: endWed, type: 'BLOCKED', bookedById: adminUser.id, description: 'Выездное совещание в министерстве' },
    ],
  });

  // 11. Пару начальных уведомлений
  await prisma.notification.create({
    data: {
      userId: petrov.id,
      text: 'Вам назначена новая параллельная задача: "Подготовить баннеры для таргета VK"',
      link: '/app/tasks',
    },
  });

  console.log('✅ База данных успешно заполнена реалистичными демо-данными!');
  console.log('------------------------------------------------------------');
  console.log('Вы можете войти под следующими учетными записями:');
  console.log('👤 Руководитель: admin@company.com  | Пароль: admin12345');
  console.log('👤 Сотрудник 1:  petrov@mail.com     | Пароль: employee123');
  console.log('👤 Сотрудник 2:  ivanova@mail.com    | Пароль: employee123');
  console.log('👤 Сотрудник 3:  smirnov@mail.com    | Пароль: employee123');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка заполнения тестовых данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });