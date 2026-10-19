import os
import uuid
import shutil
from datetime import datetime, timezone, timedelta, date
from fastapi import FastAPI, UploadFile, File, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.database import engine, Base, SessionLocal
from app.core.security import hash_password

# 1. Модели всех модулей платформы
from app.modules.auth.models import User, UserRole
from app.modules.booking.models import Room, Cabin, CabinCategory
from app.modules.curators.models import AcademicGroup, Student, GroupAssignment, Task, TaskExecution
from app.modules.calendar.models import UniversityEvent, EventCategory, TargetAudienceType
from app.modules.rating.models import StudentAchievement
from app.modules.dormitories.models import Dormitory, DormRoom, DormBed
from app.modules.mobility.models import MobilityTrip
from app.modules.ddm.models import DDMProfile
from app.modules.learning.models import Course, CourseLesson, QuizQuestion, QuizOption, CourseTargetRole

# 2. Роутеры всех модулей платформы
from app.modules.auth.router import router as auth_router
from app.modules.booking.router import router as booking_router
from app.modules.curators.router import router as curators_router
from app.modules.calendar.router import router as calendar_router
from app.modules.rating.router import router as rating_router
from app.modules.dormitories.router import router as dormitories_router
from app.modules.mobility.router import router as mobility_router
from app.modules.ddm.router import router as ddm_router
from app.modules.learning.router import router as learning_router

# Создание всех таблиц в PostgreSQL при старте
Base.metadata.create_all(bind=engine)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="UniCampus Unified Ecosystem API",
    version="1.0.0",
    description=(
        "Комплексная цифровая экосистема университета: "
        "SSO Авторизация, Бронирование залов, База отдыха, Кураторы, "
        "Единый календарь, Рейтинг ПГАС, Общежития, Мобильность, ДДМ (152-ФЗ), Обучение"
    ),
    docs_url="/docs",
    redoc_url="/redoc"
)

# Раздача локально загруженных документов и чеков
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение всех 9 функциональных блоков экосистемы
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
    """Универсальная загрузка документов, чеков, сканов грамот и сертификатов"""
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
    """Автоматическое наполнение базы демо-данными для презентации руководству"""
    db = SessionLocal()
    try:
        # 1. Аккаунты всех ключевых ролей
        if not db.query(User).filter(User.username == "admin").first():
            demo_users = [
                User(username="admin", email="admin@university.ru", full_name="Главный Администратор", role=UserRole.ADMIN, password_hash=hash_password("admin123"), is_ddm_officer=True),
                User(username="curator_ivanov", email="ivanov@university.ru", full_name="Иванов Иван Иванович (Куратор)", role=UserRole.CURATOR, password_hash=hash_password("curator123")),
                User(username="student_smirnov", email="smirnov@university.ru", full_name="Смирнов Алексей Игоревич (Студент)", role=UserRole.STUDENT, password_hash=hash_password("student123")),
                User(username="staff_petrov", email="petrov@university.ru", full_name="Петров Петр Петрович (Преподаватель)", role=UserRole.STAFF, password_hash=hash_password("staff123")),
                User(username="officer_ddm", email="ddm@university.ru", full_name="Смирнова Елена Викторовна (Офицер ДДМ)", role=UserRole.OFFICER_DDM, password_hash=hash_password("ddm123"), is_ddm_officer=True),
            ]
            db.add_all(demo_users)
            db.commit()

        # 2. Аудитории и База отдыха
        if not db.query(Room).first():
            rooms = [
                Room(name="Актовый зал «Кулагин»", address="ул. Александро-Заводская, 30", capacity_seats=250, amenities=["Экран 2240х1080", "Пульт 32ch"]),
                Room(name="Единый офис молодежных организаций", address="ул. Бабушкина, 129", capacity_seats=50, amenities=["Wi-Fi 6", "Smart-TV"])
            ]
            cabins = [
                Cabin(number=1, title="Дом №1", category=CabinCategory.COMFORT, capacity=4, price_staff_full_cabin=610.00, price_student_bed=100.00, map_x=1330.0, map_y=960.0),
                Cabin(number=16, title="VIP-Коттедж №16", category=CabinCategory.VIP, capacity=4, price_staff_full_cabin=2500.00, price_student_bed=0.00, map_x=1310.0, map_y=830.0)
            ]
            db.add_all(rooms)
            db.add_all(cabins)
            db.commit()

        # 3. Академическая группа и студенты
        if not db.query(AcademicGroup).first():
            group = AcademicGroup(name="ПИ-23-1", faculty="Факультет цифровых технологий", training_direction="09.03.04 Программная инженерия", course=1)
            db.add(group)
            db.commit()
            db.refresh(group)

            curator = db.query(User).filter(User.username == "curator_ivanov").first()
            if curator:
                db.add(GroupAssignment(user_id=curator.id, academic_group_id=group.id, role_code="CURATOR"))

            demo_students = [
                Student(academic_group_id=group.id, first_name="Алексей", last_name="Смирнов", middle_name="Игоревич", is_union_member=True),
                Student(academic_group_id=group.id, first_name="Екатерина", last_name="Волкова", middle_name="Сергеевна", is_union_member=True)
            ]
            db.add_all(demo_students)
            db.commit()

        # 4. Университетские мероприятия календаря
        if not db.query(UniversityEvent).first():
            now = datetime.now(timezone.utc)
            admin = db.query(User).filter(User.username == "admin").first()
            event = UniversityEvent(
                title="День первокурсника и торжественная линейка",
                description="Открытие учебного года",
                start_time=now + timedelta(days=1),
                location="Площадь перед главным корпусом",
                category=EventCategory.CEREMONIAL,
                is_mandatory=True,
                creator_id=admin.id if admin else None
            )
            db.add(event)
            db.commit()

        # 5. Жилой фонд общежития
        if not db.query(Dormitory).first():
            dorm = Dormitory(number=1, name="Студенческое общежитие №1", address="ул. Журавлева, 55", commandant_name="Ковалева Т.И.")
            db.add(dorm)
            db.commit()
            db.refresh(dorm)

            room = DormRoom(dormitory_id=dorm.id, room_number="201", floor=2, capacity_beds=3, price_per_month=1200.00)
            db.add(room)
            db.commit()
            db.refresh(room)

            for b_idx in range(1, 4):
                db.add(DormBed(room_id=room.id, bed_number=b_idx, is_occupied=False))
            db.commit()

        # 6. Обучающий курс и тест
        if not db.query(Course).first():
            course = Course(
                title="Вводный инструктаж по охране труда и пожарной безопасности",
                description="Обязательный вводный курс для первокурсников и новых сотрудников",
                target_role=CourseTargetRole.ALL,
                is_mandatory=True,
                passing_score_percent=100
            )
            db.add(course)
            db.commit()
            db.refresh(course)

            lesson = CourseLesson(
                course_id=course.id,
                title="Правила эвакуации при пожаре",
                content_text="При обнаружении возгорания незамедлительно сообщите по номеру 112 и следуйте указателям к запасным выходам.",
                order_index=1
            )
            db.add(lesson)

            q1 = QuizQuestion(course_id=course.id, question_text="По какому единому номеру вызываются экстренные службы?", points=1)
            db.add(q1)
            db.commit()
            db.refresh(q1)

            db.add(QuizOption(question_id=q1.id, option_text="112", is_correct=True))
            db.add(QuizOption(question_id=q1.id, option_text="911", is_correct=False))
            db.commit()

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