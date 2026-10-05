"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { getAuthCallbackUrl } from "@/lib/url-helpers";

export interface AdminProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  avatar_url: string | null;
  dana_number?: string | null;
  created_at?: string;
}

interface AdminAuthContextType {
  user: User | null;
  profile: AdminProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signInWithGoogle: (customRedirectTo?: string) => Promise<{ error: Error | null }>;
  signInWithPassword: (
    email: string,
    pass: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAdminPrivileges = async (currentUser: User, sessionToken?: string) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }

      const res = await fetch("/api/auth/admin-check", {
        method: "POST",
        headers,
        body: JSON.stringify({
          userId: currentUser.id,
          email: currentUser.email,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsAdmin(!!data.isAdmin);
        if (data.profile) {
          setProfile(data.profile);
        } else {
          setProfile({
            id: currentUser.id,
            name:
              currentUser.user_metadata?.full_name ||
              currentUser.user_metadata?.name ||
              currentUser.email?.split("@")[0] ||
              "Administrator",
            email: currentUser.email || null,
            role: data.isAdmin ? "Admin" : "User",
            avatar_url: currentUser.user_metadata?.avatar_url || null,
          });
        }
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error("Failed to verify admin status:", err);
      setIsAdmin(false);
    }
  };

  const initAuth = async () => {
    try {
      setIsLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await checkAdminPrivileges(session.user, session.access_token);
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
    } catch (err) {
      console.error("Init auth error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await checkAdminPrivileges(session.user, session.access_token);
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (customRedirectTo?: string) => {
    try {
      const callbackUrl = customRedirectTo || getAuthCallbackUrl("/auth/callback");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      return { error: error as Error | null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signInWithPassword = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        return { error };
      }

      if (data?.user) {
        setUser(data.user);
        await checkAdminPrivileges(data.user, data.session?.access_token);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Signout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAdminStatus = async () => {
    if (user) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await checkAdminPrivileges(user, session?.access_token);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        isLoading,
        signInWithGoogle,
        signInWithPassword,
        signOut,
        refreshAdminStatus,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
