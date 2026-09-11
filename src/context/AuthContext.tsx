import { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { registerPushToken, unregisterPushToken } from '../lib/push';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  const fetchProfile = async (userId: string) => {
    userIdRef.current = userId;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile((data as Profile) ?? null);
    void registerPushToken(userId);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        userIdRef.current = null;
        setProfile(null);
      }
    });

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active' && userIdRef.current) {
        void registerPushToken(userIdRef.current);
      }
    };
    const appSub = AppState.addEventListener('change', onAppState);

    return () => {
      subscription.unsubscribe();
      appSub.remove();
    };
  }, []);

  const refreshProfile = async () => {
    if (session) await fetchProfile(session.user.id);
  };

  const signOut = async () => {
    // Çıkışta token'ı sil; yoksa bu telefon eski hesabın bildirimlerini almaya devam eder.
    const uid = userIdRef.current;
    if (uid) await unregisterPushToken(uid);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
