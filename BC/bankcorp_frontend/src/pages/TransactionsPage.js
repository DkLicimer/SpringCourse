import React from "react";
import TransactionsTable from "../components/TransactionsTable";

export default function TransactionsPage() {
    const USER_ID = 1;

    return (
        <div className="page-body">
            <TransactionsTable userId={USER_ID} />
        </div>
    );
}