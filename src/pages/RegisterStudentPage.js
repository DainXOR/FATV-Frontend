import React, { useState } from 'react';
import Swal from 'sweetalert2';

import StudentsApi from "../api/StudentsApi";

/** @typedef {import("../Models/StudentModels").StudentRequest} StudentRequest */

/** @typedef {Object} StudentFormData
 * @property {string} number_id
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} phone_number
 * @property {string} email
 * @property {string} institution_email
 * @property {string} streetType
 * @property {string} streetNumber
 * @property {string} buildingNumber
 * @property {string} apartment
 * @property {string} municipality
 * @property {string} semester
 * @property {string} id_university
 */



/**
 * @returns {StudentFormData}
 */
function emptyStudentFormData() {
    return {
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
        };
}
/**
 * @param {StudentFormData} formData
 * @returns {StudentRequest}
 */
function studentFormDataToRequest(formData) {
    let id_university = formData.id_university;
    if (id_university === 'Universidad de Antioquia') {
        id_university = '685c180f0d2362de34ec5721';
    } else if (id_university === 'Universidad Nacional') {
        id_university = '685d566340a71701efb087a8';
    }
    const fullAddress = `${formData.streetType} ${formData.streetNumber} #${formData.buildingNumber}` +
        (formData.apartment ? ` Apt ${formData.apartment}` : '') +
        `, ${formData.municipality}`;

    return {
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
}

/**
 * RegisterStudentPage component renders a student registration form
 * and handles form state, validation and submission.
 *
 * @param {Object} props - Component props.
 * @param {Object} [props.user] - Optional current user data.
 * @returns {React.JSX.Element}
 */
const RegisterStudentPage = ({ user }) => {
    const [studentFormData, setStudentFormData] = useState(emptyStudentFormData());
    const [loading, setLoading] = useState(false);
    /**
     * Update formData state when an input value changes.
     *
     * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - Input change event.
     */
    const handleChange = (e) => {
        setStudentFormData({
            ...studentFormData,
            [e.target.name]: e.target.value
        });
    };
    /**
     * Reset the form state to its initial empty values.
     */
    const handleReset = () => {
        setStudentFormData(emptyStudentFormData());
    };
    /**
     * Handle student registration form submission.
     *
     * @param {React.FormEvent<HTMLFormElement>} e - Form submit event.
     * @returns {Promise<void>}
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const dataToSend = studentFormDataToRequest(studentFormData);

        try {
            const response = await StudentsApi.create(dataToSend);

            if (response.ok) console.log('User created successfully:', response.body);
            else {
                console.error('Error creating user:', response.error);
                throw new Error(`Failed to create user: ${response.status} - ${response.error.message}`);
            }
            
            Swal.fire({
                title: 'Success!',
                text: 'Data saved successfully',
                icon: 'success',
                confirmButtonText: 'Accept',
                confirmButtonColor: '#28a745'
            });
            setStudentFormData(emptyStudentFormData());
            
        } catch (/** @type {any} */ error) {
            console.error('Error sending data:', error);    
            //Swal.fire({
            //    title: 'Error',
            //    text: 'Error creating student',
            //    icon: 'error',
            //    confirmButtonText: 'Accept',
            //    confirmButtonColor: '#d33'
            //});

            if (error.response) {
                console.error('Server error:', error.response.data);
                alert(`Server error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
            } else if (error.request) {
                console.error('No response from server');
                Swal.fire({
                    title: 'Error',
                    text: 'No connection',
                    icon: 'error',
                    confirmButtonText: 'Accept',
                    confirmButtonColor: '#d33'
                });
            } else {
                console.error('Request setup error:', error.message);
                Swal.fire({
                    title: 'Error',
                    text: 'Could not configure request',
                    icon: 'error',
                    confirmButtonText: 'Accept',
                    confirmButtonColor: '#d33'
                });
            }
        }
        setLoading(false);
    };
    return (
        <div> 
            <h2>Registrar Estudiante</h2>
            <form onSubmit={handleSubmit} className="contact-form">
                <div>
                    <label>Nombre <span className="required-asterisk">*</span></label>
                    <input 
                        type="text" 
                        name="first_name" 
                        value={studentFormData.first_name} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div>
                    <label>Apellido <span className="required-asterisk">*</span></label>
                    <input 
                        type="text" 
                        name="last_name" 
                        value={studentFormData.last_name} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div>
                    <label>Numero de documento <span className="required-asterisk">*</span></label>
                    <input 
                        type="text" 
                        name="number_id" 
                        value={studentFormData.number_id} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div>
                    <label>Numero de celular <span className="required-asterisk">*</span></label>
                    <input 
                        type="text" 
                        name="phone_number" 
                        value={studentFormData.phone_number} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div>
                    <label>Correo personal <span className="required-asterisk">*</span></label>
                    <input 
                        type="email" 
                        name="email" 
                        value={studentFormData.email} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div>
                    <label>Correo institucional <span className="required-asterisk">*</span></label>
                    <input 
                        type="email" 
                        name="institution_email" 
                        value={studentFormData.institution_email} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <fieldset className="direccion-group">
                    <legend>Direccion de residencia</legend>
                    <div className="direccion-row">
                        <div className="direccion-col">
                            <label>Tipo de calle <span className="required-asterisk">*</span></label>
                            <select name="streetType" value={studentFormData.streetType} onChange={handleChange} required>
                                <option value="">Seleccionar</option>
                                <option value="Avenida">Avenue</option>
                                <option value="Calle">Street</option>
                                <option value="Carrera">Road</option>
                                <option value="Transversal">Crossroad</option>
                            </select>
                        </div>
                        <div className="direccion-col">
                            <label>Numero de calle <span className="required-asterisk">*</span></label>
                            <input type="text" name="streetNumber" value={studentFormData.streetNumber} onChange={handleChange} required />
                        </div>
                        <div className="direccion-col">
                            <label>Numero de residencia <span className="required-asterisk">*</span></label>
                            <input type="text" name="buildingNumber" value={studentFormData.buildingNumber} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="direccion-row">
                        <div className="direccion-col">
                            <label>Apartamento (si aplica)</label>
                            <input type="text" name="apartment" value={studentFormData.apartment} onChange={handleChange} />
                        </div>
                        <div className="direccion-col">
                            <label>Municipalidad <span className="required-asterisk">*</span></label>
                            <select name="municipality" value={studentFormData.municipality} onChange={handleChange} required>
                                <option value="">Seleccionar</option>
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
                    <select name="semester" value={studentFormData.semester} onChange={handleChange} required>
                        <option value="">Seleccionar</option>
                        {[...Array(9)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Universidad <span className="required-asterisk">*</span></label>
                    <select name="id_university" value={studentFormData.id_university} onChange={handleChange} required>
                        <option value="">Seleccionar</option>
                        <option value="Universidad de Antioquia">University of Antioquia</option>
                        <option value="Universidad Nacional">National University</option>
                        <option value="Universidad EAFIT">EAFIT University</option>
                    </select>
                </div>
                <div className="button-group">
                    <button className="btn limpiar" type="button" onClick={handleReset}>Clear</button>
                    <button className="btn guardar" type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RegisterStudentPage;
