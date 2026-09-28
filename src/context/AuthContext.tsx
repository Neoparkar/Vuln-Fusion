import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from '../services/authService';
import { organizationService } from '../services/organizationService';
import { auditService } from '../services/auditService';
import { syncService } from '../services/syncService';

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  signInWithPassword: (email: string, password: string) => Promise<any>;
  signUpWithPassword: (email: string, password: string) => Promise<any>;
  resetPasswordForEmail: (email: string) => Promise<any>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
    const hasAuthHash = window.location.hash.includes('access_token') || window.location.hash.includes('error');
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');

    const handleAuthInit = async () => {
      try {
        if (authCode) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError.message);
          }
          urlParams.delete('code');
          const newSearch = urlParams.toString();
          const cleanSearch = newSearch ? `?${newSearch}` : '';
          window.history.replaceState(null, '', window.location.pathname + cleanSearch + window.location.hash);
        }

        // Get initial session safely
        const currentSession = await authService.getSession();
        if (!mounted) return;
        if (currentSession) {
          setSession(currentSession);
          setCurrentUser(currentSession.user);
          try {
            await organizationService.ensureDemoMembership(currentSession.user.id, currentSession.user.email || '');
            await syncService.syncDemoDataIfNeeded(DEMO_ORG_ID);
          } catch (err) {
            console.error('Demo membership & sync warning:', err);
          }
          setIsLoading(false);
          if (hasAuthHash || authCode) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        } else if (!hasAuthHash && !authCode) {
          setSession(null);
          setCurrentUser(null);
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Error getting session:', err);
        if (!hasAuthHash && !authCode) {
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      }
    };

    handleAuthInit();

    // Listen for auth changes safely
    let subscription: any = null;
    try {
      const authListener = authService.onAuthStateChange(async (_event, currentSession) => {
        if (!mounted) return;
        setSession(currentSession);
        setCurrentUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          try {
            await organizationService.ensureDemoMembership(currentSession.user.id, currentSession.user.email || '');
            await syncService.syncDemoDataIfNeeded(DEMO_ORG_ID);
            if (_event === 'SIGNED_IN') {
              await auditService.logEvent(DEMO_ORG_ID, currentSession.user.id, 'LOGIN', 'user', currentSession.user.id);
            }
          } catch (err) {
            console.error('Auth state change async warning:', err);
          }
          if (window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }
        setIsLoading(false);
      });
      subscription = authListener?.data?.subscription;
    } catch (err) {
      console.error('Auth state change listener warning:', err);
      if (hasAuthHash) {
        setIsLoading(false);
      }
    }

    return () => {
      mounted = false;
      if (subscription?.unsubscribe) {
        try {
          subscription.unsubscribe();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    return await authService.signInWithPassword(email, password);
  };

  const signUpWithPassword = async (email: string, password: string) => {
    return await authService.signUpWithPassword(email, password);
  };

  const resetPasswordForEmail = async (email: string) => {
    return await authService.resetPasswordForEmail(email);
  };

  const signInWithMagicLink = async (email: string) => {
    await authService.signInWithMagicLink(email);
  };

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle();
  };

  const signOut = async () => {
    if (currentUser) {
      try {
        await auditService.logEvent(DEMO_ORG_ID, currentUser.id, 'LOGOUT', 'user', currentUser.id);
      } catch (e) {
        // ignore
      }
    }
    await authService.signOut();
    setSession(null);
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    session,
    isLoading,
    isAuthenticated: Boolean(currentUser),
    isConfigured: isSupabaseConfigured,
    signInWithPassword,
    signUpWithPassword,
    resetPasswordForEmail,
    signInWithMagicLink,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
