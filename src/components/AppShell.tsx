import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/players", label: "Players" },
  { to: "/teams", label: "Teams" },
  { to: "/settings", label: "Settings" },
  { to: "/auction", label: "Live Auction" },
] as const;

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`group flex items-center gap-3 ${className}`}>
      <span className="gradient-electric grid size-10 place-items-center rounded-xl font-display text-xl text-primary-foreground shadow-[var(--shadow-glow)]">
        C
      </span>
      <span className="min-w-0 leading-none">
        <span className="block font-display text-xl tracking-wide">COLLEGE IPL</span>
        <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
          Auction
        </span>
      </span>
    </Link>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto grid max-w-[1700px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:flex sm:justify-between">
          <BrandMark />
          <nav className="flex flex-wrap items-center gap-1" aria-label="Main">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[status=active]:bg-secondary data-[status=active]:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1700px] px-4 py-6">
        {(title || actions) && (
          <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:justify-between">
            <div className="min-w-0">
              {title && <h1 className="truncate font-display text-3xl sm:text-4xl">{title}</h1>}
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
