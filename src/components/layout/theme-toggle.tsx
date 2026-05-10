"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function subscribe() {
  return () => {};
}

function useHasMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

export function ThemeToggle({ inverted }: { inverted?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useHasMounted();

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("rounded-full", inverted && "text-white hover:bg-white/10")}
        aria-label="Toggle theme"
      />
    );
  }

  const isDark = resolvedTheme === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("rounded-full", inverted && "text-white hover:bg-white/10 hover:text-white")}
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="h-[1.15rem] w-[1.15rem]" /> : <Moon className="h-[1.15rem] w-[1.15rem]" />}
      <span className="sr-only">Toggle theme ({theme})</span>
    </Button>
  );
}
