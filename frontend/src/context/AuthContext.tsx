import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, setAdminStatus, getAdminStatus, clearAdminStatus } from '../lib/supabase';
import { authApi } from '../api/authApi';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  syncProfile: (userId: string, fullName: string, email: string, isAdmin: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fetchAdminStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Profile fetch error:', error.message);
      return false;
    }
    return data?.is_admin || false;
  } catch {
    return false;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(getAdminStatus()); // Initialize from cookie
  const [loading, setLoading] = useState(true);
  const initialCheckDone = useRef(false);

  useEffect(() => {
    // Failsafe: ensure loading never hangs indefinitely
    const failsafeTimer = setTimeout(() => {
      if (!initialCheckDone.current) {
        console.warn('Auth check timed out — forcing loading to false');
        setLoading(false);
      }
    }, 6000);

    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) console.error('getSession error:', error.message);

      const currentUser = session?.user ?? null;
      setSession(session);
      setUser(currentUser);

      if (currentUser) {
        // Check cookie first for instant load
        const cachedAdminStatus = getAdminStatus();
        setIsAdmin(cachedAdminStatus);
        
        // Then fetch from DB to ensure it's up to date
        const adminStatus = await fetchAdminStatus(currentUser.id);
        setIsAdmin(adminStatus);
        setAdminStatus(adminStatus); // Store in cookie
      } else {
        setIsAdmin(false);
        clearAdminStatus();
      }

      initialCheckDone.current = true;
      clearTimeout(failsafeTimer);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setSession(session);
      setUser(currentUser);

      if (currentUser) {
        const adminStatus = await fetchAdminStatus(currentUser.id);
        setIsAdmin(adminStatus);
        setAdminStatus(adminStatus); // Store in cookie
      } else {
        setIsAdmin(false);
        clearAdminStatus();
      }

      initialCheckDone.current = true;
      clearTimeout(failsafeTimer);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(failsafeTimer);
    };
  }, []);

  const signOut = async () => {
    try {
      // 1. Clear Supabase session (this will remove the cookie via our custom storage)
      await supabase.auth.signOut();
    } catch (err) {
      console.error('SignOut error:', err);
    } finally {
      // 2. Clear local state
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setLoading(false);
      
      // 3. Clear all cookies (including any other app cookies)
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // 4. Force a hard redirect to landing to purge all in-memory React states
      window.location.href = '/';
    }
  };

  const syncProfile = async (userId: string, fullName: string, email: string, isAdmin: boolean = false) => {
    try {
      await authApi.syncProfile(userId, fullName, email, isAdmin);
      setIsAdmin(isAdmin);
    } catch (error) {
      console.error('Failed to sync profile with backend:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signOut, syncProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
