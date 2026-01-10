import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import '../Estilos/HistorialAsesorias.css'; 
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HistorialAsesorias = ({ estudianteId, onVolver }) => {
    const [historial, setHistorial] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const perPage = 10; // Número de asesorías por página
    const [filterMonth, setFilterMonth] = useState(''); // formato YYYY-MM


    useEffect(() => {
        const fetchHistorial = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('jwt');
                
            const response = await axios.get(
            `${API_URL}/asesorias/estudiante/${estudianteId}?page=${page}&limit=5`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
            );


                if (response.data.success) {
                    setHistorial(response.data.data);
                } else {
                    setError('No se pudieron cargar las asesorías');
                }
            } catch (error) {
                console.error('Error al cargar historial:', error);
                setError('Error al cargar el historial de asesorías');
            } finally {
                setLoading(false);
            }
        };

        if (estudianteId) {
            fetchHistorial();
        }
    }, [estudianteId]);

    const formatearFecha = (fecha) => {
        const fechaObj = new Date(fecha);
        return fechaObj.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatearHora = (hora) => {
        return hora.substring(0, 5); // Formato HH:MM
    };

    const getEstadoClase = (estado) => {
        switch (estado.toLowerCase()) {
            case 'completada':
                return 'estado-completada';
            case 'programada':
                return 'estado-programada';
            case 'cancelada':
                return 'estado-cancelada';
            case 'pendiente':
                return 'estado-pendiente';
            default:
                return 'estado-default';
        }
    };

    const getTipoAcompañamientoClase = (tipo) => {
        switch (tipo) {
            case 'Asesoría Sociopedagógica':
                return 'tipo-sociopedagogica';
            case 'Orientación Sociofamiliar':
                return 'tipo-sociofamiliar';
            case 'Psicología':
                return 'tipo-psicologia';
            default:
                return 'tipo-default';
        }
    };

    if (loading) {
        return (
            <div className="historial-container">
                <div className="historial-header">
                    <Button 
                        onClick={onVolver}
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        className="btn-volver"
                    >
                        Volver
                    </Button>
                </div>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Cargando historial de asesorías...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="historial-container">
                <div className="historial-header">
                    <Button 
                        onClick={onVolver}
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        className="btn-volver"
                    >
                        Volver
                    </Button>
                </div>
                <div className="error-container">
                    <p className="error-message">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="historial-container">
            <div className="historial-header">
                <Button 
                    onClick={onVolver}
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    className="btn-volver"
                >
                    Volver
                </Button>
                <div className="estudiante-info">
                    <PersonIcon className="estudiante-icon" />
                    <h2>
                        Historial de Asesorías - {historial?.estudiante?.nombre} {historial?.estudiante?.apellido}
                    </h2>
                </div>
            </div>

            <div className="resumen-container">
                <div className="resumen-card">
                    <h3>Resumen</h3>
                    <p><strong>Total de asesorías:</strong> {historial?.total || 0}</p>
                    <p><strong>Estudiante:</strong> {historial?.estudiante?.nombre} {historial?.estudiante?.apellido}</p>
                    <div style={{ marginTop: '8px' }}>
                        <label htmlFor="filter-month">Filtrar por mes: </label>
                        <input
                            id="filter-month"
                            type="month"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                        />
                        {filterMonth && (
                            <button style={{ marginLeft: 8 }} onClick={() => setFilterMonth('')}>Limpiar</button>
                        )}
                    </div>
                </div>
            </div>

            <div className="asesorias-container">
                {historial?.asesorias?.length > 0 ? (
                    <div className="asesorias-grid">
                        {historial.asesorias
                            .filter((asesoria) => {
                                if (!filterMonth) return true;
                                // filterMonth tiene formato YYYY-MM
                                const [year, month] = filterMonth.split('-');
                                const fecha = new Date(asesoria.fecha);
                                return fecha.getFullYear() === parseInt(year, 10) && (fecha.getMonth() + 1) === parseInt(month, 10);
                            })
                            .map((asesoria) => (
                            <div key={asesoria.id} className="asesoria-card">
                                <div className="asesoria-header">
                                    <span className={`tipo-badge ${getTipoAcompañamientoClase(asesoria.tipo_acompanamiento)}`}>
                                        {asesoria.tipo_acompanamiento}
                                    </span>
                                    <span className={`estado-badge ${getEstadoClase(asesoria.estado)}`}>
                                        {asesoria.estado}
                                    </span>
                                </div>

                                <div className="asesoria-body">
                                    <div className="profesional-info">
                                        <PersonIcon className="icon" />
                                        <div>
                                            <p className="profesional-nombre">
                                                {asesoria.profesional_nombre} {asesoria.profesional_apellido}
                                            </p>
                                            <p className="profesional-especialidad">
                                                {asesoria.profesional_especialidad}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="fecha-hora-info">
                                        <div className="fecha-info">
                                            <CalendarTodayIcon className="icon" />
                                            <span>{formatearFecha(asesoria.fecha)}</span>
                                        </div>
                                        <div className="hora-info">
                                            <AccessTimeIcon className="icon" />
                                            <span>{formatearHora(asesoria.hora)}</span>
                                        </div>
                                    </div>

                                    {asesoria.observaciones && (
                                        <div className="observaciones">
                                            <h4>Observaciones:</h4>
                                            <p>{asesoria.observaciones}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-asesorias">
                        <p>No se encontraron asesorías para este estudiante.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistorialAsesorias;