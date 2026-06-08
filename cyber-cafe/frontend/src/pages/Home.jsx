import { Link } from "react-router-dom";

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

export default function Home() {
  return (
    <section className="rexon-hero">

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div className="row">
          <div className="col-lg-8 col-xl-7">

            {/* <div className="rexon-sub" style={{ color: "#99E5B7" }}>
              <span>Гейминг-клуб</span>
            </div> */}

            <h1 className="rexon-hero-title">
              Бронируй{" "}
              <strong>игровой ПК</strong>
              <br />онлайн
            </h1>

            <p className="rexon-hero-text">
              Выбирай свободный компьютер, указывай время - и приходи играть!
            </p>

            <Link to="/computers" className="btn btn-primary">
              Смотреть компьютеры
              <ArrowSvg />
            </Link>

          </div>
        </div>
      </div>
    </section>
  );
}