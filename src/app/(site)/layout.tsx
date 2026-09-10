import { Suspense } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * The header reads `usePathname()`, which is request data on dynamic routes, so
 * it streams in behind a same-height placeholder to keep the shell prerenderable.
 */
function SiteHeaderFallback() {
  return <div className="h-16 w-full" />;
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<SiteHeaderFallback />}>
        <SiteHeader />
      </Suspense>
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">{children}</main>
      <SiteFooter />
    </>
  );
}
