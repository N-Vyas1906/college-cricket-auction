import { formatLakhs, initials } from "@/lib/auction/format";
import { remainingPurse } from "@/lib/auction/store";
import type { Team } from "@/lib/auction/types";

export function TeamStrip({
  teams,
  highlightTeamId,
  big = false,
}: {
  teams: Team[];
  highlightTeamId?: string | null;
  big?: boolean;
}) {
  return (
    <div className={`grid gap-3 ${big ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" : "grid-cols-2 lg:grid-cols-3"}`}>
      {teams.map((team) => {
        const active = team.id === highlightTeamId;
        return (
          <div
            key={team.id}
            className={`glass min-w-0 rounded-xl px-3 py-3 transition-all ${
              active ? "glow ring-2 ring-ring" : ""
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              {team.logo ? (
                <img
                  src={team.logo}
                  alt=""
                  className="size-9 shrink-0 rounded-lg border border-border object-cover"
                />
              ) : (
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 font-display text-sm">
                  {team.shortName || initials(team.name)}
                </span>
              )}
              <span
                className={`truncate font-semibold ${big ? "text-lg" : "text-sm"}`}
                title={team.name}
              >
                {team.name}
              </span>
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <span className={`font-display text-gold ${big ? "text-2xl" : "text-lg"}`}>
                {formatLakhs(remainingPurse(team))}
              </span>
              <span className="text-xs text-muted-foreground">{team.playerIds.length} players</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
