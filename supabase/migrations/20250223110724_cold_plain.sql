/*
  # SNSアプリケーションの初期スキーマ

  1. 新規テーブル
    - `profiles`
      - `id` (uuid, primary key) - ユーザーID
      - `username` (text) - ユーザー名
      - `avatar_url` (text) - プロフィール画像URL
      - `bio` (text) - 自己紹介
      - `created_at` (timestamp) - 作成日時
      - `updated_at` (timestamp) - 更新日時

    - `posts`
      - `id` (uuid, primary key) - 投稿ID
      - `user_id` (uuid) - 投稿者ID
      - `content` (text) - 投稿内容
      - `created_at` (timestamp) - 作成日時
      - `updated_at` (timestamp) - 更新日時

    - `likes`
      - `id` (uuid, primary key) - いいねID
      - `user_id` (uuid) - いいねしたユーザーID
      - `post_id` (uuid) - いいねされた投稿ID
      - `created_at` (timestamp) - 作成日時

  2. セキュリティ
    - 全テーブルでRLSを有効化
    - プロフィールの読み取りは全ユーザーに許可
    - プロフィールの更新は本人のみ許可
    - 投稿の読み取りは全ユーザーに許可
    - 投稿の作成・更新は本人のみ許可
    - いいねの読み取りは全ユーザーに許可
    - いいねの作成・削除は認証済みユーザーのみ許可
*/

-- profiles tableの作成
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- postsテーブルの作成
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- likesテーブルの作成
CREATE TABLE likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- RLSの設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- プロフィールのポリシー
CREATE POLICY "プロフィールは誰でも閲覧可能" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "プロフィールは本人のみ更新可能" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 投稿のポリシー
CREATE POLICY "投稿は誰でも閲覧可能" ON posts
  FOR SELECT USING (true);

CREATE POLICY "投稿は認証済みユーザーのみ作成可能" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "投稿は本人のみ更新・削除可能" ON posts
  FOR ALL USING (auth.uid() = user_id);

-- いいねのポリシー
CREATE POLICY "いいねは誰でも閲覧可能" ON likes
  FOR SELECT USING (true);

CREATE POLICY "いいねは認証済みユーザーのみ作成可能" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "いいねは本人のみ削除可能" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- 更新日時を自動更新するための関数とトリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();