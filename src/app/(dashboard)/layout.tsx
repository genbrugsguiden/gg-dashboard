'use client';

import { useSyncExternalStore, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { isAuthenticated, clearTokens } from '@/lib/auth';
import { GET_ME } from '@/lib/graphql/queries';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User as UserIcon, ChevronDown, Leaf, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import type { User } from '@/types/graphql';

// Hydration-safe mounted detection using useSyncExternalStore
const emptySubscribe = () => () => {};
const returnTrue = () => true;
const returnFalse = () => false;

function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, returnTrue, returnFalse);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const mounted = useIsMounted();

  const { data } = useQuery<{ me: User }>(GET_ME, {
    skip: !mounted || !isAuthenticated(),
  });

  // Handle auth redirect in effect
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    }
  }, [router]);

  const handleLogout = () => {
    clearTokens();
    router.replace('/login');
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  const user = data?.me;
  const displayName = user
    ? `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.email
    : 'User';

  return (
    <div className="min-h-screen bg-background bg-texture">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold tracking-tight">Genbrugsguiden</h1>
              <span className="text-xs text-muted-foreground">Curation Dashboard</span>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            <Link
              href="/requests"
              className="rounded-full border border-border/60 px-4 py-1.5 text-sm text-muted-foreground transition hover:border-border hover:text-foreground"
            >
              Requests
            </Link>
            <Link
              href="/evals"
              className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-1.5 text-sm text-muted-foreground transition hover:border-border hover:text-foreground"
            >
              <BarChart3 className="h-4 w-4" />
              Evals
            </Link>
          </nav>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 rounded-full border border-border/50 px-3 transition-all hover:border-border hover:bg-accent"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserIcon className="h-4 w-4" />
                </div>
                <span className="hidden font-medium sm:inline">{displayName}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
