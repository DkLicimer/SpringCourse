import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ClientsPage() {
    const [clients, setClients] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        lastName: "", firstName: "", middleName: "", birthDate: "",
        phone: "", passportSeriesNumber: "", passportIssueDate: "", passportIssuedBy: "", registrationAddress: ""
    });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const loadClients = () => {
        fetch("http://localhost:8080/api/dashboard/clients")
            .then(res => res.json())
            .then(data => setClients(data));
    };

    useEffect(() => { loadClients(); }, []);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleRegisterClient = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        data.append("documentPhoto", file);

        const res = await fetch("http://localhost:8080/api/bank/clients/register", {
            method: "POST", body: data
        });

        if (res.ok) {
            setIsModalOpen(false);
            loadClients();
        } else {
            const err = await res.text();
            alert("Ошибка верификации: " + err);
        }
        setLoading(false);
    };

    return (
        <div className="page-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0 }}>Единая база клиентов (KYC)</h3>
                <button onClick={() => setIsModalOpen(true)} style={{ padding: "10px 16px", background: "#4f6ef7", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                    + Идентифицировать нового клиента
                </button>
            </div>
            {/* ТАБЛИЦА КЛИЕНТОВ (Оставлена без изменений) */}
            <div className="table-card" style={{ background: '#fff', padding: '24px', borderRadius: '14px' }}>
                <table className="transactions-table">
                    <thead><tr><th>ID</th><th>ФИО Клиента</th><th>Основной баланс</th><th>Накопления</th></tr></thead>
                    <tbody>
                    {clients.map(c => (
                        <tr key={c.id} onClick={() => navigate(`/client/${c.id}`)} style={{ cursor: "pointer" }}>
                            <td className="td-id">#{c.id}</td><td style={{ fontWeight: '500' }}>{c.fullName || c.lastName + " " + c.firstName}</td>
                            <td>{c.balance.toLocaleString()} ₽</td><td>{c.savings.toLocaleString()} ₽</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '30px', borderRadius: '14px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '20px', borderBottom: '2px solid #f1f3f7', paddingBottom: '10px' }}>Анкета клиента (ФЗ-115)</h3>
                        <form onSubmit={handleRegisterClient} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{display:'flex', gap:'10px'}}>
                                <input required name="lastName" placeholder="Фамилия" onChange={handleInputChange} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                                <input required name="firstName" placeholder="Имя" onChange={handleInputChange} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                            </div>
                            <input name="middleName" placeholder="Отчество" onChange={handleInputChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />

                            <label style={{ fontSize: '12px', color: '#6b7280' }}>Дата рождения и Телефон</label>
                            <div style={{display:'flex', gap:'10px'}}>
                                <input required type="date" name="birthDate" onChange={handleInputChange} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                                <input required type="tel" name="phone" placeholder="+79991234567" onChange={handleInputChange} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                            </div>

                            <label style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px' }}>Паспортные данные</label>
                            <input required name="passportSeriesNumber" placeholder="Серия и номер (напр. 1234 567890)" onChange={handleInputChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                            <input required name="passportIssuedBy" placeholder="Кем выдан" onChange={handleInputChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                            <div style={{display:'flex', gap:'10px'}}>
                                <input required type="date" name="passportIssueDate" onChange={handleInputChange} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                                <input required name="registrationAddress" placeholder="Адрес регистрации" onChange={handleInputChange} style={{ flex: 2, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                            </div>

                            <label style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px' }}>Скан главного разворота паспорта</label>
                            <input required type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} style={{ padding: '10px', borderRadius: '6px', border: '1px dashed #4f6ef7', background: '#f8fafc' }} />

                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button type="submit" disabled={loading} style={{ flex: 2, padding: '12px', background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    {loading ? "Проверка по базам..." : "Зарегистрировать"}
                                </button>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Отмена</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}