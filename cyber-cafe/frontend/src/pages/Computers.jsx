import { useEffect, useState } from "react";
import { useNavigate }         from "react-router-dom";
import { api }                 from "../api";
import { useAuth }             from "../auth";

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

export default function Computers() {
  const [computers, setComputers] = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [times,     setTimes]     = useState({ start: "", end: "" });
  const [msg,       setMsg]       = useState({ text: "", type: "" });
  const { user } = useAuth();
  const nav = useNavigate();

  const load = () => api.getComputers().then(setComputers).catch(() => {});

  useEffect(() => { load(); }, []);

  const closeModal = () => {
    setSelected(null);
    setTimes({ start: "", end: "" });
  };

  const book = async (e) => {
    e.preventDefault();
    setMsg({ text: "", type: "" });

    if (!user) return nav("/login");

    if (new Date(times.end) <= new Date(times.start)) {
      setMsg({ text: "Время окончания должно быть позже начала.", type: "error" });
      return;
    }

    try {
      await api.createBooking({
        computer_id: selected.id,
        start_time:  new Date(times.start).toISOString(),
        end_time:    new Date(times.end).toISOString(),
      });

      setMsg({ text: "Бронирование создано!", type: "success" });
      closeModal();
      load();
    } catch (err) {
      setMsg({ text: err.message ?? "Ошибка при бронировании.", type: "error" });
    }
  };

  const nowLocal = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
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
              <span>Компьютеры</span>
            </div>
            <h3 className="title">Доступные <span>компьютеры</span></h3>
          </div>
        </div>

        {msg.text && (
          <div className={`rexon-alert rexon-alert-${msg.type}`}>
            {msg.text}
          </div>
        )}

        <div className="row g-4">
          {computers.map((c) => (
            <div className="col-md-6 col-lg-4" key={c.id}>
              <div className="comp-card" style={{ position: "relative" }}>
                <span
                  className={`badge ${c.status === "available" ? "ok" : "off"}`}
                  style={{ position: "absolute", top: "12px", right: "12px" }}
                >
                  {c.status === "available" ? "Доступен" : "Обслуживание"}
                </span>

                <h4>{c.name}</h4>
                <p className="text-muted">{c.specs}</p>
                <p className="fw-bold">{c.price_per_hour} ₽/час</p>

                {c.status === "available" && (
                  <div className="mt-3">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setMsg({ text: "", type: "" });
                        setSelected(c);
                      }}
                    >
                      Забронировать <ArrowSvg />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="modal-bg" onClick={closeModal}>
          <form
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            onSubmit={book}
          >
            <h4>Бронь: {selected.name}</h4>

            <label>Начало</label>
            <input
              type="datetime-local"
              className="form-control mb-3"
              min={nowLocal()} 
              value={times.start}
              onChange={(e) => setTimes((prev) => ({ ...prev, start: e.target.value }))}
              required
            />

            <label>Конец</label>
            <input
              type="datetime-local"
              className="form-control mb-4"
              min={times.start || nowLocal()}
              value={times.end}
              onChange={(e) => setTimes((prev) => ({ ...prev, end: e.target.value }))}
              required
            />

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Подтвердить <ArrowSvg />
            </button>

            <button
              type="button"
              className="btn btn-secondary mt-2"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={closeModal}
            >
              Отмена
            </button>
          </form>
        </div>
      )}
    </section>
  );
}