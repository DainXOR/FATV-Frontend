import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import "../Estilos/MonthPicker.css";

export default function MonthPicker({ value, onChange }) {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(
    value ? Number(value.split("-")[0]) : now.getFullYear()
  );

  const months = [
    "Enero", "Febrero", "Marzo", "Abril",
    "Mayo", "Junio", "Julio", "Agosto",
    "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  const toggle = () => setOpen(!open);

  const handleSelect = (index) => {
    const formatted = `${year}-${String(index + 1).padStart(2, "0")}`;
    onChange(formatted);
    setOpen(false);
  };

  return (
    <div className="monthpicker-wrapper">
      {/* Input card */}
      <div className="monthpicker-input" onClick={toggle}>
        <span>
          {value
            ? `${months[parseInt(value.split("-")[1]) - 1]} ${
                value.split("-")[0]
              }`
            : "Seleccionar mes"}
        </span>
        <Calendar className="calendar-icon" />
      </div>

      {/* Popup */}
      {open && (
        <div className="monthpicker-popup">
          <div className="popup-header">
            <button
              className="nav-btn"
              onClick={() => setYear(year - 1)}
            >
              <ChevronLeft size={20} />
            </button>

            <span className="popup-year">{year}</span>

            <button
              className="nav-btn"
              onClick={() => setYear(year + 1)}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="months-grid">
            {months.map((m, i) => (
              <button
                key={i}
                className="month-pill"
                onClick={() => handleSelect(i)}
              >
                {m.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}