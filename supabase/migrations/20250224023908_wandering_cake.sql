/*
  # アバターテーブルの追加

  1. 新しいテーブル
    - `avatars`: ユーザーの複数アバターを管理するテーブル
      - `id` (uuid, primary key)
      - `user_id` (uuid, profiles.idへの参照)
      - `name` (text, アバター名)
      - `platform` (text, メタバースプラットフォーム名)
      - `image_url` (text, アバター画像URL)
      - `description` (text, アバターの説明)
      - `is_primary` (boolean, メインアバターかどうか)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. セキュリティ
    - RLSを有効化
    - 閲覧は全ユーザーに許可
    - 作成・更新・削除は本人のみ許可
*/

-- アバターテーブルの作成
CREATE TABLE avatars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  platform text NOT NULL,
  image_url text,
  description text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

-- RLSの有効化
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;

-- アバターのポリシー
CREATE POLICY "アバターは誰でも閲覧可能" ON avatars
  FOR SELECT USING (true);

CREATE POLICY "アバターは本人のみ作成可能" ON avatars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "アバターは本人のみ更新可能" ON avatars
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "アバターは本人のみ削除可能" ON avatars
  FOR DELETE USING (auth.uid() = user_id);

-- 更新日時を自動更新するトリガー
CREATE TRIGGER update_avatars_updated_at
  BEFORE UPDATE ON avatars
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- メインアバターの制約を管理する関数とトリガー
CREATE OR REPLACE FUNCTION manage_primary_avatar()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary THEN
    UPDATE avatars
    SET is_primary = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manage_primary_avatar_trigger
  BEFORE INSERT OR UPDATE OF is_primary ON avatars
  FOR EACH ROW
  EXECUTE FUNCTION manage_primary_avatar();