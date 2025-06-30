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

app.use(express.json());

// import corsMiddleware from "./middleware/corsMiddleware.js";
// app.use(corsMiddleware);
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));


app.use("/api", uploadRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));




// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import app from "./app.js";

// dotenv.config();

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("Connected to MongoDB");
//     app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
//   })
//   .catch((err) => console.error("MongoDB connection error:", err));