/*
  # アバター画像用のストレージポリシーの更新

  1. 既存のポリシーを削除
  2. バケット名を接頭辞として追加した新しいポリシーを作成
*/

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "アバター画像は認証済みユーザーのみアップロード可能" ON storage.objects;
DROP POLICY IF EXISTS "アバター画像は本人のみ更新可能" ON storage.objects;
DROP POLICY IF EXISTS "アバター画像は本人のみ削除可能" ON storage.objects;
DROP POLICY IF EXISTS "アバター画像は誰でも閲覧可能" ON storage.objects;

-- バケット名を接頭辞として追加した新しいポリシーを作成
CREATE POLICY "avatar_images_アバター画像は認証済みユーザーのみアップロード可能"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatar-images' AND
  STARTS_WITH(name, auth.uid()::text || '/')
);

CREATE POLICY "avatar_images_アバター画像は本人のみ更新可能"
ON storage.objects FOR UPDATE TO authenticated
WITH CHECK (
  bucket_id = 'avatar-images' AND
  STARTS_WITH(name, auth.uid()::text || '/')
);

CREATE POLICY "avatar_images_アバター画像は本人のみ削除可能"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatar-images' AND
  STARTS_WITH(name, auth.uid()::text || '/')
);

CREATE POLICY "avatar_images_アバター画像は誰でも閲覧可能"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatar-images');