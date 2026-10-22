import os
import uuid
import shutil
from datetime import datetime, timezone, timedelta, date
from fastapi import FastAPI, UploadFile, File, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.database import engine, Base, SessionLocal
from app.core.security import hash_password

# 1. Модели всех модулей
from app.modules.auth.models import User, UserRole
from app.modules.booking.models import Room, SpaceBooking, SpaceBookingStatus, Cabin, CabinCategory, RecreationBooking, RecreationBookingStatus, RecreationUserRole, Guest
from app.modules.curators.models import AcademicGroup, Student, GroupAssignment, AttendanceSession, AttendanceRecord, Task, TaskExecution
from app.modules.calendar.models import UniversityEvent, EventCategory, TargetAudienceType
from app.modules.rating.models import StudentAchievement, AchievementCategory, AchievementLevel, AchievementStatus
from app.modules.dormitories.models import Dormitory, DormRoom, DormBed, RoomGenderPolicy, DormApplication, DormApplicationType, DormApplicationStatus, DormStay, DormStayStatus
from app.modules.mobility.models import MobilityTrip, MobilityTripType, MobilityTripStatus, MobilityApprovalStep, ApprovalStage, MobilityReport
from app.modules.ddm.models import DDMProfile, DDMFamilyMember, DDMAuditLog, BenefitCategory, DDMAuditAction
from app.modules.ddm.crypto import encrypt_value
from app.modules.learning.models import Course, CourseLesson, QuizQuestion, QuizOption, CourseTargetRole, CourseEnrollment, EnrollmentStatus

# 2. Роутеры всех модулей
from app.modules.auth.router import router as auth_router
from app.modules.booking.router import router as booking_router
from app.modules.curators.router import router as curators_router
from app.modules.calendar.router import router as calendar_router
from app.modules.rating.router import router as rating_router
from app.modules.dormitories.router import router as dormitories_router
from app.modules.mobility.router import router as mobility_router
from app.modules.ddm.router import router as ddm_router
from app.modules.learning.router import router as learning_router

Base.metadata.create_all(bind=engine)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="UniCampus Unified Ecosystem API",
    version="1.0.0",
    description="Единая цифровая экосистема университета ЗабГУ",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(auth_router, prefix="/api")
app.include_router(booking_router, prefix="/api")
app.include_router(curators_router, prefix="/api")
app.include_router(calendar_router, prefix="/api")
app.include_router(rating_router, prefix="/api")
app.include_router(dormitories_router, prefix="/api")
app.include_router(mobility_router, prefix="/api")
app.include_router(ddm_router, prefix="/api")
app.include_router(learning_router, prefix="/api")


@app.post("/api/upload", status_code=status.HTTP_201_CREATED, tags=["Файловое хранилище"])
def upload_file(file: UploadFile = File(...)):
    """Универсальная загрузка файлов платформы"""
    try:
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {"url": f"/uploads/{unique_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Не удалось сохранить файл: {str(e)}")


@app.on_event("startup")
def init_system_demo_data():
    """Генерация комплексных демонстрационных данных по всем 9 модулям"""
    db = SessionLocal()
    now = datetime.now(timezone.utc)
    try:
        # ==================== 1. УЧЕТНЫЕ ЗАПИСИ (USERS) ====================
        if not db.query(User).filter(User.username == "curator_petrova").first():
            users_to_add = [
                User(username="admin", email="admin@university.ru", full_name="Главный Администратор", role=UserRole.ADMIN, password_hash=hash_password("admin123"), is_ddm_officer=True),
                User(username="curator_ivanov", email="ivanov@university.ru", full_name="Иванов Иван Иванович (Куратор ПИ)", role=UserRole.CURATOR, password_hash=hash_password("curator123")),
                User(username="curator_petrova", email="petrova@university.ru", full_name="Петрова Анна Сергеевна (Куратор ИБ)", role=UserRole.CURATOR, password_hash=hash_password("curator123")),
                User(username="head_curator_sidorov", email="sidorov@university.ru", full_name="Сидоров Михаил Юрьевич (Старший куратор ФЦТ)", role=UserRole.HEAD_CURATOR, password_hash=hash_password("curator123")),
                User(username="student_smirnov", email="smirnov@university.ru", full_name="Смирнов Алексей Игоревич (Студент)", role=UserRole.STUDENT, password_hash=hash_password("student123")),
                User(username="student_volkova", email="volkova@university.ru", full_name="Волкова Екатерина Сергеевна (Студентка)", role=UserRole.STUDENT, password_hash=hash_password("student123")),
                User(username="student_kuznetsov", email="kuznetsov@university.ru", full_name="Кузнецов Дмитрий Андреевич (Студент)", role=UserRole.STUDENT, password_hash=hash_password("student123")),
                User(username="staff_petrov", email="petrov@university.ru", full_name="Петров Петр Петрович (Преподаватель)", role=UserRole.STAFF, password_hash=hash_password("staff123")),
                User(username="moderator_spaces", email="spaces@university.ru", full_name="Диспетчер Аудиторий", role=UserRole.MODERATOR_SPACES, password_hash=hash_password("moderator123")),
                User(username="moderator_rating", email="rating@university.ru", full_name="Комиссия ПГАС (Модератор)", role=UserRole.MODERATOR_RATING, password_hash=hash_password("moderator123")),
                User(username="moderator_ddm", email="ddm_mod@university.ru", full_name="Смирнова Елена Викторовна (Офицер ДДМ)", role=UserRole.MODERATOR_DDM, password_hash=hash_password("ddm123"), is_ddm_officer=True),
            ]
            for u in users_to_add:
                if not db.query(User).filter(User.username == u.username).first():
                    db.add(u)
            db.commit()

        admin = db.query(User).filter(User.username == "admin").first()
        curator1 = db.query(User).filter(User.username == "curator_ivanov").first()
        student1 = db.query(User).filter(User.username == "student_smirnov").first()
        student2 = db.query(User).filter(User.username == "student_volkova").first()
        student3 = db.query(User).filter(User.username == "student_kuznetsov").first()

        # ==================== 2. АУДИТОРИИ И БРОНИРОВАНИЯ ====================
        if db.query(Room).count() <= 2:
            rooms = [
                Room(name="Актовый зал «Кулагин»", address="ул. Александро-Заводская, 30", capacity_seats=250, amenities=["Светодиодный экран 4K", "Радиомикрофоны 8шт", "Звуковой пульт 32ch", "Гримёрка"]),
                Room(name="Коворкинг «Точка кипения»", address="ул. Бабушкина, 129", capacity_seats=70, amenities=["Модульная мебель", "Маркерные стены", "Wi-Fi 6", "Кофе-зона"]),
                Room(name="Единый офис молодежных организаций", address="ул. Бабушкина, 129, ауд. 236", capacity_seats=50, amenities=["Интерактивная панель 75''", "Зона круглого стола", "Подкаст-студия"]),
                Room(name="Танцевально-хореографический зал", address="ул. Бабушкина, 129, 6 этаж", capacity_seats=40, amenities=["Зеркала во всю стену", "Станки", "Раздевалки с душевыми"]),
                Room(name="Конференц-зал ученого совета", address="ул. Александро-Заводская, 30, 3 этаж", capacity_seats=120, amenities=["Система синхронного перевода", "Конференц-связь", "ТВ-панели дублирования"])
            ]
            for r in rooms:
                if not db.query(Room).filter(Room.name == r.name).first():
                    db.add(r)
            db.commit()

            # Добавим тестовую одобренную бронь зала (чтобы она отобразилась в сетке занятости)
            kulagin = db.query(Room).filter(Room.name.ilike("%Кулагин%")).first()
            if kulagin:
                db.add(SpaceBooking(
                    room_id=kulagin.id,
                    user_id=student1.id if student1 else None,
                    event_name="Репетиция сборной команды КВН ЗабГУ",
                    start_time=now + timedelta(days=1, hours=4),
                    end_time=now + timedelta(days=1, hours=6),
                    status=SpaceBookingStatus.APPROVED,
                    sound_engineer_required=True,
                    applicant_full_name="Смирнов Алексей Игоревич",
                    applicant_position="Капитан команды КВН",
                    applicant_email="smirnov@university.ru",
                    applicant_phone="+7 (914) 111-22-33"
                ))
                db.commit()

        # ==================== 3. БАЗА ОТДЫХА «АРАХЛЕЙ» ====================
        if db.query(Cabin).count() <= 2:
            cabins = [
                Cabin(number=1, title="Дом №1 (Комфорт)", category=CabinCategory.COMFORT, capacity=4, price_staff_full_cabin=610.00, price_student_bed=100.00, map_x=1330.0, map_y=960.0, description="4 кровати, кухонный гарнитур, холодильник, газовая плита, чайник"),
                Cabin(number=2, title="Дом №2 (Стандарт)", category=CabinCategory.STANDARD, capacity=3, price_staff_full_cabin=610.00, price_student_bed=100.00, map_x=1280.0, map_y=1050.0, description="3 односпальные кровати, холодильник, плита, умывальник"),
                Cabin(number=7, title="Дом №7 (Стандарт)", category=CabinCategory.STANDARD, capacity=4, price_staff_full_cabin=610.00, price_student_bed=100.00, map_x=543.0, map_y=697.0, description="4 кровати, терраса с видом на озеро, мангальная зона"),
                Cabin(number=8, title="Дом №8 (Стандарт)", category=CabinCategory.STANDARD, capacity=4, price_staff_full_cabin=610.00, price_student_bed=100.00, map_x=615.0, map_y=515.0, description="4 кровати, холодильник, обеденная зона"),
                Cabin(number=14, title="Дом №14 (Комфорт+)", category=CabinCategory.COMFORT, capacity=4, price_staff_full_cabin=800.00, price_student_bed=150.00, map_x=615.0, map_y=266.0, description="2 двуспальные кровати, микроволновка, чайник, обогреватель"),
                Cabin(number=16, title="VIP-Коттедж №16", category=CabinCategory.VIP, capacity=4, price_staff_full_cabin=2500.00, price_student_bed=0.00, map_x=1310.0, map_y=830.0, description="Благоустроенный дом: санузел, душ, бойлер, плазменный ТВ, микроволновка")
            ]
            for c in cabins:
                if not db.query(Cabin).filter(Cabin.number == c.number).first():
                    db.add(c)
            db.commit()

        # ==================== 4. АКАДЕМИЧЕСКИЕ ГРУППЫ И СОЦ. ПАСПОРТ ====================
        group_pi = db.query(AcademicGroup).filter(AcademicGroup.name == "ПИ-23-1").first()
        if not group_pi:
            group_pi = AcademicGroup(name="ПИ-23-1", faculty="Факультет цифровых технологий", training_direction="09.03.04 Программная инженерия", course=1)
            group_ib = AcademicGroup(name="ИБ-22-1", faculty="Факультет цифровых технологий", training_direction="10.03.01 Информационная безопасность", course=2)
            db.add_all([group_pi, group_ib])
            db.commit()
            db.refresh(group_pi)
            db.refresh(group_ib)

            if curator1:
                db.add(GroupAssignment(user_id=curator1.id, academic_group_id=group_pi.id, role_code="CURATOR"))
            curator2 = db.query(User).filter(User.username == "curator_petrova").first()
            if curator2:
                db.add(GroupAssignment(user_id=curator2.id, academic_group_id=group_ib.id, role_code="CURATOR"))
            db.commit()

        # Наполнение студентами
        if db.query(Student).count() <= 2:
            st1 = Student(academic_group_id=group_pi.id, first_name="Алексей", last_name="Смирнов", middle_name="Игоревич", is_union_member=True, user_id=student1.id if student1 else None)
            st2 = Student(academic_group_id=group_pi.id, first_name="Екатерина", last_name="Волкова", middle_name="Сергеевна", is_union_member=True, user_id=student2.id if student2 else None)
            st3 = Student(academic_group_id=group_pi.id, first_name="Дмитрий", last_name="Кузнецов", middle_name="Андреевич", is_union_member=False, user_id=student3.id if student3 else None)
            st4 = Student(academic_group_id=group_pi.id, first_name="Анна", last_name="Морозова", middle_name="Павловна", is_union_member=True)
            st5 = Student(academic_group_id=group_pi.id, first_name="Илья", last_name="Попов", middle_name="Михайлович", is_union_member=False)
            db.add_all([st1, st2, st3, st4, st5])
            db.commit()
            db.refresh(st1)

            # Назначение Смирнова старостой группы ПИ-23-1
            db.add(GroupAssignment(user_id=student1.id, academic_group_id=group_pi.id, role_code="STAROSTA"))
            db.commit()

        st_smirnov = db.query(Student).filter(Student.last_name == "Смирнов").first()
        st_volkova = db.query(Student).filter(Student.last_name == "Волкова").first()

        # ==================== 5. КУРАТОРСКИЕ ПОСЕЩЕНИЯ И ЗАДАЧИ ====================
        if db.query(AttendanceSession).count() == 0 and group_pi:
            session = AttendanceSession(
                academic_group_id=group_pi.id,
                title="Кураторский час: Промежуточная аттестация и ПГАС",
                date=now - timedelta(days=2)
            )
            db.add(session)
            db.commit()
            db.refresh(session)

            for s in db.query(Student).filter(Student.academic_group_id == group_pi.id).all():
                is_pres = s.last_name in ["Смирнов", "Волкова", "Морозова"]
                method = "qr" if s.last_name == "Смирнов" else "manual"
                db.add(AttendanceRecord(session_id=session.id, student_id=s.id, is_present=is_pres, method=method))
            db.commit()

        if db.query(Task).count() <= 1:
            t1 = Task(title="Организационный кураторский час", description="Ознакомление первокурсников с уставом вуза и правилами внутреннего распорядка", due_date=now + timedelta(days=5), points=15, confirmation_requirements="Общее фото куратора с группой в аудитории")
            t2 = Task(title="Проверка заполнения социального паспорта", description="Сбор актуальных контактных данных, сведений о проживании в общежитии и льготах", due_date=now + timedelta(days=12), points=20, confirmation_requirements="100% заполненность карточек студентов")
            db.add_all([t1, t2])
            db.commit()
            db.refresh(t1)
            db.refresh(t2)

            if curator1:
                # Отчет на проверке
                db.add(TaskExecution(task_id=t1.id, curator_id=curator1.id, status="APPROVED", points_awarded=15, completed_at=now - timedelta(days=1)))
                db.add(TaskExecution(task_id=t2.id, curator_id=curator1.id, status="PENDING", photo_url="/uploads/demo_passport_report.pdf"))
                db.commit()

        # ==================== 6. КАЛЕНДАРНЫЙ ПЛАН МЕРОПРИЯТИЙ ====================
        if db.query(UniversityEvent).count() <= 1:
            events = [
                UniversityEvent(title="Торжественная линейка и День первокурсника ЗабГУ", description="Праздничное открытие учебного года с участием ректората", start_time=now + timedelta(days=1, hours=2), end_time=now + timedelta(days=1, hours=5), location="Главная площадь, ул. Александро-Заводская, 30", category=EventCategory.CEREMONIAL, is_mandatory=True, target_type=TargetAudienceType.ALL, creator_id=admin.id if admin else None),
                UniversityEvent(title="Межвузовский хакатон по искусственному интеллекту", description="Командное соревнование разработчиков Забайкалья на 48 часов", start_time=now + timedelta(days=3), end_time=now + timedelta(days=5), location="Коворкинг «Точка кипения»", category=EventCategory.ACADEMIC, is_mandatory=False, target_type=TargetAudienceType.ALL, creator_id=admin.id if admin else None),
                UniversityEvent(title="Студенческий фестиваль «Забайкальская весна 2026»", description="Гала-концерт творческих коллективов институтов", start_time=now + timedelta(days=8, hours=10), end_time=now + timedelta(days=8, hours=14), location="Актовый зал «Кулагин»", category=EventCategory.CREATIVE, is_mandatory=False, target_type=TargetAudienceType.ALL, creator_id=admin.id if admin else None),
                UniversityEvent(title="Обязательный инструктаж по антитеррористической безопасности", description="Единый кураторский час для студентов 1-2 курсов", start_time=now + timedelta(days=10, hours=5), end_time=now + timedelta(days=10, hours=6), location="Поточная аудитория 314", category=EventCategory.PREVENTIVE, is_mandatory=True, target_type=TargetAudienceType.COURSE, target_course=1, creator_id=admin.id if admin else None)
            ]
            db.add_all(events)
            db.commit()

        # ==================== 7. РЕЙТИНГ СТУДЕНТОВ (ПГАС) ====================
        if db.query(StudentAchievement).count() == 0 and st_smirnov:
            achievements = [
                StudentAchievement(student_id=st_smirnov.id, user_id=student1.id, title="1 место во Всероссийской студенческой олимпиаде по программированию", description="Диплом I степени Минобрнауки РФ", category=AchievementCategory.SCIENCE, level=AchievementLevel.ALL_RUSSIAN, event_date=date.today() - timedelta(days=30), proof_file_url="/uploads/diploma_1st_place.pdf", status=AchievementStatus.APPROVED, points_awarded=50, semester="2026-1", reviewer_id=admin.id if admin else None),
                StudentAchievement(student_id=st_smirnov.id, user_id=student1.id, title="Публикация научной статьи в журнале ВАК", description="Тема: Архитектура распределенных веб-систем", category=AchievementCategory.SCIENCE, level=AchievementLevel.ALL_RUSSIAN, event_date=date.today() - timedelta(days=15), proof_file_url="/uploads/vak_article.pdf", status=AchievementStatus.APPROVED, points_awarded=50, semester="2026-1", reviewer_id=admin.id if admin else None),
                StudentAchievement(student_id=st_volkova.id, user_id=student2.id, title="Чемпионка Дальневосточного федерального округа по легкой атлетике", description="Золотая медаль на дистанции 800м", category=AchievementCategory.SPORT, level=AchievementLevel.REGIONAL, event_date=date.today() - timedelta(days=20), proof_file_url="/uploads/sport_gold_medal.pdf", status=AchievementStatus.APPROVED, points_awarded=25, semester="2026-1", reviewer_id=admin.id if admin else None),
                StudentAchievement(student_id=st_volkova.id, user_id=student2.id, title="Организация донорской акции «Капля жизни ЗабГУ»", description="Благодарственное письмо станции переливания крови", category=AchievementCategory.PUBLIC, level=AchievementLevel.UNIVERSITY, event_date=date.today() - timedelta(days=10), proof_file_url="/uploads/donor_letter.pdf", status=AchievementStatus.PENDING, points_awarded=0, semester="2026-1")
            ]
            db.add_all(achievements)
            db.commit()

        # ==================== 8. ЖИЛОЙ ФОНД ОБЩЕЖИТИЙ ====================
        if db.query(Dormitory).count() <= 1:
            dorm2 = Dormitory(number=2, name="Студенческое общежитие №2 (Повышенной комфортности)", address="ул. Александро-Заводская, 28", commandant_name="Ильин В.В.", commandant_phone="+7 (914) 222-33-44")
            db.add(dorm2)
            db.commit()
            db.refresh(dorm2)

            for f in range(1, 4):
                room = DormRoom(dormitory_id=dorm2.id, room_number=f"{f}05", floor=f, capacity_beds=2, gender_policy=RoomGenderPolicy.MALE if f % 2 != 0 else RoomGenderPolicy.FEMALE, price_per_month=1500.00)
                db.add(room)
                db.commit()
                db.refresh(room)
                for b in range(1, 3):
                    # Первую койку заселим Смирновым
                    is_occ = (f == 1 and b == 1)
                    st_id = st_smirnov.id if is_occ else None
                    db.add(DormBed(room_id=room.id, bed_number=b, is_occupied=is_occ, current_student_id=st_id))
            db.commit()

            # Ордер на заселение для Смирнова
            first_bed = db.query(DormBed).filter(DormBed.is_occupied == True).first()
            if first_bed and st_smirnov:
                db.add(DormStay(
                    order_number="ORD-260901-A12B",
                    student_id=st_smirnov.id,
                    bed_id=first_bed.id,
                    check_in_date=date.today() - timedelta(days=45),
                    status=DormStayStatus.ACTIVE
                ))
                db.commit()

        # ==================== 9. СТУДЕНЧЕСКАЯ МОБИЛЬНОСТЬ ====================
        if db.query(MobilityTrip).count() == 0 and st_smirnov:
            trip = MobilityTrip(
                student_id=st_smirnov.id,
                user_id=student1.id,
                trip_type=MobilityTripType.CONFERENCE,
                title="Участие во Всероссийской молодежной конференции по ИТ-технологиям",
                destination_city="Москва",
                host_organization="МГУ имени М.В. Ломоносова",
                start_date=date.today() + timedelta(days=15),
                end_date=date.today() + timedelta(days=19),
                invitation_file_url="/uploads/msu_invitation.pdf",
                estimated_transport_cost=24000.00,
                estimated_living_cost=12000.00,
                estimated_daily_cost=4000.00,
                total_estimated_budget=40000.00,
                funded_by_university=True,
                status=MobilityTripStatus.ON_REVIEW_DEAN
            )
            db.add(trip)
            db.commit()
            db.refresh(trip)

            # Этап 1 согласован куратором, ожидает деканата
            db.add(MobilityApprovalStep(trip_id=trip.id, stage=ApprovalStage.CURATOR, reviewer_id=curator1.id if curator1 else None, is_approved=True, comment="Успеваемость отличная, задолженностей нет. Ходатайствую о направлении.", reviewed_at=now - timedelta(days=1)))
            db.add(MobilityApprovalStep(trip_id=trip.id, stage=ApprovalStage.DEAN))
            db.add(MobilityApprovalStep(trip_id=trip.id, stage=ApprovalStage.ACCOUNTING))
            db.commit()

        # ==================== 10. ЗАКРЫТЫЙ КОНТУР ДДМ (152-ФЗ) ====================
        if db.query(DDMProfile).count() == 0:
            p1 = DDMProfile(
                full_name="Григорьев Василий Николаевич",
                birth_date=date(1998, 5, 14),
                phone="+7 (914) 777-00-11",
                category=BenefitCategory.SVO_PARTICIPANT,
                encrypted_passport=encrypt_value("Серия 76 18 № 902144, выдан УМВД по Забайкальскому краю"),
                encrypted_snils=encrypt_value("142-901-844 55"),
                encrypted_address=encrypt_value("г. Чита, ул. Ленина, д. 42, кв. 15"),
                encrypted_document_details=encrypt_value("Удостоверение ветерана боевых действий серии БК № 0498112 от 12.04.2024"),
                children_count=2,
                has_social_support=True,
                notes="Студент заочной формы обучения. Требуется первоочередное предоставление путевок на базу отдыха."
            )
            p2 = DDMProfile(
                full_name="Михайлова Татьяна Петровна",
                birth_date=date(1982, 11, 23),
                phone="+7 (914) 888-33-22",
                category=BenefitCategory.LARGE_FAMILY,
                encrypted_passport=encrypt_value("Серия 76 05 № 334199, выдан ОВД Ингодинского р-на г. Читы"),
                encrypted_snils=encrypt_value("112-443-980 01"),
                encrypted_address=encrypt_value("г. Чита, ул. Новобульварная, д. 11, кв. 4"),
                encrypted_document_details=encrypt_value("Удостоверение многодетной семьи № МД-75-00431"),
                children_count=4,
                has_social_support=True,
                notes="Сотрудник кафедры физики. Дети школьного возраста."
            )
            db.add_all([p1, p2])
            db.commit()
            db.refresh(p1)

            # Члены семьи ветерана
            db.add(DDMFamilyMember(profile_id=p1.id, full_name="Григорьева Мария Васильевна", relation_type="Дочь", birth_date=date(2021, 3, 10), encrypted_document_details=encrypt_value("Свидетельство о рождении VII-АВ № 112233")))
            db.add(DDMFamilyMember(profile_id=p1.id, full_name="Григорьев Артем Васильевич", relation_type="Сын", birth_date=date(2023, 7, 19), encrypted_document_details=encrypt_value("Свидетельство о рождении VIII-АВ № 445566")))

            # Журнал аудита первичного внесения
            db.add(DDMAuditLog(officer_name="Система (Инициализация)", action=DDMAuditAction.CREATE_RECORD, target_record_id=p1.id, ip_address="127.0.0.1", details="Первичное внесение ветерана СВО в закрытый контур"))
            db.commit()

        # ==================== 11. ОБУЧАЮЩИЕ КУРСЫ (LMS) ====================
        if db.query(Course).count() <= 1:
            c2 = Course(
                title="Школа куратора ЗабГУ: Организация воспитательной работы",
                description="Методический курс для назначенных кураторов академических групп 1-го курса",
                target_role=CourseTargetRole.CURATOR,
                is_mandatory=True,
                passing_score_percent=80
            )
            db.add(c2)
            db.commit()
            db.refresh(c2)

            db.add(CourseLesson(course_id=c2.id, title="1. Нормативно-правовая база деятельности куратора", content_text="Положение о кураторе академической группы регламентирует права, обязанности и порядок ведения социальной документации.", order_index=1))
            db.add(CourseLesson(course_id=c2.id, title="2. Профилактика деструктивного поведения и адаптация", content_text="Методика мониторинга социально-психологического климата в студенческих группах первого года обучения.", order_index=2))
            
            q = QuizQuestion(course_id=c2.id, question_text="Какова минимально допустимая явка группы на кураторский час для зачета?", points=1)
            db.add(q)
            db.commit()
            db.refresh(q)
            db.add(QuizOption(question_id=q.id, option_text="Не менее 75%", is_correct=True))
            db.add(QuizOption(question_id=q.id, option_text="Не менее 50%", is_correct=False))
            db.commit()

            # Выданный сертификат Смирнову за пожарную безопасность
            course_pb = db.query(Course).filter(Course.title.ilike("%охране труда%")).first()
            if course_pb and student1:
                db.add(CourseEnrollment(
                    user_id=student1.id,
                    course_id=course_pb.id,
                    status=EnrollmentStatus.COMPLETED,
                    progress_percent=100,
                    quiz_score_percent=100,
                    certificate_number="CERT-260901-B891FA",
                    completed_at=now - timedelta(days=5)
                ))
                db.commit()

        print("✓ Полный пакет демонстрационных данных ЗабГУ успешно загружен!")

    finally:
        db.close()


@app.get("/", tags=["Сервис"])
def root():
    return {
        "status": "online",
        "ecosystem": "UniCampus",
        "version": "1.0.0",
        "docs": "/docs"
    }