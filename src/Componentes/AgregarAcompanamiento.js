import React, { useState, useEffect, useRef } from 'react';
import StudentsApi from "../api/StudentsApi";
import CompanionsApi from "../api/CompanionsApi";
import SessionsApi from "../api/SessionsApi";
import Swal from 'sweetalert2';
import '../Estilos/Acompanamiento.css';
import { expectOk } from "../utils/types";
import ApiClient from "../api/ApiClient";

const AgregarAcompanamiento = () => {
  const [formData, setFormData] = useState({
    estudiante: '',
    tipo: '',
    profesional: '',
    observaciones: '',
  });

  // NUEVOS ESTADOS PARA FECHA Y HORA EN DROPDOWNS
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');

  // Estados para el autocompletado de estudiantes
  const [studentQuery, setStudentQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const studentInputRef = useRef(null);

  // Estados para listas
  /** @type {[import("../Models/StudentModels").StudentResult[], Function]} */
  const [students, setStudents] = useState([]);
  /** @type {[import("../Models/CompanionModels").CompanionResult[], Function]} */
  const [companions, setCompanions] = useState([]);
  /** @type {[import("../Models/SessionModels").SessionResult[], Function]} */
  const [sessionTypes, setSessionTypes] = useState([]);

  const fetchStudents = async () => {
    // Old axios call (commented for reference)
      /*
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/v2/students/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      */
    // New API call
    const response = await StudentsApi.getAll();
    if (response.ok) {
      const filteredStudents = response.data.map(student => ({
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        fullName: `${student.first_name} ${student.last_name}`
      }));
      setStudents(filteredStudents);
      
    } else {
      console.error(response.error)
      Swal.fire({ title: 'Error', text: 'Error al cargar la lista de estudiantes', icon: 'error', confirmButtonText: 'Aceptar', confirmButtonColor: '#d33' });
    }
  };

  const fetchCompanions = async () => {
    // Old axios call (commented for reference)
      /*
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/v2/companions/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      */
    // New API call
      
    const response = await CompanionsApi.getAll();
    if (response.ok) {
      const filteredCompanions = response.data.map(companion => ({
        id: companion.id,
        first_name: companion.first_name,
        last_name: companion.last_name
      }));
      setCompanions(filteredCompanions);
      
    } else {
      console.error('Error fetching companions:', response.error);
    Swal.fire({ title: 'Error', text: 'Error al cargar la lista de profesionales', icon: 'error', confirmButtonText: 'Aceptar', confirmButtonColor: '#d33' });
    }
  };

  const fetchSessionTypes = async () => {
    // Old axios call (commented for reference)
      /*
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/v2/session-types/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      */
    // New API call
    const response = await SessionsApi.Types().getAll();
    if (response.ok) {
      const filteredCompanions = response.data.map(sessionType => ({
        id: sessionType.id,
        name: sessionType.name
      }));
      setCompanions(filteredCompanions);
      
    } else {
      console.error('Error fetching session types:', response.error);
      const fallbackSessionTypes = [
        { id: '686090b367343360f5acecaa', name: 'Asesoría Sociopedagógica (ASP)' },
        { id: '686090d467343360f5acecab', name: 'Tutoría' },
        { id: '686090df67343360f5acecac', name: 'Grupo de estudio' },
        { id: '686090f367343360f5acecad', name: 'Taller socioemocional' },
        { id: '6860912167343360f5acecae', name: 'Psicorientación' },
        { id: '6860912c67343360f5acecaf', name: 'Orientación sociofamiliar' },
        { id: '6860913867343360f5acecb0', name: 'Orientación a Bienestar' }
      ];
      setSessionTypes(fallbackSessionTypes);
    }
  };


  // Función para filtrar estudiantes basado en la búsqueda
const handleStudentInputChange = (/** @type {{ target: { value: any; }; }} */ e) => {
  const query = e.target.value;
  setStudentQuery(query);

  if (query.length > 0) {
    const filtered = students.filter(student =>
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(query.toLowerCase()) ||
      student.first_name.toLowerCase().includes(query.toLowerCase()) ||
      student.last_name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredStudents(filtered);
    setShowStudentDropdown(true);
  } else {
    setFilteredStudents([]);
    setShowStudentDropdown(false);
    setSelectedStudent(null);
    setFormData(prev => ({ ...prev, estudiante: '' }));
  }
};

  // Función para seleccionar un estudiante
  const handleStudentSelect = (/** @type {React.SetStateAction<null>} */ student) => {
    setSelectedStudent(student);
    setStudentQuery(student.fullName);
    setShowStudentDropdown(false);
    setFormData(prev => ({ ...prev, estudiante: student.id }));
  };

  // Función para manejar el clic fuera del dropdown
  const handleClickOutside = (/** @type {{ target: any; }} */ event) => {
    if (studentInputRef.current && !studentInputRef.current.contains(event.target)) {
      setShowStudentDropdown(false);
    }
  };

  const handleObservacionesChange = (/** @type {{ target: { value: any; }; }} */ e) => {
  setFormData(prev => ({ ...prev, observaciones: e.target.value }));
};

  // Effect para manejar clics fuera del componente
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (/** @type {{ target: { name: any; value: any; }; }} */ e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Funciones para generar opciones de fecha y hora
  const generateDays = () => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push(String(i).padStart(2, '0'));
    }
    return days;
  };

  const generateMonths = () => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return monthNames.map((name, index) => ({ value: String(index + 1).padStart(2, '0'), label: name }));
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    // Generar años desde (ej. 10 años atrás) hasta (ej. 5 años adelante)
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(String(i));
    }
    return years;
  };

  const generateHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) { // Formato 24 horas
      hours.push(String(i).padStart(2, '0'));
    }
    return hours;
  };

  const generateMinutes = () => {
    const minutes = [];
    for (let i = 0; i < 60; i += 5) { // Intervalos de 5 minutos
      minutes.push(String(i).padStart(2, '0'));
    }
    return minutes;
  };

  // --- Manejadores de cambio para los nuevos dropdowns ---
  const handleDayChange = (/** @type {{ target: { value: React.SetStateAction<string>; }; }} */ e) => setSelectedDay(e.target.value);
  const handleMonthChange = (/** @type {{ target: { value: React.SetStateAction<string>; }; }} */ e) => setSelectedMonth(e.target.value);
  const handleYearChange = (/** @type {{ target: { value: React.SetStateAction<string>; }; }} */ e) => setSelectedYear(e.target.value);
  const handleHourChange = (/** @type {{ target: { value: React.SetStateAction<string>; }; }} */ e) => setSelectedHour(e.target.value);
  const handleMinuteChange = (/** @type {{ target: { value: React.SetStateAction<string>; }; }} */ e) => setSelectedMinute(e.target.value);
  const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (/** @type {{ preventDefault: () => void; }} */ e) => {
  e.preventDefault();
  // Prevenir múltiples envíos
  if (isSubmitting) {
    return;
  }

  if (!selectedStudent) {
    Swal.fire({
      title: 'Error',
      text: 'Por favor selecciona un estudiante válido',
      icon: 'error',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#d33'
    });
    return;
  }

    // Validación de fecha y hora completa
    if (!selectedDay || !selectedMonth || !selectedYear || !selectedHour || !selectedMinute) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor, completa la fecha y la hora.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#d33'
      });
      return;
    }

    const fullDate = `${selectedYear}-${selectedMonth}-${selectedDay}`;
    const fullTime = `${selectedHour}:${selectedMinute}`;

    // Validar si la fecha es una fecha válida
    const checkDate = new Date(`${fullDate}T${fullTime}:00`);
    if (isNaN(checkDate.getTime())) {
        Swal.fire({
            title: 'Error',
            text: 'La fecha y/o hora seleccionada no es válida. Por favor, verifica el día para el mes y año seleccionados.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#d33'
        });
        return;
    }

    setIsSubmitting(true); //Se deshabilita el botón para evitar múltiples envíos

    try {
      const token = localStorage.getItem('token');
      // Old axios call (commented for reference)
      /*
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/v2/sessions/`,
        backendData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      */
      // New API call
      const SupportApi = (await import('../api/SupportApi')).default;
      SupportApi.setAuthToken && SupportApi.setAuthToken(token);
      const backendData = {
        id_student: formData.estudiante,
        id_companion: formData.profesional,
        id_session_type: formData.tipo,
        notes: formData.observaciones,
        date: `${fullDate}T${fullTime}:00`, 
        id_vulnerability_type: "685c2d33d96df17161191887",
        id_contact_reason:"693305b68d375622ce1f0487",
      };
      console.log('Datos enviados al backend:', backendData);
      const response = await SupportApi.createSession(backendData);
      console.log('Sesión creada:', response.data);
      // Alerta de éxito
      Swal.fire({
        title: '¡Éxito!',
        text: 'Acompañamiento creado exitosamente',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#28a745'
      });
      // Limpiar el formulario después de enviar exitosamente
      setFormData({
        estudiante: '',
        tipo: '',
        profesional: '',
        observaciones: '',
      });
      setStudentQuery('');
      setSelectedStudent(null);
      setShowStudentDropdown(false);
      // Resetear los dropdowns de fecha y hora
      setSelectedDay('');
      setSelectedMonth('');
      setSelectedYear('');
      setSelectedHour('');
      setSelectedMinute('');

    } catch (error) {
      console.error('Error:', error);
      console.error('Error details:', error.response?.data);

      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Error al registrar el acompañamiento',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#d33'
      });
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchStudents();
    fetchCompanions();
    fetchSessionTypes();
    // Establecer la fecha actual como valores predeterminados
    const today = new Date();
    setSelectedDay(String(today.getDate()).padStart(2, '0'));
    setSelectedMonth(String(today.getMonth() + 1).padStart(2, '0'));
    setSelectedYear(String(today.getFullYear()));
    setSelectedHour(String(today.getHours()).padStart(2, '0'));
    setSelectedMinute(String(Math.floor(today.getMinutes() / 5) * 5).padStart(2, '0')); // Minuto más cercano al intervalo de 5

  }, []);

  return (
    <div className="acompanamiento-layout">
      <img src={`${process.env.PUBLIC_URL || ''}/18.png`} alt="decorative" className="acompanamiento-image" />
      <div className="form-container">
      <h2>Añadir acompañamiento</h2>
      <form onSubmit={handleSubmit}>
        <label>Estudiante:<span className="required-asterisk">*</span></label>
        <div className="autocomplete-container" ref={studentInputRef}>
          <input
            type="text"
            value={studentQuery}
            onChange={handleStudentInputChange}
            placeholder="Buscar estudiante por nombre..."
            required
            style={{
              minHeight: '40px',
              padding: '20px',
              fontSize: '24px',
              width: '100%',
              border: selectedStudent ? '2px solid #28a745' : '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          {showStudentDropdown && filteredStudents.length > 0 && (
            <div className="autocomplete-dropdown">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="autocomplete-item"
                  onClick={() => handleStudentSelect(student)}
                  style={{           
                    padding: '20px',
                    fontSize: '18px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                    backgroundColor: '#fff'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fff';
                  }}
                >
                  {student.fullName}
                </div>
              ))}
            </div>
          )}
          {showStudentDropdown && filteredStudents.length === 0 && studentQuery.length > 0 && (
            <div className="autocomplete-dropdown">
              <div className="autocomplete-item" style={{ padding: '20px', color: '#666', fontSize: '18px' }}>
                No se encontraron estudiantes
              </div>
            </div>
          )}
        </div>

        <label>Tipo de acompañamiento:<span className="required-asterisk">*</span></label>
        <select name="tipo" value={formData.tipo} onChange={handleChange} required>
          <option value="">Seleccione...</option>
          {sessionTypes.length > 0 ? (
            sessionTypes.map((sessionType) => (
              <option key={sessionType.id} value={sessionType.id}>
                {sessionType.name}
              </option>
            ))
          ) : (
            <option value="" disabled>Cargando tipos de sesión...</option>
          )}
        </select>

        <label>Profesional responsable: <span className="required-asterisk">*</span></label>
        <select
          name="profesional"
          value={formData.profesional}
          onChange={handleChange}
          required
          style={{ minHeight: '40px', padding: '20px' }}
        >
          <option value="">Seleccione un profesional</option>
          {companions.length > 0 ? (
            companions.map((companion) => (
              <option key={companion.id} value={companion.id}>
                {companion.first_name} {companion.last_name}
              </option>
            ))
          ) : (
            <option value="" disabled>Cargando profesionales...</option>
          )}
        </select>

            <label>Fecha: <span className="required-asterisk">*</span></label>
            <div className="date-time-select-group">
                <select value={selectedDay} onChange={handleDayChange} required>
                    <option value="">Día </option>
                    {generateDays().map(day => (
                        <option key={day} value={day}>{day}</option>
                    ))}
                </select>
                <select value={selectedMonth} onChange={handleMonthChange} required>
                    <option value="">Mes</option>
                    {generateMonths().map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                </select>
                <select value={selectedYear} onChange={handleYearChange} required>
                    <option value="">Año</option>
                    {generateYears().map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

            <label>Hora: <span className="required-asterisk">*</span></label>
            <div className="date-time-select-group">
                <select value={selectedHour} onChange={handleHourChange} required>
                    <option value="">Hora </option>
                    {generateHours().map(hour => (
                        <option key={hour} value={hour}>{hour}</option>
                    ))}
                </select>
                <select value={selectedMinute} onChange={handleMinuteChange} required>
                    <option value="">Minuto</option>
                    {generateMinutes().map(minute => (
                        <option key={minute} value={minute}>{minute}</option>
                    ))}
                </select>
            </div>

        <label>Observaciones:</label>
        <textarea
          name="observaciones"
          value={formData.observaciones}
          onChange={handleObservacionesChange} 
          rows="4"
          className="observaciones-textarea"
          placeholder="Ingresa las observaciones del acompañamiento..."
        />

        <button type="submit">Guardar</button>
      </form>
      </div>
    </div>
  );
};

export default AgregarAcompanamiento;