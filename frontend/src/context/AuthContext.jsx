import { createContext, useContext, useEffect, useState } from "react";

import authService from "../services/authService";

const AuthContext = createContext(null);
const readStoredUser = () => {
  try {
    const stored = localStorage.getItem("collabdocs_user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem("collabdocs_user");
    return null;
  }
};

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("collabdocs_token") || "");
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (token) localStorage.setItem("collabdocs_token", token);
    else localStorage.removeItem("collabdocs_token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("collabdocs_user", JSON.stringify(user));
    else localStorage.removeItem("collabdocs_user");
  }, [user]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    authService
      .me()
      .then((data) => setUser(data.user))
      .catch(() => {
        setUser(null);
        setToken("");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const signup = async (payload) => {
    const data = await authService.signup(payload);
    setUser(data.user);
    setToken(data.token);
    return data;
  };

  const login = async (payload) => {
    const data = await authService.login(payload);
    setUser(data.user);
    setToken(data.token);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken("");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated: Boolean(user && token), signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export { AuthProvider, useAuth };
