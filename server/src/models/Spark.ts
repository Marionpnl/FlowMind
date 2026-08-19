import { Schema, model, models, Document, Model, Types } from "mongoose";

export interface ISparkDocument extends Document {
  userId: Types.ObjectId;
  title: string;
  description: string;
  emoji: string;
  duration: number;
  interestName: string;
  category?: string;
  detail?: string;
  energyLevel?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sparkSchema = new Schema<ISparkDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    emoji: {
      type: String,
      default: "✨",
    },
    duration: {
      type: Number,
      required: true,
    },
    interestName: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    detail: {
      type: String,
      trim: true,
    },
    energyLevel: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

const Spark: Model<ISparkDocument> =
  models.Spark || model<ISparkDocument>("Spark", sparkSchema);
export default Spark;
