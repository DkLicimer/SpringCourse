<?php
// Сообщаем браузеру, что будем отвечать в формате JSON
header('Content-Type: application/json');

// Проверяем, что запрос пришел методом POST. Если нет - прерываем выполнение.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Метод не разрешен']);
    exit;
}

// ========== ВАШИ СЕКРЕТНЫЕ ДАННЫЕ ==========
$botToken = '8410390332:AAHNXWyyVAkAbbru6GAcft8kW3lblj-0AWo'; // <-- ВАШ ТОКЕН
$chatId = '5509707292'; // <-- ВАШ ID ЧАТА
// ============================================

// Безопасно получаем данные из формы
$name = isset($_POST['name']) ? trim(strip_tags($_POST['name'])) : '';
$phone = isset($_POST['phone']) ? trim(strip_tags($_POST['phone'])) : '';

// Серверная валидация: проверяем, что поля не пустые
if (empty($name) || empty($phone)) {
    echo json_encode(['success' => false, 'message' => 'Серверная ошибка: Имя и телефон являются обязательными полями.']);
    exit;
}

// Формируем сообщение для Telegram
$message = "<b>Новая заявка с сайта!</b>\n";
$message .= "<b>Имя:</b> " . htmlspecialchars($name) . "\n";
$message .= "<b>Телефон:</b> " . htmlspecialchars($phone);

// Параметры для запроса к Telegram API
$params = [
    'chat_id' => $chatId,
    'text' => $message,
    'parse_mode' => 'HTML',
];

// Формируем URL для отправки
$url = 'https://api.telegram.org/bot' . $botToken . '/sendMessage?' . http_build_query($params);

// Отправляем запрос. Знак @ подавляет ошибки, мы обработаем их вручную.
$response = @file_get_contents($url);

// Проверяем результат
if ($response === false) {
    // Если не удалось отправить, возвращаем ошибку
    echo json_encode(['success' => false, 'message' => 'Ошибка отправки. Не удалось связаться с сервером Telegram.']);
} else {
    // Если все успешно, возвращаем успех
    echo json_encode(['success' => true, 'message' => 'Заявка успешно отправлена!']);
}

exit; // Завершаем выполнение скрипта