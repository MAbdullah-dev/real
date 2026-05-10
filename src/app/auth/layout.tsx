import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen mesh-bg">
      <div
        className="absolute inset-0 opacity-95"
        style={{ background: "var(--gradient-hero)" }}
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
        <Link
          href="/"
          className="mb-8 text-center text-sm font-semibold text-primary-foreground/90 hover:text-primary-foreground"
        >
          ← Estate Elite
        </Link>
        {children}
      </div>
    </div>
  );
}
