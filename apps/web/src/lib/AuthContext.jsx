import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 1. Create a fake HR Admin user
  const mockHRUser = {
    id: "admin-001",
    first_name: "HR",
    last_name: "Manager",
    email: "hr@university.edu.ph",
    role: "admin"
  };

  // 2. Force the state to be instantly authenticated
  const [user, setUser] = useState(mockHRUser);
  const [isAuthenticated, setIsAuthenticated] = useState(true); 
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({});

  useEffect(() => {
    // 3. Skip the server check entirely for the prototype
    console.log("Mock Authentication Initialized: Logged in as HR Admin");
  }, []);

  const checkAppState = async () => {
    // Empty function so the app doesn't crash when it tries to check state
    return true;
  };

  const logout = () => {
    console.log("Mock Logout Clicked");
    // Optionally toggle these to false if you want to test a logged-out state later
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = () => {
    console.log("Mock Login Clicked");
    setUser(mockHRUser);
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
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