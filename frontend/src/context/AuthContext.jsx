import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const response = await api.get('/auth/me');
            if (response.data.status) {
                setUser(response.data.user);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.status) {
            setUser(response.data.user);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }
        }
        return response.data;
    };

    const register = async (userData) => {
        const response = await api.post('/auth/register', userData);
        if (response.data.status && response.data.user) {
            setUser(response.data.user);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }
        }
        return response.data;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            setUser(null);
            localStorage.removeItem('token');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
