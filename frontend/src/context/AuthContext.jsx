import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('railbook_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('railbook_user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        setUser(null);
      }
    }

    if (token) {
      authApi
        .getProfile()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('railbook_user', JSON.stringify(res.data));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await authApi.login(username, password);
    const { access, user: userData } = res.data;
    setToken(access);
    setUser(userData);
    localStorage.setItem('railbook_token', access);
    localStorage.setItem('railbook_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    const { access, user: registeredUser } = res.data;
    setToken(access);
    setUser(registeredUser);
    localStorage.setItem('railbook_token', access);
    localStorage.setItem('railbook_user', JSON.stringify(registeredUser));
    return registeredUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('railbook_token');
    localStorage.removeItem('railbook_user');
  };

  const updateUser = (updatedData) => {
    setUser(updatedData);
    localStorage.setItem('railbook_user', JSON.stringify(updatedData));
  };

  const isAdmin = user && (user.is_staff || user.role === 'ADMIN');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isAdmin,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
