/**
 * Auction state container.
 *
 * The persistence layer is isolated in `localAdapter` below so it can later be
 * swapped for a Supabase-backed adapter without touching any component.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { AuctionSet, AuctionState, Player, Team } from "./types";
import { createSeedState } from "./seed";
import { deriveSet } from "./sets";

const STORAGE_KEY = "college-ipl-auction:v1";
const uid = () => Math.random().toString(36).slice(2, 10);

const localAdapter = {
  read(): AuctionState | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuctionState) : null;
    } catch {
      return null;
    }
  },
  write(state: AuctionState) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked — auction keeps working in memory */
    }
  },
  key: STORAGE_KEY,
};

export interface StoreApi {
  state: AuctionState;
  hydrated: boolean;
  canUndo: boolean;
  // players
  addPlayer(input: Omit<Player, "id" | "status">): void;
  updatePlayer(id: string, patch: Partial<Player>): void;
  deletePlayer(id: string): void;
  replaceAll(next: Partial<AuctionState>): void;
  // teams
  addTeam(input: Omit<Team, "id" | "spent" | "playerIds">): void;
  updateTeam(id: string, patch: Partial<Team>): void;
  deleteTeam(id: string): void;
  // settings
  updateSettings(patch: Partial<AuctionState["settings"]>): void;
  applyPurseToAll(purse: number): void;
  // auction
  selectSet(set: AuctionSet | null): void;
  nextPlayer(): boolean;
  placeBid(teamId: string): void;
  sell(): void;
  markUnsold(): void;
  undo(): void;
  resetAuction(): void;
  resetAll(): void;
  clearLastResult(): void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function nextBidAmount(state: AuctionState): number {
  const { live, settings } = state;
  const player = state.players.find((p) => p.id === live.currentPlayerId);
  if (!player) return 0;
  if (!live.currentBidderId) return live.currentBid || player.basePrice;
  const current = live.currentBid;
  const tier =
    settings.increments.find((t) => t.upTo === null || current < t.upTo) ??
    settings.increments[settings.increments.length - 1];
  return current + (tier?.increment ?? 20);
}

export function currentIncrement(state: AuctionState): number {
  const current = state.live.currentBid;
  const tier =
    state.settings.increments.find((t) => t.upTo === null || current < t.upTo) ??
    state.settings.increments[state.settings.increments.length - 1];
  return tier?.increment ?? 20;
}

export function remainingPurse(team: Team): number {
  return team.purse - team.spent;
}

export function AuctionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuctionState>(() => createSeedState());
  const [hydrated, setHydrated] = useState(false);
  const past = useRef<AuctionState[]>([]);
  const [undoDepth, setUndoDepth] = useState(0);
  const skipWrite = useRef(false);

  // hydrate from storage after mount (SSR safe)
  useEffect(() => {
    const stored = localAdapter.read();
    if (stored) {
      skipWrite.current = true;
      setState(stored);
    }
    setHydrated(true);
  }, []);

  // persist
  useEffect(() => {
    if (!hydrated) return;
    if (skipWrite.current) {
      skipWrite.current = false;
      return;
    }
    localAdapter.write(state);
  }, [state, hydrated]);

  // cross-tab sync (operator tab -> projection tab)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== localAdapter.key || !e.newValue) return;
      try {
        skipWrite.current = true;
        setState(JSON.parse(e.newValue) as AuctionState);
      } catch {
        /* ignore malformed payloads */
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((updater: (prev: AuctionState) => AuctionState, undoable = false) => {
    setState((prev) => {
      if (undoable) {
        past.current = [...past.current.slice(-19), prev];
        setUndoDepth(past.current.length);
      }
      return updater(prev);
    });
  }, []);

  const api = useMemo<StoreApi>(() => {
    return {
      state,
      hydrated,
      canUndo: undoDepth > 0,

      addPlayer(input) {
        commit((prev) => ({
          ...prev,
          players: [...prev.players, { ...input, id: uid(), status: "available" }],
        }));
      },
      updatePlayer(id, patch) {
        commit((prev) => ({
          ...prev,
          players: prev.players.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }));
      },
      deletePlayer(id) {
        commit((prev) => ({
          ...prev,
          players: prev.players.filter((p) => p.id !== id),
          teams: prev.teams.map((t) => ({ ...t, playerIds: t.playerIds.filter((pid) => pid !== id) })),
          live:
            prev.live.currentPlayerId === id
              ? { ...prev.live, currentPlayerId: null, currentBid: 0, currentBidderId: null, bids: [] }
              : prev.live,
        }));
      },
      replaceAll(next) {
        commit((prev) => ({ ...prev, ...next }));
      },

      addTeam(input) {
        commit((prev) => ({
          ...prev,
          teams: [...prev.teams, { ...input, id: uid(), spent: 0, playerIds: [] }],
        }));
      },
      updateTeam(id, patch) {
        commit((prev) => ({
          ...prev,
          teams: prev.teams.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }));
      },
      deleteTeam(id) {
        commit((prev) => ({
          ...prev,
          teams: prev.teams.filter((t) => t.id !== id),
          players: prev.players.map((p) =>
            p.soldToTeamId === id
              ? { ...p, status: "available", soldToTeamId: undefined, soldPrice: undefined }
              : p,
          ),
          live: prev.live.currentBidderId === id ? { ...prev.live, currentBidderId: null } : prev.live,
        }));
      },

      updateSettings(patch) {
        commit((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
      },
      applyPurseToAll(purse) {
        commit((prev) => ({
          ...prev,
          settings: { ...prev.settings, defaultPurse: purse },
          teams: prev.teams.map((t) => ({ ...t, purse })),
        }));
      },

      selectSet(set) {
        commit((prev) => ({
          ...prev,
          live: { ...prev.live, currentSet: set, currentPlayerId: null, currentBid: 0, currentBidderId: null, bids: [] },
        }));
      },
      nextPlayer() {
        let picked = false;
        commit((prev) => {
          const pool = prev.players.filter(
            (p) => p.status === "available" && (!prev.live.currentSet || p.set === prev.live.currentSet),
          );
          if (pool.length === 0) return prev;
          const player = prev.settings.randomize ? pool[Math.floor(Math.random() * pool.length)] : pool[0];
          picked = true;
          return {
            ...prev,
            live: {
              ...prev.live,
              currentPlayerId: player.id,
              currentBid: player.basePrice,
              currentBidderId: null,
              bids: [],
              lastResult: null,
            },
          };
        });
        return picked;
      },
      placeBid(teamId) {
        commit(
          (prev) => {
            const player = prev.players.find((p) => p.id === prev.live.currentPlayerId);
            const team = prev.teams.find((t) => t.id === teamId);
            if (!player || !team) return prev;
            if (prev.live.currentBidderId === teamId) return prev;
            const amount = nextBidAmount(prev);
            if (remainingPurse(team) < amount) return prev;
            return {
              ...prev,
              live: {
                ...prev.live,
                currentBid: amount,
                currentBidderId: teamId,
                bids: [...prev.live.bids, { teamId, amount, at: Date.now() }],
              },
            };
          },
          true,
        );
      },
      sell() {
        commit(
          (prev) => {
            const player = prev.players.find((p) => p.id === prev.live.currentPlayerId);
            const team = prev.teams.find((t) => t.id === prev.live.currentBidderId);
            if (!player || !team) return prev;
            const amount = prev.live.currentBid;
            return {
              ...prev,
              players: prev.players.map((p) =>
                p.id === player.id
                  ? { ...p, status: "sold", soldToTeamId: team.id, soldPrice: amount }
                  : p,
              ),
              teams: prev.teams.map((t) =>
                t.id === team.id ? { ...t, spent: t.spent + amount, playerIds: [...t.playerIds, player.id] } : t,
              ),
              log: [
                {
                  id: uid(),
                  type: "SOLD" as const,
                  playerId: player.id,
                  playerName: player.name,
                  teamId: team.id,
                  teamName: team.name,
                  amount,
                  at: Date.now(),
                },
                ...prev.log,
              ],
              live: {
                ...prev.live,
                currentPlayerId: null,
                currentBid: 0,
                currentBidderId: null,
                bids: [],
                lastResult: { type: "SOLD", playerName: player.name, teamName: team.name, amount },
              },
            };
          },
          true,
        );
      },
      markUnsold() {
        commit(
          (prev) => {
            const player = prev.players.find((p) => p.id === prev.live.currentPlayerId);
            if (!player) return prev;
            return {
              ...prev,
              players: prev.players.map((p) => (p.id === player.id ? { ...p, status: "unsold" } : p)),
              log: [
                {
                  id: uid(),
                  type: "UNSOLD" as const,
                  playerId: player.id,
                  playerName: player.name,
                  at: Date.now(),
                },
                ...prev.log,
              ],
              live: {
                ...prev.live,
                currentPlayerId: null,
                currentBid: 0,
                currentBidderId: null,
                bids: [],
                lastResult: { type: "UNSOLD", playerName: player.name },
              },
            };
          },
          true,
        );
      },
      undo() {
        const prevState = past.current[past.current.length - 1];
        if (!prevState) return;
        past.current = past.current.slice(0, -1);
        setUndoDepth(past.current.length);
        setState(prevState);
      },
      resetAuction() {
        commit((prev) => ({
          ...prev,
          players: prev.players.map((p) => ({
            ...p,
            status: "available" as const,
            soldToTeamId: undefined,
            soldPrice: undefined,
          })),
          teams: prev.teams.map((t) => ({ ...t, spent: 0, playerIds: [] })),
          log: [],
          live: {
            currentSet: null,
            currentPlayerId: null,
            currentBid: 0,
            currentBidderId: null,
            bids: [],
            lastResult: null,
          },
        }));
        past.current = [];
        setUndoDepth(0);
      },
      resetAll() {
        past.current = [];
        setUndoDepth(0);
        setState(createSeedState());
      },
      clearLastResult() {
        setState((prev) => ({ ...prev, live: { ...prev.live, lastResult: null } }));
      },
    };
  }, [state, hydrated, undoDepth, commit]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useAuction(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useAuction must be used inside <AuctionProvider>");
  return ctx;
}

export { deriveSet };
