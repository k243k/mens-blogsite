"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/useAuth";
import { getBrowserSupabase } from "@/lib/supabase/client";

export type AppRole = "user" | "writer" | "editor" | "admin";

export type ProfileState = {
  userId: string | null;
  email: string | null;
  role: AppRole | null;
  loading: boolean;
  /** profiles 取得が通信/DB エラーで失敗したか。true のとき role は信頼できない。 */
  loadError: boolean;
};

const STAFF_ROLES: AppRole[] = ["writer", "editor", "admin"];

/** writer/editor/admin か。 */
export function isStaffRole(role: AppRole | null): boolean {
  return role !== null && STAFF_ROLES.includes(role);
}

/** editor/admin か。 */
export function isEditorRole(role: AppRole | null): boolean {
  return role === "editor" || role === "admin";
}

/**
 * 現在ユーザーの profiles.role を取得する。
 * 表示制御用（最終的な権限保証は DB の RLS 側）。
 */
export function useProfile(): ProfileState {
  const { user, loading: authLoading } = useAuth();
  // 取得した role が「どのユーザーのものか」を保持する。
  // userId を一緒に覚えることで、ユーザー切替直後に前ユーザーの role を
  // そのまま信頼してしまう取りこぼし（権限の一時露出）を render 時に排除する。
  const [roleResult, setRoleResult] = useState<{
    userId: string;
    role: AppRole | null;
    error: boolean;
  } | null>(null);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (authLoading || !userId) return;
    let active = true;
    getBrowserSupabase()
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        // 取得失敗（通信/DB障害等）は role=null と区別する。握りつぶすと
        // 一時障害で staff を非staff扱いし誤って弾いてしまう。
        if (active) {
          setRoleResult({ userId, role: (data?.role as AppRole) ?? null, error: !!error });
        }
      });
    return () => {
      active = false;
    };
  }, [authLoading, userId]);

  // 現在のユーザーに対応する取得結果だけを有効とみなす（古い結果は無視）。
  const matched = roleResult && roleResult.userId === userId ? roleResult : null;
  // ログイン済みで、まだ当該ユーザーの role を取得できていない間は loading 扱い。
  const loading = authLoading || (!!userId && matched === null);
  return {
    userId,
    email: user?.email ?? null,
    role: matched?.role ?? null,
    loading,
    loadError: matched?.error ?? false,
  };
}
