import React, { useEffect, useState } from 'react';
import ApiClient from '../api/ApiClient';

const messageFrom = (result, fallback) => result?.error?.details?.error || result?.error?.message || fallback;

const AdminSettingsPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [settings, setSettings] = useState(null);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('staff');
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const load = async () => {
        setError('');
        if (!(await ApiClient.connect())) {
            setError('No se pudo conectar con el servidor.');
            return;
        }
        const [accountResult, settingsResult] = await Promise.all([
            ApiClient.get('auth/accounts'),
            ApiClient.get('auth/settings'),
        ]);
        if (!accountResult.ok) setError(messageFrom(accountResult, 'No se pudieron cargar las cuentas.'));
        else setAccounts(accountResult.body.accounts || []);
        if (!settingsResult.ok) setError(messageFrom(settingsResult, 'No se pudo cargar la configuración.'));
        else setSettings(settingsResult.body);
    };

    useEffect(() => { load().catch(() => setError('No se pudo cargar la configuración.')); }, []);

    const runAction = async (action, successMessage) => {
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const result = await action();
            if (!result.ok) throw new Error(messageFrom(result, 'La operación falló.'));
            setNotice(successMessage);
            await load();
        } catch (caught) {
            setError(caught.message || 'La operación falló.');
        } finally {
            setBusy(false);
        }
    };

    const createAccount = async (event) => {
        event.preventDefault();
        await runAction(() => ApiClient.post('auth/accounts', { body: { email, role } }),
            'Cuenta creada. Se enviaron instrucciones de configuración por correo.');
        setEmail('');
    };

    const updateSetting = (key, value) => setSettings(previous => ({ ...previous, [key]: value }));

    const saveSettings = async (event) => {
        event.preventDefault();
        await runAction(() => ApiClient.patch('auth/settings', { body: settings }), 'Configuración de seguridad guardada.');
    };

    const setAccountRole = (account, nextRole) => runAction(
        () => ApiClient.patch('auth/accounts', { pathParams: [account.id, 'role'], body: { role: nextRole } }),
        'Rol actualizado.'
    );

    const setAccountStatus = (account, status) => runAction(
        () => ApiClient.patch('auth/accounts', { pathParams: [account.id, 'status'], body: { status } }),
        'Estado de la cuenta actualizado.'
    );

    const sendAccountAction = (account, action) => runAction(
        () => ApiClient.post('auth/accounts', { pathParams: [account.id, action] }),
        action === 'setup' ? 'Instrucciones de configuración enviadas.' : 'Instrucciones de recuperación enviadas.'
    );

    if (!settings) return <div style={{ padding: 24 }}>Cargando configuración…</div>;

    return (
        <div style={{ padding: 24, maxWidth: 1100 }}>
            <h2>Administración y seguridad</h2>
            {error && <p role="alert" style={{ color: '#b00020' }}>{error}</p>}
            {notice && <p role="status" style={{ color: '#176b36' }}>{notice}</p>}

            <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 24 }}>
                <h3>Cuentas de plataforma</h3>
                <form onSubmit={createAccount} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end' }}>
                    <label style={{ display: 'grid', gap: 4 }}>
                        Correo
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
                    </label>
                    <label style={{ display: 'grid', gap: 4 }}>
                        Rol
                        <select value={role} onChange={e => setRole(e.target.value)}>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </label>
                    <button type="submit" disabled={busy}>Crear cuenta</button>
                </form>
                <p>Las cuentas nuevas reciben un código de un solo uso para configurar su contraseña.</p>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr><th align="left">Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
                        <tbody>
                            {accounts.map(account => (
                                <tr key={account.id} style={{ borderTop: '1px solid #ddd' }}>
                                    <td>{account.email}</td>
                                    <td>
                                        <select aria-label={`Rol de ${account.email}`} value={account.role}
                                            disabled={busy || account.status === 'deleted'}
                                            onChange={e => setAccountRole(account, e.target.value)}>
                                            <option value="staff">Staff</option><option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td>{account.status}</td>
                                    <td style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8 }}>
                                        {account.status === 'pending' && <button disabled={busy} onClick={() => sendAccountAction(account, 'setup')}>Reenviar configuración</button>}
                                        {account.status === 'active' && <button disabled={busy} onClick={() => sendAccountAction(account, 'recovery')}>Recuperar contraseña</button>}
                                        {account.status === 'active'
                                            ? <button disabled={busy} onClick={() => setAccountStatus(account, 'disabled')}>Deshabilitar</button>
                                            : account.status === 'disabled'
                                                ? <button disabled={busy} onClick={() => setAccountStatus(account, 'active')}>Activar</button>
                                                : null}
                                        {account.status !== 'deleted' && <button disabled={busy} onClick={() => setAccountStatus(account, 'deleted')}>Eliminar</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
                <h3>Configuración de seguridad</h3>
                <form onSubmit={saveSettings} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
                    <label style={{ display: 'grid', gap: 4 }}>
                        Tiempo de inactividad (minutos)
                        <input type="number" min="1" max="10080" required value={settings.idle_timeout_minutes}
                            onChange={e => updateSetting('idle_timeout_minutes', Number(e.target.value))} />
                    </label>
                    <label style={{ display: 'grid', gap: 4 }}>
                        Duración máxima de sesión (minutos)
                        <input type="number" min="1" max="43200" required value={settings.absolute_session_lifetime_minutes}
                            onChange={e => updateSetting('absolute_session_lifetime_minutes', Number(e.target.value))} />
                    </label>
                    <label style={{ display: 'grid', gap: 4 }}>
                        Vigencia del código de configuración (minutos)
                        <input type="number" min="5" max="1440" required value={settings.setup_code_lifetime_minutes}
                            onChange={e => updateSetting('setup_code_lifetime_minutes', Number(e.target.value))} />
                    </label>
                    <label style={{ display: 'grid', gap: 4 }}>
                        Vigencia del código de recuperación (minutos)
                        <input type="number" min="5" max="1440" required value={settings.recovery_code_lifetime_minutes}
                            onChange={e => updateSetting('recovery_code_lifetime_minutes', Number(e.target.value))} />
                    </label>
                    <label>
                        <input type="checkbox" checked={settings.self_service_recovery_enabled}
                            onChange={e => updateSetting('self_service_recovery_enabled', e.target.checked)} />
                        {' '}Permitir recuperación de contraseña por autoservicio
                    </label>
                    <button type="submit" disabled={busy}>Guardar configuración</button>
                    <small>Los cambios de sesión se aplican en la siguiente solicitud.</small>
                </form>
            </section>
        </div>
    );
};

export default AdminSettingsPage;
