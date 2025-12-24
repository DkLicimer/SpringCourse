package com.example.neshkola.data.repository

import com.example.neshkola.model.*

object QuestionRepository {

    fun getQuestions(category: Category, difficulty: Difficulty): List<Question> {
        return questions.filter {
            it.category == category && it.difficulty == difficulty
        }.take(10)
    }

    private val questions = listOf(

        // ===================== МАТЕМАТИКА =====================
        // EASY (1–10)
        Question(1, Category.MATH, Difficulty.EASY, "2 + 2 = ?", listOf("3","4","5","6"), 1),
        Question(2, Category.MATH, Difficulty.EASY, "5 + 3 = ?", listOf("6","7","8","9"), 2),
        Question(3, Category.MATH, Difficulty.EASY, "10 - 4 = ?", listOf("5","6","7","8"), 1),
        Question(4, Category.MATH, Difficulty.EASY, "10 ÷ 2 = ?", listOf("3", "4", "5", "6"), 2),
        Question(5, Category.MATH, Difficulty.EASY, "7 + 1 = ?", listOf("6", "7", "8", "9"), 2),
        Question(6, Category.MATH, Difficulty.EASY, "6 − 4 = ?", listOf("1", "2", "3", "4"), 1),
        Question(7, Category.MATH, Difficulty.EASY, "2 × 5 = ?", listOf("7", "8", "9", "10"), 3),
        Question(8, Category.MATH, Difficulty.EASY, "9 ÷ 3 = ?", listOf("2", "3", "4", "5"), 1),
        Question(9, Category.MATH, Difficulty.EASY, "1 + 9 = ?", listOf("8", "9", "10", "11"), 2),
        Question(10, Category.MATH, Difficulty.EASY, "8 − 5 = ?", listOf("2", "3", "4", "5"), 1),

        // MEDIUM (11–20)
        Question(11, Category.MATH, Difficulty.MEDIUM, "12 × 2 = ?", listOf("20", "22", "24", "26"), 2),
        Question(12, Category.MATH, Difficulty.MEDIUM, "36 ÷ 6 = ?", listOf("4", "5", "6", "7"), 2),
        Question(13, Category.MATH, Difficulty.MEDIUM, "15 + 27 = ?", listOf("40", "41", "42", "43"), 2),
        Question(14, Category.MATH, Difficulty.MEDIUM, "50 − 18 = ?", listOf("30", "31", "32", "33"), 2),
        Question(15, Category.MATH, Difficulty.MEDIUM, "7 × 8 = ?", listOf("54", "55", "56", "57"), 2),
        Question(16, Category.MATH, Difficulty.MEDIUM, "81 ÷ 9 = ?", listOf("7", "8", "9", "10"), 2),
        Question(17, Category.MATH, Difficulty.MEDIUM, "25 × 2 = ?", listOf("40", "45", "50", "55"), 2),
        Question(18, Category.MATH, Difficulty.MEDIUM, "100 − 64 = ?", listOf("34", "35", "36", "37"), 2),
        Question(19, Category.MATH, Difficulty.MEDIUM, "9 × 6 = ?", listOf("52", "53", "54", "55"), 2),
        Question(20, Category.MATH, Difficulty.MEDIUM, "72 ÷ 8 = ?", listOf("7", "8", "9", "10"), 2),

        // HARD (21–30)
        Question(21, Category.MATH, Difficulty.HARD, "12² = ?", listOf("124", "134", "144", "154"), 2),
        Question(22, Category.MATH, Difficulty.HARD, "√81 = ?", listOf("7", "8", "9", "10"), 2),
        Question(23, Category.MATH, Difficulty.HARD, "25² = ?", listOf("525", "600", "625", "650"), 2),
        Question(24, Category.MATH, Difficulty.HARD, "√144 = ?", listOf("10", "11", "12", "13"), 2),
        Question(25, Category.MATH, Difficulty.HARD, "15 × 15 = ?", listOf("215", "225", "235", "245"), 1),
        Question(26, Category.MATH, Difficulty.HARD, "100 ÷ 4 = ?", listOf("20", "25", "30", "40"), 1),
        Question(27, Category.MATH, Difficulty.HARD, "9² = ?", listOf("72", "81", "90", "99"), 1),
        Question(28, Category.MATH, Difficulty.HARD, "√196 = ?", listOf("12", "13", "14", "15"), 2),
        Question(29, Category.MATH, Difficulty.HARD, "18 × 7 = ?", listOf("116", "126", "136", "146"), 1),
        Question(30, Category.MATH, Difficulty.HARD, "144 ÷ 12 = ?", listOf("10", "11", "12", "13"), 2),

// ===================== ЯЗЫКИ =====================
// EASY (31–40)
        Question(31, Category.LANGUAGE, Difficulty.EASY, "Как переводится слово \"Apple\"?", listOf("Апельсин", "Яблоко", "Груша", "Банан"), 1),
        Question(32, Category.LANGUAGE, Difficulty.EASY, "Сколько букв в русском алфавите?", listOf("31", "32", "33", "34"), 2),
        Question(33, Category.LANGUAGE, Difficulty.EASY, "Антоним слова \"большой\"?", listOf("Огромный", "Широкий", "Маленький", "Длинный"), 2),
        Question(34, Category.LANGUAGE, Difficulty.EASY, "Какой знак ставится в конце вопросительного предложения?", listOf(".", "!", "?", ","), 2),
        Question(35, Category.LANGUAGE, Difficulty.EASY, "Как переводится слово \"Dog\"?", listOf("Кошка", "Птица", "Собака", "Рыба"), 2),
        Question(36, Category.LANGUAGE, Difficulty.EASY, "Синоним слова \"быстро\"?", listOf("Медленно", "Скоро", "Тихо", "Поздно"), 1),
        Question(37, Category.LANGUAGE, Difficulty.EASY, "Сколько слогов в слове \"молоко\"?", listOf("1", "2", "3", "4"), 2),
        Question(38, Category.LANGUAGE, Difficulty.EASY, "Какой звук гласный?", listOf("Б", "К", "А", "Т"), 2),
        Question(39, Category.LANGUAGE, Difficulty.EASY, "Как переводится слово \"Cat\"?", listOf("Собака", "Лошадь", "Кошка", "Мышь"), 2),
        Question(40, Category.LANGUAGE, Difficulty.EASY, "Сколько слов в предложении \"Я люблю школу\"?", listOf("2", "3", "4", "5"), 1),

// MEDIUM (41–50)
        Question(41, Category.LANGUAGE, Difficulty.MEDIUM, "Какое слово является существительным?", listOf("Бегать", "Красивый", "Дом", "Быстро"), 2),
        Question(42, Category.LANGUAGE, Difficulty.MEDIUM, "Как переводится слово \"Book\"?", listOf("Тетрадь", "Ручка", "Книга", "Стол"), 2),
        Question(43, Category.LANGUAGE, Difficulty.MEDIUM, "Антоним слова \"трудный\"?", listOf("Лёгкий", "Сложный", "Большой", "Длинный"), 0),
        Question(44, Category.LANGUAGE, Difficulty.MEDIUM, "Сколько гласных букв в слове \"образование\"?", listOf("5", "6", "7", "8"), 2),
        Question(45, Category.LANGUAGE, Difficulty.MEDIUM, "Как переводится слово \"School\"?", listOf("Дом", "Школа", "Улица", "Класс"), 1),
        Question(46, Category.LANGUAGE, Difficulty.MEDIUM, "Какое слово является прилагательным?", listOf("Читать", "Быстро", "Красивый", "Друг"), 2),
        Question(47, Category.LANGUAGE, Difficulty.MEDIUM, "Синоним слова \"смелый\"?", listOf("Трусливый", "Отважный", "Маленький", "Тихий"), 1),
        Question(48, Category.LANGUAGE, Difficulty.MEDIUM, "Как переводится слово \"Friend\"?", listOf("Враг", "Друг", "Сосед", "Брат"), 1),
        Question(49, Category.LANGUAGE, Difficulty.MEDIUM, "Сколько букв в слове \"грамматика\"?", listOf("9", "10", "11", "12"), 1),
        Question(50, Category.LANGUAGE, Difficulty.MEDIUM, "Какой знак ставится в конце восклицательного предложения?", listOf(".", "?", "!", ","), 2),
// HARD (51–60)
        Question(51, Category.LANGUAGE, Difficulty.HARD, "Какое слово является наречием?", listOf("Быстро", "Красивый", "Дом", "Чтение"), 0),
        Question(52, Category.LANGUAGE, Difficulty.HARD, "Как переводится слово \"Knowledge\"?", listOf("Знание", "Умение", "Мысль", "Опыт"), 0),
        Question(53, Category.LANGUAGE, Difficulty.HARD, "Синоним слова \"внимательный\"?", listOf("Рассеянный", "Аккуратный", "Глупый", "Медленный"), 1),
        Question(54, Category.LANGUAGE, Difficulty.HARD, "Сколько корней в слове \"лесостепь\"?", listOf("1", "2", "3", "4"), 1),
        Question(55, Category.LANGUAGE, Difficulty.HARD, "Как переводится слово \"Environment\"?", listOf("Окружение", "Природа", "Здание", "Погода"), 1),
        Question(56, Category.LANGUAGE, Difficulty.HARD, "Какое слово является деепричастием?", listOf("Читая", "Читать", "Читает", "Чтение"), 0),
        Question(57, Category.LANGUAGE, Difficulty.HARD, "Антоним слова \"оптимизм\"?", listOf("Радость", "Пессимизм", "Смелость", "Счастье"), 1),
        Question(58, Category.LANGUAGE, Difficulty.HARD, "Сколько звуков в слове \"язык\"?", listOf("3", "4", "5", "6"), 1),
        Question(59, Category.LANGUAGE, Difficulty.HARD, "Как переводится слово \"Development\"?", listOf("Образование", "Развитие", "Движение", "Обучение"), 1),
        Question(60, Category.LANGUAGE, Difficulty.HARD, "Какое слово является составным?", listOf("Самолёт", "Молоко", "Лесостепь", "Дом"), 2),
// ===================== ЛОГИКА И ПАМЯТЬ =====================
// EASY (61–70)
        Question(61, Category.LOGIC, Difficulty.EASY, "Какое число лишнее: 2, 4, 6, 7, 8?", listOf("2", "4", "6", "7"), 3),
        Question(62, Category.LOGIC, Difficulty.EASY, "Продолжи ряд: 1, 2, 3, ?", listOf("3", "4", "5", "6"), 1),
        Question(63, Category.LOGIC, Difficulty.EASY, "Сколько сторон у квадрата?", listOf("3", "4", "5", "6"), 1),
        Question(64, Category.LOGIC, Difficulty.EASY, "Какой цвет получится из синего и жёлтого?", listOf("Красный", "Зелёный", "Фиолетовый", "Оранжевый"), 1),
        Question(65, Category.LOGIC, Difficulty.EASY, "Что больше: 5 или 3?", listOf("5", "3", "Они равны", "Нельзя сравнить"), 0),
        Question(66, Category.LOGIC, Difficulty.EASY, "Сколько дней в неделе?", listOf("5", "6", "7", "8"), 2),
        Question(67, Category.LOGIC, Difficulty.EASY, "Какое животное лишнее: кошка, собака, корова, воробей?", listOf("Кошка", "Собака", "Корова", "Воробей"), 3),
        Question(68, Category.LOGIC, Difficulty.EASY, "Что тяжелее: 1 кг ваты или 1 кг железа?", listOf("Вата", "Железо", "Одинаково", "Нельзя узнать"), 2),
        Question(69, Category.LOGIC, Difficulty.EASY, "Сколько глаз у человека?", listOf("1", "2", "3", "4"), 1),
        Question(70, Category.LOGIC, Difficulty.EASY, "Какое число идёт после 9?", listOf("8", "9", "10", "11"), 2),

// MEDIUM (71–80)
        Question(71, Category.LOGIC, Difficulty.MEDIUM, "Продолжи ряд: 2, 4, 6, ?", listOf("7", "8", "9", "10"), 1),
        Question(72, Category.LOGIC, Difficulty.MEDIUM, "Какое слово лишнее: стол, стул, диван, яблоко?", listOf("Стол", "Стул", "Диван", "Яблоко"), 3),
        Question(73, Category.LOGIC, Difficulty.MEDIUM, "Если сегодня понедельник, какой день будет завтра?", listOf("Воскресенье", "Вторник", "Среда", "Пятница"), 1),
        Question(74, Category.LOGIC, Difficulty.MEDIUM, "Сколько месяцев в году?", listOf("10", "11", "12", "13"), 2),
        Question(75, Category.LOGIC, Difficulty.MEDIUM, "Что не относится к временам года?", listOf("Зима", "Весна", "Лето", "Утро"), 3),
        Question(76, Category.LOGIC, Difficulty.MEDIUM, "Какое число лишнее: 10, 20, 30, 35?", listOf("10", "20", "30", "35"), 3),
        Question(77, Category.LOGIC, Difficulty.MEDIUM, "Сколько минут в одном часе?", listOf("30", "45", "60", "90"), 2),
        Question(78, Category.LOGIC, Difficulty.MEDIUM, "Продолжи ряд: А, Б, В, ?", listOf("Г", "Д", "Е", "Ж"), 0),
        Question(79, Category.LOGIC, Difficulty.MEDIUM, "Что сначала: утро или вечер?", listOf("Утро", "Вечер", "Ночь", "Полдень"), 0),
        Question(80, Category.LOGIC, Difficulty.MEDIUM, "Какое число чётное?", listOf("3", "5", "7", "8"), 3),

// HARD (81–90)
        Question(81, Category.LOGIC, Difficulty.HARD, "Продолжи ряд: 1, 4, 9, ?", listOf("12", "14", "16", "18"), 2),
        Question(82, Category.LOGIC, Difficulty.HARD, "Что лишнее: квадрат, круг, треугольник, куб?", listOf("Квадрат", "Круг", "Треугольник", "Куб"), 3),
        Question(83, Category.LOGIC, Difficulty.HARD, "Сколько сторон у шестиугольника?", listOf("5", "6", "7", "8"), 1),
        Question(84, Category.LOGIC, Difficulty.HARD, "Продолжи ряд: 5, 10, 20, ?", listOf("25", "30", "35", "40"), 3),
        Question(85, Category.LOGIC, Difficulty.HARD, "Если 3 кошки ловят 3 мыши за 3 минуты, сколько кошек нужно, чтобы поймать 6 мышей за 6 минут?", listOf("3", "6", "9", "12"), 0),
        Question(86, Category.LOGIC, Difficulty.HARD, "Какое число пропущено: 2, 6, 12, ?", listOf("16", "18", "20", "24"), 3),
        Question(87, Category.LOGIC, Difficulty.HARD, "Что не является логической операцией?", listOf("И", "ИЛИ", "НЕ", "ПОТОМ"), 3),
        Question(88, Category.LOGIC, Difficulty.HARD, "Продолжи ряд: 100, 90, 80, ?", listOf("75", "70", "65", "60"), 1),
        Question(89, Category.LOGIC, Difficulty.HARD, "Сколько рёбер у куба?", listOf("8", "10", "12", "14"), 2),
        Question(90, Category.LOGIC, Difficulty.HARD, "Если все розы — цветы, а некоторые цветы — красные, верно ли что некоторые розы красные?", listOf("Да", "Нет", "Иногда", "Нельзя определить"), 3),

        // ===================== ЭРУДИЦИЯ =====================
// EASY (91–100)
        Question(91, Category.KNOWLEDGE, Difficulty.EASY, "Столица России?", listOf("Киев", "Минск", "Москва", "Сочи"), 2),
        Question(92, Category.KNOWLEDGE, Difficulty.EASY, "Сколько цветов у радуги?", listOf("5", "6", "7", "8"), 2),
        Question(93, Category.KNOWLEDGE, Difficulty.EASY, "Какое животное самое большое?", listOf("Слон", "Кит", "Жираф", "Медведь"), 1),
        Question(94, Category.KNOWLEDGE, Difficulty.EASY, "Какой океан самый большой?", listOf("Атлантический", "Индийский", "Тихий", "Северный"), 2),
        Question(95, Category.KNOWLEDGE, Difficulty.EASY, "Сколько планет в Солнечной системе?", listOf("7", "8", "9", "10"), 1),
        Question(96, Category.KNOWLEDGE, Difficulty.EASY, "Кто написал «Колобок»?", listOf("Пушкин", "Толстой", "Народ", "Чехов"), 2),
        Question(97, Category.KNOWLEDGE, Difficulty.EASY, "Какой газ мы вдыхаем?", listOf("Кислород", "Азот", "Углекислый газ", "Водород"), 0),
        Question(98, Category.KNOWLEDGE, Difficulty.EASY, "Какое время года после лета?", listOf("Весна", "Осень", "Зима", "Зима"), 1),
        Question(99, Category.KNOWLEDGE, Difficulty.EASY, "Какой континент самый большой?", listOf("Африка", "Европа", "Азия", "Америка"), 2),
        Question(100, Category.KNOWLEDGE, Difficulty.EASY, "Сколько дней в году?", listOf("360", "364", "365", "366"), 2),

// MEDIUM (101–110)
        Question(101, Category.KNOWLEDGE, Difficulty.MEDIUM, "Кто первым полетел в космос?", listOf("Армстронг", "Гагарин", "Титов", "Королев"), 1),
        Question(102, Category.KNOWLEDGE, Difficulty.MEDIUM, "Какая планета ближе всего к Солнцу?", listOf("Земля", "Марс", "Меркурий", "Венера"), 2),
        Question(103, Category.KNOWLEDGE, Difficulty.MEDIUM, "Самая длинная река в мире?", listOf("Нил", "Амазонка", "Волга", "Миссисипи"), 1),
        Question(104, Category.KNOWLEDGE, Difficulty.MEDIUM, "Сколько материков на Земле?", listOf("5", "6", "7", "8"), 2),
        Question(105, Category.KNOWLEDGE, Difficulty.MEDIUM, "Какой металл обозначается Fe?", listOf("Медь", "Золото", "Железо", "Серебро"), 2),
        Question(106, Category.KNOWLEDGE, Difficulty.MEDIUM, "Самая высокая гора?", listOf("Эльбрус", "Килиманджаро", "Эверест", "Альпы"), 2),
        Question(107, Category.KNOWLEDGE, Difficulty.MEDIUM, "Какой язык самый распространённый?", listOf("Русский", "Английский", "Китайский", "Испанский"), 2),
        Question(108, Category.KNOWLEDGE, Difficulty.MEDIUM, "Кто написал «Войну и мир»?", listOf("Достоевский", "Толстой", "Пушкин", "Гоголь"), 1),
        Question(109, Category.KNOWLEDGE, Difficulty.MEDIUM, "Как называется наука о животных?", listOf("Ботаника", "Зоология", "Экология", "Астрономия"), 1),
        Question(110, Category.KNOWLEDGE, Difficulty.MEDIUM, "Сколько хромосом у человека?", listOf("42", "44", "46", "48"), 2),

// HARD (111–120)
        Question(111, Category.KNOWLEDGE, Difficulty.HARD, "Столица Канады?", listOf("Торонто", "Оттава", "Ванкувер", "Монреаль"), 1),
        Question(112, Category.KNOWLEDGE, Difficulty.HARD, "Кто изобрел лампу накаливания?", listOf("Тесла", "Эдисон", "Ньютон", "Фарадей"), 1),
        Question(113, Category.KNOWLEDGE, Difficulty.HARD, "Самая маленькая планета?", listOf("Марс", "Венера", "Меркурий", "Плутон"), 2),
        Question(114, Category.KNOWLEDGE, Difficulty.HARD, "Сколько океанов на Земле?", listOf("3", "4", "5", "6"), 2),
        Question(115, Category.KNOWLEDGE, Difficulty.HARD, "Какая кровь считается универсальной?", listOf("I", "II", "III", "IV"), 0),
        Question(116, Category.KNOWLEDGE, Difficulty.HARD, "Кто написал «Преступление и наказание»?", listOf("Толстой", "Чехов", "Достоевский", "Пушкин"), 2),
        Question(117, Category.KNOWLEDGE, Difficulty.HARD, "Самый твердый природный материал?", listOf("Железо", "Алмаз", "Гранит", "Кварц"), 1),
        Question(118, Category.KNOWLEDGE, Difficulty.HARD, "Как называется столица Японии?", listOf("Осака", "Киото", "Токио", "Хиросима"), 2),
        Question(119, Category.KNOWLEDGE, Difficulty.HARD, "Сколько костей у взрослого человека?", listOf("200", "206", "210", "215"), 1),
        Question(120, Category.KNOWLEDGE, Difficulty.HARD, "Какой химический символ у золота?", listOf("Ag", "Au", "Fe", "Zn"), 1),
    )
}