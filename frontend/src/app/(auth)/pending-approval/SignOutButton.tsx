'use client';

import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function SignOutButton() {
  const { signOut, loading } = useAuth();

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={signOut}
      disabled={loading}
    >
      <LogOut className="mr-2 h-4 w-4" />
      登出並切換帳號
    </Button>
  );
}
