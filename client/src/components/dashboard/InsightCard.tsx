import { Sparkles, Quote } from "lucide-react";
import { insight } from "@/lib/mockData";
import { Button } from "@/components/ui/button";

export default function InsightCard() {
  return (
    <div className="rounded-2xl bg-[#2B2A28] p-5 text-white">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white">
        <Sparkles className="h-3.5 w-3.5" />
        FlowMind · Insight transversal
      </p>
      <Quote className="mb-2 mt-5 h-5 w-5 text-white" />
      <p className="mb-6 mr-15 text-lg leading-relaxed font-display italic text-white">
        {insight.text}
      </p>
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          className="bg-flowday rounded-xl text-white hover:bg-flowday/90"
        >
          + Planifier de la pratique
        </Button>
        <button className="text-xs text-white/60 rounded-xl hover:text-white">
          Plus tard
        </button>
      </div>
    </div>
  );
}
