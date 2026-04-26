import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { dismissAllToasts } from '@/components/ui/use-toast';

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
        .from('user_profiles')
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
    let isMounted = true;

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      if (session?.user) {
        fetchUserProfile(session.user.id).then(profileData => {
          if (!isMounted) return;
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
        if (!isMounted) return;

        if (session?.user) {
          fetchUserProfile(session.user.id).then(profileData => {
            if (!isMounted) return;
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
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setIsLoadingAuth(true);
    try {
      dismissAllToasts();
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      logout
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