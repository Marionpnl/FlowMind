import cron from "node-cron";
import User, { type IUser } from "../models/User";
import DayPlan from "../models/DayPlan";
import { generateDayBilan } from "./aiService";
import { sendDailySummaryEmail } from "./emailService";
import { truncateWords } from "../utils/text";
import { computeBlocksSignature } from "../utils/dayPlan";

const SEND_HOUR = 21;
const DEFAULT_TIMEZONE = "Europe/Zurich";

// "YYYY-MM-DD"/heure locale de l'utilisateur, dérivés de son fuseau —
// nécessaire puisque le serveur tourne dans un seul fuseau mais les
// utilisatrices non.
export function localDateAndHour(
  timezone: string,
): { date: string; hour: number } {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      hour12: false,
    }).format(now),
  );
  return { date, hour };
}

export async function processUser(user: IUser): Promise<void> {
  const { date: today, hour } = localDateAndHour(
    user.timezone || DEFAULT_TIMEZONE,
  );
  if (hour !== SEND_HOUR) return;

  // Réclame la journée de façon atomique : si un autre passage du cron a déjà
  // traité cet utilisateur pour "today", cette mise à jour ne matche aucun
  // document et on s'arrête là — évite un double envoi.
  const claimed = await User.findOneAndUpdate(
    {
      _id: user._id,
      "preferences.dailyEmailSummary": true,
      lastDailyEmailDate: { $ne: today },
    },
    { $set: { lastDailyEmailDate: today } },
  );
  if (!claimed) return;

  const plan = await DayPlan.findOne({ userId: user._id, date: today });
  if (!plan || plan.blocks.length === 0) return; // rien à résumer

  const signature = computeBlocksSignature(plan.blocks);
  let title = plan.endOfDaySummary;
  let insight = plan.endOfDayInsight;

  if (!title || plan.endOfDayBlocksSignature !== signature) {
    const bilan = await generateDayBilan(
      plan.blocks.map((b) => ({
        time: b.time,
        title: b.title,
        module: b.module,
        duration: b.duration,
        done: b.done,
      })),
      user.preferences?.aiTone || "Calme et encourageant",
      user.preferences?.aiLength || "Concise",
    );
    title = truncateWords(bilan.title.trim(), 20);
    insight = truncateWords(bilan.insight.trim(), 40);
    plan.endOfDaySummary = title;
    plan.endOfDayInsight = insight;
    plan.endOfDayBlocksSignature = signature;
    await plan.save();
  }

  const focusMinutes = plan.blocks
    .filter((b) => b.module === "FlowDay")
    .reduce((s, b) => s + b.duration, 0);
  const readingMinutes = plan.blocks
    .filter((b) => b.module === "MindShelf")
    .reduce((s, b) => s + b.duration, 0);
  const movementMinutes = plan.blocks
    .filter((b) => b.module === "SparkTime")
    .reduce((s, b) => s + b.duration, 0);

  await sendDailySummaryEmail(user.email, {
    title: title || "Ta journée FlowMind",
    insight: insight || "",
    focusMinutes,
    readingMinutes,
    movementMinutes,
  });
}

export function startDailyEmailScheduler(): void {
  // Toutes les heures pile : chaque utilisateur n'est réellement traité que
  // lorsque son heure locale (fuseau propre, cf. localDateAndHour) atteint
  // SEND_HOUR — inutile de tourner plus souvent.
  cron.schedule("0 * * * *", async () => {
    const users = await User.find({
      "preferences.dailyEmailSummary": true,
    }).select("email timezone preferences lastDailyEmailDate");

    for (const user of users) {
      try {
        await processUser(user);
      } catch (error) {
        // Un échec (ex: restriction Resend sans domaine vérifié) ne doit
        // jamais interrompre le traitement des autres utilisateurs.
        console.error(
          `dailyEmailScheduler: failed for user ${user._id}`,
          error,
        );
      }
    }
  });
}
