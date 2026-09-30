import React, { createContext, useContext, useEffect, useState } from 'react';
import ApiClient from './api/ApiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const restoreSession = async () => {
            try {
                if (!(await ApiClient.connect())) return;
                const result = await ApiClient.get('auth/me');
                if (active && result.ok) setUser(result.body.user);
            } catch {
                if (active) setUser(null);
            } finally {
                if (active) setLoading(false);
            }
        };
        restoreSession();
        return () => { active = false; };
    }, []);

    const login = async (email, password) => {
        if (!(await ApiClient.connect())) throw new Error('No se pudo conectar con el servidor');
        const result = await ApiClient.post('auth/login', { body: { email, password } });
        if (!result.ok) throw new Error(result.error?.details?.error || 'Credenciales inválidas');
        setUser(result.body.user);
        return result.body.user;
    };

    const logout = async () => {
        try {
            if (await ApiClient.connect()) await ApiClient.post('auth/logout');
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: user !== null,
            loading,
            login,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
