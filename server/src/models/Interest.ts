import { Schema, model, models, Document } from "mongoose";

export interface IInterestDocument extends Document {
  userId: Schema.Types.ObjectId;
  name: string;
  emoji: string;
  category?: string;
  source: "manual" | "ai";
  createdAt: Date;
  updatedAt: Date;
}

const interestSchema = new Schema<IInterestDocument>(
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
      default: "✨",
    },
    category: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ["manual", "ai"],
      default: "manual",
    },
  },
  { timestamps: true },
);

interestSchema.index({ userId: 1, name: 1 }, { unique: true });

const Interest =
  models.Interest || model<IInterestDocument>("Interest", interestSchema);
export default Interest;
