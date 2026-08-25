import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import habitsRouter from "./routes/habits";
import flowdayRouter from "./routes/flowday";
import resourcesRouter from "./routes/resources";
import interestsRouter from "./routes/interests";
import sparksRouter from "./routes/sparks";
import summaryRouter from "./routes/summary";
import { connectDatabase } from "./config/database";
import { startDailyEmailScheduler } from "./services/dailyEmailScheduler";

const app = express();

// Middlewares
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({ message: "FlowMind API is running" });
});

app.use("/api/auth", authRouter);
app.use("/api/habits", habitsRouter);
app.use("/api/flowday", flowdayRouter);
app.use("/api/resources", resourcesRouter);
app.use("/api/interests", interestsRouter);
app.use("/api/sparks", sparksRouter);
app.use("/api/summary", summaryRouter);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start the server
connectDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    startDailyEmailScheduler();
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  });
