import { model, models, Schema, type Document } from "mongoose";

interface IDayPlanBlock {
  id: string;
  time: string;
  title: string;
  subtitle?: string;
  duration: number;
  module: "FlowDay" | "MindShelf" | "SparkTime";
  done: boolean;
  sparkId?: string;
}

export interface IDayPlanDocument extends Document {
  userId: Schema.Types.ObjectId;
  date: string;
  userInput?: string;
  blocks: IDayPlanBlock[];
  energyScore?: number;
  endOfDaySummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const blockSchema = new Schema<IDayPlanBlock>(
  {
    id: { type: String, required: true },
    time: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String },
    duration: { type: Number, required: true, default: 30 },
    module: {
      type: String,
      enum: ["FlowDay", "MindShelf", "SparkTime"],
      required: true,
    },
    done: { type: Boolean, default: false },
    sparkId: { type: String },
  },
  { _id: false }, // pas besoin d'un _id Mongo séparé pour chaque bloc, on a déjà "id"
);

const dayPlanSchema = new Schema<IDayPlanDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    userInput: {
      type: String,
      trim: true,
    },
    blocks: {
      type: [blockSchema],
      default: [],
    },
    energyScore: {
      type: Number,
      min: 1,
      max: 5,
    },
    endOfDaySummary: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// Un seul DayPlan par utilisatrice et par date
dayPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

const DayPlan =
  models.DayPlan || model<IDayPlanDocument>("DayPlan", dayPlanSchema);
export default DayPlan;
