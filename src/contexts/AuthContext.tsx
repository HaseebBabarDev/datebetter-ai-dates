import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  revenueCatLogIn,
  revenueCatLogOut,
} from "@/lib/revenuecat/initPurchases";

interface SignUpData {
  user: User | null;
  session: Session | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null; data: SignUpData | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastRevenueCatUserId = useRef<string | null>(null);

  useEffect(() => {
    const syncRevenueCatUser = async (userId: string | null) => {
      if (userId && userId !== lastRevenueCatUserId.current) {
        lastRevenueCatUserId.current = userId;
        try {
          await revenueCatLogIn(userId);
        } catch (e) {
          console.warn("[Auth] RevenueCat logIn failed", e);
        }
        return;
      }
      if (!userId && lastRevenueCatUserId.current) {
        lastRevenueCatUserId.current = null;
        try {
          await revenueCatLogOut();
        } catch (e) {
          console.warn("[Auth] RevenueCat logOut failed", e);
        }
      }
    };

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      void syncRevenueCatUser(nextSession?.user?.id ?? null);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      setLoading(false);
      void syncRevenueCatUser(existing?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name || null
        }
      }
    });
    return { error, data: data ? { user: data.user, session: data.session } : null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // Track login location if successful
    if (!error && data.session) {
      try {
        await supabase.functions.invoke("track-login");
      } catch (trackError) {
        // Don't block login if tracking fails
        console.error("Failed to track login:", trackError);
      }
    }
    
    return { error };
  };

  const signOut = async () => {
    try {
      await revenueCatLogOut();
    } catch (e) {
      console.warn("[Auth] RevenueCat logOut on signOut failed", e);
    }
    lastRevenueCatUserId.current = null;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
