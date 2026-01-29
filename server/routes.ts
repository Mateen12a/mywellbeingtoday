import type { Express } from "express";
import { type Server } from "http";
import cors from "cors";
import connectDB from "./config/database.js";
import apiRoutes from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Connect to MongoDB
  await connectDB();

  // Enable CORS
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // API routes
  app.use('/api', apiRoutes);

  // Note: 404 for unknown API routes is handled by the catch-all in the routes/index.js

  // Error handler
  app.use(errorHandler);

  return httpServer;
}
