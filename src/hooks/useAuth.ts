import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthUser extends User {
  role?: 'admin' | 'member';
  timezone?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 現在のセッションを取得
    const fetchUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          // ユーザーの追加情報を取得
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role, timezone')
            .eq('id', session.user.id)
            .single();

          if (userError) throw userError;

          setUser({
            ...session.user,
            role: userData?.role || 'member',
            timezone: userData?.timezone || 'Asia/Tokyo'
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('認証エラーが発生しました'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, timezone')
          .eq('id', session.user.id)
          .single();

        if (!userError && userData) {
          setUser({
            ...session.user,
            role: userData.role,
            timezone: userData.timezone
          });
        } else {
          setUser(session.user);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
    } catch (err) {
      setError(err instanceof Error ? err : new Error('ログアウトに失敗しました'));
      throw err;
    }
  };

  const isAdmin = () => user?.role === 'admin';

  return {
    user,
    isLoading,
    error,
    signIn,
    signOut,
    isAdmin
  };
}; 