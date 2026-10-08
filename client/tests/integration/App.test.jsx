import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import App from "../../src/App";

vi.mock("../../src/pages/home/Home", () => ({
  default: ({ onRoomCreated, onRoomJoined }) => (
    <div>
      <h1>Mock Home</h1>

      <button
        onClick={() =>
          onRoomCreated({
            roomId: "ABC123",
            name: "Test Workspace",
            participants: [],
          })
        }
      >
        Create room
      </button>

      <button
        onClick={() =>
          onRoomJoined({
            roomId: "ABC123",
            name: "Test Workspace",
            participants: [],
          })
        }
      >
        Join room
      </button>
    </div>
  ),
}));

vi.mock("../../src/pages/workspace/Workspace", () => ({
  default: ({ room, onLeave }) => (
    <div>
      <h1>Mock Workspace</h1>
      <span>{room.roomId}</span>

      <button onClick={onLeave}>
        Leave room
      </button>
    </div>
  ),
}));

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();

    window.history.pushState(
      {},
      "",
      "/"
    );
  });

  it("renders Home on the root path", () => {
    render(<App />);

    expect(
      screen.getByText("Mock Home")
    ).toBeInTheDocument();
  });

  it("saves a created room and navigates to workspace", () => {
    render(<App />);

    screen.getByRole("button", {
      name: "Create room",
    }).click();

    expect(
      JSON.parse(
        localStorage.getItem(
          "supportnook-room"
        )
      )
    ).toEqual({
      roomId: "ABC123",
      name: "Test Workspace",
      participants: [],
    });
  });

  it("saves a joined room", () => {
    render(<App />);

    screen.getByRole("button", {
      name: "Join room",
    }).click();

    expect(
      JSON.parse(
        localStorage.getItem(
          "supportnook-room"
        )
      )
    ).toEqual({
      roomId: "ABC123",
      name: "Test Workspace",
      participants: [],
    });
  });

  it("renders Workspace when a valid room is saved", () => {
    localStorage.setItem(
      "supportnook-room",
      JSON.stringify({
        roomId: "ABC123",
        name: "Test Workspace",
        participants: [],
      })
    );

    window.history.pushState(
      {},
      "",
      "/workspace"
    );

    render(<App />);

    expect(
      screen.getByText("Mock Workspace")
    ).toBeInTheDocument();

    expect(
      screen.getByText("ABC123")
    ).toBeInTheDocument();
  });
});