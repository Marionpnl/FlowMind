import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DEFAULT_EMOJIS = [
  "⚡",
  "🏃",
  "📚",
  "💻",
  "🧘",
  "🎨",
  "💧",
  "🌱",
  "🎯",
  "✍️",
  "☕",
  "🎵",
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [customEmojis, setCustomEmojis] = useState<string[]>([]);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newEmoji, setNewEmoji] = useState("");

  const allEmojis = [...DEFAULT_EMOJIS, ...customEmojis];

  function handleAddCustomEmoji() {
    const trimmed = newEmoji.trim();
    if (!trimmed) return;

    if (!allEmojis.includes(trimmed)) {
      setCustomEmojis((prev) => [...prev, trimmed]);
    }
    onChange(trimmed);
    setNewEmoji("");
    setShowAddInput(false);
  }

  return (
    <Select
      value={value}
      onValueChange={(newValue) => {
        if (newValue) onChange(newValue);
      }}
    >
      <SelectTrigger className="w-15 text-xl">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-white shadow-lg">
        {allEmojis.map((emoji) => (
          <SelectItem key={emoji} value={emoji} className="text-xl">
            {emoji}
          </SelectItem>
        ))}

        {/* Séparateur visuel */}
        <div className="my-1 border-t border-black/10" />

        {/* Zone d'ajout, en dehors du système de sélection classique */}
        <div
          className="px-2 py-1.5"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {showAddInput ? (
            <div className="flex items-center gap-1">
              <Input
                autoFocus
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                placeholder="🎉"
                className="h-8 w-16 text-center text-lg"
                maxLength={4}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomEmoji();
                  }
                }}
              />
              <Button type="button" size="sm" onClick={handleAddCustomEmoji}>
                OK
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddInput(true)}
              className="w-full rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-black/5"
            >
              + Ajouter un emoji
            </button>
          )}
        </div>
      </SelectContent>
    </Select>
  );
}
