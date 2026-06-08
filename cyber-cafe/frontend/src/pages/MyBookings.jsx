import { useEffect, useState } from "react";
import { api }                 from "../api";

const StatusBadge = ({ status }) => {
  const map = {
    active:    { cls: "ok",  label: "Активно"   },
    cancelled: { cls: "off", label: "Отменено"  },
    completed: { cls: "",    label: "Завершено" },
  };
  const s = map[status] ?? { cls: "", label: status };
  return (
    <span
      className={`badge ${s.cls}`}
      style={!s.cls ? {
        background: "rgba(0,0,0,0.06)",
        color: "#555",
        border: "1px solid rgba(0,0,0,0.1)",
      } : {}}
    >
      {s.label}
    </span>
  );
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);

  const load = () => api.getBookings().then(setBookings).catch(() => {});
  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    await api.cancelBooking(id);
    load();
  };

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
              <span>Бронирования</span>
            </div>
            <h3 className="title">Мои <span>бронирования</span></h3>
          </div>
        </div>

        {bookings.length === 0 ? (
          <p style={{ color: "#888", fontSize: "16px" }}>
            У вас пока нет бронирований.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Компьютер</th>
                  <th>Начало</th>
                  <th>Конец</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, color: "#141414" }}>
                      {b.computer_name}
                    </td>
                    <td>{new Date(b.start_time).toLocaleString()}</td>
                    <td>{new Date(b.end_time).toLocaleString()}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>
                      {b.status === "active" && (
                        <button className="btn btn-sm" onClick={() => cancel(b.id)}>
                          Отменить
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}