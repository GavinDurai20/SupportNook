const connectDB = require("./config/db");

const http = require("http");
const dotenv = require("dotenv");

const app = require("./app");
const { Server } = require("socket.io");

dotenv.config();

// =====================================================
// CONFIG
// =====================================================

const PORT = process.env.PORT || 5000;

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

// =====================================================
// HTTP SERVER
// =====================================================

const server = http.createServer(app);

// =====================================================
// DATABASE
// =====================================================

connectDB();

// =====================================================
// SOCKET.IO
// =====================================================

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },

  transports: ["websocket", "polling"],

  pingTimeout: 60000,
  pingInterval: 25000,
});

// =====================================================
// ROOM STATE
// =====================================================

// Everything that needs synchronization lives here.
//
// roomStates = {
//   ABC123: {
//     code: "...",
//     language: "JavaScript",
//     output: "...",
//     strokes: []
//   }
// }

const roomStates = new Map();

// =====================================================
// GET / CREATE ROOM STATE
// =====================================================

function getRoomState(roomId) {
  if (!roomStates.has(roomId)) {
    roomStates.set(roomId, {
      code: "",
      language: "JavaScript",
      output: "",
      strokes: [],
    });
  }

  return roomStates.get(roomId);
}

// =====================================================
// SOCKET CONNECTION
// =====================================================

io.on("connection", (socket) => {
  console.log("");
  console.log("================================");
  console.log("🟢 USER CONNECTED");
  console.log("Socket ID:", socket.id);
  console.log("================================");

  // ===================================================
  // JOIN ROOM
  // ===================================================

  socket.on("join-room", (data) => {
    const roomId =
      String(data?.roomId || "").trim();

    const username =
      String(
        data?.username ||
        "Guest"
      ).trim();

    if (!roomId) {
      console.log(
        "❌ JOIN FAILED: No room ID"
      );

      return;
    }

    // -----------------------------------------------
    // PREVENT DUPLICATE JOIN
    // -----------------------------------------------

    if (socket.roomId === roomId) {
      console.log(
        `ℹ️ ${socket.id} already in ${roomId}`
      );

      return;
    }

    // -----------------------------------------------
    // LEAVE OLD ROOM
    // -----------------------------------------------

    if (socket.roomId) {
      socket.leave(
        socket.roomId
      );
    }

    // -----------------------------------------------
    // JOIN NEW ROOM
    // -----------------------------------------------

    socket.join(roomId);

    socket.roomId = roomId;
    socket.username = username;

    console.log(
      `👤 ${username} joined room ${roomId}`
    );

    console.log(
      `Socket ${socket.id} is now in ${roomId}`
    );

    // -----------------------------------------------
    // CREATE ROOM STATE
    // -----------------------------------------------

    const state =
      getRoomState(roomId);

    // -----------------------------------------------
    // SEND FULL ROOM STATE TO NEW USER
    // -----------------------------------------------

    socket.emit(
      "room-state",
      {
        code: state.code,
        language: state.language,
        output: state.output,
        strokes: state.strokes,
      }
    );

    console.log(
      `📦 Room state sent to ${username}`
    );

    // -----------------------------------------------
    // NOTIFY OTHER USERS
    // -----------------------------------------------

    socket
      .to(roomId)
      .emit(
        "user-joined",
        {
          username,
        }
      );
  });

  // ===================================================
  // CHAT
  // ===================================================

  socket.on(
    "send-message",
    (data) => {
      const roomId =
        String(
          data?.roomId ||
          socket.roomId ||
          ""
        ).trim();

      const message =
        String(
          data?.message ||
          ""
        ).trim();

      if (!roomId || !message) {
        return;
      }

      const chatMessage = {
        id:
          `${Date.now()}-${socket.id}`,

        username:
          socket.username ||
          "Guest",

        message,

        time:
          new Date().toISOString(),
      };

      console.log(
        `💬 ${chatMessage.username}: ${message}`
      );

      io
        .to(roomId)
        .emit(
          "new-message",
          chatMessage
        );
    }
  );

  // ===================================================
  // CODE UPDATE
  // ===================================================

  socket.on(
    "code-update",
    (data) => {
      const roomId =
        String(
          data?.roomId ||
          socket.roomId ||
          ""
        ).trim();

      const code =
        typeof data?.code === "string"
          ? data.code
          : "";

      const language =
        data?.language ||
        "JavaScript";

      if (!roomId) {
        console.log(
          "❌ CODE UPDATE FAILED: No room"
        );

        return;
      }

      const state =
        getRoomState(roomId);

      state.code = code;
      state.language = language;

      console.log(
        `💻 CODE UPDATE → ${roomId}`
      );

      // Send to EVERYONE except sender

      socket
        .to(roomId)
        .emit(
          "code-update",
          {
            code,
            language,
          }
        );
    }
  );

  // ===================================================
  // CODE OUTPUT
  // ===================================================

  socket.on(
    "code-output",
    (data) => {
      const roomId =
        String(
          data?.roomId ||
          socket.roomId ||
          ""
        ).trim();

      if (!roomId) {
        console.log(
          "❌ OUTPUT FAILED: No room"
        );

        return;
      }

      const output =
        data?.output || "";

      const state =
        getRoomState(roomId);

      state.output = output;

      console.log(
        `🖥️ OUTPUT UPDATE → ${roomId}`
      );

      // Send to EVERYONE including sender

      io
        .to(roomId)
        .emit(
          "code-output",
          {
            output,
          }
        );
    }
  );

  // ===================================================
  // CANVAS DRAW
  // ===================================================

  socket.on(
    "draw-stroke",
    (data) => {
      const roomId =
        String(
          data?.roomId ||
          socket.roomId ||
          ""
        ).trim();

      if (!roomId) {
        console.log(
          "❌ DRAW FAILED: No room"
        );

        return;
      }

      const stroke = {
        x1: Number(data.x1),
        y1: Number(data.y1),

        x2: Number(data.x2),
        y2: Number(data.y2),

        size:
          Number(data.size) || 3,
      };

      const state =
        getRoomState(roomId);

      state.strokes.push(
        stroke
      );

      console.log(
        `🎨 DRAW → ${roomId}`
      );

      // Send to OTHER users

      socket
        .to(roomId)
        .emit(
          "draw-stroke",
          stroke
        );
    }
  );

  // ===================================================
  // CANVAS HISTORY REQUEST
  // ===================================================

  socket.on(
    "request-canvas-history",
    (data) => {
      const roomId =
        String(
          data?.roomId ||
          socket.roomId ||
          ""
        ).trim();

      if (!roomId) {
        return;
      }

      const state =
        getRoomState(roomId);

      console.log(
        `🖼️ Canvas history requested → ${roomId}`
      );

      socket.emit(
        "canvas-history",
        {
          strokes:
            state.strokes,
        }
      );
    }
  );

  // ===================================================
  // CLEAR CANVAS
  // ===================================================

  socket.on(
    "clear-canvas",
    (data) => {
      const roomId =
        String(
          data?.roomId ||
          socket.roomId ||
          ""
        ).trim();

      if (!roomId) {
        return;
      }

      const state =
        getRoomState(roomId);

      state.strokes = [];

      console.log(
        `🧹 CLEAR CANVAS → ${roomId}`
      );

      io
        .to(roomId)
        .emit(
          "clear-canvas"
        );
    }
  );

  // ===================================================
  // DISCONNECT
  // ===================================================

  socket.on(
    "disconnect",
    (reason) => {
      console.log("");
      console.log("🔴 USER DISCONNECTED");

      console.log(
        "Username:",
        socket.username || "Guest"
      );

      console.log(
        "Socket:",
        socket.id
      );

      console.log(
        "Reason:",
        reason
      );

      console.log(
        "================================"
      );
    }
  );
});

// =====================================================
// START SERVER
// =====================================================

server.listen(
  PORT,
  () => {
    console.log("");
    console.log("================================");
    console.log("🚀 SUPPORTNOOK SERVER");

    console.log(
      `Server: http://localhost:${PORT}`
    );

    console.log(
      `Frontend: ${FRONTEND_URL}`
    );

    console.log("================================");
    console.log("");
  }
);