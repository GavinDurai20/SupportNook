const connectDB = require("./config/db");

const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

const { Server } = require("socket.io");

const roomRoutes = require("./routes/roomRoutes");
const codeRoutes = require("./routes/codeRoutes");

dotenv.config();

const app = express();
const server = http.createServer(app);

// =====================================================
// CONFIG
// =====================================================

const PORT = process.env.PORT || 5000;

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

const JUDGE0_URL =
  process.env.JUDGE0_URL ||
  "https://ce.judge0.com";

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

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
// ROUTES
// =====================================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SupportNook server is running",
  });
});

app.use("/api/rooms", roomRoutes);
app.use("/api/code", codeRoutes);

// =====================================================
// JUDGE0
// =====================================================

app.get("/api/judge0/languages", async (req, res) => {
  try {
    const response = await axios.get(
      `${JUDGE0_URL}/languages/`
    );

    res.json({
      success: true,
      languages: response.data,
    });
  } catch (error) {
    console.error(
      "❌ Judge0 languages error:",
      error.message
    );

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});


// =====================================================
// RUN CODE
// =====================================================

app.post("/api/judge0/run", async (req, res) => {
  try {
    const { code, languageId, stdin } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        error: "Code is required",
      });
    }

    if (!languageId) {
      return res.status(400).json({
        success: false,
        error: "Language ID is required",
      });
    }

    console.log("================================");
    console.log("▶ JUDGE0 RUN");
    console.log("Language ID:", languageId);
    console.log("================================");

    // 1. Submit code
    const submissionResponse = await axios.post(
      `${JUDGE0_URL}/submissions/?base64_encoded=false&wait=false`,
      {
        source_code: code,
        language_id: Number(languageId),
        stdin: stdin || "",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const token = submissionResponse.data.token;

    if (!token) {
      return res.status(500).json({
        success: false,
        error: "Judge0 did not return a submission token.",
      });
    }

    console.log("Judge0 token:", token);

    // 2. Poll Judge0
    let result;

    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const resultResponse = await axios.get(
        `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      result = resultResponse.data;

      console.log(
        "Judge0 status:",
        result.status?.description
      );

      // 3. Finished?
      if (
        result.status &&
        result.status.id >= 3
      ) {
        break;
      }
    }

    // 4. Still processing
    if (
      !result ||
      !result.status ||
      result.status.id === 1 ||
      result.status.id === 2
    ) {
      return res.status(504).json({
        success: false,
        error: "Judge0 execution timed out.",
      });
    }

    // 5. Return result
    res.json({
      success: true,

      output:
        result.stdout || "",

      error:
        result.stderr ||
        result.compile_output ||
        result.message ||
        "",

      status:
        result.status?.description ||
        "Unknown",

      time:
        result.time || null,

      memory:
        result.memory || null,
    });

  } catch (error) {
    console.error(
      "❌ Judge0 execution error:",
      error.message
    );

    if (error.response) {
      console.error(
        "Judge0 response:",
        error.response.data
      );

      return res.status(
        error.response.status || 500
      ).json({
        success: false,
        error:
          error.response.data?.message ||
          error.response.data?.error ||
          "Judge0 request failed",
      });
    }

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Could not connect to Judge0",
    });
  }
});


// =====================================================
// ROOM STATE
// =====================================================
//
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

      console.log("================================");

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
    console.log(
      `Judge0: ${JUDGE0_URL}`
    );
    console.log("================================");
    console.log("");

  }
);