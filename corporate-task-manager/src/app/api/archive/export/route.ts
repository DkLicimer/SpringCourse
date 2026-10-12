// src/app/api/archive/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import zlib from "zlib";

// Простая реализация сборщика ZIP в памяти без внешних зависимостей (чистый Node.js)
function createZipBuffer(files: { name: string; content: string | Buffer }[]): Buffer {
  const fileRecords: {
    nameBuf: Buffer;
    dataBuf: Buffer;
    crc: number;
    offset: number;
  }[] = [];

  let currentOffset = 0;
  const parts: Buffer[] = [];

  // CRC-32 таблица
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[i] = c >>> 0;
  }

  function calcCrc32(buf: Buffer): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  for (const f of files) {
    const nameBuf = Buffer.from(f.name, "utf-8");
    const dataBuf = Buffer.isBuffer(f.content) ? f.content : Buffer.from(f.content, "utf-8");
    const crc = calcCrc32(dataBuf);

    // Local file header (30 байт + имя)
    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // Сигнатура
    localHeader.writeUInt16LE(20, 4);         // Версия
    localHeader.writeUInt16LE(0x0800, 6);     // Флаг (UTF-8)
    localHeader.writeUInt16LE(0, 8);          // Метод сжатия (0 = без сжатия)
    localHeader.writeUInt16LE(0, 10);         // Время
    localHeader.writeUInt16LE(0, 12);         // Дата
    localHeader.writeUInt32LE(crc, 14);       // CRC32
    localHeader.writeUInt32LE(dataBuf.length, 18); // Сжатый размер
    localHeader.writeUInt32LE(dataBuf.length, 22); // Несжатый размер
    localHeader.writeUInt16LE(nameBuf.length, 26); // Длина имени
    localHeader.writeUInt16LE(0, 28);              // Extra length
    nameBuf.copy(localHeader, 30);

    fileRecords.push({
      nameBuf,
      dataBuf,
      crc,
      offset: currentOffset,
    });

    parts.push(localHeader, dataBuf);
    currentOffset += localHeader.length + dataBuf.length;
  }

  const centralDirStart = currentOffset;
  let centralDirSize = 0;

  // Central Directory headers
  for (const r of fileRecords) {
    const cdHeader = Buffer.alloc(46 + r.nameBuf.length);
    cdHeader.writeUInt32LE(0x02014b50, 0); // Сигнатура
    cdHeader.writeUInt16LE(20, 4);         // Версия создания
    cdHeader.writeUInt16LE(20, 6);         // Версия для распаковки
    cdHeader.writeUInt16LE(0x0800, 8);     // Флаг UTF-8
    cdHeader.writeUInt16LE(0, 10);         // Метод (Store)
    cdHeader.writeUInt16LE(0, 12);         // Время
    cdHeader.writeUInt16LE(0, 14);         // Дата
    cdHeader.writeUInt32LE(r.crc, 16);     // CRC32
    cdHeader.writeUInt32LE(r.dataBuf.length, 20); // Сжатый
    cdHeader.writeUInt32LE(r.dataBuf.length, 24); // Несжатый
    cdHeader.writeUInt16LE(r.nameBuf.length, 28); // Имя
    cdHeader.writeUInt16LE(0, 30);                // Extra
    cdHeader.writeUInt16LE(0, 32);                // Comment
    cdHeader.writeUInt16LE(0, 34);                // Disk start
    cdHeader.writeUInt16LE(0, 36);                // Internal attr
    cdHeader.writeUInt32LE(0, 38);                // External attr
    cdHeader.writeUInt32LE(r.offset, 42);         // Офсет локального заголовка
    r.nameBuf.copy(cdHeader, 46);

    parts.push(cdHeader);
    centralDirSize += cdHeader.length;
  }

  // End of Central Directory (22 байта)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(fileRecords.length, 8);
  eocd.writeUInt16LE(fileRecords.length, 10);
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(centralDirStart, 16);
  eocd.writeUInt16LE(0, 20);

  parts.push(eocd);
  return Buffer.concat(parts);
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ разрешен только руководителю" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const defaultYear = now.getFullYear() - 1;
  const targetYear = parseInt(searchParams.get("year") || String(defaultYear), 10);

  const startDate = new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999));

  try {
    // 1. Загрузка задач за выбранный год
    const tasks = await prisma.task.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        goal: true,
        createdBy: { select: { id: true, name: true, email: true } },
        assignments: {
          include: {
            user: { select: { id: true, name: true, initials: true, department: true } },
            status: true,
          },
        },
        comments: {
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 2. Ежедневные отчеты за год
    const dailyReports = await prisma.dailyReport.findMany({
      where: {
        reportDate: { gte: startDate, lte: endDate },
      },
      include: {
        user: { select: { id: true, name: true, email: true, department: true } },
      },
      orderBy: { reportDate: "asc" },
    });

    // 3. Протоколы совещаний за год
    const protocols = await prisma.meetingProtocol.findMany({
      where: {
        meetingDate: { gte: startDate, lte: endDate },
      },
      include: {
        chairman: { select: { name: true } },
        secretary: { select: { name: true } },
        attendees: { select: { name: true } },
        tasks: { select: { id: true, taskNumber: true, title: true } },
      },
      orderBy: { meetingDate: "asc" },
    });

    // 4. Формирование CSV для задач
    const tasksCsvHeaders = [
      "№ Задачи",
      "Название",
      "Тема",
      "Создана",
      "Дедлайн",
      "Приоритет",
      "Исполнители",
      "Статус",
      "Отчет исполнителя",
      "Заметки руководителя"
    ];
    const tasksCsvRows = tasks.map((t) => [
      t.taskNumber ? `№${t.taskNumber}` : `№${t.id.slice(0, 4)}`,
      `"${(t.title || "").replace(/"/g, '""')}"`,
      `"${(t.goal?.title || "").replace(/"/g, '""')}"`,
      t.createdAt.toISOString().split("T")[0],
      t.deadline ? t.deadline.toISOString().split("T")[0] : "Без срока",
      t.isPriority ? "Да" : "Нет",
      `"${t.assignments.map((a) => a.user.name).join(", ")}"`,
      `"${t.assignments.map((a) => `${a.user.initials}:${a.status.name}`).join("; ")}"`,
      `"${t.assignments.map((a) => a.reportText || "").filter(Boolean).join(" | ").replace(/"/g, '""')}"`,
      `"${(t.adminNotes || "").replace(/"/g, '""')}"`,
    ]);
    const tasksCsv = "\uFEFF" + [tasksCsvHeaders.join(";"), ...tasksCsvRows.map((r) => r.join(";"))].join("\n");

    // 5. Формирование CSV для отчетов за день
    const reportsCsvHeaders = ["Дата", "Сотрудник", "Отдел", "Итог дня", "Задачи и комментарии"];
    const reportsCsvRows = dailyReports.map((r) => [
      r.dateStr,
      `"${r.user.name.replace(/"/g, '""')}"`,
      `"${(r.user.department || "").replace(/"/g, '""')}"`,
      `"${(r.generalComment || "").replace(/"/g, '""')}"`,
      `"${JSON.stringify(r.tasksData || []).replace(/"/g, '""')}"`,
    ]);
    const reportsCsv = "\uFEFF" + [reportsCsvHeaders.join(";"), ...reportsCsvRows.map((r) => r.join(";"))].join("\n");

    // 6. Формирование CSV для протоколов
    const protocolsCsvHeaders = ["Номер протокола", "Дата", "Тема", "Председатель", "Участники", "Решения", "Поручений"];
    const protocolsCsvRows = protocols.map((p) => [
      p.protocolNumber,
      p.meetingDate.toISOString().split("T")[0],
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.chairman.name.replace(/"/g, '""')}"`,
      `"${p.attendees.map((a) => a.name).join(", ")}"`,
      `"${(p.decisionsText || "").replace(/"/g, '""')}"`,
      p.tasks.length,
    ]);
    const protocolsCsv = "\uFEFF" + [protocolsCsvHeaders.join(";"), ...protocolsCsvRows.map((r) => r.join(";"))].join("\n");

    // 7. Полный JSON-дамп базы за период
    const fullDbDump = {
      archiveYear: targetYear,
      exportedAt: new Date().toISOString(),
      exportedBy: session.user.name,
      stats: {
        tasksCount: tasks.length,
        dailyReportsCount: dailyReports.length,
        protocolsCount: protocols.length,
      },
      data: {
        tasks,
        dailyReports,
        protocols,
      },
    };

    // 8. Сборка всех файлов в ZIP
    const zipBuffer = createZipBuffer([
      { name: `tasks_${targetYear}.csv`, content: tasksCsv },
      { name: `tasks_${targetYear}.json`, content: JSON.stringify(tasks, null, 2) },
      { name: `daily_reports_${targetYear}.csv`, content: reportsCsv },
      { name: `daily_reports_${targetYear}.json`, content: JSON.stringify(dailyReports, null, 2) },
      { name: `protocols_${targetYear}.csv`, content: protocolsCsv },
      { name: `protocols_${targetYear}.json`, content: JSON.stringify(protocols, null, 2) },
      { name: `database_backup_${targetYear}.json`, content: JSON.stringify(fullDbDump, null, 2) },
    ]);

    const filename = `TaskManager_Archive_${targetYear}.zip`;

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(zipBuffer.length),
      },
    });
  } catch (err: any) {
    console.error("Ошибка при создании годового архива:", err);
    return NextResponse.json({ error: "Ошибка сервера при экспорте: " + err.message }, { status: 500 });
  }
}