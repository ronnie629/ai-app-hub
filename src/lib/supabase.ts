import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase 客户端（浏览器端，使用 anon key）
 * 用于图片上传、读取公开 bucket 文件
 */
let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || anonKey === "__placeholder__") {
    return null;
  }

  browserClient = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  return browserClient;
}

/**
 * Supabase 客户端（服务端，使用 service role key）
 * 用于在服务端操作 storage（推荐 - 不受 RLS 限制，且能管理所有资源）
 */
let serverClient: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient | null {
  if (serverClient) return serverClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || serviceKey === "__placeholder__") {
    return null;
  }

  serverClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serverClient;
}

/**
 * 检查 Supabase 是否已配置
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && anonKey && anonKey !== "__placeholder__");
}
