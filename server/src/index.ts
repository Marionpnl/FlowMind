import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import usersRouter from "./routes/users";
import { connectDatabase } from "./config/database";

dotenv.config();

const app = express();

// Middlewares
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({ message: "FlowMind API is running" });
});

app.use("/api/users", usersRouter);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start the server
connectDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  });
