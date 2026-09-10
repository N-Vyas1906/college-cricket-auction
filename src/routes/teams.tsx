import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatLakhs, initials } from "@/lib/auction/format";
import { remainingPurse, useAuction } from "@/lib/auction/store";
import type { Team } from "@/lib/auction/types";

export const Route = createFileRoute("/teams")({
  head: () => ({
    meta: [
      { title: "Team Setup — College IPL Auction" },
      {
        name: "description",
        content: "Create franchises with names, logos and purse amounts, and review each squad as it fills up.",
      },
      { property: "og:title", content: "Team Setup — College IPL Auction" },
      { property: "og:description", content: "Manage franchises, purses and squads for the auction." },
    ],
  }),
  component: TeamsPage,
});

type Draft = { name: string; shortName: string; logo: string; purse: number };

function TeamsPage() {
  const { state, addTeam, updateTeam, deleteTeam } = useAuction();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ name: "", shortName: "", logo: "", purse: state.settings.defaultPurse });
  const logoInput = useRef<HTMLInputElement>(null);

  const openNew = () => {
    setDraft({ name: "", shortName: "", logo: "", purse: state.settings.defaultPurse });
    setEditingId(null);
    setOpen(true);
  };

  const openEdit = (team: Team) => {
    setDraft({ name: team.name, shortName: team.shortName, logo: team.logo ?? "", purse: team.purse });
    setEditingId(team.id);
    setOpen(true);
  };

  const save = () => {
    if (!draft.name.trim()) {
      toast.error("Team name is required");
      return;
    }
    const payload: Omit<Team, "id" | "spent" | "playerIds"> = {
      name: draft.name.trim(),
      shortName: (draft.shortName.trim() || initials(draft.name)).toUpperCase().slice(0, 4),
      purse: draft.purse,
    };
    if (draft.logo.trim()) payload.logo = draft.logo.trim();
    if (editingId) {
      updateTeam(editingId, payload);
      toast.success(`${payload.name} updated`);
    } else {
      addTeam(payload);
      toast.success(`${payload.name} added`);
    }
    setOpen(false);
  };

  const readLogo = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, logo: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  return (
    <AppShell
      title="Team Setup"
      subtitle={`${state.teams.length} franchises · purses shown are remaining`}
      actions={
        <Button className="gradient-electric glow border-0 text-primary-foreground" onClick={openNew}>
          <Plus className="mr-2 size-4" /> Add team
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {state.teams.map((team) => {
          const squad = team.playerIds
            .map((id) => state.players.find((p) => p.id === id))
            .filter((p): p is NonNullable<typeof p> => Boolean(p));
          return (
            <section key={team.id} className="glass rounded-2xl p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {team.logo ? (
                    <img src={team.logo} alt="" className="size-12 shrink-0 rounded-xl border border-border object-cover" />
                  ) : (
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 font-display text-lg">
                      {team.shortName || initials(team.name)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-2xl">{team.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {team.demo && <Badge variant="outline" className="mr-1 py-0">DEMO</Badge>}
                      Purse {formatLakhs(team.purse)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(team)} aria-label={`Edit ${team.name}`}>
                    <Pencil className="size-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Remove ${team.name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {team.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Their {squad.length} bought player(s) go back into the auction pool.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { deleteTeam(team.id); toast.success(`${team.name} removed`); }}>
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-surface-2/60 p-3">
                  <div className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Purse left
                  </div>
                  <div className="font-display text-2xl text-gold">{formatLakhs(remainingPurse(team))}</div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2/60 p-3">
                  <div className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Players
                  </div>
                  <div className="font-display text-2xl">{squad.length}</div>
                </div>
              </div>

              <ul className="mt-3 space-y-1 text-sm">
                {squad.length === 0 && <li className="text-muted-foreground">No players bought yet.</li>}
                {squad.map((p) => (
                  <li key={p.id} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">{p.name}</span>
                    <span className="shrink-0 text-muted-foreground">{formatLakhs(p.soldPrice ?? 0)}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit team" : "Add team"}</DialogTitle>
            <DialogDescription>Upload a logo or paste an image URL. A monogram is used otherwise.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="t-name">Team name</Label>
              <Input id="t-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="t-short">Short code</Label>
                <Input
                  id="t-short"
                  maxLength={4}
                  placeholder="CT"
                  value={draft.shortName}
                  onChange={(e) => setDraft({ ...draft, shortName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="t-purse">Purse (₹ lakhs)</Label>
                <Input
                  id="t-purse"
                  type="number"
                  min={0}
                  step={10}
                  value={draft.purse}
                  onChange={(e) => setDraft({ ...draft, purse: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="t-logo">Logo URL</Label>
              <div className="flex gap-2">
                <Input
                  id="t-logo"
                  placeholder="https://… or upload"
                  value={draft.logo}
                  onChange={(e) => setDraft({ ...draft, logo: e.target.value })}
                />
                <input
                  ref={logoInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) readLogo(f);
                    e.target.value = "";
                  }}
                />
                <Button variant="outline" onClick={() => logoInput.current?.click()}>
                  <ImagePlus className="size-4" />
                  <span className="sr-only">Upload logo</span>
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="gradient-electric border-0 text-primary-foreground" onClick={save}>
              {editingId ? "Save changes" : "Add team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
