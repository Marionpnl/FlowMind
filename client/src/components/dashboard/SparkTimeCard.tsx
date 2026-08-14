import { useState } from "react";
import { Plus, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { sparkSuggestions, type SparkSuggestion } from "@/lib/mockData";
import NewActivityModal from "@/components/widgets/NewActivityModal";

export default function SparkTimeCard() {
  const [schedulingItem, setSchedulingItem] = useState<SparkSuggestion | null>(
    null,
  );
  const [session, setSession] = useState(0);

  function handlePlan(item: SparkSuggestion) {
    setSession((s) => s + 1);
    setSchedulingItem(item);
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-sparktime">
          <span className="h-1.5 w-1.5 rounded-full bg-sparktime" />
          SparkTime · Pour toi
        </p>
        <Link
          to="/sparktime"
          className="text-xs text-muted-foreground hover:underline"
        >
          Régénérer
        </Link>
      </div>

      <ul className="space-y-2">
        {sparkSuggestions.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded-xl bg-cream-secondary p-3"
          >
            <div>
              <p className="text-sm font-medium">{s.title}</p>
              <div className=" flex justify-start items-center gap-1.5">
                <Clock className="mt-1 h-3.5 w-3.5 text-black/70" />
                <p className="text-xs font-mono text-black/70 text-muted-foreground">
                  {s.detail}
                </p>
              </div>
            </div>
            <button
              onClick={() => handlePlan(s)}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-sparktime-bg text-sparktime"
            >
              <Plus className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <NewActivityModal
        key={session}
        open={!!schedulingItem}
        onOpenChange={(open) => !open && setSchedulingItem(null)}
        defaultModule="SparkTime"
        defaultTitle={schedulingItem?.title}
        defaultNotes={schedulingItem?.detail}
      />
    </div>
  );
}
