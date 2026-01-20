import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const RegisterStudentPage = ({ user }) => {
    const [formData, setFormData] = useState({
        number_id: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        email: '',
        institution_email: '',
        streetType: '',
        streetNumber: '',
        buildingNumber: '',
        apartment: '',
        municipality: '',
        semester: '',
        id_university: ''
    });
    const [loading, setLoading] = useState(false);
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };
    const handleReset = () => {
        setFormData({
            number_id: '',
            first_name: '',
            last_name: '',
            phone_number: '',
            email: '',
            institution_email: '',
            streetType: '',
            streetNumber: '',
            buildingNumber: '',
            apartment: '',
            municipality: '',
            semester: '',
            id_university: ''
        });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('jwt');
        let id_university = formData.id_university;
        if (id_university === 'Universidad de Antioquia') {
            id_university = '685c180f0d2362de34ec5721';
        } else if (id_university === 'Universidad Nacional') {
            id_university = '685d566340a71701efb087a8';
        }
        const fullAddress = `${formData.streetType} ${formData.streetNumber} #${formData.buildingNumber}` +
            (formData.apartment ? ` Apt ${formData.apartment}` : '') +
            `, ${formData.municipality}`;
        const dataToSend = {
            number_id: formData.number_id,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone_number: formData.phone_number,
            email: formData.email,
            institution_email: formData.institution_email,
            residence_address: fullAddress,
            semester: parseInt(formData.semester, 10),
            id_university: id_university
        };
        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/v1/student/`, 
                dataToSend, 
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('Token JWT:', token);
            console.log('Usuario creado exitosamente:', response.data);
            Swal.fire({
                title: '¡Éxito!',
                text: 'Datos guardados exitosamente',
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#28a745'
            });
            setFormData({
                number_id: '',
                first_name: '',
                last_name: '',
                phone_number: '',
                email: '',
                institution_email: '',
                streetType: '',
                streetNumber: '',
                buildingNumber: '',
                apartment: '',
                municipality: '',
                semester: '',
                id_university: ''
            });
        } catch (error) {
            console.error('Error al enviar los datos:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error al enviar los datos',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#d33'
            });
            if (error.response) {
                console.error('Error del servidor:', error.response.data);
                alert(`Error del servidor: ${error.response.status} - ${error.response.data.message || 'Error desconocido'}`);
            } else if (error.request) {
                console.error('No se recibió respuesta del servidor');
                Swal.fire({
                    title: 'Error',
                    text: 'No hay conexión',
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#d33'
                });
            } else {
                console.error('Error al configurar la petición:', error.message);
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo configurar',
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#d33'
                });
            }
        }
        setLoading(false);
    };
    return (
        <div> 
            <h2>Registrar estudiante</h2>
            <form onSubmit={handleSubmit} className="contact-form">
                <div>
                    <label>Nombre <span className="required-asterisk">*</span></label>
                    <input 
                        type="text" 
                        name="first_name" 
                        value={formData.first_name} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div>
                    <label>Apellido <span className="required-asterisk">*</span></label>
                    <input 
                        type="text" 
                        name="last_name" 
                        value={formData.last_name} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div>
                    <label>Número de identificación <span className="required-asterisk">*</span></label>
                    <input 
                        type="text" 
                        name="number_id" 
                        value={formData.number_id} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div>
                    <label>Número de celular <span className="required-asterisk">*</span></label>
                    <input 
                        type="text" 
                        name="phone_number" 
                        value={formData.phone_number} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div>
                    <label>Correo personal <span className="required-asterisk">*</span></label>
                    <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div>
                    <label>Correo institucional <span className="required-asterisk">*</span></label>
                    <input 
                        type="email" 
                        name="institution_email" 
                        value={formData.institution_email} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <fieldset className="direccion-group">
                    <legend>Dirección de residencia</legend>
                    <div className="direccion-row">
                        <div className="direccion-col">
                            <label>Tipo de vía <span className="required-asterisk">*</span></label>
                            <select name="streetType" value={formData.streetType} onChange={handleChange} required>
                                <option value="">Seleccione</option>
                                <option value="Avenida">Avenida</option>
                                <option value="Calle">Calle</option>
                                <option value="Carrera">Carrera</option>
                                <option value="Transversal">Transversal</option>
                            </select>
                        </div>
                        <div className="direccion-col">
                            <label>Número de vía <span className="required-asterisk">*</span></label>
                            <input type="text" name="streetNumber" value={formData.streetNumber} onChange={handleChange} required />
                        </div>
                        <div className="direccion-col">
                            <label># de casa o edificio <span className="required-asterisk">*</span></label>
                            <input type="text" name="buildingNumber" value={formData.buildingNumber} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="direccion-row">
                        <div className="direccion-col">
                            <label>Apartamento (si aplica)</label>
                            <input type="text" name="apartment" value={formData.apartment} onChange={handleChange} />
                        </div>
                        <div className="direccion-col">
                            <label>Municipio <span className="required-asterisk">*</span></label>
                            <select name="municipality" value={formData.municipality} onChange={handleChange} required>
                                <option value="">Seleccione</option>
                                <option value="Bello">Bello</option>
                                <option value="Medellín">Medellín</option>
                                <option value="Itagüí">Itagüí</option>
                                <option value="Sabaneta">Sabaneta</option>
                                <option value="La Estrella">La Estrella</option>
                            </select>
                        </div>
                    </div>
                </fieldset>
                <div>
                    <label>Semestre <span className="required-asterisk">*</span></label>
                    <select name="semester" value={formData.semester} onChange={handleChange} required>
                        <option value="">Seleccione</option>
                        {[...Array(9)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Universidad <span className="required-asterisk">*</span></label>
                    <select name="id_university" value={formData.id_university} onChange={handleChange} required>
                        <option value="">Seleccione</option>
                        <option value="Universidad de Antioquia">Universidad de Antioquia</option>
                        <option value="Universidad Nacional">Universidad Nacional</option>
                        <option value="Universidad EAFIT">Universidad EAFIT</option>
                    </select>
                </div>
                <div className="button-group">
                    <button className="btn limpiar" type="button" onClick={handleReset}>Limpiar</button>
                    <button className="btn guardar" type="submit">Guardar</button>
                </div>
            </form>
        </div>
    );
};

export default RegisterStudentPage;
