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
            console.log('JWT Token:', token);
            console.log('User created successfully:', response.data);
            Swal.fire({
                title: 'Success!',
                text: 'Data saved successfully',
                icon: 'success',
                confirmButtonText: 'Accept',
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
            console.error('Error sending data:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error sending data',
                icon: 'error',
                confirmButtonText: 'Accept',
                confirmButtonColor: '#d33'
            });
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
            <h2>Register Student</h2>
            <form onSubmit={handleSubmit} className="contact-form">
                <div>
                    <label>First Name <span className="required-asterisk">*</span></label>
                    <input 
                        type="text" 
                        name="first_name" 
                        value={formData.first_name} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div>
                    <label>Last Name <span className="required-asterisk">*</span></label>
                    <input 
                        type="text" 
                        name="last_name" 
                        value={formData.last_name} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div>
                    <label>ID Number <span className="required-asterisk">*</span></label>
                    <input 
                        type="text" 
                        name="number_id" 
                        value={formData.number_id} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div>
                    <label>Phone Number <span className="required-asterisk">*</span></label>
                    <input 
                        type="text" 
                        name="phone_number" 
                        value={formData.phone_number} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div>
                    <label>Personal Email <span className="required-asterisk">*</span></label>
                    <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div>
                    <label>Institutional Email <span className="required-asterisk">*</span></label>
                    <input 
                        type="email" 
                        name="institution_email" 
                        value={formData.institution_email} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <fieldset className="direccion-group">
                    <legend>Residence Address</legend>
                    <div className="direccion-row">
                        <div className="direccion-col">
                            <label>Street Type <span className="required-asterisk">*</span></label>
                            <select name="streetType" value={formData.streetType} onChange={handleChange} required>
                                <option value="">Select</option>
                                <option value="Avenida">Avenue</option>
                                <option value="Calle">Street</option>
                                <option value="Carrera">Road</option>
                                <option value="Transversal">Crossroad</option>
                            </select>
                        </div>
                        <div className="direccion-col">
                            <label>Street Number <span className="required-asterisk">*</span></label>
                            <input type="text" name="streetNumber" value={formData.streetNumber} onChange={handleChange} required />
                        </div>
                        <div className="direccion-col">
                            <label>Building Number <span className="required-asterisk">*</span></label>
                            <input type="text" name="buildingNumber" value={formData.buildingNumber} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="direccion-row">
                        <div className="direccion-col">
                            <label>Apartment (if applicable)</label>
                            <input type="text" name="apartment" value={formData.apartment} onChange={handleChange} />
                        </div>
                        <div className="direccion-col">
                            <label>Municipality <span className="required-asterisk">*</span></label>
                            <select name="municipality" value={formData.municipality} onChange={handleChange} required>
                                <option value="">Select</option>
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
                    <label>Semester <span className="required-asterisk">*</span></label>
                    <select name="semester" value={formData.semester} onChange={handleChange} required>
                        <option value="">Select</option>
                        {[...Array(9)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>University <span className="required-asterisk">*</span></label>
                    <select name="id_university" value={formData.id_university} onChange={handleChange} required>
                        <option value="">Select</option>
                        <option value="Universidad de Antioquia">University of Antioquia</option>
                        <option value="Universidad Nacional">National University</option>
                        <option value="Universidad EAFIT">EAFIT University</option>
                    </select>
                </div>
                <div className="button-group">
                    <button className="btn limpiar" type="button" onClick={handleReset}>Clear</button>
                    <button className="btn guardar" type="submit">Save</button>
                </div>
            </form>
        </div>
    );
};

export default RegisterStudentPage;
