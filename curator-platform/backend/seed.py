import sys
import os
import uuid
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app import models, auth

def seed_database():
    print("Инициализация базы данных ЗабГУ...")
    
    # 1. Пересоздаем таблицы для чистого тестового состояния
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Таблицы базы данных успешно обновлены.")

    db = SessionLocal()
    try:
        # ================= 1. ПОЛЬЗОВАТЕЛИ =================
        print("\n1. Создание пользователей...")
        
        admin = models.User(
            username="admin",
            password_hash=auth.hash_password("admin123"),
            system_role="ADMIN"
        )
        db.add(admin)

        curator_ivanov = models.User(
            username="curator_ivanov",
            password_hash=auth.hash_password("curator123"),
            system_role="USER"
        )
        curator_petrova = models.User(
            username="curator_petrova",
            password_hash=auth.hash_password("curator123"),
            system_role="USER"
        )
        curator_sidorov = models.User(
            username="curator_sidorov",
            password_hash=auth.hash_password("curator123"),
            system_role="USER"
        )
        curator_smirnov = models.User(
            username="curator_smirnov",
            password_hash=auth.hash_password("curator123"),
            system_role="USER"
        )
        db.add_all([curator_ivanov, curator_petrova, curator_sidorov, curator_smirnov])
        db.commit()
        print("  ✓ Администратор (admin) и 4 куратора созданы.")

        # ================= 2. СПРАВОЧНИКИ И ДИНАМИЧЕСКИЕ ПОЛЯ =================
        print("\n2. Создание справочников и полей паспорта...")
        
        # Социальные категории
        cat_orphan = models.SocialCategory(name="Сирота / Опекаемый")
        cat_large_fam = models.SocialCategory(name="Многодетная семья")
        cat_dorm = models.SocialCategory(name="Иногородний (общежитие)")
        cat_disability = models.SocialCategory(name="Ограниченные возможности здоровья")
        cat_poor = models.SocialCategory(name="Малоимущая семья")
        cat_sport = models.SocialCategory(name="Член сборной ЗабГУ")
        db.add_all([cat_orphan, cat_large_fam, cat_dorm, cat_disability, cat_poor, cat_sport])

        # Студенческие организации
        org_studsovet = models.StudentOrganization(name="Студенческий совет ЗабГУ")
        org_media = models.StudentOrganization(name="Медиацентр ЗабГУ")
        org_volunteers = models.StudentOrganization(name="Волонтерский отряд «Импульс»")
        org_sno = models.StudentOrganization(name="Студенческое научное общество (СНО)")
        org_profbureau = models.StudentOrganization(name="Профбюро факультета")
        org_sport = models.StudentOrganization(name="Спортивный клуб «Байкал»")
        db.add_all([org_studsovet, org_media, org_volunteers, org_sno, org_profbureau, org_sport])

        # Динамические поля карточки студента
        field_phone = models.DynamicField(name="phone", label="Телефон студента", type="text", is_required=True)
        field_dorm_room = models.DynamicField(name="dorm_room", label="Номер комнаты в общежитии", type="number", is_required=False)
        field_parents = models.DynamicField(name="parents_contact", label="Контакты родителей", type="text", is_required=False)
        field_budget = models.DynamicField(name="is_budget", label="Бюджетная основа обучения", type="boolean", is_required=False)
        db.add_all([field_phone, field_dorm_room, field_parents, field_budget])

        db.commit()
        print("  ✓ Справочники категорий, организаций и динамических полей настроены.")

        # ================= 3. АКАДЕМИЧЕСКИЕ ГРУППЫ =================
        print("\n3. Создание академических групп...")
        
        group_pi23 = models.AcademicGroup(
            name="ПИ-23-1",
            faculty="Факультет цифровых технологий",
            training_direction="09.03.04 Программная инженерия",
            course=1
        )
        group_ib22 = models.AcademicGroup(
            name="ИБ-22-1",
            faculty="Факультет цифровых технологий",
            training_direction="10.03.01 Информационная безопасность",
            course=2
        )
        group_gd21 = models.AcademicGroup(
            name="ГД-21-1",
            faculty="Горный факультет",
            training_direction="21.05.04 Горное дело",
            course=3
        )
        db.add_all([group_pi23, group_ib22, group_gd21])
        db.commit()

        # Назначения ответственных лиц
        assign_pi_curator1 = models.GroupAssignment(
            user_id=curator_ivanov.id,
            academic_group_id=group_pi23.id,
            role_code="CURATOR"
        )
        assign_pi_curator2 = models.GroupAssignment(
            user_id=curator_petrova.id,
            academic_group_id=group_pi23.id,
            role_code="CURATOR"
        )
        assign_pi_proforg = models.GroupAssignment(
            user_id=curator_ivanov.id,
            academic_group_id=group_pi23.id,
            role_code="PROFORG",
            protocol_number="4-П",
            protocol_date=datetime(2026, 9, 15),
            protocol_file_url="http://localhost:8000/uploads/protocol_sample.pdf"
        )

        assign_ib_curator = models.GroupAssignment(
            user_id=curator_sidorov.id,
            academic_group_id=group_ib22.id,
            role_code="CURATOR"
        )

        assign_gd_curator = models.GroupAssignment(
            user_id=curator_smirnov.id,
            academic_group_id=group_gd21.id,
            role_code="CURATOR"
        )
        db.add_all([assign_pi_curator1, assign_pi_curator2, assign_pi_proforg, assign_ib_curator, assign_gd_curator])
        db.commit()
        print("  ✓ Группы созданы, назначены кураторы и зафиксирован протокол профорга.")

        # ================= 4. СТУДЕНТЫ И СОЦИАЛЬНЫЙ ПАСПОРТ =================
        print("\n4. Наполнение групп студентами...")
        
        students_pi = [
            ("Алексей", "Смирнов", "Игоревич", True, [cat_dorm], [org_studsovet], {"phone": "+7 (914) 111-22-33", "dorm_room": "412", "is_budget": "true"}),
            ("Екатерина", "Волкова", "Сергеевна", True, [cat_large_fam], [org_media], {"phone": "+7 (914) 222-33-44", "dorm_room": "", "is_budget": "true"}),
            ("Дмитрий", "Кузнецов", "Андреевич", False, [], [org_sport], {"phone": "+7 (914) 333-44-55", "dorm_room": "", "is_budget": "false"}),
            ("Анна", "Морозова", "Павловна", True, [cat_orphan], [org_volunteers, org_profbureau], {"phone": "+7 (914) 444-55-66", "dorm_room": "208", "is_budget": "true"}),
            ("Илья", "Попов", "Михайлович", True, [], [], {"phone": "+7 (914) 555-66-77", "dorm_room": "", "is_budget": "true"}),
            ("София", "Васильева", "Денисовна", False, [cat_poor], [], {"phone": "+7 (914) 666-77-88", "dorm_room": "", "is_budget": "false"}),
            ("Максим", "Новиков", "Олегович", True, [cat_dorm, cat_sport], [org_sno], {"phone": "+7 (914) 777-88-99", "dorm_room": "415", "is_budget": "true"}),
            ("Полина", "Федорова", "Романовна", True, [], [org_media], {"phone": "+7 (914) 888-99-00", "dorm_room": "", "is_budget": "true"}),
        ]

        for first, last, middle, union, cats, orgs, dyns in students_pi:
            st = models.Student(
                academic_group_id=group_pi23.id,
                first_name=first,
                last_name=last,
                middle_name=middle,
                is_union_member=union,
                social_categories=cats,
                organizations=orgs
            )
            db.add(st)
            db.commit()
            db.refresh(st)

            for f_name, f_val in dyns.items():
                target_field = field_phone if f_name == "phone" else field_dorm_room if f_name == "dorm_room" else field_budget
                if f_val:
                    db.add(models.StudentDynamicValue(
                        student_id=st.id,
                        field_id=target_field.id,
                        value=f_val
                    ))
            db.commit()

        students_ib = [
            ("Кирилл", "Лебедев", "Викторович", True, [cat_dorm], [org_sno]),
            ("Виктория", "Козлова", "Евгеньевна", True, [cat_large_fam], [org_studsovet]),
            ("Артем", "Соколов", "Дмитриевич", False, [], []),
            ("Алина", "Павлова", "Артемовна", True, [cat_sport], [org_volunteers]),
        ]
        for first, last, middle, union, cats, orgs in students_ib:
            st = models.Student(
                academic_group_id=group_ib22.id,
                first_name=first,
                last_name=last,
                middle_name=middle,
                is_union_member=union,
                social_categories=cats,
                organizations=orgs
            )
            db.add(st)
        db.commit()
        print("  ✓ Студенты добавлены с QR-токенами и заполненными социальными паспортами.")

        # ================= 5. ЗАДАЧИ И ОТЧЕТЫ КУРАТОРОВ =================
        print("\n5. Создание плановых задач, фотоотчетов и проверок...")
        
        task1 = models.Task(
            title="Организационный кураторский час",
            description="Ознакомление студентов 1 курса со структурой университета, уставом и графиком учебного процесса.",
            category="mandatory",
            type="photo_proof",
            due_date=datetime.utcnow() + timedelta(days=5),
            points=15,
            requirements="Явка не менее 75% группы",
            confirmation_requirements="Общая фотография группы с куратором в аудитории"
        )
        db.add(task1)
        db.commit()
        db.refresh(task1)

        exe1_ivanov = models.TaskExecution(
            task_id=task1.id,
            curator_id=curator_ivanov.id,
            status="APPROVED",
            points_awarded=15,
            photo_url="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800",
            completed_at=datetime.utcnow() - timedelta(days=2)
        )
        exe1_petrova = models.TaskExecution(
            task_id=task1.id,
            curator_id=curator_petrova.id,
            status="PENDING",
            points_awarded=0,
            photo_url="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800",
            completed_at=datetime.utcnow() - timedelta(hours=3)
        )
        exe1_sidorov = models.TaskExecution(
            task_id=task1.id,
            curator_id=curator_sidorov.id,
            status="REVISION",
            points_awarded=0,
            admin_comment="На фотографии не видно присутствия самого куратора. Пожалуйста, прикрепите общее фото.",
            completed_at=datetime.utcnow() - timedelta(days=1)
        )
        db.add_all([exe1_ivanov, exe1_petrova, exe1_sidorov])

        task2 = models.Task(
            title="Заполнение электронного социального паспорта",
            description="Сбор и внесение сведений об иногородних студентах, льготных категориях и контактах родителей.",
            category="mandatory",
            type="no_proof",
            due_date=datetime.utcnow() + timedelta(days=10),
            points=10,
            requirements="100% заполненность полей"
        )
        db.add(task2)
        db.commit()
        db.refresh(task2)

        exe2_ivanov = models.TaskExecution(
            task_id=task2.id,
            curator_id=curator_ivanov.id,
            status="APPROVED",
            points_awarded=10,
            completed_at=datetime.utcnow() - timedelta(days=1)
        )
        exe2_petrova = models.TaskExecution(
            task_id=task2.id,
            curator_id=curator_petrova.id,
            status="NOT_STARTED",
            points_awarded=0
        )
        db.add_all([exe2_ivanov, exe2_petrova])
        db.commit()
        print("  ✓ Задачи распределены по кураторам.")

        # ================= 6. МЕРОПРИЯТИЯ И КАЛЕНДАРЬ =================
        print("\n6. Формирование календарных событий...")
        event1 = models.Event(
            title="Торжественная линейка и День первокурсника ЗабГУ",
            description="Праздничное открытие учебного года на главной площади перед учебным корпусом.",
            date_time=datetime.utcnow() + timedelta(days=2, hours=3),
            location="Актовый зал главного корпуса, ул. Александро-Заводская, 30",
            category="Торжественные",
            is_mandatory=True,
            associated_task_id=task1.id
        )
        event1.groups = [group_pi23, group_ib22]

        event2 = models.Event(
            title="Инструктаж по антитеррористической безопасности и ПБ",
            description="Обязательный инструктаж со студентами 1-2 курсов.",
            date_time=datetime.utcnow() + timedelta(days=4, hours=5),
            location="Аудитория 314",
            category="Профилактические",
            is_mandatory=True
        )
        event2.groups = [group_pi23]
        db.add_all([event1, event2])
        db.commit()

        # ================= 7. ПОСЕЩАЕМОСТЬ И QR =================
        print("\n7. Создание сессий посещаемости...")
        all_pi_students = db.query(models.Student).filter(models.Student.academic_group_id == group_pi23.id).all()
        
        session_pi = models.AttendanceSession(
            academic_group_id=group_pi23.id,
            title="Кураторский час: Знакомство с традициями университета",
            date=datetime.utcnow() - timedelta(days=1)
        )
        db.add(session_pi)
        db.commit()
        db.refresh(session_pi)

        for idx, st in enumerate(all_pi_students):
            is_pres = idx in [0, 1, 3, 4, 6, 7]
            method_used = "qr" if idx in [0, 1, 3] else "manual"
            db.add(models.AttendanceRecord(
                session_id=session_pi.id,
                student_id=st.id,
                is_present=is_pres,
                method=method_used
            ))
        db.commit()
        print("  ✓ Сессия посещаемости создана.")

        # ================= 8. АНКЕТЫ И ОТВЕТЫ КУРАТОРОВ =================
        print("\n8. Создание анкеты и генерация ответов...")
        survey1 = models.Survey(
            title="Мониторинг адаптации первокурсников (1 модуль)",
            description="Опрос кураторов о социально-психологическом климате в учебных группах.",
            is_mandatory=True,
            expires_at=datetime.utcnow() + timedelta(days=14)
        )
        db.add(survey1)
        db.commit()
        db.refresh(survey1)

        q1 = models.SurveyQuestion(survey_id=survey1.id, text="Сколько студентов проживают в общежитии?", type="number")
        q2 = models.SurveyQuestion(survey_id=survey1.id, text="Избран ли староста и профорг группы?", type="single_choice", options="Да; Нет; В процессе")
        q3 = models.SurveyQuestion(survey_id=survey1.id, text="Оцените уровень вовлеченности группы от 1 до 5", type="scale")
        q4 = models.SurveyQuestion(survey_id=survey1.id, text="Какие трудности возникли у студентов на первой неделе?", type="long_text")
        db.add_all([q1, q2, q3, q4])
        db.commit()

        db.add(models.SurveyAnswer(question_id=q1.id, curator_id=curator_ivanov.id, value="3"))
        db.add(models.SurveyAnswer(question_id=q2.id, curator_id=curator_ivanov.id, value="Да"))
        db.add(models.SurveyAnswer(question_id=q3.id, curator_id=curator_ivanov.id, value="5"))
        db.add(models.SurveyAnswer(question_id=q4.id, curator_id=curator_ivanov.id, value="Трудностей с расписанием нет, коллектив дружный."))
        db.commit()
        print("  ✓ Анкета создана и заполнена.")

        # ================= 9. САНКЦИИ И УВЕДОМЛЕНИЯ =================
        print("\n9. Добавление корректировок баллов, взысканий и уведомлений...")
        
        db.add(models.PointAdjustment(
            curator_id=curator_ivanov.id,
            points=10,
            reason="За организацию участия группы в субботнике",
            admin_id=admin.id
        ))

        db.add(models.DisciplinaryMark(
            curator_id=curator_smirnov.id,
            reason="Систематическая неявка на совещания кураторов факультета",
            is_active=True,
            admin_id=admin.id
        ))

        db.add(models.Notification(
            curator_id=curator_ivanov.id,
            text="Ваш фотоотчет по задаче 'Организационный кураторский час' успешно одобрен. Начислено 15 баллов!",
            type="review",
            is_read=False
        ))
        db.add(models.Notification(
            curator_id=curator_petrova.id,
            text="Опубликована новая обязательная анкета: 'Мониторинг адаптации первокурсников'.",
            type="survey",
            is_read=False
        ))
        db.add(models.Notification(
            curator_id=curator_sidorov.id,
            text="Отчет по задаче 'Организационный кураторский час' возвращен на доработку.",
            type="review",
            is_read=False
        ))
        db.commit()
        print("  ✓ Санкции, поощрения и уведомления записаны.")

        print("\n" + "="*60)
        print("БАЗА ДАННЫХ УСПЕШНО НАПОЛНЕНА ТЕСТОВЫМИ ДАННЫМИ!")
        print("="*60)
        print("Учетные записи для тестирования:")
        print("  [АДМИНИСТРАТОР]:  логин: admin            | пароль: admin123")
        print("  [КУРАТОР №1]:     логин: curator_ivanov   | пароль: curator123 (Группа ПИ-23-1, 1 место)")
        print("  [КУРАТОР №2]:     логин: curator_petrova  | пароль: curator123 (Группа ПИ-23-1, отчет на проверке)")
        print("  [КУРАТОР №3]:     логин: curator_sidorov  | пароль: curator123 (Группа ИБ-22-1, доработка)")
        print("  [КУРАТОР №4]:     логин: curator_smirnov  | пароль: curator123 (Группа ГД-21-1, отметка ⚠)")
        print("="*60)

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()