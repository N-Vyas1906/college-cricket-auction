import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Ban, ExternalLink, Gavel, MonitorPlay, SkipForward, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { PlayerCard } from "@/components/PlayerCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatLakhs, initials } from "@/lib/auction/format";
import {
  currentIncrement,
  nextBidAmount,
  remainingPurse,
  useAuction,
} from "@/lib/auction/store";
import { AUCTION_SETS, type AuctionSet } from "@/lib/auction/types";

export const Route = createFileRoute("/auction")({
  head: () => ({
    meta: [
      { title: "Live Auction Floor — College IPL Auction" },
      {
        name: "description",
        content:
          "Operator console for the live college auction: pick a set, take bids from teams, sell or mark unsold, and undo mistakes instantly.",
      },
      { property: "og:title", content: "Live Auction Floor — College IPL Auction" },
      { property: "og:description", content: "Run the bidding floor with purse-aware team bid buttons." },
    ],
  }),
  component: AuctionPage,
});

function AuctionPage() {
  const store = useAuction();
  const { state, placeBid, sell, markUnsold, undo, nextPlayer, selectSet, canUndo } = store;
  const { live, players, teams, log } = state;

  const player = players.find((p) => p.id === live.currentPlayerId) ?? null;
  const bidder = teams.find((t) => t.id === live.currentBidderId) ?? null;
  const nextAmount = nextBidAmount(state);
  const increment = currentIncrement(state);

  const pool = players.filter((p) => p.status === "available" && (!live.currentSet || p.set === live.currentSet));
  const soldCount = players.filter((p) => p.status === "sold").length;
  const unsoldCount = players.filter((p) => p.status === "unsold").length;

  // keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
      if (e.key.toLowerCase() === "s" && player && bidder) sell();
      else if (e.key.toLowerCase() === "u" && player) markUnsold();
      else if (e.key.toLowerCase() === "n" && !player) handleNext();
      else if (e.key.toLowerCase() === "z" && canUndo) undo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, bidder, canUndo]);

  const handleNext = () => {
    if (!nextPlayer()) toast.error("No available players left in this set");
  };

  const openProjection = () => {
    window.open("/projection", "_blank", "noopener,noreferrer");
  };

  return (
    <AppShell
      title="Live Auction Floor"
      subtitle="Click a team to bid, then SELL or UNSOLD. Shortcuts: N next · S sell · U unsold · Z undo."
      actions={
        <>
          <Button variant="outline" onClick={openProjection}>
            <ExternalLink className="mr-2 size-4" /> Projection in new tab
          </Button>
          <Button asChild variant="outline">
            <Link to="/projection">
              <MonitorPlay className="mr-2 size-4" /> Projection view
            </Link>
          </Button>
        </>
      }
    >
      {/* status header */}
      <div className="glass mb-4 grid gap-3 rounded-2xl p-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-center">
        <div className="min-w-0">
          <div className="text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Current set
          </div>
          <Select
            value={live.currentSet ?? "all"}
            onValueChange={(v) => selectSet(v === "all" ? null : (v as AuctionSet))}
          >
            <SelectTrigger className="mt-1 w-full lg:w-80" aria-label="Choose auction set">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sets</SelectItem>
              {AUCTION_SETS.map((s) => {
                const count = players.filter((p) => p.set === s && p.status === "available").length;
                return (
                  <SelectItem key={s} value={s}>
                    {s} ({count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <Stat label="In set" value={String(pool.length)} />
        <Stat label="Sold" value={String(soldCount)} />
        <Stat label="Unsold" value={String(unsoldCount)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {player ? (
            <PlayerCard player={player} size="xl" />
          ) : (
            <div className="glass stadium-grid grid min-h-64 place-items-center rounded-2xl p-10 text-center">
              <div>
                <Gavel className="mx-auto size-10 text-primary" aria-hidden />
                <h2 className="mt-3 font-display text-4xl">
                  {live.lastResult
                    ? live.lastResult.type === "SOLD"
                      ? `${live.lastResult.playerName} → ${live.lastResult.teamName}`
                      : `${live.lastResult.playerName} went unsold`
                    : "Ready when you are"}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {pool.length > 0
                    ? `${pool.length} players available${live.currentSet ? ` in ${live.currentSet}` : ""}.`
                    : "No available players in this selection."}
                </p>
                <Button
                  className="gradient-electric glow mt-5 border-0 text-primary-foreground"
                  size="lg"
                  onClick={handleNext}
                  disabled={pool.length === 0}
                >
                  <SkipForward className="mr-2 size-4" /> Bring in next player
                </Button>
              </div>
            </div>
          )}

          {/* bid panel */}
          <div className="glass rounded-2xl p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  Current bid
                </div>
                <div key={live.currentBid} className="animate-bid-pop font-display text-5xl text-gold">
                  {player ? formatLakhs(live.currentBid) : "—"}
                </div>
              </div>
              <div>
                <div className="text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  Highest bidder
                </div>
                <div className="mt-1 truncate font-display text-3xl">
                  {bidder ? bidder.name : player ? "No bids yet" : "—"}
                </div>
              </div>
              <div>
                <div className="text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  Next bid / increment
                </div>
                <div className="mt-1 font-display text-3xl">
                  {player ? `${formatLakhs(nextAmount)}` : "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {player ? `step ${formatLakhs(increment)}` : ""}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                size="lg"
                className="border-0 bg-success text-success-foreground hover:bg-success/90"
                disabled={!player || !bidder}
                onClick={() => {
                  sell();
                  toast.success("Sold!");
                }}
              >
                <Gavel className="mr-2 size-4" /> SELL
              </Button>
              <Button size="lg" variant="destructive" disabled={!player} onClick={() => markUnsold()}>
                <Ban className="mr-2 size-4" /> UNSOLD
              </Button>
              <Button size="lg" variant="outline" onClick={handleNext} disabled={pool.length === 0}>
                <SkipForward className="mr-2 size-4" /> Next player
              </Button>
              <Button size="lg" variant="ghost" onClick={() => undo()} disabled={!canUndo}>
                <Undo2 className="mr-2 size-4" /> Undo last action
              </Button>
            </div>
            {player && !bidder && (
              <p className="mt-3 text-sm text-muted-foreground">
                SELL is disabled until a team bids. First bid comes in at the base price.
              </p>
            )}
          </div>

          {/* team bid buttons */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {teams.map((team) => {
              const left = remainingPurse(team);
              const isBidder = team.id === live.currentBidderId;
              const cannotAfford = left < nextAmount;
              const disabled = !player || isBidder || cannotAfford;
              const reason = !player
                ? "No player on the block"
                : isBidder
                  ? "Already the highest bidder"
                  : cannotAfford
                    ? `Purse left ${formatLakhs(left)} — cannot cover ${formatLakhs(nextAmount)}`
                    : `Bid ${formatLakhs(nextAmount)}`;
              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => {
                    if (disabled) return;
                    placeBid(team.id);
                  }}
                  disabled={disabled}
                  title={reason}
                  aria-label={`${team.name}: ${reason}`}
                  className={`glass min-w-0 rounded-2xl p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isBidder ? "animate-pulse-glow ring-2 ring-ring" : ""
                  } ${disabled ? "cursor-not-allowed opacity-55" : "hover:-translate-y-0.5 hover:glow"}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {team.logo ? (
                      <img src={team.logo} alt="" className="size-10 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 font-display">
                        {team.shortName || initials(team.name)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{team.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {team.playerIds.length} players bought
                      </span>
                    </span>
                    {isBidder && <Badge className="gradient-electric shrink-0 border-0 text-primary-foreground">Bidding</Badge>}
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-2">
                    <span className="font-display text-2xl text-gold">{formatLakhs(left)}</span>
                    <span className="text-xs text-muted-foreground">{reason}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* right rail */}
        <aside className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <h2 className="font-display text-2xl">Bidding ladder</h2>
            {live.bids.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No bids on this player yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {[...live.bids].reverse().map((b, i) => (
                  <li key={`${b.at}-${i}`} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">
                      {teams.find((t) => t.id === b.teamId)?.name ?? "Unknown team"}
                    </span>
                    <span className="shrink-0 font-semibold text-gold">{formatLakhs(b.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="glass rounded-2xl p-5">
            <h2 className="font-display text-2xl">Auction history</h2>
            <ScrollArea className="mt-3 h-96 pr-3">
              {log.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing has gone under the hammer yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {log.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2/50 px-3 py-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{entry.playerName}</span>
                        <span className="text-xs text-muted-foreground">
                          {entry.type === "SOLD" ? entry.teamName : "Unsold"}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold text-gold">
                        {entry.type === "SOLD" ? formatLakhs(entry.amount ?? 0) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/60 px-4 py-2">
      <div className="text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </div>
      <div className="font-display text-2xl">{value}</div>
    </div>
  );
}
