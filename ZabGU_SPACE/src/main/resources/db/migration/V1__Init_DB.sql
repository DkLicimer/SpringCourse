-- Создаем перечисляемый тип (ENUM) для статусов заявок
CREATE TYPE application_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Таблица для помещений
CREATE TABLE rooms (
                       id BIGSERIAL PRIMARY KEY,
                       name VARCHAR(255) NOT NULL,
                       address VARCHAR(255) NOT NULL,
                       capacity VARCHAR(100) NOT NULL,
                       image_path VARCHAR(255) NOT NULL
);

-- Таблица для сотрудников (администраторов)
CREATE TABLE employees (
                           id BIGSERIAL PRIMARY KEY,
                           login VARCHAR(100) UNIQUE NOT NULL,
                           password_hash VARCHAR(255) NOT NULL
);

-- Таблица для заявок на бронирование
CREATE TABLE applications (
                              id BIGSERIAL PRIMARY KEY,
                              room_id BIGINT NOT NULL REFERENCES rooms(id), -- ИЗМЕНЕНО
                              start_time TIMESTAMPTZ NOT NULL,
                              end_time TIMESTAMPTZ NOT NULL,
                              status application_status NOT NULL DEFAULT 'PENDING',
                              event_name VARCHAR(255) NOT NULL,
                              sound_engineer_required BOOLEAN NOT NULL DEFAULT FALSE,
                              applicant_full_name VARCHAR(255) NOT NULL,
                              applicant_position VARCHAR(255) NOT NULL,
                              applicant_email VARCHAR(255) NOT NULL,
                              applicant_phone VARCHAR(50) NOT NULL,
                              rejection_reason TEXT,
                              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Создадим индекс для быстрого поиска заявок по помещению и времени
CREATE INDEX idx_applications_room_id_start_time ON applications(room_id, start_time);

