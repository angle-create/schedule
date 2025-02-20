import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';

export type Permission = 'canEditSchedule' | 'canManageUsers' | 'canUpdateParticipantStatus';

export interface AuthUser extends User {
  role?: 'admin' | 'member';
  timezone?: string;
  display_name?: string;
  avatar_url?: string;
  permissions?: {
    [K in Permission]: boolean;
  };
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleAuthRedirect = useCallback((isAuthenticated: boolean) => {
    if (isAuthenticated && pathname === '/login') {
      router.push('/');
    } else if (!isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [pathname, router]);

  const fetchUserData = useCallback(async (authUser: User) => {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userError) throw userError;

    return {
      ...authUser,
      role: userData?.role || 'member',
      display_name: userData?.display_name || authUser.email?.split('@')[0] || 'Unknown',
      permissions: userData?.permissions || {},
      avatar_url: userData?.avatar_url
    } as AuthUser;
  }, []);

  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        const userData = await fetchUserData(session.user);
        setUser(userData);
        handleAuthRedirect(true);
      } else {
        setUser(null);
        handleAuthRedirect(false);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleAuthRedirect, fetchUserData]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('ログインに失敗しました'));
      throw err;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('ログアウトに失敗しました'));
      throw err;
    }
  };

  return {
    user,
    isLoading,
    error,
    signIn,
    signOut,
    isAdmin: () => user?.role === 'admin',
    hasPermission: (permission: Permission) => 
      user?.permissions?.[permission] || false
  };
}; 