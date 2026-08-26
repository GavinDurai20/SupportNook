const Room = require("../models/Room");

const generateRoomId = () => {
  return Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
};

const createRoom = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Room name is required",
      });
    }

    let roomId;
    let existingRoom;

    do {
      roomId = generateRoomId();
      existingRoom = await Room.findOne({ roomId });
    } while (existingRoom);

    const room = await Room.create({
      roomId,
      name: name.trim(),
      participants: [],
    });

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      room: {
        roomId: room.roomId,
        name: room.name,
        participants: room.participants,
      },
    });
  } catch (error) {
    console.error("Create room error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create room",
    });
  }
};

const getRoom = async (req, res) => {
  try {
    const roomId = req.params.roomId.trim().toUpperCase();

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    return res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    console.error("Get room error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch room",
    });
  }
};

module.exports = {
  createRoom,
  getRoom,
};