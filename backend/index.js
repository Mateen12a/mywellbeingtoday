// index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");

const SESSION_VERSION = "v2";

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const adminRoutes = require("./routes/adminRoutes");
const proposalRoutes = require("./routes/proposalRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const matchRoutes = require("./routes/matchRoutes");
const messageRoutes = require("./routes/messageRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const reportRoutes = require("./routes/reportRoutes");

const { setSocket } = require("./controllers/messageController");
const messageController = require("./controllers/messageController");
const conversationController = require("./controllers/conversationController");

dotenv.config();

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { msg: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { msg: "Too many login attempts, please try again later" },
});

const app = express();
app.set('trust proxy', 1); // Trust first proxy for rate limiting behind Replit's proxy
const server = http.createServer(app);

// CORS configuration - build allowed origins list
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5000', 'http://localhost:3000'];

// Add Replit production domains
if (process.env.REPLIT_DEV_DOMAIN) {
  allowedOrigins.push(`https://${process.env.REPLIT_DEV_DOMAIN}`);
}
if (process.env.REPLIT_DOMAINS) {
  process.env.REPLIT_DOMAINS.split(',').forEach(d => allowedOrigins.push(`https://${d}`));
}

// Also allow globalhealth.works domain
allowedOrigins.push('https://globalhealth.works');
allowedOrigins.push('https://www.globalhealth.works');

const isProduction = process.env.NODE_ENV === 'production';

// Origin validation function shared by CORS and Socket.IO
const validateOrigin = (origin, callback) => {
  // Allow requests with no origin (mobile apps, curl, Postman, same-origin)
  if (!origin) return callback(null, true);
  
  // Parse the origin to get the hostname for exact matching
  let originHost;
  try {
    const url = new URL(origin);
    originHost = url.host; // e.g., "globalhealth.works" or "localhost:5000"
  } catch (e) {
    // Invalid URL format
    if (isProduction) {
      console.warn(`CORS blocked invalid origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    }
    return callback(null, true);
  }
  
  // Check if origin host exactly matches any allowed origin host
  const isAllowed = allowedOrigins.some(allowed => {
    try {
      const allowedUrl = new URL(allowed);
      return originHost === allowedUrl.host;
    } catch (e) {
      // Handle cases where allowed origin is just a hostname
      return originHost === allowed || originHost === allowed.replace(/^https?:\/\//, '');
    }
  });
  
  if (isAllowed) {
    return callback(null, true);
  }
  
  // In development, allow all origins for easier testing
  if (!isProduction) {
    return callback(null, true);
  }
  
  // In production, reject unauthorized origins
  console.warn(`CORS blocked origin: ${origin}`);
  return callback(new Error('Not allowed by CORS'), false);
};

// ✅ Setup Socket.IO with proper CORS
const io = new Server(server, {
  cors: { 
    origin: validateOrigin,
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Socket.IO JWT Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
  
  if (!token) {
    // Allow connection but mark as unauthenticated
    socket.user = null;
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // Store authenticated user on socket
    next();
  } catch (err) {
    console.warn("Socket auth failed:", err.message);
    socket.user = null;
    next(); // Allow connection but unauthenticated
  }
});

// Inject io to controllers
setSocket(io);
messageController.setSocket(io);
conversationController.setSocket && conversationController.setSocket(io);

app.use(cors({
  origin: validateOrigin,
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '10mb' }));

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for SPA compatibility
  crossOriginEmbedderPolicy: false,
}));

// Compression
app.use(compression());

// General rate limiting for all routes
app.use('/api/', limiter);

// API routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/reports", reportRoutes);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve frontend static files in production
const frontendDist = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDist));

// ==================== SOCKET.IO EVENTS ====================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id, socket.user ? `(authenticated: ${socket.user.id})` : "(unauthenticated)");

  // Auto-join user's personal room if authenticated
  if (socket.user?.id) {
    socket.join(socket.user.id);
    console.log(`Authenticated user ${socket.user.id} auto-joined their personal room`);
  }

  // Join user-specific room - ONLY allow joining own room (strict auth)
  socket.on("join", (userId) => {
    // Security: Require authentication and only allow joining your own room
    if (!socket.user?.id) {
      console.warn(`Unauthenticated socket tried to join room ${userId} - denied`);
      socket.emit("error", { msg: "Authentication required" });
      return;
    }
    
    if (socket.user.id === userId) {
      socket.join(userId);
      console.log(`User ${userId} joined their personal room`);
    } else {
      console.warn(`User ${socket.user.id} tried to join room ${userId} - denied`);
      socket.emit("error", { msg: "Cannot join another user's room" });
    }
  });

  // Join conversation room - require authentication
  socket.on("joinConversation", async (conversationId) => {
    if (!socket.user?.id) {
      console.warn(`Unauthenticated socket tried to join conversation ${conversationId} - denied`);
      socket.emit("error", { msg: "Authentication required" });
      return;
    }
    
    // Verify user is participant of this conversation
    try {
      const Conversation = require("./models/Conversation");
      const convo = await Conversation.findById(conversationId);
      if (!convo || !convo.participants.some(p => p.toString() === socket.user.id)) {
        console.warn(`User ${socket.user.id} tried to join conversation ${conversationId} without being a participant - denied`);
        socket.emit("error", { msg: "Not a participant of this conversation" });
        return;
      }
      
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.user.id} joined conversation room: conversation:${conversationId}`);
    } catch (err) {
      console.error("Error validating conversation membership:", err);
      socket.emit("error", { msg: "Could not join conversation" });
    }
  });

  // Typing indicators - require authentication, use authenticated user ID
  socket.on("typing", ({ conversationId, from, name }) => {
    if (!socket.user?.id) return; // Silently ignore unauthenticated
    socket.to(`conversation:${conversationId}`).emit("typing", { conversationId, from: socket.user.id, name });
  });

  socket.on("stopTyping", ({ conversationId, from }) => {
    if (!socket.user?.id) return; // Silently ignore unauthenticated
    socket.to(`conversation:${conversationId}`).emit("stopTyping", { conversationId, from: socket.user.id });
  });

  // New message - REQUIRE authentication (no fallback)
  socket.on("message:new", async (msg) => {
    try {
      // Security: Require authenticated user - no fallback to client-provided senderId
      if (!socket.user?.id) {
        console.error("Cannot send message: Unauthenticated socket");
        socket.emit("error", { msg: "Authentication required to send messages" });
        return;
      }
      
      const { conversationId, text, attachments, replyTo } = msg;
      
      const newMessage = await messageController.createMessageSocket({
        conversationId,
        senderId: socket.user.id, // Always use authenticated user
        text,
        attachments,
        replyTo,
      });

      // Emit to all in conversation (volatile to prevent buffering duplicates)
      io.volatile.to(`conversation:${conversationId}`).emit("message:new", newMessage);

      // Emit to participants' personal rooms for Inbox updates (volatile)
      newMessage.participants?.forEach((user) => {
        io.volatile.to(user._id.toString()).emit("inbox:update", newMessage);
      });
    } catch (err) {
      console.error("Error sending new message:", err);
      socket.emit("error", { msg: "Failed to send message" });
    }
  });

  // Message seen - REQUIRE authentication (no fallback)
  socket.on("message:seen", async ({ conversationId, messageId, userId }) => {
    try {
      // Security: Require authenticated user
      if (!socket.user?.id) {
        console.error("Cannot mark message seen: Unauthenticated socket");
        return;
      }
      
      await messageController.markMessageSeen(messageId, socket.user.id);
      io.to(`conversation:${conversationId}`).emit("message:seen", { messageId, userId: socket.user.id });
    } catch (err) {
      console.error("Error marking message as seen:", err);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ==================== MONGO ====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Health check route
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// Session version endpoint for forced logout on deployment
app.get("/api/auth/session-version", (req, res) => res.json({ version: SESSION_VERSION }));

// Serve frontend for all non-API routes (SPA support)
const fs = require("fs");
app.use((req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads") || req.path.startsWith("/socket.io")) {
    return next();
  }
  const indexPath = path.join(frontendDist, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send("GlobalHealth.Works API + Socket.IO running");
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ 
    msg: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => console.log(`Server + Socket.IO running on port ${PORT}`));
