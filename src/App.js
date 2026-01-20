/* Componente para registrar estudiantes. Aquí se encuentra toda la lógica de la visualización del form */
import React, { useState } from 'react';
import axios from 'axios';
import './Estilos/Datoscontacto.css';
import './index.css';
import Botones from './Componentes/Botones';
import StudentTable from './Componentes/StudentTable';
import UserInfoBar from './Componentes/UserInfoBar';
import AgregarAcompañamiento from './Componentes/AgregarAcompanamiento';
import FormCreator from './Componentes/FormCreator';
import StudentForm from './Componentes/StudentForm';
import Swal from 'sweetalert2';
import TutoringHistoryView from './Componentes/TutoringHistoryView';
import './Estilos/TutoringHistoryView.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import RegisterStudentPage from './pages/RegisterStudentPage';

/*El back debe regresar en esta sección el nombre y rol de la persona que ingresó. De momento, se hace de forma local */
console.log("Back url: " + process.env.REACT_APP_BACKEND_URL)

// Helper: Wrapper for sidebar and main content
const MainLayout = ({ user }) => {
    const navigate = useNavigate();
    return (
        <div className="contact-form-container">
            <div className="container-form">
                <div className="sidebar">
                    <img src="/logo1.png" className="logo" alt="logo" />
                    <Botones onNavigate={(view) => {
                        // Map view names to routes
                        if (view === 'registrar') navigate('/');
                        else if (view === 'editar') navigate('/editar');
                        else if (view === 'acompanamientos') navigate('/acompanamientos');
                        else if (view === 'acompañar') navigate('/acompanar');
                        else if (view === 'formulario') navigate('/formulario');
                    }} />
                </div>
                <div className="form-grid">
                    <div className="main-container">
                        <UserInfoBar name={user.name} role={user.role} />
                    </div>
                    <Routes>
                        <Route path="/" element={<RegisterStudentPage user={user} />} />
                        <Route path="/editar" element={<StudentTable />} />
                        <Route path="/acompanamientos" element={<TutoringHistoryView />} />
                        <Route path="/acompanar" element={<AgregarAcompañamiento />} />
                        <Route path="/formulario" element={<FormCreator onBack={() => navigate('/')} />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

// Helper: StudentForm route (no sidebar)
const StudentFormRoute = () => {
    const { formId } = useParams();
    return <StudentForm formId={formId} />;
};

const App = () => {
    const user = {
        name: 'Daniel León',
        role: 'Administrador'
    };
    return (
        <Router>
            <Routes>
                <Route path="/student-form/:formId" element={<StudentFormRoute />} />
                <Route path="/*" element={<MainLayout user={user} />} />
            </Routes>
        </Router>
    );
};

export default App;