import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ClientsPage() {
    const [clients, setClients] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fullName, setFullName] = useState("");
    const navigate = useNavigate();

    const loadClients = () => {
        fetch("http://localhost:8080/api/dashboard/clients")
            .then(res => res.json())
            .then(data => setClients(data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        loadClients();
    }, []);

    const handleCreateClient = (e) => {
        e.preventDefault();
        fetch("http://localhost:8080/api/dashboard/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName })
        }).then(() => {
            setIsModalOpen(false);
            setFullName("");
            loadClients();
        });
    };

    return (
        <div className="page-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0 }}>Список клиентов банка</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    style={{ padding: "10px 16px", background: "#4f6ef7", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                    Зарегистрировать нового клиента
                </button>
            </div>
            <div className="table-card" style={{ background: '#fff', padding: '24px', borderRadius: '14px' }}>
                <table className="transactions-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>ФИО Клиента</th>
                        <th>Основной баланс</th>
                        <th>Накопления</th>
                    </tr>
                    </thead>
                    <tbody>
                    {clients.map(c => (
                        <tr key={c.id} onClick={() => navigate(`/client/${c.id}`)} style={{ cursor: "pointer" }}>
                            <td className="td-id">#{c.id}</td>
                            <td style={{ fontWeight: '500' }}>{c.fullName}</td>
                            <td>{c.balance.toLocaleString()} ₽</td>
                            <td>{c.savings.toLocaleString()} ₽</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', width: '300px' }}>
                        <h3 style={{ marginBottom: '16px' }}>Новый клиент</h3>
                        <form onSubmit={handleCreateClient}>
                            <input required placeholder="ФИО клиента" value={fullName} onChange={e => setFullName(e.target.value)}
                                   style={{ width: '100%', padding: '8px', marginBottom: '16px', boxSizing: 'border-box' }} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" style={{ flex: 1, padding: '8px', background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Создать</button>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '8px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Отмена</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}