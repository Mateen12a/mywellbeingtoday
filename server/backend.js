import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import connectDB from './config/database.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toLocaleTimeString()} [API] ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  next();
});

(async () => {
  await connectDB();

  app.use('/api', apiRoutes);

  app.use(errorHandler);

  const port = parseInt(process.env.BACKEND_PORT || '3000', 10);
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`[Backend] API server running on port ${port}`);
  });
})();
