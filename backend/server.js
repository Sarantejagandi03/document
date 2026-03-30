import "dotenv/config";

import http from "http";

import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";


import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import Document from "./models/Document.js";
import User from "./models/User.js";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import { canEditDocument, canViewDocument } from "./utils/documentAccess.js";

await connectDB();

const app = express();
const server = http.createServer(app);
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({ message: "CollabDocs API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use(notFound);
app.use(errorHandler);

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    credentials: true,
  },
});

const activeUsers = new Map();
const palette = ["#ff6b6b", "#2f80ed", "#f2994a", "#27ae60", "#9b51e0", "#00b8a9"];

const broadcastPresence = (documentId) => {
  const roomEntries = [...activeUsers.entries()]
    .filter(([, value]) => value.documentId === documentId)
    .map(([socketId, value]) => ({
      socketId,
      userId: value.userId,
      name: value.name,
      color: value.color,
      cursor: value.cursor,
    }));

  io.to(documentId).emit("presence:update", roomEntries);
};

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("name email");

    if (!user) return next(new Error("User not found"));

    socket.user = user;
    return next();
  } catch (error) {
    return next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  socket.on("document:join", async ({ documentId }) => {
    const document = await Document.findById(documentId);

    if (!document || !canViewDocument(document, socket.user._id)) {
      socket.emit("document:error", { message: "Unable to join document" });
      return;
    }

    socket.join(documentId);
    activeUsers.set(socket.id, {
      documentId,
      userId: socket.user._id.toString(),
      name: socket.user.name,
      color: palette[activeUsers.size % palette.length],
      cursor: null,
    });

    socket.emit("document:joined", {
      documentId,
      canEdit: canEditDocument(document, socket.user._id),
    });

    broadcastPresence(documentId);
  });

  socket.on("document:leave", ({ documentId }) => {
    socket.leave(documentId);
    activeUsers.delete(socket.id);
    broadcastPresence(documentId);
  });

  socket.on("document:change", async ({ documentId, content, title }) => {
    const document = await Document.findById(documentId);
    if (!document || !canEditDocument(document, socket.user._id)) return;

    socket.to(documentId).emit("document:receive-change", {
      content,
      title,
      updatedBy: {
        _id: socket.user._id,
        name: socket.user.name,
      },
      updatedAt: new Date().toISOString(),
    });
  });

  socket.on("cursor:update", async ({ documentId, cursor }) => {
    const document = await Document.findById(documentId);
    if (!document || !canViewDocument(document, socket.user._id)) return;

    const entry = activeUsers.get(socket.id);
    if (!entry) return;

    entry.cursor = cursor;
    activeUsers.set(socket.id, entry);
    broadcastPresence(documentId);
  });

  socket.on("disconnect", () => {
    const entry = activeUsers.get(socket.id);
    activeUsers.delete(socket.id);
    if (entry?.documentId) broadcastPresence(entry.documentId);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
