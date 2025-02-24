'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { UserCircle2, Search, Star } from 'lucide-react';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type AvatarType = Database['public']['Tables']['avatars']['Row'];

export default function Home() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [avatars, setAvatars] = useState<AvatarType[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('ログアウトに失敗しました');
    } else {
      toast.success('ログアウトしました');
      router.refresh();
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      if (!searchQuery.trim()) {
        setProfiles([]);
        setAvatars([]);
        return;
      }

      // プロフィールとアバターを並列で検索
      const [profilesResponse, avatarsResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`)
          .order('username'),
        supabase
          .from('avatars')
          .select('*')
          .or(`name.ilike.%${searchQuery}%,platform.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .order('is_primary', { ascending: false })
      ]);

      if (profilesResponse.error) throw profilesResponse.error;
      if (avatarsResponse.error) throw avatarsResponse.error;

      setProfiles(profilesResponse.data || []);
      setAvatars(avatarsResponse.data || []);
    } catch (error) {
      toast.error('検索に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">メタバースSNS</h1>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/profile')}
            >
              <UserCircle2 className="w-5 h-5 mr-2" />
              プロフィール
            </Button>
            <Button onClick={handleSignOut}>ログアウト</Button>
          </div>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="ユーザー名、アバター名、プラットフォームで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* プロフィール検索結果 */}
            {profiles.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">ユーザー</h2>
                <div className="space-y-4">
                  {profiles.map((profile) => (
                    <Card key={profile.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
                            <AvatarFallback>
                              <UserCircle2 className="w-8 h-8" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-semibold">{profile.username}</h3>
                            {profile.bio && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {profile.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* アバター検索結果 */}
            {avatars.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">アバター</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {avatars.map((avatar) => (
                    <Card key={avatar.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={avatar.image_url || ''} alt={avatar.name} />
                            <AvatarFallback>
                              <UserCircle2 className="w-6 h-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-semibold truncate">
                                {avatar.name}
                              </h4>
                              {avatar.is_primary && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {avatar.platform}
                            </p>
                            {avatar.description && (
                              <p className="text-xs mt-1 truncate">
                                {avatar.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {searchQuery && profiles.length === 0 && avatars.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                検索結果が見つかりませんでした
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}