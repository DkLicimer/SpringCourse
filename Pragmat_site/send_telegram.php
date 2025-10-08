<?php
// Устанавливаем заголовок, чтобы браузер понимал, что ответ в формате JSON
header('Content-Type: application/json');

// Разрешаем запросы только методом POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Метод не разрешен']);
    exit;
}

// ========== ВАШИ СЕКРЕТНЫЕ ДАННЫЕ ==========
$botToken = '8410390332:AAHNXWyyVAkAbbru6GAcft8kW3lblj-0AWo'; // <-- ВАШ ТОКЕН
$chatId = '5509707292'; // <-- ВАШ ID ЧАТА
// ============================================

// Получаем данные из формы и очищаем их от лишних пробелов и тегов
$name = isset($_POST['name']) ? trim(strip_tags($_POST['name'])) : '';
$phone = isset($_POST['phone']) ? trim(strip_tags($_POST['phone'])) : '';

// Серверная проверка: убеждаемся, что поля не пустые
if (empty($name) || empty($phone)) {
    echo json_encode(['success' => false, 'message' => 'Пожалуйста, заполните все поля.']);
    exit;
}

// Составляем текст сообщения для Telegram
$message = "<b>Новая заявка с сайта!</b>\n";
$message .= "<b>Имя:</b> " . htmlspecialchars($name) . "\n";
$message .= "<b>Телефон:</b> " . htmlspecialchars($phone);

// Параметры для отправки в Telegram API
$params = [
    'chat_id' => $chatId,
    'text' => $message,
    'parse_mode' => 'HTML',
];

// Формируем URL для запроса
$url = 'https://api.telegram.org/bot' . $botToken . '/sendMessage?' . http_build_query($params);

// Отправляем запрос с помощью file_get_contents
// Знак @ подавляет стандартные ошибки PHP, мы обработаем их сами
$response = @file_get_contents($url);

// Проверяем ответ от Telegram
if ($response === false) {
    // Если не удалось отправить запрос (например, API Telegram недоступен)
    echo json_encode(['success' => false, 'message' => 'Ошибка отправки. Не удалось связаться с сервером Telegram.']);
} else {
    // Если все прошло успешно
    echo json_encode(['success' => true, 'message' => 'Заявка успешно отправлена!']);
}

exit; // Завершаем выполнение скрипта