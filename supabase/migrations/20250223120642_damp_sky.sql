/*
  # アバター用のストレージバケットとポリシーを作成

  1. 変更内容
    - アバター画像用のストレージバケットを作成
    - バケットに対するRLSポリシーを設定

  2. セキュリティ
    - 認証済みユーザーのみが自分のアバター画像をアップロード可能
    - アバター画像は誰でも閲覧可能
*/

-- アバター用のストレージバケットを作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- アバター画像のアップロードポリシー
CREATE POLICY "アバター画像は認証済みユーザーのみアップロード可能"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- アバター画像の更新ポリシー
CREATE POLICY "アバター画像は本人のみ更新可能"
ON storage.objects FOR UPDATE TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- アバター画像の削除ポリシー
CREATE POLICY "アバター画像は本人のみ削除可能"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- アバター画像の閲覧ポリシー
CREATE POLICY "アバター画像は誰でも閲覧可能"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');