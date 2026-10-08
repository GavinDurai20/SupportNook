const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

const roomRoutes = require("./routes/roomRoutes");
const codeRoutes = require("./routes/codeRoutes");

dotenv.config();

const app = express();

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
// HEALTH
// =====================================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SupportNook server is running",
  });
});

// =====================================================
// ROUTES
// =====================================================

app.use("/api/rooms", roomRoutes);
app.use("/api/code", codeRoutes);

// =====================================================
// JUDGE0 - LANGUAGES
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
// JUDGE0 - RUN CODE
// =====================================================

app.post("/api/judge0/run", async (req, res) => {
  try {
    const { code, languageId, stdin } = req.body;

    // Validate code
    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        error: "Code is required",
      });
    }

    // Validate language
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
      await new Promise((resolve) =>
        setTimeout(resolve, 1000)
      );

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

module.exports = app;