import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

export default function CardsPage() {
    const { id } = useParams();
    const [balance, setBalance] = useState("Загрузка...");

    useEffect(() => {
        if (!id) return;
        fetch(`http://localhost:8080/api/dashboard/${id}/stats`)
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    setBalance(data[0].value);
                }
            })
            .catch(err => console.error(err));
    }, [id]);

    if (!id) {
        return (
            <div className="page-body">
                <h3>Пожалуйста, выберите клиента из списка</h3>
            </div>
        );
    }

    return (
        <div className="page-body">
            <h3 style={{ marginBottom: '20px' }}>Продукты клиента</h3>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{
                    width: '320px', height: '200px', borderRadius: '16px', padding: '24px',
                    background: 'linear-gradient(135deg, #4f6ef7 0%, #2a41a8 100%)',
                    color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    boxShadow: '0 10px 20px rgba(79, 110, 247, 0.3)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '18px', fontWeight: '600' }}>BankCorp Black</span>
                        <i className="bi bi-wifi" style={{ fontSize: '24px' }}></i>
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>Баланс</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{balance}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', letterSpacing: '2px' }}>
                        <span>****</span><span>****</span><span>****</span><span>4281</span>
                    </div>
                </div>

                <div style={{
                    width: '320px', height: '200px', borderRadius: '16px', border: '2px dashed #cbd5e1',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b', cursor: 'pointer', transition: '0.2s'
                }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <i className="bi bi-plus-circle" style={{ fontSize: '32px', marginBottom: '10px' }}></i>
                    <span style={{ fontWeight: '500' }}>Выпустить новую карту</span>
                </div>
            </div>
        </div>
    );
}