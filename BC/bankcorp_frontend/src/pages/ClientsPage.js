import React, { useState, useEffect } from "react";

export default function ClientsPage() {
    const [clients, setClients] = useState([]);

    useEffect(() => {
        fetch("http://localhost:8080/api/dashboard/clients")
            .then(res => res.json())
            .then(data => setClients(data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="page-body">
            <div className="table-card" style={{ background: '#fff', padding: '24px', borderRadius: '14px' }}>
                <h3 style={{ marginBottom: '20px' }}>Список клиентов банка</h3>
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
                        <tr key={c.id}>
                            <td className="td-id">#{c.id}</td>
                            <td style={{ fontWeight: '500' }}>{c.fullName}</td>
                            <td>{c.balance.toLocaleString()} ₽</td>
                            <td>{c.savings.toLocaleString()} ₽</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}