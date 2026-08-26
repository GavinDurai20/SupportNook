import { useState } from "react";
import "./Home.css";

function Home({
  onRoomCreated,
  onRoomJoined,
}) {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // CREATE ROOM
  // ==========================================

  const handleCreateRoom = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/rooms",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `${trimmedName}'s Workspace`,
          }),
        }
      );

      const data = await response.json();

      console.log("CREATE ROOM RESPONSE:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Could not create the room."
        );
      }

      if (!data.room) {
        throw new Error(
          "Server did not return a room."
        );
      }

      const room = data.room;

      console.log("🟢 ROOM CREATED:", room);
      console.log("🟢 ROOM ID:", room.roomId);

      // Save username
      localStorage.setItem(
        "supportnook-username",
        trimmedName
      );

      // Save room
      localStorage.setItem(
        "supportnook-room",
        JSON.stringify(room)
      );

      // Tell App.jsx that room was created
      if (typeof onRoomCreated === "function") {
        onRoomCreated(room);
      } else {
        console.error(
          "❌ onRoomCreated is not a function"
        );
      }

    } catch (error) {
      console.error(
        "❌ Create room error:",
        error
      );

      setError(
        error.message ||
          "Could not create the room."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // JOIN ROOM
  // ==========================================

  const handleJoinRoom = async () => {
    const trimmedName = name.trim();
    const trimmedRoomId = roomId
      .trim()
      .toUpperCase();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (!trimmedRoomId) {
      setError("Please enter the room ID.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log(
        "🔵 Checking room:",
        trimmedRoomId
      );

      const response = await fetch(
        `http://localhost:5000/api/rooms/${trimmedRoomId}`
      );

      const data = await response.json();

      console.log(
        "JOIN ROOM RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message || "Room not found."
        );
      }

      if (!data.room) {
        throw new Error(
          "Server did not return room information."
        );
      }

      const room = data.room;

      console.log(
        "🟢 JOINED ROOM:",
        room
      );

      console.log(
        "🟢 ROOM ID:",
        room.roomId
      );

      // Save username
      localStorage.setItem(
        "supportnook-username",
        trimmedName
      );

      // Save room
      localStorage.setItem(
        "supportnook-room",
        JSON.stringify(room)
      );

      // Tell App.jsx that room was joined
      if (typeof onRoomJoined === "function") {
        onRoomJoined(room);
      } else {
        console.error(
          "❌ onRoomJoined is not a function"
        );
      }

    } catch (error) {
      console.error(
        "❌ Join room error:",
        error
      );

      setError(
        error.message ||
          "Could not join the room."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ENTER KEY
  // ==========================================

  const handleKeyDown = (event) => {
    if (event.key !== "Enter") {
      return;
    }

    if (roomId.trim()) {
      handleJoinRoom();
    } else {
      handleCreateRoom();
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="home-page">

      {/* HEADER */}

      <header className="home-header">

        <div className="home-brand">

          <span className="home-brand-mark">
            S
          </span>

          <span>
            SupportNook
          </span>

        </div>

        <div className="home-status">

          <span className="home-status-dot" />

          <span>
            Real-time collaboration
          </span>

        </div>

      </header>

      {/* MAIN */}

      <main className="home-main">

        {/* LEFT */}

        <section className="home-content">

          <span className="home-eyebrow">
            COLLABORATION, WITHOUT THE CHAOS
          </span>

          <h1>
            Solve problems
            <br />

            <span>
              together.
            </span>
          </h1>

          <p>
            A shared workspace for real-time
            support, conversations, collaborative
            coding and visual ideas.
          </p>

        </section>

        {/* RIGHT */}

        <section className="room-card">

          <div className="room-card-header">

            <h2>
              Join a workspace
            </h2>

            <p>
              Enter your name and the room ID
              to get started.
            </p>

          </div>

          {/* NAME */}

          <div className="input-group">

            <label htmlFor="name">
              Your name
            </label>

            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />

          </div>

          {/* ROOM ID */}

          <div className="input-group">

            <label htmlFor="roomId">
              Room ID
            </label>

            <input
              id="roomId"
              type="text"
              placeholder="Enter room ID"
              value={roomId}
              onChange={(event) => {
                setRoomId(
                  event.target.value.toUpperCase()
                );

                setError("");
              }}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />

          </div>

          {/* ERROR */}

          {error && (
            <div className="home-error">
              {error}
            </div>
          )}

          {/* JOIN */}

          <button
            type="button"
            className="join-button"
            onClick={handleJoinRoom}
            disabled={loading}
          >
            {loading
              ? "Joining..."
              : "Enter workspace"}
          </button>

          {/* DIVIDER */}

          <div className="home-divider">

            <span>
              OR
            </span>

          </div>

          {/* CREATE */}

          <button
            type="button"
            className="create-button"
            onClick={handleCreateRoom}
            disabled={loading}
          >
            {loading
              ? "Creating..."
              : "Create a new room"}
          </button>

        </section>

      </main>

      {/* FOOTER */}

      <footer className="home-footer">

        <span>Chat</span>

        <span>•</span>

        <span>Code</span>

        <span>•</span>

        <span>Canvas</span>

        <span>•</span>

        <span>Real-time</span>

      </footer>

    </div>
  );
}

export default Home;