import OpenAI from "openai";

export interface GeneratedBlock {
  time: string;
  title: string;
  subtitle?: string;
  duration: number;
  module: "FlowDay" | "MindShelf" | "SparkTime";
}

// FlowDay — Génération de planning (texte libre → blocs structurés)
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

// SparkTime — Détection automatique d'intérêts
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

// SparkTime — Génération de suggestions d'activités (profil + localisation)
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

// Planification partagée — Suggestion de créneau (date/heure/durée) quand ils ne sont pas précisés
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

// MindShelf — Connexions thématiques entre ressources
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

// MindShelf → FlowDay — Suggestion de pratique basée sur le pattern de lecture de la semaine
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

interface DayBlockSummary {
  time: string;
  title: string;
  module: "FlowDay" | "MindShelf" | "SparkTime";
  duration: number;
  done: boolean;
}

export interface DayBilan {
  title: string;
  insight: string;
}

// FlowDay — Bilan de fin de journée
export async function generateDayBilan(
  blocks: DayBlockSummary[],
): Promise<DayBilan> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const blockList = blocks
    .map(
      (b) =>
        `- ${b.time} : ${b.done ? "fait" : "non fait"} — "${b.title}" (${b.module}, ${b.duration} min)`,
    )
    .join("\n");

  const prompt = `
Tu es un assistant bienveillant qui résume la journée d'une utilisatrice pour l'application FlowMind, à partir des blocs de son planning du jour.

Blocs de la journée :
${blockList}

Génère deux éléments distincts :
1. "title" : un titre court et évocateur (8 à 12 mots) qui capture l'esprit de la journée, comme une accroche de journal intime — pas un résumé factuel. Exemple de ton : "Une journée équilibrée, avec un vrai moment de focus."
2. "insight" : une observation courte sur un pattern dans les horaires ou la nature des blocs (quand elle semble la plus productive, un déséquilibre entre modules, etc.), suivie d'une suggestion concrète et actionnable pour demain. Exemple de ton : "Tu es plus productive le matin — envisage de bloquer ta plus grande tâche entre 9h et 11h demain."

Réponds UNIQUEMENT en JSON valide, sans aucun texte autour, sous cette forme :
{"title": "...", "insight": "..."}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Réponse vide de l'IA");

  const parsed = JSON.parse(raw);
  return {
    title: typeof parsed.title === "string" ? parsed.title : "",
    insight: typeof parsed.insight === "string" ? parsed.insight : "",
  };
}

export interface WeeklyStatsInput {
  focusMinutes: number;
  readingMinutes: number;
  movementMinutes: number;
  morningFocusPercent: number;
  flowdayBlocksDone: number;
  flowdayBlocksPlanned: number;
  notesAdded: number;
  resourcesProgress: { title: string; progress: number }[];
  sparktimeBlocksDone: number;
  sparktimeTitles: string[];
  habits: { name: string; completions: number }[];
}

export interface WeeklyHighlight {
  module: "FlowDay" | "MindShelf" | "SparkTime";
  text: string;
}

export interface WeeklyBilan {
  title: string;
  highlights: WeeklyHighlight[];
  synthesis: string;
  actions: string[];
}

function formatMinutesForPrompt(minutes: number): string {
  if (minutes <= 0) return "0 min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h${m.toString().padStart(2, "0")}`;
}

// Global — Bilan hebdomadaire (titre, points forts, synthèse, actions pour la semaine suivante)
export async function generateWeeklyBilan(
  stats: WeeklyStatsInput,
): Promise<WeeklyBilan> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const habitsSummary = stats.habits.length
    ? stats.habits.map((h) => `${h.name}: ${h.completions}x`).join(", ")
    : "aucune";
  const resourcesSummary = stats.resourcesProgress.length
    ? stats.resourcesProgress
        .map((r) => `${r.title} (${r.progress}%)`)
        .join(", ")
    : "aucune";
  const sparktimeSummary = stats.sparktimeTitles.length
    ? ` (${stats.sparktimeTitles.join(", ")})`
    : "";

  const prompt = `
Tu es un assistant bienveillant qui écrit un bilan hebdomadaire pour l'application FlowMind, à partir de statistiques déjà calculées — n'invente AUCUN chiffre qui ne figure pas ci-dessous. Adresse-toi directement à l'utilisatrice en la tutoyant ("tu as", "ton focus"...), jamais à la première personne ("j'ai").

Statistiques de la semaine :
- Focus (FlowDay) : ${formatMinutesForPrompt(stats.focusMinutes)}, dont ${stats.morningFocusPercent}% le matin (avant midi) — ${stats.flowdayBlocksDone}/${stats.flowdayBlocksPlanned} blocs accomplis
- Lecture (MindShelf) : ${formatMinutesForPrompt(stats.readingMinutes)}, ${stats.notesAdded} notes prises. Ressources actives : ${resourcesSummary}
- Mouvement (SparkTime) : ${formatMinutesForPrompt(stats.movementMinutes)}, ${stats.sparktimeBlocksDone} activités accomplies${sparktimeSummary}
- Habitudes : ${habitsSummary}

Génère 4 éléments :
1. "title" : un titre court et évocateur (8 à 12 mots) qui capture l'esprit de la semaine.
2. "highlights" : exactement 3 points forts courts (une phrase chacun), chacun associé au module concerné (une valeur EXACTE parmi "FlowDay", "MindShelf", "SparkTime") — reformule les statistiques ci-dessus de façon vivante, sans inventer de chiffres absents des données.
3. "synthesis" : un court paragraphe (40 à 50 mots maximum) qui relie ces éléments en une observation de pattern sur la semaine (ex: quand le focus est le plus fort), suivie d'une piste pour la semaine prochaine.
4. "actions" : exactement 3 recommandations concrètes et courtes pour la semaine prochaine, basées sur les patterns observés.

Réponds UNIQUEMENT en JSON valide, sans aucun texte autour, sous cette forme :
{"title": "...", "highlights": [{"module": "FlowDay", "text": "..."}], "synthesis": "...", "actions": ["...", "...", "..."]}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Réponse vide de l'IA");

  const parsed = JSON.parse(raw);
  return {
    title: typeof parsed.title === "string" ? parsed.title : "",
    highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
    synthesis: typeof parsed.synthesis === "string" ? parsed.synthesis : "",
    actions: Array.isArray(parsed.actions) ? parsed.actions : [],
  };
}
