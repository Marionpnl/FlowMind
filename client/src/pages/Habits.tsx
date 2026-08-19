import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import HabitCard from "@/components/habits/HabitCard";
import NewHabitModal from "@/components/habits/NewHabitModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useHabitStore } from "@/store/habitStore";
import { calculateStreak, toLocalDateString } from "@/lib/streak";

export default function Habits() {
  const habits = useHabitStore((s) => s.habits);
  const loading = useHabitStore((s) => s.loading);
  const error = useHabitStore((s) => s.error);
  const fetchHabits = useHabitStore((s) => s.fetchHabits);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const today = toLocalDateString();
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
          <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
            <Link
              to="/flowday"
              className="flex items-center gap-1 whitespace-nowrap text-[10px] text-black/70 text-muted-foreground hover:text-foreground lg:text-sm"
            >
              ← FlowDay
            </Link>
            <Button
              size="lg"
              onClick={() => setModalOpen(true)}
              className="h-6 sm:h-7 gap-1 whitespace-nowrap rounded-xl bg-flowday px-1.5 sm:px-2.5 text-[10px] text-white hover:bg-flowday/90 lg:h-9 lg:gap-1.5 lg:px-2.5 lg:text-sm"
            >
              <Plus className="h-2.5 w-2.5 sm:mr-1 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
              Nouvelle habitude
            </Button>
          </div>
        }
      />

      <main className="space-y-5 px-4 py-6 sm:px-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard
            value={`${checkedToday}/${habits.length}`}
            label="Check-in du jour"
          />
          <StatCard value={`${bestStreak}j`} label="Meilleure série" />
          <div className="col-span-2 sm:col-span-1">
            <StatCard value={`${habits.length}`} label="Habitudes suivies" />
          </div>
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
