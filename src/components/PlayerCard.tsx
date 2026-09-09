import { Badge } from "@/components/ui/badge";
import { formatLakhs, initials } from "@/lib/auction/format";
import type { Player } from "@/lib/auction/types";

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-surface-2/60 px-3 py-2">
      <div className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

export function PlayerCard({
  player,
  size = "md",
}: {
  player: Player;
  size?: "md" | "xl";
}) {
  const big = size === "xl";
  return (
    <article
      className={`glass stadium-grid relative overflow-hidden rounded-2xl ${big ? "p-6 sm:p-8" : "p-5"}`}
    >
      <div className="gradient-electric absolute inset-x-0 top-0 h-1" />
      <div className={`flex items-center gap-5 ${big ? "sm:gap-8" : ""}`}>
        <div
          className={`relative shrink-0 overflow-hidden rounded-2xl border border-border bg-surface-2 ${
            big ? "size-32 sm:size-52" : "size-20"
          }`}
        >
          {player.photo ? (
            <img
              src={player.photo}
              alt={player.name}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className={`grid size-full place-items-center font-display text-muted-foreground ${
                big ? "text-6xl" : "text-2xl"
              }`}
            >
              {initials(player.name)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gradient-electric border-0 text-primary-foreground">{player.role}</Badge>
            <Badge variant="outline">{player.capped ? "Capped" : "Uncapped"}</Badge>
            <Badge variant="secondary">{player.set}</Badge>
          </div>
          <h2
            className={`mt-2 truncate font-display leading-none ${
              big ? "text-5xl sm:text-7xl" : "text-3xl"
            }`}
          >
            {player.name}
          </h2>
          <p className={`mt-2 text-muted-foreground ${big ? "text-lg" : "text-sm"}`}>
            {player.nationality} · {player.age} yrs · {player.battingSide}-hand bat
            {player.bowlingType !== "None" ? ` · ${player.bowlingType} bowler` : ""}
          </p>

          <div
            className={`mt-4 grid gap-2 ${big ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-4"}`}
          >
            <Meta label="Base Price" value={formatLakhs(player.basePrice)} />
            <Meta label="Batting" value={`${player.battingSide} hand`} />
            <Meta label="Bowling" value={player.bowlingType === "None" ? "—" : player.bowlingType} />
            <Meta label="Nationality" value={player.nationality} />
          </div>
        </div>
      </div>
    </article>
  );
}
