import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

export default function DangerZoneSection() {
  const exportData = useAuthStore((s) => s.exportData);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleExport() {
    setExporting(true);
    const data = await exportData();
    setExporting(false);
    if (!data) return;

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flowmind-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    setDeleting(true);
    const success = await deleteAccount();
    setDeleting(false);
    if (success) navigate("/login");
  }

  return (
    <div className="rounded-2xl border border-accent-danger/20 bg-accent-danger-bg p-6">
      <h2 className="text-sm font-semibold">Zone sensible</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Exporter, supprimer ou réinitialiser tes données
      </p>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
          className="bg-white cursor-pointer"
        >
          {exporting ? "Export..." : "Exporter mes données"}
        </Button>
        <Button
          onClick={() => setConfirmOpen(true)}
          className="bg-accent-danger text-white hover:bg-accent-danger/90 cursor-pointer"
        >
          Supprimer mon compte
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-cream p-6">
          <DialogHeader className="gap-2">
            <DialogTitle className="font-display text-xl italic">
              Supprimer ton compte ?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Cette action est définitive : toutes tes données FlowMind
              (habitudes, plannings, ressources, sparks) seront supprimées et
              ne pourront pas être récupérées.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-accent-danger text-white hover:bg-accent-danger/90 cursor-pointer"
            >
              {deleting ? "Suppression..." : "Supprimer définitivement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
