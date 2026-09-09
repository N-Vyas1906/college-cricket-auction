import type { AuctionState, Player, Team } from "./types";
import { deriveSet } from "./sets";

const uid = () => Math.random().toString(36).slice(2, 10);

type SeedPlayer = Omit<Player, "id" | "status" | "set" | "demo"> & { set?: Player["set"] };

const seedPlayers: SeedPlayer[] = [
  { name: "Aarav Menon", age: 22, role: "Batsman", battingSide: "Right", bowlingType: "None", nationality: "India", basePrice: 40, capped: true },
  { name: "Rehan Kapoor", age: 24, role: "Batsman", battingSide: "Left", bowlingType: "None", nationality: "India", basePrice: 30, capped: true },
  { name: "Liam Prescott", age: 27, role: "Batsman", battingSide: "Right", bowlingType: "None", nationality: "Australia", basePrice: 50, capped: true },
  { name: "Dewan Marais", age: 29, role: "Batsman", battingSide: "Left", bowlingType: "None", nationality: "South Africa", basePrice: 60, capped: true },
  { name: "Vikram Shetty", age: 25, role: "All Rounder", battingSide: "Right", bowlingType: "Pace", nationality: "India", basePrice: 75, capped: true },
  { name: "Joseph Blake", age: 31, role: "All Rounder", battingSide: "Right", bowlingType: "Spin", nationality: "England", basePrice: 100, capped: true },
  { name: "Harshit Rana Jr", age: 21, role: "Bowler", battingSide: "Right", bowlingType: "Pace", nationality: "India", basePrice: 30, capped: true },
  { name: "Tejas Iyer", age: 23, role: "Bowler", battingSide: "Left", bowlingType: "Spin", nationality: "India", basePrice: 25, capped: true },
  { name: "Kane Whitmore", age: 28, role: "Bowler", battingSide: "Right", bowlingType: "Pace", nationality: "New Zealand", basePrice: 80, capped: true },
  { name: "Rashid Noor", age: 26, role: "Bowler", battingSide: "Right", bowlingType: "Spin", nationality: "Afghanistan", basePrice: 90, capped: true },
  { name: "Nikhil Bose", age: 19, role: "Batsman", battingSide: "Right", bowlingType: "None", nationality: "India", basePrice: 20, capped: false },
  { name: "Sameer Chauhan", age: 20, role: "All Rounder", battingSide: "Left", bowlingType: "Pace", nationality: "India", basePrice: 20, capped: false },
  { name: "Advait Kulkarni", age: 20, role: "Bowler", battingSide: "Right", bowlingType: "Pace", nationality: "India", basePrice: 20, capped: false },
  { name: "Manav Deshpande", age: 21, role: "Bowler", battingSide: "Right", bowlingType: "Spin", nationality: "India", basePrice: 20, capped: false },
];

const seedTeams: Array<Pick<Team, "name" | "shortName">> = [
  { name: "Campus Titans", shortName: "CT" },
  { name: "Hostel Hurricanes", shortName: "HH" },
  { name: "Quad Chargers", shortName: "QC" },
  { name: "Library Lions", shortName: "LL" },
  { name: "Canteen Kings", shortName: "CK" },
  { name: "Alumni Avengers", shortName: "AA" },
];

export const DEFAULT_PURSE = 1000; // ₹10 Cr in lakhs

export function createSeedState(): AuctionState {
  const players: Player[] = seedPlayers.map((p) => ({
    ...p,
    id: uid(),
    status: "available",
    demo: true,
    set: p.set ?? deriveSet(p),
  }));

  const teams: Team[] = seedTeams.map((t) => ({
    ...t,
    id: uid(),
    purse: DEFAULT_PURSE,
    spent: 0,
    playerIds: [],
    demo: true,
  }));

  return {
    players,
    teams,
    settings: {
      defaultPurse: DEFAULT_PURSE,
      increments: [
        { upTo: 100, increment: 20 },
        { upTo: 200, increment: 25 },
        { upTo: 500, increment: 50 },
        { upTo: null, increment: 100 },
      ],
      randomize: true,
      projectionMode: false,
    },
    live: {
      currentSet: null,
      currentPlayerId: null,
      currentBid: 0,
      currentBidderId: null,
      bids: [],
      lastResult: null,
    },
    log: [],
  };
}
