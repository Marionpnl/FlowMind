import { BookOpen, FileText, Video, Podcast } from "lucide-react";
import type { ResourceType } from "@shared/types";

export const RESOURCE_TYPE_CONFIG: Record<
  ResourceType,
  { label: string; Icon: typeof BookOpen }
> = {
  book: { label: "Livre", Icon: BookOpen },
  article: { label: "Article", Icon: FileText },
  video: { label: "Vidéo", Icon: Video },
  podcast: { label: "Podcast", Icon: Podcast },
};

export const STATUS_LABELS: Record<string, string> = {
  "to-read": "À lire",
  "in-progress": "En cours",
  done: "Terminé",
};
