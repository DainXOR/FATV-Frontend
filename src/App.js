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
import EditStudentsPage from './pages/EditStudentsPage';
import SupportHistoryPage from './pages/SupportHistoryPage';
import AddSupportPage from './pages/AddSupportPage';
import FormCreatorPage from './pages/FormCreatorPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';

/*El back debe regresar en esta sección el nombre y rol de la persona que ingresó. De momento, se hace de forma local */
console.log("Back url: " + process.env.REACT_APP_BACKEND_URL)

// Dashboard main page (empty for now, shows available menus)
const DashboardHome = () => (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Dashboard</h2>
        <p>Welcome! Use the menu to access different sections.</p>
    </div>
);

// Helper: Wrapper for sidebar and main content
const MainLayout = ({ user }) => {
    const navigate = useNavigate();
    // Only logo navigates to dashboard root
    const goTo = (view) => {
        if (view === 'register') navigate('/dashboard/register', 'replace');
        else if (view === 'edit') navigate('/dashboard/edit', 'replace');
        else if (view === 'support-history') navigate('/dashboard/support-history', 'replace');
        else if (view === 'support') navigate('/dashboard/support', 'replace');
        else if (view === 'form') navigate('/dashboard/form', 'replace');
    };
    return (
        <div className="contact-form-container">
            <div className="container-form">
                <div className="sidebar">
                    <img src="/logo1.png" className="logo" alt="logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard', 'replace')} />
                    <Botones onNavigate={goTo} />
                </div>
                <div className="form-grid">
                    <div className="main-container">
                        <UserInfoBar name={user.name} role={user.role} />
                    </div>
                    <Routes>
                        <Route path="" element={<DashboardHome />} />
                        <Route path="register" element={<RegisterStudentPage user={user} />} />
                        <Route path="edit" element={<EditStudentsPage />} />
                        <Route path="support-history" element={<SupportHistoryPage />} />
                        <Route path="support" element={<AddSupportPage />} />
                        <Route path="form" element={<FormCreatorPage />} />
                        <Route path="*" element={<Navigate to="" />} />
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
        role: 'Administrator'
    };
    const { isAuthenticated, login } = useAuth();
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage onLogin={login} />} />
                <Route path="/student-form/:formId" element={<StudentFormRoute />} />
                <Route path="/dashboard/*" element={
                    <ProtectedRoute>
                        <MainLayout user={user} />
                    </ProtectedRoute>
                } />
                <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Router>
    );
};

const AppWithProvider = () => (
    <AuthProvider>
        <App />
    </AuthProvider>
);

export default AppWithProvider;