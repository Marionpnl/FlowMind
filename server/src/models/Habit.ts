import { Schema, model, models, Document, Model, Types } from "mongoose";

export interface IHabitDocument extends Document {
  userId: Types.ObjectId;
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

const Habit: Model<IHabitDocument> =
  models.Habit || model<IHabitDocument>("Habit", habitSchema);
export default Habit;
