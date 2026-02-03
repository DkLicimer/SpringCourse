<?php
// ===========================================================
// НАСТРОЙКИ TELEGRAM
// ===========================================================
$token = "8587332616:AAEQ1MM3Em1jh7L18JDA8vfDvPV2_jU35NQ"; 
$chat_id = "5509707292";

// ===========================================================
// ПОЛУЧЕНИЕ ДАННЫХ
// ===========================================================

// Если это не POST-запрос, отдаем ошибку
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(403);
    echo "Method not allowed";
    exit();
}

$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$privacy = isset($_POST['privacy']) ? 'Да' : 'Нет';

// Простая проверка
if (empty($name) || empty($phone)) {
    http_response_code(400);
    echo "Заполните обязательные поля";
    exit();
}

// ===========================================================
// ФОРМИРОВАНИЕ СООБЩЕНИЯ
// ===========================================================
$message = "🔥 <b>Новая заявка с сайта!</b>\n\n";
$message .= "👤 <b>Имя:</b> " . strip_tags($name) . "\n";
$message .= "📞 <b>Телефон:</b> " . strip_tags($phone) . "\n";
$message .= "✅ <b>Согласие:</b> " . $privacy . "\n";
$message .= "📅 <b>Дата:</b> " . date('d.m.Y H:i');

// ===========================================================
// ОТПРАВКА В TELEGRAM
// ===========================================================
$url = "https://api.telegram.org/bot{$token}/sendMessage";

$data = [
    'chat_id' => $chat_id,
    'text' => $message,
    'parse_mode' => 'HTML' // Позволяет использовать жирный шрифт
];

$options = [
    'http' => [
        'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
        'method'  => 'POST',
        'content' => http_build_query($data)
    ]
];

$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);

if ($result) {
    echo "Success";
} else {
    http_response_code(500);
    echo "Error";
}
?>