import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

export default function CardsPage() {
    const { id } = useParams();
    const [cards, setCards] = useState([]);

    // Состояния оформления: NONE -> SELECT -> CONTRACT -> SIGNED
    const [wizardState, setWizardState] = useState("NONE");
    const [contract, setContract] = useState(null);
    const [secretWord, setSecretWord] = useState("");
    const [loading, setLoading] = useState(false);

    const loadCards = () => {
        fetch(`http://localhost:8080/api/bank/products/${id}/cards`)
            .then(res => res.json())
            .then(data => setCards(data));
    };

    useEffect(() => {
        if (id) loadCards();
    }, [id]);

    const handleInitProduct = async (productType) => {
        setLoading(true);
        const res = await fetch(`http://localhost:8080/api/bank/products/${id}/init?productType=${productType}`, { method: 'POST' });
        const data = await res.json();
        setContract(data);
        setWizardState("CONTRACT");
        setLoading(false);
    };

    const handleSignContract = async () => {
        setLoading(true);
        const res = await fetch(`http://localhost:8080/api/bank/products/sign/${contract.id}?secretWord=${secretWord}`, { method: 'POST' });
        if (res.ok) {
            setWizardState("NONE");
            setContract(null);
            setSecretWord("");
            loadCards(); // Перезагружаем карты, появится новая
        }
        setLoading(false);
    };

    if (!id) return <div className="page-body"><h3>Выберите клиента</h3></div>;

    return (
        <div className="page-body">
            <h3 style={{ marginBottom: '20px' }}>Продукты клиента</h3>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '40px' }}>
                {cards.map(card => (
                    <div key={card.id} style={{
                        width: '320px', height: '200px', borderRadius: '16px', padding: '24px',
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '18px', fontWeight: '600' }}>{card.cardType === 'DEBIT_CARD' ? 'BankCorp Дебетовая' : 'BankCorp Кредитная'}</span>
                            <i className="bi bi-wifi" style={{ fontSize: '24px' }}></i>
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>Доступно</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{card.cardBalance.toLocaleString()} ₽</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', letterSpacing: '2px' }}>
                            <span>{card.cardNumber}</span>
                            <span style={{ fontSize: '12px', marginTop: '4px' }}>{card.expiryDate.substring(5,7)}/{card.expiryDate.substring(2,4)}</span>
                        </div>
                    </div>
                ))}

                <div onClick={() => setWizardState("SELECT")} style={{
                    width: '320px', height: '200px', borderRadius: '16px', border: '2px dashed #cbd5e1',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b', cursor: 'pointer', transition: '0.2s', background: wizardState === "SELECT" ? '#f8fafc' : 'transparent'
                }}>
                    <i className="bi bi-plus-circle" style={{ fontSize: '32px', marginBottom: '10px', color: '#4f6ef7' }}></i>
                    <span style={{ fontWeight: '500' }}>Оформить новый продукт</span>
                </div>
            </div>

            {/* МАСТЕР ОФОРМЛЕНИЯ КАРТЫ */}
            {wizardState !== "NONE" && (
                <div style={{ background: '#fff', padding: '30px', borderRadius: '14px', border: '1px solid #e5e7eb' }}>

                    {wizardState === "SELECT" && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between'}}>
                                <h4>Шаг 1: Выбор продукта</h4>
                                <button onClick={() => setWizardState("NONE")} style={{background:'none', border:'none', cursor:'pointer', color:'red'}}>Закрыть</button>
                            </div>
                            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                                <button disabled={loading} onClick={() => handleInitProduct("DEBIT_CARD")} style={{ flex: 1, padding: '20px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', fontSize: '16px' }}>
                                    <i className="bi bi-credit-card" style={{display:'block', fontSize:'24px', marginBottom:'10px', color:'#4f6ef7'}}></i>
                                    Дебетовая карта МИР
                                </button>
                                <button disabled={loading} onClick={() => handleInitProduct("CREDIT_CARD")} style={{ flex: 1, padding: '20px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', fontSize: '16px' }}>
                                    <i className="bi bi-credit-card-2-front" style={{display:'block', fontSize:'24px', marginBottom:'10px', color:'#10b981'}}></i>
                                    Кредитная карта (120 дней)
                                </button>
                            </div>
                        </div>
                    )}

                    {wizardState === "CONTRACT" && contract && (
                        <div>
                            <h4>Шаг 2: Подписание договора №{contract.id}</h4>
                            <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '8px', marginTop: '20px', whiteSpace: 'pre-wrap', fontSize: '14px', fontFamily: 'monospace', height: '200px', overflowY: 'auto' }}>
                                {contract.contractText}
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Кодовое слово (для идентификации в call-центре):</label>
                                <input required value={secretWord} onChange={e => setSecretWord(e.target.value)} placeholder="Например: Аврора" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', marginTop: '8px', boxSizing:'border-box' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button onClick={handleSignContract} disabled={loading || !secretWord} style={{ padding: '12px 24px', background: secretWord ? '#10b981' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: '6px', cursor: secretWord ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                                    {loading ? "Выпуск карты..." : "Подписать договор и выпустить карту"}
                                </button>
                                <button onClick={() => setWizardState("SELECT")} style={{ padding: '12px 24px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Назад</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}