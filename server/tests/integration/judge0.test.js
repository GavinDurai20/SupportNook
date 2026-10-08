import { describe, it, expect } from "vitest";
import request from "supertest";

const appModule = await import("../../src/app.js");
const app = appModule.default || appModule;

describe("POST /api/judge0/run", () => {
  it("returns 400 when code is missing", async () => {
    const response = await request(app)
      .post("/api/judge0/run")
      .send({
        languageId: 63,
      });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      success: false,
      error: "Code is required",
    });
  });

  it("returns 400 when language ID is missing", async () => {
    const response = await request(app)
      .post("/api/judge0/run")
      .send({
        code: 'console.log("Hello World");',
      });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      success: false,
      error: "Language ID is required",
    });
  });

  it("returns 400 when code is empty", async () => {
    const response = await request(app)
      .post("/api/judge0/run")
      .send({
        code: "   ",
        languageId: 63,
      });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      success: false,
      error: "Code is required",
    });
  });
});