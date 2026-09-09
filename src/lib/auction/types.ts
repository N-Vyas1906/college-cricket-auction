export type Role = "Batsman" | "All Rounder" | "Bowler";
export type BattingSide = "Right" | "Left";
export type BowlingType = "Pace" | "Spin" | "None";

export const AUCTION_SETS = [
  "Capped Indian Batsmen",
  "Overseas Batsmen",
  "Capped Indian All Rounder",
  "Overseas All Rounder",
  "Capped Indian Pace Bowler",
  "Overseas Pace Bowler",
  "Capped Indian Spin Bowler",
  "Overseas Spin Bowler",
  "Uncapped Indian Batsmen",
  "Uncapped Indian All Rounder",
  "Uncapped Indian Pace Bowler",
  "Uncapped Indian Spin Bowler",
] as const;

export type AuctionSet = (typeof AUCTION_SETS)[number];

export type PlayerStatus = "available" | "sold" | "unsold";

export interface Player {
  id: string;
  name: string;
  photo?: string;
  age: number;
  role: Role;
  battingSide: BattingSide;
  bowlingType: BowlingType;
  nationality: string;
  /** in ₹ lakhs */
  basePrice: number;
  capped: boolean;
  set: AuctionSet;
  status: PlayerStatus;
  soldToTeamId?: string;
  /** in ₹ lakhs */
  soldPrice?: number;
  demo?: boolean;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  /** total purse in ₹ lakhs */
  purse: number;
  /** spent in ₹ lakhs */
  spent: number;
  playerIds: string[];
  demo?: boolean;
}

export interface IncrementTier {
  /** applies while current bid is below this value (₹ lakhs); null = open ended */
  upTo: number | null;
  /** increment in ₹ lakhs */
  increment: number;
}

export interface Settings {
  /** default purse per team in ₹ lakhs */
  defaultPurse: number;
  increments: IncrementTier[];
  randomize: boolean;
  projectionMode: boolean;
}

export interface BidEntry {
  teamId: string;
  amount: number;
  at: number;
}

export interface LogEntry {
  id: string;
  type: "SOLD" | "UNSOLD";
  playerId: string;
  playerName: string;
  teamId?: string;
  teamName?: string;
  amount?: number;
  at: number;
}

export interface Live {
  currentSet: AuctionSet | null;
  currentPlayerId: string | null;
  currentBid: number;
  currentBidderId: string | null;
  bids: BidEntry[];
  lastResult: { type: "SOLD" | "UNSOLD"; playerName: string; teamName?: string; amount?: number } | null;
}

export interface AuctionState {
  players: Player[];
  teams: Team[];
  settings: Settings;
  live: Live;
  log: LogEntry[];
}
