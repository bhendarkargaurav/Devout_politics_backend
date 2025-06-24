import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors"
import uploadRoutes from "./routes/uploadRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(cors());

app.use(cors({
  origin: '*', // Or specify frontend domain like 'http://localhost:3000'
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));


// Routes
app.use("/api", uploadRoutes);

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));