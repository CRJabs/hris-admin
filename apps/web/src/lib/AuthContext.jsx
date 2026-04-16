import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Error fetching user profile", err);
      return null;
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id).then(profileData => {
          setUser(profileData);
          setIsAuthenticated(true);
          setIsLoadingAuth(false);
        });
      } else {
        setIsLoadingAuth(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          fetchUserProfile(session.user.id).then(profileData => {
            setUser(profileData);
            setIsAuthenticated(true);
          });
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkAppState = async () => {
    return true;
  };

  const logout = async () => {
    setIsLoadingAuth(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    setIsLoadingAuth(false);
  };

  const navigateToLogin = () => {
    // This function originally acted as the mock login trigger
    // With real auth, the onAuthStateChange handles state updates, so this can be a no-op or removed if unneeded.
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
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