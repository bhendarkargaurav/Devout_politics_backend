// app.js
import express from "express";
import cors from "cors";
import uploadRoutes from "./routes/uploadRoutes.js";
// import  corsMiddleware from "./middleware/corsMiddleware.js"

const app = express();

app.use(express.json());

// app.use(corsMiddleware);
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use("/api", uploadRoutes);

export default app;
