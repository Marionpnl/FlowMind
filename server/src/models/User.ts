import { model, models, Schema, type Document, type Model } from "mongoose";
import bcrypt from "bcryptjs";

interface IUserPreferences {
  crossModuleSuggestions: boolean;
  autoGeneratePlan: boolean;
  dailyRediscovery: boolean;
  aiTone: string;
  aiLength: string;
  animatedTransitions: boolean;
  compactDensity: boolean;
  dailyEmailSummary: boolean;
  // Réglages du panneau "Ajuster les suggestions" de SparkTime — persistés
  // ici (plutôt qu'en localStorage) pour rester identiques sur tous les
  // appareils du même compte. sparkMaxDistance reprend l'encodage déjà
  // utilisé côté client (valeur brute du slider ; > MAX_FINITE_DISTANCE_KM
  // = illimité, voir client/src/lib/sparktime.ts).
  sparkMaxDuration: number;
  sparkMaxDistance: number;
  sparkEnergyIndex: number;
  // Timestamp (ms) jusqu'auquel la suggestion IA "pratique liée à tes
  // lectures" (AISuggestionCard) reste masquée après un clic sur "Plus
  // tard" — remplace l'ancien SNOOZE_KEY en localStorage.
  readingSuggestionSnoozeUntil: number | null;
}

interface ISuggestedBook {
  title: string;
  author?: string;
  coverUrl?: string;
  isbn?: string;
  reason: string;
  link: string | null;
}

interface IThematicConnection {
  resourceIdA: string;
  resourceIdB: string;
  theme: string;
  explanation: string;
}

// 1. Define the IUser interface TypeScript to represent the user document structure
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  location?: string;
  timezone?: string;
  language?: string;
  theme: "papier" | "encre" | "systeme";
  lastExportAt?: Date;
  // Date ("YYYY-MM-DD" dans le fuseau de l'utilisateur) du dernier envoi du
  // résumé quotidien par e-mail — évite un double envoi le même jour.
  lastDailyEmailDate?: string;
  resetPasswordTokenHash?: string;
  resetPasswordExpires?: Date;
  preferences: IUserPreferences;
  // Pas des "préférences" (des données, pas des réglages) — top-level comme
  // `location`. Jamais persistés nulle part avant cette migration : les
  // événements locaux, connexions et suggestions de livres eux-mêmes restent
  // recalculés à la demande (voir Décisions dans CLAUDE.md), seul ce que
  // l'utilisatrice a explicitement masqué/généré est mémorisé ici.
  dismissedLocalEventIds: string[];
  bookSuggestions: ISuggestedBook[];
  connectionsCache?: {
    data: IThematicConnection[];
    generatedAt: number;
  };
  comparePassword: (candidate: string) => Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Define the Mongoose schema for the User model
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Le nom est requis"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Le mot de passe est requis"],
    },
    location: {
      type: String,
      trim: true,
    },
    timezone: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      trim: true,
    },
    theme: {
      type: String,
      enum: ["papier", "encre", "systeme"],
      default: "papier",
    },
    lastExportAt: {
      type: Date,
    },
    lastDailyEmailDate: {
      type: String,
    },
    // select: false — jamais renvoyés par défaut (ex: GET /me, GET /export),
    // même s'ils sont hashés, par précaution.
    resetPasswordTokenHash: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    preferences: {
      crossModuleSuggestions: { type: Boolean, default: true },
      autoGeneratePlan: { type: Boolean, default: true },
      dailyRediscovery: { type: Boolean, default: true },
      aiTone: { type: String, default: "Calme et encourageant", trim: true },
      aiLength: { type: String, default: "Concise", trim: true },
      animatedTransitions: { type: Boolean, default: true },
      compactDensity: { type: Boolean, default: false },
      dailyEmailSummary: { type: Boolean, default: false },
      sparkMaxDuration: { type: Number, default: 60 },
      sparkMaxDistance: { type: Number, default: 5 },
      sparkEnergyIndex: { type: Number, default: 1 },
      readingSuggestionSnoozeUntil: { type: Number, default: null },
    },
    dismissedLocalEventIds: {
      type: [String],
      default: [],
    },
    bookSuggestions: {
      type: [
        {
          title: { type: String, required: true },
          author: { type: String },
          coverUrl: { type: String },
          isbn: { type: String },
          reason: { type: String, required: true },
          link: { type: String, default: null },
        },
      ],
      default: [],
    },
    connectionsCache: {
      type: {
        data: {
          type: [
            {
              resourceIdA: { type: String, required: true },
              resourceIdB: { type: String, required: true },
              theme: { type: String, required: true },
              explanation: { type: String, required: true },
            },
          ],
          default: [],
        },
        generatedAt: { type: Number, required: true },
      },
      default: undefined,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  },
);

// Hash password before save if modified
userSchema.pre("save", async function () {
  try {
    if (!this.isModified("password")) return;
    const hashed = await bcrypt.hash(this.password, 10);
    this.password = hashed;
  } catch (err) {
    console.error("Error hashing password:", err);
    throw err;
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

const User: Model<IUser> = models.User || model<IUser>("User", userSchema);
export default User;
