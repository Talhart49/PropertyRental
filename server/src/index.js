import http from "node:http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { connectDatabase } from "./config/database.js";
import User from "./models/User.js";
import app from "./app.js";

const server = http.createServer(app);
const port = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const io = new Server(server, {
  cors: {
    origin: clientUrl,
    credentials: true
  }
});

app.set("io", io);

// ── Socket.io authentication middleware ─────────────────────────────────────
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token is required."));
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select("-password");

    if (!user) {
      return next(new Error("User no longer exists."));
    }

    socket.user = user;
    next();
  } catch (_error) {
    return next(new Error("Invalid or expired authentication token."));
  }
});

await connectDatabase();

io.on("connection", (socket) => {
  // Register user for targeted notifications (booking status, etc.)
  socket.on("notifications:register", (userId) => {
    if (userId) {
      socket.join(String(userId));
    }
  });

  socket.on("conversation:join", (conversationId) => {
    socket.join(String(conversationId));
  });

  socket.on("conversation:leave", (conversationId) => {
    socket.leave(String(conversationId));
  });
});

server.listen(port, () => {
  console.log(`Property rental API running on http://localhost:${port}`);
});