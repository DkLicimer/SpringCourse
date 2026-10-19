import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, Lock, Unlock, Eye, Plus, 
  Search, AlertTriangle, FileText, UserPlus
} from 'lucide-react';

export default function DDMView() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('registry'); // 'registry' | 'audit'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Форма добавления льготника
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    birth_date: '',
    phone: '',
    category: 'Многодетная семья',
    passport_data: '',
    snils: '',
    residential_address: '',
    document_details: '',
    children_count: 0
  });

  const loadRegistry = () => {
    setLoading(true);
    api.get(`/ddm/profiles?search=${encodeURIComponent(search)}`)
      .then(res => setProfiles(res.data))
      .catch(err => alert(err.response?.data?.detail || 'Доступ к контуру 152-ФЗ заблокирован'))
      .finally(() => setLoading(false));
  };

  const loadAudit = () => {
    api.get('/ddm/audit-logs')
      .then(res => setAuditLogs(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadRegistry();
    if (activeTab === 'audit') loadAudit();
  }, [search, activeTab]);

  // Открытие карточки с дешифровкой на лету (записывается в аудит-лог)
  const handleOpenDecryptedCard = async (profileId) => {
    try {
      const res = await api.get(`/ddm/profiles/${profileId}`);
      setSelectedProfile(res.data);
    } catch (err) {
      alert('Ошибка доступа к карточке');
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ddm/profiles', form);
      setIsAddOpen(false);
      setForm({
        full_name: '', birth_date: '', phone: '', category: 'Многодетная семья',
        passport_data: '', snils: '', residential_address: '', document_details: '', children_count: 0
      });
      alert('Запись успешно зашифрована по протоколу AES-256 и внесена в реестр!');
      loadRegistry();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка создания записи');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      {/* Шапка контура ИСПДн */}
      <div className="bg-purple-950 text-white p-6 rounded-3xl shadow-lg border border-purple-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-purple-800/80 text-purple-200 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            ИСПДн Уровень защищенности УЗ-1 (152-ФЗ РФ)
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center mt-2">
            <ShieldCheck className="w-6 h-6 mr-2 text-purple-400" />
            Закрытый информационный контур ДДМ
          </h1>
          <p className="text-xs text-purple-200/80 mt-0.5">
            Реестр участников СВО, ветеранов боевых действий и многодетных семей со сквозным шифрованием
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow cursor-pointer transition flex items-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" /> Внести льготника в реестр
        </button>
      </div>

      {/* Предупреждение об ответственности */}
      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-amber-900 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <span className="font-semibold text-[11px]">
          Внимание! Все действия должностных лиц в данном модуле протоколируются в неизменяемый журнал безопасности. 
          Копирование и разглашение персональных данных преследуется по закону.
        </span>
      </div>

      {/* Вкладки */}
      <div className="flex border-b border-slate-200 space-x-6 font-bold">
        <button
          onClick={() => setActiveTab('registry')}
          className={`pb-3 border-b-2 cursor-pointer transition ${
            activeTab === 'registry' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Защищенный реестр ({profiles.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 border-b-2 cursor-pointer transition ${
            activeTab === 'audit' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Журнал аудита безопасности (152-ФЗ)
        </button>
      </div>

      {/* 1. РЕЕСТР ЛЬГОТНИКОВ (МАСКИРОВАННЫЙ ВИД) */}
      {activeTab === 'registry' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Поиск по ФИО в реестре..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-xl bg-slate-50 text-xs"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b text-slate-400 font-bold">
                  <th className="py-2.5">ФИО гражданина</th>
                  <th className="py-2.5">Категория льготы</th>
                  <th className="py-2.5">Дата рождения</th>
                  <th className="py-2.5">Статус шифрования</th>
                  <th className="py-2.5 text-right">Действие</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-purple-50/40 transition">
                    <td className="py-3 font-bold text-slate-900">{p.full_name}</td>
                    <td className="py-3">
                      <span className="bg-purple-100 text-purple-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">{p.birth_date}</td>
                    <td className="py-3 text-emerald-600 font-bold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> AES-256 Зашифровано
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleOpenDecryptedCard(p.id)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow cursor-pointer transition flex items-center gap-1 ml-auto"
                      >
                        <Unlock className="w-3.5 h-3.5" /> Расшифровать карточку
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. ЖУРНАЛ АУДИТА */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-sm">Протокол обращений к персональным данным</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-[11px]">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center">
                <div>
                  <span className="font-bold text-purple-900">{log.officer_name}</span>
                  <span className="text-slate-500 ml-2">[{log.action}]</span>
                  <p className="text-slate-700 mt-0.5">{log.details}</p>
                </div>
                <div className="text-right text-[10px] text-slate-400">
                  <span>IP: {log.ip_address || '127.0.0.1'}</span>
                  <span className="block">{new Date(log.timestamp).toLocaleString('ru-RU')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Модальное окно расшифрованной карточки */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full border border-purple-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Данные расшифрованы из ключа
                </span>
                <h3 className="font-black text-slate-900 text-base mt-1">{selectedProfile.full_name}</h3>
              </div>
              <button
                onClick={() => setSelectedProfile(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xl"
              >
                ×
              </button>
            </div>

            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-400 font-bold block">Паспорт РФ:</span> <b>{selectedProfile.passport_data || 'Не указан'}</b></div>
                <div><span className="text-slate-400 font-bold block">СНИЛС:</span> <b>{selectedProfile.snils || 'Не указан'}</b></div>
              </div>
              <div><span className="text-slate-400 font-bold block">Адрес проживания:</span> <b>{selectedProfile.residential_address || 'Не указан'}</b></div>
              <div><span className="text-slate-400 font-bold block">Удостоверение / Справка льготы:</span> <b>{selectedProfile.document_details || 'Не указано'}</b></div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setSelectedProfile(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl"
              >
                Закрыть карточку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно внесения в реестр */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleCreateProfile}
            className="bg-white p-6 rounded-3xl max-w-lg w-full border shadow-2xl space-y-4 my-8"
          >
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Внесение в закрытый реестр</h3>
              <button type="button" onClick={() => setIsAddOpen(false)} className="text-slate-400 font-bold text-lg">×</button>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">ФИО полностью</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Дата рождения</label>
                <input
                  type="date"
                  required
                  value={form.birth_date}
                  onChange={e => setForm({ ...form, birth_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Категория</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  <option value="Многодетная семья">Многодетная семья</option>
                  <option value="Участник СВО / Ветеран боевых действий">Участник СВО / Ветеран</option>
                  <option value="Член семьи участника СВО">Член семьи участника СВО</option>
                  <option value="Сирота / Оставшийся без попечения">Сирота / Опекаемый</option>
                  <option value="Инвалидность I-II группы">Инвалидность I-II группы</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border space-y-2">
              <span className="font-bold text-purple-900 block">Поля автоматического шифрования (AES-256):</span>
              <input
                type="text"
                placeholder="Серия и номер паспорта..."
                value={form.passport_data}
                onChange={e => setForm({ ...form, passport_data: e.target.value })}
                className="w-full px-3 py-1.5 border rounded-lg bg-white"
              />
              <input
                type="text"
                placeholder="СНИЛС (XXX-XXX-XXX XX)..."
                value={form.snils}
                onChange={e => setForm({ ...form, snils: e.target.value })}
                className="w-full px-3 py-1.5 border rounded-lg bg-white"
              />
              <input
                type="text"
                placeholder="Адрес проживания..."
                value={form.residential_address}
                onChange={e => setForm({ ...form, residential_address: e.target.value })}
                className="w-full px-3 py-1.5 border rounded-lg bg-white"
              />
              <input
                type="text"
                placeholder="Реквизиты удостоверения/справки..."
                value={form.document_details}
                onChange={e => setForm({ ...form, document_details: e.target.value })}
                className="w-full px-3 py-1.5 border rounded-lg bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Отмена</button>
              <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow">Зашифровать и сохранить</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}