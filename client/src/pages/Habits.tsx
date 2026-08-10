import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import HabitCard from "@/components/habits/HabitCard";
import NewHabitModal from "@/components/habits/NewHabitModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useHabitStore } from "@/store/habitStore";
import { calculateStreak } from "@/lib/streak";

export default function Habits() {
  const habits = useHabitStore((s) => s.habits);
  const loading = useHabitStore((s) => s.loading);
  const error = useHabitStore((s) => s.error);
  const fetchHabits = useHabitStore((s) => s.fetchHabits);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const today = new Date().toISOString().split("T")[0];
  const checkedToday = habits.filter((h) =>
    h.completedDates.includes(today),
  ).length;
  const bestStreak = habits.reduce(
    (max, h) => Math.max(max, calculateStreak(h.completedDates)),
    0,
  );

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Habitudes"
        subtitle={`${checkedToday}/${habits.length} validées aujourd'hui`}
        actions={
          <>
            <Link
              to="/flowday"
              className="flex items-center gap-1 text-sm text-black/70 text-muted-foreground hover:text-foreground"
            >
              ← FlowDay
            </Link>
            <Button
              size="sm"
              className="bg-flowday text-white hover:bg-flowday/90"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Nouvelle habitude
            </Button>
          </>
        }
      />

      <main className="space-y-5 px-12 py-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            value={`${checkedToday}/${habits.length}`}
            label="Check-in du jour"
          />
          <StatCard value={`${bestStreak}j`} label="Meilleure série" />
          <StatCard value={`${habits.length}`} label="Habitudes suivies" />
        </div>

        {loading && (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && habits.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucune habitude pour l'instant. Ajoute la première ci-dessus.
          </p>
        )}

        <div className="space-y-4">
          {habits.map((habit) => (
            <HabitCard key={habit._id} habit={habit} />
          ))}
        </div>
      </main>
      <NewHabitModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="font-mono text-3xl font-normal">{value}</p>
      <p className="mt-1 text-sm text-black/70 text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
