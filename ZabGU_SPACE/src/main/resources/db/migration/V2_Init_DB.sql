-- Добавляем тестовые помещения
INSERT INTO rooms (name, address, capacity, image_path) VALUES
                                                            ('Актовый зал', 'ул. Александро-Заводская, 30', 'до 100 человек', 'css/images/roomOne.jpg'),
                                                            ('Конференц-зал', 'ул. Чкалова, 140', 'до 50 человек', 'css/images/roomTwo.jpg'),
                                                            ('Коворкинг "Точка Кипения"', 'ул. Ангарская, 34', 'до 150 человек', 'css/images/roomThree.jpg');

-- Добавляем первого администратора
-- Логин: admin, Пароль: admin (или тот, который ты выбрал)
INSERT INTO employees (login, password_hash) VALUES
    ('admin', '$2a$10$KE6v.xGAiIMfXZL3Ixyukem5R7pMbIKnQvek1SWXKJCuNcN5dF2J2');