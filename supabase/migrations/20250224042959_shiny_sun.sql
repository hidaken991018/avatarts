/*
  # アバター画像用のストレージバケットとポリシーの作成

  1. 新規バケット
    - `avatar-images` バケットを作成
    - パブリックアクセスを有効化

  2. セキュリティ
    - アップロード: 認証済みユーザーのみ、自分のフォルダにのみアップロード可能
    - 更新: 認証済みユーザーのみ、自分のフォルダ内のファイルのみ更新可能
    - 削除: 認証済みユーザーのみ、自分のフォルダ内のファイルのみ削除可能
    - 閲覧: 誰でも閲覧可能
*/

-- アバター画像用のストレージバケットを作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatar-images', 'avatar-images', true);

-- アバター画像のアップロードポリシー
CREATE POLICY "アバター画像は認証済みユーザーのみアップロード可能"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatar-images' AND
  STARTS_WITH(name, auth.uid()::text || '/')
);

-- アバター画像の更新ポリシー
CREATE POLICY "アバター画像は本人のみ更新可能"
ON storage.objects FOR UPDATE TO authenticated
WITH CHECK (
  bucket_id = 'avatar-images' AND
  STARTS_WITH(name, auth.uid()::text || '/')
);

-- アバター画像の削除ポリシー
CREATE POLICY "アバター画像は本人のみ削除可能"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatar-images' AND
  STARTS_WITH(name, auth.uid()::text || '/')
);

-- アバター画像の閲覧ポリシー
CREATE POLICY "アバター画像は誰でも閲覧可能"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatar-images');