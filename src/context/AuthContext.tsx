import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from '../services/authService';
import { organizationService } from '../services/organizationService';
import { auditService } from '../services/auditService';
import { syncService } from '../services/syncService';
import {
  VULNFUSION_DEMO_MODE,
  DEMO_CREDENTIALS,
  DEMO_SESSION_STORAGE_KEY,
} from '../config/demoModeConfig';

// ============================================================================
// TEMPORARY HACKATHON PRESENTATION MODE
// REMOVE AFTER HACKATHON
// NOT FOR PRODUCTION AUTHENTICATION
// ============================================================================

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  isDemoMode: boolean;
  signInWithPassword: (email: string, password: string) => Promise<any>;
  signUpWithPassword: (email: string, password: string) => Promise<any>;
  resetPasswordForEmail: (email: string) => Promise<any>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';

const createDemoPresentationSession = (): { user: User; session: Session } => {
  const demoUser: User = {
    id: DEMO_CREDENTIALS.userId,
    app_metadata: { provider: 'demo_presentation', providers: ['demo_presentation'] },
    user_metadata: {
      display_name: DEMO_CREDENTIALS.displayName,
      full_name: DEMO_CREDENTIALS.displayName,
      role: DEMO_CREDENTIALS.role,
      is_demo_session: true,
    },
    aud: 'authenticated',
    confirmation_sent_at: '',
    recovery_sent_at: '',
    email_change_sent_at: '',
    new_email: '',
    invited_at: '',
    action_link: '',
    email: DEMO_CREDENTIALS.email,
    phone: '',
    created_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: '',
    last_sign_in_at: new Date().toISOString(),
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  };

  const demoSession: Session = {
    access_token: 'demo-presentation-token',
    token_type: 'bearer',
    expires_in: 86400,
    refresh_token: 'demo-presentation-refresh-token',
    user: demoUser,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
  };

  return { user: demoUser, session: demoSession };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check for temporary presentation session marker in sessionStorage
    if (VULNFUSION_DEMO_MODE && typeof window !== 'undefined') {
      try {
        const demoMarker = sessionStorage.getItem(DEMO_SESSION_STORAGE_KEY);
        if (demoMarker) {
          const parsed = JSON.parse(demoMarker);
          if (parsed && parsed.mode === 'demo' && parsed.user === DEMO_CREDENTIALS.email) {
            const { user, session: dSession } = createDemoPresentationSession();
            setCurrentUser(user);
            setSession(dSession);
            setIsDemoMode(true);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Demo session restoration warning:', err);
      }
    }

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
          setIsDemoMode(false);
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
          setIsDemoMode(false);
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
        // If demo mode is active in this tab, do not override unless real sign in occurs
        if (currentSession?.user) {
          setSession(currentSession);
          setCurrentUser(currentSession.user);
          setIsDemoMode(false);
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
    const cleanEmail = email.trim().toLowerCase();

    // Check for explicit presentation demo credentials
    if (cleanEmail === DEMO_CREDENTIALS.email.toLowerCase()) {
      if (VULNFUSION_DEMO_MODE) {
        if (password === DEMO_CREDENTIALS.password) {
          const { user, session: dSession } = createDemoPresentationSession();
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(
              DEMO_SESSION_STORAGE_KEY,
              JSON.stringify({
                mode: 'demo',
                user: DEMO_CREDENTIALS.email,
                role: DEMO_CREDENTIALS.role,
                timestamp: Date.now(),
              })
            );
          }
          setCurrentUser(user);
          setSession(dSession);
          setIsDemoMode(true);
          return { user, session: dSession };
        } else {
          throw new Error('Invalid login credentials');
        }
      } else {
        throw new Error('Presentation demo mode is currently disabled.');
      }
    }

    // Standard Supabase authentication for all regular accounts
    const result = await authService.signInWithPassword(email, password);
    setIsDemoMode(false);
    return result;
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
    // Clear temporary demo session state
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(DEMO_SESSION_STORAGE_KEY);
      } catch (e) {
        // ignore
      }
    }

    if (currentUser && !isDemoMode) {
      try {
        await auditService.logEvent(DEMO_ORG_ID, currentUser.id, 'LOGOUT', 'user', currentUser.id);
      } catch (e) {
        // ignore
      }
    }

    try {
      await authService.signOut();
    } catch (e) {
      // ignore
    }

    setSession(null);
    setCurrentUser(null);
    setIsDemoMode(false);
  };

  const value = {
    currentUser,
    session,
    isLoading,
    isAuthenticated: Boolean(currentUser),
    isConfigured: isSupabaseConfigured,
    isDemoMode,
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
