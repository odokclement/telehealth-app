import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173"],

    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));

app.use(cookieParser());
connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
