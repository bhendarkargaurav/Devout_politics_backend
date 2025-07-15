import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors"
import uploadRoutes from "./routes/uploadRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import corsMiddleware from "./middleware/corsMiddleware.js"

import { clerkMiddleware } from '@clerk/express'
import { clerkClient, requireAuth, getAuth } from '@clerk/express'

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

app.use(clerkMiddleware())

app.use(corsMiddleware);

// app.use(cors({
//   origin: '*', 
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
// }));

//test cleark
// Use requireAuth() to protect this route
// If user isn't authenticated, requireAuth() will redirect back to the homepage
app.get('/protected', requireAuth(), async (req, res) => {
  // Use `getAuth()` to get the user's `userId`
  const { userId } = getAuth(req)

  // Use Clerk's JavaScript Backend SDK to get the user's User object
  const user = await clerkClient.users.getUser(userId)

  return res.json({ user })
})

//complete with test cleark


app.use("/api", uploadRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));




