/*
  # ストレージポリシーの修正

  1. 変更内容
    - ストレージポリシーの条件を簡素化
    - バケットのパブリックアクセス設定を確実に有効化

  2. セキュリティ
    - 認証済みユーザーのみが自身のアバター画像を操作可能
    - 全ユーザーがアバター画像を閲覧可能
*/

-- アバター画像のアップロードポリシーを修正
DROP POLICY IF EXISTS "アバター画像は認証済みユーザーのみアップロード可能" ON storage.objects;
CREATE POLICY "アバター画像は認証済みユーザーのみアップロード可能"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  STARTS_WITH(name, auth.uid()::text || '/')
);

-- アバター画像の更新ポリシーを修正
DROP POLICY IF EXISTS "アバター画像は本人のみ更新可能" ON storage.objects;
CREATE POLICY "アバター画像は本人のみ更新可能"
ON storage.objects FOR UPDATE TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  STARTS_WITH(name, auth.uid()::text || '/')
);

-- アバター画像の削除ポリシーを修正
DROP POLICY IF EXISTS "アバター画像は本人のみ削除可能" ON storage.objects;
CREATE POLICY "アバター画像は本人のみ削除可能"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  STARTS_WITH(name, auth.uid()::text || '/')
);

-- アバター画像の閲覧ポリシーを修正
DROP POLICY IF EXISTS "アバター画像は誰でも閲覧可能" ON storage.objects;
CREATE POLICY "アバター画像は誰でも閲覧可能"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- ストレージバケットのパブリックアクセスを確実に有効化
UPDATE storage.buckets
SET public = true
WHERE id = 'avatars';