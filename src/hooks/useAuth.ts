import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';

export type Permission = 'canEditSchedule' | 'canManageUsers' | 'canUpdateParticipantStatus';

// 認証が必要なパス
const AUTH_REQUIRED_PATHS = ['/', '/calendar', '/team', '/settings'];
// 認証済みユーザーがアクセスできないパス
const PUBLIC_ONLY_PATHS = ['/login'];

interface AuthUser extends User {
  role?: 'admin' | 'member';
  timezone?: string;
  display_name?: string;
  permissions?: {
    [K in Permission]: boolean;
  };
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const updateUserWithPermissions = (user: AuthUser) => {
    const permissions = {
      canEditSchedule: user.role === 'admin',
      canManageUsers: user.role === 'admin',
      canUpdateParticipantStatus: true
    };
    return { ...user, permissions };
  };

  const handleAuthRedirect = (hasAuth: boolean) => {
    if (!isInitialized) return;

    const isAuthRequired = AUTH_REQUIRED_PATHS.includes(pathname);
    const isPublicOnly = PUBLIC_ONLY_PATHS.includes(pathname);

    if (hasAuth && isPublicOnly) {
      router.push('/');
      return;
    }

    if (!hasAuth && isAuthRequired) {
      const loginUrl = new URL('/login', window.location.origin);
      if (pathname !== '/') {
        loginUrl.searchParams.set('redirect', pathname);
      }
      router.push(loginUrl.pathname + loginUrl.search);
      return;
    }
  };

  const fetchUserData = async (sessionUser: User) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, timezone, display_name')
        .eq('id', sessionUser.id)
        .single();

      if (userError) throw userError;

      const enhancedUser = {
        ...sessionUser,
        role: userData?.role || 'member',
        timezone: userData?.timezone || 'Asia/Tokyo',
        display_name: userData?.display_name
      };

      return updateUserWithPermissions(enhancedUser);
    } catch (err) {
      console.error('ユーザーデータの取得に失敗しました:', err);
      return updateUserWithPermissions({ ...sessionUser, role: 'member' });
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session?.user && mounted) {
          const userData = await fetchUserData(session.user);
          setUser(userData);
          handleAuthRedirect(true);
        } else {
          setUser(null);
          handleAuthRedirect(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('認証エラーが発生しました'));
        setUser(null);
        handleAuthRedirect(false);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

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
  }, [pathname]);

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
    isInitialized,
    signIn,
    signOut,
    isAdmin: () => user?.role === 'admin',
    hasPermission: (permission: Permission) => 
      user?.permissions?.[permission] || false
  };
}; 