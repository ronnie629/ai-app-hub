-- ============================================
-- Supabase Storage 配置
-- 创建两个公开 bucket：app-covers、app-screenshots
-- ============================================

-- 1. 创建 bucket（公开读，登录用户写）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('app-covers', 'app-covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('app-screenshots', 'app-screenshots', true, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- 2. 公开读策略（任何人可读）
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id IN ('app-covers', 'app-screenshots'));

-- 3. 登录用户可上传（service role key 绕过 RLS，普通用户上传需要登录）
-- 注：服务端用 service_role_key 上传，会绕过此策略，无需额外开放
-- 如果需要客户端直传，可解除下行注释：
-- CREATE POLICY "Authenticated users can upload"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id IN ('app-covers', 'app-screenshots')
--   AND auth.role() = 'authenticated'
-- );

-- 4. 用户只能删除自己上传的图片（路径以 auth.uid() 开头）
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('app-covers', 'app-screenshots')
  AND (storage.foldername(name))[1] = auth.uid()::text
);
