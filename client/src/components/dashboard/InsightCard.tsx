import { useState } from "react";
import { Sparkles, Quote } from "lucide-react";
import { insight } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import NewActivityModal from "@/components/widgets/NewActivityModal";

export default function InsightCard() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);

  function handlePlan() {
    setSession((s) => s + 1);
    setOpen(true);
  }

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
          onClick={handlePlan}
          className="bg-flowday rounded-xl text-white hover:bg-flowday/90"
        >
          + Planifier de la pratique
        </Button>
        <button className="text-xs text-white/60 rounded-xl hover:text-white">
          Plus tard
        </button>
      </div>

      <NewActivityModal
        key={session}
        open={open}
        onOpenChange={setOpen}
        defaultModule="FlowDay"
        defaultNotes={insight.text}
      />
    </div>
  );
}
