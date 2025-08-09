import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService'; // Adjust path if needed

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const register = async (email, password, name) => {
    return await authService.register(email, password, name);
  };

  const login = async (email, password) => {
    return await authService.login(email, password);
  };

  const logout = async () => {
    return await authService.logout();
  };

  const getUser = async () => {
    const user = await authService.getUser();
    setCurrentUser(user);
  };

  useEffect(() => {
    getUser().finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ getUser, login, register, logout, currentUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
