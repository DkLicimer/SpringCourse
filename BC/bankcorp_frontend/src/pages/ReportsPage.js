import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Захардкодим данные по месяцам для демонстрации красоты графиков
const data = [
    { name: 'Январь', income: 40000, expense: 24000 },
    { name: 'Февраль', income: 30000, expense: 13980 },
    { name: 'Март', income: 45000, expense: 38000 },
    { name: 'Апрель', income: 42000, expense: 39080 },
    { name: 'Май', income: 55000, expense: 28000 },
    { name: 'Июнь', income: 38200, expense: 14870 },
];

export default function ReportsPage() {
    return (
        <div className="page-body">
            <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', height: '400px' }}>
                <h3 style={{ marginBottom: '20px' }}>Финансовая аналитика за полгода</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f1f5f9'}} />
                        <Legend iconType="circle" />
                        <Bar dataKey="income" name="Доходы" fill="#4f6ef7" radius={[4, 4, 0, 0]} barSize={30} />
                        <Bar dataKey="expense" name="Расходы" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}