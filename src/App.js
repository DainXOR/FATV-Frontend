/* Componente para registrar estudiantes. Aquí se encuentra toda la lógica de la visualización del form */
import './fonts.css';
import './Estilos/Datoscontacto.css';
import './index.css';
import Botones from './Componentes/Botones';
import UserInfoBar from './Componentes/UserInfoBar';
import StudentForm from './Componentes/StudentForm';
import './Estilos/TutoringHistoryView.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import RegisterStudentPage from './pages/RegisterStudentPage';
import EditStudentsPage from './pages/EditStudentsPage';
import SupportHistoryPage from './pages/SupportHistoryPage';
import AddSupportPage from './pages/AddSupportPage';
import FormCreatorPage from './pages/FormCreatorPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import SendFormPage from './pages/SendFormPage';
import AccountCodePage from './pages/AccountCodePage';
import { AuthProvider, useAuth } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import { config } from "./utils/config";
import { useState } from 'react';

/*El back debe regresar en esta sección el nombre y rol de la persona que ingresó. De momento, se hace de forma local */
console.log("Back url: " + config.backendUrl)

// Helper: Wrapper for sidebar and main content
const MainLayout = ({ user }) => {
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(true);
    // Only logo navigates to dashboard root
    const goTo = (/** @type {string} */ view) => {
        if (view === 'register') navigate('/dashboard/register', 'replace');
        else if (view === 'edit') navigate('/dashboard/edit', 'replace');
        else if (view === 'support-history') navigate('/dashboard/support-history', 'replace');
        else if (view === 'support') navigate('/dashboard/support', 'replace');
        else if (view === 'form') navigate('/dashboard/form', 'replace');
        else if (view === 'send-form') navigate('/dashboard/send-form', 'replace');
        else if (view === 'admin') navigate('/dashboard/admin', 'replace');
    };
    return (
        <div className="contact-form-container">
            <div className={`container-form ${collapsed ? 'sidebar-collapsed' : ''}`}>
                <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}
                    onMouseEnter={() => setCollapsed(false)}
                    onMouseLeave={() => setCollapsed(true)}
                >
                    <img src="/logo1.png" className="logo" alt="logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard', 'replace')} />
                    <Botones onNavigate={goTo} collapsed={collapsed} isAdmin={user.roleCode === 'admin'} />
                </div>
                <div className="form-grid">
                    <div className="main-container">
                        <UserInfoBar name={user.name} role={user.role} />
                    </div>
                    <Routes>
                        <Route path="" element={<HomePage />} />
                        <Route path="register" element={<RegisterStudentPage user={user} />} /> 
                        <Route path="edit" element={<EditStudentsPage />} />
                        <Route path="support-history" element={<SupportHistoryPage />} />
                        <Route path="support" element={<AddSupportPage />} />
                        <Route path="form" element={<FormCreatorPage />} />
                        <Route path="send-form" element={<SendFormPage />} />
                        <Route path="admin" element={user.roleCode === 'admin' ? <AdminSettingsPage /> : <Navigate to="" replace />} />
                        <Route path="*" element={<Navigate to="" />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

// Helper: StudentForm route (no sidebar)
const StudentFormRoute = () => {
    const { token } = useParams();
    return <StudentForm token={token} />;
};


const App = () => {
    const { user, login } = useAuth();
    const displayUser = user ? {
        name: user.email,
        role: user.role === 'admin' ? 'Administrator' : 'Staff',
        roleCode: user.role
    } : { name: '', role: '' };
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage onLogin={login} />} />
                <Route path="/setup-account" element={<AccountCodePage mode="setup" />} />
                <Route path="/recover-password" element={<AccountCodePage mode="recovery" />} />
                <Route path="/student-form/:token" element={<StudentFormRoute />} />
                <Route path="/dashboard/*" element={
                    <ProtectedRoute>
                        <MainLayout user={displayUser} />
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