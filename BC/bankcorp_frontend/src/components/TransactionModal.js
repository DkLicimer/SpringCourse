import React, { useState } from 'react';

export default function TransactionModal({ isOpen, onClose, onSubmit, isIncome }) {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            name,
            category: isIncome ? "Доход" : "Расход",
            amount: parseFloat(amount),
            positive: isIncome
        });
        setName('');
        setAmount('');
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', width: '300px' }}>
                <h3 style={{ marginBottom: '16px' }}>{isIncome ? "Пополнить баланс" : "Новый платеж"}</h3>
                <form onSubmit={handleSubmit}>
                    <input required placeholder="Название (напр. Зарплата)" value={name} onChange={e => setName(e.target.value)}
                           style={{ width: '100%', padding: '8px', marginBottom: '12px', boxSizing: 'border-box' }} />
                    <input required type="number" min="0.01" step="0.01" placeholder="Сумма" value={amount} onChange={e => setAmount(e.target.value)}
                           style={{ width: '100%', padding: '8px', marginBottom: '16px', boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" style={{ flex: 1, padding: '8px', background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Сохранить</button>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '8px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Отмена</button>
                    </div>
                </form>
            </div>
        </div>
    );
}