import {
  model,
  models,
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";

interface INoteSchema {
  id: string;
  content: string;
  isQuote: boolean;
  page?: string;
  createdAt: Date;
}

export interface IResourceDocument extends Document {
  userId: Types.ObjectId;
  type: "book" | "article" | "video" | "podcast";
  title: string;
  author?: string;
  coverUrl?: string;
  isbn?: string;
  status: "to-read" | "in-progress" | "done";
  rating?: number;
  progress: number;
  currentPosition?: string;
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
    page: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const resourceSchema = new Schema<IResourceDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["book", "article", "video", "podcast"],
      required: true,
    },
    title: {
      type: String,
      required: [true, "The title is required"],
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
    rating: { type: Number, min: 0, max: 5 },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    currentPosition: { type: String, trim: true },
    tags: { type: [String], default: [] },
    notes: { type: [noteSchema], default: [] },
  },
  { timestamps: true },
);

const Resource: Model<IResourceDocument> =
  models.Resource || model<IResourceDocument>("Resource", resourceSchema);
export default Resource;
