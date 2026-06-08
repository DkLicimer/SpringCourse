import { useEffect, useState } from "react";
import { api }                 from "../api";

const ArrowSvg = () => (
  <svg width="16" height="15" viewBox="0 0 16 15" fill="none">
    <path
      d="M3.90566 3.95808C3.88909 3.80893 4.02167 3.67634 4.1874 3.67634H11.1148
         C11.2806 3.67634 11.3966 3.79235 11.3966 3.95808V10.8855C11.3966 11.0512
         11.264 11.1838 11.1148 11.1673L10.4685 11.1838C10.3028 11.1838 10.1702
         11.0512 10.1868 10.9021L10.1702 5.74794L4.51885 11.3993C4.40284 11.5153
         4.23712 11.5153 4.12111 11.3993L3.65707 10.9352C3.55763 10.8358 3.54106
         10.6535 3.65707 10.5375L9.3084 4.88616H4.17083C4.02167 4.90273 3.88909
         4.77015 3.88909 4.60442L3.90566 3.95808Z"
      fill="currentColor"
    />
  </svg>
);

export default function Admin() {
  const [computers, setComputers] = useState([]);
  const [bookings,  setBookings]  = useState([]);
  const [form, setForm] = useState({
    name: "", specs: "", price_per_hour: "", status: "available",
  });

  const load = () => {
    api.getComputers().then(setComputers);
    api.getBookings().then(setBookings);
  };
  useEffect(() => { load(); }, []);

  const addComputer = async (e) => {
    e.preventDefault();
    await api.createComputer({ ...form });
    setForm({ name: "", specs: "", price_per_hour: "", status: "available" });
    load();
  };

  const remove = async (id) => { await api.deleteComputer(id); load(); };

  return (
    <section className="rexon-section">
      <div className="rexon-lines rexon-lines-dark">
        <span className="rexon-line" style={{ left: "30px" }} />
        <span className="rexon-line" style={{ left: "50%" }} />
        <span className="rexon-line" style={{ right: "30px" }} />
      </div>

      <div className="container" style={{ position: "relative", zIndex: 1 }}>

        <div className="row mb-5">
          <div className="col-12">
            <div className="rexon-sub">
              <span>Управление</span>
            </div>
            <h3 className="title">Админ-<span>панель</span></h3>
          </div>
        </div>

        <div className="row">
          <div className="col-12 col-lg-6">
            <form onSubmit={addComputer} className="rexon-form-card">
              <h4>Добавить компьютер</h4>

              <label className="form-label">Название</label>
              <input
                className="form-control mb-3"
                placeholder="Название"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />

              <label className="form-label">Характеристики</label>
              <input
                className="form-control mb-3"
                placeholder="CPU, GPU, RAM…"
                value={form.specs}
                onChange={(e) => setForm({ ...form, specs: e.target.value })}
              />

              <label className="form-label">Цена за час (₽)</label>
              <input
                className="form-control mb-4"
                type="number"
                placeholder="Цена за час"
                value={form.price_per_hour}
                onChange={(e) => setForm({ ...form, price_per_hour: e.target.value })}
                required
              />

              <button type="submit" className="btn btn-primary">
                Добавить <ArrowSvg />
              </button>
            </form>
          </div>
        </div>

        <div className="row mb-5">
          <div className="col-12">
            <div className="rexon-sub mb-3">
              <span>Компьютеры</span>
            </div>
            <div className="table-wrap">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Название</th><th>Цена</th><th>Статус</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {computers.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: "#000" }}>{c.name}</td>
                      <td>{c.price_per_hour} ₽</td>
                      <td>
                        <span className={`badge ${c.status === "available" ? "ok" : "off"}`}>
                          {c.status === "available" ? "Доступен" : "Обслуживание"}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm" onClick={() => remove(c.id)}>
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="rexon-sub mb-3">
              <span>Все бронирования</span>
            </div>
            <div className="table-wrap">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Пользователь</th><th>Компьютер</th><th>Начало</th><th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600, color: "#000" }}>{b.user_name}</td>
                      <td>{b.computer_name}</td>
                      <td>{new Date(b.start_time).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${b.status === "Активный" ? "ok" : "off"}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}