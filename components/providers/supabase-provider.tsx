'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import type { SupabaseClient, User } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
  user: User | null;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN') router.refresh();
      if (event === 'SIGNED_OUT') {
        router.refresh();
        router.push('/auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return (
    <Context.Provider value={{ supabase, user }}>
      {children}
    </Context.Provider>
  );
}