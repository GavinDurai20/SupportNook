import { describe, it, expect } from "vitest";
import request from "supertest";

const appModule = await import("../../src/app.js");
const app = appModule.default || appModule;

describe("GET /api/health", () => {
  it("returns a healthy response", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "SupportNook server is running",
    });
  });
});