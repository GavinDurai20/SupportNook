import Home from "./pages/home/Home";
import Workspace from "./pages/workspace/Workspace";

import "./App.css";

function App() {
  const path = window.location.pathname;

  // ==========================================
  // WORKSPACE
  // ==========================================

  if (path === "/workspace") {
    let room = null;

    try {
      const savedRoom =
        localStorage.getItem(
          "supportnook-room"
        );

      if (savedRoom) {
        room = JSON.parse(savedRoom);
      }
    } catch (error) {
      console.error(
        "Could not load saved room:",
        error
      );
    }

    // No room -> go home
    if (!room || !room.roomId) {
      window.location.replace("/");
      return null;
    }

    return (
      <Workspace
        room={room}
        onLeave={() => {
          localStorage.removeItem(
            "supportnook-room"
          );

          localStorage.removeItem(
            "supportnook-username"
          );

          window.location.replace("/");
        }}
      />
    );
  }

  // ==========================================
  // HOME
  // ==========================================

  return (
    <Home
      onRoomCreated={(room) => {
        console.log(
          "🟢 APP: Room created",
          room
        );

        localStorage.setItem(
          "supportnook-room",
          JSON.stringify(room)
        );

        window.location.href =
          "/workspace";
      }}

      onRoomJoined={(room) => {
        console.log(
          "🟢 APP: Room joined",
          room
        );

        localStorage.setItem(
          "supportnook-room",
          JSON.stringify(room)
        );

        window.location.href =
          "/workspace";
      }}
    />
  );
}
export default App;