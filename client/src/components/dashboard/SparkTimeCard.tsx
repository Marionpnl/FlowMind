import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { sparkSuggestions } from "@/lib/mockData";

export default function SparkTimeCard() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-sparktime">
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
            className="flex items-center justify-between rounded-xl bg-sparktime-bg p-3"
          >
            <div>
              <p className="text-sm font-medium">{s.title}</p>
              <p className="text-xs text-muted-foreground">{s.detail}</p>
            </div>
            <button className="flex h-6 w-6 items-center justify-center rounded-full bg-sparktime text-white">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
