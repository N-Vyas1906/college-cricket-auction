import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Download, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatLakhs, initials } from "@/lib/auction/format";
import { deriveSet } from "@/lib/auction/sets";
import { useAuction } from "@/lib/auction/store";
import {
  AUCTION_SETS,
  type AuctionSet,
  type BattingSide,
  type BowlingType,
  type Player,
  type Role,
} from "@/lib/auction/types";

export const Route = createFileRoute("/players")({
  head: () => ({
    meta: [
      { title: "Player Database — College IPL Auction" },
      {
        name: "description",
        content:
          "Manage the auction player pool: roles, batting side, bowling type, base price, capped status and mutually exclusive auction sets.",
      },
      { property: "og:title", content: "Player Database — College IPL Auction" },
      { property: "og:description", content: "Add, edit, filter and export the auction player pool." },
    ],
  }),
  component: PlayersPage,
});

type Draft = Omit<Player, "id" | "status"> & { autoSet: boolean };

const emptyDraft: Draft = {
  name: "",
  photo: "",
  age: 21,
  role: "Batsman",
  battingSide: "Right",
  bowlingType: "None",
  nationality: "India",
  basePrice: 20,
  capped: false,
  set: "Uncapped Indian Batsmen",
  autoSet: true,
};

function isIndian(nationality: string) {
  const n = nationality.trim().toLowerCase();
  return n === "india" || n === "indian";
}

function PlayersPage() {
  const { state, addPlayer, updatePlayer, deletePlayer, replaceAll } = useAuction();
  const [query, setQuery] = useState("");
  const [setFilter, setSetFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.players.filter((p) => {
      if (q && !`${p.name} ${p.nationality} ${p.set}`.toLowerCase().includes(q)) return false;
      if (setFilter !== "all" && p.set !== setFilter) return false;
      if (roleFilter !== "all" && p.role !== roleFilter) return false;
      return true;
    });
  }, [state.players, query, setFilter, roleFilter]);

  const openNew = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setOpen(true);
  };

  const openEdit = (player: Player) => {
    setDraft({ ...player, photo: player.photo ?? "", autoSet: false });
    setEditingId(player.id);
    setOpen(true);
  };

  const effectiveDraft = (d: Draft): Draft => {
    const indian = isIndian(d.nationality);
    const capped = indian ? d.capped : true; // capped/uncapped only meaningful for Indians
    const bowlingType: BowlingType = d.role === "Batsman" ? "None" : d.bowlingType === "None" ? "Pace" : d.bowlingType;
    const next = { ...d, capped, bowlingType };
    return { ...next, set: d.autoSet ? deriveSet(next) : d.set };
  };

  const save = () => {
    const d = effectiveDraft(draft);
    if (!d.name.trim()) {
      toast.error("Player name is required");
      return;
    }
    const { autoSet: _autoSet, ...payload } = d;
    const clean: Omit<Player, "id" | "status"> = { ...payload };
    if (!clean.photo?.trim()) delete clean.photo;
    if (editingId) {
      updatePlayer(editingId, clean);
      toast.success(`${clean.name} updated`);
    } else {
      addPlayer(clean);
      toast.success(`${clean.name} added`);
    }
    setOpen(false);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ players: state.players, teams: state.teams }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "college-ipl-auction-data.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported JSON");
  };

  const importJson = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.players)) throw new Error("Missing players array");
      const players: Player[] = data.players.map((p: Partial<Player>) => ({
        id: p.id ?? Math.random().toString(36).slice(2, 10),
        name: String(p.name ?? "Unnamed"),
        photo: p.photo,
        age: Number(p.age ?? 21),
        role: (p.role ?? "Batsman") as Role,
        battingSide: (p.battingSide ?? "Right") as BattingSide,
        bowlingType: (p.bowlingType ?? "None") as BowlingType,
        nationality: String(p.nationality ?? "India"),
        basePrice: Number(p.basePrice ?? 20),
        capped: Boolean(p.capped),
        set: (AUCTION_SETS.includes(p.set as AuctionSet)
          ? p.set
          : deriveSet({
              role: (p.role ?? "Batsman") as Role,
              bowlingType: (p.bowlingType ?? "None") as BowlingType,
              nationality: String(p.nationality ?? "India"),
              capped: Boolean(p.capped),
            })) as AuctionSet,
        status: p.status ?? "available",
        soldToTeamId: p.soldToTeamId,
        soldPrice: p.soldPrice,
      }));
      replaceAll({ players });
      toast.success(`Imported ${players.length} players`);
    } catch (err) {
      toast.error(`Import failed: ${(err as Error).message}`);
    }
  };

  const d = effectiveDraft(draft);
  const indian = isIndian(draft.nationality);

  return (
    <AppShell
      title="Player Database"
      subtitle={`${state.players.length} players · demo players are labelled DEMO`}
      actions={
        <>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importJson(file);
              e.target.value = "";
            }}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 size-4" /> Import JSON
          </Button>
          <Button variant="outline" onClick={exportJson}>
            <Download className="mr-2 size-4" /> Export JSON
          </Button>
          <Button className="gradient-electric glow border-0 text-primary-foreground" onClick={openNew}>
            <Plus className="mr-2 size-4" /> Add player
          </Button>
        </>
      }
    >
      <div className="glass mb-4 grid gap-3 rounded-2xl p-4 md:grid-cols-[1fr_auto_auto]">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name, nationality or set"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search players"
          />
        </div>
        <Select value={setFilter} onValueChange={setSetFilter}>
          <SelectTrigger className="min-w-56" aria-label="Filter by set">
            <SelectValue placeholder="All sets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sets</SelectItem>
            {AUCTION_SETS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="min-w-40" aria-label="Filter by role">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="Batsman">Batsman</SelectItem>
            <SelectItem value="All Rounder">All Rounder</SelectItem>
            <SelectItem value="Bowler">Bowler</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass overflow-x-auto rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Bat / Bowl</TableHead>
              <TableHead>Nationality</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>Set</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex min-w-0 items-center gap-3">
                    {p.photo ? (
                      <img src={p.photo} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-xs font-semibold">
                        {initials(p.name)}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{p.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.age} yrs {p.demo && <Badge variant="outline" className="ml-1 py-0">DEMO</Badge>}
                      </span>
                    </span>
                  </div>
                </TableCell>
                <TableCell>{p.role}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {p.battingSide}-hand{p.bowlingType !== "None" ? ` / ${p.bowlingType}` : ""}
                </TableCell>
                <TableCell>
                  {p.nationality}
                  <span className="ml-2 text-xs text-muted-foreground">{p.capped ? "Capped" : "Uncapped"}</span>
                </TableCell>
                <TableCell className="font-semibold text-gold">{formatLakhs(p.basePrice)}</TableCell>
                <TableCell className="text-xs">{p.set}</TableCell>
                <TableCell>
                  {p.status === "sold" ? (
                    <Badge className="border-0 bg-success text-success-foreground">
                      Sold {p.soldPrice ? formatLakhs(p.soldPrice) : ""}
                    </Badge>
                  ) : p.status === "unsold" ? (
                    <Badge variant="destructive">Unsold</Badge>
                  ) : (
                    <Badge variant="secondary">Available</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`}>
                      <Pencil className="size-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Delete ${p.name}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {p.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This removes the player from the auction pool and from any squad.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              deletePlayer(p.id);
                              toast.success(`${p.name} deleted`);
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No players match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit player" : "Add player"}</DialogTitle>
            <DialogDescription>
              The auction set is derived automatically so a player only ever appears in one set. You can
              override it manually.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="p-name">Name</Label>
              <Input id="p-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="p-photo">Photo URL (optional)</Label>
              <Input
                id="p-photo"
                placeholder="https://…"
                value={draft.photo ?? ""}
                onChange={(e) => setDraft({ ...draft, photo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="p-age">Age</Label>
              <Input
                id="p-age"
                type="number"
                min={14}
                max={60}
                value={draft.age}
                onChange={(e) => setDraft({ ...draft, age: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="p-base">Base price (₹ lakhs)</Label>
              <Input
                id="p-base"
                type="number"
                min={0}
                step={5}
                value={draft.basePrice}
                onChange={(e) => setDraft({ ...draft, basePrice: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={draft.role} onValueChange={(v) => setDraft({ ...draft, role: v as Role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Batsman">Batsman</SelectItem>
                  <SelectItem value="All Rounder">All Rounder</SelectItem>
                  <SelectItem value="Bowler">Bowler</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Batting side</Label>
              <Select
                value={draft.battingSide}
                onValueChange={(v) => setDraft({ ...draft, battingSide: v as BattingSide })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Right">Right</SelectItem>
                  <SelectItem value="Left">Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bowling type</Label>
              <Select
                value={d.bowlingType}
                disabled={draft.role === "Batsman"}
                onValueChange={(v) => setDraft({ ...draft, bowlingType: v as BowlingType })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pace">Pace</SelectItem>
                  <SelectItem value="Spin">Spin</SelectItem>
                  <SelectItem value="None">Not applicable</SelectItem>
                </SelectContent>
              </Select>
              {draft.role === "Batsman" && (
                <p className="mt-1 text-xs text-muted-foreground">Not applicable for batsmen.</p>
              )}
            </div>
            <div>
              <Label htmlFor="p-nat">Nationality</Label>
              <Input
                id="p-nat"
                value={draft.nationality}
                onChange={(e) => setDraft({ ...draft, nationality: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-2/50 p-3 sm:col-span-2">
              <div className="min-w-0">
                <Label htmlFor="p-capped" className="text-base">Capped</Label>
                <p className="text-xs text-muted-foreground">
                  {indian ? "Only relevant for Indian players." : "Overseas players are treated as capped."}
                </p>
              </div>
              <Switch
                id="p-capped"
                disabled={!indian}
                checked={d.capped}
                onCheckedChange={(v) => setDraft({ ...draft, capped: v })}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-2/50 p-3 sm:col-span-2">
              <div className="min-w-0">
                <Label htmlFor="p-auto" className="text-base">Auto-assign set</Label>
                <p className="text-xs text-muted-foreground">Derived: {deriveSet(d)}</p>
              </div>
              <Switch
                id="p-auto"
                checked={draft.autoSet}
                onCheckedChange={(v) => setDraft({ ...draft, autoSet: v })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Auction set</Label>
              <Select
                value={d.set}
                disabled={draft.autoSet}
                onValueChange={(v) => setDraft({ ...draft, set: v as AuctionSet })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUCTION_SETS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="gradient-electric border-0 text-primary-foreground" onClick={save}>
              {editingId ? "Save changes" : "Add player"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
