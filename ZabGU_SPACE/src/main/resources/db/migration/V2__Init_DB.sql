-- Добавляем тестовые помещения
INSERT INTO rooms (name, address, capacity, image_path) VALUES
                                                            ('Актовый зал «Кулагин»', 'ул. Александро-Заводская, 30, 2 этаж', 'До 250 человек|Экран 2240х1080|Гримёрка 15 человек', 'ZabGU_WebSiteFrontend/css/images/actZalKulaginFirst.png'),
                                                            ('Единый офис молодежных организаций', 'ул. Бабушкина, 129, ауд. 236', 'До 50 человек|В наличии: модульные столы, офисные стулья, интерактивная доска', 'ZabGU_WebSiteFrontend/css/images/singleOfficeSecond.jpg'),
                                                            ('Танцевальный зал', 'ул. Бабушкина, 129, 6 этаж', 'До 50 человек|В пространстве есть зеркала в полный рост, 2 раздевалки, спортивные маты', 'ZabGU_WebSiteFrontend/css/images/danceHallThird.jpg');

-- Добавляем первого администратора
-- Логин: admin, Пароль: admin (или тот, который ты выбрал)
INSERT INTO employees (login, password_hash) VALUES
    ('admin', '$2a$10$KE6v.xGAiIMfXZL3Ixyukem5R7pMbIKnQvek1SWXKJCuNcN5dF2J2');