'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserCircle2, ArrowLeft, Plus, Star, Trash2, Upload } from 'lucide-react';
import type { Database } from '@/lib/database.types';

type Avatar = Database['public']['Tables']['avatars']['Row'];

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [newAvatar, setNewAvatar] = useState({
    name: '',
    platform: '',
    description: '',
    image_url: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    getProfile();
    getAvatars();
  }, []);

  const getProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      if (profile) {
        setUsername(profile.username);
        setBio(profile.bio || '');
        setAvatarUrl(profile.avatar_url || '');
      }
    } catch (error) {
      toast.error('プロフィールの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getAvatars = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('avatars')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAvatars(data || []);
    } catch (error) {
      toast.error('アバターの取得に失敗しました');
    }
  };

  const updateProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth');
        return;
      }

      if (!username.trim()) {
        toast.error('ユーザー名は必須です');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          username,
          bio: bio || null,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('プロフィールを更新しました');
    } catch (error) {
      toast.error('プロフィールの更新に失敗しました');
    }
  };

  const uploadAvatarImage = async (file: File, userId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatar-images')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatar-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const uploadProfileAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('画像を選択してください');
      }

      const file = event.target.files[0];
      const imageUrl = await uploadAvatarImage(file, session.user.id);

      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          avatar_url: imageUrl,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      setAvatarUrl(imageUrl);
      toast.success('プロフィール画像を更新しました');
    } catch (error) {
      toast.error('プロフィール画像の更新に失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const createAvatar = async () => {
    try {
      setUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (!newAvatar.name.trim() || !newAvatar.platform.trim()) {
        toast.error('アバター名とプラットフォームは必須です');
        return;
      }

      let imageUrl = newAvatar.image_url;
      if (selectedFile) {
        imageUrl = await uploadAvatarImage(selectedFile, session.user.id);
      }

      const { error } = await supabase
        .from('avatars')
        .insert({
          user_id: session.user.id,
          name: newAvatar.name,
          platform: newAvatar.platform,
          description: newAvatar.description || null,
          image_url: imageUrl || null,
          is_primary: avatars.length === 0,
        });

      if (error) throw error;

      toast.success('アバターを作成しました');
      getAvatars();
      setNewAvatar({ name: '', platform: '', description: '', image_url: '' });
      setSelectedFile(null);
    } catch (error) {
      toast.error('アバターの作成に失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const updateAvatarImage = async (avatarId: string, file: File) => {
    try {
      setUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const imageUrl = await uploadAvatarImage(file, session.user.id);

      const { error } = await supabase
        .from('avatars')
        .update({ image_url: imageUrl })
        .eq('id', avatarId);

      if (error) throw error;

      toast.success('アバター画像を更新しました');
      getAvatars();
    } catch (error) {
      toast.error('アバター画像の更新に失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const setPrimaryAvatar = async (avatarId: string) => {
    try {
      const { error } = await supabase
        .from('avatars')
        .update({ is_primary: true })
        .eq('id', avatarId);

      if (error) throw error;

      toast.success('メインアバターを設定しました');
      getAvatars();
    } catch (error) {
      toast.error('メインアバターの設定に失敗しました');
    }
  };

  const deleteAvatar = async (avatarId: string, imageUrl: string | null) => {
    try {
      // 画像の削除
      if (imageUrl) {
        const fileName = imageUrl.split('/').slice(-2).join('/');
        await supabase.storage
          .from('avatar-images')
          .remove([fileName]);
      }

      const { error } = await supabase
        .from('avatars')
        .delete()
        .eq('id', avatarId);

      if (error) throw error;

      toast.success('アバターを削除しました');
      getAvatars();
    } catch (error) {
      toast.error('アバターの削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          戻る
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* プロフィール設定 */}
          <Card>
            <CardHeader>
              <CardTitle>プロフィール設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={avatarUrl} alt={username} />
                  <AvatarFallback>
                    <UserCircle2 className="w-20 h-20" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex items-center space-x-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={uploadProfileAvatar}
                    disabled={uploading}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Button
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    disabled={uploading}
                    variant="outline"
                  >
                    {uploading ? '画像をアップロード中...' : 'プロフィール画像を変更'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">ユーザー名 *</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ユーザー名を入力"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">自己紹介</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="自己紹介を入力"
                  rows={4}
                />
              </div>

              <Button
                onClick={updateProfile}
                className="w-full"
              >
                プロフィールを更新
              </Button>
            </CardContent>
          </Card>

          {/* アバター管理 */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>アバター管理</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      新規アバター
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>新規アバター作成</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="avatar-name">アバター名 *</Label>
                        <Input
                          id="avatar-name"
                          value={newAvatar.name}
                          onChange={(e) => setNewAvatar({ ...newAvatar, name: e.target.value })}
                          placeholder="アバター名を入力"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avatar-platform">プラットフォーム *</Label>
                        <Input
                          id="avatar-platform"
                          value={newAvatar.platform}
                          onChange={(e) => setNewAvatar({ ...newAvatar, platform: e.target.value })}
                          placeholder="VRChat, Cluster など"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avatar-image">アバター画像</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="hidden"
                            id="new-avatar-image"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('new-avatar-image')?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            画像を選択
                          </Button>
                          {selectedFile && (
                            <span className="text-sm text-muted-foreground">
                              {selectedFile.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avatar-description">説明</Label>
                        <Textarea
                          id="avatar-description"
                          value={newAvatar.description}
                          onChange={(e) => setNewAvatar({ ...newAvatar, description: e.target.value })}
                          placeholder="アバターの説明を入力"
                          rows={3}
                        />
                      </div>
                      <Button 
                        onClick={createAvatar}
                        className="w-full"
                        disabled={uploading}
                      >
                        {uploading ? '作成中...' : '作成'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {avatars.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      アバターがまだ登録されていません
                    </p>
                  ) : (
                    avatars.map((avatar) => (
                      <Card key={avatar.id} className="relative">
                        <CardContent className="flex items-center space-x-4 p-4">
                          <div className="relative group">
                            <Avatar className="w-16 h-16">
                              <AvatarImage src={avatar.image_url || ''} alt={avatar.name} />
                              <AvatarFallback>
                                <UserCircle2 className="w-8 h-8" />
                              </AvatarFallback>
                            </Avatar>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  updateAvatarImage(avatar.id, file);
                                }
                              }}
                              className="hidden"
                              id={`avatar-image-${avatar.id}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/50 text-white rounded-full"
                              onClick={() => document.getElementById(`avatar-image-${avatar.id}`)?.click()}
                              disabled={uploading}
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-lg font-semibold truncate">
                                {avatar.name}
                              </h4>
                              {avatar.is_primary && (
                                <span className="text-yellow-500">
                                  <Star className="w-4 h-4 fill-current" />
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {avatar.platform}
                            </p>
                            {avatar.description && (
                              <p className="text-sm mt-1 truncate">
                                {avatar.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {!avatar.is_primary && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPrimaryAvatar(avatar.id)}
                                title="メインアバターに設定"
                              >
                                <Star className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteAvatar(avatar.id, avatar.image_url)}
                              className="text-destructive"
                              title="削除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}