import { model, models, Schema, type Document } from "mongoose";
import bcrypt from "bcryptjs";

// 1. Define the IUser interface TypeScript to represent the user document structure
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  location?: string;
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
