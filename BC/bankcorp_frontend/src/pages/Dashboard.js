import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import StatsCard from "../components/StatsCard";
import QuickActions from "../components/QuickActions";
import TransactionsTable from "../components/TransactionsTable";
import TransactionModal from "../components/TransactionModal";

export default function Dashboard() {
    const { id } = useParams();
    const [stats, setStats] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, isIncome: true });

    useEffect(() => {
        if (!id) return;
        fetch(`http://localhost:8080/api/dashboard/${id}/stats`)
            .then((res) => res.json())
            .then((data) => setStats(data))
            .catch((err) => console.error(err));
    }, [id, refreshKey]);

    if (!id) {
        return (
            <div className="page-body">
                <h3>Пожалуйста, выберите клиента из списка</h3>
            </div>
        );
    }

    const handleOpenModal = (isIncome) => setModalConfig({ isOpen: true, isIncome });

    const handleAddTransaction = (transactionData) => {
        fetch(`http://localhost:8080/api/dashboard/${id}/transactions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transactionData)
        }).then(() => {
            setModalConfig({ ...modalConfig, isOpen: false });
            setRefreshKey(old => old + 1);
        });
    };

    return (
        <div className="page-body">
            <div className="stats-grid">
                {stats.length > 0 ? (
                    stats.map((s, i) => <StatsCard key={i} {...s} />)
                ) : (
                    <p>Загрузка данных...</p>
                )}
            </div>
            <div className="bottom-section">
                <QuickActions onActionClick={handleOpenModal} />
                <TransactionsTable refreshKey={refreshKey} />
            </div>

            <TransactionModal
                isOpen={modalConfig.isOpen}
                isIncome={modalConfig.isIncome}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onSubmit={handleAddTransaction}
            />
        </div>
    );
}