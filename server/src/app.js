const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");

const roomRoutes = require("./routes/roomRoutes");
const codeRoutes = require("./routes/codeRoutes");

const {
  register,
  httpRequestsTotal,
  httpRequestDuration,
} = require("./metrics");

dotenv.config();

const app = express();

// =====================================================
// CONFIG
// =====================================================

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
// PROMETHEUS METRICS
// =====================================================

app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const duration =
      Number(process.hrtime.bigint() - start) / 1e9;

    const route =
      req.route?.path || req.path;

    const statusCode =
      String(res.statusCode);

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: statusCode,
      },
      duration
    );
  });

  next();
});

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
// PROMETHEUS
// =====================================================

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);

  res.end(await register.metrics());
});

// =====================================================
// ROOMS
// =====================================================

app.use("/api/rooms", roomRoutes);

// =====================================================
// CODE
// =====================================================

app.use("/api/code", codeRoutes);

// =====================================================
// JUDGE0
// =====================================================

app.get(
  "/api/judge0/languages",
  async (req, res) => {
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
  }
);

// =====================================================
// RUN CODE
// =====================================================

app.post(
  "/api/judge0/run",
  async (req, res) => {
    try {
      const {
        code,
        languageId,
        stdin,
      } = req.body;

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

      console.log(
        "================================"
      );
      console.log("▶ JUDGE0 RUN");
      console.log(
        "Language ID:",
        languageId
      );
      console.log(
        "================================"
      );

      // 1. Submit code
      const submissionResponse =
        await axios.post(
          `${JUDGE0_URL}/submissions/?base64_encoded=false&wait=false`,
          {
            source_code: code,
            language_id: Number(languageId),
            stdin: stdin || "",
          },
          {
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      const token =
        submissionResponse.data.token;

      if (!token) {
        return res.status(500).json({
          success: false,
          error:
            "Judge0 did not return a submission token.",
        });
      }

      console.log(
        "Judge0 token:",
        token
      );

      // 2. Poll Judge0
      let result;

      for (
        let attempt = 0;
        attempt < 30;
        attempt++
      ) {
        await new Promise(
          (resolve) =>
            setTimeout(resolve, 1000)
        );

        const resultResponse =
          await axios.get(
            `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
            {
              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        result =
          resultResponse.data;

        console.log(
          "Judge0 status:",
          result.status?.description
        );

        if (
          result.status &&
          result.status.id >= 3
        ) {
          break;
        }
      }

      // 3. Still processing
      if (
        !result ||
        !result.status ||
        result.status.id === 1 ||
        result.status.id === 2
      ) {
        return res.status(504).json({
          success: false,
          error:
            "Judge0 execution timed out.",
        });
      }

      // 4. Return result
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

        return res
          .status(
            error.response.status || 500
          )
          .json({
            success: false,
            error:
              error.response.data
                ?.message ||
              error.response.data
                ?.error ||
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
  }
);

module.exports = app;