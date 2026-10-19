"use client";

import { Toaster } from "@/components/ui/sonner";
import { AuthSessionProvider } from "@/providers/auth-session-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { WishlistSync } from "@/components/layout/wishlist-sync";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <AuthSessionProvider>
        {children}
        <WishlistSync />
        <Toaster richColors position="top-center" />
      </AuthSessionProvider>
    </ThemeProvider>
  );
}
