import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [inputError, setInputError] = useState({ username: false, password: false });
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Hardcoded credentials for demo
        if (username === 'admin' && password === 'password123') {
            onLogin();
            navigate('/');
        } else {
            setError('Invalid credentials');
            setInputError({ username: true, password: true });
        }
    };

    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
        setInputError(prev => ({ ...prev, username: false }));
        setError('');
    };
    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        setInputError(prev => ({ ...prev, password: false }));
        setError('');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' }}>
            <h2>Login</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px' }}>
                <label htmlFor="username" style={{ marginBottom: '4px' }}>Username</label>
                <input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={handleUsernameChange}
                    style={{
                        marginBottom: '10px',
                        padding: '8px',
                        border: inputError.username ? '2px solid red' : '1px solid #ccc',
                        outline: 'none',
                        borderRadius: '4px'
                    }}
                />
                <label htmlFor="password" style={{ marginBottom: '4px' }}>Password</label>
                <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                    style={{
                        marginBottom: '10px',
                        padding: '8px',
                        border: inputError.password ? '2px solid red' : '1px solid #ccc',
                        outline: 'none',
                        borderRadius: '4px'
                    }}
                />
                <button type="submit" style={{ padding: '8px' }}>Login</button>
                {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
            </form>
        </div>
    );
};

export default LoginPage;
