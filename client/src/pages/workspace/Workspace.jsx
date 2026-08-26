import { useEffect } from "react";
import socket from "../../socket";

import Chat from "../../components/Chat/Chat";
import CodeEditor from "../../components/codeEditor/CodeEditor";
import Whiteboard from "../../components/WhiteBoard/WhiteBoard";

import "./Workspace.css";

function Workspace({ room }) {

  useEffect(() => {
    if (!room?.roomId) return;

    const roomId = String(room.roomId).trim();

    const username =
      room?.username ||
      room?.name ||
      sessionStorage.getItem("supportnook-username") ||
      localStorage.getItem("supportnook-username") ||
      "Guest";

    const joinRoom = () => {
      socket.emit("join-room", {
        roomId,
        username,
      });
    };

    if (!socket.connected) {
      socket.connect();
      socket.once("connect", joinRoom);
    } else {
      joinRoom();
    }

    return () => {
      socket.off("connect", joinRoom);
    };
  }, [room]);

  if (!room?.roomId) {
    return (
      <div className="workspace-error">
        <div className="error-card">
          <h2>Room not found</h2>
          <p>Please create or join a room again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace">

      {/* LEFT */}
      <section className="workspace-editor">
        <CodeEditor room={room} />
      </section>

      {/* RIGHT */}
      <section className="workspace-right">

        <section className="workspace-chat">
          <Chat room={room} />
        </section>

        <section className="workspace-whiteboard">
          <Whiteboard room={room} />
        </section>

      </section>

    </div>
  );
}

export default Workspace;