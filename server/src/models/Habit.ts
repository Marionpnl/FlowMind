import { Schema, model, models, Document } from "mongoose";

export interface IHabitDocument extends Document {
  userId: Schema.Types.ObjectId;
  name: string;
  emoji: string;
  goal?: string;
  module: "FlowDay" | "MindShelf" | "SparkTime";
  completedDates: string[];
  createdAt: Date;
  updatedAt: Date;
}

const habitSchema = new Schema<IHabitDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    emoji: {
      type: String,
      default: "⚡",
    },
    goal: {
      type: String,
      trim: true,
    },
    module: {
      type: String,
      enum: ["FlowDay", "MindShelf", "SparkTime"],
      default: "FlowDay",
    },
    completedDates: {
      type: [String], // Array of date strings "YYYY-MM-DD"
      default: [],
    },
  },
  { timestamps: true },
);

const Habit = models.Habit || model<IHabitDocument>("Habit", habitSchema);
export default Habit;
