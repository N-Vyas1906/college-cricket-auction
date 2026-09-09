import { createFileRoute, Link } from "@tanstack/react-router";
import { Gavel, Users, UserRound, Settings2, Wallet, Trophy, MonitorPlay } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { TeamStrip } from "@/components/TeamStrip";
import { Button } from "@/components/ui/button";
import { formatLakhs } from "@/lib/auction/format";
import { useAuction, remainingPurse } from "@/lib/auction/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "College IPL Auction — Live Auction Control Room" },
      {
        name: "description",
        content:
          "Run a broadcast-style college cricket auction: player database, team purses, live bidding and a projection view for the audience.",
      },
      { property: "og:title", content: "College IPL Auction — Live Auction Control Room" },
      {
        property: "og:description",
        content: "Operator dashboard and cinematic projection view for your college cricket auction night.",
      },
    ],
  }),
  component: Dashboard,
});

function Stat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Users;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        <Icon className="size-5 shrink-0 text-primary" aria-hidden />
      </div>
      <div className="mt-3 font-display text-4xl">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Dashboard() {
  const { state } = useAuction();
  const { players, teams, log } = state;

  const sold = players.filter((p) => p.status === "sold").length;
  const unsold = players.filter((p) => p.status === "unsold").length;
  const totalPurse = teams.reduce((sum, t) => sum + t.purse, 0);
  const remaining = teams.reduce((sum, t) => sum + remainingPurse(t), 0);

  return (
    <AppShell
      title="Auction Control Room"
      subtitle="Set up players and teams, then take the stage. Demo data is pre-loaded."
      actions={
        <>
          <Button asChild variant="outline">
            <Link to="/projection">
              <MonitorPlay className="mr-2 size-4" /> Projection view
            </Link>
          </Button>
          <Button asChild className="gradient-electric glow border-0 text-primary-foreground">
            <Link to="/auction">
              <Gavel className="mr-2 size-4" /> Start Auction
            </Link>
          </Button>
        </>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Players" value={String(players.length)} hint={`${sold} sold · ${unsold} unsold`} icon={UserRound} />
        <Stat label="Teams" value={String(teams.length)} hint="Franchises in the auction" icon={Users} />
        <Stat label="Total Purse" value={formatLakhs(totalPurse)} hint="Across all teams" icon={Wallet} />
        <Stat label="Purse Left" value={formatLakhs(remaining)} hint="Available to spend" icon={Trophy} />
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { to: "/players", label: "Setup Players", desc: "Add, edit and organise auction sets", icon: UserRound },
          { to: "/teams", label: "Setup Teams", desc: "Names, logos and purse amounts", icon: Users },
          { to: "/settings", label: "Auction Settings", desc: "Purse, bid increments, randomisation", icon: Settings2 },
          { to: "/auction", label: "Start Auction", desc: "Go live with the bidding floor", icon: Gavel },
        ].map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="glass group rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <q.icon className="size-6 text-primary" aria-hidden />
            <h2 className="mt-3 font-display text-2xl">{q.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{q.desc}</p>
          </Link>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-2xl">Teams &amp; purses</h2>
        <TeamStrip teams={teams} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-2xl">Recent auction activity</h2>
        {log.length === 0 ? (
          <p className="glass rounded-2xl p-5 text-sm text-muted-foreground">
            Nothing sold yet. Head to the live auction to get started.
          </p>
        ) : (
          <ul className="glass divide-y divide-border rounded-2xl">
            {log.slice(0, 8).map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="min-w-0 truncate font-semibold">{entry.playerName}</span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {entry.type === "SOLD"
                    ? `${entry.teamName} · ${formatLakhs(entry.amount ?? 0)}`
                    : "Unsold"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
