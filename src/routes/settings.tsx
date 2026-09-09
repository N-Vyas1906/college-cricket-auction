import { createFileRoute, Link } from "@tanstack/react-router";
import { Gavel, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { formatLakhs } from "@/lib/auction/format";
import { useAuction } from "@/lib/auction/store";
import type { IncrementTier } from "@/lib/auction/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Auction Settings — College IPL Auction" },
      {
        name: "description",
        content: "Configure purse per team, bid increment tiers, randomisation and projection mode.",
      },
      { property: "og:title", content: "Auction Settings — College IPL Auction" },
      { property: "og:description", content: "Purse, bid increments and auction behaviour controls." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { state, updateSettings, applyPurseToAll, resetAuction, resetAll } = useAuction();
  const { settings } = state;

  const setTier = (index: number, patch: Partial<IncrementTier>) => {
    const increments = settings.increments.map((t, i) => (i === index ? { ...t, ...patch } : t));
    updateSettings({ increments });
  };

  return (
    <AppShell
      title="Auction Settings"
      subtitle="Money is entered in ₹ lakhs. 100 lakhs = ₹1 Cr."
      actions={
        <Button asChild className="gradient-electric glow border-0 text-primary-foreground">
          <Link to="/auction">
            <Gavel className="mr-2 size-4" /> Start Auction
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass rounded-2xl p-6">
          <h2 className="font-display text-2xl">Purse</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Default purse for new teams. Applying overwrites every existing team&apos;s purse.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-40">
              <Label htmlFor="purse">Purse per team (₹ lakhs)</Label>
              <Input
                id="purse"
                type="number"
                min={0}
                step={10}
                value={settings.defaultPurse}
                onChange={(e) => updateSettings({ defaultPurse: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="pb-2 font-display text-2xl text-gold">{formatLakhs(settings.defaultPurse)}</div>
            <Button variant="secondary" onClick={() => { applyPurseToAll(settings.defaultPurse); toast.success("Purse applied to all teams"); }}>
              Apply to all teams
            </Button>
          </div>
        </section>

        <section className="glass rounded-2xl p-6">
          <h2 className="font-display text-2xl">Auction behaviour</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-2/50 p-4">
              <div className="min-w-0">
                <Label htmlFor="randomize" className="text-base">Randomise player order</Label>
                <p className="text-sm text-muted-foreground">
                  Off = players come up in list order within the selected set.
                </p>
              </div>
              <Switch
                id="randomize"
                checked={settings.randomize}
                onCheckedChange={(v) => updateSettings({ randomize: v })}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-2/50 p-4">
              <div className="min-w-0">
                <Label htmlFor="projection" className="text-base">Projection mode ready</Label>
                <p className="text-sm text-muted-foreground">
                  Shows a projection shortcut in the auction header for the second screen.
                </p>
              </div>
              <Switch
                id="projection"
                checked={settings.projectionMode}
                onCheckedChange={(v) => updateSettings({ projectionMode: v })}
              />
            </div>
          </div>
        </section>

        <section className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-2xl">Bid increment tiers</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The first tier whose limit is above the current bid decides the next raise. Leave the last
                limit blank for &quot;and above&quot;.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                updateSettings({ increments: [...settings.increments, { upTo: null, increment: 100 }] })
              }
            >
              <Plus className="mr-2 size-4" /> Add tier
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {settings.increments.map((tier, i) => (
              <div key={i} className="grid gap-3 rounded-xl border border-border bg-surface-2/50 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div>
                  <Label htmlFor={`upto-${i}`}>Applies below (₹ lakhs)</Label>
                  <Input
                    id={`upto-${i}`}
                    type="number"
                    min={0}
                    placeholder="and above"
                    value={tier.upTo ?? ""}
                    onChange={(e) =>
                      setTier(i, { upTo: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor={`inc-${i}`}>Increment (₹ lakhs)</Label>
                  <Input
                    id={`inc-${i}`}
                    type="number"
                    min={1}
                    value={tier.increment}
                    onChange={(e) => setTier(i, { increment: Number(e.target.value) || 1 })}
                  />
                </div>
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={settings.increments.length === 1}
                  onClick={() =>
                    updateSettings({ increments: settings.increments.filter((_, idx) => idx !== i) })
                  }
                  aria-label={`Remove tier ${i + 1}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Current rules:{" "}
            {settings.increments
              .map((t) =>
                t.upTo === null
                  ? `above, +${formatLakhs(t.increment)}`
                  : `below ${formatLakhs(t.upTo)}, +${formatLakhs(t.increment)}`,
              )
              .join(" · ")}
          </p>
        </section>

        <section className="glass rounded-2xl border-destructive/40 p-6 lg:col-span-2">
          <h2 className="font-display text-2xl">Danger zone</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Resetting cannot be undone. Auction reset keeps players and teams but clears all sales.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ConfirmButton
              label="Reset auction results"
              description="All players become available again, purses are restored and the auction log is cleared."
              onConfirm={() => { resetAuction(); toast.success("Auction reset"); }}
            />
            <ConfirmButton
              destructive
              label="Reset everything to demo data"
              description="Players, teams, settings and history are replaced with the original demo data."
              onConfirm={() => { resetAll(); toast.success("Restored demo data"); }}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ConfirmButton({
  label,
  description,
  onConfirm,
  destructive,
}: {
  label: string;
  description: string;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={destructive ? "destructive" : "outline"}>
          <RotateCcw className="mr-2 size-4" /> {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label}?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
