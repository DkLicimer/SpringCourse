import React from "react";
import { useParams } from "react-router-dom";
import TransactionsTable from "../components/TransactionsTable";

export default function TransactionsPage() {
    const { id } = useParams();

    if (!id) {
        return (
            <div className="page-body">
                <h3>Пожалуйста, выберите клиента из списка</h3>
            </div>
        );
    }

    return (
        <div className="page-body">
            <TransactionsTable />
        </div>
    );
}