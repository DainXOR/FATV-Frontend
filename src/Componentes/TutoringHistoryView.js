import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, User, BookOpen, Clock, FileText, Edit3} from 'lucide-react';
import MonthPicker from "../Componentes/MonthPicker";


import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

import '../Estilos/TutoringHistoryView.css';
import Swal from 'sweetalert2';
import axios from 'axios';

const ITEMS_PER_PAGE = 10; 

const TutoringHistoryView = () => {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [sessionTypes, setSessionTypes] = useState([]);

  // Estados para filtros
  const [statusFilter, setStatusFilter] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [filterMonth, setFilterMonth] = useState(''); // formato YYYY-MM

  // Estados para el modal de estadísticas
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentStats, setStudentStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Estados para edición de estado
  const [editingStatus, setEditingStatus] = useState(null);
  const [tempStatus, setTempStatus] = useState('');

  // Opciones de estado disponibles
  const statusOptions = [
    { value: 'Completado', label: 'Completado', color: '#28a745' },
    { value: 'Pendiente', label: 'Pendiente', color: '#ffc107' },
    { value: 'Cancelado', label: 'Cancelado', color: '#dc3545' },
    { value: 'No asistió', label: 'No asistió', color: '#2cb4ddff' }
  ];

  // Cargar tipos de sesión
  const fetchSessionTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/v2/session-types/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const sessionTypesData = response.data.data || [];
      setSessionTypes(sessionTypesData);
      return sessionTypesData; // Retornamos los datos para uso inmediato
    } catch (error) {
      console.error('Error al cargar tipos de sesión:', error);
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
      return fallbackSessionTypes;
    }
  };

  // Cargar todas las sesiones
  const fetchSessions = async (sessionTypesArray = []) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Cargar todas las sesiones sin paginación
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/v1/session/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const sessionsData = Array.isArray(response.data) ? response.data : response.data.data || [];
      
      console.log('Sesiones recibidas:', sessionsData.slice(0, 2)); 
      
      const mappedSessions = sessionsData.map(session => {

        console.log('Session notes field:', session.session_notes);
        
        return {
          ...session,
          first_name: session.name || 'N/A',
          last_name: session.surname || 'N/A',
          first_name_companion: session.companion_name || 'N/A',
          last_name_companion: session.companion_surname || 'N/A',
          companion_specialty: session.companion_speciality || 'N/A',
          session_type_name: session.session_type_name ||
            sessionTypesArray.find(type => type.id === session.id_session_type)?.name || 'No definido',
          notes: session.session_notes || 'Sin notas', 
          status: session.status || 'Pendiente'
        };
      });

      setSessions(mappedSessions);
      setFilteredSessions(mappedSessions);

    } catch (err) {
      console.error('Error al cargar sesiones:', err);
      setError(err.message);
      Swal.fire({
        title: 'Error',
        text: err.message || 'Error al cargar las sesiones',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...sessions];

    // Filtro por estado
    if (statusFilter && statusFilter !== '') {
      filtered = filtered.filter(session => 
        session.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Filtro por especialidad
    if (specialtyFilter && specialtyFilter !== '') {
      filtered = filtered.filter(session => 
        session.session_type_name === specialtyFilter
      );
    }

    // Filtro por mes (filterMonth formato YYYY-MM)
    if (filterMonth) {
      const [yearStr, monthStr] = filterMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      filtered = filtered.filter(session => {
        const fecha = new Date(session.created_at || session.date || session.start_time || session.fecha);
        if (isNaN(fecha.getTime())) return false; 
        return fecha.getFullYear() === year && (fecha.getMonth() + 1) === month;
      });
    }

    setFilteredSessions(filtered);
    setCurrentPage(1); 
  }, [sessions, statusFilter, specialtyFilter, filterMonth]);
  

  // Función para actualizar el estado de la sesión
  const updateSessionStatus = async (sessionId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${process.env.REACT_APP_BACKEND_URL}/api/v1/session/${sessionId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Actualizar el estado local
      const updatedSessions = sessions.map((session) =>
        session.id === sessionId ? { ...session, status: newStatus } : session
      );
      setSessions(updatedSessions);

      Swal.fire({
        title: 'Éxito',
        text: 'Estado actualizado correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error al actualizar estado:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'No se pudo actualizar el estado',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#d33'
      });
    }
  };

  // Funciones para manejar la edición de estado
  const handleStatusEdit = (sessionId, currentStatus) => {
    setEditingStatus(sessionId);
    setTempStatus(currentStatus || 'Completado');
  };

  const handleStatusSave = async (sessionId) => {
    if (tempStatus !== sessions.find(s => s.id === sessionId)?.status) {
      await updateSessionStatus(sessionId, tempStatus);
    }
    setEditingStatus(null);
    setTempStatus('');
  };

  const handleStatusCancel = () => {
    setEditingStatus(null);
    setTempStatus('');
  };

  // Función para obtener estadísticas del estudiante
  const fetchStudentStats = async (studentId, studentName) => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('token');

      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/v2/sessions/student/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const studentSessions = response.data.data || [];

      const statsMap = {};
      studentSessions.forEach(session => {
        const sessionTypeName = sessionTypes.find(type => type.id === session.id_session_type)?.name || 'No definido';

        if (statsMap[sessionTypeName]) {
          statsMap[sessionTypeName]++;
        } else {
          statsMap[sessionTypeName] = 1;
        }
      });

      const statsArray = Object.entries(statsMap)
        .map(([name, count]) => ({
          session_type: name,
          total_sessions: count
        }))
        .sort((a, b) => b.total_sessions - a.total_sessions);

      setStudentStats(statsArray);

    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar las estadísticas del estudiante',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#d33'
      });
      setStudentStats([]);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleStudentClick = (session) => {
    console.log('Sesión clickeada:', session);

    const studentId = session.id_student;
    const firstName = session.first_name || 'N/A';
    const lastName = session.last_name || 'N/A';

    if (!studentId) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo identificar el ID del estudiante',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#d33'
      });
      return;
    }

    const student = {
      id: studentId,
      name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName
    };

    console.log('Estudiante seleccionado:', student);

    setSelectedStudent(student);
    setShowStudentModal(true);
    fetchStudentStats(student.id, student.name);
  };

  // Cerrar modal
  const closeModal = () => {
    setShowStudentModal(false);
    setSelectedStudent(null);
    setStudentStats([]);
  };

  // Función para cambiar página
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Componente para el selector de estado
  const StatusSelector = ({ session }) => {
    const isEditing = editingStatus === session.id;

    if (isEditing) {
      return (
        <div className="status-editor">
          <select
            value={tempStatus}
            onChange={(e) => setTempStatus(e.target.value)}
            className="status-select"
            autoFocus
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="status-actions">
            <button
              onClick={() => handleStatusSave(session.id)}
              className="status-save-btn"
              title="Guardar cambios"
            >
              <SaveIcon style={{ fontSize: 16 }} />
            </button>
            <button
              onClick={handleStatusCancel}
              className="status-cancel-btn"
              title="Cancelar edición"
            >
              <CancelIcon style={{ fontSize: 16 }} />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="status-display">
        <span
          className={`status-badge ${getStatusClass(session.status)} editable-status`}
          onClick={() => handleStatusEdit(session.id, session.status)}
          title="Click para editar estado"
        >
          {session.status || 'Completado'}
        </span>
      </div>
    );
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessionTypesData = await fetchSessionTypes();
        await fetchSessions(sessionTypesData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completado':
      case 'completed':
        return 'status-completed';
      case 'pendiente':
      case 'pending':
        return 'status-pending';
      case 'cancelado':
      case 'cancelled':
        return 'status-cancelled';
      case 'no asistió':
      case 'no show':
        return 'status-noshow';
      default:
        return 'status-default';
    }
  };

  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentSessions = filteredSessions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando sesiones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="tutoring-history-container">
      <div className="tutoring-history-card">

        <div className="header">
          <h1 className="header-title">Historial de acompañamientos</h1>
          <p className="header-subtitle">Gestiona y revisa las sesiones de tutoría</p>
        </div>

        <div className="filters-container">
          <div className="filters">
            <div className="filter-group">
              <User className="filter-icon" />
              <span className="filter-label">Filtros:</span>
            </div>
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="No asistió">No asistió</option>
              <option value="Completado">Completado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Cancelado">Cancelado</option>
            </select>
            <select 
              className="filter-select"
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
            >
              <option value="">Todas las especialidades</option>
              {sessionTypes.map((type) => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
            <MonthPicker
              value={filterMonth}
              onChange={(v) => setFilterMonth(v)}
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="table-container">
          <table className="sessions-table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">
                  <div className="header-content">
                    <User className="header-icon" />
                    Estudiante
                  </div>
                </th>
                <th className="table-header-cell">
                  <div className="header-content">
                    <BookOpen className="header-icon" />
                    Acompañante
                  </div>
                </th>
                <th className="table-header-cell">Tipo de Acompañamiento</th>
                <th className="table-header-cell">
                  <div className="header-content">
                    <FileText className="header-icon" />
                    Notas
                  </div>
                </th>
                <th className="table-header-cell">
                  <div className="header-content">
                    <Calendar className="header-icon" />
                    Fecha
                  </div>
                </th>
                <th className="table-header-cell">Estado</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {currentSessions.map((session, index) => (
                <tr key={session.id || index} className="table-row">
                  <td className="table-cell">
                    <div
                      className="student-info clickable-student"
                      onClick={() => handleStudentClick(session)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="student-avatar">
                        <span className="avatar-text">
                          {(session.first_name || 'N')[0]}{(session.last_name || 'N')[0]}
                        </span>
                      </div>
                      <div className="student-details">
                        <div className="student-name">
                          {session.first_name} {session.last_name}
                        </div>
                        <div className="student-role">Estudiante</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    {session.first_name_companion} {session.last_name_companion}
                  </td>
                  <td className="table-cell">
                    <span className="specialty-badge">
                      {session.session_type_name}
                    </span>
                  </td>
                  <td className="table-cell">
                    {session.notes || 'Sin notas'}
                  </td>
                  <td className="table-cell">
                    <div className="date-info">
                      <span className="date-created">Creado: {formatDate(session.created_at)}</span>
                      {session.updated_at && (
                        <span className="date-updated">
                          <Clock className="clock-icon" />
                          Actualizado: {formatDate(session.updated_at)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <StatusSelector session={session} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-container">
          <div className="pagination-info">
            <p className="pagination-text">
              Página <span className="pagination-current">{currentPage}</span> de <span className="pagination-total">{totalPages}</span>
            </p>
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-button pagination-prev"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <button
              className="pagination-button pagination-next"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>

        <div style={{ padding: '16px 24px', textAlign: 'right', fontSize: '18px', color: '#374151' }}>
          Total sesiones: {filteredSessions.length}
        </div>
      </div>

      {showStudentModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                Estadísticas de {selectedStudent?.name}
              </h2>
            </div>

            <div className="modal-body">
              {loadingStats ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Cargando estadísticas...</p>
                </div>
              ) : (
                <>
                  <div className="stats-summary">
                    <h3>Resumen de asesorías</h3>
                    <p>Total de sesiones: {studentStats.reduce((sum, stat) => sum + stat.total_sessions, 0)}</p>
                  </div>

                  <div className="stats-table">
                    <h4>Tipo de asesoría:</h4>
                    <table className="stats-table-content">
                      <thead>
                        <tr>
                          <th>Tipo de asesoría</th>
                          <th>Cantidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentStats.length > 0 ? (
                          studentStats.map((stat, index) => (
                            <tr key={index}>
                              <td>{stat.session_type}</td>
                              <td className="stats-count">{stat.total_sessions}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="2" className="no-stats-row">
                              No se encontraron estadísticas para este estudiante.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={closeModal} className="modal-accept-button">
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div> 
  );
};

export default TutoringHistoryView;