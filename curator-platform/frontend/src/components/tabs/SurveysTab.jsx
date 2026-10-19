import React from 'react';
import { formatChitaTime } from '../../utils/dateUtils';

function SurveysTab({ 
  user, 
  activeSurveys, 
  selectedSurvey, 
  setSelectedSurvey, 
  surveyAnswers, 
  setSurveyAnswers, 
  surveyResponsesSummary, 
  setSurveyResponsesSummary, 
  onSurveySubmit, 
  onLoadSurveyResponses 
}) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      {selectedSurvey ? (
        <form onSubmit={onSurveySubmit} className="space-y-4 max-w-2xl text-xs">
          <button type="button" onClick={() => setSelectedSurvey(null)} className="font-bold text-zab-teal hover:underline cursor-pointer">
            ← Назад к списку анкет
          </button>
          <div className="border-b pb-2">
            <h3 className="font-bold text-base text-slate-800">{selectedSurvey.title}</h3>
            <p className="text-slate-500 mt-1">{selectedSurvey.description}</p>
          </div>

          {selectedSurvey.questions?.map((q, idx) => (
            <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 block">{idx + 1}. {q.text}</label>
              {q.type === 'number' ? (
                <input required type="number" onChange={(e) => setSurveyAnswers({...surveyAnswers, [q.id]: e.target.value})} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white" />
              ) : q.type === 'single_choice' ? (
                <div className="space-y-1.5">
                  {q.options?.split(';').map((opt, oIdx) => (
                    <label key={oIdx} className="flex items-center space-x-2 font-semibold text-slate-700 cursor-pointer">
                      <input required type="radio" name={`q_${q.id}`} value={opt.trim()} onChange={(e) => setSurveyAnswers({...surveyAnswers, [q.id]: e.target.value})} className="text-zab-teal" />
                      <span>{opt.trim()}</span>
                    </label>
                  ))}
                </div>
              ) : q.type === 'scale' ? (
                <div className="flex justify-between max-w-xs">
                  {[1,2,3,4,5].map(n => (
                    <label key={n} className="flex flex-col items-center font-bold text-slate-600 cursor-pointer">
                      <span>{n}</span>
                      <input required type="radio" name={`q_${q.id}`} value={n} onChange={(e) => setSurveyAnswers({...surveyAnswers, [q.id]: e.target.value})} className="text-zab-teal mt-1" />
                    </label>
                  ))}
                </div>
              ) : (
                <textarea required rows="2" onChange={(e) => setSurveyAnswers({...surveyAnswers, [q.id]: e.target.value})} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white" />
              )}
            </div>
          ))}

          <button type="submit" className="px-6 py-2.5 bg-zab-teal text-white font-bold rounded-xl shadow cursor-pointer">
            Отправить ответы на проверку
          </button>
        </form>
      ) : surveyResponsesSummary ? (
        <div className="space-y-4 text-xs">
          <button onClick={() => setSurveyResponsesSummary(null)} className="font-bold text-zab-teal hover:underline cursor-pointer">
            ← Назад к списку опросов
          </button>
          <h3 className="font-bold text-base text-slate-800">Сводка ответов кураторов: {surveyResponsesSummary.survey_title}</h3>
          <div className="space-y-3">
            {surveyResponsesSummary.submissions?.map((sub, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-zab-navy border-b pb-1">Куратор: {sub.curator_username} ({formatChitaTime(sub.submitted_at)})</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sub.answers.map((a, aIdx) => (
                    <div key={aIdx} className="bg-white p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block">{a.question_text}</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{a.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {activeSurveys.map(survey => (
            <div key={survey.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/60 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-bold text-sm text-slate-800">{survey.title}</h3>
                <p className="text-slate-500 text-xs mt-1">{survey.description}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedSurvey(survey)} className="px-3 py-1.5 bg-zab-teal text-white font-bold rounded-lg shadow cursor-pointer">
                  Пройти опрос
                </button>
                {user?.system_role === 'ADMIN' && (
                  <button onClick={() => onLoadSurveyResponses(survey.id)} className="px-3 py-1.5 bg-zab-navy text-white font-bold rounded-lg shadow cursor-pointer">
                    Сводка ответов
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SurveysTab;