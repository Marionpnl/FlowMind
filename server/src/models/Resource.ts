import { model, models, Schema, type Document } from "mongoose";

interface INoteSchema {
  id: string;
  content: string;
  isQuote: boolean;
  createdAt: Date;
}

export interface IResourceDocument extends Document {
  userId: Schema.Types.ObjectId;
  type: "book" | "article" | "video" | "podcast";
  title: string;
  author?: string;
  coverUrl?: string;
  isbn?: string;
  status: "to-read" | "in-progress" | "done";
  tags: string[];
  notes: INoteSchema[];
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INoteSchema>(
  {
    id: { type: String, required: true },
    content: { type: String, required: true, trim: true },
    isQuote: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const resourceSchema = new Schema<IResourceDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["book", "article", "video", "podcast"],
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    author: { type: String, trim: true },
    coverUrl: { type: String, trim: true },
    isbn: { type: String, trim: true },
    status: {
      type: String,
      enum: ["to-read", "in-progress", "done"],
      default: "to-read",
    },
    tags: {
      type: [String],
      default: [],
    },
    notes: {
      type: [noteSchema],
      default: [],
    },
  },
  { timestamps: true },
);

const Resource =
  models.Resource || model<IResourceDocument>("Resource", resourceSchema);
export default Resource;
