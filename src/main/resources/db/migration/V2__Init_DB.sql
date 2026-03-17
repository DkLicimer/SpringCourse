-- Добавляем тестовые помещения с правильными URL-путями
INSERT INTO rooms (name, address, capacity, image_path) VALUES
                                                            ('Актовый зал «Кулагин»', 'ул. Александро-Заводская, 30, 2 этаж', 'До 250 человек|Экран 2240х1080|Гримёрка 15 человек', '/images/actZalKulaginFirst.png'),
                                                            ('Единый офис молодежных организаций', 'ул. Бабушкина, 129, ауд. 236', 'До 50 человек|В наличии: модульные столы, офисные стулья, интерактивная доска', '/images/singleOfficeSecond.jpg'),
                                                            ('Танцевальный зал', 'ул. Бабушкина, 129, 6 этаж', 'До 50 человек|В пространстве есть зеркала в полный рост, 2 раздевалки, спортивные маты', '/images/danceHallThird.jpg');

-- Добавляем первого администратора
-- Логин: admin, Пароль: admin
INSERT INTO employees (login, password_hash) VALUES
    ('zabgumanager', '$2a$10$ZisLaMZJWnunIH7TdkgoS.FQpY5cfwjmFA6gc2tnkw9C9q1Rsed6q');