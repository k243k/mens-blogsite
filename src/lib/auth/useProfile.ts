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
  const [roleResult, setRoleResult] = useState<{ role: AppRole | null } | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;
    getBrowserSupabase()
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setRoleResult({ role: (data?.role as AppRole) ?? null });
      });
    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const loading = authLoading || (!!user && roleResult === null);
  return {
    userId: user?.id ?? null,
    email: user?.email ?? null,
    role: roleResult?.role ?? null,
    loading,
  };
}
