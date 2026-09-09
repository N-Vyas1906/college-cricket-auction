import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { PlayerCard } from "@/components/PlayerCard";
import { TeamStrip } from "@/components/TeamStrip";
import { formatLakhs } from "@/lib/auction/format";
import { useAuction } from "@/lib/auction/store";

export const Route = createFileRoute("/projection")({
  head: () => ({
    meta: [
      { title: "Projection Mode — College IPL Auction" },
      {
        name: "description",
        content:
          "Audience-facing big-screen view of the auction: the player on the block, the live bid, the highest bidder and every team's remaining purse.",
      },
      { property: "og:title", content: "Projection Mode — College IPL Auction" },
      { property: "og:description", content: "Cinematic big-screen auction display for the crowd." },
    ],
  }),
  component: ProjectionPage,
});

function ProjectionPage() {
  const { state } = useAuction();
  const { live, players, teams } = state;
  const player = players.find((p) => p.id === live.currentPlayerId) ?? null;
  const bidder = teams.find((t) => t.id === live.currentBidderId) ?? null;
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!live.lastResult) return;
    setShowResult(true);
    const t = setTimeout(() => setShowResult(false), 6000);
    return () => clearTimeout(t);
  }, [live.lastResult]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden p-6 lg:p-10">
      <Link
        to="/auction"
        className="absolute right-4 top-4 z-20 rounded-lg border border-border bg-surface/70 px-3 py-2 text-xs text-muted-foreground opacity-40 transition-opacity hover:opacity-100 focus-visible:opacity-100"
      >
        <ArrowLeft className="mr-1 inline size-3" /> Operator view
      </Link>

      <header className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="gradient-electric grid size-14 place-items-center rounded-2xl font-display text-3xl text-primary-foreground glow">
            C
          </span>
          <div>
            <h1 className="font-display text-4xl leading-none tracking-wide lg:text-6xl">
              COLLEGE IPL AUCTION
            </h1>
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-muted-foreground lg:text-sm">
              Live from the campus stage
            </p>
          </div>
        </div>
        <div className="hidden text-right lg:block">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {live.currentSet ?? "All sets"}
          </div>
          <div className="font-display text-3xl">
            {players.filter((p) => p.status === "sold").length} sold ·{" "}
            {players.filter((p) => p.status === "unsold").length} unsold
          </div>
        </div>
      </header>

      <main className="mt-6 flex-1">
        {player ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
            <PlayerCard player={player} size="xl" />
            <div className="glass stadium-grid rounded-3xl p-8 text-center">
              <div className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                Current bid
              </div>
              <div
                key={live.currentBid}
                className="animate-bid-pop font-display text-7xl leading-none text-gold lg:text-[8rem]"
              >
                {formatLakhs(live.currentBid)}
              </div>
              <div className="mt-6 text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                Highest bidder
              </div>
              <div className="mt-1 truncate font-display text-4xl lg:text-6xl">
                {bidder ? bidder.name : "Awaiting first bid"}
              </div>
              {bidder && (
                <div className="mt-3 text-lg text-muted-foreground">
                  Purse left after this bid:{" "}
                  {formatLakhs(bidder.purse - bidder.spent - live.currentBid)}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass stadium-grid grid min-h-[45vh] place-items-center rounded-3xl p-10 text-center">
            {showResult && live.lastResult ? (
              <div className="animate-stamp-in">
                <div
                  className={`font-display text-7xl lg:text-9xl ${
                    live.lastResult.type === "SOLD" ? "text-success" : "text-destructive"
                  }`}
                >
                  {live.lastResult.type}
                </div>
                <div className="mt-4 font-display text-4xl lg:text-6xl">{live.lastResult.playerName}</div>
                {live.lastResult.type === "SOLD" && (
                  <div className="mt-2 text-2xl text-muted-foreground lg:text-4xl">
                    {live.lastResult.teamName} · {formatLakhs(live.lastResult.amount ?? 0)}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="font-display text-6xl text-gradient lg:text-8xl">NEXT PLAYER LOADING</div>
                <p className="mt-3 text-lg text-muted-foreground">Stay tuned — the hammer is about to fall.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-6">
        <TeamStrip teams={teams} highlightTeamId={live.currentBidderId} big />
      </footer>
    </div>
  );
}
