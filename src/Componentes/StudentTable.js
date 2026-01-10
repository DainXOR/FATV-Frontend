import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../Estilos/StudentTable.css';
import { Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Swal from 'sweetalert2';

const ITEMS_PER_PAGE = 10;

const StudentTable = ({ onNavigateToProfile }) => {
    const universityNames = {
        '685c180f0d2362de34ec5721': 'Universidad de Antioquia',
        '685d566340a71701efb087a8': 'Universidad Nacional'
    };
    
    // Función para formatear la fecha a solo hora, minutos y segundos
    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '';
        
        try {
            const date = new Date(dateTimeString);
            // Formatear solo la hora en formato HH:MM:SS
            const timeString = date.toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            
            const dateString = date.toLocaleDateString('es-CO', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            
            return `${dateString} ${timeString}`;
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return dateTimeString;
        }
    };

    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [editingStudent, setEditingStudent] = useState(null);
    const [formData, setFormData] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [searchIdNumber, setSearchIdNumber] = useState('');

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/v2/students/all`);
                const studentsData = Array.isArray(response.data) ? response.data : response.data.data || [];
                setStudents(studentsData);
                setFilteredStudents(studentsData);
            } catch (error) {
                console.error('Error al obtener los estudiantes:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Error al obtener los estudiantes',
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#d33'
                });
            }
        };
        fetchStudents();
    }, []);

    // Nuevo useEffect para manejar el filtrado
    useEffect(() => {
        if (searchIdNumber.trim() === '') {
            setFilteredStudents(students);
        } else {
            const filtered = students.filter((student) => {
                const studentId = student.number_id;
                // Verificar que el number_id existe y no es null/undefined/empty
                if (!studentId || studentId.trim() === '') {
                    return false;
                }
                return studentId.toString().includes(searchIdNumber);
            });
            setFilteredStudents(filtered);
        }
        setCurrentPage(1); // Resetear a la primera página cuando cambie el filtro
    }, [students, searchIdNumber]);

    const handleEditClick = (student) => {
        setEditingStudent(student.id);
        setFormData({ ...student });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(
                `${process.env.REACT_APP_BACKEND_URL}/api/v2/students/${editingStudent}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const updatedStudents = students.map((student) =>
                student.id === editingStudent ? { ...student, ...formData } : student
            );

            setStudents(updatedStudents);
            setEditingStudent(null);
            Swal.fire({
                title: '¡Éxito!',
                text: 'Estudiante actualizado correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#28a745'
            });
        } catch (error) {
            console.error('Error al actualizar estudiante:', error);
            Swal.fire({
                title: 'Error',
                text: error.response?.data?.message || 'No se pudo actualizar el estudiante',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#d33'
            });
        }
    };

    // Función simplificada para manejar el cambio de filtro
    const handleFilterChange = (e) => {
        const value = e.target.value;
        setSearchIdNumber(value);
    };

    // Función para manejar cambios de página
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentStudents = filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div className="tabla-estudiantes">
            <div className="tabla-container">
                <div className="header">
                    <h2 className="titulo-tabla">Estudiantes registrados</h2>
                    <p className="header-subtitle">Listado de estudiantes con opción de edición y búsqueda por cédula</p>
                </div>

                <div className="filters-container">
                    <div className="filters">
                        <div className="filter-group">
                            <span className="filter-label">Filtrar por cédula:</span>
                            <input
                                type="text"
                                value={searchIdNumber}
                                onChange={handleFilterChange}
                                placeholder="Ingrese cédula"
                                className="filter-select"
                            />
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <div className="table-scroll">
                        <table>
                        <thead>
                            <tr>
                                <th>Cédula</th>
                                <th>Nombre</th>
                                <th>Apellido</th>
                                <th>Correo institucional</th>
                                <th>Correo personal</th>
                                <th>Semestre</th>
                                <th>Universidad</th>
                                <th>Teléfono</th>
                                <th>Dirección</th>
                                <th>Creación</th>
                                <th>Actualización</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentStudents.map((student) =>
                                editingStudent === student.id ? (
                                    <tr key={student.id}>
                                        <td><input name="number_id" value={formData.number_id || ''} onChange={handleChange} /></td>
                                        <td><input name="first_name" value={formData.first_name || ''} onChange={handleChange} /></td>
                                        <td><input name="last_name" value={formData.last_name || ''} onChange={handleChange} /></td>
                                        <td><input name="institution_email" value={formData.institution_email || ''} onChange={handleChange} /></td>
                                        <td><input name="email" value={formData.email || ''} onChange={handleChange} /></td>
                                        <td><input name="semester" value={formData.semester || ''} onChange={handleChange} /></td>
                                        <td>{universityNames[student.id_university] || student.id_university}</td>
                                        <td><input name="phone_number" value={formData.phone_number || ''} onChange={handleChange} /></td>
                                        <td><input name="residence_address" value={formData.residence_address || ''} onChange={handleChange} /></td>
                                        <td><input name="created_at" value={formatDateTime(formData.created_at)} onChange={handleChange} disabled /></td>
                                        <td><input name="updated_at" value={formatDateTime(formData.updated_at)} onChange={handleChange} disabled /></td>
                                        <td className="acciones">
                                            <Button onClick={handleSave} color="success" variant="contained" size="small" style={{ marginRight: 5 }}>
                                                <SaveIcon />
                                            </Button>
                                            <Button onClick={() => setEditingStudent(null)} color="error" variant="contained" size="small" style={{ marginRight: 5 }}>
                                                <CloseIcon />
                                            </Button>
                                        </td>
                                    </tr>
                                ) : (
                                    <tr key={student.id}>
                                        <td>{student.number_id}</td>
                                        <td>{student.first_name}</td>
                                        <td>{student.last_name}</td>
                                        <td>{student.institution_email}</td>
                                        <td>{student.email}</td>
                                        <td>{student.semester}</td>
                                        <td>{universityNames[student.id_university] || student.id_university}</td>
                                        <td>{student.phone_number}</td>
                                        <td>{student.residence_address}</td>
                                        <td>{formatDateTime(student.created_at)}</td>
                                        <td>{formatDateTime(student.updated_at)}</td>
                                        <td className="acciones">
                                            <Button onClick={() => handleEditClick(student)} variant="contained" size="small" style={{ backgroundColor: "#222D56" }}>
                                                <EditIcon />
                                            </Button>
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                                        </table>
                                    </div>
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
                    Total estudiantes registrados: {filteredStudents.length}
                </div>
            </div>
        </div>
    );
};

export default StudentTable;