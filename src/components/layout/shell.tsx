import { cn } from "@/lib/utils";

const layoutInset = "mx-auto w-full px-[var(--section-x)]";

/** Readable text column — use inside wide sections for copy balance */
export function LayoutProse({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("max-w-2xl", className)} {...props} />;
}

/** Standard content width — editorial / legal / forms */
export function LayoutContainer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(layoutInset, "max-w-[var(--page-max)]", className)}
      {...props}
    />
  );
}

/** Wide marketing & dashboards — immersive without touching viewport edges */
export function LayoutWide({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(layoutInset, "max-w-[var(--page-wide)]", className)}
      {...props}
    />
  );
}

/** Full-bleed section wrapper (edge-to-edge background); inner content still uses padding */
export function SectionBleed({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <section className={cn("w-full", className)}>{children}</section>;
}
