import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ClientsPage() {
    const [clients, setClients] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        lastName: "", firstName: "", middleName: "", birthDate: "",
        phone: "+7", passportSeriesNumber: "", passportIssueDate: "",
        passportIssuedBy: "", departmentCode: "", snils: "", registrationAddress: ""
    });

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    // Состояния для красивой валидации
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");

    const navigate = useNavigate();

    const loadClients = () => {
        fetch("http://localhost:8080/api/dashboard/clients")
            .then(res => res.json())
            .then(data => setClients(data));
    };

    useEffect(() => { loadClients(); }, []);

    // При вводе текста очищаем ошибку конкретного поля
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
        setGeneralError(""); // Сбрасываем общую ошибку при вводе
    };

    const handleRegisterClient = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setGeneralError("");

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        data.append("documentPhoto", file);

        try {
            const res = await fetch("http://localhost:8080/api/bank/clients/register", {
                method: "POST", body: data
            });

            if (res.ok) {
                const newUser = await res.json();
                setIsModalOpen(false);
                setFormData({lastName: "", firstName: "", middleName: "", birthDate: "", phone: "+7", passportSeriesNumber: "", passportIssueDate: "", passportIssuedBy: "", departmentCode: "", snils: "", registrationAddress: ""});
                navigate(`/client/${newUser.id}/cards`);
            } else {
                const errData = await res.json();
                if (errData.general) {
                    setGeneralError(errData.general); // Ошибка бизнес-логики (возраст, дубликат)
                } else {
                    setErrors(errData); // Ошибки валидации полей { "phone": "Неверный формат" }
                }
            }
        } catch (error) {
            setGeneralError("Ошибка соединения с сервером.");
        }
        setLoading(false);
    };

    // Стили для инпута (с красной рамкой при ошибке)
    const getInputStyle = (fieldName) => ({
        width: '100%',
        padding: '10px 12px',
        borderRadius: '6px',
        border: errors[fieldName] ? '1px solid #ef4444' : '1px solid #d1d5db',
        backgroundColor: errors[fieldName] ? '#fef2f2' : '#ffffff',
        outline: 'none',
        transition: '0.2s',
        boxSizing: 'border-box'
    });

    // Компонент для вывода текста ошибки под полем
    const ErrorMsg = ({ field }) => errors[field] ? (
        <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', fontWeight: '500' }}>
            {errors[field]}
        </div>
    ) : null;

    return (
        <div className="page-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0 }}>Единая база клиентов (KYC)</h3>
                <button onClick={() => {setIsModalOpen(true); setErrors({}); setGeneralError("");}}
                        style={{ padding: "10px 16px", background: "#4f6ef7", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                    + Идентифицировать нового клиента
                </button>
            </div>

            <div className="table-card" style={{ background: '#fff', padding: '24px', borderRadius: '14px' }}>
                <table className="transactions-table">
                    <thead><tr><th>ID</th><th>ФИО Клиента</th><th>Основной баланс</th><th>Накопления</th></tr></thead>
                    <tbody>
                    {clients.map(c => (
                        <tr key={c.id} onClick={() => navigate(`/client/${c.id}`)} style={{ cursor: "pointer" }}>
                            <td className="td-id">#{c.id}</td><td style={{ fontWeight: '500' }}>{c.lastName + " " + c.firstName + (c.middleName ? " " + c.middleName : "")}</td>
                            <td>{c.balance.toLocaleString()} ₽</td><td>{c.savings.toLocaleString()} ₽</td>
                        </tr>
                    ))}
                    {clients.length === 0 && <tr><td colSpan="4" style={{textAlign:"center", padding:"20px"}}>Нет зарегистрированных клиентов</td></tr>}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#f8fafc', padding: '30px', borderRadius: '16px', width: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                            <h3 style={{ margin: 0, color: '#1e293b' }}>Анкета клиента (ФЗ-115)</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                        </div>

                        {/* Плашка общей ошибки (Бизнес логика) */}
                        {generalError && (
                            <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '12px 16px', marginBottom: '20px', borderRadius: '4px', color: '#991b1b', fontSize: '14px', fontWeight: '500' }}>
                                <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '8px' }}></i>
                                {generalError}
                            </div>
                        )}

                        <form onSubmit={handleRegisterClient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            {/* ФИО */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <input name="lastName" placeholder="Фамилия (кириллица)" value={formData.lastName} onChange={handleInputChange} style={getInputStyle('lastName')} />
                                    <ErrorMsg field="lastName" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <input name="firstName" placeholder="Имя (кириллица)" value={formData.firstName} onChange={handleInputChange} style={getInputStyle('firstName')} />
                                    <ErrorMsg field="firstName" />
                                </div>
                            </div>
                            <div>
                                <input name="middleName" placeholder="Отчество (при наличии)" value={formData.middleName} onChange={handleInputChange} style={getInputStyle('middleName')} />
                                <ErrorMsg field="middleName" />
                            </div>

                            {/* Дата рождения и Телефон */}
                            <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginTop: '8px' }}>Контакты и возраст</label>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} style={getInputStyle('birthDate')} title="Дата рождения" />
                                    <ErrorMsg field="birthDate" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <input type="tel" name="phone" placeholder="+79991234567" value={formData.phone} onChange={handleInputChange} style={getInputStyle('phone')} />
                                    <ErrorMsg field="phone" />
                                </div>
                            </div>

                            {/* Документы */}
                            <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginTop: '8px' }}>Идентификационные данные</label>
                            <div>
                                <input name="snils" placeholder="СНИЛС (123-456-789 00)" value={formData.snils} onChange={handleInputChange} style={getInputStyle('snils')} />
                                <ErrorMsg field="snils" />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <input name="passportSeriesNumber" placeholder="Паспорт (1234 567890)" value={formData.passportSeriesNumber} onChange={handleInputChange} style={getInputStyle('passportSeriesNumber')} />
                                    <ErrorMsg field="passportSeriesNumber" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <input type="date" name="passportIssueDate" value={formData.passportIssueDate} onChange={handleInputChange} style={getInputStyle('passportIssueDate')} title="Дата выдачи" />
                                    <ErrorMsg field="passportIssueDate" />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 2 }}>
                                    <input name="passportIssuedBy" placeholder="Кем выдан паспорт" value={formData.passportIssuedBy} onChange={handleInputChange} style={getInputStyle('passportIssuedBy')} />
                                    <ErrorMsg field="passportIssuedBy" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <input name="departmentCode" placeholder="Код подр. (123-456)" value={formData.departmentCode} onChange={handleInputChange} style={getInputStyle('departmentCode')} />
                                    <ErrorMsg field="departmentCode" />
                                </div>
                            </div>

                            <div>
                                <input name="registrationAddress" placeholder="Адрес регистрации полностью" value={formData.registrationAddress} onChange={handleInputChange} style={getInputStyle('registrationAddress')} />
                                <ErrorMsg field="registrationAddress" />
                            </div>

                            {/* Скан */}
                            <div style={{ marginTop: '8px' }}>
                                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Скан главного разворота паспорта</label>
                                <input type="file" accept="image/*,.pdf" onChange={e => {setFile(e.target.files[0]); setGeneralError("");}}
                                       style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '2px dashed #cbd5e1', background: '#ffffff', boxSizing: 'border-box' }} />
                                {!file && loading && <div style={{color: '#ef4444', fontSize: '11px', marginTop: '4px'}}>Скан паспорта обязателен</div>}
                            </div>

                            {/* Кнопки */}
                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '14px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                                    Отмена
                                </button>
                                <button type="submit" disabled={loading} style={{ flex: 2, padding: '14px', background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                    {loading ? (
                                        <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Проверка баз...</>
                                    ) : (
                                        "Зарегистрировать и Открыть счет"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}