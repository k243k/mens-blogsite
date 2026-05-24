"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { getBrowserSupabase } from "@/lib/supabase/client";

export type AuthState = {
  user: User | null;
  loading: boolean;
};

/**
 * 現在ログイン中ユーザーを取得し、認証状態の変化を購読する。
 * 未ログイン時は user=null。
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

/** ログアウトする。 */
export async function signOut(): Promise<void> {
  await getBrowserSupabase().auth.signOut();
}
