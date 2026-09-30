import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await onLogin(email, password);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.message || 'No se pudo iniciar sesión');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' }}>
            <h2>Iniciar sesión</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px' }}>
                <label htmlFor="email" style={{ marginBottom: '4px' }}>Correo electrónico</label>
                <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    required
                    placeholder="nombre@ejemplo.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    style={{ marginBottom: '10px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <label htmlFor="password" style={{ marginBottom: '4px' }}>Contraseña</label>
                <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    style={{ marginBottom: '10px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <button type="submit" disabled={submitting} style={{ padding: '8px' }}>
                    {submitting ? 'Ingresando…' : 'Ingresar'}
                </button>
                {error && <div role="alert" style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
                <p><Link to="/recover-password">¿Olvidaste tu contraseña?</Link></p>
                <p><Link to="/setup-account">Tengo un código de configuración</Link></p>
            </form>
        </div>
    );
};

export default LoginPage;
