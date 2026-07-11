import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and check active session
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await api.get('/api/auth/profile');
          if (res.data.success) {
            setUser(res.data.user);
          }
        } catch (error) {
          console.error('Session verify failed', error);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      setUser(res.data.user);
    }
    return res.data;
  };

  const register = async (name, email, password, role) => {
    const res = await api.post('/api/auth/register', { name, email, password, role });
    return res.data;
  };

  const verifyOtp = async (email, otp) => {
    const res = await api.post('/api/auth/verify-otp', { email, otp });
    if (res.data.success) {
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      setUser(res.data.user);
    }
    return res.data;
  };

  const resendOtp = async (email) => {
    const res = await api.post('/api/auth/resend-otp', { email });
    return res.data;
  };

  const updateProfile = async (formData) => {
    // Determine headers based on whether FormData is used (for images)
    const isFormData = formData instanceof FormData;
    const res = await api.put('/api/auth/profile', formData, {
      headers: {
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json'
      }
    });
    if (res.data.success) {
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      console.warn('Backend logout failed', e);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyOtp,
        resendOtp,
        updateProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
