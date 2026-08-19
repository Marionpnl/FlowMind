import { model, models, Schema, type Document } from "mongoose";
import bcrypt from "bcryptjs";

interface IUserPreferences {
  crossModuleSuggestions: boolean;
  autoGeneratePlan: boolean;
  dailyRediscovery: boolean;
  aiTone: string;
  aiLength: string;
  animatedTransitions: boolean;
  compactDensity: boolean;
  readingHistory: boolean;
  anonymousUsage: boolean;
  crossModuleDataSharing: boolean;
  dataRetentionMonths: number;
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
  resetPasswordTokenHash?: string;
  resetPasswordExpires?: Date;
  preferences: IUserPreferences;
  comparePassword?: (candidate: string) => Promise<boolean>;
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
      readingHistory: { type: Boolean, default: true },
      anonymousUsage: { type: Boolean, default: false },
      crossModuleDataSharing: { type: Boolean, default: true },
      dataRetentionMonths: { type: Number, default: 12 },
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

const User = models.User || model<IUser>("User", userSchema);
export default User;
