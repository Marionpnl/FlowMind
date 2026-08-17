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

export interface GeneratedSpark {
  title: string;
  description: string;
  emoji: string;
  duration: number;
  interestName: string;
  category?: string;
  detail?: string;
  energyLevel?: string;
}

export async function generateSparks(
  interestNames: string[],
  location: string | undefined,
  maxDuration?: number,
  energyLevel?: string,
  maxDistance?: number,
): Promise<GeneratedSpark[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `
Tu es un assistant qui suggère des activités concrètes pour l'application FlowMind (module SparkTime), à partir des centres d'intérêt d'une utilisatrice.

Ses centres d'intérêt : ${interestNames.join(", ")}
Sa localisation (indicative, à utiliser si pertinent) : ${location || "non renseignée"}
${maxDuration ? `Durée maximale par activité : ${maxDuration} minutes` : ""}
${energyLevel ? `Niveau d'énergie recherché : ${energyLevel}` : ""}
${maxDistance ? `Distance maximale autour de sa localisation : ${maxDistance} km (indicative, pour les activités qui impliquent un déplacement)` : ""}

Propose 3 suggestions d'activités concrètes et réalisables, variées, chacune liée à l'un de ses centres d'intérêt.
Chaque suggestion doit avoir :
- title (court, actionnable)
- description (1-2 phrases)
- emoji (un seul emoji représentatif)
- duration (durée en minutes, un nombre réaliste comme 15, 30, 45, 60${maxDuration ? `, ne dépassant pas ${maxDuration}` : ""})
- interestName (doit correspondre exactement à l'un des centres d'intérêt listés ci-dessus)
- category (une catégorie courte parmi Sport, Créatif, Bien-être, Social, Culture, Nature, ou une autre si aucune ne convient)
- detail (une courte ligne contextuelle optionnelle : distance, lieu, niveau de difficulté — ex: "8 km · centre-ville" ou "niveau facile". Ne répète JAMAIS la durée dans ce champ, elle est déjà affichée ailleurs)
- energyLevel (le niveau d'énergie que demande CETTE activité précise, parmi Basse, Basse-Moyenne, Moyenne, Moyenne-Haute, Haute)

Réponds UNIQUEMENT en JSON valide, sans aucun texte autour, sous cette forme :
{"sparks": [{"title": "...", "description": "...", "emoji": "...", "duration": 30, "interestName": "...", "category": "...", "detail": "...", "energyLevel": "..."}]}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Réponse vide de l'IA");

  const parsed = JSON.parse(raw);
  return parsed.sparks as GeneratedSpark[];
}

export interface SuggestedSlot {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  duration: number;
}

interface ExistingBlockSummary {
  time: string;
  duration: number;
  title: string;
}

export async function suggestScheduleSlot(
  title: string,
  notes: string | undefined,
  module: "FlowDay" | "MindShelf" | "SparkTime",
  today: string,
  todayBlocks: ExistingBlockSummary[],
): Promise<SuggestedSlot> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const busySummary = todayBlocks.length
    ? todayBlocks
        .map((b) => `${b.time} (${b.duration} min) — ${b.title}`)
        .join(", ")
    : "aucun bloc planifié";

  const prompt = `
Tu es un assistant de planification pour l'application FlowMind. Une utilisatrice veut ajouter une nouvelle activité mais n'a pas précisé de créneau — propose-lui-en un.

Activité : "${title}"${notes ? ` — notes : "${notes}"` : ""}
Module : ${module}
Date du jour : ${today}
Blocs déjà planifiés aujourd'hui : ${busySummary}

Propose un créneau réaliste : si aujourd'hui a de la place en dehors des blocs déjà occupés, propose une heure aujourd'hui ; sinon propose demain à une heure raisonnable. Propose aussi une durée réaliste pour ce type d'activité (en minutes).

Réponds UNIQUEMENT en JSON valide, sans aucun texte autour, sous cette forme :
{"date": "YYYY-MM-DD", "time": "HH:MM", "duration": 30}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Réponse vide de l'IA");

  return JSON.parse(raw) as SuggestedSlot;
}

interface ResourceForConnections {
  id: string;
  title: string;
  author?: string;
  tags: string[];
  noteExcerpts: string[];
}

export interface GeneratedConnection {
  resourceIdA: string;
  resourceIdB: string;
  theme: string;
  explanation: string;
}

export async function generateConnections(
  resources: ResourceForConnections[],
): Promise<GeneratedConnection[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const resourceList = resources
    .map((r) => {
      const parts = [`id: ${r.id}`, `titre: "${r.title}"`];
      if (r.author) parts.push(`auteur: ${r.author}`);
      if (r.tags.length) parts.push(`tags: ${r.tags.join(", ")}`);
      if (r.noteExcerpts.length)
        parts.push(`extraits de notes: ${r.noteExcerpts.join(" / ")}`);
      return `- ${parts.join(" · ")}`;
    })
    .join("\n");

  const prompt = `
Tu es un assistant qui repère des connexions thématiques entre les ressources (livres, articles, vidéos, podcasts) d'une bibliothèque personnelle, pour l'application FlowMind (module MindShelf).

Ressources de la bibliothèque :
${resourceList}

Identifie 2 à 3 paires de ressources qui partagent un thème, une idée ou une tension intéressante entre elles (pas juste le même auteur ou le même tag littéral — cherche un vrai lien de fond). Pour chaque paire, donne le id exact de chaque ressource (repris tel quel de la liste ci-dessus), un thème court, et une explication très courte (15-20 mots maximum, une phrase percutante) de ce qui les relie.

Réponds UNIQUEMENT en JSON valide, sans aucun texte autour, sous cette forme :
{"connections": [{"resourceIdA": "...", "resourceIdB": "...", "theme": "...", "explanation": "..."}]}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Réponse vide de l'IA");

  const parsed = JSON.parse(raw);
  return parsed.connections as GeneratedConnection[];
}

interface RecentActivitySummary {
  resourceTitle: string;
  tags: string[];
  recentNoteExcerpts: string[];
}

export interface ReadingPatternSuggestion {
  title: string;
  description: string;
  duration: number;
}

export async function generateReadingPatternSuggestion(
  recentActivity: RecentActivitySummary[],
): Promise<ReadingPatternSuggestion> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const activityList = recentActivity
    .map((r) => {
      const parts = [`ressource: "${r.resourceTitle}"`];
      if (r.tags.length) parts.push(`tags: ${r.tags.join(", ")}`);
      if (r.recentNoteExcerpts.length)
        parts.push(`notes récentes: ${r.recentNoteExcerpts.join(" / ")}`);
      return `- ${parts.join(" · ")}`;
    })
    .join("\n");

  const prompt = `
Tu es un assistant qui repère un pattern de lecture récent pour l'application FlowMind, et propose une session de pratique dans le module FlowDay en réponse — le pont entre MindShelf (lecture) et FlowDay (action). Ce n'est pas un résumé de lecture : c'est une suggestion concrète de ce qu'il faut FAIRE avec ce qui a été lu cette semaine.

Ressources sur lesquelles l'utilisatrice a pris des notes cette semaine :
${activityList}

Déduis le thème dominant de son activité de lecture récente, puis propose une session de pratique FlowDay concrète et actionnable en lien avec ce thème (ex: appliquer une technique lue, s'entraîner sur un concept, mettre en pratique une idée).

Réponds UNIQUEMENT en JSON valide, sans aucun texte autour, sous cette forme :
{"title": "titre court de la session (ex: Pratique — Refactoring)", "description": "phrase d'insight de 30 à 35 mots maximum qui explique le pattern repéré et invite à planifier cette session, ex: Tu as beaucoup lu sur X cette semaine — veux-tu planifier une session de pratique ?", "duration": 30}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Réponse vide de l'IA");

  return JSON.parse(raw) as ReadingPatternSuggestion;
}
