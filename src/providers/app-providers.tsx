"use client";

import { Toaster } from "@/components/ui/sonner";
import { AuthSessionProvider } from "@/providers/auth-session-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { WishlistSync } from "@/components/layout/wishlist-sync";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <AuthSessionProvider>
        <QueryProvider>
          {children}
          <WishlistSync />
          <Toaster richColors position="top-center" />
        </QueryProvider>
      </AuthSessionProvider>
    </ThemeProvider>
  );
}
