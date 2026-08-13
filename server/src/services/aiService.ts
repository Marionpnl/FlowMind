import OpenAI from "openai";

export interface GeneratedBlock {
  time: string;
  title: string;
  subtitle?: string;
  duration: number;
  module: "FlowDay" | "MindShelf" | "SparkTime";
}

export async function generateDayPlan(
  userInput: string,
): Promise<GeneratedBlock[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `
Tu es un assistant de planification bienveillant pour l'application FlowMind.
L'utilisatrice décrit sa journée ainsi : "${userInput}"

Génère un planning structuré en blocs horaires réalistes et équilibrés.
Chaque bloc doit avoir : time (format "HH:MM"), title (court, actionnable), subtitle (détail optionnel), duration (durée en minutes, un nombre réaliste comme 30, 45, 60, 90), module ("FlowDay" pour le travail/focus, "MindShelf" pour la lecture/apprentissage, "SparkTime" pour le bien-être/sport/pauses).

Réponds UNIQUEMENT en JSON valide, sans aucun texte autour, sous cette forme :
{"blocks": [{"time": "09:00", "title": "...", "subtitle": "...", "duration": 30, "module": "FlowDay"}]}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Réponse vide de l'IA");

  const parsed = JSON.parse(raw);
  return parsed.blocks as GeneratedBlock[];
}

export interface DetectedInterest {
  name: string;
  emoji: string;
  category?: string;
}

export async function detectInterests(
  habitNames: string[],
  resourceSummaries: string[],
  existingNames: string[],
): Promise<DetectedInterest[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `
Tu es un assistant qui déduit des centres d'intérêt pour l'application FlowMind, à partir de l'activité d'une utilisatrice.

Ses habitudes suivies : ${habitNames.length ? habitNames.join(", ") : "aucune"}
Ses ressources (livres, articles, vidéos, podcasts) enregistrées : ${resourceSummaries.length ? resourceSummaries.join(", ") : "aucune"}

Déduis une liste de centres d'intérêt pertinents (pas une reformulation des noms déjà listés ci-dessus, mais des thèmes ou passions sous-jacents). N'inclus aucun des intérêts suivants, déjà enregistrés : ${existingNames.length ? existingNames.join(", ") : "aucun"}.

Chaque intérêt doit avoir : name (court, 1-3 mots), emoji (un seul emoji représentatif), category (une catégorie parmi Sport, Créatif, Bien-être, Social, Culture, Nature, ou une autre catégorie pertinente si aucune ne convient).

Réponds UNIQUEMENT en JSON valide, sans aucun texte autour, sous cette forme :
{"interests": [{"name": "...", "emoji": "...", "category": "..."}]}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Réponse vide de l'IA");

  const parsed = JSON.parse(raw);
  return parsed.interests as DetectedInterest[];
}
