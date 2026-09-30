import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApiClient from '../api/ApiClient';

const AccountCodePage = ({ mode }) => {
    const isSetup = mode === 'setup';
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const requestRecovery = async () => {
        setBusy(true);
        setError('');
        setNotice('');
        try {
            if (!(await ApiClient.connect())) throw new Error('No se pudo conectar con el servidor.');
            const result = await ApiClient.post('auth/recovery/request', { body: { email } });
            if (!result.ok) throw new Error('No se pudo procesar la solicitud.');
            setNotice('Si la cuenta es elegible, recibirás un código por correo.');
        } catch (caught) {
            setError(caught.message || 'No se pudo procesar la solicitud.');
        } finally {
            setBusy(false);
        }
    };

    const complete = async (event) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        setNotice('');
        try {
            if (!(await ApiClient.connect())) throw new Error('No se pudo conectar con el servidor.');
            const endpoint = isSetup ? 'auth/setup' : 'auth/recovery/complete';
            const result = await ApiClient.post(endpoint, { body: { email, code, password } });
            if (!result.ok) throw new Error(result.error?.details?.error || 'El código no es válido o expiró.');
            setNotice(isSetup ? 'Cuenta configurada. Ya puedes iniciar sesión.' : 'Contraseña actualizada. Ya puedes iniciar sesión.');
            setTimeout(() => navigate('/login', { replace: true }), 900);
        } catch (caught) {
            setError(caught.message || 'No se pudo completar la operación.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <main style={{ maxWidth: 420, margin: '80px auto', padding: 24 }}>
            <h2>{isSetup ? 'Configurar cuenta FATV' : 'Recuperar contraseña'}</h2>
            <p>{isSetup ? 'Ingresa el código de un solo uso que recibiste por correo y crea tu contraseña.' : 'Solicita un código y úsalo para establecer una nueva contraseña.'}</p>
            <label style={{ display: 'grid', gap: 4, marginBottom: 12 }}>
                Correo electrónico
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" />
            </label>
            {!isSetup && <button type="button" disabled={busy || !email} onClick={requestRecovery}>Enviar código de recuperación</button>}
            <form onSubmit={complete} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                <label style={{ display: 'grid', gap: 4 }}>
                    Código de un solo uso
                    <input required value={code} onChange={e => setCode(e.target.value)} autoComplete="one-time-code" inputMode="numeric" maxLength={8} />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                    Nueva contraseña (mínimo 12 caracteres)
                    <input type="password" required minLength={12} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                </label>
                <button type="submit" disabled={busy}>{busy ? 'Procesando…' : 'Confirmar'}</button>
            </form>
            {notice && <p role="status" style={{ color: 'green' }}>{notice}</p>}
            {error && <p role="alert" style={{ color: '#b00020' }}>{error}</p>}
            <p><Link to="/login">Volver al inicio de sesión</Link></p>
        </main>
    );
};

export default AccountCodePage;
