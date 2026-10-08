import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";

const appModule = await import("../../src/app.js");
const app = appModule.default || appModule;

const RoomModule = await import("../../src/models/Room.js");
const Room = RoomModule.default || RoomModule;

const TEST_MONGO_URI =
  process.env.MONGO_TEST_URI ||
  "mongodb://localhost:27017/supportnook_test";

beforeAll(async () => {
  await mongoose.connect(TEST_MONGO_URI);
});

beforeEach(async () => {
  await Room.deleteMany({});
});

afterAll(async () => {
  await Room.deleteMany({});
  await mongoose.connection.close();
});

describe("Room API", () => {
  describe("POST /api/rooms", () => {
    it("returns 400 when room name is missing", async () => {
      const response = await request(app)
        .post("/api/rooms")
        .send({});

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        success: false,
        message: "Room name is required",
      });
    });

    it("returns 400 when room name is empty", async () => {
      const response = await request(app)
        .post("/api/rooms")
        .send({
          name: "   ",
        });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        success: false,
        message: "Room name is required",
      });
    });

    it("creates a room successfully", async () => {
      const response = await request(app)
        .post("/api/rooms")
        .send({
          name: "DevOps Test Room",
        });

      expect(response.status).toBe(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Room created successfully"
      );

      expect(response.body.room.name).toBe(
        "DevOps Test Room"
      );

      expect(response.body.room.roomId).toMatch(
        /^[A-Z0-9]{6}$/
      );

      expect(response.body.room.participants).toEqual([]);

      const room = await Room.findOne({
        roomId: response.body.room.roomId,
      });

      expect(room).not.toBeNull();
      expect(room.name).toBe("DevOps Test Room");
    });
  });

  describe("GET /api/rooms/:roomId", () => {
    it("returns 404 when room does not exist", async () => {
      const response = await request(app).get(
        "/api/rooms/DOESNOTEXIST"
      );

      expect(response.status).toBe(404);

      expect(response.body).toEqual({
        success: false,
        message: "Room not found",
      });
    });

    it("returns a room successfully", async () => {
      const room = await Room.create({
        roomId: "TEST01",
        name: "Integration Test Room",
        participants: [],
      });

      const response = await request(app).get(
        `/api/rooms/${room.roomId}`
      );

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.room.roomId).toBe("TEST01");
      expect(response.body.room.name).toBe(
        "Integration Test Room"
      );
      expect(response.body.room.participants).toEqual([]);
    });
  });
});