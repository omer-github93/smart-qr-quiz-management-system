import { createContext, useState, useEffect } from 'react';
import { getMeApi, loginApi, logoutApi } from '../api/auth';
import api from '../api/index';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (token) {
                const res = await getMeApi();
                setUser(res.data);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            handleClearAuth();
        } finally {
            setLoading(false);
        }
    };

    const handleClearAuth = () => {
        setUser(null);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
    };

    const login = async (email, password, rememberMe = false) => {
        try {
            const res = await loginApi(email, password);
            const token = res.data.token;

            if (rememberMe) {
                localStorage.setItem('token', token);
            } else {
                sessionStorage.setItem('token', token);
            }

            setUser(res.data.user);
            return { success: true };
        } catch (error) {
            const status = error.response?.status;
            const message = status === 401
                ? 'Invalid email or password. Please try again.'
                : error.response?.data?.message || 'Login failed. Please try again.';
            return { success: false, message };
        }
    };

    const logout = async () => {
        try {
            await logoutApi();
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            handleClearAuth();
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, checkAuth }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
