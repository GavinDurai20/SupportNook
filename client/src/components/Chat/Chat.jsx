import { useEffect, useRef, useState } from "react";
import socket from "../../socket";
import "./Chat.css";

function Chat({ room }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  // Keep the username exactly as it was before
  const username = localStorage.getItem("supportnook-username") || "Guest";
  const roomId = room?.roomId;
  // JOIN ROOM
  useEffect(() => {
    if (!roomId) return;
    const joinRoom = () => {
      socket.emit("join-room", {
        roomId,
        username,
      });
    };
    if (socket.connected) {
      joinRoom();
    } else {
      socket.connect();
      socket.once("connect", joinRoom);
    }
    return () => {
      socket.off("connect", joinRoom);
    };
  }, [roomId, username]);
  // RECEIVE MESSAGES
  useEffect(() => {
    const handleNewMessage = (chatMessage) => {
      console.log("📨 MESSAGE RECEIVED:", chatMessage);
      setMessages((previousMessages) => [
        ...previousMessages,
        chatMessage,
      ]);
    };
    socket.on("new-message", handleNewMessage);
    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, []);
  // AUTO SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);
// SEND MESSAGE
const sendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    if (!roomId) {
      console.error("Room ID missing");
      return;
    }
    if (!socket.connected) {
      console.error("Socket not connected");
      return;
    }
    socket.emit("send-message", {
      roomId,
      message: trimmedMessage,
    });
    setMessage("");
  };
  // ENTER KEY
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };
  return (
    <div className="chat">
      {/* HEADER */}
      <div className="chat-header">
        <div>
          <div className="chat-title">
            Chat
          </div>
          <div className="chat-subtitle">
            Talk with your team
          </div>
        </div>
        <div className="chat-status">
          <span className="chat-online-dot"></span>
          Online
        </div>
      </div>
      {/* MESSAGES */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <div>
              No messages yet
            </div>
            <span>
              Start the conversation.
            </span>
          </div>
        )}
        {messages.map((item, index) => {
          const isMine =
            item.username === username;
          return (
            <div
              key={item.id || index}
              className={`chat-message ${
                isMine ? "chat-message-own" : ""
              }`}
            >
              <div className="chat-message-info">
                <span className="chat-message-user">
                  {isMine ? "YOU" : item.username}
                </span>
                {item.time && (
                  <span className="chat-message-time">
                    {new Date(item.time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              <div className="chat-message-bubble">
                {item.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {/* INPUT */}
      <div className="chat-input-container">
        <input
          type="text"
          value={message}
          placeholder="Type a message..."
          onChange={(event) =>
            setMessage(event.target.value)
          }
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={!message.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
export default Chat;