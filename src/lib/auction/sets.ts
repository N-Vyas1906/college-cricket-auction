import type { AuctionSet, BowlingType, Player, Role } from "./types";

/**
 * Derives the single correct auction set for a player so a player can never
 * belong to two sets. Operators may still override manually in the UI.
 */
export function deriveSet(input: {
  role: Role;
  bowlingType: BowlingType;
  nationality: string;
  capped: boolean;
}): AuctionSet {
  const indian = input.nationality.trim().toLowerCase() === "india" || input.nationality.trim().toLowerCase() === "indian";
  const spin = input.bowlingType === "Spin";

  if (!indian) {
    if (input.role === "Batsman") return "Overseas Batsmen";
    if (input.role === "All Rounder") return "Overseas All Rounder";
    return spin ? "Overseas Spin Bowler" : "Overseas Pace Bowler";
  }

  if (input.capped) {
    if (input.role === "Batsman") return "Capped Indian Batsmen";
    if (input.role === "All Rounder") return "Capped Indian All Rounder";
    return spin ? "Capped Indian Spin Bowler" : "Capped Indian Pace Bowler";
  }

  if (input.role === "Batsman") return "Uncapped Indian Batsmen";
  if (input.role === "All Rounder") return "Uncapped Indian All Rounder";
  return spin ? "Uncapped Indian Spin Bowler" : "Uncapped Indian Pace Bowler";
}

export function playersInSet(players: Player[], set: AuctionSet) {
  return players.filter((p) => p.set === set);
}
