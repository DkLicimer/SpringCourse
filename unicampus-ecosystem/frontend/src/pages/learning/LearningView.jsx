import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  GraduationCap, BookOpen, CheckCircle2, Award, 
  HelpCircle, ChevronRight, X
} from 'lucide-react';

export default function LearningView() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [myEnrollments, setMyEnrollments] = useState([]);
  
  // Тестирование
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  const loadCourses = () => {
    api.get('/learning/courses')
      .then(res => setCourses(res.data))
      .catch(err => console.error(err));

    api.get('/learning/my-enrollments')
      .then(res => setMyEnrollments(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const openCourseDetail = async (courseId) => {
    try {
      const res = await api.get(`/learning/courses/${courseId}`);
      setSelectedCourse(res.data);
      if (res.data.lessons.length > 0) {
        setActiveLesson(res.data.lessons[0]);
      }
    } catch (err) {
      alert('Ошибка загрузки курса');
    }
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    try {
      const answersPayload = Object.entries(quizAnswers).map(([qId, optId]) => ({
        question_id: qId,
        selected_option_id: optId
      }));

      const res = await api.post(`/learning/courses/${selectedCourse.id}/quiz/submit`, {
        answers: answersPayload
      });
      setQuizResult(res.data);
      loadCourses();
    } catch (err) {
      alert('Ошибка при сдаче теста');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      {/* Шапка */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <GraduationCap className="w-6 h-6 mr-2 text-blue-600" />
            Обучающие курсы и инструктажи ЗабГУ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Обязательные вводные инструктажи и адаптационные курсы с выдачей сертификатов
          </p>
        </div>
      </div>

      {/* Каталог курсов */}
      {!selectedCourse ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => {
            const enrollment = myEnrollments.find(e => e.course_id === course.id);

            return (
              <div
                key={course.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
                      {course.target_role === 'ALL' ? 'Для всех' : course.target_role}
                    </span>
                    {enrollment?.status === 'COMPLETED' && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Сдан
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-slate-900">{course.title}</h3>
                  <p className="text-slate-500 line-clamp-3 leading-relaxed">{course.description}</p>
                </div>

                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">{course.lessons_count} тем / уроков</span>
                  <button
                    onClick={() => openCourseDetail(course.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow cursor-pointer transition"
                  >
                    Открыть курс →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Просмотр открытого курса */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <button
                onClick={() => { setSelectedCourse(null); setActiveLesson(null); }}
                className="text-blue-600 font-bold hover:underline mb-1 cursor-pointer"
              >
                ← Вернуться в каталог курсов
              </button>
              <h2 className="text-lg font-black text-slate-900">{selectedCourse.title}</h2>
            </div>

            {selectedCourse.questions.length > 0 && (
              <button
                onClick={() => { setIsQuizOpen(true); setQuizResult(null); }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer transition flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" /> Пройти итоговый тест
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Оглавление уроков */}
            <div className="space-y-2 border-r pr-4">
              <span className="font-bold text-slate-500 uppercase tracking-wider block mb-2">Программа:</span>
              {selectedCourse.lessons.map((lesson, idx) => (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className={`w-full text-left p-3 rounded-2xl font-bold flex items-center justify-between transition cursor-pointer ${
                    activeLesson?.id === lesson.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{idx + 1}. {lesson.title}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>

            {/* Содержимое урока */}
            <div className="lg:col-span-2 space-y-4">
              {activeLesson ? (
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-3">{activeLesson.title}</h3>
                  <div className="p-5 bg-slate-50 rounded-2xl border text-slate-700 leading-relaxed text-xs">
                    {activeLesson.content_text}
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 py-12 text-center">Выберите тему для изучения</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно проверочного теста */}
      {isQuizOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full border shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Итоговый тест по курсу</h3>
              <button onClick={() => setIsQuizOpen(false)} className="text-slate-400 font-bold text-lg">×</button>
            </div>

            {!quizResult ? (
              <form onSubmit={handleQuizSubmit} className="space-y-4">
                {selectedCourse.questions.map((q, qIdx) => (
                  <div key={q.id} className="p-4 bg-slate-50 border rounded-2xl space-y-2">
                    <span className="font-bold text-slate-900 block">{qIdx + 1}. {q.question_text}</span>
                    <div className="space-y-1.5 pl-2">
                      {q.options.map(opt => (
                        <label key={opt.id} className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                          <input
                            type="radio"
                            name={q.id}
                            required
                            onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt.id })}
                            className="text-blue-600"
                          />
                          <span>{opt.option_text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer transition"
                >
                  Отправить ответы на проверку
                </button>
              </form>
            ) : (
              <div className="text-center space-y-3 py-4 animate-fade-in">
                {quizResult.is_passed ? (
                  <>
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                    <h4 className="text-lg font-black text-slate-900">Поздравляем! Тест успешно сдан!</h4>
                    <p className="text-xs text-slate-600">
                      Результат: <b>{quizResult.score_percent}%</b> правильных ответов.
                    </p>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 font-mono font-bold">
                      Номер сертификата: {quizResult.certificate_number}
                    </div>
                  </>
                ) : (
                  <>
                    <X className="w-12 h-12 text-red-500 mx-auto" />
                    <h4 className="text-lg font-black text-slate-900">Тест не пройден</h4>
                    <p className="text-xs text-slate-600">
                      Результат: <b>{quizResult.score_percent}%</b>. Порог сдачи: {selectedCourse.passing_score_percent}%.
                    </p>
                    <button
                      onClick={() => setQuizResult(null)}
                      className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl"
                    >
                      Попробовать снова
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}