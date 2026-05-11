import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from "@apollo/client/react";
import { LOGIN, REGISTER, GET_ME } from '../graphql/operations';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('accessToken');

  const { data, loading: queryLoading, error } = useQuery(GET_ME, {
    skip: !token,
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (!queryLoading) {
      if (data?.me) {
        setUser(data.me);
      } else if (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      setLoading(false);
    }
  }, [data, queryLoading, error, token]);

  const [loginMutation] = useMutation(LOGIN);
  const [registerMutation] = useMutation(REGISTER);

  const login = useCallback(async (email, password) => {
    const { data } = await loginMutation({
      variables: { input: { email, password } }
    });
    if (data?.login) {
      localStorage.setItem('accessToken', data.login.accessToken);
      localStorage.setItem('refreshToken', data.login.refreshToken);
      setUser(data.login.user);
      return data.login.user;
    }
  }, [loginMutation]);

  const register = useCallback(async (input) => {
    const { data } = await registerMutation({
      variables: { input }
    });
    if (data?.register) {
      localStorage.setItem('accessToken', data.register.accessToken);
      localStorage.setItem('refreshToken', data.register.refreshToken);
      setUser(data.register.user);
      return data.register.user;
    }
  }, [registerMutation]);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

